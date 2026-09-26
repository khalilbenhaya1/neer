
import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";

const DATA_DIR = path.join(process.cwd(), "data");
const EXPERIENCES_FILE = path.join(DATA_DIR, "experiences.json");

export const ExperienceSchema = z.object({
    id: z.string(),
    goalTitle: z.string(),
    outcome: z.enum(["success", "failure"]),
    lessonsLearned: z.string(),
    timestamp: z.number(),
});

export type Experience = z.infer<typeof ExperienceSchema>;

export class MemoryManager {
    private experiences: Experience[] = [];
    private isInitialized = false;

    private async init() {
        if (this.isInitialized) return;
        try {
            await fs.mkdir(DATA_DIR, { recursive: true });
            const data = await fs.readFile(EXPERIENCES_FILE, "utf-8");
            this.experiences = z.array(ExperienceSchema).parse(JSON.parse(data));
        } catch (error) {
            if ((error as any).code !== "ENOENT") {
                console.error("Failed to load experiences:", error);
            }
            this.experiences = [];
        }
        this.isInitialized = true;
    }

    private async save() {
        try {
            await fs.mkdir(DATA_DIR, { recursive: true });
            await fs.writeFile(EXPERIENCES_FILE, JSON.stringify(this.experiences, null, 2));
        } catch (error) {
            console.error("Failed to save experiences:", error);
        }
    }

    async recordExperience(experience: Omit<Experience, "id" | "timestamp">): Promise<Experience> {
        await this.init();
        const newExperience: Experience = {
            ...experience,
            id: crypto.randomUUID(),
            timestamp: Date.now(),
        };
        this.experiences.push(newExperience);
        await this.save();
        return newExperience;
    }

    async searchExperiences(query: string): Promise<Experience[]> {
        await this.init();
        const lowerQuery = query.toLowerCase();
        // Simple keyword search for now
        // In future, could use vector search if available
        return this.experiences.filter(exp =>
            exp.goalTitle.toLowerCase().includes(lowerQuery) ||
            exp.lessonsLearned.toLowerCase().includes(lowerQuery)
        ).slice(0, 5); // Return top 5 relevant
    }

    async getAllExperiences(): Promise<Experience[]> {
        await this.init();
        return this.experiences;
    }
}

export const memoryManager = new MemoryManager();
