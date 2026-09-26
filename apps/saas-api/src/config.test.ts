import { describe, expect, it } from "vitest";
import { readSaasConfig } from "./config.js";

const validEnv = {
  SAAS_DATABASE_URL: "postgres://saas:password@localhost:5432/neer",
  SAAS_PUBLIC_ORIGIN: "https://app.example.test",
  SAAS_CREDENTIAL_ENCRYPTION_KEYS: JSON.stringify({ "1": Buffer.alloc(32, 1).toString("base64") }),
  SAAS_CREDENTIAL_ACTIVE_KEY_VERSION: "1",
  SAAS_DATA_DIR: "./private-data",
  NODE_ENV: "production",
};

describe("SaaS service configuration", () => {
  it("requires HTTPS and an externally configured 32-byte credential key", () => {
    const config = readSaasConfig(validEnv);
    expect(config.secureCookies).toBe(true);
    expect(config.activeCredentialKeyVersion).toBe(1);
    expect(config.credentialEncryptionKeys.get(1)?.length).toBe(32);
    expect(() => readSaasConfig({ ...validEnv, SAAS_PUBLIC_ORIGIN: "http://app.example.test" })).toThrow("HTTPS");
    expect(() =>
      readSaasConfig({
        ...validEnv,
        SAAS_CREDENTIAL_ENCRYPTION_KEYS: JSON.stringify({ "1": Buffer.alloc(31).toString("base64") }),
      }),
    ).toThrow("32 bytes");
  });

  it("requires the active encryption key version to be present", () => {
    expect(() => readSaasConfig({ ...validEnv, SAAS_CREDENTIAL_ACTIVE_KEY_VERSION: "2" })).toThrow(
      "must exist in the configured key set",
    );
  });
});
