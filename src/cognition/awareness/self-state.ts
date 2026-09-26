import fs from "node:fs/promises";
import path from "node:path";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Mood =
    | "calm"
    | "curious"
    | "restless"
    | "lonely"
    | "withdrawn";

export interface SelfState {
    mood: Mood;
    frustration: number;          // 0 → 1
    attentionFocus: "user" | "internal";
    ignoredAttempts: number;
    lastIntent?: string;
    lastDecisionAt: number;
}

// ─── Persistence ──────────────────────────────────────────────────────────────

const SELF_STATE_PATH = path.join(process.cwd(), "data", "self-state.json");

const DEFAULT_STATE: SelfState = {
    mood: "calm",
    frustration: 0,
    attentionFocus: "internal",
    ignoredAttempts: 0,
    lastIntent: undefined,
    lastDecisionAt: 0,
};

async function ensureDataDir(): Promise<void> {
    await fs.mkdir(path.dirname(SELF_STATE_PATH), { recursive: true });
}

function clampFrustration(value: number): number {
    return Math.max(0, Math.min(1, value));
}

export async function loadSelfState(): Promise<SelfState> {
    try {
        await ensureDataDir();
        const raw = await fs.readFile(SELF_STATE_PATH, "utf-8");
        const parsed = JSON.parse(raw) as Partial<SelfState>;
        return {
            ...DEFAULT_STATE,
            ...parsed,
            frustration: clampFrustration(parsed.frustration ?? 0),
        };
    } catch (err) {
        if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
            console.warn("[Awareness] Failed to load self-state, using defaults:", err);
        }
        return { ...DEFAULT_STATE };
    }
}

export async function saveSelfState(state: SelfState): Promise<void> {
    try {
        await ensureDataDir();
        await fs.writeFile(SELF_STATE_PATH, JSON.stringify(state, null, 2), "utf-8");
    } catch (err) {
        console.warn("[Awareness] Failed to save self-state:", err);
    }
}
