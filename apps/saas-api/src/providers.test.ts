import { describe, expect, it, vi } from "vitest";
import { normalizeProviderCredential, validateProviderCredential } from "./providers.js";

describe("provider credential validation", () => {
  it("rejects control characters and oversized key inputs", () => {
    expect(normalizeProviderCredential("  key  ")).toBe("key");
    expect(normalizeProviderCredential("key\r\nInjected: yes")).toBeNull();
    expect(normalizeProviderCredential("x".repeat(4097))).toBeNull();
  });

  it("sends provider secrets only in headers to fixed HTTPS endpoints", async () => {
    const fetcher = vi.fn(async (_url: string | URL | Request, _init?: RequestInit) => new Response(null, { status: 200 }));
    const result = await validateProviderCredential({
      provider: "google",
      apiKey: "google-secret",
      fetcher: fetcher as typeof fetch,
    });
    expect(result).toBe("connected");
    const [url, init] = fetcher.mock.calls[0]!;
    expect(String(url)).toBe("https://generativelanguage.googleapis.com/v1beta/models?pageSize=1");
    expect(String(url)).not.toContain("google-secret");
    expect(init?.headers).toMatchObject({ "x-goog-api-key": "google-secret" });
    expect(init?.redirect).toBe("error");
  });

  it("does not expose provider error bodies and classifies validation responses safely", async () => {
    const unauthorizedFetch = vi.fn(async () => new Response("contains-secret", { status: 401 }));
    const unavailableFetch = vi.fn(async () => new Response("provider-private-detail", { status: 503 }));
    expect(
      await validateProviderCredential({ provider: "openai", apiKey: "openai-secret", fetcher: unauthorizedFetch }),
    ).toBe("invalid");
    expect(
      await validateProviderCredential({ provider: "anthropic", apiKey: "anthropic-secret", fetcher: unavailableFetch }),
    ).toBe("unavailable");
  });
});
