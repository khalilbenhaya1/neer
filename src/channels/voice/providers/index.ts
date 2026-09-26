export interface ISTTProvider {
    /**
     * Processes an incoming PCM/Opus chunk and buffers it.
     */
    processAudioChunk(chunk: Buffer): void;
    /**
     * Forces the provider to finalize the current buffer into text.
     */
    flush(): Promise<string | null>;
    /**
     * Resets the STT buffer to empty.
     */
    reset(): void;

}

export interface ITTSProvider {
    /**
     * Synthesizes a stream of text into a stream of audio chunks.
     * @param textStream An async iterable that yields text chunks (e.g. sentences).
     * @returns An async iterable that yields audio buffer chunks.
     */
    synthesizeStream(textStream: AsyncIterable<string>): AsyncIterable<Buffer>;
}
