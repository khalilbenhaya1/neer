import { createHash } from "node:crypto";
import type { SaasRepository } from "./types.js";

export const RATE_LIMIT_POLICIES = {
  register: { windowSeconds: 60, max: 5 },
  login: { windowSeconds: 60, max: 10 },
  passwordReset: { windowSeconds: 900, max: 5 },
  providerConnect: { windowSeconds: 60, max: 5 },
  providerValidate: { windowSeconds: 60, max: 10 },
  modelPreference: { windowSeconds: 60, max: 30 },
  agentRun: { windowSeconds: 60, max: 20 },
} as const;

export type RateLimitAction = keyof typeof RATE_LIMIT_POLICIES;
export type RateLimitResult = { allowed: true } | { allowed: false; retryAfterSeconds: number };

export class SaasRateLimiter {
  constructor(
    private readonly repository: Pick<SaasRepository, "consumeRateLimit">,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async consume(action: RateLimitAction, actor: string): Promise<RateLimitResult> {
    const policy = RATE_LIMIT_POLICIES[action];
    const now = this.now();
    const windowMs = policy.windowSeconds * 1000;
    const windowStart = Math.floor(now.getTime() / windowMs) * windowMs;
    const windowStartedAt = new Date(windowStart);
    const expiresAt = new Date(windowStart + windowMs);
    const bucketKeyHash = createHash("sha256")
      .update(`${action}\0${actor}`, "utf8")
      .digest("hex");
    const count = await this.repository.consumeRateLimit({
      bucketKeyHash,
      windowStartedAt,
      expiresAt,
    });
    if (count <= policy.max) {
      return { allowed: true };
    }
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((expiresAt.getTime() - now.getTime()) / 1000)),
    };
  }
}
