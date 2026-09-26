import { Type, type Static, type TObject } from "@sinclair/typebox";
import { goalManager } from "../../cognition/goals.js";
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

export const createGoalTool = createTool({
    name: "create_goal",
    description: "Create a new goal to track a long-term objective.",
    parameters: Type.Object({
        title: Type.String({ description: "Title of the goal" }),
        description: Type.String({ description: "Detailed description of the goal" }),
        priority: Type.Optional(Type.Number({ minimum: 1, maximum: 10, description: "Priority level (1-10)" })),
    }),
    execute: async ({ title, description, priority }) => {
        const goal = await goalManager.createGoal(title, description, priority);
        return {
            content: [
                {
                    type: "text",
                    text: `Goal created: ${goal.title} (ID: ${goal.id})`,
                },
            ],
        };
    },
});

export const listGoalsTool = createTool({
    name: "list_goals",
    description: "List all current goals.",
    parameters: Type.Object({
        status: Type.Optional(
            Type.Union([
                Type.Literal("pending"),
                Type.Literal("active"),
                Type.Literal("completed"),
                Type.Literal("failed"),
            ], { description: "Filter by status" })
        ),
    }),
    execute: async ({ status }) => {
        const goals = await goalManager.listGoals(status);
        if (goals.length === 0) {
            return {
                content: [{ type: "text", text: "No goals found." }],
            };
        }
        const formatted = goals
            .map((g) => `- [${g.status.toUpperCase()}] ${g.title} (ID: ${g.id}): ${g.description}`)
            .join("\n");

        return {
            content: [{ type: "text", text: `Current Goals:\n${formatted}` }],
        };
    },
});

export const completeGoalTool = createTool({
    name: "complete_goal",
    description: "Mark a goal as completed.",
    parameters: Type.Object({
        id: Type.String({ description: "The distinct ID (UUID) of the goal to complete. Do NOT use the title." }),
    }),
    execute: async ({ id }) => {
        const goal = await goalManager.updateGoalStatus(id, "completed");
        if (!goal) {
            return {
                isError: true,
                content: [{ type: "text", text: `Goal not found with ID: ${id}` }],
            };
        }
        return {
            content: [{ type: "text", text: `Goal "${goal.title}" marked as completed.` }],
        };
    },
});

export const deleteGoalTool = createTool({
    name: "delete_goal",
    description: "Delete a goal permanently.",
    parameters: Type.Object({
        id: Type.String({ description: "ID of the goal to delete" }),
    }),
    execute: async ({ id }) => {
        const success = await goalManager.deleteGoal(id);
        if (!success) {
            return {
                isError: true,
                content: [{ type: "text", text: `Goal not found with ID: ${id}` }],
            };
        }
        return {
            content: [{ type: "text", text: `Goal deleted successfully.` }],
        };
    },
});
