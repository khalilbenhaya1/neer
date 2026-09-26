import { Sparkles, Wifi, WifiOff, AlertTriangle, RefreshCw, User, Zap } from 'lucide-react';
import type { GatewayState } from '../../hooks/useGateway';

interface TopBarProps {
    gateway: GatewayState & { reconnect: () => void };
}

export function TopBar({ gateway }: TopBarProps) {
    const { status, model, threatLevel, reconnect } = gateway;

    const statusColor = status === 'ONLINE' ? '#10b981' : status === 'CONNECTING' ? '#f59e0b' : '#ef4444';
    const statusLabel = status === 'ONLINE' ? 'ONLINE' : status === 'CONNECTING' ? 'CONNECTING' : 'OFFLINE';
    const StatusIcon = status === 'ONLINE' ? Wifi : status === 'CONNECTING' ? RefreshCw : WifiOff;

    const threatColor =
        threatLevel === 'CRITICAL' ? '#ef4444' :
            threatLevel === 'HIGH' ? '#f97316' :
                threatLevel === 'MEDIUM' ? '#f59e0b' : '#10b981';
    const ThreatIcon = threatLevel === 'CRITICAL' || threatLevel === 'HIGH' ? AlertTriangle : Zap;

    return (
        <header className="glass-elevated h-12 flex items-center px-5 gap-4 z-50 flex-shrink-0 border-b border-white/5">
            {/* Brand */}
            <div className="flex items-center gap-2.5 mr-4">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#7c3aed] to-[#a78bfa] flex items-center justify-center shadow-lg">
                    <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                    <span className="text-white font-bold text-sm tracking-tight">NEER</span>
                    <span className="text-[#7c3aed] text-[9px] font-semibold tracking-[0.15em] uppercase ml-1.5 opacity-80">
                        Cognitive Infrastructure
                    </span>
                </div>
            </div>

            {/* Separator */}
            <div className="h-6 w-px bg-white/10" />

            {/* Gateway Status */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/8">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColor, boxShadow: `0 0 6px ${statusColor}` }} />
                <StatusIcon className="w-3 h-3" style={{ color: statusColor }} />
                <span className="text-xs font-semibold tracking-wider" style={{ color: statusColor }}>{statusLabel}</span>
                {status === 'OFFLINE' && (
                    <button onClick={reconnect} className="ml-1 text-slate-400 hover:text-white transition-colors">
                        <RefreshCw className="w-3 h-3" />
                    </button>
                )}
            </div>

            {/* Model */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/8">
                <div className="w-1.5 h-1.5 rounded-full bg-[#7c3aed]" style={{ boxShadow: '0 0 6px #7c3aed' }} />
                <span className="text-xs text-slate-400">Model</span>
                <span className="text-xs font-mono text-[#a78bfa] font-medium max-w-[180px] truncate">{model}</span>
            </div>

            {/* Threat */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/8">
                <ThreatIcon className="w-3 h-3" style={{ color: threatColor }} />
                <span className="text-xs text-slate-400">Threat</span>
                <span className="text-xs font-semibold" style={{ color: threatColor }}>{threatLevel}</span>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Owner */}
            <div className="flex items-center gap-2 text-slate-500 text-xs">
                <User className="w-3 h-3" />
                <span>Khalil Benhaya</span>
            </div>
        </header>
    );
}
