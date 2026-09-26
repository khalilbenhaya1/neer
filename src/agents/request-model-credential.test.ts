import { describe, expect, it } from "vitest";
import { resolveRequestScopedProviderCredential } from "./request-model-credential.js";

describe("resolveRequestScopedProviderCredential", () => {
  it("preserves local credential lookup when no request key is supplied", () => {
    expect(resolveRequestScopedProviderCredential({ provider: "openai" })).toEqual({
      kind: "local",
    });
  });

  it("returns a matching request key after trimming surrounding whitespace", () => {
    expect(
      resolveRequestScopedProviderCredential({
        provider: "openai",
        credential: { provider: " OpenAI ", apiKey: "  request-key  " },
      }),
    ).toEqual({ kind: "request", apiKey: "request-key" });
  });

  it("fails closed when the request key belongs to a different provider", () => {
    const result = resolveRequestScopedProviderCredential({
      provider: "anthropic",
      credential: { provider: "openai", apiKey: "do-not-include-in-errors" },
    });

    expect(result.kind).toBe("denied");
    expect(JSON.stringify(result)).not.toContain("do-not-include-in-errors");
  });

  it("fails closed when an explicit request key is empty", () => {
    expect(
      resolveRequestScopedProviderCredential({
        provider: "openai",
        credential: { provider: "openai", apiKey: "  " },
      }),
    ).toMatchObject({ kind: "denied" });
  });
});
