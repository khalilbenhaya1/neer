import path from "node:path";

export type SaasConfig = {
  databaseUrl: string;
  credentialEncryptionKeys: ReadonlyMap<number, Buffer>;
  activeCredentialKeyVersion: number;
  publicOrigin: string;
  host: string;
  port: number;
  dataDir: string;
  sessionTtlSeconds: number;
  trustProxy: string | number | false;
  secureCookies: boolean;
};

function required(env: NodeJS.ProcessEnv, key: string): string {
  const value = env[key]?.trim();
  if (!value) {
    throw new Error(`Missing required SaaS setting: ${key}`);
  }
  return value;
}

function positiveInteger(raw: string | undefined, fallback: number, key: string): number {
  if (raw == null || !raw.trim()) {
    return fallback;
  }
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`Invalid SaaS setting: ${key}`);
  }
  return value;
}

export function readSaasConfig(env: NodeJS.ProcessEnv = process.env): SaasConfig {
  const databaseUrl = required(env, "SAAS_DATABASE_URL");
  let databaseProtocol: string;
  try {
    databaseProtocol = new URL(databaseUrl).protocol;
  } catch {
    throw new Error("SAAS_DATABASE_URL must be a PostgreSQL connection URL.");
  }
  if (databaseProtocol !== "postgres:" && databaseProtocol !== "postgresql:") {
    throw new Error("SAAS_DATABASE_URL must be a PostgreSQL connection URL.");
  }
  const publicUrl = new URL(required(env, "SAAS_PUBLIC_ORIGIN"));
  const allowInsecureCookies = env.NODE_ENV === "development" || env.NODE_ENV === "test";
  if (publicUrl.protocol !== "https:" && !allowInsecureCookies) {
    throw new Error("SAAS_PUBLIC_ORIGIN must use HTTPS in production.");
  }
  if (
    publicUrl.pathname !== "/" ||
    publicUrl.search ||
    publicUrl.hash ||
    publicUrl.username ||
    publicUrl.password
  ) {
    throw new Error("SAAS_PUBLIC_ORIGIN must contain only an origin.");
  }

  let keySet: Record<string, unknown>;
  try {
    keySet = JSON.parse(required(env, "SAAS_CREDENTIAL_ENCRYPTION_KEYS")) as Record<string, unknown>;
  } catch {
    throw new Error("SAAS_CREDENTIAL_ENCRYPTION_KEYS must be a JSON object of key versions.");
  }
  const credentialEncryptionKeys = new Map<number, Buffer>();
  for (const [versionText, encoded] of Object.entries(keySet)) {
    const version = Number(versionText);
    if (!Number.isSafeInteger(version) || version <= 0 || typeof encoded !== "string") {
      throw new Error("SAAS_CREDENTIAL_ENCRYPTION_KEYS contains an invalid key version.");
    }
    const key = Buffer.from(encoded, "base64");
    if (key.length !== 32 || key.toString("base64") !== encoded) {
      throw new Error("Each SaaS credential encryption key must be base64 encoded and 32 bytes.");
    }
    credentialEncryptionKeys.set(version, key);
  }
  const activeCredentialKeyVersion = positiveInteger(
    env.SAAS_CREDENTIAL_ACTIVE_KEY_VERSION,
    1,
    "credential key version",
  );
  if (!credentialEncryptionKeys.has(activeCredentialKeyVersion)) {
    throw new Error("SAAS_CREDENTIAL_ACTIVE_KEY_VERSION must exist in the configured key set.");
  }

  const sessionTtlSeconds = positiveInteger(env.SAAS_SESSION_TTL_SECONDS, 604_800, "session TTL");
  if (sessionTtlSeconds > 2_592_000) {
    throw new Error("SAAS_SESSION_TTL_SECONDS must not exceed 30 days.");
  }

  const trustProxyRaw = env.SAAS_TRUST_PROXY?.trim() ?? "false";
  const trustProxy =
    trustProxyRaw === "true"
      ? "loopback"
      : trustProxyRaw === "false" || trustProxyRaw === ""
        ? false
        : /^\d+$/.test(trustProxyRaw)
          ? Number(trustProxyRaw)
          : trustProxyRaw;

  return {
    databaseUrl,
    credentialEncryptionKeys,
    activeCredentialKeyVersion,
    publicOrigin: publicUrl.origin,
    host: env.SAAS_HOST?.trim() || "127.0.0.1",
    port: (() => {
      const port = positiveInteger(env.SAAS_PORT, 8788, "port");
      if (port > 65_535) {
        throw new Error("SAAS_PORT must be between 1 and 65535.");
      }
      return port;
    })(),
    dataDir: path.resolve(required(env, "SAAS_DATA_DIR")),
    sessionTtlSeconds,
    trustProxy,
    secureCookies: !allowInsecureCookies,
  };
}
