import { BarChart3, TrendingUp, AlertCircle } from 'lucide-react';
import { GlowCard, MetricCard, BarGraph } from '../shared/UIComponents';
import type { ModelCatalogEntry, useGateway } from '../../hooks/useGateway';

interface UsageModelsProps {
    gateway: ReturnType<typeof useGateway>;
}

const fmtTokens = (n: number) =>
    n >= 1e6
        ? `${(n / 1e6).toFixed(1)}M`
        : n >= 1e3
          ? `${(n / 1e3).toFixed(1)}K`
          : String(n);

const fmtCost = (n: number) => `$${n.toFixed(2)}`;

function findActiveModelEntry(
    models: ModelCatalogEntry[],
    model: string,
): ModelCatalogEntry | undefined {
    if (!model || model === 'Unknown') return undefined;
    const exact = models.find((m) => `${m.provider}/${m.id}` === model);
    if (exact) return exact;
    const short = model.split('/').pop() ?? model;
    return models.find(
        (m) => m.id === short || m.id === model || model.endsWith(`/${m.id}`),
    );
}

export function UsageModels({ gateway }: UsageModelsProps) {
    const { model, statusData, usageCost, modelCatalog } = gateway;

    const models = modelCatalog.data ?? [];
    const activeEntry = findActiveModelEntry(models, model);
    const ctx =
        activeEntry?.contextWindow ??
        statusData?.sessions?.defaults?.contextTokens ??
        null;

    const totals = usageCost.data?.totals ?? null;
    const totalTokens = totals?.totalTokens ?? 0;

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Usage & Models</h1>
                <p className="text-sm text-slate-500 mt-1">Token consumption, model stability, and auto-switch configuration</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard label="Active Model" value={model.split('/').pop() ?? model} sublabel={model} color="purple" icon={<BarChart3 className="w-4 h-4" />} />
                <MetricCard
                    label="Context Window"
                    value={
                        ctx !== null
                            ? `${Math.round(ctx / 1000)}K`
                            : modelCatalog.loading
                              ? '—'
                              : 'Unavailable'
                    }
                    sublabel={
                        ctx !== null
                            ? `${ctx.toLocaleString()} tokens`
                            : 'No context window data from Gateway'
                    }
                    color="cyan"
                />
                <MetricCard
                    label="Tokens (30d)"
                    value={
                        usageCost.loading
                            ? '—'
                            : usageCost.error && !totals
                              ? 'Unavailable'
                              : fmtTokens(totalTokens)
                    }
                    sublabel="Total tokens · last 30 days"
                    color="green"
                    icon={<TrendingUp className="w-4 h-4" />}
                />
                <MetricCard
                    label="Auto-Switch"
                    value={modelCatalog.loading ? '—' : 'Unavailable'}
                    sublabel="No auto-switch config in Gateway RPCs"
                    color="amber"
                    icon={<AlertCircle className="w-4 h-4" />}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <GlowCard label="Token Usage Graph">
                    <div className="space-y-4">
                        {usageCost.loading ? (
                            <p className="text-xs text-slate-500">Loading usage data…</p>
                        ) : usageCost.error && !totals ? (
                            <p className="text-xs text-slate-500">
                                Token usage unavailable
                                {usageCost.error ? `: ${usageCost.error}` : ''}
                            </p>
                        ) : totalTokens === 0 ? (
                            <p className="text-xs text-slate-500">
                                No token usage recorded in the last 30 days.
                            </p>
                        ) : (
                            <>
                                <BarGraph
                                    value={totals?.input ?? 0}
                                    max={totalTokens}
                                    label="Input Tokens (30d)"
                                    color="#7c3aed"
                                    height={12}
                                />
                                <BarGraph
                                    value={totals?.output ?? 0}
                                    max={totalTokens}
                                    label="Output Tokens (30d)"
                                    color="#a78bfa"
                                    height={12}
                                />
                                <BarGraph
                                    value={totals?.cacheRead ?? 0}
                                    max={totalTokens}
                                    label="Cache Read Tokens (30d)"
                                    color="#22d3ee"
                                    height={12}
                                />
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-500">Total Cost (30d)</span>
                                    <span className="font-mono-data text-emerald-400">
                                        {fmtCost(totals?.totalCost ?? 0)}
                                    </span>
                                </div>
                            </>
                        )}
                    </div>
                </GlowCard>

                <GlowCard label="Model Stability">
                    <div className="space-y-3 text-sm">
                        <div className="p-3 rounded-lg bg-[#7c3aed]/10 border border-[#7c3aed]/20">
                            <div className="flex justify-between mb-1">
                                <span className="text-[#a78bfa] font-medium">{model.split('/').pop()}</span>
                                <span className="text-slate-400 text-xs">
                                    {activeEntry?.reasoning ? 'Reasoning' : 'Active'}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500">{model}</p>
                            {activeEntry && (
                                <p className="text-xs text-slate-500 mt-1">
                                    {activeEntry.provider}
                                    {activeEntry.contextWindow
                                        ? ` · ${fmtTokens(activeEntry.contextWindow)} ctx`
                                        : ''}
                                </p>
                            )}
                        </div>

                        {models.length > 0 && (
                            <div className="space-y-1">
                                {models.slice(0, 6).map((m) => {
                                    const isActive =
                                        m === activeEntry ||
                                        (activeEntry === undefined &&
                                            model !== 'Unknown' &&
                                            (m.id === model ||
                                                `${m.provider}/${m.id}` === model));
                                    return (
                                        <div
                                            key={`${m.provider}/${m.id}`}
                                            className="flex justify-between text-xs"
                                        >
                                            <span
                                                className={
                                                    isActive
                                                        ? 'text-[#a78bfa] font-medium'
                                                        : 'text-slate-400'
                                                }
                                            >
                                                {m.name}
                                                {isActive ? ' · active' : ''}
                                            </span>
                                            <span className="text-slate-600 font-mono-data">
                                                {m.provider}
                                            </span>
                                        </div>
                                    );
                                })}
                                {models.length > 6 && (
                                    <p className="text-[10px] text-slate-600 pt-1">
                                        +{models.length - 6} more configured
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="text-xs text-slate-500 space-y-2 mt-3 pt-3 border-t border-white/5">
                            <div className="flex justify-between">
                                <span>Available models</span>
                                <span className="text-slate-400 font-mono-data">
                                    {modelCatalog.loading
                                        ? 'Loading…'
                                        : modelCatalog.error
                                          ? 'Unavailable'
                                          : models.length}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Auto-switch threshold</span>
                                <span className="text-slate-400">Unavailable</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Fallback model</span>
                                <span className="text-slate-400">Unavailable</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Last switch</span>
                                <span className="text-slate-400">Unavailable</span>
                            </div>
                        </div>
                    </div>
                </GlowCard>
            </div>
        </div>
    );
}
