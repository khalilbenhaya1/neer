import type { NeerApp } from "./app.ts";
import type { VoiceState } from "./types.ts";
import { scheduleChatScroll } from "./app-scroll.ts";

export type VoiceHost = NeerApp & {
    chatVoiceMode: boolean;
    chatVoiceState: VoiceState;
    chatVoiceCallMode: boolean;
};

let audioContext: AudioContext | null = null;
let scriptProcessor: ScriptProcessorNode | null = null;
let micStream: MediaStream | null = null;
let micSource: MediaStreamAudioSourceNode | null = null;

// VAD Constants
const VAD_THRESHOLD = 0.015; // Energy threshold
const VAD_BARGE_IN_THRESHOLD = 0.025; // Slightly higher threshold to interrupt assistant
const VAD_SILENCE_TIMEOUT = 1200; // ms of silence before triggering
const VAD_MIN_SPEECH_MS = 300; // ms of speech required to be valid

let isSpeaking = false;
let silenceStart: number | null = null;
let speechStart: number | null = null;
let audioChunks: Float32Array[] = [];

export function handleToggleVoiceMode(host: VoiceHost) {
    if (host.chatVoiceMode) {
        stopVoiceMode(host);
    } else {
        startVoiceMode(host);
    }
}

async function startVoiceMode(host: VoiceHost) {
    if (!host.connected || !host.client) {
        host.lastError = "Connect to the gateway before starting voice mode.";
        return;
    }

    try {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContext = new AudioContext({ sampleRate: 16000 }); // Whisper likes 16k
        micSource = audioContext.createMediaStreamSource(micStream);

        // ScriptProcessor is deprecated but widely supported and easy for simple VAD
        scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);

        scriptProcessor.onaudioprocess = (e) => {
            const input = e.inputBuffer.getChannelData(0);
            handleAudioFrame(host, input);
        };

        micSource.connect(scriptProcessor);
        scriptProcessor.connect(audioContext.destination);

        host.chatVoiceMode = true;
        host.chatVoiceState = "idle";
        host.lastError = null;

        // Auto-scroll when starting
        scheduleChatScroll(host as any);
    } catch (err) {
        console.error("Voice mode error:", err);
        host.lastError = "Could not access microphone for voice mode.";
        stopVoiceMode(host);
    }
}

function stopVoiceMode(host: VoiceHost) {
    host.chatVoiceMode = false;
    host.chatVoiceState = "idle";

    if (scriptProcessor) {
        scriptProcessor.disconnect();
        scriptProcessor = null;
    }
    if (micSource) {
        micSource.disconnect();
        micSource = null;
    }
    if (audioContext) {
        void audioContext.close();
        audioContext = null;
    }
    if (micStream) {
        micStream.getTracks().forEach((t) => t.stop());
        micStream = null;
    }

    // Also stop any ongoing speech playback
    stopPlayback();
}

function handleAudioFrame(host: VoiceHost, buffer: Float32Array) {
    if (host.chatVoiceState === "thinking") {
        // Ignore input while we are waiting for transcription or agent run
        return;
    }

    // Calculate energy (RMS)
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
        sum += buffer[i] * buffer[i];
    }
    const rms = Math.sqrt(sum / buffer.length);

    // BARGE-IN: If the assistant is speaking and we detect significant sound, stop playback
    if (host.chatVoiceState === "speaking" && rms > VAD_BARGE_IN_THRESHOLD) {
        console.log("Barge-in detected! Stopping playback.");
        stopPlayback();
        host.chatVoiceState = "listening";
        resetVAD();
        isSpeaking = true;
        speechStart = Date.now();
    }

    if (host.chatVoiceState === "speaking") {
        return; // Normal ignore if not high enough for barge-in
    }

    const now = Date.now();

    if (rms > VAD_THRESHOLD) {
        if (!isSpeaking) {
            isSpeaking = true;
            speechStart = now;
            host.chatVoiceState = "listening";
        }
        silenceStart = null;
        audioChunks.push(new Float32Array(buffer));
    } else {
        if (isSpeaking) {
            if (silenceStart === null) {
                silenceStart = now;
            } else if (now - silenceStart > VAD_SILENCE_TIMEOUT) {
                // Validation: did we actually speak long enough?
                // speechStart is an epoch ms timestamp, so duration = now - speechStart
                if (speechStart && (now - speechStart) > VAD_MIN_SPEECH_MS) {
                    void finalizeTranscription(host);
                } else {
                    // Too short — false trigger, reset
                    resetVAD();
                    host.chatVoiceState = "idle";
                }
            } else {
                // While in "potential silence" but waiting for timeout, keep recording
                audioChunks.push(new Float32Array(buffer));
            }
        }
    }
}

function resetVAD() {
    isSpeaking = false;
    silenceStart = null;
    speechStart = null;
    audioChunks = [];
}

async function finalizeTranscription(host: VoiceHost) {
    if (!host.client || audioChunks.length === 0) {
        console.warn("[voice] finalizeTranscription: no client or no audioChunks");
        resetVAD();
        host.chatVoiceState = "idle";
        return;
    }

    const chunks = audioChunks;
    resetVAD();
    host.chatVoiceState = "thinking";
    console.log("[voice] Transcribing", chunks.length, "chunks...");

    try {
        const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
        const combined = new Float32Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
            combined.set(chunk, offset);
            offset += chunk.length;
        }

        const wavBuffer = encodeWAV(combined, 16000);
        const b64 = btoa(String.fromCharCode(...new Uint8Array(wavBuffer)));
        console.log("[voice] WAV encoded, sending to voice.transcribe...");

        const resp = await host.client.request("voice.transcribe", {
            audioData: b64,
            mimeType: "audio/wav",
            filename: "voice-mode.wav",
        }) as { text?: string };

        const transcribed = (resp?.text ?? "").trim();
        console.log("[voice] Transcribed text:", JSON.stringify(transcribed));

        if (!transcribed) {
            host.chatVoiceState = "idle";
            return;
        }

        console.log("[voice] Sending to agent:", transcribed.slice(0, 60));
        await host.handleSendChat(transcribed);
        console.log("[voice] handleSendChat done, waiting for agent response...");

        void waitForResponseAndSpeak(host);
    } catch (err) {
        console.error("[voice] Transcription error:", err);
        host.lastError = "Voice transcription failed.";
        host.chatVoiceState = "idle";
    }
}

async function waitForResponseAndSpeak(host: VoiceHost) {
    // Poll until agent finishes sending
    let waited = 0;
    console.log("[voice] Polling... chatSending:", host.chatSending, "chatRunId:", host.chatRunId);
    while ((host.chatSending || host.chatRunId) && waited < 30000) {
        await new Promise((resolve) => setTimeout(resolve, 150));
        waited += 150;
        if (waited % 3000 === 0) {
            console.log("[voice] Still waiting...", waited, "ms, chatSending:", host.chatSending, "chatRunId:", host.chatRunId);
        }
    }

    console.log("[voice] Agent done after", waited, "ms. Messages count:", host.chatMessages.length);

    const raw = host.chatMessages[host.chatMessages.length - 1] as Record<string, unknown> | undefined;
    if (!raw) {
        console.warn("[voice] No messages found after agent run");
        host.chatVoiceState = "idle";
        return;
    }

    console.log("[voice] Last message role:", raw.role, "content type:", typeof raw.content);

    if (raw.role !== "assistant") {
        console.warn("[voice] Last message is not assistant, role:", raw.role);
        host.chatVoiceState = "idle";
        return;
    }

    // Normalize content — may be a string or an array of content blocks
    let textToSpeak = "";
    if (typeof raw.content === "string") {
        textToSpeak = raw.content.trim();
    } else if (Array.isArray(raw.content)) {
        textToSpeak = (raw.content as Array<{ type: string; text?: string }>)
            .filter((b) => b.type === "text")
            .map((b) => b.text ?? "")
            .join(" ")
            .trim();
    }

    if (!textToSpeak) {
        console.warn("[voice] Empty text to speak");
        host.chatVoiceState = "idle";
        return;
    }

    host.chatVoiceState = "speaking";
    console.log("[voice] Speaking:", textToSpeak.slice(0, 80));

    try {
        // Try browser-native Web Speech API first (no backend needed)
        if ("speechSynthesis" in window) {
            await speakWithBrowser(textToSpeak);
        } else {
            // Fallback: backend tts.speak
            const ttsResp = await host.client!.request("tts.speak", {
                text: textToSpeak,
            }) as { audioData?: string; outputFormat?: string };

            console.log("[voice] tts.speak, has audioData:", Boolean(ttsResp?.audioData));

            if (ttsResp?.audioData) {
                const mime = ttsResp.outputFormat === "mp3" ? "audio/mpeg" : "audio/wav";
                await playAudio(ttsResp.audioData, mime);
            }
        }
    } catch (err) {
        console.error("[voice] TTS error:", err);
    } finally {
        host.chatVoiceState = "idle";
    }
}

let currentSpeech: SpeechSynthesisUtterance | null = null;

/** Speak text using the browser's built-in Speech Synthesis API */
function speakWithBrowser(text: string): Promise<void> {
    return new Promise((resolve) => {
        // Stop any current speech
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        currentSpeech = utterance;

        // Pick the best available voice
        const voices = window.speechSynthesis.getVoices();
        // Prefer a multilingual or English voice
        const preferred = voices.find(v =>
            v.lang.startsWith("en") ||
            v.lang.startsWith("ar")
        );
        if (preferred) {
            utterance.voice = preferred;
        }

        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        utterance.onend = () => {
            currentSpeech = null;
            resolve();
        };
        utterance.onerror = (e) => {
            console.error("[voice] speechSynthesis error:", e);
            currentSpeech = null;
            resolve();
        };

        window.speechSynthesis.speak(utterance);
    });
}

let currentAudio: HTMLAudioElement | null = null;
async function playAudio(b64: string, mime = "audio/wav") {
    return new Promise<void>((resolve) => {
        stopPlayback();
        const blob = base64ToBlob(b64, mime);
        const url = URL.createObjectURL(blob);
        currentAudio = new Audio(url);
        currentAudio.onended = () => {
            URL.revokeObjectURL(url);
            currentAudio = null;
            resolve();
        };
        currentAudio.onerror = (e) => {
            console.error("[voice] Audio play error:", e);
            URL.revokeObjectURL(url);
            currentAudio = null;
            resolve();
        };
        void currentAudio.play().catch((e) => {
            console.error("[voice] play() rejected:", e);
            resolve();
        });
    });
}

function stopPlayback() {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }
    // Also stop browser speech synthesis (used for TTS)
    if ("speechSynthesis" in window && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        currentSpeech = null;
    }
}

function base64ToBlob(base64: string, mime: string) {
    const byteCharacters = atob(base64);
    const byteNumbers = new Uint8Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    return new Blob([byteNumbers], { type: mime });
}

function encodeWAV(samples: Float32Array, sampleRate: number) {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    const writeString = (offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    };

    writeString(0, "RIFF");
    view.setUint32(4, 32 + samples.length * 2, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM - integer
    view.setUint16(22, 1, true); // Mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, "data");
    view.setUint32(40, samples.length * 2, true);

    let offset = 44;
    for (let i = 0; i < samples.length; i++, offset += 2) {
        const s = Math.max(-1, Math.min(1, samples[i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }

    return buffer;
}
