import { Plug, PlugZap, AlertTriangle, LayoutGrid } from 'lucide-react';
import { GlowCard, MetricCard, StatusBadge } from '../shared/UIComponents';
import type {
    ChannelAccountSnapshot,
    useGateway,
} from '../../hooks/useGateway';

interface ChannelsProps {
    gateway: ReturnType<typeof useGateway>;
}

function fmtDateTime(ts: number | null | undefined): string | null {
    if (!ts) return null;
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function accountBadge(account: ChannelAccountSnapshot) {
    if (account.enabled === false) {
        return <StatusBadge status="idle" label="DISABLED" />;
    }
    if (account.connected) {
        return <StatusBadge status="online" label="CONNECTED" />;
    }
    if (account.configured) {
        return <StatusBadge status="warn" label="CONFIGURED" />;
    }
    return <StatusBadge status="offline" label="NOT CONFIGURED" />;
}

export function Channels({ gateway }: ChannelsProps) {
    const { channelsStatus } = gateway;

    const snapshot = channelsStatus.data;
    const loading = channelsStatus.loading && !snapshot;
    const error = channelsStatus.error;

    const order = snapshot?.channelOrder ?? [];
    const labels = snapshot?.channelLabels ?? {};
    const detailLabels = snapshot?.channelDetailLabels ?? {};
    const accountsByChannel = snapshot?.channelAccounts ?? {};

    const allAccounts = order.flatMap(
        (id) => accountsByChannel[id] ?? [],
    );
    const configuredCount = allAccounts.filter(
        (a) => a.configured === true,
    ).length;
    const connectedCount = allAccounts.filter(
        (a) => a.connected === true,
    ).length;
    const errorCount = allAccounts.filter(
        (a) => typeof a.lastError === 'string' && a.lastError.length > 0,
    ).length;

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Channels</h1>
                <p className="text-sm text-slate-500 mt-1">
                    Messaging channel accounts, connectivity, and recent activity
                </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    label="Channel Plugins"
                    value={loading ? '—' : order.length}
                    sublabel="Discovered by Gateway"
                    color="purple"
                    icon={<LayoutGrid className="w-4 h-4" />}
                />
                <MetricCard
                    label="Configured"
                    value={loading ? '—' : configuredCount}
                    sublabel={`${allAccounts.length} total accounts`}
                    color="cyan"
                    icon={<Plug className="w-4 h-4" />}
                />
                <MetricCard
                    label="Connected"
                    value={loading ? '—' : connectedCount}
                    sublabel="Live right now"
                    color="green"
                    icon={<PlugZap className="w-4 h-4" />}
                />
                <MetricCard
                    label="Errors"
                    value={loading ? '—' : errorCount}
                    sublabel="Accounts reporting lastError"
                    color={errorCount > 0 ? 'red' : 'default'}
                    icon={<AlertTriangle className="w-4 h-4" />}
                />
            </div>

            <GlowCard label="Channel Accounts">
                {error && !snapshot ? (
                    <p className="text-sm text-red-400">
                        Channel data unavailable: {error}
                    </p>
                ) : loading ? (
                    <p className="text-sm text-slate-500">Loading channels…</p>
                ) : order.length === 0 ? (
                    <p className="text-sm text-slate-500">
                        No channel plugins reported by the Gateway.
                    </p>
                ) : (
                    <div className="space-y-5">
                        {order.map((channelId) => {
                            const accounts = accountsByChannel[channelId] ?? [];
                            return (
                                <div key={channelId}>
                                    <div className="flex items-baseline gap-2 mb-2">
                                        <span className="text-sm font-semibold text-white">
                                            {labels[channelId] ?? channelId}
                                        </span>
                                        {detailLabels[channelId] && (
                                            <span className="text-xs text-slate-500">
                                                {detailLabels[channelId]}
                                            </span>
                                        )}
                                    </div>
                                    {accounts.length === 0 ? (
                                        <p className="text-xs text-slate-600 pl-1">
                                            No accounts registered.
                                        </p>
                                    ) : (
                                        <div className="space-y-2">
                                            {accounts.map((account) => {
                                                const lastActivity =
                                                    fmtDateTime(
                                                        account.lastInboundAt,
                                                    ) ??
                                                    fmtDateTime(
                                                        account.lastOutboundAt,
                                                    );
                                                return (
                                                    <div
                                                        key={account.accountId}
                                                        className="p-3 rounded-xl bg-white/[0.03] border border-white/5"
                                                    >
                                                        <div className="flex items-center gap-3 flex-wrap">
                                                            <span className="text-sm font-medium text-slate-200">
                                                                {account.name ||
                                                                    account.accountId}
                                                            </span>
                                                            {account.accountId !==
                                                                (account.name ||
                                                                    '') && (
                                                                <span className="text-xs text-slate-600 font-mono-data">
                                                                    {account.accountId}
                                                                </span>
                                                            )}
                                                            <span className="ml-auto">
                                                                {accountBadge(account)}
                                                            </span>
                                                        </div>
                                                        <div className="flex gap-x-4 gap-y-1 flex-wrap text-xs text-slate-500 mt-1.5">
                                                            {account.mode && (
                                                                <span>
                                                                    mode:{' '}
                                                                    <span className="text-slate-400">
                                                                        {account.mode}
                                                                    </span>
                                                                </span>
                                                            )}
                                                            {account.dmPolicy && (
                                                                <span>
                                                                    DM:{' '}
                                                                    <span className="text-slate-400">
                                                                        {account.dmPolicy}
                                                                    </span>
                                                                </span>
                                                            )}
                                                            <span>
                                                                activity:{' '}
                                                                <span className="text-slate-400">
                                                                    {lastActivity ??
                                                                        'none recorded'}
                                                                </span>
                                                            </span>
                                                        </div>
                                                        {typeof account.lastError ===
                                                            'string' &&
                                                            account.lastError.length >
                                                                0 && (
                                                                <p className="text-xs text-red-400 mt-1.5">
                                                                    {account.lastError}
                                                                </p>
                                                            )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
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
