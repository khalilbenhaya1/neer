import type { IncomingMessage, ServerResponse } from "node:http";
import { VERSION } from "../version.js";

export async function handleStatusHttpRequest(
    req: IncomingMessage,
    res: ServerResponse,
): Promise<boolean> {
    if (req.method !== "GET") {
        return false;
    }
    const url = new URL(req.url ?? "/", "http://localhost");
    if (url.pathname !== "/api/status") {
        return false;
    }

    const version = VERSION;
    const status = {
        ok: true,
        service: "neer-core",
        version,
        uptime: process.uptime(),
        timestamp: Date.now(),
    };

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    res.end(JSON.stringify(status));
    return true;
}
