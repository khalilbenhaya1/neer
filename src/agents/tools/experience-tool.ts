
import { Type, type Static, type TObject } from "@sinclair/typebox";
import { memoryManager } from "../../cognition/memory.js";
import type { AgentTool } from "@mariozechner/pi-agent-core";

function createTool<T extends TObject>(config: {
    name: string;
    description: string;
    parameters: T;
    execute: (params: Static<T>) => Promise<any>;
}): AgentTool<T, unknown> {
    return {
        name: config.name,
        description: config.description,
        parameters: config.parameters,
        execute: async (_id: string, params: any) => {
            const result = await config.execute(params);
            return result;
        }
    } as any;
}

export const recordExperienceTool = createTool({
    name: "record_experience",
    description: "Log what worked and what didn't after a goal is finished. CRITICAL: 'outcome' must be 'success' or 'failure'.",
    parameters: Type.Object({
        goalTitle: Type.String({ description: "Title of the goal related to this experience" }),
        outcome: Type.String({ description: "Outcome of the goal ('success' or 'failure')" }),
        lessonsLearned: Type.String({ description: "Key lessons learned, what to avoid, or what worked well" }),
    }),
    execute: async ({ goalTitle, outcome, lessonsLearned }) => {
        // Normalize outcome to be robust
        let cleanOutcome: "success" | "failure" = "success";
        const lower = outcome.trim().toLowerCase();
        if (lower.includes("fail") || lower.includes("error")) {
            cleanOutcome = "failure";
        }

        const experience = await memoryManager.recordExperience({
            goalTitle,
            outcome: cleanOutcome,
            lessonsLearned,
        });
        return {
            content: [
                {
                    type: "text",
                    text: `Experience recorded (ID: ${experience.id}). Lessons learned saved for future reference.`,
                },
            ],
        };
    },
});

export const recallExperiencesTool = createTool({
    name: "recall_experiences",
    description: "Search past memory for solutions related to the current task.",
    parameters: Type.Object({
        query: Type.String({ description: "Keywords to search for in past experiences" }),
    }),
    execute: async ({ query }) => {
        const experiences = await memoryManager.searchExperiences(query);
        if (experiences.length === 0) {
            return {
                content: [{ type: "text", text: "No relevant past experiences found." }],
            };
        }
        const formatted = experiences
            .map((exp) => `- [${exp.outcome.toUpperCase()}] ${exp.goalTitle}: ${exp.lessonsLearned}`)
            .join("\n");

        return {
            content: [{ type: "text", text: `Recalled Experiences:\n${formatted}` }],
        };
    },
});
