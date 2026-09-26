import type { NeerConfig } from "../../../config/config.js";
import { ISTTProvider, ITTSProvider } from "./index.js";
import { OpenAISTTProvider, OpenAITTSProvider } from "./cloud/openai.js";
import { ElevenLabsTTSProvider } from "./cloud/elevenlabs.js";

/**
 * Null Object Provider placeholders for when no provider or invalid provider is configured
 */
export class NullSttProvider implements ISTTProvider {
    processAudioChunk(chunk: Buffer): void {
        // noop
    }
    async flush(): Promise<string | null> {
        return null;
    }
    reset(): void {
        // noop
    }
}

export class NullTtsProvider implements ITTSProvider {
    async *synthesizeStream(textStream: AsyncIterable<string>): AsyncIterable<Buffer> {
        // yield nothing
    }
}

/**
 * Factory class that reads neer.json configuration and instantiates the selected STT and TTS providers into the pipeline
 */
export class VoiceProviderFactory {
    static createSTT(config: NeerConfig): ISTTProvider {
        const provider = config.voice?.stt?.provider;

        switch (provider) {
            case "openai":
                return new OpenAISTTProvider(config);
            case "local":
                // Fallback or unimplemented local STT
                console.warn("Local STT not yet implemented, returning Null provider");
                return new NullSttProvider();
            default:
                // Defaults to OpenAI if not explicitly configured otherwise
                return new OpenAISTTProvider(config);
        }
    }

    static createTTS(config: NeerConfig): ITTSProvider {
        const provider = config.voice?.tts?.provider;

        switch (provider) {
            case "openai":
                return new OpenAITTSProvider(config);
            case "elevenlabs":
                return new ElevenLabsTTSProvider(config);
            case "local":
                console.warn("Local TTS not yet implemented, returning Null provider");
                return new NullTtsProvider();
            default:
                // Defaults to ElevenLabs for standard ultra-low latency voice mode
                return new ElevenLabsTTSProvider(config);
        }
    }
}
