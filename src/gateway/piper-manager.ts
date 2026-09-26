import { exec, execFile, spawn } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { promisify } from "node:util";
import { pipeline } from "node:stream/promises";

const execFileAsync = promisify(execFile);

// ── Constants ──────────────────────────────────────────────────────────────
const PIPER_RELEASE_URL = "https://github.com/rhasspy/piper/releases/download/2023.11.14-2/piper_windows_amd64.zip";
const VOICE_MODEL_URL = "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx";
const VOICE_CONFIG_URL = "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx.json";

function getTtsDir(): string {
    return path.join(process.cwd(), ".tts");
}

function getPiperExe(): string {
    return path.join(getTtsDir(), "piper", "piper.exe");
}

function getModelPath(): string {
    return path.join(getTtsDir(), "voices", "en_US-lessac-medium.onnx");
}

function getReadyFile(): string {
    return path.join(getTtsDir(), ".installed");
}

type Logger = { info: (m: string) => void; warn: (m: string) => void; error: (m: string) => void };

// ── Install routine (idempotent) ────────────────────────────────────────────

async function downloadFile(url: string, dest: string) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to download ${url}: ${response.statusText}`);
    if (!response.body) throw new Error(`No body for ${url}`);

    const fileStream = fs.createWriteStream(dest);
    // @ts-ignore - Node fetch body is a ReadableStream which is compatible enough with pipeline
    await pipeline(response.body, fileStream);
}

export async function ensurePiperInstalled(log: Logger): Promise<boolean> {
    const ttsDir = getTtsDir();
    const piperExe = getPiperExe();
    const modelPath = getModelPath();
    const readyFile = getReadyFile();

    if (fs.existsSync(readyFile) && fs.existsSync(piperExe) && fs.existsSync(modelPath)) {
        return true;
    }

    log.info("[piper] Installing local TTS (Piper)…");

    if (!fs.existsSync(ttsDir)) fs.mkdirSync(ttsDir, { recursive: true });
    const voicesDir = path.join(ttsDir, "voices");
    if (!fs.existsSync(voicesDir)) fs.mkdirSync(voicesDir, { recursive: true });

    try {
        // 1. Download Piper
        if (!fs.existsSync(piperExe)) {
            const zipPath = path.join(ttsDir, "piper.zip");
            log.info("[piper] Downloading Piper binary…");
            await downloadFile(PIPER_RELEASE_URL, zipPath);

            log.info("[piper] Extracting Piper…");
            // Use powershell to unzip to avoid extra npm deps
            const extractDir = path.join(ttsDir, "piper_temp");
            if (fs.existsSync(extractDir)) fs.rmSync(extractDir, { recursive: true, force: true });
            fs.mkdirSync(extractDir, { recursive: true });

            await promisify(exec)(`powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${extractDir}' -Force"`);

            // The zip contains a 'piper' folder
            const sourcePiper = path.join(extractDir, "piper");
            const destPiper = path.join(ttsDir, "piper");
            if (fs.existsSync(destPiper)) fs.rmSync(destPiper, { recursive: true, force: true });
            fs.renameSync(sourcePiper, destPiper);

            fs.rmSync(zipPath, { force: true });
            fs.rmSync(extractDir, { recursive: true, force: true });
        }

        // 2. Download Model
        if (!fs.existsSync(modelPath)) {
            log.info("[piper] Downloading voice model (en_US-lessac-medium)…");
            await downloadFile(VOICE_MODEL_URL, modelPath);
            await downloadFile(VOICE_CONFIG_URL, modelPath + ".json");
        }

        fs.writeFileSync(readyFile, new Date().toISOString());
        log.info("[piper] Installation complete.");
        return true;
    } catch (err) {
        log.error(`[piper] Installation failed: ${String(err)}`);
        return false;
    }
}

/**
 * Generate speech from text using Piper.
 * Returns the path to the temporary wav file.
 */
export async function generateSpeech(text: string, log: Logger): Promise<string | null> {
    const piperExe = getPiperExe();
    const modelPath = getModelPath();

    if (!fs.existsSync(piperExe) || !fs.existsSync(modelPath)) {
        log.error("[piper] Piper not installed. Call ensurePiperInstalled first.");
        return null;
    }

    const outputDir = path.join(getTtsDir(), "output");
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const timestamp = Date.now();
    const outputPath = path.join(outputDir, `speech_${timestamp}.wav`);

    try {
        // piper.exe --model model.onnx --output_file output.wav
        // Piper reads from stdin by default
        const child = spawn(piperExe, [
            "--model", modelPath,
            "--output_file", outputPath
        ]);

        child.stdin.write(text);
        child.stdin.end();

        await new Promise((resolve, reject) => {
            child.on("close", (code) => {
                if (code === 0) resolve(true);
                else reject(new Error(`Piper exited with code ${code}`));
            });
            child.on("error", reject);
        });

        return outputPath;
    } catch (err) {
        log.error(`[piper] Speech generation failed: ${String(err)}`);
        return null;
    }
}
