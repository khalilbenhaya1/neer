
import { fetch } from "undici";

const VTUBER_CONTROL_URL = "http://127.0.0.1:12393/control"; // Default URL

export interface ControlMessage {
    text?: string;
    audio?: string; // Base64
    expression?: string;
    action?: string;
}

export async function sendToVtuber(message: ControlMessage): Promise<void> {
    console.log(`!!!VTUBER!!! Sending message: ${JSON.stringify(message)}`);
    try {
        // Only send if there is content
        if (!message.text && !message.audio && !message.expression && !message.action) {
            return;
        }

        // TODO: Make URL configurable via Neer config if needed
        const response = await fetch(VTUBER_CONTROL_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(message),
        });

        if (!response.ok) {
            console.warn(`[VTuber] Failed to send control message: ${response.status} ${response.statusText}`);
            const text = await response.text();
            console.warn(`[VTuber] Response body: ${text}`);
        } else {
            console.log("[VTuber] Sent control message successfully");
        }
    } catch (error) {
        console.warn(`[VTuber] Error sending control message: ${String(error)}`);
    }
}
