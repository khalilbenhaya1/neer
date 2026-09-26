import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { resolveSaasModel, runEmbeddedPiAgent } from "@neer/core-runtime/saas-runtime";
import type { ModelCredential, RunSaasAgent } from "./types.js";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function assertRuntimeId(value: string): void {
  if (!UUID_PATTERN.test(value)) {
    throw new Error("Invalid server-owned runtime identifier.");
  }
}

function userPaths(dataDir: string, userId: string) {
  assertRuntimeId(userId);
  const userRoot = path.join(dataDir, "users", userId);
  return {
    userRoot,
    workspaceDir: path.join(userRoot, "workspace"),
    agentDir: path.join(userRoot, "agent"),
    sessionsDir: path.join(userRoot, "sessions"),
  };
}

export function isSupportedSaasModel(
  provider: ModelCredential["provider"],
  modelId: string,
  dataDir: string,
  userId: string,
): boolean {
  const { agentDir } = userPaths(dataDir, userId);
  return Boolean(resolveSaasModel(provider, modelId, agentDir).model);
}

export function createCoreAgentRunner(dataDir: string): RunSaasAgent {
  return async ({ userId, sessionId, prompt, credential }) => {
    assertRuntimeId(sessionId);
    const paths = userPaths(dataDir, userId);
    await Promise.all([
      mkdir(paths.workspaceDir, { recursive: true, mode: 0o700 }),
      mkdir(paths.agentDir, { recursive: true, mode: 0o700 }),
      mkdir(paths.sessionsDir, { recursive: true, mode: 0o700 }),
    ]);

    const sessionFile = path.join(paths.sessionsDir, `${sessionId}.jsonl`);
    const result = await runEmbeddedPiAgent({
      sessionId,
      agentId: `saas-${userId}`,
      sessionFile,
      workspaceDir: paths.workspaceDir,
      agentDir: paths.agentDir,
      prompt,
      provider: credential.provider,
      model: credential.modelId,
      providerCredential: { provider: credential.provider, apiKey: credential.apiKey },
      timeoutMs: 120_000,
      runId: randomUUID(),
      disableTools: true,
    });
    if (result.payloads?.some((payload) => payload.isError)) {
      throw new Error("Agent execution failed.");
    }
    return {
      text: result.payloads?.map((payload) => payload.text).filter(Boolean).join("\n") ?? "",
      model: result.meta.agentMeta?.model ?? `${credential.provider}/${credential.modelId}`,
    };
  };
}

export async function deleteCoreAgentSessionFiles(
  dataDir: string,
  userId: string,
  sessionId: string,
): Promise<void> {
  assertRuntimeId(sessionId);
  const { sessionsDir } = userPaths(dataDir, userId);
  await rm(path.join(sessionsDir, `${sessionId}.jsonl`), { force: true });
}
