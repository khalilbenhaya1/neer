import type { ProviderId } from "./types.js";

export const SUPPORTED_PROVIDERS: Record<ProviderId, { displayName: string; validationUrl: string }> = {
  openai: { displayName: "OpenAI", validationUrl: "https://api.openai.com/v1/models?limit=1" },
  anthropic: {
    displayName: "Anthropic",
    validationUrl: "https://api.anthropic.com/v1/models?limit=1",
  },
  google: {
    displayName: "Google Gemini",
    validationUrl: "https://generativelanguage.googleapis.com/v1beta/models?pageSize=1",
  },
  openrouter: {
    displayName: "OpenRouter",
    validationUrl: "https://openrouter.ai/api/v1/models",
  },
};

export function isProviderId(value: unknown): value is ProviderId {
  return typeof value === "string" && Object.hasOwn(SUPPORTED_PROVIDERS, value);
}

export function normalizeProviderCredential(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const credential = value.trim();
  if (
    !credential ||
    credential.length > 4096 ||
    credential.includes("\r") ||
    credential.includes("\n") ||
    credential.includes("\0")
  ) {
    return null;
  }
  return credential;
}

export type ProviderValidationOutcome = "connected" | "invalid" | "unavailable";

export async function validateProviderCredential(params: {
  provider: ProviderId;
  apiKey: string;
  fetcher?: typeof fetch;
}): Promise<ProviderValidationOutcome> {
  const fetcher = params.fetcher ?? fetch;
  const headers: Record<string, string> = { accept: "application/json" };
  switch (params.provider) {
    case "openai":
    case "openrouter":
      headers.authorization = `Bearer ${params.apiKey}`;
      break;
    case "anthropic":
      headers["x-api-key"] = params.apiKey;
      headers["anthropic-version"] = "2023-06-01";
      break;
    case "google":
      headers["x-goog-api-key"] = params.apiKey;
      break;
  }

  try {
    const response = await fetcher(SUPPORTED_PROVIDERS[params.provider].validationUrl, {
      method: "GET",
      headers,
      redirect: "error",
      signal: AbortSignal.timeout(5_000),
    });
    await response.body?.cancel().catch(() => undefined);
    if (response.ok) {
      return "connected";
    }
    if (response.status === 401 || response.status === 403) {
      return "invalid";
    }
    return "unavailable";
  } catch {
    return "unavailable";
  }
}
