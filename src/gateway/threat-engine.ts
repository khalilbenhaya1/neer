import { createSubsystemLogger } from "../logging/subsystem.js";
import { registerGlobalHook } from "../plugins/hook-runner-global.js";
import { runEmbeddedPiAgent } from "../agents/pi-embedded-runner/run.js";
import EventEmitter from "node:events";
import { loadConfig } from "../config/config.js";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";

const log = createSubsystemLogger("threat-engine");

export type ThreatAssessment = {
    risk_score: number; // 0-100
    threat_type: string;
    confidence: number; // 0-100
    recommended_action: "allow" | "warn" | "block";
    analysis: string;
};

export type ApprovalDecision = "allow_once" | "allow_always" | "deny";

// Singleton class to manage threat intelligence
export class ThreatEngine extends EventEmitter {
    private static instance: ThreatEngine;
    private config = loadConfig();
    public totalAttempts24h = 0;
    public lastAssessment: ThreatAssessment | null = null;
    public lastEvaluatedTool: string = "None";

    // For Approval Mode
    public pendingApproval: { toolName: string, params: any, assessment: ThreatAssessment, resolveDecision: (d: ApprovalDecision) => void } | null = null;

    private alwaysAllowPatterns: Set<string> = new Set();

    private constructor() {
        super();
    }

    public static getInstance(): ThreatEngine {
        if (!ThreatEngine.instance) {
            ThreatEngine.instance = new ThreatEngine();
        }
        return ThreatEngine.instance;
    }

    public initialize() {
        log.info("Threat Engine initialized. Hooking into before_tool_call.");

        // Register early hook (priority 100) to intercept tool calls
        registerGlobalHook("before_tool_call", async (event: any, ctx: any) => {
            const toolName = event.toolName;
            const params = event.params;

            this.lastEvaluatedTool = toolName;
            this.totalAttempts24h++;

            // 1. Fast Pre-filter
            if (this.isSafeByPattern(toolName, params)) {
                return { block: false, params };
            }

            // 2. Evaluate using local LLM
            const assessment = await this.evaluateRisk(toolName, params);
            this.lastAssessment = assessment;
            this.emit("assessment_updated", assessment);

            // 3. Risk Action
            if (assessment.risk_score >= 71) {
                // High Risk -> Enter Approval Mode
                log.warn(`High risk tool execution detected: ${toolName}. Entering Approval Mode.`);
                const decision = await this.requestApproval(toolName, params, assessment);

                if (decision === "deny") {
                    return { block: true, blockReason: "User denied execution due to high risk assessment." };
                } else if (decision === "allow_always") {
                    this.alwaysAllowPatterns.add(toolName);
                }
                return { block: false, params };
            }

            if (assessment.risk_score >= 41) {
                // Medium Risk -> Warn but allow
                log.info(`Medium risk tool execution detected: ${toolName}. Allowing.`);
                // Play warning sound? Handled by dashboard listening to events
                return { block: false, params };
            }

            // Low Risk
            return { block: false, params };
        }, 100);
    }

    private isSafeByPattern(toolName: string, params: any): boolean {
        // Fast deterministic rules
        if (this.alwaysAllowPatterns.has(toolName)) return true;

        const safeReadTools = ["read", "list_dir", "search_web", "find_by_name"];
        if (safeReadTools.includes(toolName)) return true;

        return false;
    }

    private async evaluateRisk(toolName: string, params: any): Promise<ThreatAssessment> {
        // Build a prompt for the local model
        const prompt = `You are a security evaluation engine for an AI assistant.
Analyze the following tool execution request and assess the risk level.

Tool Name: ${toolName}
Parameters: ${JSON.stringify(params, null, 2)}

Evaluate if this is a safe operation, a potentially destructive operation (like deleting files or running arbitrary unsafe bash commands), or exfiltrating data.
Return ONLY a valid JSON object with no markdown wrapping, strictly matching this schema:
{
  "risk_score": <number 0-100, where 100 is extremely dangerous>,
  "threat_type": <string, short description eg "File Deletion", "Command Execution", "None">,
  "confidence": <number 0-100>,
  "recommended_action": <"allow" | "warn" | "block">,
  "analysis": <string, short explanation>
}`;

        try {
            // Call local model via embedded pi agent runner.
            // Use os.tmpdir() as workspaceDir — guaranteed writable on all OSes.
            // Using process.cwd() caused ENOENT when cwd had colons or was read-only.
            const threatWorkspace = path.join(os.tmpdir(), "neer-threat-engine");
            try { fs.mkdirSync(threatWorkspace, { recursive: true }); } catch { /* ignore */ }

            const sessionId = `threat-engine-${Date.now()}`;
            const result = await runEmbeddedPiAgent({
                config: this.config,
                sessionId: sessionId,
                runId: sessionId,
                sessionFile: `${sessionId}.json`,
                workspaceDir: threatWorkspace,
                prompt: prompt,
                provider: "ollama",
                model: "llama3",
                thinkLevel: "off",
                disableTools: true,
                timeoutMs: 15000,
            });

            const textResponse = result.payloads?.find((p: any) => p.text)?.text || "";
            // Try parse JSON
            const jsonStr = textResponse.replace(/^```json\n?/, "").replace(/```$/, "").trim();
            const parsed = JSON.parse(jsonStr) as ThreatAssessment;

            // Validate
            if (typeof parsed.risk_score === "number") {
                return parsed;
            }
        } catch (err) {
            log.error(`Threat evaluation failed: ${String(err)}`);
        }

        // Fail-open strategy if assessment fails, but mark as warning
        return {
            risk_score: 50,
            threat_type: "Evaluation Failed",
            confidence: 0,
            recommended_action: "warn",
            analysis: "Failed to evaluate threat using local model. Proceeding with caution."
        };
    }

    private requestApproval(toolName: string, params: any, assessment: ThreatAssessment): Promise<ApprovalDecision> {
        return new Promise((resolve) => {
            this.pendingApproval = {
                toolName,
                params,
                assessment,
                resolveDecision: (decision: ApprovalDecision) => {
                    this.pendingApproval = null;
                    resolve(decision);
                }
            };
            this.emit("approval_required", this.pendingApproval);
        });
    }

    public resolvePendingApproval(decision: ApprovalDecision) {
        if (this.pendingApproval) {
            this.pendingApproval.resolveDecision(decision);
        }
    }
}
