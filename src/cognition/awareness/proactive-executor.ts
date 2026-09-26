import type { Intent } from "./intent-engine.js";
import type { SelfState } from "./self-state.js";

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * A function that performs the actual LLM invocation for a proactive intent.
 * Registered by the gateway after the runtime context is ready.
 * Intent is always non-null here — null intents are filtered before calling.
 */
export type ProactiveTrigger = (intent: NonNullable<Intent>, selfState: SelfState) => Promise<void>;

// ─── Registry ─────────────────────────────────────────────────────────────────

let registeredTrigger: ProactiveTrigger | null = null;

/**
 * Called once from server.impl.ts after the gateway context is ready.
 * Provides the live-loop with access to the LLM execution pipeline.
 */
export function registerProactiveTrigger(fn: ProactiveTrigger): void {
    registeredTrigger = fn;
    console.log("[Awareness] Proactive trigger registered.");
}

/**
 * Called from live-loop when intent is decided.
 * Delegates to the registered gateway trigger if available.
 */
export async function fireProactiveTrigger(
    intent: Intent,
    selfState: SelfState,
): Promise<void> {
    if (!registeredTrigger) {
        console.warn("[Awareness] No proactive trigger registered — gateway not yet wired.");
        return;
    }
    if (!intent) {
        return;
    }
    try {
        await registeredTrigger(intent, selfState);
    } catch (err) {
        console.warn("[Awareness] Proactive trigger failed:", err);
    }
}
