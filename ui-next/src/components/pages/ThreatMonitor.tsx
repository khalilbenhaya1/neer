import { AlertTriangle, ShieldAlert, Eye, Lock } from 'lucide-react';
import { GlowCard, MetricCard, StatusBadge, BarGraph } from '../shared/UIComponents';
import type { useGateway } from '../../hooks/useGateway';

interface ThreatMonitorProps {
    gateway: ReturnType<typeof useGateway>;
}

export function ThreatMonitor({ gateway }: ThreatMonitorProps) {
    const { threatLevel } = gateway;
    const riskScore = threatLevel === 'CRITICAL' ? 95 : threatLevel === 'HIGH' ? 75 : threatLevel === 'MEDIUM' ? 45 : 12;
    const isCritical = riskScore > 71;
    const riskColor = isCritical ? '#ef4444' : riskScore > 40 ? '#f59e0b' : '#10b981';

    return (
        <div className={`space-y-6 max-w-5xl mx-auto ${isCritical ? 'border border-red-500/20 rounded-2xl p-4' : ''}`}>
            <div>
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-white tracking-tight">Threat Monitor</h1>
                    {isCritical && (
                        <span className="px-3 py-1 bg-red-500/20 border border-red-500/40 rounded-full text-xs font-bold text-red-400 animate-pulse">
                            CRITICAL RISK DETECTED
                        </span>
                    )}
                </div>
                <p className="text-sm text-slate-500 mt-1">AI Execution Security — Tool risk evaluation and approval queue</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard label="Risk Score" value={`${riskScore}/100`} color={isCritical ? 'red' : riskScore > 40 ? 'amber' : 'green'} large icon={<ShieldAlert className="w-4 h-4" />} />
                <MetricCard label="Threat Level" value={threatLevel} color={isCritical ? 'red' : 'amber'} icon={<AlertTriangle className="w-4 h-4" />} />
                <MetricCard label="Last Blocked" value="None" sublabel="No tools blocked recently" color="default" icon={<Lock className="w-4 h-4" />} />
                <MetricCard label="Pending Approvals" value={0} sublabel="Approval queue empty" color="default" icon={<Eye className="w-4 h-4" />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Risk Gauge */}
                <GlowCard label="Risk Gauge" glowColor={`${riskColor}20`}>
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-3xl font-bold font-mono-data" style={{ color: riskColor }}>{riskScore}</span>
                        <StatusBadge
                            status={isCritical ? 'offline' : riskScore > 40 ? 'warn' : 'online'}
                            label={threatLevel}
                        />
                    </div>
                    <BarGraph value={riskScore} color={riskColor} height={14} />
                    <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                        <span>Safe (0)</span>
                        <span>Warning (40)</span>
                        <span>Critical (71)</span>
                        <span>Max (100)</span>
                    </div>
                    {isCritical && (
                        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400">
                            ⚠ Risk score exceeds 71. Tools require manual approval before execution.
                        </div>
                    )}
                </GlowCard>

                {/* Tool Risk History */}
                <GlowCard label="Tool Risk History">
                    <div className="space-y-2">
                        {[
                            { tool: 'bash', risk: 35, status: 'ALLOWED' },
                            { tool: 'file.write', risk: 20, status: 'ALLOWED' },
                            { tool: 'browser.open', risk: 15, status: 'ALLOWED' },
                            { tool: 'system-event', risk: 5, status: 'ALLOWED' },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between text-xs py-2 border-b border-white/5 last:border-0">
                                <span className="font-mono-data text-slate-400">{item.tool}</span>
                                <BarGraph value={item.risk} height={6} color={item.risk > 70 ? '#ef4444' : item.risk > 40 ? '#f59e0b' : '#10b981'} />
                                <StatusBadge status={item.status === 'ALLOWED' ? 'online' : 'offline'} label={item.status} />
                            </div>
                        ))}
                    </div>
                </GlowCard>
            </div>
        </div>
    );
}
