import { Smartphone, Hourglass, KeyRound, Link2 } from 'lucide-react';
import { GlowCard, MetricCard, StatusBadge } from '../shared/UIComponents';
import type { useGateway } from '../../hooks/useGateway';

interface DevicesProps {
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

export function Devices({ gateway }: DevicesProps) {
    const { devicePairing, status } = gateway;

    const snapshot = devicePairing.data;
    const loading = devicePairing.loading && !snapshot;
    const error = devicePairing.error;

    const paired = snapshot?.paired ?? [];
    const pending = snapshot?.pending ?? [];

    const tokenSummaries = paired.flatMap((d) => d.tokens ?? []);
    const activeTokens = tokenSummaries.filter((t) => !t.revokedAtMs).length;

    const isOnline = status === 'ONLINE';

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Devices</h1>
                <p className="text-sm text-slate-500 mt-1">
                    Paired devices, pending pairing requests, and auth tokens
                </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    label="Paired Devices"
                    value={loading ? '—' : paired.length}
                    sublabel="Approved via device.pair.list"
                    color="purple"
                    icon={<Smartphone className="w-4 h-4" />}
                />
                <MetricCard
                    label="Pending Requests"
                    value={loading ? '—' : pending.length}
                    sublabel="Awaiting approval"
                    color={pending.length > 0 ? 'amber' : 'default'}
                    icon={<Hourglass className="w-4 h-4" />}
                />
                <MetricCard
                    label="Active Tokens"
                    value={loading ? '—' : activeTokens}
                    sublabel={`${tokenSummaries.length} total issued`}
                    color="cyan"
                    icon={<KeyRound className="w-4 h-4" />}
                />
                <MetricCard
                    label="Gateway Link"
                    value={isOnline ? 'ONLINE' : status}
                    sublabel="This UI's Gateway connection"
                    color={isOnline ? 'green' : 'red'}
                    icon={<Link2 className="w-4 h-4" />}
                />
            </div>

            <GlowCard label="Paired Devices">
                {error && !snapshot ? (
                    <p className="text-sm text-red-400">
                        Device data unavailable: {error}
                    </p>
                ) : loading ? (
                    <p className="text-sm text-slate-500">Loading devices…</p>
                ) : paired.length === 0 ? (
                    <p className="text-sm text-slate-500">
                        No paired devices. Pairing requests will appear under
                        "Pending Pairing Requests" when a device tries to connect.
                    </p>
                ) : (
                    <div className="space-y-2">
                        {paired.map((device) => {
                            const title = device.displayName || device.deviceId;
                            return (
                            <div
                                key={device.deviceId}
                                className="p-3 rounded-xl bg-white/[0.03] border border-white/5"
                            >
                                <div className="flex items-center gap-3 flex-wrap">
                                    <span className="text-sm font-semibold text-white">
                                        {title}
                                    </span>
                                    {device.platform && (
                                        <span className="text-xs text-slate-500">
                                            {device.platform}
                                        </span>
                                    )}
                                    <span className="ml-auto">
                                        <StatusBadge status="online" label="PAIRED" />
                                    </span>
                                </div>
                                {title !== device.deviceId && (
                                    <div className="text-xs text-slate-500 font-mono-data mt-1 truncate">
                                        {device.deviceId}
                                    </div>
                                )}
                                <div className="flex gap-x-4 gap-y-1 flex-wrap text-xs text-slate-500 mt-1.5">
                                    {(device.roles?.length
                                        ? device.roles
                                        : device.role
                                          ? [device.role]
                                          : []
                                    ).map((role) => (
                                        <span
                                            key={role}
                                            className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400"
                                        >
                                            {role}
                                        </span>
                                    ))}
                                    {device.remoteIp && (
                                        <span>
                                            ip:{' '}
                                            <span className="text-slate-400">
                                                {device.remoteIp}
                                            </span>
                                        </span>
                                    )}
                                    <span>
                                        approved:{' '}
                                        <span className="text-slate-400">
                                            {fmtDateTime(device.approvedAtMs) ??
                                                'unknown'}
                                        </span>
                                    </span>
                                </div>
                                {(device.tokens ?? []).length > 0 && (
                                    <div className="flex gap-2 flex-wrap mt-2">
                                        {device.tokens!.map((token) => (
                                            <span
                                                key={token.role}
                                                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                                                    token.revokedAtMs
                                                        ? 'bg-white/5 border-white/10 text-slate-500 line-through'
                                                        : 'bg-[#7c3aed]/10 border-[#7c3aed]/25 text-[#a78bfa]'
                                                }`}
                                            >
                                                {token.role} · {token.scopes.length}{' '}
                                                scope
                                                {token.scopes.length === 1 ? '' : 's'}
                                                {token.revokedAtMs ? ' · REVOKED' : ''}
                                            </span>
                                        ))}
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

            <GlowCard label="Pending Pairing Requests">
                {error && !snapshot ? (
                    <p className="text-sm text-red-400">
                        Request data unavailable: {error}
                    </p>
                ) : loading ? (
                    <p className="text-sm text-slate-500">Loading requests…</p>
                ) : pending.length === 0 ? (
                    <p className="text-sm text-slate-500">
                        No pending pairing requests.
                    </p>
                ) : (
                    <div className="space-y-2">
                        {pending.map((request) => (
                            <div
                                key={request.requestId}
                                className="flex items-center gap-4 p-3 rounded-xl bg-amber-500/[0.06] border border-amber-500/20"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-sm font-semibold text-white">
                                            {request.displayName || request.deviceId}
                                        </span>
                                        {request.platform && (
                                            <span className="text-xs text-slate-500">
                                                {request.platform}
                                            </span>
                                        )}
                                        {request.isRepair && (
                                            <span className="text-[11px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">
                                                REPAIR
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-slate-500 font-mono-data mt-0.5 truncate">
                                        {request.deviceId}
                                        {request.remoteIp
                                            ? ` · ${request.remoteIp}`
                                            : ''}
                                    </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <StatusBadge status="warn" label="AWAITING APPROVAL" />
                                    <div className="text-[11px] text-slate-500 mt-1">
                                        {fmtDateTime(request.ts) ?? 'unknown'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </GlowCard>
        </div>
    );
}
