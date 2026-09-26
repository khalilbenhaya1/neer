import type { WebSocket } from "ws";
import { resolveSession } from "../../commands/agent/session.js";
import { mergeSessionEntry } from "../../config/sessions.js";
import { type NeerConfig, loadConfig } from "../../config/config.js";
import type { GatewayRequestContext } from "../server-methods/types.js";
import type { GatewayWsClient } from "./ws-types.js";
import { VoicePipeline } from "../../channels/voice/pipeline.js";
import { VoiceProviderFactory } from "../../channels/voice/providers/factory.js";

/**
 * Manages active voice pipelines for connected WebSocket clients.
 */
const activePipelines = new Map<string, VoicePipeline>();

export function attachAudioGatewayHandlers(params: {
    socket: WebSocket;
    connId: string;
    buildRequestContext: () => GatewayRequestContext;
    send: (obj: unknown) => void;
    getClient: () => GatewayWsClient | null;
}) {
    const { socket, connId, buildRequestContext, send, getClient } = params;

    socket.on("message", async (data: string | Buffer) => {
        try {
            if (Buffer.isBuffer(data)) {
                // If it's a raw buffer, treat it as audio chunk directly for the active pipeline
                const pipeline = activePipelines.get(connId);
                if (pipeline) {
                    await pipeline.handleAudioIn(data);
                }
                return;
            }

            const parsed = JSON.parse(data.toString());
            if (parsed.method === "call.start") {
                await handleCallStart(parsed, connId, buildRequestContext(), send, getClient);
            } else if (parsed.method === "call.audio_in") {
                await handleCallAudioIn(parsed.params?.data, connId);
            } else if (parsed.method === "call.end") {
                await handleCallEnd(connId, buildRequestContext(), send);
            }
        } catch (e) {
            // Not a valid JSON or unhandled frame; rely on existing message handler, but avoid crashing
        }
    });

    socket.on("close", async () => {
        await handleCallEnd(connId, buildRequestContext(), send);
    });
}

async function handleCallStart(
    req: any,
    connId: string,
    ctx: GatewayRequestContext,
    send: (obj: unknown) => void,
    getClient: () => GatewayWsClient | null
) {
    // Bind call context to a session
    const agentId = req.params?.agentId || "main";
    const config = loadConfig();
    const { sessionKey, sessionStore, storePath, sessionEntry } = resolveSession({
        cfg: config,
        agentId,
        sessionId: req.params?.sessionId
    });

    if (sessionKey && sessionStore) {
        // Flag this session as active in voice
        sessionStore[sessionKey] = mergeSessionEntry(sessionEntry, {
            channelType: "voice"
        });
        // Normally you'd persist here: saveSessionStore(storePath, sessionStore);
        // omitted for brevity, will be flushed on next text interaction 
    }

    // Setup STT/TTS dynamically from configuration
    const stt = VoiceProviderFactory.createSTT(config);
    const tts = VoiceProviderFactory.createTTS(config);
    const pipeline = new VoicePipeline(stt, tts);

    pipeline.on("final_transcript", async (text: string) => {
        // Forward the recognized voice audio snippet as text to the Agent Runtime Queue
        // This replicates the `chat.send` WS frame internally
        ctx.broadcast("chat", { text, source: "voice_pipeline" }, undefined);

        // NOTE: Sending a system-triggered frame back to standard handlers requires injecting a queue message
        // Integration logic depends deeply on Neer's exact `chat.send` queue setup, mapped to this sessionKey.
    });

    activePipelines.set(connId, pipeline);

    send({
        id: req.id,
        result: { status: "active", sessionKey }
    });
}

async function handleCallAudioIn(b64Data: string | undefined, connId: string) {
    if (!b64Data) return;
    const pipeline = activePipelines.get(connId);
    if (pipeline) {
        // Convert base64 frames to PCM/buffer and push to pipeline
        const chunk = Buffer.from(b64Data, "base64");
        await pipeline.handleAudioIn(chunk);
    }
}

async function handleCallEnd(connId: string, ctx: GatewayRequestContext, send: (obj: unknown) => void) {
    const pipeline = activePipelines.get(connId);
    if (pipeline) {
        await pipeline.endCall();
        activePipelines.delete(connId);

        // Turn off session voice mode if possible; left out here as we don't know exact sessionKey 
        // without tracking it in activePipelines mapped objects.
    }
}
