import { Users, KeyRound, CircleUserRound, Network } from 'lucide-react';
import { GlowCard, MetricCard, StatusBadge } from '../shared/UIComponents';
import type { GatewayAgentRow, useGateway } from '../../hooks/useGateway';

interface AgentsProps {
    gateway: ReturnType<typeof useGateway>;
}

function agentDisplayName(agent: GatewayAgentRow): string {
    return (
        agent.identity?.name?.trim() ||
        agent.name?.trim() ||
        agent.id
    );
}

export function Agents({ gateway }: AgentsProps) {
    const { agentsList } = gateway;

    const snapshot = agentsList.data;
    const agents = snapshot?.agents ?? [];
    const loading = agentsList.loading && !snapshot;
    const error = agentsList.error;

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Agents</h1>
                <p className="text-sm text-slate-500 mt-1">
                    Configured NEER agents, identities, and session scope
                </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    label="Total Agents"
                    value={loading ? '—' : agents.length}
                    sublabel="From agents.list"
                    color="purple"
                    icon={<Users className="w-4 h-4" />}
                />
                <MetricCard
                    label="Default Agent"
                    value={loading ? '—' : (snapshot?.defaultId ?? 'Unavailable')}
                    sublabel="Receives unrouted sessions"
                    color="cyan"
                    icon={<CircleUserRound className="w-4 h-4" />}
                />
                <MetricCard
                    label="Session Scope"
                    value={loading ? '—' : (snapshot?.scope ?? 'Unavailable')}
                    sublabel="Session key isolation mode"
                    color="green"
                    icon={<Network className="w-4 h-4" />}
                />
                <MetricCard
                    label="Main Key"
                    value={
                        loading
                            ? '—'
                            : snapshot?.mainKey
                              ? snapshot.mainKey
                              : 'none'
                    }
                    sublabel="Primary session key"
                    color="default"
                    icon={<KeyRound className="w-4 h-4" />}
                />
            </div>

            <GlowCard label="Agent Roster">
                {error && !snapshot ? (
                    <p className="text-sm text-red-400">
                        Agent data unavailable: {error}
                    </p>
                ) : loading ? (
                    <p className="text-sm text-slate-500">Loading agents…</p>
                ) : agents.length === 0 ? (
                    <p className="text-sm text-slate-500">
                        No agents returned by the Gateway.
                    </p>
                ) : (
                    <div className="space-y-2">
                        {agents.map((agent) => {
                            const isDefault = agent.id === snapshot?.defaultId;
                            const isMainKey =
                                Boolean(snapshot?.mainKey) &&
                                agent.id === snapshot?.mainKey;
                            return (
                                <div
                                    key={agent.id}
                                    className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.03] border border-white/5"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-[#7c3aed]/15 border border-[#7c3aed]/25 flex items-center justify-center text-lg flex-shrink-0">
                                        {agent.identity?.emoji ||
                                            agentDisplayName(agent)
                                                .charAt(0)
                                                .toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-sm font-semibold text-white">
                                                {agentDisplayName(agent)}
                                            </span>
                                            {isDefault && (
                                                <StatusBadge status="online" label="DEFAULT" />
                                            )}
                                            {isMainKey && (
                                                <StatusBadge status="warn" label="MAIN KEY" />
                                            )}
                                        </div>
                                        {agentDisplayName(agent) !== agent.id && (
                                            <div className="text-xs text-slate-500 font-mono-data mt-0.5 truncate">
                                                {agent.id}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-right text-xs text-slate-500 flex-shrink-0 hidden sm:block">
                                        {agent.identity?.theme ? (
                                            <span className="text-[#a78bfa]">
                                                {agent.identity.theme}
                                            </span>
                                        ) : (
                                            <span>No identity theme</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
                {error && snapshot && (
                    <p className="text-xs text-amber-400/80 mt-3">
                        Refresh failed: {error} — showing last received data.
                    </p>
                )}
            </GlowCard>
        </div>
    );
}
