import type { Drives } from "../drives.js";
import type { SelfState } from "./self-state.js";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Intent =
    | "observe"
    | "initiate"
    | "reflect"
    | "escalate"
    | "withdraw"
    | null;

// ─── Constants ────────────────────────────────────────────────────────────────

const INACTIVITY_THRESHOLD_MS = 15 * 1000;          // 15 seconds
const URGENT_INACTIVITY_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

// ─── Decision logic ───────────────────────────────────────────────────────────

/**
 * Decides NEER's proactive intent based on drives, current self-state,
 * and how long the user has been inactive.
 *
 * Returns null if the situation calls for silence.
 */
export function decideIntent(
    drives: Drives,
    selfState: SelfState,
    inactivityMs: number,
): Intent {
    // 1. Not enough inactivity yet — no action needed.
    if (inactivityMs < INACTIVITY_THRESHOLD_MS) {
        return null;
    }

    // 2. High frustration — withdraw.
    if (selfState.frustration > 0.6) {
        return "withdraw";
    }

    // 3. Social need branch — governed by how many times NEER has been ignored.
    if (drives.social_need > 0.75) {
        if (selfState.ignoredAttempts === 0) {
            return "initiate";
        }
        if (selfState.ignoredAttempts === 1) {
            return "reflect";
        }
        if (selfState.ignoredAttempts >= 2) {
            // After 2 ignored attempts, escalate only if urgently isolated; else withdraw.
            return inactivityMs > URGENT_INACTIVITY_THRESHOLD_MS ? "escalate" : "withdraw";
        }
    }

    // 4. Boredom with recent user activity → passive observe.
    if (drives.boredom > 0.8 && inactivityMs < URGENT_INACTIVITY_THRESHOLD_MS) {
        return "observe";
    }

    return null;
}
