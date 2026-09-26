import type { ReactNode } from 'react';

interface MetricCardProps {
    label: string;
    value: string | number;
    sublabel?: string;
    icon?: ReactNode;
    color?: 'purple' | 'green' | 'red' | 'amber' | 'cyan' | 'default';
    large?: boolean;
}

const colorMap = {
    purple: { accent: '#7c3aed', glow: 'rgba(124,58,237,0.2)', badge: 'bg-[#7c3aed]/15 text-[#a78bfa]' },
    green: { accent: '#10b981', glow: 'rgba(16,185,129,0.2)', badge: 'bg-green-500/15 text-green-400' },
    red: { accent: '#ef4444', glow: 'rgba(239,68,68,0.25)', badge: 'bg-red-500/15 text-red-400' },
    amber: { accent: '#f59e0b', glow: 'rgba(245,158,11,0.2)', badge: 'bg-amber-500/15 text-amber-400' },
    cyan: { accent: '#22d3ee', glow: 'rgba(34,211,238,0.2)', badge: 'bg-cyan-500/15 text-cyan-400' },
    default: { accent: '#94a3b8', glow: 'rgba(148,163,184,0.1)', badge: 'bg-white/10 text-slate-300' },
};

export function MetricCard({ label, value, sublabel, icon, color = 'default', large }: MetricCardProps) {
    const c = colorMap[color];
    return (
        <div className="glass-surface rounded-2xl p-5 card-hover flex flex-col gap-3" style={{ borderColor: `${c.accent}22` }}>
            <div className="flex items-center justify-between">
                <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">{label}</span>
                {icon && (
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: c.glow }}>
                        <span style={{ color: c.accent }}>{icon}</span>
                    </div>
                )}
            </div>
            <div className={`font-mono-data font-bold ${large ? 'text-4xl' : 'text-2xl'}`} style={{ color: c.accent }}>
                {value}
            </div>
            {sublabel && <span className="text-xs text-slate-500">{sublabel}</span>}
        </div>
    );
}

interface GlowCardProps {
    children: ReactNode;
    className?: string;
    glowColor?: string;
    label?: string;
}

export function GlowCard({ children, className = '', glowColor = 'rgba(124,58,237,0.12)', label }: GlowCardProps) {
    return (
        <div className={`glass-surface rounded-2xl p-5 card-hover ${className}`} style={{ boxShadow: `0 0 30px ${glowColor}, 0 8px 32px rgba(0,0,0,0.4)` }}>
            {label && <div className="text-[10px] font-bold tracking-widest text-slate-500 uppercase mb-3">{label}</div>}
            {children}
        </div>
    );
}

interface StatusBadgeProps {
    status: 'online' | 'offline' | 'warn' | 'idle';
    label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
    const map = {
        online: { dot: '#10b981', text: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
        offline: { dot: '#ef4444', text: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
        warn: { dot: '#f59e0b', text: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
        idle: { dot: '#94a3b8', text: 'text-slate-400', bg: 'bg-white/5 border-white/10' },
    };
    const m = map[status];
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${m.bg}`}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: m.dot, boxShadow: `0 0 5px ${m.dot}` }} />
            <span className={m.text}>{label ?? status.toUpperCase()}</span>
        </span>
    );
}

interface BarGraphProps {
    value: number;
    max?: number;
    color?: string;
    height?: number;
    label?: string;
}

export function BarGraph({ value, max = 100, color = '#7c3aed', height = 8, label }: BarGraphProps) {
    const pct = Math.min(100, Math.round((value / max) * 100));
    const isCrit = pct > 90;
    const isWarn = pct > 70;
    const c = isCrit ? '#ef4444' : isWarn ? '#f59e0b' : color;
    return (
        <div>
            {label && (
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>{label}</span>
                    <span className="font-mono-data" style={{ color: c }}>{pct}%</span>
                </div>
            )}
            <div className="w-full rounded-full overflow-hidden" style={{ height, background: 'rgba(255,255,255,0.06)' }}>
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: c, boxShadow: `0 0 8px ${c}80` }} />
            </div>
        </div>
    );
}
