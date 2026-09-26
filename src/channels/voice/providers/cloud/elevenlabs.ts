import { ITTSProvider } from "../index.js";
import type { NeerConfig } from "../../../../config/config.js";
import WebSocket from "ws";

export class ElevenLabsTTSProvider implements ITTSProvider {
    private apiKey: string;
    private voiceId: string;

    constructor(config: NeerConfig) {
        this.apiKey = process.env.ELEVENLABS_API_KEY || "";
        this.voiceId = config.voice?.tts?.elevenlabs?.voiceId || "21m00Tcm4TlvDq8ikWAM"; // Default generic voice
    }

    async *synthesizeStream(textStream: AsyncIterable<string>): AsyncIterable<Buffer> {
        if (!this.apiKey) {
            console.warn("ElevenLabs API key missing for TTS");
            return;
        }

        const wsUrl = `wss://api.elevenlabs.io/v1/text-to-speech/${this.voiceId}/stream-input?model_id=eleven_turbo_v2_5`;
        const ws = new WebSocket(wsUrl);

        let isWsOpen = false;
        let wsError: Error | null = null;
        let wsClosed = false;

        // We use a queue to buffer incoming audio chunks from ElevenLabs WS
        const audioQueue: Buffer[] = [];
        let resolveNextChunk: ((chunk: Buffer | null) => void) | null = null;

        ws.on("open", () => {
            isWsOpen = true;
            ws.send(JSON.stringify({
                text: " ",
                voice_settings: { stability: 0.5, similarity_boost: 0.5 },
                xi_api_key: this.apiKey
            }));
        });

        ws.on("message", (data: WebSocket.Data) => {
            try {
                const response = JSON.parse(data.toString());
                if (response.audio) {
                    const chunk = Buffer.from(response.audio, "base64");
                    if (resolveNextChunk) {
                        resolveNextChunk(chunk);
                        resolveNextChunk = null;
                    } else {
                        audioQueue.push(chunk);
                    }
                }
                if (response.isFinal) {
                    if (resolveNextChunk) resolveNextChunk(null);
                    wsClosed = true;
                }
            } catch (e) {
                // Ignored, not all frames might be json or audio
            }
        });

        ws.on("error", (err) => {
            wsError = err;
            if (resolveNextChunk) resolveNextChunk(null);
        });

        ws.on("close", () => {
            wsClosed = true;
            if (resolveNextChunk) resolveNextChunk(null);
        });

        // Wait until WS opens
        while (!isWsOpen && !wsError && !wsClosed) {
            await new Promise(r => setTimeout(r, 10));
        }

        if (wsError || wsClosed) {
            console.error("ElevenLabs WS failed to open", wsError);
            return;
        }

        // Helper to pull chunks asynchronously
        const nextAudioChunk = async (): Promise<Buffer | null> => {
            if (audioQueue.length > 0) return audioQueue.shift()!;
            if (wsClosed || wsError) return null;
            return new Promise<Buffer | null>(resolve => {
                resolveNextChunk = resolve;
            });
        };

        // We start piping the texts into the websocket eagerly, but don't await them directly 
        // inside the yielding loop to keep yielding fast.
        const sendTextsToElevenLabs = async () => {
            try {
                for await (const sentence of textStream) {
                    if (!sentence.trim()) continue;
                    ws.send(JSON.stringify({
                        text: sentence,
                        try_trigger_generation: true
                    }));
                }
                // Signal EOS
                ws.send(JSON.stringify({ text: "" }));
            } catch (e) {
                console.error("ElevenLabs text pumping failed:", e);
            }
        };

        // Start text pumper in background
        void sendTextsToElevenLabs();

        // Yield audio chunks as they arrive from the WS
        while (true) {
            const chunk = await nextAudioChunk();
            if (!chunk) break;
            yield chunk;
        }

        if (ws.readyState === WebSocket.OPEN) {
            ws.close();
        }
    }
}
