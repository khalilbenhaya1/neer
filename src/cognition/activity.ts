export class SystemActivityTracker {
    private static instance: SystemActivityTracker;
    private score: number = 0;
    private decayTimer: NodeJS.Timeout | null = null;
    
    // Configurable decay rate and interval
    private readonly DECAY_RATE = 0.10; // 10% decay per interval
    private readonly DECAY_INTERVAL_MS = 60 * 1000; // 1 minute
    
    private constructor() {
        this.startDecayTimer();
    }
    
    public static getInstance(): SystemActivityTracker {
        if (!SystemActivityTracker.instance) {
            SystemActivityTracker.instance = new SystemActivityTracker();
        }
        return SystemActivityTracker.instance;
    }
    
    public registerActivity(weight: number) {
        this.score += weight;
        // console.log(`[Activity] Registered +${weight}. Current score: ${this.score.toFixed(2)}`);
    }
    
    public getScore(): number {
        return this.score;
    }
    
    private startDecayTimer() {
        if (this.decayTimer) {
            clearInterval(this.decayTimer);
        }
        // Use unref so the timer doesn't keep the process alive
        this.decayTimer = setInterval(() => {
            if (this.score > 0) {
                this.score = Math.max(0, this.score * (1 - this.DECAY_RATE));
                // Cap small values to 0 to avoid floating point lingering
                if (this.score < 0.1) {
                    this.score = 0;
                }
            }
        }, this.DECAY_INTERVAL_MS);
        this.decayTimer.unref();
    }
    
    public stop() {
        if (this.decayTimer) {
            clearInterval(this.decayTimer);
            this.decayTimer = null;
        }
    }
}

export const activityTracker = SystemActivityTracker.getInstance();
