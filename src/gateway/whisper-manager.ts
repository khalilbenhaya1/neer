/**
 * NEER Whisper Process Manager
 *
 * Responsibilities:
 * 1. Detect Python 3.10+
 * 2. Auto-create venv + install dependencies (idempotent)
 * 3. Spawn whisper-server.py as a child process
 * 4. Monitor and restart on crash
 * 5. Kill on gateway shutdown
 */

import { exec, execFile, spawn, type ChildProcess } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { promisify } from "node:util";

const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);

// ── Constants ──────────────────────────────────────────────────────────────
export const WHISPER_PORT = 8778;
export const WHISPER_HOST = "127.0.0.1";
export const WHISPER_BASE_URL = `http://${WHISPER_HOST}:${WHISPER_PORT}`;

function getWhisperDir(workspaceDir: string): string {
    return path.join(workspaceDir, ".whisper");
}
function getServerScript(workspaceDir: string): string {
    return path.join(getWhisperDir(workspaceDir), "server.py");
}
function getVenvDir(workspaceDir: string): string {
    return path.join(getWhisperDir(workspaceDir), "venv");
}
function getBinDir(workspaceDir: string): string {
    return path.join(getWhisperDir(workspaceDir), "bin");
}
function getReadyFile(workspaceDir: string): string {
    return path.join(getWhisperDir(workspaceDir), ".installed");
}

const REQUIRED_PACKAGES = [
    "openai-whisper",
    "fastapi",
    "uvicorn[standard]",
    "python-multipart",
    "pydub",
];

// ── State ──────────────────────────────────────────────────────────────────
let whisperProcess: ChildProcess | null = null;
let isShuttingDown = false;
let restartTimer: NodeJS.Timeout | null = null;

type Logger = { info: (m: string) => void; warn: (m: string) => void; error: (m: string) => void };

// ── Python detection ────────────────────────────────────────────────────────
async function findPython(): Promise<string | null> {
    const candidates = ["python3", "python3.11", "python3.10", "python"];
    for (const bin of candidates) {
        try {
            const { stdout } = await execFileAsync(bin, [
                "-c",
                "import sys; print(sys.version_info.major, sys.version_info.minor)",
            ]);
            const [major, minor] = stdout.trim().split(" ").map(Number);
            if (major === 3 && (minor ?? 0) >= 10) {
                return bin;
            }
        } catch {
            // not found or wrong version
        }
    }
    return null;
}

// ── Virtual environment helpers ─────────────────────────────────────────────
function getVenvPython(workspaceDir: string): string {
    // Windows: venv\Scripts\python.exe  Unix: venv/bin/python
    return process.platform === "win32"
        ? path.join(getVenvDir(workspaceDir), "Scripts", "python.exe")
        : path.join(getVenvDir(workspaceDir), "bin", "python");
}

function getVenvPip(workspaceDir: string): string {
    return process.platform === "win32"
        ? path.join(getVenvDir(workspaceDir), "Scripts", "pip.exe")
        : path.join(getVenvDir(workspaceDir), "bin", "pip");
}

function venvExists(workspaceDir: string): boolean {
    return fs.existsSync(getVenvPython(workspaceDir));
}

function installMarkerExists(workspaceDir: string): boolean {
    return fs.existsSync(getReadyFile(workspaceDir));
}

// ── Install routine (idempotent) ────────────────────────────────────────────
async function ensureWhisperInstalled(workspaceDir: string, log: Logger): Promise<boolean> {
    const whisperDir = getWhisperDir(workspaceDir);
    const serverScript = getServerScript(workspaceDir);
    const venvDir = getVenvDir(workspaceDir);
    const readyFile = getReadyFile(workspaceDir);

    if (!fs.existsSync(whisperDir)) {
        fs.mkdirSync(whisperDir, { recursive: true });
    }
    if (!fs.existsSync(serverScript)) {
        // Try to bootstrap from project root if available
        const rootServerScript = path.join(process.cwd(), ".whisper", "server.py");
        if (fs.existsSync(rootServerScript)) {
            log.info(`[whisper] Copying server.py from root to workspace: ${serverScript}`);
            fs.copyFileSync(rootServerScript, serverScript);
        } else {
            log.warn(`[whisper] server.py not found at ${serverScript} — voice transcription unavailable`);
            return false;
        }
    }

    // Quick path: already installed
    if (venvExists(workspaceDir) && installMarkerExists(workspaceDir)) {
        log.info(`[whisper] Already installed at ${venvDir}`);
        return true;
    }

    const pythonBin = await findPython();
    if (!pythonBin) {
        log.error(
            "[whisper] Python 3.10+ not found. " +
            "Install Python 3.10+ to enable local Whisper transcription.",
        );
        return false;
    }
    log.info(`[whisper] Found Python: ${pythonBin}`);

    // Create virtual environment
    if (!venvExists(workspaceDir)) {
        log.info(`[whisper] Creating virtual environment at ${venvDir}…`);
        try {
            await execFileAsync(pythonBin, ["-m", "venv", venvDir]);
        } catch (err) {
            log.error(`[whisper] Failed to create venv: ${String(err)}`);
            return false;
        }
    }

    // Install packages
    log.info("[whisper] Installing Whisper + dependencies (one-time, may take a minute)…");
    try {
        await execFileAsync(
            getVenvPip(workspaceDir),
            ["install", "--quiet", "--upgrade", ...REQUIRED_PACKAGES],
            { timeout: 300_000 }, // 5 min timeout
        );
    } catch (err) {
        log.error(`[whisper] pip install failed: ${String(err)}`);
        return false;
    }

    // Write marker
    fs.writeFileSync(readyFile, new Date().toISOString());
    log.info("[whisper] Installation complete.");
    return true;
}

// ── Check ffmpeg ────────────────────────────────────────────────────────────
async function checkFfmpeg(workspaceDir: string, log: Logger): Promise<boolean> {
    // 1. Check if in PATH
    try {
        await execFileAsync("ffmpeg", ["-version"]);
        return true;
    } catch {
        // not in path
    }

    // 2. Check local bin
    const localFfmpeg = path.join(getBinDir(workspaceDir), process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg");
    if (fs.existsSync(localFfmpeg)) {
        log.info(`[whisper] Found local FFmpeg at ${localFfmpeg}`);
        return true;
    }

    log.warn(
        "[whisper] ffmpeg not found in PATH or local bin. Audio transcription will likely fail. " +
        "Please run 'powershell -ExecutionPolicy Bypass -File scripts/install-ffmpeg.ps1' to install it locally.",
    );
    return false;
}

// ── Port management ─────────────────────────────────────────────────────────
async function killPortOwner(port: number, log: Logger): Promise<void> {
    try {
        if (process.platform === "win32") {
            const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
            const lines = stdout.split("\n").filter(l => l.includes("LISTENING"));
            for (const line of lines) {
                const parts = line.trim().split(/\s+/);
                const pid = parts[parts.length - 1];
                if (pid && pid !== "0") {
                    log.info(`[whisper] Killing process ${pid} occupying port ${port}…`);
                    await execAsync(`taskkill /pid ${pid} /f /t`);
                }
            }
        } else {
            await execAsync(`fuser -k ${port}/tcp`).catch(() => { });
        }
    } catch {
        // likely no process found
    }
}

// ── Spawn and monitor ──────────────────────────────────────────────────────
async function spawnWhisperProcess(workspaceDir: string, log: Logger): Promise<void> {
    if (isShuttingDown) return;

    // Ensure port is free
    await killPortOwner(WHISPER_PORT, log);

    const venvPython = getVenvPython(workspaceDir);
    const serverScript = getServerScript(workspaceDir);
    if (!fs.existsSync(venvPython)) {
        log.error(`[whisper] venv python not found at ${venvPython} — cannot start server`);
        return;
    }

    log.info(`[whisper] Spawning server on port ${WHISPER_PORT}…`);

    const env: Record<string, string | undefined> = {
        ...process.env,
        WHISPER_PORT: String(WHISPER_PORT),
        WHISPER_MODEL: "base",
    };

    // Prepend local bin to PATH to ensure ffmpeg is found
    const binDir = getBinDir(workspaceDir);
    if (fs.existsSync(binDir)) {
        const pathKey = process.platform === "win32" ? "Path" : "PATH";
        const oldPath = process.env[pathKey] || "";
        env[pathKey] = `${binDir}${path.delimiter}${oldPath}`;
    }

    whisperProcess = spawn(venvPython, ["-u", serverScript], {
        env,
        stdio: ["ignore", "pipe", "pipe"],
        detached: false,
    });

    const debugFile = require("path").join(workspaceDir, "whisper-spawn.log");
    fs.appendFileSync(debugFile, `[${new Date().toISOString()}] Spawned ${venvPython} ${serverScript}\n`);

    whisperProcess.stdout?.on("data", (chunk: Buffer) => {
        fs.appendFileSync(debugFile, `[OUT] ${chunk.toString()}`);
        const lines = chunk.toString().split("\n").filter(Boolean);
        for (const line of lines) {
            log.info(`[whisper-py] ${line}`);
        }
    });

    whisperProcess.stderr?.on("data", (chunk: Buffer) => {
        fs.appendFileSync(debugFile, `[ERR] ${chunk.toString()}`);
        const text = chunk.toString().trim();
        if (text) log.warn(`[whisper-py] ${text}`);
    });

    whisperProcess.on("exit", (code, signal) => {
        fs.appendFileSync(debugFile, `[EXIT] code=${code} signal=${signal}\n`);
        whisperProcess = null;
        if (isShuttingDown) return;
        log.warn(`[whisper] Server exited (code=${code}, signal=${signal}). Restarting in 5s…`);
        restartTimer = setTimeout(() => spawnWhisperProcess(workspaceDir, log), 5000);
    });

    whisperProcess.on("error", (err) => {
        fs.appendFileSync(debugFile, `[SPAWN-ERROR] ${err.message}\n`);
        log.error(`[whisper] Process error: ${err.message}`);
    });
}

// ── Health probe ────────────────────────────────────────────────────────────
export async function isWhisperReady(log?: Logger): Promise<boolean> {
    try {
        const ctrl = new AbortController();
        const timeoutId = setTimeout(() => ctrl.abort(), 2000);
        const res = await fetch(`${WHISPER_BASE_URL}/health`, { signal: ctrl.signal });
        clearTimeout(timeoutId);
        return res.ok;
    } catch (err) {
        if (log) log.warn(`[whisper] health check failed: ${String(err)}`);
        return false;
    }
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Start the Whisper sidecar: install deps (if needed) then spawn the server.
 * Non-blocking — the install may take ~1 min the first time.
 * @param workspaceDir  Absolute path to the neer workspace root (contains .whisper/)
 */
export async function startWhisperSidecar(workspaceDir: string, log: Logger): Promise<void> {
    // Run install + spawn asynchronously so gateway doesn't block on first boots
    void (async () => {
        try {
            await checkFfmpeg(workspaceDir, log);
            const ready = await ensureWhisperInstalled(workspaceDir, log);
            if (!ready) {
                log.warn("[whisper] Sidecar not started (install failed or Python missing).");
                return;
            }
            await spawnWhisperProcess(workspaceDir, log);
        } catch (err) {
            log.error(`[whisper] Startup error: ${String(err)}`);
        }
    })();
}

/**
 * Gracefully stop the Whisper sidecar (call on gateway shutdown).
 */
export function stopWhisperSidecar(): void {
    isShuttingDown = true;
    if (restartTimer) {
        clearTimeout(restartTimer);
        restartTimer = null;
    }
    if (whisperProcess) {
        try {
            if (process.platform === "win32") {
                spawn("taskkill", ["/pid", String(whisperProcess.pid), "/f", "/t"]);
            } else {
                whisperProcess.kill("SIGTERM");
            }
        } catch {
            // best-effort
        }
        whisperProcess = null;
    }
}

/**
 * Send an audio buffer to the Whisper server for transcription.
 * Returns { text, language } or throws.
 */
export async function transcribeAudio(
    audioBuffer: Buffer,
    mimeType: string,
    filename = "audio.webm",
): Promise<{ text: string; language: string }> {
    const formData = new FormData();
    const blob = new Blob([new Uint8Array(audioBuffer)], { type: mimeType });
    formData.append("audio", blob, filename);

    const ctrl = new AbortController();
    const timeoutId = setTimeout(() => ctrl.abort(), 60_000); // 60s max

    let res: Response;
    try {
        res = await fetch(`${WHISPER_BASE_URL}/speech-to-text`, {
            method: "POST",
            body: formData,
            signal: ctrl.signal,
        });
    } finally {
        clearTimeout(timeoutId);
    }

    if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`Whisper server error ${res.status}: ${body}`);
    }

    const json = (await res.json()) as { text?: string; language?: string };
    return {
        text: json.text ?? "",
        language: json.language ?? "unknown",
    };
}
