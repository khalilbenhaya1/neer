#!/usr/bin/env node
/**
 * ╔══════════════════════════════════════════════════════╗
 * ║      NEER Production Build Orchestrator              ║
 * ║      neer-builder/build.mjs                         ║
 * ║                                                      ║
 * ║  Usage:  pnpm build:prod  (from project root)       ║
 * ║  Or:     node neer-builder/build.mjs                ║
 * ║                                                      ║
 * ║  Produces: neer-builder/release/NEER.exe             ║
 * ╚══════════════════════════════════════════════════════╝
 *
 * Pipeline:
 *   1. Bootstrap builder deps (esbuild, pkg, js-obfuscator)
 *   2. pnpm build  → dist/ (TypeScript → ESM)
 *   3. pnpm ui:build → dist/control-ui/
 *   4. esbuild bundle: dist/entry.js → .staging/dist/bundle.cjs (ESM→CJS)
 *   5. Stage assets (control-ui, assets, extensions, skills)
 *   6. Write staging/package.json (no "type":"module", pkg config)
 *   7. Obfuscate .staging/dist/bundle.cjs
 *   8. Strip test/dev files
 *   9. pkg: .staging/dist/bundle.cjs → release/NEER.exe
 *  10. Clean staging
 *  11. Print summary
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ─── Paths ───────────────────────────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BUILDER_ROOT = __dirname;
const PROJECT_ROOT = path.resolve(BUILDER_ROOT, "..");

const CONFIG_PATH = path.join(BUILDER_ROOT, "builder.config.json");
const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));

const DIST_SRC = path.resolve(PROJECT_ROOT, config.distSource);       // project/dist
const UI_SRC = path.resolve(PROJECT_ROOT, config.uiSource);         // project/ui
const UI_BUILD_OUT = path.resolve(PROJECT_ROOT, config.uiBuildOutput);    // project/ui/dist
const ASSETS_SRC = path.resolve(PROJECT_ROOT, config.assetsSource);     // project/assets
const EXTENSIONS_SRC = path.resolve(PROJECT_ROOT, config.extensionsSource); // project/extensions
const SKILLS_SRC = path.resolve(PROJECT_ROOT, config.skillsSource);     // project/skills

const STAGING_DIR = path.resolve(BUILDER_ROOT, config.stagingDir);   // .staging/
const STAGING_DIST = path.join(STAGING_DIR, "dist");                  // .staging/dist/
const BUNDLE_CJS = path.join(STAGING_DIST, "bundle.cjs");           // .staging/dist/bundle.cjs

const OUTPUT_DIR = path.resolve(BUILDER_ROOT, config.outputDir);    // release/
const OUTPUT_EXE = path.join(OUTPUT_DIR, config.outputExe);         // release/NEER.exe
const IS_WIN = process.platform === "win32";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const log = (msg) => console.log(`\n▶ ${msg}`);
const ok = (msg) => console.log(`  ✔ ${msg}`);
const warn = (msg) => console.warn(`  ⚠ ${msg}`);

function die(msg, code = 1) {
    console.error(`\n✖ BUILD FAILED: ${msg}`);
    process.exit(code);
}

function run(cmd, args, opts = {}) {
    const result = spawnSync(cmd, args, {
        cwd: opts.cwd ?? PROJECT_ROOT,
        stdio: "inherit",
        env: { ...process.env, NODE_ENV: "production", ...opts.env },
        shell: IS_WIN,
    });
    if (result.signal) die(`Process killed by signal ${result.signal}`);
    if ((result.status ?? 1) !== 0) die(`Command failed: ${cmd} ${args.join(" ")}`);
}

function copyDirRecursive(src, dest) {
    if (!fs.existsSync(src)) {
        warn(`Source not found, skipping: ${path.relative(PROJECT_ROOT, src)}`);
        return 0;
    }
    fs.mkdirSync(dest, { recursive: true });
    let count = 0;
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
        const s = path.join(src, entry.name);
        const d = path.join(dest, entry.name);
        if (entry.isDirectory()) { count += copyDirRecursive(s, d); }
        else if (entry.isFile()) { fs.copyFileSync(s, d); count++; }
    }
    return count;
}

function removeRecursive(dir) {
    if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
}

function getFileSize(filePath) {
    try {
        const b = fs.statSync(filePath).size;
        if (b >= 1024 * 1024 * 1024) return `${(b / 1024 ** 3).toFixed(2)} GB`;
        if (b >= 1024 * 1024) return `${(b / 1024 ** 2).toFixed(2)} MB`;
        return `${(b / 1024).toFixed(2)} KB`;
    } catch { return "unknown"; }
}

function readVersion() {
    try { return JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, "package.json"), "utf8")).version ?? "0.0.0"; }
    catch { return "0.0.0"; }
}

// ─── Step 0: Bootstrap builder deps ──────────────────────────────────────────

function ensureBuilderDeps() {
    log("Bootstrapping neer-builder dependencies...");
    const nm = path.join(BUILDER_ROOT, "node_modules");
    const hasEsbuild = fs.existsSync(path.join(nm, "esbuild"));
    const hasPkg = fs.existsSync(path.join(nm, "pkg"));
    const hasObf = fs.existsSync(path.join(nm, "javascript-obfuscator"));

    if (hasEsbuild && hasPkg && hasObf) {
        ok("Builder deps already installed");
        return;
    }
    console.log("  Installing neer-builder/node_modules...");
    run("npm", ["install", "--prefix", BUILDER_ROOT], { cwd: BUILDER_ROOT });
    ok("Builder deps installed");
}

// ─── Step 1: TypeScript Compile ───────────────────────────────────────────────

function compileTypeScript() {
    log("Compiling TypeScript (pnpm build)...");
    run("pnpm", ["build"]);
    const entry = path.join(DIST_SRC, "entry.js");
    if (!fs.existsSync(entry)) die("TypeScript compiled but dist/entry.js not found");
    ok(`TypeScript compiled → dist/`);
}

// ─── Step 2: UI Build ────────────────────────────────────────────────────────

function buildUI() {
    log("Building UI (pnpm ui:build)...");
    run("pnpm", ["ui:build"]);
    // UI may output to dist/control-ui/ or ui/dist/ depending on vite config
    const uiDist1 = path.join(DIST_SRC, "control-ui");
    const uiDist2 = UI_BUILD_OUT;
    if (fs.existsSync(uiDist1)) {
        ok(`UI built → dist/control-ui/`);
    } else if (fs.existsSync(uiDist2)) {
        ok(`UI built → ui/dist/`);
    } else {
        warn("UI output not found — UI may be embedded or skipped");
    }
}

// ─── Step 3: Bundle ESM → CJS via esbuild ────────────────────────────────────

function bundleEsm() {
    log("Bundling ESM → CJS with esbuild...");
    fs.mkdirSync(STAGING_DIST, { recursive: true });

    const bundleScript = path.join(BUILDER_ROOT, "bundle.mjs");
    const result = spawnSync(
        process.execPath,
        [bundleScript],
        {
            cwd: BUILDER_ROOT,
            stdio: "inherit",
            env: { ...process.env },
        },
    );
    if (result.signal) die("Bundler killed by signal");
    if ((result.status ?? 1) !== 0) die("esbuild bundling failed");

    if (!fs.existsSync(BUNDLE_CJS)) die("Bundling completed but bundle.cjs not found");
    const size = getFileSize(BUNDLE_CJS);
    ok(`Bundled → .staging/dist/bundle.cjs (${size})`);
}

// ─── Step 3b: Post-process bundle for pkg compatibility ──────────────────────

function postProcessBundle() {
    log("Post-processing bundle for pkg compatibility...");
    let code = fs.readFileSync(BUNDLE_CJS, "utf8");
    let fixes = 0;

    // Fix 1: Replace require("node:sqlite") with dynamic version pkg can't trace
    const nodeSqlite = /require\s*\(\s*["']node:sqlite["']\s*\)/g;
    if (nodeSqlite.test(code)) {
        code = code.replace(/require\s*\(\s*["']node:sqlite["']\s*\)/g,
            '(()=>{try{return require("node:"+"sqlite")}catch(e){return null}})()'
        );
        fixes++;
        ok("Replaced node:sqlite requires with dynamic fallback");
    }

    // Fix 2: Replace import.meta.url with CJS __filename equivalent
    //   esbuild leaves import.meta as empty {} in CJS output
    //   but the literal text 'import.meta' may still appear and break pkg's Babel parser
    const imetaUrl = /import\.meta\.url/g;
    if (imetaUrl.test(code)) {
        code = code.replace(/import\.meta\.url/g,
            'require("url").pathToFileURL(__filename).href'
        );
        fixes++;
        ok("Replaced import.meta.url with __filename-based equivalent");
    }

    // Fix 3: Replace any remaining import.meta (without .url)
    const imeta = /import\.meta(?!\.url)/g;
    if (imeta.test(code)) {
        code = code.replace(/import\.meta(?!\.url)/g,
            '({url:require("url").pathToFileURL(__filename).href})'
        );
        fixes++;
        ok("Replaced remaining import.meta references");
    }

    if (fixes > 0) {
        fs.writeFileSync(BUNDLE_CJS, code, "utf8");
        ok(`Applied ${fixes} post-processing fix(es)`);
    } else {
        ok("No post-processing needed");
    }
}

// ─── Step 4: Stage assets ────────────────────────────────────────────────────

function stage() {
    log("Staging assets...");

    // UI: check both possible output locations
    const uiDist1 = path.join(DIST_SRC, "control-ui");  // dist/control-ui (vite outDir)
    const uiDist2 = UI_BUILD_OUT;                         // ui/dist (alternative)
    const uiDest = path.join(STAGING_DIST, "control-ui");

    if (fs.existsSync(uiDist1)) {
        const n = copyDirRecursive(uiDist1, uiDest);
        ok(`Copied UI dist/control-ui/ (${n} files)`);
    } else if (fs.existsSync(uiDist2)) {
        const n = copyDirRecursive(uiDist2, path.join(STAGING_DIR, "ui", "dist"));
        ok(`Copied UI ui/dist/ (${n} files)`);
    }

    // assets/, extensions/, skills/
    if (fs.existsSync(ASSETS_SRC)) {
        const n = copyDirRecursive(ASSETS_SRC, path.join(STAGING_DIR, "assets"));
        ok(`Copied assets/ (${n} files)`);
    }
    if (fs.existsSync(EXTENSIONS_SRC)) {
        const n = copyDirRecursive(EXTENSIONS_SRC, path.join(STAGING_DIR, "extensions"));
        ok(`Copied extensions/ (${n} files)`);
    }
    if (fs.existsSync(SKILLS_SRC)) {
        const n = copyDirRecursive(SKILLS_SRC, path.join(STAGING_DIR, "skills"));
        ok(`Copied skills/ (${n} files)`);
    }

    // Write staging package.json
    //   - Remove "type": "module" so .js files are treated as CJS by Node
    //   - Add pkg assets config
    const rootPkg = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, "package.json"), "utf8"));
    const stagePkg = {
        name: rootPkg.name,
        version: rootPkg.version,
        main: "dist/bundle.cjs",
        // NO "type": "module" → forces CJS mode for all .js files in snapshot
        pkg: {
            assets: [
                "dist/control-ui/**/*",
                "ui/dist/**/*",
                "assets/**/*",
                "extensions/**/*",
                "skills/**/*",
            ],
            targets: [config.target],
            outputPath: OUTPUT_DIR,
        },
    };
    fs.writeFileSync(path.join(STAGING_DIR, "package.json"), JSON.stringify(stagePkg, null, 2), "utf8");
    ok("Wrote staging/package.json");
    // No node_modules needed — esbuild bundles all JS deps into bundle.cjs
}

// ─── Step 5: Obfuscate ───────────────────────────────────────────────────────

function obfuscate() {
    if (!config.obfuscate) {
        warn("Obfuscation disabled in builder.config.json — skipping");
        return;
    }
    log("Obfuscating bundle.cjs...");
    const obfuscateScript = path.join(BUILDER_ROOT, "obfuscate.mjs");
    const result = spawnSync(
        process.execPath,
        [obfuscateScript, STAGING_DIST],
        { cwd: BUILDER_ROOT, stdio: "inherit", env: { ...process.env } },
    );
    if (result.signal) die("Obfuscation killed by signal");
    if ((result.status ?? 1) !== 0) die("Obfuscation failed");
    ok("JS obfuscation complete");
}

// ─── Step 6: Strip unwanted files ────────────────────────────────────────────

function stripUnwantedFiles() {
    log("Stripping dev artifacts from staging...");
    let stripped = 0;
    function walk(dir) {
        let entries;
        try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
        for (const e of entries) {
            const full = path.join(dir, e.name);
            if (e.isDirectory()) { walk(full); continue; }
            if (!e.isFile()) continue;
            const n = e.name;
            const shouldStrip =
                (config.stripSourceMaps && (n.endsWith(".js.map") || n.endsWith(".mjs.map"))) ||
                (config.stripTestFiles && (n.endsWith(".test.js") || n.endsWith(".spec.js") || n.includes(".test-helpers."))) ||
                n.endsWith(".ts");
            if (shouldStrip) { fs.unlinkSync(full); stripped++; }
        }
    }
    walk(STAGING_DIR);
    ok(`Stripped ${stripped} unwanted files`);
}

// ─── Step 7: Package with pkg ────────────────────────────────────────────────

function packageExe() {
    log(`Packaging executable → ${config.outputExe}...`);
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    const entryInStaging = path.join(STAGING_DIR, "dist", "bundle.cjs");
    const pkgBinWin = path.join(BUILDER_ROOT, "node_modules", ".bin", "pkg.cmd");
    const pkgBin = path.join(BUILDER_ROOT, "node_modules", ".bin", "pkg");
    const pkgCmd = IS_WIN && fs.existsSync(pkgBinWin) ? pkgBinWin : pkgBin;

    const result = spawnSync(
        pkgCmd,
        [
            entryInStaging,
            "--target", config.target,
            "--output", OUTPUT_EXE,
            "--no-bytecode",
        ],
        {
            cwd: STAGING_DIR,
            stdio: "inherit",
            env: { ...process.env, NODE_ENV: "production" },
            shell: IS_WIN,
        },
    );
    if (result.signal) die("pkg killed by signal");

    // pkg may exit non-zero due to non-fatal warnings (missing optional modules)
    // Only fail if the exe wasn't actually produced
    if (!fs.existsSync(OUTPUT_EXE)) {
        die(`pkg packaging failed — no output produced`);
    }
    if ((result.status ?? 0) !== 0) {
        warn(`pkg exited with code ${result.status} but produced output — continuing`);
    }
    ok(`Packaged: ${OUTPUT_EXE}`);
}

// ─── Step 8: Clean staging ───────────────────────────────────────────────────

function clean() {
    log("Cleaning staging...");
    removeRecursive(STAGING_DIR);
    ok("Staging removed");
}

// ─── Placeholder checks ───────────────────────────────────────────────────────

function checkPlaceholders() {
    if (config.license?.enabled) die("License system enabled but not implemented. Set license.enabled=false.");
    if (config.digitalSignature?.enabled) die("Digital signature enabled but not implemented. Set digitalSignature.enabled=false.");
}

// ─── Build Summary ────────────────────────────────────────────────────────────

function printSummary(version, startTime) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const size = getFileSize(OUTPUT_EXE);
    const ts = new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC";
    console.log("\n" + "═".repeat(56));
    console.log("  ✨ NEER Production Build Successful");
    console.log("═".repeat(56));
    console.log(`  Version   : ${version}`);
    console.log(`  Size      : ${size}`);
    console.log(`  Timestamp : ${ts}`);
    console.log(`  Duration  : ${elapsed}s`);
    console.log(`  Output    : ${path.relative(PROJECT_ROOT, OUTPUT_EXE)}`);
    console.log(`  Target    : ${config.target}`);
    console.log("═".repeat(56) + "\n");
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    const startTime = Date.now();
    const version = readVersion();

    console.log("╔══════════════════════════════════════════════╗");
    console.log(`║  NEER Production Builder  v${version.padEnd(17)}║`);
    console.log("╚══════════════════════════════════════════════╝");
    console.log(`  Target  : ${config.target}`);
    console.log(`  Output  : ${config.outputExe}`);

    checkPlaceholders();
    removeRecursive(STAGING_DIR); // Always start fresh — no stale cache

    ensureBuilderDeps();
    compileTypeScript();
    buildUI();
    bundleEsm();
    postProcessBundle();
    stage();
    obfuscate();
    stripUnwantedFiles();
    packageExe();
    clean();

    printSummary(version, startTime);
}

main().catch((err) => {
    console.error("\n✖ Unhandled error:", err);
    process.exit(1);
});
