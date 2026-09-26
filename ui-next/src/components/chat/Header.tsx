import { Sparkles } from 'lucide-react';

export function Header() {
    return (
        <header className="glass-surface px-6 py-4 mb-4 mx-4 mt-4 rounded-2xl relative z-20">
            <div className="flex items-center justify-between max-w-5xl mx-auto">
                {/* Brand */}
                <div className="flex items-center gap-4">
                    <div className="
            relative w-12 h-12 rounded-2xl
            bg-gradient-to-br from-[#ff4d6d] to-[#ff708d]
            flex items-center justify-center
            text-white shadow-lg shadow-[#ff4d6d]/20
            after:absolute after:inset-0 after:rounded-2xl after:shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]
          ">
                        <Sparkles className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tighter text-white font-display">
                            Neer
                        </h1>
                        <p className="text-[10px] font-semibold tracking-widest text-[#ff4d6d] uppercase opacity-80">
                            AI Assistant
                        </p>
                    </div>
                </div>

                {/* Status indicator */}
                <div className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/5 border border-white/10">
                    <div className="relative flex h-2 w-2">
                        <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff4d6d] opacity-75"></div>
                        <div className="relative inline-flex rounded-full h-2 w-2 bg-[#ff4d6d]"></div>
                    </div>
                    <span className="text-xs font-medium text-slate-300 uppercase tracking-wider">Online</span>
                </div>
            </div>
        </header>
    );
}
