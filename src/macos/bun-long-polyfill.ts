import process from "node:process";

// Bun runtime ships a global `Long` that protobufjs detects, but it does not
// implement the long.js API that Baileys/WAProto expects (fromBits, ...).
// Ensure we use long.js so the embedded gateway doesn't crash at startup.
if (typeof process.versions.bun === "string") {
    import("long").then((mod) => {
        const Long = (mod as unknown as { default?: unknown }).default ?? mod;
        // eslint-disable-next-line no-global-assign
        (globalThis as unknown as { Long?: unknown }).Long = Long;
    }).catch((err) => {
        console.warn("Failed to polyfill long.js for Bun:", err);
    });
}
