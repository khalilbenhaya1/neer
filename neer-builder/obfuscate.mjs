#!/usr/bin/env node
/**
 * NEER Production Builder — Obfuscation Layer
 * Applies javascript-obfuscator to all .js files in a target directory.
 * Called by build.mjs; can also be run standalone:
 *   node neer-builder/obfuscate.mjs <targetDir>
 */

import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Resolve javascript-obfuscator from the neer-builder's own node_modules
const require = createRequire(path.join(__dirname, "package.json"));
let JavaScriptObfuscator;
try {
    JavaScriptObfuscator = require("javascript-obfuscator");
} catch {
    console.error("[obfuscate] javascript-obfuscator not found. Run: npm install inside neer-builder/");
    process.exit(1);
}

const OBFUSCATOR_OPTIONS = {
    compact: true,
    controlFlowFlattening: false,      // disabled for Node.js stability
    deadCodeInjection: false,          // avoid bloat
    debugProtection: false,
    disableConsoleOutput: false,       // keep console for gateway logs
    identifierNamesGenerator: "hexadecimal",
    log: false,
    numbersToExpressions: false,
    renameGlobals: false,              // must stay false — pkg relies on global names
    selfDefending: false,
    simplify: true,
    splitStrings: false,
    stringArray: true,
    stringArrayCallsTransform: true,
    stringArrayEncoding: ["base64"],
    stringArrayIndexShift: true,
    stringArrayRotate: true,
    stringArrayShuffle: true,
    stringArrayWrappersCount: 2,
    stringArrayWrappersType: "function",
    stringArrayThreshold: 0.75,
    unicodeEscapeSequence: false,
    sourceMap: false,
};

/**
 * Walk directory and obfuscate all .js files.
 * @param {string} dir - Absolute path to directory
 * @param {Object} stats - Mutable stats object {files, skipped, errors}
 */
function obfuscateDir(dir, stats) {
    let entries;
    try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (err) {
        console.warn(`[obfuscate] Cannot read dir: ${dir} — ${err.message}`);
        return;
    }

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            // Skip node_modules inside staging (pre-compiled)
            if (entry.name === "node_modules") {
                stats.skipped++;
                continue;
            }
            obfuscateDir(fullPath, stats);
            continue;
        }

        if (!entry.isFile()) continue;

        // Only process .js files, skip already-minified
        if (!entry.name.endsWith(".js") || entry.name.endsWith(".min.js")) {
            stats.skipped++;
            continue;
        }

        try {
            const original = fs.readFileSync(fullPath, "utf8");

            // Skip empty or tiny shim files (< 64 bytes) — obfuscator can break them
            if (original.trim().length < 64) {
                stats.skipped++;
                continue;
            }

            const result = JavaScriptObfuscator.obfuscate(original, OBFUSCATOR_OPTIONS);
            fs.writeFileSync(fullPath, result.getObfuscatedCode(), "utf8");
            stats.files++;
        } catch (err) {
            console.warn(`[obfuscate] Skipping ${path.relative(dir, fullPath)}: ${err.message}`);
            stats.errors++;
        }
    }
}

// ─── Entry point ────────────────────────────────────────────────────────────

const targetDir = process.argv[2];
if (!targetDir) {
    console.error("Usage: node obfuscate.mjs <targetDir>");
    process.exit(1);
}

const resolvedDir = path.resolve(targetDir);
if (!fs.existsSync(resolvedDir)) {
    console.error(`[obfuscate] Directory not found: ${resolvedDir}`);
    process.exit(1);
}

const stats = { files: 0, skipped: 0, errors: 0 };
console.log(`[obfuscate] Processing: ${resolvedDir}`);
obfuscateDir(resolvedDir, stats);
console.log(`[obfuscate] Done — obfuscated: ${stats.files}, skipped: ${stats.skipped}, errors: ${stats.errors}`);

export { obfuscateDir, OBFUSCATOR_OPTIONS };
