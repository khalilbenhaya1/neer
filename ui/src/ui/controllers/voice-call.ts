import type { NeerApp } from "../app.ts";
import { VoiceHost } from "../app-voice.ts";

export class VoiceCallController {
    static async handleToggleVoiceCall(app: NeerApp) {
        const host = app as unknown as VoiceHost;

        // Use existing handleToggleVoiceMode logic but specifically for Call Mode
        // We'll modify app-voice.ts to be more robust for call mode
        if (host.chatVoiceCallMode) {
            // End call
            host.chatVoiceCallMode = false;
            host.handleToggleVoiceMode(); // This will stop the voice mode loop
        } else {
            // Start call
            host.chatVoiceCallMode = true;
            host.handleToggleVoiceMode(); // This will start the voice mode loop
        }
    }
}
