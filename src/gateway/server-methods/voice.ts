import type { GatewayRequestHandlers } from "./types.js";
import { ErrorCodes, errorShape } from "../protocol/index.js";
import { isWhisperReady, transcribeAudio } from "../whisper-manager.js";

const MAX_AUDIO_BYTES = 10 * 1024 * 1024; // 10 MB

export const voiceHandlers: GatewayRequestHandlers = {
    /**
     * Transcribe a base64-encoded audio blob using the local Whisper server.
     *
     * Params:
     *   audioData  — base64-encoded audio bytes (strip data-URL prefix first)
     *   mimeType   — e.g. "audio/webm" or "audio/wav"
     *   filename   — optional filename hint (helps ffmpeg pick codec)
     *
     * Returns:
     *   { text: string, language: string }
     */
    "voice.transcribe": async ({ params, respond }) => {
        // ── 1. Extract params ─────────────────────────────────────────────────
        const rawAudio = params.audioData;
        if (typeof rawAudio !== "string" || !rawAudio) {
            respond(
                false,
                undefined,
                errorShape(ErrorCodes.INVALID_REQUEST, "voice.transcribe: audioData (base64) is required"),
            );
            return;
        }

        // Strip data-URL prefix if present
        const dataUrlMatch = /^data:[^;]+;base64,(.*)$/.exec(rawAudio);
        const b64 = dataUrlMatch ? dataUrlMatch[1] : rawAudio;

        // Size guard (before decoding — rough estimate at 3/4)
        if (b64.length * 0.75 > MAX_AUDIO_BYTES) {
            respond(
                false,
                undefined,
                errorShape(ErrorCodes.INVALID_REQUEST, "voice.transcribe: audio exceeds 10 MB limit"),
            );
            return;
        }

        const mimeType =
            typeof params.mimeType === "string" && params.mimeType ? params.mimeType : "audio/webm";
        const filename =
            typeof params.filename === "string" && params.filename
                ? params.filename
                : mimeType.includes("wav")
                    ? "audio.wav"
                    : "audio.webm";

        // ── 2. Check Whisper readiness ─────────────────────────────────────────
        const ready = await isWhisperReady();
        if (!ready) {
            respond(
                false,
                undefined,
                errorShape(
                    ErrorCodes.UNAVAILABLE,
                    "Whisper server is not ready. It may still be loading the model (first run takes ~30s). " +
                    "Check gateway logs. Make sure Python 3.10+ is installed.",
                ),
            );
            return;
        }

        // ── 3. Decode and transcribe ───────────────────────────────────────────
        let audioBuffer: Buffer;
        try {
            audioBuffer = Buffer.from(b64, "base64");
        } catch {
            respond(
                false,
                undefined,
                errorShape(ErrorCodes.INVALID_REQUEST, "voice.transcribe: invalid base64 audio data"),
            );
            return;
        }

        if (audioBuffer.byteLength > MAX_AUDIO_BYTES) {
            respond(
                false,
                undefined,
                errorShape(ErrorCodes.INVALID_REQUEST, "voice.transcribe: decoded audio exceeds 10 MB"),
            );
            return;
        }

        try {
            const result = await transcribeAudio(audioBuffer, mimeType, filename);
            respond(true, { text: result.text, language: result.language });
        } catch (err) {
            respond(
                false,
                undefined,
                errorShape(ErrorCodes.UNAVAILABLE, `Transcription error: ${String(err)}`),
            );
        }
    },
};
