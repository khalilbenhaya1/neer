import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@neer/core-runtime/saas-runtime", () => ({
  resolveSaasModel: vi.fn(() => ({ model: { id: "gpt-test" } })),
  runEmbeddedPiAgent: vi.fn(async () => ({
    payloads: [{ text: "reply" }],
    meta: { agentMeta: { model: "openai/gpt-test" } },
  })),
}));

import { runEmbeddedPiAgent } from "@neer/core-runtime/saas-runtime";
import { createCoreAgentRunner } from "./runtime.js";

const runEmbeddedPiAgentMock = vi.mocked(runEmbeddedPiAgent);

describe("SaaS Core runtime adapter", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("uses account-owned paths and passes the selected key to the existing request-scoped runner", async () => {
    const dataDir = await mkdtemp(path.join(os.tmpdir(), "neer-saas-runtime-"));
    const userId = "11111111-1111-4111-8111-111111111111";
    const sessionId = "22222222-2222-4222-8222-222222222222";
    const apiKey = "provider-secret-value";
    try {
      const run = createCoreAgentRunner(dataDir);
      await expect(
        run({
          userId,
          sessionId,
          prompt: "hello",
          credential: { provider: "openai", modelId: "gpt-test", apiKey },
        }),
      ).resolves.toEqual({ text: "reply", model: "openai/gpt-test" });

      const call = runEmbeddedPiAgentMock.mock.calls[0]?.[0];
      expect(call?.providerCredential).toEqual({ provider: "openai", apiKey });
      expect(call?.disableTools).toBe(true);
      expect(call?.agentDir).toBe(path.join(dataDir, "users", userId, "agent"));
      expect(call?.sessionFile).toBe(path.join(dataDir, "users", userId, "sessions", `${sessionId}.jsonl`));
    } finally {
      await rm(dataDir, { recursive: true, force: true });
    }
  });
});
