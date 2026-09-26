import { WifiOff, RefreshCw } from 'lucide-react';

interface ConnectionBannerProps {
    onReconnect: () => void;
}

export function ConnectionBanner({ onReconnect }: ConnectionBannerProps) {
    return (
        <div className="absolute top-12 left-0 right-0 z-50 px-4 pt-2">
            <div className="glass-elevated border border-red-500/30 rounded-xl px-5 py-3 flex items-center gap-4 glow-red">
                <WifiOff className="w-5 h-5 text-red-400 flex-shrink-0" />
                <div className="flex-1">
                    <p className="text-sm font-semibold text-red-400">Gateway Disconnected</p>
                    <p className="text-xs text-slate-500">Unable to reach NEER Gateway. Interactive controls are disabled.</p>
                </div>
                <button
                    onClick={onReconnect}
                    className="flex items-center gap-2 px-4 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 text-xs font-medium rounded-lg transition-all"
                >
                    <RefreshCw className="w-3 h-3" />
                    Reconnect
                </button>
            </div>
        </div>
    );
}
