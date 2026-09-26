export type SaaSUser = {
  id: string;
  email: string;
  status: "active" | "suspended" | "deleted";
  createdAt: Date;
};

export type SaaSSession = {
  id: string;
  userId: string;
  email: string;
  expiresAt: Date;
};

export type ProviderId = "openai" | "anthropic" | "google" | "openrouter";
export type ProviderStatus = "pending" | "connected" | "invalid";

export type EncryptedCredential = {
  ciphertext: Buffer;
  nonce: Buffer;
  authTag: Buffer;
  keyVersion: number;
};

export type PublicProviderConnection = {
  id: string;
  provider: ProviderId;
  displayName: string;
  status: ProviderStatus;
  createdAt: Date;
  updatedAt: Date;
  lastValidatedAt: Date | null;
};

export type StoredProviderCredential = EncryptedCredential & {
  id: string;
  userId: string;
  provider: ProviderId;
  status: ProviderStatus;
};

export type ModelPreference = {
  providerConnectionId: string;
  provider: ProviderId;
  modelId: string;
  updatedAt: Date;
};

export type AgentSession = {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
};

export type AuditEvent = {
  userId: string | null;
  eventType: string;
  success: boolean;
  metadata: Record<string, string | number | boolean | null>;
};

export interface SaasRepository {
  createUser(params: { id: string; email: string; passwordHash: string }): Promise<boolean>;
  findUserByEmail(email: string): Promise<(SaaSUser & { passwordHash: string }) | null>;
  createLoginSession(params: {
    id: string;
    userId: string;
    tokenHash: Buffer;
    expiresAt: Date;
    userAgent: string | null;
  }): Promise<void>;
  findLoginSession(tokenHash: Buffer, now: Date): Promise<SaaSSession | null>;
  revokeLoginSession(sessionId: string, userId: string, now: Date): Promise<void>;
  revokeAllLoginSessions(userId: string, now: Date): Promise<void>;
  addAuditEvent(event: AuditEvent): Promise<void>;
  consumeRateLimit(params: {
    bucketKeyHash: string;
    windowStartedAt: Date;
    expiresAt: Date;
  }): Promise<number>;
  createProviderConnection(params: {
    id: string;
    userId: string;
    provider: ProviderId;
    encrypted: EncryptedCredential;
  }): Promise<PublicProviderConnection | null>;
  listProviderConnections(userId: string): Promise<PublicProviderConnection[]>;
  getProviderConnection(userId: string, id: string): Promise<PublicProviderConnection | null>;
  getProviderCredential(userId: string, id: string): Promise<StoredProviderCredential | null>;
  getExecutionCredential(userId: string): Promise<
    | (StoredProviderCredential & { modelId: string })
    | null
  >;
  updateProviderStatus(
    userId: string,
    id: string,
    status: ProviderStatus,
    validatedAt: Date | null,
  ): Promise<boolean>;
  deleteProviderConnection(userId: string, id: string): Promise<boolean>;
  getModelPreference(userId: string): Promise<ModelPreference | null>;
  setModelPreference(params: {
    userId: string;
    providerConnectionId: string;
    modelId: string;
  }): Promise<ModelPreference | null>;
  createAgentSession(params: { id: string; userId: string; title: string }): Promise<AgentSession>;
  listAgentSessions(userId: string): Promise<AgentSession[]>;
  getAgentSession(userId: string, id: string): Promise<AgentSession | null>;
  deleteAgentSession(userId: string, id: string): Promise<boolean>;
  createPasswordReset(params: { userId: string; tokenHash: Buffer; expiresAt: Date }): Promise<void>;
  consumePasswordReset(params: {
    tokenHash: Buffer;
    passwordHash: string;
    now: Date;
  }): Promise<string | null>;
}

export type ModelCredential = {
  provider: ProviderId;
  modelId: string;
  apiKey: string;
};

export type RunSaasAgent = (params: {
  userId: string;
  sessionId: string;
  prompt: string;
  credential: ModelCredential;
}) => Promise<{ text: string; model: string }>;

export type SafeLogger = (event: string, fields: Record<string, string | number | boolean>) => void;
