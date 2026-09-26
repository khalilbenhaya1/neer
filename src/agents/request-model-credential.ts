import { normalizeProviderId } from "./model-selection.js";

/** A credential resolved by a trusted request boundary for one model execution. */
export type RequestScopedProviderCredential = Readonly<{
  provider: string;
  apiKey: string;
}>;

export type RequestScopedCredentialResolution =
  | { kind: "local" }
  | { kind: "request"; apiKey: string }
  | { kind: "denied"; message: string };

/**
 * Resolve an explicit request credential without falling back to local/server credentials.
 * An absent credential preserves NEER's existing local auth behavior.
 */
export function resolveRequestScopedProviderCredential(params: {
  credential?: RequestScopedProviderCredential;
  provider: string;
}): RequestScopedCredentialResolution {
  const credential = params.credential;
  if (!credential) {
    return { kind: "local" };
  }

  const credentialProvider = normalizeProviderId(credential.provider);
  const modelProvider = normalizeProviderId(params.provider);
  if (!credentialProvider || credentialProvider !== modelProvider) {
    return {
      kind: "denied",
      message: `No request credential is configured for model provider "${params.provider}".`,
    };
  }

  const apiKey = credential.apiKey.trim();
  if (!apiKey) {
    return {
      kind: "denied",
      message: `No request credential is configured for model provider "${params.provider}".`,
    };
  }

  return { kind: "request", apiKey };
}
