import type { IncomingMessage, ServerResponse } from "node:http";
import { readJsonBody } from "./hooks.js";
import { resolveHookTargetAgentId } from "./hooks.js";
import type { HookMessageChannel } from "./hooks.js";

type RunHandlerOpts = {
    dispatchAgentHook: (value: {
        message: string;
        name: string;
        agentId?: string;
        wakeMode: "now" | "next-heartbeat";
        sessionKey: string;
        deliver: boolean;
        channel: HookMessageChannel;
        model?: string;
    }) => string;
};

export async function handleRunHttpRequest(
    req: IncomingMessage,
    res: ServerResponse,
    opts: RunHandlerOpts,
): Promise<boolean> {
    if (req.method !== "POST") {
        return false;
    }
    const url = new URL(req.url ?? "/", "http://localhost");
    if (url.pathname !== "/api/run") {
        return false;
    }

    const body = await readJsonBody(req, 1024 * 1024); // 1MB max
    if (!body.ok) {
        res.statusCode = 400;
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ ok: false, error: body.error }));
        return true;
    }

    const payload = (body.value as any) || {};
    const message = payload.message;
    const agentId = payload.agentId;

    if (!message || typeof message !== "string") {
        res.statusCode = 400;
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ ok: false, error: "Missing or invalid 'message'" }));
        return true;
    }

    // Generate a session key for this run. For a desktop app, we might want a persistent session.
    // For now, let's use a "desktop-default" session or a random one if not provided.
    const sessionKey = payload.sessionKey || `desktop-session-${Date.now()}`;

    try {
        const runId = opts.dispatchAgentHook({
            message,
            name: "Desktop User",
            agentId, // Optional, defaults to default agent
            wakeMode: "now",
            sessionKey,
            deliver: true,
            channel: "http-hook", // We can define a new channel type later if needed
        });

        res.statusCode = 202;
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ ok: true, runId, sessionKey }));
    } catch (err) {
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ ok: false, error: String(err) }));
    }

    return true;
}
