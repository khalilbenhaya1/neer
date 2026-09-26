import EventEmitter from "node:events";
import { ISTTProvider, ITTSProvider } from "./providers/index.js";

export class VoicePipeline extends EventEmitter {
    private stt: ISTTProvider;
    public tts: ITTSProvider;
    private silenceTimer: NodeJS.Timeout | null = null;
    private silenceTimeoutMs = 1500;
    private isProcessing = false;
    private audioBuffer: Buffer[] = [];

    constructor(stt: ISTTProvider, tts: ITTSProvider) {
        super();
        this.stt = stt;
        this.tts = tts;
    }

    /**
     * Called when the client sends a chunk of microphone audio
     */
    public async handleAudioIn(chunk: Buffer) {
        this.resetSilenceTimer();

        // Process chunk via STT provider
        this.stt.processAudioChunk(chunk);
    }

    /**
     * Resets the Voice Activity Detection (VAD) silence timer.
     * If silence hits the threshold, we flush the STT buffer and emit a final transcript.
     */
    private resetSilenceTimer() {
        if (this.silenceTimer) {
            clearTimeout(this.silenceTimer);
        }

        this.silenceTimer = setTimeout(async () => {
            if (this.isProcessing) return;
            this.isProcessing = true;
            try {
                const finalTranscript = await this.stt.flush();
                if (finalTranscript && finalTranscript.trim().length > 0) {
                    this.emit("final_transcript", finalTranscript.trim());
                }
            } finally {
                this.isProcessing = false;
                this.resetSilenceTimer();
            }
        }, this.silenceTimeoutMs);
    }

    /**
     * Intercepts an LLM text stream and chunks it by sentences before yielding it to the TTS provider
     * @param llmTextStream The raw token stream from the Agent 
     * @returns An async iterable of audio buffers containing synthesized speech 
     */
    public async *streamTTSFromText(llmTextStream: AsyncIterable<string>): AsyncIterable<Buffer> {
        // We buffer tokens here until we see punctuation
        let sentenceBuffer = "";

        async function* sentenceGenerator(): AsyncIterable<string> {
            for await (const chunk of llmTextStream) {
                sentenceBuffer += chunk;
                // A very basic regex to split by ".", "?", "!", "\n"
                const sentenceDelimiters = /([.?!]+|\n)/;
                const parts = sentenceBuffer.split(sentenceDelimiters);

                // If we split into more than 1 part, a sentence is complete
                while (parts.length > 2) {
                    const text = parts.shift()!;
                    const punctuation = parts.shift()!;
                    const fullSentence = text + punctuation;
                    if (fullSentence.trim().length > 0) {
                        yield fullSentence;
                    }
                }
                sentenceBuffer = parts.join("");
            }
            // Yield anything lingering
            if (sentenceBuffer.trim().length > 0) {
                yield sentenceBuffer;
            }
            sentenceBuffer = ""; // reset
        }

        // We pipeline the sentences directly into the selected TTS engine
        yield* this.tts.synthesizeStream(sentenceGenerator());
    }

    /**
     * Finalizes the current call state and cleans up resources
     */
    public async endCall() {
        if (this.silenceTimer) {
            clearTimeout(this.silenceTimer);
        }
        try {
            const finalTranscript = await this.stt.flush();
            if (finalTranscript && finalTranscript.trim().length > 0) {
                this.emit("final_transcript", finalTranscript.trim());
            }
        } catch {
            // Ignore cleanup errors
        }
        this.stt.reset();
    }
}
