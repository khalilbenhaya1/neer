import { ISTTProvider, ITTSProvider } from "../index.js";
import type { NeerConfig } from "../../../../config/config.js";
import { resolveModelAuthKey } from "../../../../model-auth.js";

export class OpenAISTTProvider implements ISTTProvider {
    private apiKey: string;
    private audioBuffer: Buffer[] = [];

    constructor(config: NeerConfig) {
        // Attempt to grab OpenAI base key, fallback to empty string and error out later
        const key = config.auth?.profiles?.["openai"]?.mode === "api_key"
            ? config.auth?.profiles?.["openai"]
            : undefined;

        // We try to pull from env primarily
        this.apiKey = process.env.OPENAI_API_KEY || (key as any)?.token || "";
    }

    processAudioChunk(chunk: Buffer): void {
        this.audioBuffer.push(chunk);
    }

    async flush(): Promise<string | null> {
        if (!this.apiKey) {
            console.warn("OpenAI API key missing for STT");
            return null;
        }

        if (this.audioBuffer.length === 0) return null;

        const fullBuffer = Buffer.concat(this.audioBuffer);
        this.reset(); // clear buffer for next phrase

        const formData = new FormData();
        formData.append("file", new Blob([fullBuffer], { type: "audio/webm" }), "audio.webm");
        formData.append("model", "whisper-1");
        formData.append("response_format", "text");

        try {
            const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${this.apiKey}`
                },
                body: formData
            });

            if (!response.ok) {
                console.error("OpenAI STT error:", await response.text());
                return null;
            }

            return await response.text();
        } catch (e) {
            console.error("Failed to call OpenAI STT:", e);
            return null;
        }
    }

    reset(): void {
        this.audioBuffer = [];
    }
}

export class OpenAITTSProvider implements ITTSProvider {
    private apiKey: string;
    private voice: string;

    constructor(config: NeerConfig) {
        this.apiKey = process.env.OPENAI_API_KEY || "";
        this.voice = config.messages?.tts?.openai?.voice || "nova";
    }

    async *synthesizeStream(textStream: AsyncIterable<string>): AsyncIterable<Buffer> {
        if (!this.apiKey) {
            console.warn("OpenAI API key missing for TTS");
            return;
        }

        for await (const sentence of textStream) {
            if (!sentence.trim()) continue;

            try {
                const response = await fetch("https://api.openai.com/v1/audio/speech", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${this.apiKey}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        model: "tts-1",
                        input: sentence,
                        voice: this.voice,
                        response_format: "mp3"
                    })
                });

                if (!response.ok || !response.body) {
                    console.error("OpenAI TTS error on sentence:", sentence, await response.text());
                    continue;
                }

                // We convert the ReadableStream into an async iterable of Buffers
                const reader = response.body.getReader();
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    // value is Uint8Array
                    yield Buffer.from(value);
                }
            } catch (e) {
                console.error("Failed to call OpenAI TTS:", e);
            }
        }
    }
}
