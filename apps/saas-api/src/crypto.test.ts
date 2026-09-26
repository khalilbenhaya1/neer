import { describe, expect, it } from "vitest";
import {
  createOpaqueToken,
  decryptProviderCredential,
  encryptProviderCredential,
  hashOpaqueToken,
  hashPassword,
  verifyPassword,
} from "./crypto.js";

const key1 = Buffer.alloc(32, 1);
const key2 = Buffer.alloc(32, 2);
const context = {
  userId: "11111111-1111-4111-8111-111111111111",
  connectionId: "22222222-2222-4222-8222-222222222222",
  provider: "openai" as const,
};

describe("SaaS credential and password cryptography", () => {
  it("hashes passwords with per-password salts and verifies without storing plaintext", async () => {
    const first = await hashPassword("long test password 1");
    const second = await hashPassword("long test password 1");
    expect(first).not.toBe(second);
    expect(first).not.toContain("long test password 1");
    expect(await verifyPassword("long test password 1", first)).toBe(true);
    expect(await verifyPassword("wrong password", first)).toBe(false);
    await expect(hashPassword("short")).rejects.toThrow("12 and 1024");
  });

  it("encrypts provider credentials with authenticated context and supports key-version rotation", () => {
    const oldKeyring = { keys: new Map([[1, key1]]), activeVersion: 1 };
    const rotatedKeyring = { keys: new Map([[1, key1], [2, key2]]), activeVersion: 2 };
    const oldCiphertext = encryptProviderCredential("do-not-store-plain", context, oldKeyring);
    const newCiphertext = encryptProviderCredential("new-secret", context, rotatedKeyring);
    expect(oldCiphertext.keyVersion).toBe(1);
    expect(newCiphertext.keyVersion).toBe(2);
    expect(oldCiphertext.ciphertext.includes(Buffer.from("do-not-store-plain"))).toBe(false);
    expect(decryptProviderCredential(oldCiphertext, context, rotatedKeyring)).toBe("do-not-store-plain");
    expect(decryptProviderCredential(newCiphertext, context, rotatedKeyring)).toBe("new-secret");
    expect(() =>
      decryptProviderCredential(oldCiphertext, { ...context, userId: "33333333-3333-4333-8333-333333333333" }, rotatedKeyring),
    ).toThrow("Unable to decrypt provider credential");
    expect(() => decryptProviderCredential(oldCiphertext, context, { keys: new Map([[2, key2]]), activeVersion: 2 })).toThrow(
      "Unable to decrypt provider credential",
    );
  });

  it("generates opaque tokens and stores only a one-way hash", () => {
    const token = createOpaqueToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]{40,64}$/);
    const hash = hashOpaqueToken(token);
    expect(hash.toString("utf8")).not.toContain(token);
    expect(hash.equals(hashOpaqueToken(token))).toBe(true);
  });
});
