import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  scrypt as scryptCallback,
  type ScryptOptions,
  timingSafeEqual,
} from "node:crypto";
import type { EncryptedCredential, ProviderId } from "./types.js";

const PASSWORD_COST = 32_768;
const PASSWORD_BLOCK_SIZE = 8;
const PASSWORD_PARALLELIZATION = 1;
const PASSWORD_KEY_BYTES = 64;
const PASSWORD_MAXMEM = 64 * 1024 * 1024;
const GCM_NONCE_BYTES = 12;
const GCM_TAG_BYTES = 16;

function scrypt(password: string, salt: Buffer, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, PASSWORD_KEY_BYTES, options, (error, derived) => {
      if (error) {
        reject(error);
      } else {
        resolve(derived);
      }
    });
  });
}

export type CredentialContext = {
  userId: string;
  connectionId: string;
  provider: ProviderId;
};

export type CredentialKeyring = {
  keys: ReadonlyMap<number, Buffer>;
  activeVersion: number;
};

function credentialAad(context: CredentialContext): Buffer {
  return Buffer.from(
    `neer-saas-provider-v1\0${context.userId}\0${context.connectionId}\0${context.provider}`,
    "utf8",
  );
}

export function hashOpaqueToken(token: string): Buffer {
  return createHash("sha256").update(token, "utf8").digest();
}

export function createOpaqueToken(): string {
  return randomBytes(32).toString("base64url");
}

export async function hashPassword(password: string): Promise<string> {
  if (password.length < 12 || password.length > 1024) {
    throw new Error("Password must be between 12 and 1024 characters.");
  }
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, {
    N: PASSWORD_COST,
    r: PASSWORD_BLOCK_SIZE,
    p: PASSWORD_PARALLELIZATION,
    maxmem: PASSWORD_MAXMEM,
  });
  return [
    "scrypt",
    PASSWORD_COST,
    PASSWORD_BLOCK_SIZE,
    PASSWORD_PARALLELIZATION,
    salt.toString("base64url"),
    derived.toString("base64url"),
  ].join("$");
}

export async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  const [scheme, nRaw, rRaw, pRaw, saltRaw, digestRaw, extra] = encoded.split("$");
  if (
    scheme !== "scrypt" ||
    nRaw !== String(PASSWORD_COST) ||
    rRaw !== String(PASSWORD_BLOCK_SIZE) ||
    pRaw !== String(PASSWORD_PARALLELIZATION) ||
    !saltRaw ||
    !digestRaw ||
    extra != null ||
    password.length > 1024
  ) {
    return false;
  }
  try {
    const salt = Buffer.from(saltRaw, "base64url");
    const expected = Buffer.from(digestRaw, "base64url");
    if (salt.length !== 16 || expected.length !== PASSWORD_KEY_BYTES) {
      return false;
    }
    const actual = await scrypt(password, salt, {
      N: PASSWORD_COST,
      r: PASSWORD_BLOCK_SIZE,
      p: PASSWORD_PARALLELIZATION,
      maxmem: PASSWORD_MAXMEM,
    });
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export function encryptProviderCredential(
  apiKey: string,
  context: CredentialContext,
  keyring: CredentialKeyring,
): EncryptedCredential {
  const keyVersion = keyring.activeVersion;
  const key = keyring.keys.get(keyVersion);
  if (!key || key.length !== 32 || !apiKey.trim()) {
    throw new Error("Unable to encrypt provider credential.");
  }
  const nonce = randomBytes(GCM_NONCE_BYTES);
  const cipher = createCipheriv("aes-256-gcm", key, nonce, { authTagLength: GCM_TAG_BYTES });
  cipher.setAAD(credentialAad(context));
  const ciphertext = Buffer.concat([cipher.update(apiKey, "utf8"), cipher.final()]);
  return {
    ciphertext,
    nonce,
    authTag: cipher.getAuthTag(),
    keyVersion,
  };
}

export function decryptProviderCredential(
  encrypted: EncryptedCredential,
  context: CredentialContext,
  keyring: CredentialKeyring,
): string {
  const key = keyring.keys.get(encrypted.keyVersion);
  if (!key || key.length !== 32) {
    throw new Error("Unable to decrypt provider credential.");
  }
  try {
    const decipher = createDecipheriv("aes-256-gcm", key, encrypted.nonce, {
      authTagLength: GCM_TAG_BYTES,
    });
    decipher.setAAD(credentialAad(context));
    decipher.setAuthTag(encrypted.authTag);
    const plaintext = Buffer.concat([
      decipher.update(encrypted.ciphertext),
      decipher.final(),
    ]);
    return plaintext.toString("utf8");
  } catch {
    throw new Error("Unable to decrypt provider credential.");
  }
}

export function createResetToken(): string {
  return createOpaqueToken();
}
