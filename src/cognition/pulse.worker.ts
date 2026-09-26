import { parentPort } from "node:worker_threads";
import { agentCommand } from "../commands/agent.js";
import { driveManager } from "./drives.js";
import { goalManager } from "./goals.js";

// Patch process.chdir in worker thread because it's not supported and will throw
// ERR_WORKER_UNSUPPORTED_OPERATION when agent runners try to change the workspace dir.
try {
    process.chdir = (dir: string) => {
        // No-op in worker thread
    };
} catch (e) {
    // Ignore
}

const IDLE_REFLECTION_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
let lastIdleReflectionTime = 0;

// Guard against unhandled rejections inside the worker crashing the gateway process.
// agentCommand can fail if the model is unavailable; we catch at call sites but
// this is a last-resort safety net.
process.on("unhandledRejection", (reason) => {
    console.warn("[Pulse Worker] Suppressed unhandledRejection:", String(reason));
});

if (parentPort) {
    parentPort.on("message", async (msg) => {
        if (msg.type === "PULSE_TICK") {
            try {
                // Drive Tick
                await driveManager.load();
                driveManager.tickDecay();
                await driveManager.save();

                // Drive-Based Decision Layer
                const drives = driveManager.getDrives();

                // Micro Actions (lightweight internal reactions)
                if (drives.boredom > 0.6) {
                    console.log("[Drives] NEER feels bored.");
                }
                if (drives.curiosity > 0.8) {
                    console.log("[Drives] NEER curiosity rising.");
                }
                if (drives.social_need > 0.8) {
                    console.log("[Drives] NEER experiencing social need.");
                }

                // Autonomous Goal Generation (duplicate-safe)
                const allPending = await goalManager.listGoals("pending");
                const pendingTitles = new Set(allPending.map((g) => g.title));

                if (drives.boredom > 0.75 && !pendingTitles.has("Explore something new")) {
                    await goalManager.createGoal(
                        "Explore something new",
                        "Autonomous exploration triggered by boredom",
                        4
                    );
                    console.log("[Drives] Goal created: Explore something new (boredom)");
                }

                if (drives.curiosity > 0.85 && !pendingTitles.has("Deep dive into AI topic")) {
                    await goalManager.createGoal(
                        "Deep dive into AI topic",
                        "Curiosity-driven deep exploration",
                        6
                    );
                    console.log("[Drives] Goal created: Deep dive into AI topic (curiosity)");
                }

                if (drives.social_need > 0.85 && !pendingTitles.has("Check in with user")) {
                    await goalManager.createGoal(
                        "Check in with user",
                        "High social need detected",
                        5
                    );
                    console.log("[Drives] Goal created: Check in with user (social_need)");
                }

                // Recover Stuck Goals
                const recovered = await goalManager.recoverStuckGoals(30 * 60 * 1000); // 30 mins
                if (recovered > 0) {
                    console.log(`[Pulse Worker] Recovered ${recovered} stuck goals.`);
                }

                const pendingGoals = await goalManager.listGoals("pending");
                if (pendingGoals.length === 0) {
                    // Idle Reflection Logic
                    const now = Date.now();
                    if (now - lastIdleReflectionTime > IDLE_REFLECTION_INTERVAL_MS) {
                        console.log("[Pulse Worker] No pending goals. Triggering Idle Self-Reflection...");
                        lastIdleReflectionTime = now;

                        // Clean idle reflection — no fake alerts, no manufactured urgency.
                        // Just ask the agent to review health and only create a goal if genuinely needed.
                        const prompt = `
[IDLE SELF-REFLECTION EVENT]
You are running in background maintenance mode because there are no pending user tasks.

YOUR TASK:
1. Review your system health or recent memory logs.
2. If you notice persistent warnings or genuine housekeeping tasks, use the 'create_goal' tool to assign yourself a new goal to investigate or fix it.
3. If everything is healthy, simply respond with a short status summary and exit.
4. Do NOT create a goal unless there is a genuine issue or improvement to be made.
`;

                        try {
                            const timeoutMs = 90_000; // 90 seconds max for idle reflection
                            let timer: NodeJS.Timeout | undefined;
                            await Promise.race([
                                agentCommand({
                                    message: prompt,
                                    sessionKey: "pulse:main",
                                    agentId: "main",
                                    thinking: "low",
                                    verbose: "off",
                                }),
                                new Promise<never>((_, reject) => {
                                    timer = setTimeout(() => reject(new Error("idle reflection timeout")), timeoutMs);
                                }),
                            ]).finally(() => {
                                if (timer) clearTimeout(timer);
                            });
                            console.log("[Pulse Worker] Idle Self-Reflection completed.");
                        } catch (reflErr) {
                            console.warn("[Pulse Worker] Idle Self-Reflection failed (non-fatal):", String(reflErr));
                        }
                    }
                    parentPort?.postMessage({ type: "PULSE_DONE", status: "idle" });
                    return;
                }

                // Sort by priority desc
                pendingGoals.sort((a, b) => b.priority - a.priority);
                const targetGoal = pendingGoals[0];

                console.log(`[Pulse Worker] Selected Goal: "${targetGoal.title}" (ID: ${targetGoal.id})`);

                // Status Update and Lock
                await goalManager.updateGoalStatus(targetGoal.id, "active");

                const prompt = `
[COGNITIVE PULSE EVENT]
You are being invoked by the system's autonomic nervous system to address a pending goal.

GOAL: ${targetGoal.title}
PRIORITY: ${targetGoal.priority}
DESCRIPTION: ${targetGoal.description}

YOUR TASK:
1. Analyze this goal.
2. **MEMORY CHECK**: Before acting, you MUST use the 'recall_experiences' tool to see if we have dealt with similar goals before.
3. Execute necessary tools to achieve the goal or make significant progress.
4. If the goal is simple, complete it.
5. If complex, break it down or take the first step.
6. **IMPORTANT**: You MUST use the 'complete_goal' tool if you finish it, or leave it active if it needs more work.
7. **LESSONS LEARNED**: After finishing your work (success or failure), you MUST use the 'record_experience' tool to log what happened.
8. If you cannot complete it, clarify why in your final response.
`;

                try {
                    const timeoutMs = 90_000; // 90 seconds max for goal execution
                    let timer: NodeJS.Timeout | undefined;
                    await Promise.race([
                        agentCommand({
                            message: prompt,
                            sessionKey: "pulse:main",
                            agentId: "main",
                            thinking: "low",
                            verbose: "off",
                        }),
                        new Promise<never>((_, reject) => {
                            timer = setTimeout(() => reject(new Error("pulse agent timeout")), timeoutMs);
                        }),
                    ]).finally(() => {
                        if (timer) clearTimeout(timer);
                    });
                    console.log(`[Pulse Worker] Agent session completed for Goal ${targetGoal.id}.`);
                } catch (agentErr) {
                    console.warn(`[Pulse Worker] Agent command failed for Goal ${targetGoal.id} (non-fatal):`, String(agentErr));
                }

                parentPort?.postMessage({ type: "PULSE_DONE", status: "completed", goalId: targetGoal.id });

            } catch (error) {
                console.error("[Pulse Worker] Critical Error in Pulse Worker Loop:", error);
                parentPort?.postMessage({ type: "PULSE_DONE", status: "error", error: String(error) });
            }
        }
    });
}
