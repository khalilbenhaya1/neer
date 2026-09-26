import { randomUUID } from "node:crypto";
import type { Pool, PoolClient } from "pg";
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

type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  status: SaaSUser["status"];
  created_at: Date;
};

type SessionRow = {
  session_id: string;
  user_id: string;
  email: string;
  expires_at: Date;
};

type ProviderRow = {
  id: string;
  user_id: string;
  provider: ProviderId;
  status: ProviderStatus;
  credential_ciphertext: Buffer;
  credential_nonce: Buffer;
  credential_auth_tag: Buffer;
  encryption_key_version: number;
  created_at: Date;
  updated_at: Date;
  last_validated_at: Date | null;
};

type AgentSessionRow = {
  id: string;
  title: string;
  created_at: Date;
  updated_at: Date;
};

const toPublicProvider = (row: ProviderRow): PublicProviderConnection => ({
  id: row.id,
  provider: row.provider,
  displayName: providerDisplayName(row.provider),
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  lastValidatedAt: row.last_validated_at,
});

export function providerDisplayName(provider: ProviderId): string {
  switch (provider) {
    case "openai":
      return "OpenAI";
    case "anthropic":
      return "Anthropic";
    case "google":
      return "Google Gemini";
    case "openrouter":
      return "OpenRouter";
  }
}

const toAgentSession = (row: AgentSessionRow): AgentSession => ({
  id: row.id,
  title: row.title,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export class PostgresSaasRepository implements SaasRepository {
  private rateLimitCalls = 0;

  constructor(private readonly pool: Pool) {}

  private async withTenant<T>(userId: string, fn: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT set_config('app.user_id', $1, true)", [userId]);
      const result = await fn(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  }

  async createUser(params: { id: string; email: string; passwordHash: string }): Promise<boolean> {
    const result = await this.pool.query(
      `INSERT INTO saas_users (id, email, password_hash)
       VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING
       RETURNING id`,
      [params.id, params.email, params.passwordHash],
    );
    return result.rowCount === 1;
  }

  async findUserByEmail(
    email: string,
  ): Promise<(SaaSUser & { passwordHash: string }) | null> {
    const result = await this.pool.query<UserRow>(
      `SELECT id, email, password_hash, status, created_at
       FROM saas_users WHERE lower(email) = lower($1) LIMIT 1`,
      [email],
    );
    const row = result.rows[0];
    return row
      ? {
          id: row.id,
          email: row.email,
          passwordHash: row.password_hash,
          status: row.status,
          createdAt: row.created_at,
        }
      : null;
  }

  async createLoginSession(params: {
    id: string;
    userId: string;
    tokenHash: Buffer;
    expiresAt: Date;
    userAgent: string | null;
  }): Promise<void> {
    await this.pool.query(
      `INSERT INTO saas_account_sessions (id, user_id, token_hash, expires_at, user_agent)
       VALUES ($1, $2, $3, $4, $5)`,
      [params.id, params.userId, params.tokenHash, params.expiresAt, params.userAgent],
    );
  }

  async findLoginSession(tokenHash: Buffer, now: Date): Promise<SaaSSession | null> {
    const result = await this.pool.query<SessionRow>(
      `SELECT s.id AS session_id, u.id AS user_id, u.email, s.expires_at
       FROM saas_account_sessions s
       JOIN saas_users u ON u.id = s.user_id
       WHERE s.token_hash = $1 AND s.revoked_at IS NULL AND s.expires_at > $2
         AND u.status = 'active'
       LIMIT 1`,
      [tokenHash, now],
    );
    const row = result.rows[0];
    return row
      ? { id: row.session_id, userId: row.user_id, email: row.email, expiresAt: row.expires_at }
      : null;
  }

  async revokeLoginSession(sessionId: string, userId: string, now: Date): Promise<void> {
    await this.pool.query(
      `UPDATE saas_account_sessions SET revoked_at = $3
       WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL`,
      [sessionId, userId, now],
    );
  }

  async revokeAllLoginSessions(userId: string, now: Date): Promise<void> {
    await this.pool.query(
      `UPDATE saas_account_sessions SET revoked_at = $2
       WHERE user_id = $1 AND revoked_at IS NULL`,
      [userId, now],
    );
  }

  async addAuditEvent(event: AuditEvent): Promise<void> {
    const insert = async (client: Pool | PoolClient) => {
      await client.query(
        `INSERT INTO saas_audit_events (id, user_id, event_type, success, metadata)
         VALUES ($1, $2, $3, $4, $5::jsonb)`,
        [randomUUID(), event.userId, event.eventType, event.success, JSON.stringify(event.metadata)],
      );
    };
    if (event.userId) {
      await this.withTenant(event.userId, insert);
    } else {
      await insert(this.pool);
    }
  }

  async consumeRateLimit(params: {
    bucketKeyHash: string;
    windowStartedAt: Date;
    expiresAt: Date;
  }): Promise<number> {
    this.rateLimitCalls += 1;
    if (this.rateLimitCalls % 1000 === 0) {
      await this.pool.query("DELETE FROM saas_rate_limit_buckets WHERE expires_at < now()");
    }
    const result = await this.pool.query<{ hit_count: number }>(
      `INSERT INTO saas_rate_limit_buckets (bucket_key_hash, window_started_at, hit_count, expires_at)
       VALUES ($1, $2, 1, $3)
       ON CONFLICT (bucket_key_hash, window_started_at)
       DO UPDATE SET hit_count = saas_rate_limit_buckets.hit_count + 1
       RETURNING hit_count`,
      [params.bucketKeyHash, params.windowStartedAt, params.expiresAt],
    );
    return Number(result.rows[0]?.hit_count ?? 1);
  }

  async createProviderConnection(params: {
    id: string;
    userId: string;
    provider: ProviderId;
    encrypted: EncryptedCredential;
  }): Promise<PublicProviderConnection | null> {
    return this.withTenant(params.userId, async (client) => {
      const result = await client.query<ProviderRow>(
        `INSERT INTO saas_provider_connections
           (id, user_id, provider, credential_ciphertext, credential_nonce,
            credential_auth_tag, encryption_key_version)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (user_id, provider) DO NOTHING
         RETURNING *`,
        [
          params.id,
          params.userId,
          params.provider,
          params.encrypted.ciphertext,
          params.encrypted.nonce,
          params.encrypted.authTag,
          params.encrypted.keyVersion,
        ],
      );
      const row = result.rows[0];
      return row ? toPublicProvider(row) : null;
    });
  }

  async listProviderConnections(userId: string): Promise<PublicProviderConnection[]> {
    return this.withTenant(userId, async (client) => {
      const result = await client.query<ProviderRow>(
        `SELECT id, user_id, provider, status, created_at, updated_at, last_validated_at
         FROM saas_provider_connections WHERE user_id = $1 ORDER BY created_at DESC`,
        [userId],
      );
      return result.rows.map(toPublicProvider);
    });
  }

  async getProviderConnection(userId: string, id: string): Promise<PublicProviderConnection | null> {
    return this.withTenant(userId, async (client) => {
      const result = await client.query<ProviderRow>(
        `SELECT id, user_id, provider, status, created_at, updated_at, last_validated_at
         FROM saas_provider_connections WHERE id = $1 AND user_id = $2 LIMIT 1`,
        [id, userId],
      );
      const row = result.rows[0];
      return row ? toPublicProvider(row) : null;
    });
  }

  async getProviderCredential(userId: string, id: string): Promise<StoredProviderCredential | null> {
    return this.withTenant(userId, async (client) => {
      const result = await client.query<ProviderRow>(
        `SELECT * FROM saas_provider_connections WHERE id = $1 AND user_id = $2 LIMIT 1`,
        [id, userId],
      );
      const row = result.rows[0];
      return row
        ? {
            id: row.id,
            userId: row.user_id,
            provider: row.provider,
            status: row.status,
            ciphertext: row.credential_ciphertext,
            nonce: row.credential_nonce,
            authTag: row.credential_auth_tag,
            keyVersion: row.encryption_key_version,
          }
        : null;
    });
  }

  async getExecutionCredential(
    userId: string,
  ): Promise<(StoredProviderCredential & { modelId: string }) | null> {
    return this.withTenant(userId, async (client) => {
      const result = await client.query<ProviderRow & { model_id: string }>(
        `SELECT c.*, p.model_id
         FROM saas_model_preferences p
         JOIN saas_provider_connections c
           ON c.id = p.provider_connection_id AND c.user_id = p.user_id
         WHERE p.user_id = $1 AND c.user_id = $1 AND c.status = 'connected'
         LIMIT 1`,
        [userId],
      );
      const row = result.rows[0];
      return row
        ? {
            id: row.id,
            userId: row.user_id,
            provider: row.provider,
            modelId: row.model_id,
            status: row.status,
            ciphertext: row.credential_ciphertext,
            nonce: row.credential_nonce,
            authTag: row.credential_auth_tag,
            keyVersion: row.encryption_key_version,
          }
        : null;
    });
  }

  async updateProviderStatus(
    userId: string,
    id: string,
    status: ProviderStatus,
    validatedAt: Date | null,
  ): Promise<boolean> {
    return this.withTenant(userId, async (client) => {
      const result = await client.query(
        `UPDATE saas_provider_connections
         SET status = $3, last_validated_at = $4, updated_at = now()
         WHERE id = $1 AND user_id = $2 RETURNING id`,
        [id, userId, status, validatedAt],
      );
      return result.rowCount === 1;
    });
  }

  async deleteProviderConnection(userId: string, id: string): Promise<boolean> {
    return this.withTenant(userId, async (client) => {
      const result = await client.query(
        `DELETE FROM saas_provider_connections WHERE id = $1 AND user_id = $2 RETURNING id`,
        [id, userId],
      );
      return result.rowCount === 1;
    });
  }

  async getModelPreference(userId: string): Promise<ModelPreference | null> {
    return this.withTenant(userId, async (client) => {
      const result = await client.query<{
        provider_connection_id: string;
        provider: ProviderId;
        model_id: string;
        updated_at: Date;
      }>(
        `SELECT p.provider_connection_id, c.provider, p.model_id, p.updated_at
         FROM saas_model_preferences p
         JOIN saas_provider_connections c
           ON c.id = p.provider_connection_id AND c.user_id = p.user_id
         WHERE p.user_id = $1 LIMIT 1`,
        [userId],
      );
      const row = result.rows[0];
      return row
        ? {
            providerConnectionId: row.provider_connection_id,
            provider: row.provider,
            modelId: row.model_id,
            updatedAt: row.updated_at,
          }
        : null;
    });
  }

  async setModelPreference(params: {
    userId: string;
    providerConnectionId: string;
    modelId: string;
  }): Promise<ModelPreference | null> {
    return this.withTenant(params.userId, async (client) => {
      const provider = await client.query<{ provider: ProviderId; status: ProviderStatus }>(
        `SELECT provider, status FROM saas_provider_connections
         WHERE id = $1 AND user_id = $2 LIMIT 1`,
        [params.providerConnectionId, params.userId],
      );
      if (!provider.rows[0] || provider.rows[0].status !== "connected") {
        return null;
      }
      const result = await client.query<{
        provider_connection_id: string;
        provider: ProviderId;
        model_id: string;
        updated_at: Date;
      }>(
        `INSERT INTO saas_model_preferences (user_id, provider_connection_id, model_id)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id) DO UPDATE
           SET provider_connection_id = EXCLUDED.provider_connection_id,
               model_id = EXCLUDED.model_id,
               updated_at = now()
         RETURNING provider_connection_id, model_id, updated_at`,
        [params.userId, params.providerConnectionId, params.modelId],
      );
      const row = result.rows[0];
      return row
        ? {
            providerConnectionId: row.provider_connection_id,
            provider: provider.rows[0].provider,
            modelId: row.model_id,
            updatedAt: row.updated_at,
          }
        : null;
    });
  }

  async createAgentSession(params: {
    id: string;
    userId: string;
    title: string;
  }): Promise<AgentSession> {
    return this.withTenant(params.userId, async (client) => {
      const result = await client.query<AgentSessionRow>(
        `INSERT INTO saas_agent_sessions (id, user_id, title)
         VALUES ($1, $2, $3) RETURNING id, title, created_at, updated_at`,
        [params.id, params.userId, params.title],
      );
      return toAgentSession(result.rows[0]);
    });
  }

  async listAgentSessions(userId: string): Promise<AgentSession[]> {
    return this.withTenant(userId, async (client) => {
      const result = await client.query<AgentSessionRow>(
        `SELECT id, title, created_at, updated_at FROM saas_agent_sessions
         WHERE user_id = $1 AND deleted_at IS NULL ORDER BY updated_at DESC LIMIT 100`,
        [userId],
      );
      return result.rows.map(toAgentSession);
    });
  }

  async getAgentSession(userId: string, id: string): Promise<AgentSession | null> {
    return this.withTenant(userId, async (client) => {
      const result = await client.query<AgentSessionRow>(
        `SELECT id, title, created_at, updated_at FROM saas_agent_sessions
         WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL LIMIT 1`,
        [id, userId],
      );
      return result.rows[0] ? toAgentSession(result.rows[0]) : null;
    });
  }

  async deleteAgentSession(userId: string, id: string): Promise<boolean> {
    return this.withTenant(userId, async (client) => {
      const result = await client.query(
        `UPDATE saas_agent_sessions SET deleted_at = now(), updated_at = now()
         WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL RETURNING id`,
        [id, userId],
      );
      return result.rowCount === 1;
    });
  }

  async createPasswordReset(params: {
    userId: string;
    tokenHash: Buffer;
    expiresAt: Date;
  }): Promise<void> {
    await this.pool.query(
      `INSERT INTO saas_password_reset_tokens (token_hash, user_id, expires_at)
       VALUES ($1, $2, $3)`,
      [params.tokenHash, params.userId, params.expiresAt],
    );
  }

  async consumePasswordReset(params: {
    tokenHash: Buffer;
    passwordHash: string;
    now: Date;
  }): Promise<string | null> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const token = await client.query<{ user_id: string }>(
        `SELECT user_id FROM saas_password_reset_tokens
         WHERE token_hash = $1 AND consumed_at IS NULL AND expires_at > $2 FOR UPDATE`,
        [params.tokenHash, params.now],
      );
      const userId = token.rows[0]?.user_id;
      if (!userId) {
        await client.query("ROLLBACK");
        return null;
      }
      await client.query(
        `UPDATE saas_password_reset_tokens SET consumed_at = $2 WHERE token_hash = $1`,
        [params.tokenHash, params.now],
      );
      await client.query(
        `UPDATE saas_users SET password_hash = $2, updated_at = $3 WHERE id = $1`,
        [userId, params.passwordHash, params.now],
      );
      await client.query(
        `UPDATE saas_account_sessions SET revoked_at = $2
         WHERE user_id = $1 AND revoked_at IS NULL`,
        [userId, params.now],
      );
      await client.query("COMMIT");
      return userId;
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  }
}
