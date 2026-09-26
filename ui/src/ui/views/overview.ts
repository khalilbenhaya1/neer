import { html } from "lit";
import type { GatewayHelloOk } from "../gateway.ts";
import type { UiSettings } from "../storage.ts";
import { formatRelativeTimestamp, formatDurationHuman } from "../format.ts";
import { formatNextRun } from "../presenter.ts";

export type OverviewProps = {
  connected: boolean;
  hello: GatewayHelloOk | null;
  settings: UiSettings;
  password: string;
  lastError: string | null;
  presenceCount: number;
  sessionsCount: number | null;
  cronEnabled: boolean | null;
  cronNext: number | null;
  lastChannelsRefresh: number | null;
  onSettingsChange: (next: UiSettings) => void;
  onPasswordChange: (next: string) => void;
  onSessionKeyChange: (next: string) => void;
  onConnect: () => void;
  onRefresh: () => void;
  gpuWorkload: number;
  currentTask: string | null;
};

export function renderOverview(props: OverviewProps) {
  const snapshot = props.hello?.snapshot as
    | { uptimeMs?: number; policy?: { tickIntervalMs?: number } }
    | undefined;
  const uptime = snapshot?.uptimeMs ? formatDurationHuman(snapshot.uptimeMs) : "n/a";
  const tick = snapshot?.policy?.tickIntervalMs ? `${snapshot.policy.tickIntervalMs}ms` : "n/a";
  const authHint = (() => {
    if (props.connected || !props.lastError) {
      return null;
    }
    const lower = props.lastError.toLowerCase();
    const authFailed = lower.includes("unauthorized") || lower.includes("connect failed");
    if (!authFailed) {
      return null;
    }
    const hasToken = Boolean(props.settings.token.trim());
    const hasPassword = Boolean(props.password.trim());
    if (!hasToken && !hasPassword) {
      return html`
        <div class="muted" style="margin-top: 8px">
          This gateway requires auth. Add a token or password, then click Connect.
          <div style="margin-top: 6px">
            <span class="mono">neer dashboard --no-open</span> → open the Control UI<br />
            <span class="mono">neer doctor --generate-gateway-token</span> → set token
          </div>
          <div style="margin-top: 6px">
            <a
              class="session-link"
              href="https://docs.neer.ai/web/dashboard"
              target="_blank"
              rel="noreferrer"
              title="Control UI auth docs (opens in new tab)"
              >Docs: Control UI auth</a
            >
          </div>
        </div>
      `;
    }
    return html`
      <div class="muted" style="margin-top: 8px">
        Auth failed. Update the token or password in Control UI settings, then click Connect.
        <div style="margin-top: 6px">
          <a
            class="session-link"
            href="https://docs.neer.ai/web/dashboard"
            target="_blank"
            rel="noreferrer"
            title="Control UI auth docs (opens in new tab)"
            >Docs: Control UI auth</a
          >
        </div>
      </div>
    `;
  })();
  const insecureContextHint = (() => {
    if (props.connected || !props.lastError) {
      return null;
    }
    const isSecureContext = typeof window !== "undefined" ? window.isSecureContext : true;
    if (isSecureContext) {
      return null;
    }
    const lower = props.lastError.toLowerCase();
    if (!lower.includes("secure context") && !lower.includes("device identity required")) {
      return null;
    }
    return html`
      <div class="muted" style="margin-top: 8px">
        This page is HTTP, so the browser blocks device identity. Use HTTPS (Tailscale Serve) or open
        <span class="mono">http://127.0.0.1:18789</span> on the gateway host.
        <div style="margin-top: 6px">
          If you must stay on HTTP, set
          <span class="mono">gateway.controlUi.allowInsecureAuth: true</span> (token-only).
        </div>
        <div style="margin-top: 6px">
          <a
            class="session-link"
            href="https://docs.neer.ai/gateway/tailscale"
            target="_blank"
            rel="noreferrer"
            title="Tailscale Serve docs (opens in new tab)"
            >Docs: Tailscale Serve</a
          >
          <span class="muted"> · </span>
          <a
            class="session-link"
            href="https://docs.neer.ai/web/control-ui#insecure-http"
            target="_blank"
            rel="noreferrer"
            title="Insecure HTTP docs (opens in new tab)"
            >Docs: Insecure HTTP</a
          >
        </div>
      </div>
    `;
  })();

  /* ── Row 1: System Brain Status Indicators ── */
  const statusOk = props.connected;
  const taskLabel = props.currentTask || "Idle";
  const gpuPct = props.gpuWorkload ?? 0;

  return html`
    <!-- ══ Row 1: System Brain ══ -->
    <div class="cc-section-label">System Brain</div>
    <section class="grid grid-cols-4" style="margin-bottom: 18px;">
      <div class="card stat-card cc-brain-card ${statusOk ? "cc-ok" : "cc-warn"}">
        <div class="stat-label">Gateway</div>
        <div class="stat-value ${statusOk ? "ok" : "warn"}">
          ${statusOk ? "● ONLINE" : "● OFFLINE"}
        </div>
        <div class="muted">WebSocket connection</div>
      </div>
      <div class="card stat-card cc-brain-card">
        <div class="stat-label">Uptime</div>
        <div class="stat-value">${uptime}</div>
        <div class="muted">Since last restart</div>
      </div>
      <div class="card stat-card cc-brain-card">
        <div class="stat-label">Current Task</div>
        <div class="stat-value" style="font-size: 0.85em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${taskLabel}">
          ${taskLabel}
        </div>
        <div class="muted">Tick: ${tick}</div>
      </div>
      <div class="card stat-card cc-brain-card ${gpuPct > 80 ? "cc-warn" : ""}">
        <div class="stat-label">GPU Workload</div>
        <div class="stat-value ${gpuPct > 80 ? "warn" : ""}">${gpuPct}%</div>
        <div class="cc-bar-wrap">
          <div class="cc-bar" style="width: ${Math.min(gpuPct, 100)}%; background: ${gpuPct > 80 ? "var(--danger)" : "var(--accent)"};"></div>
        </div>
      </div>
    </section>

    <!-- ══ Row 2: Live Metrics ══ -->
    <div class="cc-section-label">Live Metrics</div>
    <section class="grid grid-cols-3" style="margin-bottom: 18px;">
      <div class="card stat-card">
        <div class="stat-label">Instances</div>
        <div class="stat-value">${props.presenceCount}</div>
        <div class="muted">Presence beacons (last 5 min)</div>
      </div>
      <div class="card stat-card">
        <div class="stat-label">Sessions</div>
        <div class="stat-value">${props.sessionsCount ?? "n/a"}</div>
        <div class="muted">Session keys tracked</div>
      </div>
      <div class="card stat-card">
        <div class="stat-label">Automation</div>
        <div class="stat-value">
          ${props.cronEnabled == null ? "n/a" : props.cronEnabled ? "Enabled" : "Disabled"}
        </div>
        <div class="muted">Next wake ${formatNextRun(props.cronNext)}</div>
      </div>
    </section>

    <!-- ══ Row 3: Channels Refresh ══ -->
    <div class="cc-section-label">Intelligence</div>
    <section class="grid grid-cols-2" style="margin-bottom: 18px;">
      <div class="card">
        <div class="card-title">Channels Last Refresh</div>
        <div class="card-sub">Most recent successful channel data pull.</div>
        <div class="stat-value" style="margin-top: 10px; font-size: 1.05em;">
          ${props.lastChannelsRefresh ? formatRelativeTimestamp(props.lastChannelsRefresh) : "n/a"}
        </div>
      </div>
      ${props.lastError
      ? html`<div class="card">
              <div class="callout danger">
                <div>${props.lastError}</div>
                ${authHint ?? ""}
                ${insecureContextHint ?? ""}
              </div>
            </div>`
      : html`<div class="card">
              <div class="card-title">System Notes</div>
              <div class="note-grid" style="margin-top: 10px;">
                <div>
                  <div class="note-title">Tailscale serve</div>
                  <div class="muted">Prefer serve mode for tailnet auth.</div>
                </div>
                <div>
                  <div class="note-title">Session hygiene</div>
                  <div class="muted">Use /new or sessions.patch to reset context.</div>
                </div>
                <div>
                  <div class="note-title">Cron reminders</div>
                  <div class="muted">Use isolated sessions for recurring runs.</div>
                </div>
              </div>
            </div>`
    }
    </section>

    <!-- ══ Row 4: Gateway Access ══ -->
    <div class="cc-section-label">Quick Connect</div>
    <section class="grid grid-cols-2">
      <div class="card">
        <div class="card-title">Gateway Access</div>
        <div class="card-sub">Where the dashboard connects and how it authenticates.</div>
        <div class="form-grid" style="margin-top: 16px;">
          <label class="field">
            <span>WebSocket URL</span>
            <input
              .value=${props.settings.gatewayUrl}
              @input=${(e: Event) => {
      const v = (e.target as HTMLInputElement).value;
      props.onSettingsChange({ ...props.settings, gatewayUrl: v });
    }}
              placeholder="ws://100.x.y.z:18789"
            />
          </label>
          <label class="field">
            <span>Gateway Token</span>
            <input
              .value=${props.settings.token}
              @input=${(e: Event) => {
      const v = (e.target as HTMLInputElement).value;
      props.onSettingsChange({ ...props.settings, token: v });
    }}
              placeholder="NEER_GATEWAY_TOKEN"
            />
          </label>
          <label class="field">
            <span>Password (not stored)</span>
            <input
              type="password"
              .value=${props.password}
              @input=${(e: Event) => {
      const v = (e.target as HTMLInputElement).value;
      props.onPasswordChange(v);
    }}
              placeholder="system or shared password"
            />
          </label>
          <label class="field">
            <span>Default Session Key</span>
            <input
              .value=${props.settings.sessionKey}
              @input=${(e: Event) => {
      const v = (e.target as HTMLInputElement).value;
      props.onSessionKeyChange(v);
    }}
            />
          </label>
        </div>
        <div class="row" style="margin-top: 14px;">
          <button class="btn" @click=${() => props.onConnect()}>Connect</button>
          <button class="btn" @click=${() => props.onRefresh()}>Refresh</button>
          <span class="muted">Click Connect to apply connection changes.</span>
        </div>
      </div>

      <div class="card">
        <div class="card-title">Gateway Snapshot</div>
        <div class="card-sub">Latest handshake information from the gateway.</div>
        <div class="stat-grid" style="margin-top: 16px;">
          <div class="stat">
            <div class="stat-label">Status</div>
            <div class="stat-value ${props.connected ? "ok" : "warn"}">
              ${props.connected ? "Connected" : "Disconnected"}
            </div>
          </div>
          <div class="stat">
            <div class="stat-label">Uptime</div>
            <div class="stat-value">${uptime}</div>
          </div>
          <div class="stat">
            <div class="stat-label">Tick Interval</div>
            <div class="stat-value">${tick}</div>
          </div>
          <div class="stat">
            <div class="stat-label">GPU Workload</div>
            <div class="stat-value">${gpuPct}%</div>
          </div>
          <div class="stat">
            <div class="stat-label">Current Task</div>
            <div class="stat-value" style="font-size: 0.9em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 150px;" title="${props.currentTask || "Idle"}">
              ${props.currentTask || "Idle"}
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}
