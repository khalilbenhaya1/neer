import path from "node:path";
import { AuthStorage, ModelRegistry } from "@mariozechner/pi-coding-agent";
export { AuthStorage, ModelRegistry };

// Compatibility helpers for pi-coding-agent 0.50+ (discover* helpers removed).
export function discoverAuthStorage(agentDir: string): AuthStorage {
  return new AuthStorage(path.join(agentDir, "auth.json"));
}

/** Apply a one-run API key to this AuthStorage instance without writing auth.json. */
export function applyRequestScopedApiKey(
  authStorage: AuthStorage,
  provider: string,
  apiKey: string,
): void {
  const normalizedProvider = provider.trim();
  const normalizedApiKey = apiKey.trim();
  if (!normalizedProvider || !normalizedApiKey) {
    throw new Error("A provider and API key are required for request-scoped model auth.");
  }
  authStorage.setRuntimeApiKey(normalizedProvider, normalizedApiKey);
}

export function discoverModels(authStorage: AuthStorage, agentDir: string): ModelRegistry {
  return new ModelRegistry(authStorage, path.join(agentDir, "models.json"));
}
