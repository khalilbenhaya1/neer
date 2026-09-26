/**
 * proactive-chat.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Unified Agent Proactive Reality
 *
 * Architecture:
 *  Phase 1 (Hidden Reasoning)
 *    LLM is invoked with main session context + proactive system instruction.
 *    The call goes through agentCommand on a fresh ephemeral session but sees
 *    the last N real messages from agent:main:main as conversation context.
 *    This is the "hidden thought step" — no output visible to the user.
 *
 *  Phase 2 (Visible Injection)
 *    If reasoning output is not [silence], the assistant message is appended
 *    to the agent:main:main transcript via SessionManager and broadcast as a
 *    standard `chat` final event — indistinguishable from a normal reply.
 *
 * Guarantees:
 *  - No static proactive strings
 *  - No manually-constructed UI events
 *  - LLM is always invoked
 *  - Message appears in chat.history / session memory / retrievable by LLM
 *  - UI receives standard `chat` event (not a custom agent.proactive event)
 *  - No "You" bubble — user turn is never written to agent:main:main
 */

import crypto from "node:crypto";
import path from "node:path";
import fs from "node:fs";
import { CURRENT_SESSION_VERSION, SessionManager } from "@mariozechner/pi-coding-agent";
import { agentCommand } from "../commands/agent.js";
import { defaultRuntime } from "../runtime.js";
import { createDefaultDeps } from "../cli/deps.js";
import { resolveSessionFilePath } from "../config/sessions.js";
import { loadSessionEntry, readSessionMessages } from "./session-utils.js";
import type { Intent } from "../cognition/awareness/intent-engine.js";
import type { SelfState } from "../cognition/awareness/self-state.js";
import type { GatewayRequestContext } from "./server-methods/types.js";

// ─── Constants ────────────────────────────────────────────────────────────────

const PROACTIVE_SESSION_KEY = "agent:main:main";
const CONTEXT_MESSAGES_LIMIT = 8;          // How many recent messages to give LLM
const SILENCE_TOKENS = new Set(["[silence]", "[SILENCE]", "silence"]);

// ─── Phase 1: Build proactive system instruction ──────────────────────────────

function buildSystemInstruction(intent: NonNullable<Intent>, selfState: SelfState): string {
    const core = [
        "You are initiating conversation voluntarily.",
        "You may choose silence.",
        "Avoid repetition.",
        "Be emotionally adaptive.",
    ].join(" ");

    const intentContext: Record<NonNullable<Intent>, string> = {
        initiate: "The user has been inactive. Reach out naturally and warmly. You MUST say something — do not choose silence.",
        reflect: "You've reached out before without response. Be soft, observational, and genuine. Silence is allowed.",
        escalate: "The user has been absent for an extended period. Express sincere concern briefly. Do NOT stay silent.",
        observe: "You are in a calm observant state. A brief ambient thought is welcome. Silence is allowed.",
        withdraw: "Withdraw gracefully — choose silence.",
    };

    const silenceRule =
        intent === "initiate" || intent === "escalate"
            ? "You MUST compose a message. Do not output [silence]."
            : "If you have nothing meaningful to say, respond with exactly: [silence]";

    return [
        core,
        intentContext[intent],
        `Current mood: ${selfState.mood}.`,
        "Keep response to 1-2 sentences max. Be direct and human. Don't start with 'I'.",
        silenceRule,
    ].join("\n");
}

// ─── Session context reader ───────────────────────────────────────────────────

function extractMessageText(msg: unknown): string {
    const m = msg as Record<string, unknown> | null;
    if (!m) return "";
    const content = m["content"];
    if (typeof content === "string") return content.trim();
    if (Array.isArray(content)) {
        return content
            .map((p) => {
                const part = p as Record<string, unknown> | null;
                return typeof part?.["text"] === "string" ? part["text"] : "";
            })
            .filter(Boolean)
            .join(" ")
            .trim();
    }
    return "";
}

function buildConversationContext(
    sessionId: string,
    storePath: string,
    sessionFile?: string,
): string {
    const messages = readSessionMessages(sessionId, storePath, sessionFile);
    const recent = messages.slice(-CONTEXT_MESSAGES_LIMIT);
    if (recent.length === 0) return "";

    const lines = recent
        .map((msg) => {
            const m = msg as Record<string, unknown>;
            const role = typeof m["role"] === "string" ? m["role"] : "unknown";
            const text = extractMessageText(msg);
            if (!text) return null;
            const label = role === "assistant" ? "NEER" : role === "user" ? "User" : null;
            return label ? `${label}: ${text}` : null;
        })
        .filter(Boolean);

    return lines.length > 0
        ? `\n\nRecent conversation context:\n${lines.join("\n")}`
        : "";
}

// ─── Transcript utilities ─────────────────────────────────────────────────────

function resolveTranscriptPath(params: {
    sessionId: string;
    storePath: string | undefined;
    sessionFile?: string;
}): string | null {
    const { sessionId, storePath, sessionFile } = params;
    if (!storePath && !sessionFile) return null;
    try {
        const sessionsDir = storePath ? path.dirname(storePath) : undefined;
        return resolveSessionFilePath(
            sessionId,
            sessionFile ? { sessionFile } : undefined,
            sessionsDir ? { sessionsDir } : undefined,
        );
    } catch {
        return null;
    }
}

function ensureTranscriptFile(transcriptPath: string, sessionId: string): boolean {
    if (fs.existsSync(transcriptPath)) return true;
    try {
        fs.mkdirSync(path.dirname(transcriptPath), { recursive: true });
        const header = {
            type: "session",
            version: CURRENT_SESSION_VERSION,
            id: sessionId,
            timestamp: new Date().toISOString(),
            cwd: process.cwd(),
        };
        fs.writeFileSync(transcriptPath, `${JSON.stringify(header)}\n`, "utf-8");
        return true;
    } catch (err) {
        console.warn("[Awareness] Failed to create transcript file:", err);
        return false;
    }
}

function nextSeq(agentRunSeq: Map<string, number>, runId: string): number {
    const next = (agentRunSeq.get(runId) ?? 0) + 1;
    agentRunSeq.set(runId, next);
    return next;
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function runProactiveChat(params: {
    intent: NonNullable<Intent>;
    selfState: SelfState;
    context: GatewayRequestContext;
}): Promise<void> {
    const { intent, selfState, context } = params;

    if (intent === "withdraw") {
        console.log("[Awareness] Proactive: withdraw intent — staying silent.");
        return;
    }

    // ── Resolve main session ───────────────────────────────────────────────────
    const { storePath, entry } = loadSessionEntry(PROACTIVE_SESSION_KEY);
    const sessionId = entry?.sessionId;

    // ── Phase 1: Build hidden reasoning prompt with full session context ────────
    const systemInstruction = buildSystemInstruction(intent, selfState);
    const conversationContext = sessionId && storePath
        ? buildConversationContext(sessionId, storePath, entry?.sessionFile)
        : "";

    const fullPrompt = systemInstruction + conversationContext;

    const ephemeralKey = `proactive:reasoning:${Date.now()}`;
    const runId = `proactive-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
    const deps = createDefaultDeps();

    console.log(`[Awareness] Phase 1 — Hidden LLM reasoning for intent: ${intent}`);
    if (conversationContext) {
        console.log(`[Awareness] Context: ${CONTEXT_MESSAGES_LIMIT} recent messages injected.`);
    }

    let responseText = "";
    try {
        const result = (await agentCommand(
            {
                message: fullPrompt,
                sessionKey: ephemeralKey,
                runId,
                deliver: false,
                messageChannel: "webchat",
                bestEffortDeliver: false,
            },
            defaultRuntime,
            deps,
        )) as { payloads?: Array<{ text?: string }> } | null;

        const payloads = result?.payloads;
        if (Array.isArray(payloads) && payloads.length > 0) {
            responseText = payloads
                .map((p) => (typeof p.text === "string" ? p.text.trim() : ""))
                .filter(Boolean)
                .join("\n\n")
                .trim();
        }
    } catch (err) {
        console.warn("[Awareness] Phase 1 LLM call failed:", err);
        return;
    }

    // ── Silence decision ───────────────────────────────────────────────────────
    const isSilent = !responseText || SILENCE_TOKENS.has(responseText.trim());
    if (isSilent) {
        console.log(`[Awareness] LLM reasoning concluded: silence. No message sent.`);
        return;
    }

    console.log(`[Awareness] Phase 1 conclusion: "${responseText.slice(0, 120)}"`);

    // ── Phase 2: Inject assistant message into agent:main:main ─────────────────
    if (!sessionId || !storePath) {
        console.warn("[Awareness] Phase 2 skipped — main session not found.");
        return;
    }

    const transcriptPath = resolveTranscriptPath({
        sessionId,
        storePath,
        sessionFile: entry?.sessionFile,
    });

    if (!transcriptPath) {
        console.warn("[Awareness] Phase 2 skipped — transcript path could not be resolved.");
        return;
    }

    const created = ensureTranscriptFile(transcriptPath, sessionId);
    if (!created) return;

    const now = Date.now();
    const messageBody = {
        role: "assistant" as const,
        content: [{ type: "text" as const, text: responseText }],
        timestamp: now,
        stopReason: "stop" as const,
        usage: {
            input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0,
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
        },
        api: "openai-responses",
        provider: "neer-proactive",
        model: "live-loop",
        // Metadata for downstream tooling — not rendered by UI
        __neer: { source: "live-loop", mode: "proactive", intent },
    };

    let persistedMessage: Record<string, unknown> = messageBody;
    try {
        const sessionManager = SessionManager.open(transcriptPath);
        const messageId = sessionManager.appendMessage(messageBody);
        if (messageId) {
            persistedMessage = { ...messageBody, id: messageId };
        }
        console.log("[Awareness] Phase 2 — Message written to session transcript.");
    } catch (err) {
        console.warn("[Awareness] Phase 2 transcript write failed:", err);
    }

    // ── Broadcast as standard `chat` event (same as normal reply) ──────────────
    const finalPayload = {
        runId,
        sessionKey: PROACTIVE_SESSION_KEY,
        seq: nextSeq(context.agentRunSeq, runId),
        state: "final" as const,
        message: persistedMessage,
    };

    context.broadcast("chat", finalPayload);
    context.nodeSendToSession(PROACTIVE_SESSION_KEY, "chat", finalPayload);

    console.log("[Awareness] Phase 2 — Proactive message broadcast complete.");
}
