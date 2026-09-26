import { AddressInfo } from "node:net";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { createSaasApi } from "./api.js";
import { encryptProviderCredential, hashOpaqueToken, hashPassword, verifyPassword } from "./crypto.js";
import type {
  AgentSession,
  AuditEvent,
  EncryptedCredential,
  ModelPreference,
  ProviderId,
  ProviderStatus,
  PublicProviderConnection,
  SaasRepository,
  SaaSSession,
  SaaSUser,
  StoredProviderCredential,
} from "./types.js";

const KEY_V1 = Buffer.alloc(32, 7);
const KEY_V2 = Buffer.alloc(32, 9);
const KEYRING = { keys: new Map([[1, KEY_V1], [2, KEY_V2]]), activeVersion: 2 };
const CONFIG = {
  publicOrigin: "https://app.neer.test",
  secureCookies: true,
  sessionTtlSeconds: 3600,
  credentialEncryptionKeys: KEYRING.keys,
  activeCredentialKeyVersion: KEYRING.activeVersion,
  trustProxy: false as const,
};
const USER_A = "11111111-1111-4111-8111-111111111111";
const USER_B = "22222222-2222-4222-8222-222222222222";
const PROVIDER_B = "33333333-3333-4333-8333-333333333333";
const SESSION_B = "44444444-4444-4444-8444-444444444444";
const TOKEN_A = "a".repeat(43);
const TOKEN_B = "b".repeat(43);
const now = new Date("2026-01-01T00:00:00.000Z");

type StoredUser = SaaSUser & { passwordHash: string };
type StoredLoginSession = SaaSSession & { tokenHash: Buffer; revokedAt: Date | null };
type StoredProvider = PublicProviderConnection & {
  userId: string;
  credential: EncryptedCredential;
};
type StoredAgentSession = AgentSession & { userId: string; deleted: boolean };

class FakeSaasRepository implements SaasRepository {
  users = new Map<string, StoredUser>();
  loginSessions: StoredLoginSession[] = [];
  providers = new Map<string, StoredProvider>();
  preferences = new Map<string, ModelPreference>();
  agentSessions = new Map<string, StoredAgentSession>();
  resetTokens = new Map<string, { userId: string; expiresAt: Date; consumed: boolean }>();
  rateHits = new Map<string, number>();
  audits: AuditEvent[] = [];

  async createUser(input: { id: string; email: string; passwordHash: string }) {
    if ([...this.users.values()].some((user) => user.email === input.email)) {
      return false;
    }
    this.users.set(input.id, {
      id: input.id,
      email: input.email,
      passwordHash: input.passwordHash,
      status: "active",
      createdAt: now,
    });
    return true;
  }

  async findUserByEmail(email: string) {
    const user = [...this.users.values()].find((entry) => entry.email === email);
    return user ? { ...user } : null;
  }

  async createLoginSession(input: {
    id: string;
    userId: string;
    tokenHash: Buffer;
    expiresAt: Date;
    userAgent: string | null;
  }) {
    void input.userAgent;
    const user = this.users.get(input.userId)!;
    this.loginSessions.push({
      id: input.id,
      userId: user.id,
      email: user.email,
      tokenHash: input.tokenHash,
      expiresAt: input.expiresAt,
      revokedAt: null,
    });
  }

  async findLoginSession(tokenHash: Buffer, at: Date) {
    const session = this.loginSessions.find(
      (entry) => entry.tokenHash.equals(tokenHash) && !entry.revokedAt && entry.expiresAt > at,
    );
    const user = session && this.users.get(session.userId);
    return session && user?.status === "active"
      ? { id: session.id, userId: user.id, email: user.email, expiresAt: session.expiresAt }
      : null;
  }

  async revokeLoginSession(sessionId: string, userId: string, at: Date) {
    const session = this.loginSessions.find((entry) => entry.id === sessionId && entry.userId === userId);
    if (session) {
      session.revokedAt = at;
    }
  }

  async revokeAllLoginSessions(userId: string, at: Date) {
    for (const session of this.loginSessions) {
      if (session.userId === userId && !session.revokedAt) {
        session.revokedAt = at;
      }
    }
  }

  async addAuditEvent(event: AuditEvent) {
    this.audits.push(structuredClone(event));
  }

  async consumeRateLimit(input: { bucketKeyHash: string; windowStartedAt: Date }) {
    const key = `${input.bucketKeyHash}:${input.windowStartedAt.toISOString()}`;
    const count = (this.rateHits.get(key) ?? 0) + 1;
    this.rateHits.set(key, count);
    return count;
  }

  async createProviderConnection(input: {
    id: string;
    userId: string;
    provider: ProviderId;
    encrypted: EncryptedCredential;
  }) {
    if ([...this.providers.values()].some((entry) => entry.userId === input.userId && entry.provider === input.provider)) {
      return null;
    }
    const entry: StoredProvider = {
      id: input.id,
      userId: input.userId,
      provider: input.provider,
      displayName: input.provider,
      status: "pending",
      createdAt: now,
      updatedAt: now,
      lastValidatedAt: null,
      credential: input.encrypted,
    };
    this.providers.set(input.id, entry);
    return this.publicProvider(entry);
  }

  async listProviderConnections(userId: string) {
    return [...this.providers.values()]
      .filter((entry) => entry.userId === userId)
      .map((entry) => this.publicProvider(entry));
  }

  async getProviderConnection(userId: string, id: string) {
    const entry = this.providers.get(id);
    return entry?.userId === userId ? this.publicProvider(entry) : null;
  }

  async getProviderCredential(userId: string, id: string): Promise<StoredProviderCredential | null> {
    const entry = this.providers.get(id);
    return entry?.userId === userId
      ? {
          id: entry.id,
          userId: entry.userId,
          provider: entry.provider,
          status: entry.status,
          ciphertext: entry.credential.ciphertext,
          nonce: entry.credential.nonce,
          authTag: entry.credential.authTag,
          keyVersion: entry.credential.keyVersion,
        }
      : null;
  }

  async getExecutionCredential(userId: string) {
    const preference = this.preferences.get(userId);
    const entry = preference && this.providers.get(preference.providerConnectionId);
    return entry?.userId === userId && entry.status === "connected"
      ? {
          id: entry.id,
          userId: entry.userId,
          provider: entry.provider,
          status: entry.status,
          modelId: preference.modelId,
          ciphertext: entry.credential.ciphertext,
          nonce: entry.credential.nonce,
          authTag: entry.credential.authTag,
          keyVersion: entry.credential.keyVersion,
        }
      : null;
  }

  async updateProviderStatus(userId: string, id: string, status: ProviderStatus, validatedAt: Date | null) {
    const entry = this.providers.get(id);
    if (entry?.userId !== userId) {
      return false;
    }
    entry.status = status;
    entry.lastValidatedAt = validatedAt;
    entry.updatedAt = now;
    return true;
  }

  async deleteProviderConnection(userId: string, id: string) {
    const entry = this.providers.get(id);
    if (entry?.userId !== userId) {
      return false;
    }
    this.providers.delete(id);
    this.preferences.delete(userId);
    return true;
  }

  async getModelPreference(userId: string) {
    const preference = this.preferences.get(userId);
    const provider = preference && this.providers.get(preference.providerConnectionId);
    return provider?.userId === userId && preference ? { ...preference, provider: provider.provider } : null;
  }

  async setModelPreference(input: { userId: string; providerConnectionId: string; modelId: string }) {
    const provider = this.providers.get(input.providerConnectionId);
    if (provider?.userId !== input.userId || provider.status !== "connected") {
      return null;
    }
    const preference: ModelPreference = {
      providerConnectionId: provider.id,
      provider: provider.provider,
      modelId: input.modelId,
      updatedAt: now,
    };
    this.preferences.set(input.userId, preference);
    return preference;
  }

  async createAgentSession(input: { id: string; userId: string; title: string }) {
    const session: StoredAgentSession = { ...input, createdAt: now, updatedAt: now, deleted: false };
    this.agentSessions.set(session.id, session);
    return this.publicSession(session);
  }

  async listAgentSessions(userId: string) {
    return [...this.agentSessions.values()]
      .filter((session) => session.userId === userId && !session.deleted)
      .map((session) => this.publicSession(session));
  }

  async getAgentSession(userId: string, id: string) {
    const session = this.agentSessions.get(id);
    return session?.userId === userId && !session.deleted ? this.publicSession(session) : null;
  }

  async deleteAgentSession(userId: string, id: string) {
    const session = this.agentSessions.get(id);
    if (session?.userId !== userId || session.deleted) {
      return false;
    }
    session.deleted = true;
    return true;
  }

  async createPasswordReset(input: { userId: string; tokenHash: Buffer; expiresAt: Date }) {
    this.resetTokens.set(input.tokenHash.toString("hex"), {
      userId: input.userId,
      expiresAt: input.expiresAt,
      consumed: false,
    });
  }

  async consumePasswordReset(input: { tokenHash: Buffer; passwordHash: string; now: Date }): Promise<string | null> {
    const reset = this.resetTokens.get(input.tokenHash.toString("hex"));
    if (!reset || reset.consumed || reset.expiresAt <= input.now) {
      return null;
    }
    const user = this.users.get(reset.userId);
    if (!user) {
      return null;
    }
    reset.consumed = true;
    user.passwordHash = input.passwordHash;
    await this.revokeAllLoginSessions(user.id, input.now);
    return user.id;
  }

  seedProvider(input: {
    id: string;
    userId: string;
    provider: ProviderId;
    key: string;
    status?: ProviderStatus;
  }) {
    const encrypted = encryptProviderCredential(
      input.key,
      { userId: input.userId, connectionId: input.id, provider: input.provider },
      KEYRING,
    );
    this.providers.set(input.id, {
      id: input.id,
      userId: input.userId,
      provider: input.provider,
      displayName: input.provider,
      status: input.status ?? "connected",
      createdAt: now,
      updatedAt: now,
      lastValidatedAt: now,
      credential: encrypted,
    });
  }

  seedPreference(userId: string, providerConnectionId: string, modelId: string) {
    const provider = this.providers.get(providerConnectionId)!;
    this.preferences.set(userId, {
      providerConnectionId,
      provider: provider.provider,
      modelId,
      updatedAt: now,
    });
  }

  seedSession(id: string, userId: string, token: string, expiresAt = new Date(now.getTime() + 60_000)) {
    const user = this.users.get(userId)!;
    this.loginSessions.push({
      id,
      userId,
      email: user.email,
      expiresAt,
      revokedAt: null,
      tokenHash: hashOpaqueToken(token),
    });
  }

  private publicProvider(entry: StoredProvider): PublicProviderConnection {
    return {
      id: entry.id,
      provider: entry.provider,
      displayName: entry.displayName,
      status: entry.status,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      lastValidatedAt: entry.lastValidatedAt,
    };
  }

  private publicSession(entry: StoredAgentSession): AgentSession {
    return {
      id: entry.id,
      title: entry.title,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    };
  }
}

async function withServer<T>(app: ReturnType<typeof createSaasApi>, fn: (origin: string) => Promise<T>) {
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.once("listening", resolve);
  });
  const address = server.address() as AddressInfo;
  const origin = `http://127.0.0.1:${address.port}`;
  try {
    return await fn(origin);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
}

function authenticatedRequest(token: string, method = "GET", body?: unknown) {
  return {
    method,
    headers: {
      cookie: `neer_saas_session=${token}`,
      origin: CONFIG.publicOrigin,
      ...(body === undefined ? {} : { "content-type": "application/json" }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  };
}

function addUser(repo: FakeSaasRepository, id: string, email: string) {
  repo.users.set(id, { id, email, passwordHash: "unused", status: "active", createdAt: now });
}

describe("SaaS API tenant and secret boundaries", () => {
  beforeAll(() => {
    vi.setConfig({ testTimeout: 30_000 });
  });

  it("registers accounts with a password hash and an opaque session cookie", async () => {
    const repository = new FakeSaasRepository();
    const app = createSaasApi({ config: CONFIG, repository, now: () => now });
    await withServer(app, async (origin) => {
      const response = await fetch(`${origin}/api/auth/register`, {
        method: "POST",
        headers: { origin: CONFIG.publicOrigin, "content-type": "application/json" },
        body: JSON.stringify({ email: "  Person@Example.com ", password: "a-long-password-123" }),
      });
      const responseText = await response.text();
      expect(response.status).toBe(201);
      expect(responseText).not.toContain("a-long-password-123");
      expect(responseText).not.toContain("passwordHash");
      const user = [...repository.users.values()][0];
      expect(user.email).toBe("person@example.com");
      expect(user.passwordHash).not.toBe("a-long-password-123");
      expect(user.passwordHash.startsWith("scrypt$32768$8$1$")).toBe(true);
      const cookie = response.headers.get("set-cookie") ?? "";
      expect(cookie).toContain("HttpOnly");
      expect(cookie).toContain("Secure");
      expect(cookie).toContain("SameSite=Lax");
      const rawToken = cookie.match(/neer_saas_session=([^;]+)/)?.[1];
      expect(rawToken).toBeTruthy();
      expect(repository.loginSessions[0]?.tokenHash.equals(hashOpaqueToken(rawToken!))).toBe(true);
      expect(repository.loginSessions[0]?.tokenHash.toString("utf8")).not.toContain(rawToken!);
    });
  });

  it("sends hashed, one-time reset tokens and revokes active account sessions", async () => {
    const repository = new FakeSaasRepository();
    addUser(repository, USER_A, "a@example.com");
    repository.users.get(USER_A)!.passwordHash = await hashPassword("old long password 123");
    repository.seedSession("55555555-5555-4555-8555-555555555555", USER_A, TOKEN_A);
    let deliveredToken = "";
    const app = createSaasApi({
      config: CONFIG,
      repository,
      passwordResetMailer: async ({ token }) => {
        deliveredToken = token;
      },
      now: () => now,
    });
    await withServer(app, async (origin) => {
      const requestReset = await fetch(`${origin}/api/auth/password-reset`, {
        method: "POST",
        headers: { origin: CONFIG.publicOrigin, "content-type": "application/json" },
        body: JSON.stringify({ email: "a@example.com" }),
      });
      const genericResponse = await requestReset.text();
      expect(requestReset.status).toBe(202);
      expect(genericResponse).not.toContain("a@example.com");
      expect(genericResponse).not.toContain(deliveredToken);
      expect(deliveredToken).toMatch(/^[A-Za-z0-9_-]{40,64}$/);
      expect(repository.resetTokens.has(hashOpaqueToken(deliveredToken).toString("hex"))).toBe(true);

      const consumeReset = await fetch(`${origin}/api/auth/password-reset/consume`, {
        method: "POST",
        headers: { origin: CONFIG.publicOrigin, "content-type": "application/json" },
        body: JSON.stringify({ token: deliveredToken, password: "new long password 456" }),
      });
      expect(consumeReset.status).toBe(204);
      expect(await verifyPassword("new long password 456", repository.users.get(USER_A)!.passwordHash)).toBe(true);
      expect(repository.loginSessions[0]?.revokedAt).toEqual(now);

      const oldSession = await fetch(`${origin}/api/auth/session`, {
        headers: { cookie: `neer_saas_session=${TOKEN_A}` },
      });
      expect(oldSession.status).toBe(401);
      const secondConsume = await fetch(`${origin}/api/auth/password-reset/consume`, {
        method: "POST",
        headers: { origin: CONFIG.publicOrigin, "content-type": "application/json" },
        body: JSON.stringify({ token: deliveredToken, password: "another long password 789" }),
      });
      expect(secondConsume.status).toBe(400);
    });
  });

  it("rejects unauthenticated, expired, and revoked sessions", async () => {
    const repository = new FakeSaasRepository();
    addUser(repository, USER_A, "a@example.com");
    repository.seedSession("55555555-5555-4555-8555-555555555555", USER_A, TOKEN_A);
    repository.seedSession(
      "66666666-6666-4666-8666-666666666666",
      USER_A,
      TOKEN_B,
      new Date(now.getTime() - 1),
    );
    repository.loginSessions[0]!.revokedAt = now;
    const app = createSaasApi({ config: CONFIG, repository, now: () => now });
    await withServer(app, async (origin) => {
      for (const cookie of [undefined, TOKEN_A, TOKEN_B]) {
        const response = await fetch(`${origin}/api/providers`, {
          headers: cookie ? { cookie: `neer_saas_session=${cookie}` } : {},
        });
        expect(response.status).toBe(401);
        expect(await response.json()).toMatchObject({ error: { code: "UNAUTHENTICATED" } });
      }
    });
  });

  it("prevents one account from reading or deleting another account's provider", async () => {
    const repository = new FakeSaasRepository();
    addUser(repository, USER_A, "a@example.com");
    addUser(repository, USER_B, "b@example.com");
    repository.seedSession("55555555-5555-4555-8555-555555555555", USER_A, TOKEN_A);
    repository.seedProvider({ id: PROVIDER_B, userId: USER_B, provider: "openai", key: "provider-secret-b" });
    const app = createSaasApi({ config: CONFIG, repository, now: () => now });
    await withServer(app, async (origin) => {
      const get = await fetch(`${origin}/api/providers/${PROVIDER_B}`, authenticatedRequest(TOKEN_A));
      const remove = await fetch(
        `${origin}/api/providers/${PROVIDER_B}`,
        authenticatedRequest(TOKEN_A, "DELETE"),
      );
      expect(get.status).toBe(404);
      expect(remove.status).toBe(404);
      expect(repository.providers.has(PROVIDER_B)).toBe(true);
      const list = await fetch(`${origin}/api/providers`, authenticatedRequest(TOKEN_A));
      const body = await list.text();
      expect(body).not.toContain("provider-secret-b");
      expect(body).not.toContain(PROVIDER_B);
    });
  });

  it("prevents cross-account model preference changes and session access", async () => {
    const repository = new FakeSaasRepository();
    addUser(repository, USER_A, "a@example.com");
    addUser(repository, USER_B, "b@example.com");
    repository.seedSession("55555555-5555-4555-8555-555555555555", USER_A, TOKEN_A);
    repository.seedProvider({ id: PROVIDER_B, userId: USER_B, provider: "anthropic", key: "secret-b" });
    await repository.createAgentSession({ id: SESSION_B, userId: USER_B, title: "B private session" });
    repository.seedPreference(USER_B, PROVIDER_B, "claude-sonnet-4-5");
    const app = createSaasApi({ config: CONFIG, repository, now: () => now });
    await withServer(app, async (origin) => {
      const preference = await fetch(`${origin}/api/model-preference`, {
        ...authenticatedRequest(TOKEN_A, "PUT", {
          providerConnectionId: PROVIDER_B,
          modelId: "claude-sonnet-4-5",
        }),
      });
      const session = await fetch(`${origin}/api/agent-sessions/${SESSION_B}`, authenticatedRequest(TOKEN_A));
      const deleteSession = await fetch(
        `${origin}/api/agent-sessions/${SESSION_B}`,
        authenticatedRequest(TOKEN_A, "DELETE"),
      );
      expect(preference.status).toBe(404);
      expect(session.status).toBe(404);
      expect(deleteSession.status).toBe(404);
      expect(repository.preferences.get(USER_B)?.providerConnectionId).toBe(PROVIDER_B);
      expect(repository.agentSessions.get(SESSION_B)?.deleted).toBe(false);
    });
  });

  it("encrypts a provider key and never returns or audits it", async () => {
    const repository = new FakeSaasRepository();
    addUser(repository, USER_A, "a@example.com");
    repository.seedSession("55555555-5555-4555-8555-555555555555", USER_A, TOKEN_A);
    const logs: unknown[] = [];
    const app = createSaasApi({
      config: CONFIG,
      repository,
      validateCredential: async () => "connected",
      logger: (...args) => logs.push(args),
      now: () => now,
    });
    await withServer(app, async (origin) => {
      const connected = await fetch(`${origin}/api/providers`, {
        ...authenticatedRequest(TOKEN_A, "POST", { provider: "openai", credential: "openai-secret-value" }),
      });
      expect(connected.status).toBe(201);
      const connection = repository.providers.get(
        ((await connected.json()) as { provider: { id: string } }).provider.id,
      )!;
      expect(connection.credential.ciphertext.includes(Buffer.from("openai-secret-value"))).toBe(false);
      const validate = await fetch(
        `${origin}/api/providers/${connection.id}/validate`,
        authenticatedRequest(TOKEN_A, "POST"),
      );
      const validationBody = await validate.text();
      expect(validate.status).toBe(200);
      expect(validationBody).not.toContain("openai-secret-value");
      const list = await fetch(`${origin}/api/providers`, authenticatedRequest(TOKEN_A));
      const listBody = await list.text();
      expect(listBody).not.toContain("openai-secret-value");
      expect(JSON.stringify(repository.audits)).not.toContain("openai-secret-value");
      expect(JSON.stringify(logs)).not.toContain("openai-secret-value");
    });
  });

  it("passes only the authenticated account's decrypted credential into the Phase 1 runtime hook", async () => {
    const repository = new FakeSaasRepository();
    addUser(repository, USER_A, "a@example.com");
    repository.seedSession("55555555-5555-4555-8555-555555555555", USER_A, TOKEN_A);
    repository.seedProvider({
      id: PROVIDER_B,
      userId: USER_A,
      provider: "anthropic",
      key: "account-a-secret",
    });
    repository.seedPreference(USER_A, PROVIDER_B, "claude-sonnet-4-5");
    const runAgent = vi.fn(async () => ({ text: "reply", model: "claude-sonnet-4-5" }));
    const app = createSaasApi({ config: CONFIG, repository, runAgent, now: () => now });
    await withServer(app, async (origin) => {
      const response = await fetch(`${origin}/api/chat`, {
        ...authenticatedRequest(TOKEN_A, "POST", { message: "hello" }),
      });
      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({ text: "reply", model: "claude-sonnet-4-5" });
      expect(runAgent).toHaveBeenCalledWith({
        userId: USER_A,
        sessionId: expect.any(String),
        prompt: "hello",
        credential: {
          provider: "anthropic",
          modelId: "claude-sonnet-4-5",
          apiKey: "account-a-secret",
        },
      });
    });
  });

  it("rejects credential/provider tampering without running the agent or leaking the key", async () => {
    const repository = new FakeSaasRepository();
    addUser(repository, USER_A, "a@example.com");
    repository.seedSession("55555555-5555-4555-8555-555555555555", USER_A, TOKEN_A);
    repository.seedProvider({
      id: PROVIDER_B,
      userId: USER_A,
      provider: "anthropic",
      key: "tamper-secret",
    });
    const connection = repository.providers.get(PROVIDER_B)!;
    connection.credential = encryptProviderCredential(
      "tamper-secret",
      { userId: USER_A, connectionId: PROVIDER_B, provider: "openai" },
      KEYRING,
    );
    repository.seedPreference(USER_A, PROVIDER_B, "claude-sonnet-4-5");
    const runAgent = vi.fn();
    const logs: unknown[] = [];
    const app = createSaasApi({
      config: CONFIG,
      repository,
      runAgent,
      logger: (...args) => logs.push(args),
      now: () => now,
    });
    await withServer(app, async (origin) => {
      const response = await fetch(`${origin}/api/chat`, {
        ...authenticatedRequest(TOKEN_A, "POST", { message: "hello" }),
      });
      const responseBody = await response.text();
      expect(response.status).toBe(503);
      expect(responseBody).not.toContain("tamper-secret");
      expect(runAgent).not.toHaveBeenCalled();
      expect(JSON.stringify(logs)).not.toContain("tamper-secret");
    });
  });

  it("blocks browser mutations without the configured Origin", async () => {
    const repository = new FakeSaasRepository();
    const app = createSaasApi({ config: CONFIG, repository, now: () => now });
    await withServer(app, async (origin) => {
      const response = await fetch(`${origin}/api/auth/register`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "a@example.com", password: "long-password-123" }),
      });
      expect(response.status).toBe(403);
      expect(await response.json()).toMatchObject({ error: { code: "ORIGIN_REJECTED" } });
    });
  });
});
