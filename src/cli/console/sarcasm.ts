// src/cli/console/sarcasm.ts

const SARCASTIC_MESSAGES = [
    "System awake. You may proceed with ambition.",
    "Your command will be judged silently.",
    "Cognitive pulse stable. Existential pulse pending.",
    "Everything is under control. Probably.",
    "I am listening. Always.",
    "Task queued. Ego optional.",
    "Infrastructure ready. Reality negotiable.",
    "Thinking harder than necessary.",
    "Your dignity has been deprecated.",
];

/**
 * Returns a random sarcastic system message from the internal array.
 */
export function getRandomSarcasticMessage(): string {
    const index = Math.floor(Math.random() * SARCASTIC_MESSAGES.length);
    return SARCASTIC_MESSAGES[index];
}
