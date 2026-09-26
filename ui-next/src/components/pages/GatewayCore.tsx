import { Cpu, Zap, Globe, RotateCcw, Clock } from 'lucide-react';
import { GlowCard, MetricCard, StatusBadge } from '../shared/UIComponents';
import type { useGateway } from '../../hooks/useGateway';

interface GatewayCoreProps {
    gateway: ReturnType<typeof useGateway>;
}

export function GatewayCore({ gateway }: GatewayCoreProps) {
    const { status, lastUpdated } = gateway;
    const isOnline = status === 'ONLINE';
    const port = 19001;
    const wsUrl = `ws://127.0.0.1:${port}`;
    const uptime = lastUpdated ? Math.round((Date.now() - lastUpdated.getTime()) / 1000 / 60) : 0;

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Gateway Core</h1>
                <p className="text-sm text-slate-500 mt-1">WebSocket server metrics, process health, and runtime diagnostics</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard label="Status" value={status} color={isOnline ? 'green' : 'red'} icon={<Zap className="w-4 h-4" />} />
                <MetricCard label="Port" value={port} sublabel="TCP bound" color="cyan" icon={<Globe className="w-4 h-4" />} />
                <MetricCard label="Uptime" value={`${uptime}m`} color="purple" icon={<Clock className="w-4 h-4" />} />
                <MetricCard label="PID" value="--" sublabel="Process ID" color="default" icon={<Cpu className="w-4 h-4" />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <GlowCard label="Connection Details">
                    <div className="space-y-4">
                        {[
                            { label: 'WebSocket URL', value: wsUrl },
                            { label: 'HTTP API', value: `http://127.0.0.1:${port}` },
                            { label: 'Last Poll', value: lastUpdated?.toLocaleTimeString() ?? '--' },
                        ].map((item) => (
                            <div key={item.label} className="flex flex-col gap-1 py-2 border-b border-white/5 last:border-0">
                                <span className="text-xs text-slate-500">{item.label}</span>
                                <span className="text-sm font-mono-data text-slate-200">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </GlowCard>

                <GlowCard label="Process Controls">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-300">Gateway Process</span>
                            <StatusBadge status={isOnline ? 'online' : 'offline'} label={isOnline ? 'RUNNING' : 'STOPPED'} />
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-300">Safe Mode</span>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <div className="relative">
                                    <input type="checkbox" className="sr-only" />
                                    <div className="w-10 h-5 bg-slate-700 rounded-full border border-white/10" />
                                    <div className="absolute left-1 top-1 w-3 h-3 bg-slate-400 rounded-full transition-transform" />
                                </div>
                                <span className="text-xs text-slate-500">Disabled</span>
                            </label>
                        </div>
                        <button
                            disabled={!isOnline}
                            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-sm font-medium rounded-xl transition-all disabled:opacity-40"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Restart Gateway
                        </button>
                    </div>
                </GlowCard>
            </div>
        </div>
    );
}
