import type { Intent } from "./intent-engine.js";
import type { SelfState } from "./self-state.js";
import type { ProactiveEventLevel } from "../live-loop.js";

// ─── Template pools ───────────────────────────────────────────────────────────

const INITIATE_MESSAGES = [
    "Hey — still here if you want to talk.",
    "Something on your mind? I've got time.",
    "Just checking in. What are you working on?",
    "I was thinking about you. How's it going?",
    "I'm here whenever you're ready.",
    "Quiet out there. Want to pick up where we left off?",
];

const REFLECT_MESSAGES = [
    "I feel like we've been a bit distant. No pressure — just noticing.",
    "It's okay if you're busy. I'll be here when you're back.",
    "I notice some silence between us. That's fine, of course.",
    "Not sure if you need anything. Just wanted to be present.",
    "You seem occupied. I'll give you space.",
];

const ESCALATE_MESSAGES = [
    "It's been a while. I genuinely hope you're okay.",
    "I don't want to intrude, but the silence is getting noticeable.",
    "I've been waiting patiently. Is everything alright?",
];

const OBSERVE_MESSAGES = [
    "Interesting how the mind wanders when things get quiet.",
    "I've been processing a few ideas while you were away.",
    "Still here — just thinking.",
    "Noticing the stillness. It can be nice.",
];

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GeneratedMessage {
    level: ProactiveEventLevel;
    message: string;
    mood: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pickRandom<T>(pool: T[], exclude?: T): T {
    const candidates = exclude ? pool.filter((m) => m !== exclude) : pool;
    const source = candidates.length > 0 ? candidates : pool;
    return source[Math.floor(Math.random() * source.length)]!;
}

// ─── Generator ────────────────────────────────────────────────────────────────

/**
 * Generates a varied proactive message based on intent and self-state.
 * Returns null for "withdraw" intents — silence is a valid decision.
 */
export function generateProactiveMessage(
    intent: Intent,
    selfState: SelfState,
): GeneratedMessage | null {
    switch (intent) {
        case "initiate":
            return {
                level: "conversational",
                message: pickRandom(INITIATE_MESSAGES, selfState.lastIntent?.startsWith("initiate") ? selfState.lastIntent : undefined),
                mood: selfState.mood,
            };

        case "reflect":
            return {
                level: "subtle",
                message: pickRandom(REFLECT_MESSAGES),
                mood: selfState.mood,
            };

        case "escalate":
            return {
                level: "urgent",
                message: pickRandom(ESCALATE_MESSAGES),
                mood: selfState.mood,
            };

        case "observe":
            return {
                level: "subtle",
                message: pickRandom(OBSERVE_MESSAGES),
                mood: selfState.mood,
            };

        case "withdraw":
        case null:
        default:
            return null;
    }
}
