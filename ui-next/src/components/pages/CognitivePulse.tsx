import { Brain, Activity, Target, RefreshCw, Clock } from 'lucide-react';
import { GlowCard, StatusBadge, MetricCard } from '../shared/UIComponents';
import type { useGateway } from '../../hooks/useGateway';

interface CognitivePulseProps {
    gateway: ReturnType<typeof useGateway>;
}

export function CognitivePulse({ gateway }: CognitivePulseProps) {
    const { health, status } = gateway;
    const isOnline = status === 'ONLINE';
    const hb = health?.heartbeatSeconds;

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Cognitive Pulse</h1>
                <p className="text-sm text-slate-500 mt-1">Autonomous heartbeat, goal queue, and reflective cycle tracking</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard label="Pulse Status" value={isOnline ? 'ACTIVE' : 'IDLE'} color={isOnline ? 'green' : 'default'} icon={<Activity className="w-4 h-4" />} />
                <MetricCard label="Last Heartbeat" value={hb ? `${hb}s ago` : '--'} color="cyan" icon={<Clock className="w-4 h-4" />} />
                <MetricCard label="Active Goals" value={0} sublabel="Idle Reflection mode" color="purple" icon={<Target className="w-4 h-4" />} />
                <MetricCard label="Recovery Attempts" value={0} color="default" icon={<RefreshCw className="w-4 h-4" />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <GlowCard label="Pulse Timeline">
                    <div className="space-y-3">
                        {[
                            { label: 'Idle Self-Reflection', status: 'online' as const, time: '23:55' },
                            { label: 'Goal Queue Scan', status: 'online' as const, time: '23:50' },
                            { label: 'Memory Consolidation', status: 'idle' as const, time: '23:45' },
                            { label: 'Heartbeat OK', status: 'online' as const, time: '23:40' },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                                <div className="flex items-center gap-3">
                                    <Brain className="w-3.5 h-3.5 text-[#7c3aed]" />
                                    <span className="text-sm text-slate-300">{item.label}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs text-slate-600 font-mono-data">{item.time}</span>
                                    <StatusBadge status={item.status} />
                                </div>
                            </div>
                        ))}
                    </div>
                </GlowCard>

                <GlowCard label="Goal Queue">
                    <div className="flex flex-col items-center justify-center h-32 text-slate-500">
                        <Target className="w-8 h-8 mb-3 opacity-30" />
                        <p className="text-sm">No pending goals</p>
                        <p className="text-xs mt-1 text-slate-600">NEER is in idle self-reflection mode</p>
                    </div>
                </GlowCard>
            </div>
        </div>
    );
}
