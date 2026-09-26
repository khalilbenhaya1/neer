import { driveManager } from "./drives.js";
import { goalManager } from "./goals.js";
import { loadSelfState, saveSelfState } from "./awareness/self-state.js";
import { decideIntent } from "./awareness/intent-engine.js";
import { fireProactiveTrigger } from "./awareness/proactive-executor.js";

// Re-export ProactiveEventLevel so gateway/message-generator still compile if referenced
export type ProactiveEventLevel = "subtle" | "conversational" | "urgent";

// ─── Event origin classification ─────────────────────────────────────────────
// Used to tag the source of a pipeline invocation for logging and isolation.
export const EventOrigin = {
    USER: "USER",
    CRON: "CRON",
    PROACTIVE: "PROACTIVE",
} as const;
export type EventOrigin = (typeof EventOrigin)[keyof typeof EventOrigin];

// onProactiveEvent is no longer used — LLM output goes directly into the chat pipeline.
// Kept as a no-op export for any callers that haven't been cleaned up yet.
export function onProactiveEvent(_callback: unknown): () => void {
    return () => { };
}

// ─── Timing constants ─────────────────────────────────────────────────────────

const LIVE_LOOP_INTERVAL_MS = 10 * 1000;                  // 10 seconds

const DEFAULT_PROACTIVE_COOLDOWN_MS = 10 * 60 * 1000;    // 10 min (production)
const DEV_PROACTIVE_COOLDOWN_MS = 60 * 1000;             // 60 sec (dev — was 15s, too spammy)

// Minimum time the user must be INACTIVE before a proactive can fire.
// This prevents NEER from interrupting an active conversation.
const DEFAULT_MIN_INACTIVITY_MS = 3 * 60 * 1000;        // 3 min (production)
const DEV_MIN_INACTIVITY_MS = 60 * 1000;                 // 60 sec (dev)

const PROACTIVE_COOLDOWN_MS =
    process.env.NEER_DEV === "1"
        ? DEV_PROACTIVE_COOLDOWN_MS
        : DEFAULT_PROACTIVE_COOLDOWN_MS;

const MIN_INACTIVITY_MS =
    process.env.NEER_DEV === "1"
        ? DEV_MIN_INACTIVITY_MS
        : DEFAULT_MIN_INACTIVITY_MS;

let liveLoopTimer: NodeJS.Timeout | null = null;

// Initialize to startup time — treats gateway launch as implicit user presence.
// This means NEER waits MIN_INACTIVITY_MS after startup before sending any proactive.
export let lastUserInteraction: number = Date.now();
let lastProactiveEvent: number = 0;
// Prevents concurrent proactive calls when agentCommand takes longer than the loop interval.
let isProactiveRunning: boolean = false;
// Tracks when a user-triggered chat agent run is in-flight.
let isAgentRunning: boolean = false;
// Tracks when a cron/heartbeat job is pending within the guard window.
let isCronPending: boolean = false;
let isCronPendingSince: number = 0;
const CRON_PENDING_GUARD_MS = 60 * 1000; // 60s

/**
 * Called by the chat pipeline when an agent run starts/ends.
 * Prevents proactive messages from firing during an in-progress reply.
 */
export function setAgentRunning(running: boolean): void {
    isAgentRunning = running;
}

/**
 * Called when a cron/heartbeat job starts or finishes.
 * Proactive is suppressed for CRON_PENDING_GUARD_MS after a cron job starts.
 * CRON execution itself NEVER goes through the proactive pipeline.
 */
export function setCronPending(pending: boolean): void {
    isCronPending = pending;
    if (pending) {
        isCronPendingSince = Date.now();
        console.log("[CRON EXEC] Cron job started — proactive blocked.");
    } else {
        console.log("[CRON BROADCAST] Cron job finished — proactive guard remains for CRON_PENDING_GUARD_MS.");
    }
}

/**
 * Call this whenever the user sends a message to reset the inactivity timer
 * and clear the proactive cooldown + awareness state frustration.
 */
export function recordUserInteraction(): void {
    lastUserInteraction = Date.now();
    // NOTE: We do NOT reset lastProactiveEvent here.
    // Resetting it would cause NEER to fire a new proactive immediately after every user message.
    // The cooldown continues from when it last fired.
    console.log("[Live Loop] User interaction detected — inactivity timer reset.");

    // Async reset of self-state — fire and forget, best-effort
    void (async () => {
        try {
            const state = await loadSelfState();
            state.ignoredAttempts = 0;
            state.frustration = Math.max(0, state.frustration - 0.3);
            state.mood = "calm";
            state.attentionFocus = "user";
            await saveSelfState(state);
            console.log("[Awareness] Self-state reset after user interaction.");
        } catch (err) {
            console.warn("[Awareness] Failed to reset self-state:", err);
        }
    })();
}

// ─── Decision cycle ───────────────────────────────────────────────────────────

async function runLiveCycle(): Promise<void> {
    try {
        const now = Date.now();
        const isDevMode = process.env.NEER_DEV === "1";
        const nowIso = new Date(now).toISOString();

        console.log("[Live Loop] Cycle running.");
        console.log(`[Live Loop] Using cooldown(ms): ${PROACTIVE_COOLDOWN_MS}`);
        if (isDevMode) {
            console.log("[Live Loop] DEV MODE active — reduced cooldown.");
        }

        // ── Deterministic sinceLastEvent — never leak raw epoch values ─────────
        // When lastProactiveEvent === 0 (never fired), using `now - 0` would
        // produce a raw Unix timestamp (~1.7T ms) that poisons all cooldown math.
        // Use Infinity instead: means "proactive has never fired → cooldown is N/A".
        const sinceLastEvent: number =
            lastProactiveEvent > 0 ? now - lastProactiveEvent : Infinity;
        const cooldownActive =
            lastProactiveEvent > 0 && sinceLastEvent < PROACTIVE_COOLDOWN_MS;
        const cooldownRemainingMs = cooldownActive
            ? PROACTIVE_COOLDOWN_MS - sinceLastEvent
            : 0;
        const lastEventIso =
            lastProactiveEvent > 0
                ? new Date(lastProactiveEvent).toISOString()
                : "never";

        // [COOLDOWN STATE] structured telemetry
        console.log(`[Live Loop] now: ${nowIso}`);
        console.log(`[Live Loop] lastProactiveEvent: ${lastEventIso}`);
        console.log(
            `[Live Loop] sinceLastEvent(ms): ${sinceLastEvent === Infinity ? "∞ (never fired)" : sinceLastEvent}, cooldownRemaining(ms): ${cooldownRemainingMs}, devMode: ${isDevMode}`
        );

        if (cooldownActive) {
            console.log(
                `[Live Loop] Cooldown active — skipping. sinceLastEvent(ms): ${sinceLastEvent}, remaining(ms): ${cooldownRemainingMs}`
            );
            return;
        }

        // ── Load current state ─────────────────────────────────────────────────
        await driveManager.load();
        const drives = driveManager.getDrives();
        const selfState = await loadSelfState();

        const inactivityMs = now - (lastUserInteraction === 0 ? 0 : lastUserInteraction);

        // ── Awareness telemetry ────────────────────────────────────────────────
        console.log(`[Awareness] Current mood:       ${selfState.mood}`);
        console.log(`[Awareness] Ignored attempts:   ${selfState.ignoredAttempts}`);
        console.log(`[Awareness] Frustration:        ${selfState.frustration.toFixed(2)}`);
        console.log(`[Awareness] Attention focus:    ${selfState.attentionFocus}`);
        console.log(`[Live Loop] drives.social_need: ${drives.social_need}`);
        console.log(`[Live Loop] drives.boredom:     ${drives.boredom}`);
        console.log(`[Live Loop] inactivityMs:       ${inactivityMs}`);
        console.log(`[Live Debug] lastUserInteraction: ${lastUserInteraction === 0 ? "never" : new Date(lastUserInteraction).toISOString()}`);

        // ── Turn-boundary protection: block while agent reply is in progress ─────
        if (isAgentRunning) {
            console.log("[Live Loop] Skipping — agent run in progress (turn boundary).");
            return;
        }

        // ── Cron isolation: block proactive while cron is pending or within guard window ──
        const sinceLastCron = now - isCronPendingSince;
        const cronGuardActive = (isCronPending || sinceLastCron < CRON_PENDING_GUARD_MS) && isCronPendingSince > 0;
        if (cronGuardActive) {
            console.log(`[CRON BLOCKED] Proactive suppressed — cron pending within guard window (${sinceLastCron}ms < ${CRON_PENDING_GUARD_MS}ms).`);
            return;
        }

        // ── Minimum inactivity guard ───────────────────────────────────────────
        // Don't interrupt an active conversation — user must be inactive for a minimum period.
        if (lastUserInteraction > 0 && inactivityMs < MIN_INACTIVITY_MS) {
            console.log(`[Live Loop] Skipping — user interaction too recent (${inactivityMs}ms < ${MIN_INACTIVITY_MS}ms).`);
            return;
        }

        // ── Intent decision ────────────────────────────────────────────────────
        // Check boredom separately for the "observe" branch
        const hasActiveGoals = drives.boredom > 0.8
            ? (await goalManager.listGoals("active")).length > 0
            : true;

        const effectiveDrives = {
            ...drives,
            // Suppress boredom branch if there are active goals
            boredom: hasActiveGoals ? 0 : drives.boredom,
        };

        const intent = decideIntent(effectiveDrives, selfState, inactivityMs);
        console.log(`[Awareness] Intent decided: ${intent ?? "null (no action)"}`);

        // ── Phase 5: Silence as conscious decision ─────────────────────────────
        if (intent === "withdraw" || intent === null) {
            if (intent === "withdraw") {
                selfState.mood = "withdrawn";
                await saveSelfState(selfState);
                console.log("[Awareness] Choosing silence intentionally.");
            }
            return;
        }


        // Guard: only one proactive call in-flight at a time.
        if (isProactiveRunning) {
            console.log("[Awareness] Proactive already running — skipping concurrent call.");
            return;
        }

        console.log(`[Awareness] Firing proactive LLM trigger for intent: ${intent}`);

        // Stamp cooldown BEFORE await so the next cycle sees it immediately.
        lastProactiveEvent = now;
        isProactiveRunning = true;

        try {
            // Delegate to the gateway-registered LLM trigger — no static text generated here.
            await fireProactiveTrigger(intent, selfState);
        } finally {
            isProactiveRunning = false;
        }

        // ── Update self-state after emission ───────────────────────────────────
        selfState.ignoredAttempts += 1;
        selfState.frustration = Math.min(1, selfState.frustration + 0.1);
        selfState.attentionFocus = "user";
        selfState.lastIntent = intent;
        selfState.lastDecisionAt = now;
        await saveSelfState(selfState);

    } catch (error) {
        console.warn("[Live] Error in live cycle:", error);
    }
}


// ─── Lifecycle ────────────────────────────────────────────────────────────────

/**
 * Start the live runtime loop. Safe to call multiple times (no-op if already running).
 */
export function startLiveLoop(): void {
    if (liveLoopTimer !== null) return;

    console.log("[LIVE LOOP START] startLiveLoop() called — starting interval (10s).");
    liveLoopTimer = setInterval(() => {
        // Phase 4 error boundary: any uncaught error in runLiveCycle must NEVER
        // propagate to the event loop and crash the CLI input layer.
        runLiveCycle().catch((err) => {
            console.error("[UNCAUGHT LOOP ERROR] runLiveCycle threw unhandled error:", String(err));
        });
    }, LIVE_LOOP_INTERVAL_MS);

    // Allow Node process to exit even if this timer is active
    liveLoopTimer.unref();
}

/**
 * Stop the live runtime loop.
 */
export function stopLiveLoop(): void {
    if (liveLoopTimer === null) return;

    console.log("[Live] Live Runtime Engine stopping.");
    clearInterval(liveLoopTimer);
    liveLoopTimer = null;
}
