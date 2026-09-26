
import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

export type GoalStatus = "pending" | "active" | "completed" | "failed";

export interface Goal {
    id: string;
    title: string;
    description: string;
    priority: number; // 1-10
    status: GoalStatus;
    createdAt: number;
    updatedAt?: number;
    completedAt?: number;
}

const GOALS_FILE_PATH = path.join(process.cwd(), "data", "goals.json");

// Zod schema for runtime validation of stored data
const GoalSchema = z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    priority: z.number().min(1).max(10),
    status: z.enum(["pending", "active", "completed", "failed"]),
    createdAt: z.number(),
    updatedAt: z.number().optional(),
    completedAt: z.number().optional(),
});

const GoalsFileSchema = z.array(GoalSchema);

export class GoalManager {
    private goals: Goal[] = [];
    private initialized = false;

    private async ensureDataDir() {
        const dataDir = path.dirname(GOALS_FILE_PATH);
        try {
            await fs.mkdir(dataDir, { recursive: true });
        } catch (error) {
            // Ignore if directory exists, rethrow other errors
            if ((error as any).code !== "EEXIST") {
                throw error;
            }
        }
    }

    async loadGoals(): Promise<Goal[]> {
        if (this.initialized) {
            return this.goals;
        }

        try {
            await this.ensureDataDir();
            const fileContent = await fs.readFile(GOALS_FILE_PATH, "utf-8");
            const parsed = JSON.parse(fileContent);
            const result = GoalsFileSchema.safeParse(parsed);

            if (result.success) {
                this.goals = result.data;
            } else {
                console.warn("Goals file corrupted or invalid format. Starting with empty list.", result.error);
                this.goals = [];
            }
        } catch (error) {
            // If file doesn't exist, start empty. Otherwise log warning.
            if ((error as any).code !== "ENOENT") {
                console.warn("Failed to load goals file:", error);
            }
            this.goals = [];
        }

        this.initialized = true;
        return this.goals;
    }

    async saveGoals(): Promise<void> {
        try {
            await this.ensureDataDir();
            await fs.writeFile(
                GOALS_FILE_PATH,
                JSON.stringify(this.goals, null, 2),
                "utf-8"
            );
        } catch (error) {
            console.error("Failed to save goals:", error);
            throw new Error(`Failed to save goals: ${(error as Error).message}`);
        }
    }

    async createGoal(
        title: string,
        description: string,
        priority: number = 5
    ): Promise<Goal> {
        await this.loadGoals();

        const newGoal: Goal = {
            id: crypto.randomUUID(),
            title,
            description,
            priority: Math.max(1, Math.min(10, priority)), // Clamp priority 1-10
            status: "pending",
            createdAt: Date.now(),
            updatedAt: Date.now(), // Initialize updatedAt
        };

        this.goals.push(newGoal);
        await this.saveGoals();
        return newGoal;
    }

    async listGoals(status?: GoalStatus): Promise<Goal[]> {
        await this.loadGoals();
        if (status) {
            return this.goals.filter((g) => g.status === status);
        }
        return this.goals;
    }

    async updateGoalStatus(id: string, status: GoalStatus): Promise<Goal | null> {
        await this.loadGoals();
        const goal = this.goals.find((g) => g.id === id);
        if (!goal) return null;

        goal.status = status;
        goal.updatedAt = Date.now(); // Update updatedAt

        if (status === "completed" || status === "failed") {
            goal.completedAt = Date.now();
        } else {
            goal.completedAt = undefined;
        }

        await this.saveGoals();
        return goal;
    }

    async deleteGoal(id: string): Promise<boolean> {
        await this.loadGoals();
        const initialLength = this.goals.length;
        this.goals = this.goals.filter((g) => g.id !== id);

        if (this.goals.length !== initialLength) {
            await this.saveGoals();
            return true;
        }
        return false;
    }
    async recoverStuckGoals(timeoutMs: number): Promise<number> {
        await this.loadGoals();
        const now = Date.now();
        let recoveredCount = 0;
        let changed = false;

        for (const goal of this.goals) {
            if (goal.status === "active") {
                const lastActivity = goal.updatedAt || goal.createdAt;
                if (now - lastActivity > timeoutMs) {
                    goal.status = "pending";
                    goal.updatedAt = now;
                    recoveredCount++;
                    changed = true;
                }
            }
        }

        if (changed) {
            await this.saveGoals();
        }
        return recoveredCount;
    }
}

export const goalManager = new GoalManager();
