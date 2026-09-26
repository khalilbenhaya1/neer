import { describe, expect, it } from "vitest";
import { SaasRateLimiter } from "./rate-limit.js";

describe("central SaaS rate limit policy", () => {
  it("uses fixed windows and returns retry-after once the policy is exceeded", async () => {
    let count = 0;
    const seen: Array<{ bucketKeyHash: string; windowStartedAt: Date; expiresAt: Date }> = [];
    const limiter = new SaasRateLimiter(
      {
        async consumeRateLimit(input) {
          seen.push(input);
          return ++count;
        },
      },
      () => new Date("2026-01-01T00:00:30.000Z"),
    );
    for (let index = 0; index < 5; index++) {
      expect(await limiter.consume("register", "203.0.113.5")).toEqual({ allowed: true });
    }
    expect(await limiter.consume("register", "203.0.113.5")).toMatchObject({
      allowed: false,
      retryAfterSeconds: 30,
    });
    expect(seen[0]?.bucketKeyHash).not.toContain("203.0.113.5");
    expect(seen[0]?.windowStartedAt.toISOString()).toBe("2026-01-01T00:00:00.000Z");
  });
});
