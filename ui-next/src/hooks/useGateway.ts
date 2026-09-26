import { useState, useEffect, useCallback, useRef } from 'react';

import { GatewayClient } from '../lib/gateway/client';

export type GatewayStatus = 'ONLINE' | 'OFFLINE' | 'CONNECTING';
export type ThreatLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface GatewayHealth {
    ok: boolean;
    channels: Record<string, any>;
    channelOrder: string[];
    agents: any[];
    heartbeatSeconds: number;
}

export interface GatewayStatusData {
    sessions?: {
        defaults?: { model?: string; contextTokens?: number };
        count?: number;
        recent?: any[];
    };
    heartbeat?: { defaultAgentId?: string };
}

// usage.status payload (src/infra/provider-usage.types.ts)
export interface UsageWindow {
    label: string;
    usedPercent: number;
    resetAt?: number;
}

export interface ProviderUsageSnapshot {
    provider: string;
    displayName: string;
    windows: UsageWindow[];
    plan?: string;
    error?: string;
}

export interface UsageSummary {
    updatedAt: number;
    providers: ProviderUsageSnapshot[];
}

// usage.cost payload (src/infra/session-cost-usage.ts)
export interface CostUsageTotals {
    input: number;
    output: number;
    cacheRead: number;
    cacheWrite: number;
    totalTokens: number;
    totalCost: number;
    inputCost: number;
    outputCost: number;
    cacheReadCost: number;
    cacheWriteCost: number;
    missingCostEntries: number;
}

export interface CostUsageDailyEntry extends CostUsageTotals {
    date: string;
}

export interface CostUsageSummary {
    updatedAt: number;
    days: number;
    daily: CostUsageDailyEntry[];
    totals: CostUsageTotals;
}

// exec.approvals.get payload (src/infra/exec-approvals.ts)
export type ExecSecurity = 'deny' | 'allowlist' | 'full';
export type ExecAsk = 'off' | 'on-miss' | 'always';

export interface ExecAllowlistEntry {
    id?: string;
    pattern: string;
    lastUsedAt?: number;
    lastUsedCommand?: string;
    lastResolvedPath?: string;
}

export interface ExecApprovalsDefaults {
    security?: ExecSecurity;
    ask?: ExecAsk;
    askFallback?: ExecSecurity;
    autoAllowSkills?: boolean;
}

export interface ExecApprovalsAgent extends ExecApprovalsDefaults {
    allowlist?: ExecAllowlistEntry[];
}

export interface ExecApprovalsFile {
    version: 1;
    socket?: { path?: string };
    defaults?: ExecApprovalsDefaults;
    agents?: Record<string, ExecApprovalsAgent>;
}

export interface ExecApprovalsSnapshot {
    path: string;
    exists: boolean;
    hash: string;
    file: ExecApprovalsFile;
}

// models.list payload (src/agents/model-catalog.ts)
export interface ModelCatalogEntry {
    id: string;
    name: string;
    provider: string;
    contextWindow?: number;
    reasoning?: boolean;
    input?: Array<'text' | 'image'>;
}

// agents.list payload (src/gateway/session-utils.ts listAgentsForGateway)
export interface GatewayAgentIdentity {
    name?: string;
    theme?: string;
    emoji?: string;
    avatar?: string;
    avatarUrl?: string;
}

export interface GatewayAgentRow {
    id: string;
    name?: string;
    identity?: GatewayAgentIdentity;
}

export interface AgentsListResult {
    defaultId: string;
    mainKey: string;
    scope: string;
    agents: GatewayAgentRow[];
}

// channels.status payload (src/gateway/server-methods/channels.ts)
export interface ChannelAccountSnapshot {
    accountId: string;
    name?: string;
    enabled?: boolean;
    configured?: boolean;
    linked?: boolean;
    running?: boolean;
    connected?: boolean;
    reconnectAttempts?: number;
    lastConnectedAt?: number | null;
    lastDisconnect?: unknown;
    lastError?: string | null;
    lastInboundAt?: number | null;
    lastOutboundAt?: number | null;
    lastProbeAt?: number | null;
    mode?: string;
    dmPolicy?: string;
}

export interface ChannelUiMeta {
    id: string;
    label: string;
    detailLabel: string;
    systemImage?: string;
}

export interface ChannelsStatusResult {
    ts: number;
    channelOrder: string[];
    channelLabels: Record<string, string>;
    channelDetailLabels?: Record<string, string>;
    channelMeta?: ChannelUiMeta[];
    channels: Record<string, unknown>;
    channelAccounts: Record<string, ChannelAccountSnapshot[]>;
    channelDefaultAccountId: Record<string, string>;
}

// device.pair.list payload (src/gateway/server-methods/devices.ts)
export interface DeviceTokenSummary {
    role: string;
    scopes: string[];
    createdAtMs: number;
    rotatedAtMs?: number;
    revokedAtMs?: number;
    lastUsedAtMs?: number;
}

export interface PairedDevice {
    deviceId: string;
    displayName?: string;
    platform?: string;
    clientId?: string;
    clientMode?: string;
    role?: string;
    roles?: string[];
    scopes?: string[];
    remoteIp?: string;
    tokens?: DeviceTokenSummary[];
    createdAtMs: number;
    approvedAtMs: number;
}

export interface PendingDeviceRequest {
    requestId: string;
    deviceId: string;
    publicKey: string;
    displayName?: string;
    platform?: string;
    role?: string;
    roles?: string[];
    remoteIp?: string;
    ts: number;
    isRepair?: boolean;
}

export interface DevicePairingResult {
    pending: PendingDeviceRequest[];
    paired: PairedDevice[];
}

export interface GatewayDataState<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
}

export interface GatewayState {
    status: GatewayStatus;
    health: GatewayHealth | null;
    statusData: GatewayStatusData | null;
    model: string;
    threatLevel: ThreatLevel;
    lastUpdated: Date | null;
    error: string | null;
    usage: GatewayDataState<UsageSummary>;
    usageCost: GatewayDataState<CostUsageSummary>;
    execApprovals: GatewayDataState<ExecApprovalsSnapshot>;
    modelCatalog: GatewayDataState<ModelCatalogEntry[]>;
    agentsList: GatewayDataState<AgentsListResult>;
    channelsStatus: GatewayDataState<ChannelsStatusResult>;
    devicePairing: GatewayDataState<DevicePairingResult>;
}

const DEFAULT_GATEWAY_PORT = 19001;
const POLL_INTERVAL_MS = 8000;
const COST_WINDOW_DAYS = 30;
const OLD_UI_SETTINGS_KEY = 'neer.control.settings.v1';

type DataSlice<T> = { data: T | null; error: string | null };

async function requestSlice<T>(
    client: GatewayClient,
    method: string,
    params?: unknown,
): Promise<DataSlice<T>> {
    try {
        const data = await client.request<T>(method, params);
        return { data, error: null };
    } catch (err) {
        return { data: null, error: err instanceof Error ? err.message : String(err) };
    }
}

/*
 * The Gateway speaks WebSocket protocol v3, not HTTP. The URL may be
 * overridden with `?gatewayUrl=` (search or hash params); otherwise we
 * target the local dev gateway. Auth is resolved from `?token=` /
 * `?password=` params, falling back to the token saved by the classic
 * control UI (`neer.control.settings.v1`). Device identity and device
 * tokens are shared with the classic UI via the client.
 */
function resolveGatewayUrl(): string {
    let raw = '';
    try {
        const params = new URLSearchParams(window.location.search);
        const hash = window.location.hash;
        const hashParams = new URLSearchParams(
            hash.startsWith('#') ? hash.slice(1) : hash,
        );
        raw =
            (params.get('gatewayUrl') ?? hashParams.get('gatewayUrl') ?? '').trim();
    } catch {
        raw = '';
    }
    if (!raw) {
        const port =
            (window as any).__NEER_GATEWAY_PORT__ || DEFAULT_GATEWAY_PORT;
        raw = `127.0.0.1:${port}`;
    }
    if (raw.startsWith('ws://') || raw.startsWith('wss://')) return raw;
    if (raw.startsWith('https://')) return `wss://${raw.slice('https://'.length)}`;
    if (raw.startsWith('http://')) return `ws://${raw.slice('http://'.length)}`;
    return `ws://${raw}`;
}

function resolveGatewayAuth(): { token?: string; password?: string } {
    let token: string | undefined;
    let password: string | undefined;
    try {
        const params = new URLSearchParams(window.location.search);
        const hash = window.location.hash;
        const hashParams = new URLSearchParams(
            hash.startsWith('#') ? hash.slice(1) : hash,
        );
        const tokenRaw = params.get('token') ?? hashParams.get('token');
        const passwordRaw = params.get('password') ?? hashParams.get('password');
        if (tokenRaw?.trim()) token = tokenRaw.trim();
        if (passwordRaw?.trim()) password = passwordRaw.trim();
    } catch {
        // ignore malformed params
    }
    if (!token) {
        try {
            const raw = window.localStorage.getItem(OLD_UI_SETTINGS_KEY);
            if (raw) {
                const parsed = JSON.parse(raw) as { token?: unknown };
                if (
                    typeof parsed.token === 'string' &&
                    parsed.token.trim()
                ) {
                    token = parsed.token.trim();
                }
            }
        } catch {
            // ignore unreadable settings
        }
    }
    return { token, password };
}

export function useGateway() {
    const [state, setState] = useState<GatewayState>({
        status: 'CONNECTING',
        health: null,
        statusData: null,
        model: 'Unknown',
        threatLevel: 'LOW',
        lastUpdated: null,
        error: null,
        usage: { data: null, loading: true, error: null },
        usageCost: { data: null, loading: true, error: null },
        execApprovals: { data: null, loading: true, error: null },
        modelCatalog: { data: null, loading: true, error: null },
        agentsList: { data: null, loading: true, error: null },
        channelsStatus: { data: null, loading: true, error: null },
        devicePairing: { data: null, loading: true, error: null },
    });

    const clientRef = useRef<GatewayClient | null>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const stopPolling = useCallback(() => {
        if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
        }
    }, []);

    const pollOnce = useCallback(async (client: GatewayClient) => {
        try {
            const [
                health,
                statusData,
                usage,
                usageCost,
                execApprovals,
                modelCatalog,
                agentsList,
                channelsStatus,
                devicePairing,
            ] = await Promise.all([
                client.request<GatewayHealth>('health'),
                client.request<GatewayStatusData>('status'),
                requestSlice<UsageSummary>(client, 'usage.status'),
                requestSlice<CostUsageSummary>(client, 'usage.cost', {
                    days: COST_WINDOW_DAYS,
                }),
                requestSlice<ExecApprovalsSnapshot>(client, 'exec.approvals.get'),
                requestSlice<{ models: ModelCatalogEntry[] }>(
                    client,
                    'models.list',
                ),
                requestSlice<AgentsListResult>(client, 'agents.list'),
                requestSlice<ChannelsStatusResult>(client, 'channels.status'),
                requestSlice<DevicePairingResult>(client, 'device.pair.list'),
            ]);
            const model = statusData?.sessions?.defaults?.model ?? 'Unknown';
            setState((prev) => ({
                ...prev,
                status: 'ONLINE',
                health,
                statusData,
                model,
                lastUpdated: new Date(),
                error: null,
                usage: {
                    data: usage.data ?? prev.usage.data,
                    loading: false,
                    error: usage.error,
                },
                usageCost: {
                    data: usageCost.data ?? prev.usageCost.data,
                    loading: false,
                    error: usageCost.error,
                },
                execApprovals: {
                    data: execApprovals.data ?? prev.execApprovals.data,
                    loading: false,
                    error: execApprovals.error,
                },
                modelCatalog: {
                    data: modelCatalog.data?.models ?? prev.modelCatalog.data,
                    loading: false,
                    error: modelCatalog.error,
                },
                agentsList: {
                    data: agentsList.data ?? prev.agentsList.data,
                    loading: false,
                    error: agentsList.error,
                },
                channelsStatus: {
                    data: channelsStatus.data ?? prev.channelsStatus.data,
                    loading: false,
                    error: channelsStatus.error,
                },
                devicePairing: {
                    data: devicePairing.data ?? prev.devicePairing.data,
                    loading: false,
                    error: devicePairing.error,
                },
            }));
        } catch {
            // A single failed poll keeps the previous data; connection
            // state is driven by the socket lifecycle callbacks.
        }
    }, []);

    const connect = useCallback(() => {
        clientRef.current?.stop();
        const client = new GatewayClient({
            url: resolveGatewayUrl(),
            ...resolveGatewayAuth(),
            onHello: () => {
                if (clientRef.current !== client) return;
                setState((prev) => ({ ...prev, status: 'ONLINE', error: null }));
                void pollOnce(client);
                stopPolling();
                pollRef.current = setInterval(
                    () => void pollOnce(client),
                    POLL_INTERVAL_MS,
                );
            },
            onClose: ({ code, reason }) => {
                if (clientRef.current !== client) return;
                stopPolling();
                setState((prev) => ({
                    ...prev,
                    status: 'OFFLINE',
                    lastUpdated: new Date(),
                    // 1012 = service restart (expected during config saves)
                    error:
                        code !== 1012
                            ? (client.lastConnectError ??
                              reason ??
                              'gateway connection closed')
                            : prev.error,
                }));
            },
        });
        clientRef.current = client;
        client.start();
    }, [pollOnce, stopPolling]);

    useEffect(() => {
        setState((prev) => ({ ...prev, status: 'CONNECTING', error: null }));
        connect();
        return () => {
            stopPolling();
            clientRef.current?.stop();
            clientRef.current = null;
        };
    }, [connect, stopPolling]);

    const reconnect = useCallback(() => {
        setState((prev) => ({ ...prev, status: 'CONNECTING', error: null }));
        connect();
    }, [connect]);

    return { ...state, reconnect };
}
