import { getPublicKeyAsync, signAsync, utils } from '@noble/ed25519';

/*
 * WebSocket protocol client for the NEER Gateway.
 *
 * This is a self-contained port of the reference client in
 * `neer/ui/src/ui/gateway.ts` (the Lit control UI). It speaks the
 * Gateway's protocol-v3 JSON frames and performs the connect-first
 * handshake, including Ed25519 device identity and nonce challenges.
 *
 * Device identity and device tokens reuse the old UI's localStorage
 * keys so both UIs share the same credentials.
 */

export type GatewayEventFrame = {
    type: 'event';
    event: string;
    payload?: unknown;
    seq?: number;
    stateVersion?: { presence: number; health: number };
};

export type GatewayResponseFrame = {
    type: 'res';
    id: string;
    ok: boolean;
    payload?: unknown;
    error?: { code: string; message: string; details?: unknown };
};

export type GatewayHelloOk = {
    type: 'hello-ok';
    protocol: number;
    features?: { methods?: string[]; events?: string[] };
    snapshot?: unknown;
    auth?: {
        deviceToken?: string;
        role?: string;
        scopes?: string[];
        issuedAtMs?: number;
    };
    policy?: { tickIntervalMs?: number };
};

type Pending = {
    resolve: (value: unknown) => void;
    reject: (err: unknown) => void;
};

export type GatewayClientOptions = {
    url: string;
    token?: string;
    password?: string;
    clientId?: string;
    clientVersion?: string;
    mode?: string;
    instanceId?: string;
    onHello?: (hello: GatewayHelloOk) => void;
    onEvent?: (evt: GatewayEventFrame) => void;
    onClose?: (info: { code: number; reason: string }) => void;
    onGap?: (info: { expected: number; received: number }) => void;
};

// 4008 = application-defined code (browser rejects 1008 "Policy Violation")
const CONNECT_FAILED_CLOSE_CODE = 4008;

const OPERATOR_ROLE = 'operator';
const OPERATOR_SCOPES = [
    'operator.admin',
    'operator.approvals',
    'operator.pairing',
];

/* uuid (port of neer/ui/src/ui/uuid.ts) */

function uuidFromBytes(bytes: Uint8Array): string {
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    let hex = '';
    for (const byte of bytes) {
        hex += byte.toString(16).padStart(2, '0');
    }

    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function generateUUID(): string {
    const cryptoLike = globalThis.crypto as
        | { randomUUID?: () => string; getRandomValues?: <T extends Exclude<BufferSource, ArrayBuffer>>(array: T) => T }
        | undefined;

    if (cryptoLike && typeof cryptoLike.randomUUID === 'function') {
        return cryptoLike.randomUUID();
    }
    if (cryptoLike && typeof cryptoLike.getRandomValues === 'function') {
        const bytes = new Uint8Array(16);
        cryptoLike.getRandomValues(bytes);
        return uuidFromBytes(bytes);
    }
    const bytes = new Uint8Array(16);
    for (let i = 0; i < bytes.length; i += 1) {
        bytes[i] = Math.floor(Math.random() * 256);
    }
    return uuidFromBytes(bytes);
}

/* device identity (localStorage key shared with the old control UI) */

const IDENTITY_STORAGE_KEY = 'neer-device-identity-v1';

type StoredIdentity = {
    version: 1;
    deviceId: string;
    publicKey: string;
    privateKey: string;
    createdAtMs: number;
};

type DeviceIdentity = {
    deviceId: string;
    publicKey: string;
    privateKey: string;
};

function base64UrlEncode(bytes: Uint8Array): string {
    let binary = '';
    for (const byte of bytes) {
        binary += String.fromCharCode(byte);
    }
    return btoa(binary)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/g, '');
}

function base64UrlDecode(input: string): Uint8Array {
    const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    const binary = atob(padded);
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
        out[i] = binary.charCodeAt(i);
    }
    return out;
}

function bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}

async function fingerprintPublicKey(publicKey: Uint8Array): Promise<string> {
    const hash = await crypto.subtle.digest('SHA-256', publicKey.slice().buffer);
    return bytesToHex(new Uint8Array(hash));
}

async function generateIdentity(): Promise<DeviceIdentity> {
    const privateKey = utils.randomSecretKey();
    const publicKey = await getPublicKeyAsync(privateKey);
    const deviceId = await fingerprintPublicKey(publicKey);
    return {
        deviceId,
        publicKey: base64UrlEncode(publicKey),
        privateKey: base64UrlEncode(privateKey),
    };
}

async function loadOrCreateDeviceIdentity(): Promise<DeviceIdentity> {
    try {
        const raw = localStorage.getItem(IDENTITY_STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw) as StoredIdentity;
            if (
                parsed?.version === 1 &&
                typeof parsed.deviceId === 'string' &&
                typeof parsed.publicKey === 'string' &&
                typeof parsed.privateKey === 'string'
            ) {
                const derivedId = await fingerprintPublicKey(base64UrlDecode(parsed.publicKey));
                if (derivedId !== parsed.deviceId) {
                    const updated: StoredIdentity = { ...parsed, deviceId: derivedId };
                    localStorage.setItem(IDENTITY_STORAGE_KEY, JSON.stringify(updated));
                    return {
                        deviceId: derivedId,
                        publicKey: parsed.publicKey,
                        privateKey: parsed.privateKey,
                    };
                }
                return {
                    deviceId: parsed.deviceId,
                    publicKey: parsed.publicKey,
                    privateKey: parsed.privateKey,
                };
            }
        }
    } catch {
        // fall through to regenerate
    }

    const identity = await generateIdentity();
    const stored: StoredIdentity = {
        version: 1,
        deviceId: identity.deviceId,
        publicKey: identity.publicKey,
        privateKey: identity.privateKey,
        createdAtMs: Date.now(),
    };
    localStorage.setItem(IDENTITY_STORAGE_KEY, JSON.stringify(stored));
    return identity;
}

async function signDevicePayload(
    privateKeyBase64Url: string,
    payload: string,
): Promise<string> {
    const key = base64UrlDecode(privateKeyBase64Url);
    const data = new TextEncoder().encode(payload);
    const sig = await signAsync(data, key);
    return base64UrlEncode(sig);
}

/* device auth tokens (localStorage key shared with the old control UI) */

const DEVICE_AUTH_STORAGE_KEY = 'neer.device.auth.v1';

type DeviceAuthEntry = {
    token: string;
    role: string;
    scopes: string[];
    updatedAtMs: number;
};

type DeviceAuthStore = {
    version: 1;
    deviceId: string;
    tokens: Record<string, DeviceAuthEntry>;
};

function readDeviceAuthStore(): DeviceAuthStore | null {
    try {
        const raw = window.localStorage.getItem(DEVICE_AUTH_STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as DeviceAuthStore;
        if (!parsed || parsed.version !== 1) return null;
        if (!parsed.deviceId || typeof parsed.deviceId !== 'string') return null;
        if (!parsed.tokens || typeof parsed.tokens !== 'object') return null;
        return parsed;
    } catch {
        return null;
    }
}

function writeDeviceAuthStore(store: DeviceAuthStore) {
    try {
        window.localStorage.setItem(DEVICE_AUTH_STORAGE_KEY, JSON.stringify(store));
    } catch {
        // best-effort
    }
}

function loadDeviceAuthToken(params: {
    deviceId: string;
    role: string;
}): DeviceAuthEntry | null {
    const store = readDeviceAuthStore();
    if (!store || store.deviceId !== params.deviceId) return null;
    const entry = store.tokens[params.role.trim()];
    if (!entry || typeof entry.token !== 'string') return null;
    return entry;
}

function storeDeviceAuthToken(params: {
    deviceId: string;
    role: string;
    token: string;
    scopes?: string[];
}): void {
    const role = params.role.trim();
    const next: DeviceAuthStore = {
        version: 1,
        deviceId: params.deviceId,
        tokens: {},
    };
    const existing = readDeviceAuthStore();
    if (existing && existing.deviceId === params.deviceId) {
        next.tokens = { ...existing.tokens };
    }
    next.tokens[role] = {
        token: params.token,
        role,
        scopes: Array.isArray(params.scopes)
            ? [...new Set(params.scopes.map((s) => s.trim()).filter(Boolean))].sort()
            : [],
        updatedAtMs: Date.now(),
    };
    writeDeviceAuthStore(next);
}

function clearDeviceAuthToken(params: { deviceId: string; role: string }) {
    const store = readDeviceAuthStore();
    if (!store || store.deviceId !== params.deviceId) return;
    const role = params.role.trim();
    if (!store.tokens[role]) return;
    const next = { ...store, tokens: { ...store.tokens } };
    delete next.tokens[role];
    writeDeviceAuthStore(next);
}

/* signed device payload (port of neer/src/gateway/device-auth.ts buildDeviceAuthPayload) */

function buildDeviceAuthPayload(params: {
    deviceId: string;
    clientId: string;
    clientMode: string;
    role: string;
    scopes: string[];
    signedAtMs: number;
    token?: string | null;
    nonce?: string | null;
}): string {
    const version = params.nonce ? 'v2' : 'v1';
    const scopes = params.scopes.join(',');
    const token = params.token ?? '';
    const base = [
        version,
        params.deviceId,
        params.clientId,
        params.clientMode,
        params.role,
        scopes,
        String(params.signedAtMs),
        token,
    ];
    if (version === 'v2') {
        base.push(params.nonce ?? '');
    }
    return base.join('|');
}

/* WebSocket client */

export class GatewayClient {
    private ws: WebSocket | null = null;
    private pending = new Map<string, Pending>();
    private closed = false;
    private lastSeq: number | null = null;
    private connectNonce: string | null = null;
    private connectSent = false;
    private connectTimer: number | null = null;
    private backoffMs = 800;
    private lastCloseReason = '';
    private connectFailureMessage: string | null = null;

    constructor(private opts: GatewayClientOptions) {}

    start() {
        this.closed = false;
        this.lastCloseReason = '';
        this.connect();
    }

    stop() {
        this.closed = true;
        this.ws?.close();
        this.ws = null;
        this.flushPending(new Error('gateway client stopped'));
    }

    get connected() {
        return this.ws?.readyState === WebSocket.OPEN;
    }

    get lastError() {
        return this.lastCloseReason;
    }

    get lastConnectError() {
        return this.connectFailureMessage;
    }

    private connect() {
        if (this.closed) return;
        this.ws = new WebSocket(this.opts.url);
        this.ws.addEventListener('open', () => this.queueConnect());
        this.ws.addEventListener('message', (ev) => this.handleMessage(String(ev.data ?? '')));
        this.ws.addEventListener('close', (ev) => {
            const reason = String(ev.reason ?? '');
            this.ws = null;
            this.lastCloseReason = reason
                ? `disconnected (${ev.code}): ${reason}`
                : `disconnected (${ev.code})`;
            this.flushPending(new Error(this.lastCloseReason));
            this.opts.onClose?.({ code: ev.code, reason });
            this.scheduleReconnect();
        });
        this.ws.addEventListener('error', () => {
            // ignored; the close handler always fires afterwards
        });
    }

    private scheduleReconnect() {
        if (this.closed) return;
        const delay = this.backoffMs;
        this.backoffMs = Math.min(this.backoffMs * 1.7, 15_000);
        window.setTimeout(() => this.connect(), delay);
    }

    private flushPending(err: Error) {
        for (const [, p] of this.pending) {
            p.reject(err);
        }
        this.pending.clear();
    }

    private async sendConnect() {
        if (this.connectSent) return;
        this.connectSent = true;
        if (this.connectTimer !== null) {
            window.clearTimeout(this.connectTimer);
            this.connectTimer = null;
        }

        // crypto.subtle only exists in secure contexts (HTTPS or localhost).
        // Over plain HTTP we skip device identity and rely on token/password
        // auth alone, which the gateway may reject.
        const isSecureContext = typeof crypto !== 'undefined' && !!crypto.subtle;

        const role = OPERATOR_ROLE;
        const scopes = OPERATOR_SCOPES;
        const clientId = this.opts.clientId ?? 'neer-control-ui';
        const clientMode = this.opts.mode ?? 'webchat';

        let deviceIdentity: DeviceIdentity | null = null;
        let canFallbackToShared = false;
        let authToken = this.opts.token;

        if (isSecureContext) {
            deviceIdentity = await loadOrCreateDeviceIdentity();
            const storedToken = loadDeviceAuthToken({
                deviceId: deviceIdentity.deviceId,
                role,
            })?.token;
            authToken = storedToken ?? this.opts.token;
            canFallbackToShared = Boolean(storedToken && this.opts.token);
        }

        const auth =
            authToken || this.opts.password
                ? { token: authToken, password: this.opts.password }
                : undefined;

        let device:
            | {
                  id: string;
                  publicKey: string;
                  signature: string;
                  signedAt: number;
                  nonce: string | undefined;
              }
            | undefined;

        if (isSecureContext && deviceIdentity) {
            const signedAtMs = Date.now();
            const nonce = this.connectNonce ?? undefined;
            const payload = buildDeviceAuthPayload({
                deviceId: deviceIdentity.deviceId,
                clientId,
                clientMode,
                role,
                scopes,
                signedAtMs,
                token: authToken ?? null,
                nonce,
            });
            const signature = await signDevicePayload(
                deviceIdentity.privateKey,
                payload,
            );
            device = {
                id: deviceIdentity.deviceId,
                publicKey: deviceIdentity.publicKey,
                signature,
                signedAt: signedAtMs,
                nonce,
            };
        }

        const params = {
            minProtocol: 3,
            maxProtocol: 3,
            client: {
                id: clientId,
                version: this.opts.clientVersion ?? 'dev',
                platform: navigator.platform ?? 'web',
                mode: clientMode,
                instanceId: this.opts.instanceId,
            },
            role,
            scopes,
            device,
            caps: [],
            auth,
            userAgent: navigator.userAgent,
            locale: navigator.language,
        };

        this.request<GatewayHelloOk>('connect', params)
            .then((hello) => {
                if (hello?.auth?.deviceToken && deviceIdentity) {
                    storeDeviceAuthToken({
                        deviceId: deviceIdentity.deviceId,
                        role: hello.auth.role ?? role,
                        token: hello.auth.deviceToken,
                        scopes: hello.auth.scopes ?? [],
                    });
                }
                this.backoffMs = 800;
                this.connectFailureMessage = null;
                this.opts.onHello?.(hello);
            })
            .catch((err: unknown) => {
                this.connectFailureMessage =
                    err instanceof Error ? err.message : 'connect failed';
                if (canFallbackToShared && deviceIdentity) {
                    clearDeviceAuthToken({ deviceId: deviceIdentity.deviceId, role });
                }
                this.ws?.close(CONNECT_FAILED_CLOSE_CODE, 'connect failed');
            });
    }

    private handleMessage(raw: string) {
        let parsed: unknown;
        try {
            parsed = JSON.parse(raw);
        } catch {
            return;
        }

        const frame = parsed as { type?: unknown };
        if (frame.type === 'event') {
            const evt = parsed as GatewayEventFrame;
            if (evt.event === 'connect.challenge') {
                const payload = evt.payload as { nonce?: unknown } | undefined;
                const nonce =
                    payload && typeof payload.nonce === 'string' ? payload.nonce : null;
                if (nonce) {
                    this.connectNonce = nonce;
                    void this.sendConnect();
                }
                return;
            }
            const seq = typeof evt.seq === 'number' ? evt.seq : null;
            if (seq !== null) {
                if (this.lastSeq !== null && seq > this.lastSeq + 1) {
                    this.opts.onGap?.({ expected: this.lastSeq + 1, received: seq });
                }
                this.lastSeq = seq;
            }
            try {
                this.opts.onEvent?.(evt);
            } catch (err) {
                console.error('[gateway] event handler error:', err);
            }
            return;
        }

        if (frame.type === 'res') {
            const res = parsed as GatewayResponseFrame;
            const pending = this.pending.get(res.id);
            if (!pending) return;
            this.pending.delete(res.id);
            if (res.ok) {
                pending.resolve(res.payload);
            } else {
                pending.reject(new Error(res.error?.message ?? 'request failed'));
            }
        }
    }

    request<T = unknown>(method: string, params?: unknown): Promise<T> {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            return Promise.reject(new Error('gateway not connected'));
        }
        const id = generateUUID();
        const frame = { type: 'req', id, method, params };
        const p = new Promise<T>((resolve, reject) => {
            this.pending.set(id, {
                resolve: (v) => resolve(v as T),
                reject,
            });
        });
        this.ws.send(JSON.stringify(frame));
        return p;
    }

    private queueConnect() {
        this.connectNonce = null;
        this.connectSent = false;
        if (this.connectTimer !== null) {
            window.clearTimeout(this.connectTimer);
        }
        this.connectTimer = window.setTimeout(() => {
            void this.sendConnect();
        }, 750);
    }
}
