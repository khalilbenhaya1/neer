import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { applyRequestScopedApiKey, AuthStorage } from "./pi-model-discovery.js";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })));
});

describe("applyRequestScopedApiKey", () => {
  it("makes the key available only in memory without creating auth.json", async () => {
    const agentDir = await fs.mkdtemp(path.join(os.tmpdir(), "neer-request-auth-"));
    tempDirs.push(agentDir);
    const authPath = path.join(agentDir, "auth.json");
    const authStorage = new AuthStorage(authPath);

    applyRequestScopedApiKey(authStorage, "neer-runtime-test", "request-only-key");

    await expect(authStorage.getApiKey("neer-runtime-test")).resolves.toBe("request-only-key");
    await expect(fs.stat(authPath)).rejects.toMatchObject({ code: "ENOENT" });
  });
});
