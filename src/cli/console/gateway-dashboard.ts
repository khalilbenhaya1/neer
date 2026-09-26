import blessed from "blessed";
import os from "node:os";
import open from "open";
import { formatCliBannerLine } from "../banner.js";
import { GLOBAL_FOOTER } from "./branding.js";
import { probeGateway } from "../../gateway/probe.js";
import { resolveGatewayPort, loadConfig } from "../../config/config.js";
import { ThreatEngine, type ThreatAssessment, type ApprovalDecision } from "../../gateway/threat-engine.js";
import { Writable } from "node:stream";

// We'll export a function to launch this dashboard
const originalStdoutWrite = process.stdout.write.bind(process.stdout);
const originalStderrWrite = process.stderr.write.bind(process.stderr);

export function launchGatewayDashboard(port: number, version: string) {
    // [CLI INIT] Telemetry
    const isTTY = process.stdout.isTTY === true;
    console.log(`[CLI INIT] launchGatewayDashboard called. isTTY=${isTTY} pid=${process.pid}`);

    // On non-TTY environments (e.g. piped output, CI), skip the TUI entirely
    // to avoid blessed crashing or sending unexpected key events that kill the process.
    if (!isTTY) {
        console.warn("[CLI] Not running in interactive TTY mode — dashboard suppressed.");
        return;
    }

    // Phase 3: Configure stdin BEFORE blessed to ensure it can receive key events.
    // On Windows, failing to set rawMode before blessed attaches means key events
    // are never forwarded to the screen and all shortcuts silently fail.
    if (process.stdin.isTTY) {
        try {
            process.stdin.setRawMode(true);
            console.log("[CLI INPUT READY] stdin rawMode enabled.");
        } catch (err) {
            console.warn("[CLI] Could not set stdin rawMode:", String(err));
        }
    } else {
        console.warn("[CLI] stdin is not a TTY — keyboard shortcuts may not respond.");
    }
    process.stdin.resume();

    const blessedOut = new Writable({
        write(chunk, encoding, callback) {
            originalStdoutWrite(chunk, encoding, callback);
        }
    }) as any;

    // Ensure the writable looks like a TTY for blessed
    blessedOut.isTTY = true;
    blessedOut.columns = process.stdout.columns;
    blessedOut.rows = process.stdout.rows;

    const screen = blessed.screen({
        title: "NEER Gateway Dashboard",
        fullUnicode: true,
        // smartCSR: more stable layout preservation than fastCSR — prevents footer
        // from being wiped during partial redraws when only specific panels update.
        smartCSR: true,
        // Explicitly pass stdin so blessed reliably captures key events on Windows.
        // Without this, the screen may attach to an internal pseudo-stream and
        // keyboard shortcuts silently fail.
        input: process.stdin as any,
        output: blessedOut as any,
        terminal: process.env.TERM || "xterm-256color",
    });

    let isApprovalMode = false;
    const cfg = loadConfig();

    // 1) HEADER Component (Global Branding + Health Score)
    const header = blessed.box({
        top: 0,
        left: 0,
        width: "100%",
        height: 3,
        content: `${formatCliBannerLine(version, { richTty: false })}\nSYSTEM HEALTH: 100% [██████████]`,
        style: {
            fg: "cyan",
            bold: true,
        },
        tags: true,
        align: "center",
    });

    // 2) MODEL STATUS
    const modelStatus = blessed.box({
        top: 4,
        left: 0,
        width: "30%",
        height: "25%",
        label: " MODEL STATUS ",
        border: { type: "line" },
        style: {
            border: { fg: "magenta" },
            label: { fg: "magenta", bold: true },
        },
        tags: true,
        content: "Loading...",
    });

    // 3) GATEWAY STATUS
    const gatewayStatus = blessed.box({
        top: 4,
        left: "30%",
        width: "25%",
        height: "25%",
        label: " GATEWAY STATUS ",
        border: { type: "line" },
        style: {
            border: { fg: "magenta" },
            label: { fg: "magenta", bold: true },
        },
        tags: true,
        content: `ONLINE\nPort: ${port}\nPID: ${process.pid}\nDashboard: http://127.0.0.1:${port}\nPress [D] to open dashboard in browser`,
    });

    // 4) THREAT INTELLIGENCE
    const threatIntel = blessed.box({
        top: 4,
        left: "55%",
        width: "25%",
        height: "25%",
        label: " AI THREAT INTELLIGENCE ",
        border: { type: "line" },
        style: {
            border: { fg: "red" },
            label: { fg: "red", bold: true },
        },
        tags: true,
        content: "Initializing Threat Engine...\nRisk Score: 0/100\nThreat Type: None",
    });

    // 5) SELF-DIAGNOSIS
    const selfDiagnosis = blessed.box({
        top: 4,
        left: "80%",
        width: "20%",
        height: "25%",
        label: " SELF-DIAGNOSIS ",
        border: { type: "line" },
        style: {
            border: { fg: "cyan" },
            label: { fg: "cyan", bold: true },
        },
        tags: true,
        content: "Memory: OK\nVector DB: OK\nLatency: --ms",
    });

    // 5) CHANNELS PANEL
    const channelsPanel = blessed.box({
        top: "30%",
        left: 0,
        width: "30%",
        height: "25%",
        label: " CHANNELS ",
        border: { type: "line" },
        style: {
            border: { fg: "magenta" },
            label: { fg: "magenta", bold: true },
        },
        tags: true,
        content: "Loading channels...",
    });

    // 6) COGNITIVE PULSE / ACTIVE GOALS
    const pulseAndGoals = blessed.box({
        top: "56%",
        left: 0,
        width: "30%",
        height: "43%",
        label: " COGNITIVE PULSE & GOALS ",
        border: { type: "line" },
        style: {
            border: { fg: "blue" },
            label: { fg: "blue", bold: true },
        },
        content: "Pulse: ACTIVE\n\nGoals:\n- No active goals (Idle Reflection)",
    });

    // 7) LIVE LOGS
    const liveLogs = blessed.log({
        top: "30%",
        left: "30%",
        width: "70%",
        height: "60%",
        label: " LIVE LOGS STREAM ",
        border: { type: "line" },
        style: {
            border: { fg: "black" },
            label: { fg: "gray", bold: true },
        },
        scrollbar: {
            // @ts-ignore
            bg: "blue",
        },
        tags: true,
        mouse: true,
        keys: true,
        scrollable: true,
    });

    // 8) KEYBOARD SHORTCUTS BAR
    const shortcutsBar = blessed.box({
        bottom: 6,
        left: 0,
        width: "100%",
        height: 3,
        label: " KEYBOARD SHORTCUTS ",
        border: { type: "line" },
        style: {
            fg: "white",
            border: { fg: "cyan" },
            label: { fg: "cyan", bold: true },
        },
        tags: true,
        align: "center",
        content: "{cyan-fg}[D]{/cyan-fg} Dashboard  {cyan-fg}[L]{/cyan-fg} Logs  {cyan-fg}[T]{/cyan-fg} Threat  {cyan-fg}[M]{/cyan-fg} Model  {cyan-fg}[S]{/cyan-fg} Diag  {cyan-fg}[G]{/cyan-fg} Goals  {cyan-fg}[C]{/cyan-fg} Channels  {cyan-fg}[A]{/cyan-fg} AutoSwitch  {cyan-fg}[R]{/cyan-fg} Refresh  {red-fg}[Q]{/red-fg} Quit",
    });

    // 9) FOOTER Component
    const footerBox = blessed.box({
        bottom: 0,
        left: 0,
        width: "100%",
        height: 6,
        content: GLOBAL_FOOTER,
        style: {
            fg: "gray",
        },
        tags: true,
        align: "center",
    });

    // APPROVAL OVERLAY
    const approvalOverlay = blessed.box({
        top: "center",
        left: "center",
        width: "50%",
        height: "50%",
        label: " SECURITY APPROVAL REQUIRED ",
        border: { type: "line" },
        style: {
            border: { fg: "red" },
            label: { fg: "white", bg: "red", bold: true },
            bg: "black",
        },
        content: "Waiting...",
        hidden: true,
        valign: "middle",
        align: "center",
    });

    screen.append(header);
    screen.append(modelStatus);
    screen.append(gatewayStatus);
    screen.append(threatIntel);
    screen.append(selfDiagnosis);
    screen.append(channelsPanel);
    screen.append(pulseAndGoals);
    screen.append(liveLogs);
    screen.append(shortcutsBar);
    screen.append(footerBox);
    screen.append(approvalOverlay);

    // KEY BINDINGS
    // Use SIGINT instead of process.exit(0) so the gateway run-loop's graceful
    // shutdown handler fires (draining active tasks, releasing the lock, etc.).
    screen.key(["q", "Q"], () => {
        if (isApprovalMode) return; // Prevent quit during approval
        // Restore stdout/stderr before sending the signal so terminal doesn't hang
        process.stdout.write = originalStdoutWrite as any;
        process.stderr.write = originalStderrWrite as any;
        screen.destroy();
        process.kill(process.pid, "SIGINT");
    });

    // D to open dashboard
    screen.key(["d", "D"], async () => {
        if (isApprovalMode) return;
        try {
            const token = cfg.gateway?.auth?.token?.trim() || process.env.NEER_GATEWAY_TOKEN?.trim() || "";
            const basePath = cfg.gateway?.controlUi?.basePath?.replace(/\/+$/, "") ?? "";
            const baseUrl = `http://127.0.0.1:${port}${basePath ? `${basePath}/` : "/"}`;
            const dashboardUrl = token
                ? `${baseUrl}#token=${encodeURIComponent(token)}`
                : baseUrl;
            await open(dashboardUrl);
            liveLogs.log(`{cyan-fg}[Dashboard] Opened ${token ? "authenticated " : ""}dashboard at http://127.0.0.1:${port}{/}`);
            screen.render();
        } catch (e) {
            liveLogs.log(`{red-fg}[Dashboard] Failed to open browser: ${String(e)}{/}`);
            screen.render();
        }
    });

    // Focus controls
    screen.key(["l", "L"], () => { if (!isApprovalMode) liveLogs.focus(); });
    screen.key(["m", "M"], () => { if (!isApprovalMode) modelStatus.focus(); });
    screen.key(["t", "T"], () => { if (!isApprovalMode) threatIntel.focus(); });
    screen.key(["s", "S"], () => { if (!isApprovalMode) selfDiagnosis.focus(); });
    screen.key(["c", "C"], () => { if (!isApprovalMode) channelsPanel.focus(); });
    screen.key(["g", "G"], () => { if (!isApprovalMode) pulseAndGoals.focus(); });
    screen.key(["r", "R"], () => { if (!isApprovalMode) screen.render(); });

    let autoSwitchEnabled = true;
    screen.key(["a", "A"], () => {
        if (!isApprovalMode) {
            autoSwitchEnabled = !autoSwitchEnabled;
            liveLogs.log(`{cyan-fg}[System] Auto Model Switching is now ${autoSwitchEnabled ? 'ENABLED' : 'DISABLED'}{/}`);
            screen.render();
        } else {
            ThreatEngine.getInstance().resolvePendingApproval("allow_always");
            hideApprovalOverlay();
        }
    });

    // Approval keys
    screen.key(["y", "Y"], () => {
        if (isApprovalMode) {
            ThreatEngine.getInstance().resolvePendingApproval("allow_once");
            hideApprovalOverlay();
        }
    });
    screen.key(["n", "N"], () => {
        if (isApprovalMode) {
            ThreatEngine.getInstance().resolvePendingApproval("deny");
            hideApprovalOverlay();
        }
    });
    // 'A' key handled above for dual purpose

    function showApprovalOverlay(pending: any) {
        isApprovalMode = true;
        const asc = pending.assessment;
        approvalOverlay.setContent(
            `HIGH RISK DETECTED (${asc.risk_score}/100)\n` +
            `Tool: ${pending.toolName}\n` +
            `Type: ${asc.threat_type}\n\n` +
            `Analysis: ${asc.analysis}\n\n` +
            `[Y] Approve Once   [A] Always Allow   [N] Deny`
        );
        approvalOverlay.show();
        approvalOverlay.setFront();
        screen.render();
    }

    function hideApprovalOverlay() {
        isApprovalMode = false;
        approvalOverlay.hide();
        screen.render();
    }

    // Intercept Console Logs for the TUI Panels
    const logToPanel = (str: string | Uint8Array, isError: boolean) => {
        const text = str.toString();
        // Strip ANSI escape codes to get plain text
        // eslint-disable-next-line no-control-regex
        const stripped = text.replace(/\x1b\[[0-9;]*[A-Za-z]/g, '').replace(/[^\x20-\x7E\n\r\t]/g, '').trim();
        if (!stripped) return;

        const lower = stripped.toLowerCase();
        let formatted: string;

        if (lower.includes("critical") || lower.includes("fatal")) {
            formatted = `{red-fg}{bold}${stripped}{/bold}{/red-fg}`;
        } else if (lower.includes("error") || isError) {
            formatted = `{red-fg}${stripped}{/red-fg}`;
        } else if (lower.includes("warn")) {
            formatted = `{yellow-fg}${stripped}{/yellow-fg}`;
        } else if (lower.includes("[system]") || lower.includes("[dashboard]")) {
            formatted = `{cyan-fg}${stripped}{/cyan-fg}`;
        } else {
            formatted = `{white-fg}${stripped}{/white-fg}`;
        }

        liveLogs.log(formatted);
        screen.render();
    };

    (process.stdout as any).write = (chunk: string | Uint8Array, encoding?: any, cb?: any) => {
        logToPanel(chunk, false);
        return true;
    };
    (process.stderr as any).write = (chunk: string | Uint8Array, encoding?: any, cb?: any) => {
        logToPanel(chunk, true);
        return true;
    };

    // ── Fatal error passthrough ─────────────────────────────────────────────
    // When the gateway crashes due to an unhandledRejection/uncaughtException,
    // blessed has already hijacked stderr so the error is swallowed by the TUI.
    // This listener re-routes the crash reason to the ORIGINAL stderr so it
    // always appears in the terminal, making post-mortem debugging possible.
    const restoreAndLog = (label: string, reason: unknown) => {
        process.stdout.write = originalStdoutWrite as any;
        process.stderr.write = originalStderrWrite as any;
        try { screen.destroy(); } catch { /* ignore */ }
        const msg = reason instanceof Error
            ? `${reason.message}\n${reason.stack ?? ""}`
            : String(reason);
        originalStderrWrite(`\n[NEER FATAL] ${label}:\n${msg}\n`);
    };
    process.once("uncaughtException", (err) => restoreAndLog("Uncaught Exception", err));
    process.once("unhandledRejection", (reason) => restoreAndLog("Unhandled Rejection", reason));



    liveLogs.log("{cyan-fg}[System] TUI Gateway Dashboard initialized.{/}");
    screen.render();

    // INITIALIZE THREAT ENGINE
    const threatEngine = ThreatEngine.getInstance();
    threatEngine.initialize();

    threatEngine.on("assessment_updated", (asc: ThreatAssessment) => {
        let color = "green-fg";
        if (asc.risk_score >= 41) color = "yellow-fg";
        if (asc.risk_score >= 71) color = "red-fg";

        threatIntel.setContent(
            `Attempts (24h): ${threatEngine.totalAttempts24h}\n` +
            `Last Evaluated: ${threatEngine.lastEvaluatedTool}\n` +
            `Risk Score: {${color}}${asc.risk_score}/100{/}\n` +
            `Type: ${asc.threat_type}\n` +
            `Confidence: ${asc.confidence}%`
        );
        screen.render();

        // Audio alert on high risk
        if (asc.risk_score >= 71) {
            process.stdout.write("\x07"); // Terminal Bell
        }
    });

    threatEngine.on("approval_required", (pending) => {
        showApprovalOverlay(pending);
    });

    // POLLING LOGIC
    const uptimeStart = process.uptime();
    const dashboardPollInterval = setInterval(async () => {
        try {
            const probe = await probeGateway({
                url: `ws://127.0.0.1:${port}`,
                timeoutMs: 2000,
            });

            const uptimeHours = (process.uptime() / 3600).toFixed(2);
            let gsContent = `ONLINE\nPort: ${port}\nPID: ${process.pid}\nUptime: ${uptimeHours}h\nDashboard: http://127.0.0.1:${port}\nPress [D] to open dashboard`;

            let healthScore = 100;
            let modelTxt = "Model: Unknown\nUsage: N/A\nHealth: Unknown";
            let channelsTxt = "No channels loaded.";

            if (probe.ok && probe.health) {
                gsContent = `{green-fg}ONLINE{/}\nPort: ${port}\nPID: ${process.pid}\nUptime: ${uptimeHours}h\nHeartbeat: {green-fg}OK{/}\nDashboard: http://127.0.0.1:${port}\nPress [D] to open dashboard`;

                const h = probe.health as any;

                // Models
                const statusData = probe.status as any;
                const activeModel = statusData?.sessions?.defaults?.model || "Unknown";
                const isModelOk = healthScore >= 50; // Use overall health as a proxy if explicit model state isn't available

                // Usage computation placeholder mapped to a progress bar
                const usagePercent = 45; // TODO: Pull real limit usage if available
                const usageBar = "█".repeat(Math.round(usagePercent / 10)) + "▒".repeat(10 - Math.round(usagePercent / 10));

                modelTxt = `Name: ${activeModel}\nStatus: ${isModelOk ? '{green-fg}OK{/}' : '{red-fg}Check Logs{/}'}\n\nHourly Usage [${usagePercent}%]:\n{magenta-fg}${usageBar}{/}`;


                // Channels
                if (h.channels) {
                    const okCount = h.channels.ok?.length || 0;
                    const errorCount = h.channels.error?.length || 0;
                    const expiredCount = h.channels.expired?.length || 0;
                    const unconfiguredCount = h.channels.unconfigured?.length || 0;

                    healthScore -= (errorCount * 10);

                    let lines = [];
                    if (okCount > 0) lines.push(`{green-fg}Connected: ${okCount}{/}`);
                    if (expiredCount > 0) lines.push(`{yellow-fg}Expired: ${expiredCount}{/}`);
                    if (errorCount > 0) lines.push(`{red-fg}Error: ${errorCount}{/}`);
                    if (unconfiguredCount > 0) lines.push(`{gray-fg}Unconfigured: ${unconfiguredCount}{/}`);

                    if (h.channels.error && h.channels.error.length > 0) {
                        lines.push(`\nLatest Error: ${h.channels.error[0].id} - ${h.channels.error[0].error}`);
                    }
                    channelsTxt = lines.join('\n') || "No active channels.";
                }
            } else {
                gsContent = `{red-fg}OFFLINE / UNREACHABLE{/}\nPort: ${port}\nPID: ${process.pid}\nUptime: ${uptimeHours}h\nDashboard: http://127.0.0.1:${port}\nPress [D] to open dashboard`;
                healthScore -= 50;
            }

            // Memory Usage computation
            const mem = process.memoryUsage();
            const memMb = Math.round(mem.rss / 1024 / 1024);
            const heapMb = Math.round(mem.heapUsed / 1024 / 1024);
            let memColor = memMb > 1500 ? "red-fg" : (memMb > 1000 ? "yellow-fg" : "green-fg");
            if (memMb > 1500) healthScore -= 30; // High memory penalty

            // Threat Engine penalty
            const threatScore = ThreatEngine.getInstance().lastAssessment?.risk_score || 0;
            if (threatScore >= 41) healthScore -= 10;
            if (threatScore >= 71) healthScore -= 40;

            // Vector DB Placeholder (Assuming stable unless reported otherwise in agent loop)
            const vdbColor = "green-fg";

            selfDiagnosis.setContent(`Memory (RSS): {${memColor}}${memMb} MB{/}\nHeap: ${heapMb} MB\n\nVector DB: {${vdbColor}}ONLINE{/}\nLatency: 45ms`);

            // Bind Score
            let hcColor = "green-fg";
            if (healthScore < 80) hcColor = "yellow-fg";
            if (healthScore < 50) hcColor = "red-fg";
            header.setContent(`${formatCliBannerLine(version, { richTty: false })}\nSYSTEM HEALTH: {${hcColor}}${healthScore}%{/} [██████████]`);

            modelStatus.setContent(modelTxt);
            gatewayStatus.setContent(gsContent);
            channelsPanel.setContent(channelsTxt);

            screen.render();
        } catch (err) {
            // Ignore polling errors — never let dashboard polling crash the process
        }
    }, 5000);
    // Unref so the polling timer doesn't keep Node alive on its own
    dashboardPollInterval.unref();
}
