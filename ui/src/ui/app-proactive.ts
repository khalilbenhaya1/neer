import type { ProactiveEvent } from "../../../src/cognition/live-loop.js";

// Re-export for consumers in this layer
export type { ProactiveEvent };

// Host shape required for proactive handling
export type ProactiveHost = {
    chatRunId: string | null;
    chatMessages: unknown[];
    proactiveCards: ProactiveCardData[];
};

export type ProactiveCardData = {
    id: string;
    level: "subtle" | "conversational" | "urgent";
    mood: string;
    message: string;
    timestamp: number;
};

let _notificationPermission: NotificationPermission = "default";

async function ensureNotificationPermission(): Promise<boolean> {
    if (!("Notification" in window)) return false;
    if (Notification.permission === "granted") return true;
    if (Notification.permission === "denied") return false;
    _notificationPermission = await Notification.requestPermission();
    return _notificationPermission === "granted";
}

function showBrowserNotification(message: string): void {
    void ensureNotificationPermission().then((granted) => {
        if (granted) {
            new Notification("NEER", {
                body: message,
                icon: "/favicon.ico",
                tag: "neer-proactive",
            });
        }
    });
}

/**
 * Handle an inbound proactive event from the Gateway.
 * Must be called from the main WS event dispatcher (app-gateway.ts).
 *
 * - subtle       → lightweight card (non-intrusive)
 * - conversational → append as assistant chat message
 * - urgent       → append as chat message + browser notification
 *
 * Silently ignored when the agent is currently streaming a response.
 */
export function handleProactiveEvent(host: ProactiveHost, event: ProactiveEvent): void {
    // Never interrupt an ongoing agent response
    if (host.chatRunId !== null) {
        return;
    }

    const card: ProactiveCardData = {
        id: `proactive-${event.timestamp}-${Math.random().toString(36).slice(2, 7)}`,
        level: event.level,
        mood: event.mood,
        message: event.message,
        timestamp: event.timestamp,
    };

    if (event.level === "subtle") {
        // Non-intrusive card strip — does NOT enter the chat thread
        host.proactiveCards = [...(host.proactiveCards ?? []), card].slice(-5); // keep last 5
        return;
    }

    // conversational + urgent → append to chat thread as assistant message
    host.chatMessages = [
        ...host.chatMessages,
        {
            role: "assistant",
            content: [{ type: "text", text: event.message }],
            timestamp: event.timestamp,
            proactive: true, // marker for renderers that want to style differently
        },
    ];

    if (event.level === "urgent") {
        showBrowserNotification(event.message);
    }
}

// ─── Proactive Card Strip Renderer (vanilla TS — no Lit dependency) ───────────

/**
 * Renders a dismissible inline card for "subtle" proactive events.
 * Call this from your render function and inject the returned HTML string,
 * or mount it using `renderProactiveCardStrip(host, container)`.
 */
export function renderProactiveCardStrip(
    cards: ProactiveCardData[],
    onDismiss: (id: string) => void
): HTMLElement {
    const strip = document.createElement("div");
    strip.className = "proactive-strip";

    for (const card of cards) {
        const el = document.createElement("div");
        el.className = `proactive-card proactive-card--${card.level}`;
        el.dataset.id = card.id;
        el.innerHTML = `
            <span class="proactive-card__mood">${escapeHtml(card.mood)}</span>
            <span class="proactive-card__message">${escapeHtml(card.message)}</span>
            <button class="proactive-card__dismiss" aria-label="Dismiss" type="button">×</button>
        `;
        el.querySelector(".proactive-card__dismiss")?.addEventListener("click", () => {
            onDismiss(card.id);
        });
        strip.appendChild(el);
    }

    return strip;
}

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

export function dismissProactiveCard(host: ProactiveHost, id: string): void {
    host.proactiveCards = (host.proactiveCards ?? []).filter((c) => c.id !== id);
}
