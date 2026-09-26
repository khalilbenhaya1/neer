import { Worker } from "node:worker_threads";
import { activityTracker } from "./activity.js";
import { startLiveLoop, stopLiveLoop } from "./live-loop.js";

const ACTIVITY_HIGH_THRESHOLD = 50; // Threshold for fast pulses
const FAST_PULSE_MS = 2 * 60 * 1000; // 2 minutes (Fast organization)
const SLOW_PULSE_MS = 30 * 60 * 1000; // 30+ minutes (Idle Deep Reflection)
const MAX_EXECUTIONS_PER_HOUR = 3;

let isPulseRunning = false;
let isWorkerActive = false;
let pulseTimer: NodeJS.Timeout | null = null;
let hourlyExecutionCount = 0;
let lastExecutionHour = new Date().getHours();
let worker: Worker | null = null;

export function startCognitivePulse() {
    if (isPulseRunning) return;

    console.log("[Pulse] Cognitive Pulse Engine Starting...");
    isPulseRunning = true;

    // Resolve the worker file
    // In dev (TS) or prod (JS), we ask for the .js extension since NodeNext resolves .js to .ts
    const workerFile = new URL("./pulse.worker.js", import.meta.url);

    // Use tsx if we are running the unbuilt typescript directly
    const execArgv = import.meta.url.endsWith(".ts") && !process.env.COREPACK_ROOT
        ? [...process.execArgv, "--import", "tsx"]
        : process.execArgv;

    try {
        worker = new Worker(workerFile, { execArgv });

        worker.on("message", (msg) => {
            if (msg.type === "PULSE_DONE") {
                isWorkerActive = false;
                scheduleNextPulse();
            }
        });

        worker.on("error", (err) => {
            console.error("[Pulse] Worker thread error:", err);
            isWorkerActive = false;
            scheduleNextPulse();
        });

        worker.on("exit", (code) => {
            if (code !== 0 && isPulseRunning) {
                console.error(`[Pulse] Worker thread stopped with exit code ${code}`);
                isWorkerActive = false;
                worker = null;
                // Attempt restart — unref so this timer doesn't hold the process alive
                const restartTimer = setTimeout(() => {
                    if (isPulseRunning) {
                        isPulseRunning = false;
                        startCognitivePulse();
                    }
                }, 5000);
                restartTimer.unref();
            }
        });
    } catch (e) {
        console.warn("[Pulse] Failed to start native TS worker directly, attempting plain start:", e);
        worker = new Worker(workerFile);
        worker.on("message", (msg) => {
            if (msg.type === "PULSE_DONE") {
                isWorkerActive = false;
                scheduleNextPulse();
            }
        });
        worker.on("error", (err) => {
            console.error("[Pulse] Worker fallback error:", err);
            isWorkerActive = false;
            scheduleNextPulse();
        });
    }

    // Run immediately on start
    void triggerPulse();

    // Start the live runtime engine alongside the pulse
    startLiveLoop();
}

export function stopCognitivePulse() {
    if (!isPulseRunning) return;

    console.log("[Pulse] Cognitive Pulse Engine Stopping...");
    isPulseRunning = false;

    if (pulseTimer) {
        clearTimeout(pulseTimer);
        pulseTimer = null;
    }

    if (worker) {
        worker.terminate();
        worker = null;
    }
    isWorkerActive = false;

    // Stop the live runtime engine
    stopLiveLoop();
}

function scheduleNextPulse() {
    if (!isPulseRunning) return;

    if (pulseTimer) {
        clearTimeout(pulseTimer);
    }

    const currentScore = activityTracker.getScore();
    let delayMs = SLOW_PULSE_MS;

    if (currentScore > ACTIVITY_HIGH_THRESHOLD) {
        delayMs = FAST_PULSE_MS;
        console.log(`[Pulse] High systemic activity (Score: ${currentScore.toFixed(2)}). Scheduling fast pulse in ${Math.round(delayMs / 60000)}m`);
    } else if (currentScore > 0) {
        delayMs = 5 * 60 * 1000; // 5 minutes standard
        console.log(`[Pulse] Moderate systemic activity (Score: ${currentScore.toFixed(2)}). Scheduling normal pulse in ${Math.round(delayMs / 60000)}m`);
    } else {
        console.log(`[Pulse] Idle systemic activity. Scheduling slow pulse in ${Math.round(delayMs / 60000)}m`);
    }

    // Important fallback so node process doesn't hang purely on pulse timers
    pulseTimer = setTimeout(() => {
        void triggerPulse();
    }, delayMs);
    pulseTimer.unref();
}

function triggerPulse() {
    if (!isPulseRunning || !worker) return;

    // 0. Autonomous Mode Guard
    if (process.env.NEER_AUTONOMOUS_MODE !== "true") {
        console.log("[Pulse] Skipped (autonomous disabled)");
        scheduleNextPulse();
        return;
    }

    // 1. Session Guard
    if (isWorkerActive) {
        console.log("[Pulse] Worker already busy. Skipping.");
        scheduleNextPulse();
        return;
    }

    // 2. Rate Limiting Logic
    const currentHour = new Date().getHours();
    if (currentHour !== lastExecutionHour) {
        hourlyExecutionCount = 0;
        lastExecutionHour = currentHour;
    }

    if (hourlyExecutionCount >= MAX_EXECUTIONS_PER_HOUR) {
        console.log("[Pulse] Skipping pulse: Max hourly executions reached.");
        scheduleNextPulse();
        return;
    }

    // Trigger worker
    hourlyExecutionCount++;
    isWorkerActive = true;

    console.log(`[Pulse] Triggering worker... (Hourly usage: ${hourlyExecutionCount}/${MAX_EXECUTIONS_PER_HOUR})`);
    worker.postMessage({ type: "PULSE_TICK" });
}
