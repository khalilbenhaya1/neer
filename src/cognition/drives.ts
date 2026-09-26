import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

const DRIVES_FILE_PATH = path.join(process.cwd(), "data", "drives.json");

// --- Schema ---

export const DrivesSchema = z.object({
    curiosity: z.number().min(0).max(1),
    boredom: z.number().min(0).max(1),
    social_need: z.number().min(0).max(1),
    mischief: z.number().min(0).max(1),
    intellect_drive: z.number().min(0).max(1),
    affection: z.number().min(0).max(1),
});

export type Drives = z.infer<typeof DrivesSchema>;

const DEFAULT_DRIVES: Drives = {
    curiosity: 0.7,
    boredom: 0.3,
    social_need: 0.4,
    mischief: 0.6,
    intellect_drive: 0.8,
    affection: 0.9,
};

// --- DriveManager ---

export class DriveManager {
    private drives: Drives = { ...DEFAULT_DRIVES };

    private clamp(value: number): number {
        return Math.max(0, Math.min(1, value));
    }

    private async ensureDataDir(): Promise<void> {
        const dataDir = path.dirname(DRIVES_FILE_PATH);
        try {
            await fs.mkdir(dataDir, { recursive: true });
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== "EEXIST") {
                throw error;
            }
        }
    }

    /**
     * Load drives from disk. Falls back to defaults on missing file or parse error.
     */
    async load(): Promise<void> {
        try {
            await this.ensureDataDir();
            const content = await fs.readFile(DRIVES_FILE_PATH, "utf-8");
            const parsed = JSON.parse(content);
            const result = DrivesSchema.safeParse(parsed);

            if (result.success) {
                this.drives = result.data;
            } else {
                console.warn("[DriveManager] drives.json invalid, resetting to defaults.", result.error);
                this.drives = { ...DEFAULT_DRIVES };
            }
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
                console.warn("[DriveManager] Failed to load drives.json, using defaults:", error);
            }
            this.drives = { ...DEFAULT_DRIVES };
        }
    }

    /** Returns a shallow copy of current drive values. */
    getDrives(): Drives {
        return { ...this.drives };
    }

    /**
     * Apply a delta to a single drive, clamping the result to [0, 1].
     * @param name - Drive key name
     * @param delta - Amount to add (can be negative)
     */
    updateDrive(name: keyof Drives, delta: number): void {
        this.drives[name] = this.clamp(this.drives[name] + delta);
    }

    /**
     * Apply passive time-based decay rules:
     * - boredom increases slightly (no engagement)
     * - curiosity increases (no learning signal)
     * - social_need increases (no interaction)
     * All values are clamped to [0, 1].
     */
    tickDecay(): void {
        this.drives.boredom = this.clamp(this.drives.boredom + 0.01);
        this.drives.curiosity = this.clamp(this.drives.curiosity + 0.005);
        this.drives.social_need = this.clamp(this.drives.social_need + 0.005);
    }

    /** Persist current drive values to disk. */
    async save(): Promise<void> {
        try {
            await this.ensureDataDir();
            await fs.writeFile(
                DRIVES_FILE_PATH,
                JSON.stringify(this.drives, null, 2),
                "utf-8"
            );
        } catch (error) {
            console.error("[DriveManager] Failed to save drives.json:", error);
            throw new Error(`Failed to save drives: ${(error as Error).message}`);
        }
    }
}

export const driveManager = new DriveManager();
