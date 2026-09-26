import {
    Brain,
    Shield,
    Zap,
    Activity,
    Target,
    CheckSquare,
    Radio,
    RotateCcw,
    MonitorPlay,
    Stethoscope,
    Smartphone,
} from 'lucide-react';

import {
    MetricCard,
    GlowCard,
    StatusBadge,
    BarGraph,
} from '../shared/UIComponents';

import type { ModelCatalogEntry, useGateway } from '../../hooks/useGateway';

interface CommandCenterProps {
    gateway: ReturnType<typeof useGateway>;
}

interface PerformanceWithMemory extends Performance {
    memory?: {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
        jsHeapSizeLimit: number;
    };
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

export function CommandCenter({ gateway }: CommandCenterProps) {
    const {
        health,
        model,
        threatLevel,
        status,
        statusData,
        usage,
        usageCost,
        execApprovals,
        modelCatalog,
    } = gateway;

    const channels = health?.channels ?? {};
    const agents = health?.agents ?? [];

    const onlineChannels = Object.values(channels).filter(
        (c: any) => c.configured !== false
    ).length;

    const model_display = model !== 'Unknown' ? model : 'Loading...';

    const isOnline = status === 'ONLINE';

    // --- Real data derived from Gateway RPCs ---
    // usage.cost (30d window), exec.approvals.get (policy snapshot),
    // models.list (catalog), usage.status (provider quota windows).

    const models = modelCatalog.data ?? [];
    const activeModelEntry = findActiveModelEntry(models, model);
    const contextWindow =
        activeModelEntry?.contextWindow ??
        statusData?.sessions?.defaults?.contextTokens ??
        null;

    const costTotals = usageCost.data?.totals ?? null;

    const quotaWindow = usage.data?.providers
        .flatMap((p) =>
            p.windows.map((w) => ({ provider: p.displayName, ...w })),
        )
        .find((w) => typeof w.usedPercent === 'number');

    const approvalsFile = execApprovals.data?.file;
    const askMode = approvalsFile?.defaults?.ask ?? null;
    const securityMode = approvalsFile?.defaults?.security ?? null;
    const allowlistEntries = Object.values(
        approvalsFile?.agents ?? {},
    ).flatMap((a) => a.allowlist ?? []);
    const approvalEvents = allowlistEntries
        .filter((e) => typeof e.lastUsedAt === 'number')
        .sort((a, b) => (b.lastUsedAt ?? 0) - (a.lastUsedAt ?? 0))
        .slice(0, 5);

    const threatColor =
        threatLevel === 'CRITICAL'
            ? 'red'
            : threatLevel === 'HIGH'
              ? 'red'
              : threatLevel === 'MEDIUM'
                ? 'amber'
                : 'green';

    const execMode =
        threatLevel === 'CRITICAL' || threatLevel === 'HIGH'
            ? 'APPROVAL'
            : 'NORMAL';

    /*
     * Browser memory information.
     *
     * `process.memoryUsage()` cannot be used here because this is
     * browser-side React code, not Node.js code.
     *
     * performance.memory is Chromium-specific; when it is unavailable we
     * show "Unavailable" instead of inventing numbers.
     */
    const performanceWithMemory =
        performance as PerformanceWithMemory;

    const memory = performanceWithMemory.memory;

    const heapUsed = memory
        ? Math.round(memory.usedJSHeapSize / 1024 / 1024)
        : null;

    const heapTotal = memory
        ? Math.round(memory.totalJSHeapSize / 1024 / 1024)
        : null;

    const heapLimit = memory
        ? Math.round(memory.jsHeapSizeLimit / 1024 / 1024)
        : null;

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Page Title */}
            <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                    Command Center
                </h1>

                <p className="text-sm text-slate-500 mt-1">
                    NEER Cognitive Infrastructure — Real-time Operational Overview
                </p>
            </div>

            {/* Row 1 — System Brain Panels */}
            <section>
                <div className="text-[10px] font-bold tracking-widest text-slate-600 uppercase mb-3">
                    System Brain
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricCard
                        label="Active Model"
                        value={model_display.split('/').pop() ?? model_display}
                        sublabel={model_display}
                        icon={<Brain className="w-4 h-4" />}
                        color="purple"
                    />

                    <MetricCard
                        label="Cognitive Pulse"
                        value={isOnline ? 'ACTIVE' : 'OFFLINE'}
                        sublabel={`Heartbeat: ${health?.heartbeatSeconds ?? '--'}s`}
                        icon={<Activity className="w-4 h-4" />}
                        color={isOnline ? 'green' : 'red'}
                    />

                    <MetricCard
                        label="Threat Level"
                        value={threatLevel}
                        sublabel="Tool execution monitoring"
                        icon={<Shield className="w-4 h-4" />}
                        color={threatColor as any}
                    />

                    <MetricCard
                        label="Execution Mode"
                        value={execMode}
                        sublabel={
                            execMode === 'APPROVAL'
                                ? 'High risk — approvals required'
                                : 'All tools running freely'
                        }
                        icon={<Zap className="w-4 h-4" />}
                        color={execMode === 'APPROVAL' ? 'red' : 'green'}
                    />
                </div>
            </section>

            {/* Row 2 — Live Metrics */}
            <section>
                <div className="text-[10px] font-bold tracking-widest text-slate-600 uppercase mb-3">
                    Live Metrics
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricCard
                        label="Active Goals"
                        value={
                            isOnline
                                ? 'Unavailable'
                                : '--'
                        }
                        sublabel="No goals RPC in Gateway"
                        icon={<Target className="w-4 h-4" />}
                        color="cyan"
                    />

                    <MetricCard
                        label="Exec Approvals"
                        value={
                            execApprovals.loading
                                ? '—'
                                : execApprovals.error
                                  ? 'Unavailable'
                                  : (askMode?.toUpperCase() ?? 'UNSET')
                        }
                        sublabel={
                            execApprovals.loading
                                ? 'Loading…'
                                : execApprovals.error
                                  ? 'Approvals data unavailable'
                                  : `${allowlistEntries.length} allowlist patterns · security: ${securityMode ?? 'unset'}`
                        }
                        icon={<CheckSquare className="w-4 h-4" />}
                        color="default"
                    />

                    <MetricCard
                        label="Active Channels"
                        value={onlineChannels}
                        sublabel={`${Object.keys(channels).length} total configured`}
                        icon={<Radio className="w-4 h-4" />}
                        color={onlineChannels > 0 ? 'green' : 'default'}
                    />

                    <MetricCard
                        label="Agents"
                        value={agents.length}
                        sublabel={`Default: ${
                            health?.heartbeatSeconds ? 'ONLINE' : '--'
                        }`}
                        icon={<Smartphone className="w-4 h-4" />}
                        color="purple"
                    />
                </div>
            </section>

            {/* Row 3 — Intelligence panels */}
            <section>
                <div className="text-[10px] font-bold tracking-widest text-slate-600 uppercase mb-3">
                    Intelligence Panels
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Usage Graph */}
                    <GlowCard
                        label="Model Usage"
                        className="space-y-4"
                    >
                        {usage.loading ? (
                            <p className="text-xs text-slate-500">
                                Loading usage data…
                            </p>
                        ) : usage.error && !usage.data ? (
                            <p className="text-xs text-slate-500">
                                Provider quota unavailable
                            </p>
                        ) : quotaWindow ? (
                            <BarGraph
                                value={quotaWindow.usedPercent}
                                label={`Quota · ${quotaWindow.provider}`}
                                color="#7c3aed"
                                height={10}
                            />
                        ) : (
                            <p className="text-xs text-slate-500">
                                No provider quota windows reported
                            </p>
                        )}

                        <div className="flex justify-between text-xs">
                            <span className="text-slate-500">
                                Tokens (30d)
                            </span>
                            <span className="font-mono-data text-[#a78bfa]">
                                {usageCost.loading
                                    ? 'Loading…'
                                    : usageCost.error && !costTotals
                                      ? 'Unavailable'
                                      : fmtTokens(costTotals?.totalTokens ?? 0)}
                            </span>
                        </div>

                        <div className="flex justify-between text-xs">
                            <span className="text-slate-500">
                                Cost (30d)
                            </span>
                            <span className="font-mono-data text-emerald-400">
                                {usageCost.loading
                                    ? 'Loading…'
                                    : usageCost.error && !costTotals
                                      ? 'Unavailable'
                                      : fmtCost(costTotals?.totalCost ?? 0)}
                            </span>
                        </div>

                        <div className="flex justify-between text-xs">
                            <span className="text-slate-500">
                                Context Window
                            </span>
                            <span className="font-mono-data text-cyan-400">
                                {contextWindow
                                    ? `${fmtTokens(contextWindow)} tokens`
                                    : modelCatalog.loading
                                      ? 'Loading…'
                                      : 'Unavailable'}
                            </span>
                        </div>

                        <p className="text-xs text-slate-500 mt-2">
                            Auto Model Switch:{' '}
                            <span className="text-slate-400 font-medium">
                                Unavailable
                            </span>
                        </p>
                    </GlowCard>

                    {/* Threat Timeline */}
                    <GlowCard
                        label="Threat Timeline"
                        glowColor={
                            threatLevel !== 'LOW'
                                ? 'rgba(239,68,68,0.12)'
                                : 'rgba(16,185,129,0.1)'
                        }
                    >
                        <div className="space-y-2">
                            {execApprovals.loading ? (
                                <p className="text-xs text-slate-500 py-1.5">
                                    Loading execution events…
                                </p>
                            ) : execApprovals.error && !execApprovals.data ? (
                                <p className="text-xs text-slate-500 py-1.5">
                                    Execution events unavailable
                                </p>
                            ) : approvalEvents.length === 0 ? (
                                <p className="text-xs text-slate-500 py-1.5">
                                    No allowlisted executions recorded — the
                                    Gateway reports no threat event stream via
                                    RPC.
                                </p>
                            ) : (
                                approvalEvents.map((item, i) => {
                                    const d = new Date(item.lastUsedAt ?? 0);
                                    const time = Number.isNaN(d.getTime())
                                        ? '--:--'
                                        : d.toLocaleTimeString([], {
                                              hour: '2-digit',
                                              minute: '2-digit',
                                          });
                                    const label = (
                                        item.lastUsedCommand ?? item.pattern
                                    ).trim();
                                    return (
                                        <div
                                            key={item.id ?? i}
                                            className="flex items-center gap-3 text-xs py-1.5 border-b border-white/5 last:border-0"
                                        >
                                            <span className="text-slate-600 font-mono-data w-10 flex-shrink-0">
                                                {time}
                                            </span>

                                            <span
                                                className="flex-1 text-slate-400 truncate"
                                                title={label}
                                            >
                                                Allowlisted exec: {label}
                                            </span>

                                            <StatusBadge
                                                status="online"
                                                label="APPROVED"
                                            />
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </GlowCard>

                    {/* Self-Diagnosis */}
                    <GlowCard
                        label="AI Self-Diagnosis"
                        glowColor="rgba(34,211,238,0.08)"
                    >
                        <div className="space-y-3">
                            {/* JS Heap Used */}
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-500">
                                    JS Heap Used
                                </span>

                                <span className="font-mono-data text-[#a78bfa]">
                                    {heapUsed !== null
                                        ? `${heapUsed} MB`
                                        : 'Unavailable'}
                                </span>
                            </div>

                            {heapUsed !== null && heapLimit !== null && (
                                <BarGraph
                                    value={heapUsed}
                                    max={heapLimit}
                                    color="#7c3aed"
                                    height={6}
                                />
                            )}

                            {/* JS Heap Total */}
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-500">
                                    JS Heap Total
                                </span>

                                <span className="font-mono-data text-cyan-400">
                                    {heapTotal !== null
                                        ? `${heapTotal} MB`
                                        : 'Unavailable'}
                                </span>
                            </div>

                            {heapTotal !== null && heapLimit !== null && (
                                <BarGraph
                                    value={heapTotal}
                                    max={heapLimit}
                                    color="#22d3ee"
                                    height={6}
                                />
                            )}

                            {/* Vector DB */}
                            <div className="flex items-center justify-between text-xs mt-2">
                                <span className="text-slate-500">
                                    Vector DB
                                </span>

                                <StatusBadge
                                    status="idle"
                                    label="UNAVAILABLE"
                                />
                            </div>

                            {/* Gateway */}
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-500">
                                    Gateway WS
                                </span>

                                <StatusBadge
                                    status={
                                        isOnline
                                            ? 'online'
                                            : 'offline'
                                    }
                                    label={
                                        isOnline
                                            ? 'CONNECTED'
                                            : 'OFFLINE'
                                    }
                                />
                            </div>
                        </div>
                    </GlowCard>
                </div>
            </section>

            {/* Row 4 — Quick Controls */}
            <section>
                <div className="text-[10px] font-bold tracking-widest text-slate-600 uppercase mb-3">
                    Quick Controls
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                        {
                            icon: RotateCcw,
                            label: 'Restart Gateway',
                            color: 'text-amber-400 border-amber-400/30 hover:bg-amber-400/10',
                            disabled: !isOnline,
                        },
                        {
                            icon: Brain,
                            label: 'Switch Model',
                            color: 'text-[#a78bfa] border-[#7c3aed]/30 hover:bg-[#7c3aed]/10',
                            disabled: !isOnline,
                        },
                        {
                            icon: Stethoscope,
                            label: 'Run Self-Diagnosis',
                            color: 'text-cyan-400 border-cyan-400/30 hover:bg-cyan-400/10',
                            disabled: !isOnline,
                        },
                        {
                            icon: MonitorPlay,
                            label: 'Open Live Console',
                            color: 'text-green-400 border-green-400/30 hover:bg-green-400/10',
                            disabled: false,
                        },
                    ].map((btn) => {
                        const Icon = btn.icon;

                        return (
                            <button
                                key={btn.label}
                                disabled={btn.disabled}
                                className={`glass-surface rounded-xl p-4 flex items-center gap-3 text-sm font-medium border transition-all duration-150 ${btn.color} disabled:opacity-40 disabled:cursor-not-allowed`}
                            >
                                <Icon className="w-4 h-4 flex-shrink-0" />
                                <span>{btn.label}</span>
                            </button>
                        );
                    })}
                </div>
            </section>
        </div>
    );
}