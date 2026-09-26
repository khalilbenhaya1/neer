
import { log } from "./pi-embedded-runner/logger.js"; // Ensure logger is available or use console

type ModelRef = {
    provider: string;
    model: string;
};

export class DynamicFallbackManager {
    private cooldowns: Map<string, number> = new Map();
    private freeModelsPool: string[] = [];
    private lastFetchTime: number = 0;
    private readonly FETCH_INTERVAL = 1000 * 60 * 60; // 1 hour buffer for free pool refresh

    /**
     * Reports a failure for a specific model, putting it on cooldown.
     * @param modelId Full model ID (e.g. "openrouter/google/gemini-2.0-flash-exp:free")
     * @param durationMs Cooldown duration in ms (default 1 hour)
     */
    reportFailure(modelId: string, durationMs: number = 3600000) {
        const expiresAt = Date.now() + durationMs;
        this.cooldowns.set(modelId, expiresAt);
        log.warn(`[DynamicFallback] Model ${modelId} cooldown until ${new Date(expiresAt).toISOString()}`);
    }

    isCoolingDown(modelId: string): boolean {
        const expiresAt = this.cooldowns.get(modelId);
        if (!expiresAt) return false;
        if (Date.now() > expiresAt) {
            this.cooldowns.delete(modelId);
            return false;
        }
        return true;
    }

    /**
     * Fetches free models from OpenRouter API if pool is empty or stale.
     */
    async fetchFreeOpenRouterModels() {
        if (this.freeModelsPool.length > 0 && Date.now() - this.lastFetchTime < this.FETCH_INTERVAL) {
            return;
        }

        try {
            log.info("[DynamicFallback] Fetching free models from OpenRouter...");
            const response = await fetch("https://openrouter.ai/api/v1/models");
            if (!response.ok) {
                throw new Error(`Failed to fetch models: ${response.statusText}`);
            }
            const data = await response.json() as { data: any[] };

            const freeModels = data.data
                .filter((m: any) => {
                    const promptPrice = parseFloat(m.pricing?.prompt || "1");
                    const completionPrice = parseFloat(m.pricing?.completion || "1");
                    return promptPrice === 0 && completionPrice === 0;
                })
                .map((m: any) => `openrouter/${m.id}`);

            if (freeModels.length > 0) {
                this.freeModelsPool = freeModels;
                this.lastFetchTime = Date.now();
                log.info(`[DynamicFallback] Found ${freeModels.length} free models: ${freeModels.slice(0, 3).join(", ")}...`);
            }
        } catch (err: any) {
            log.error(`[DynamicFallback] Error fetching free models: ${err.message}`);
            // Fallback to a hardcoded list of known free/cheap models if API fails
            if (this.freeModelsPool.length === 0) {
                this.freeModelsPool = [
                    "openrouter/google/gemini-2.0-flash-exp:free",
                    "openrouter/google/gemini-2.0-flash-lite-preview-02-05:free",
                    "openrouter/google/gemini-2.0-pro-exp-02-05:free",
                    "openrouter/deepseek/deepseek-r1:free",
                    "openrouter/nousresearch/hermes-3-llama-3.1-405b:free"
                ];
            }
        }
    }

    /**
     * Determines the next best fallback model.
     * 1. Checks static env fallbacks.
     * 2. Checks free models pool.
     * 3. Filters out cooling down models.
     */
    async getNextFallback(
        currentModel: string,
        envFallbackString: string | undefined
    ): Promise<string | null> {
        const candidates: string[] = [];

        // 1. Static config candidates
        if (envFallbackString) {
            const envModels = envFallbackString.split(",").map(s => s.trim()).filter(Boolean);
            candidates.push(...envModels);
        }

        // 2. Free pool candidates
        if (this.freeModelsPool.length === 0) {
            await this.fetchFreeOpenRouterModels();
        }
        candidates.push(...this.freeModelsPool);

        // 3. Find first valid candidate
        for (const candidate of candidates) {
            if (candidate === currentModel) continue; // Skip current failing model
            if (this.isCoolingDown(candidate)) continue; // Skip bad models

            return candidate;
        }

        // 4. ULTIMATE LOCAL FALLBACK (Ollama)
        // If all cloud/free models fail, try to find a local model
        const localModel = await this.getBestLocalOllamaModel();
        if (localModel && localModel !== currentModel) {
            log.warn(`[Fallback] All cloud models exhausted. Falling back to ultimate local model: ${localModel}`);
            return localModel;
        }

        return null;
    }

    /**
     * Attempts to find a local model running on Ollama.
     * Returns "ollama/<model_name>" or null if not available.
     */
    private async getBestLocalOllamaModel(): Promise<string | null> {
        try {
            // Short timeout to avoid hanging if Ollama is not running
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);

            const response = await fetch("http://127.0.0.1:11434/api/tags", {
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!response.ok) return null;

            const data = await response.json() as { models: Array<{ name: string }> };
            if (data.models && data.models.length > 0) {
                // Return the first available model. 
                // We could implement smarter logic here (e.g. prefer llama3/mistral), 
                // but for now, any working local model is better than a crash.
                return `ollama/${data.models[0].name}`;
            }
        } catch (err) {
            // Ollama likely not running or unreachable
            return null;
        }
        return null;
    }
}

export const dynamicFallbackManager = new DynamicFallbackManager();
