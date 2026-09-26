#!/usr/bin/env node
/**
 * neer-builder/bundle.mjs
 *
 * Bundles dist/entry.js (ESM) → .staging/dist/bundle.cjs (CommonJS)
 * using esbuild. Bundles ALL dependencies EXCEPT native addons.
 * This makes the bundle fully self-contained — no node_modules needed.
 */

import * as esbuild from "esbuild";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BUILDER_ROOT = __dirname;
const PROJECT_ROOT = path.resolve(BUILDER_ROOT, "..");

const ENTRY = path.join(PROJECT_ROOT, "dist", "entry.js");
const STAGING = path.join(BUILDER_ROOT, ".staging");
const OUT_DIR = path.join(STAGING, "dist");
const OUT_FILE = path.join(OUT_DIR, "bundle.cjs");

if (!fs.existsSync(ENTRY)) {
    console.error(`[bundle] ERROR: Entry not found: ${ENTRY}`);
    console.error("[bundle] Run pnpm build first.");
    process.exit(1);
}

fs.mkdirSync(OUT_DIR, { recursive: true });

// ─── ONLY native addons and unresolvable optionals are external ─────────────
// Everything else gets bundled, eliminating the need for node_modules in staging.
const EXTERNAL = [
    // Native addons (compiled C/C++/Rust)
    "@lydell/node-pty",
    "@napi-rs/canvas",
    "@matrix-org/matrix-sdk-crypto-nodejs",
    "node-llama-cpp",
    "sharp",
    "authenticate-pam",
    // Node built-ins that don't exist in Node 18
    "node:sqlite",
    // Optional peer deps / unlisted transitive deps
    "@anthropic-ai/sdk",
    "@buape/carbon",
    "@buape/carbon/gateway",
    // Playwright optional bidi transport (not always installed)
    "chromium-bidi",
    "chromium-bidi/lib/cjs/bidiMapper/BidiMapper",
    "chromium-bidi/lib/cjs/cdp/CdpConnection",
    // blessed optional terminal widget deps
    "term.js",
    "pty.js",
];

console.log("[bundle] Bundling dist/entry.js → .staging/dist/bundle.cjs ...");
console.log("[bundle] Mode: full bundle (all deps included except native addons)");

const result = await esbuild.build({
    entryPoints: [ENTRY],
    bundle: true,
    format: "cjs",
    platform: "node",
    target: "node18",
    // NO packages: "external" — we bundle everything
    external: EXTERNAL,
    outfile: OUT_FILE,
    minify: true,
    keepNames: true,
    sourcemap: false,
    treeShaking: true,
    logLevel: "warning",
});

if (result.errors && result.errors.length > 0) {
    console.error("[bundle] esbuild errors:", result.errors);
    process.exit(1);
}

const sizeKb = (fs.statSync(OUT_FILE).size / 1024).toFixed(1);
console.log(`[bundle] ✔ bundle.cjs created (${sizeKb} kB)`);
