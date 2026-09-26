// src/cli/console/dashboard.ts
import blessed from "blessed";
import os from "node:os";
import { formatCliBannerLine } from "../banner.js";
import { GLOBAL_FOOTER } from "./branding.js";
import { getRandomSarcasticMessage } from "./sarcasm.js";

export function launchConsoleDashboard(version: string) {
    const screen = blessed.screen({
        smartCSR: true,
        title: "NEER Control Center",
        fullUnicode: true,
    });

    // Header Component
    const header = blessed.box({
        top: 0,
        left: 0,
        width: "100%",
        height: 3,
        content: `${formatCliBannerLine(version, { richTty: false })}\n${getRandomSarcasticMessage()}`,
        style: {
            fg: "cyan",
            bold: true,
        },
        align: "center",
    });

    // Pulse Monitor Component
    const pulseMonitor = blessed.box({
        top: 4,
        left: 0,
        width: "50%",
        height: "20%",
        label: " Pulse Monitor ",
        border: { type: "line" },
        style: {
            border: { fg: "magenta" },
            label: { fg: "magenta", bold: true },
        },
        content: "Status: Stable\nHeartbeat: Normal\nCycle Time: 12ms",
    });

    // System Metrics Component
    const systemMetrics = blessed.box({
        top: 4,
        left: "50%",
        width: "50%",
        height: "20%",
        label: " System Metrics ",
        border: { type: "line" },
        style: {
            border: { fg: "magenta" },
            label: { fg: "magenta", bold: true },
        },
        content: `CPU: ${os.loadavg()[0].toFixed(2)}\nMemory (Free/Total): ${(
            os.freemem() /
            1024 /
            1024 /
            1024
        ).toFixed(2)}GB / ${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)}GB\nUptime: ${(
            process.uptime() / 3600
        ).toFixed(2)} hours`,
    });

    // Active Goals Component
    const activeGoals = blessed.box({
        top: "24%",
        left: 0,
        width: "30%",
        height: "60%",
        label: " Active Goals ",
        border: { type: "line" },
        style: {
            border: { fg: "blue" },
            label: { fg: "blue", bold: true },
        },
        content: "No active goals.",
    });

    // Live Logs Component
    const liveLogs = blessed.log({
        top: "24%",
        left: "30%",
        width: "70%",
        height: "60%",
        label: " Live Logs Stream ",
        border: { type: "line" },
        style: {
            border: { fg: "black" },
            label: { fg: "gray", bold: true },
        },
        scrollbar: {
            bg: "blue",
        },
        mouse: true,
        keys: true,
        scrollable: true,
    });

    // Footer Component
    const footerBox = blessed.box({
        bottom: 0,
        left: 0,
        width: "100%",
        height: 8,
        content: GLOBAL_FOOTER,
        style: {
            fg: "gray",
        },
        align: "center",
    });

    screen.append(header);
    screen.append(pulseMonitor);
    screen.append(systemMetrics);
    screen.append(activeGoals);
    screen.append(liveLogs);
    screen.append(footerBox);

    // Key bindings
    screen.key(["escape", "q", "C-c"], () => {
        return process.exit(0);
    });

    screen.key(["r"], () => {
        header.setContent(
            `${formatCliBannerLine(version, { richTty: false })}\n${getRandomSarcasticMessage()}`
        );
        screen.render();
    });

    screen.key(["l"], () => {
        liveLogs.focus();
    });

    screen.key(["g"], () => {
        activeGoals.focus();
    });

    // Initial render
    liveLogs.log("NEER console initialized.");
    screen.render();

    // Rotate sarcastic message occasionally (every 10 seconds)
    setInterval(() => {
        header.setContent(
            `${formatCliBannerLine(version, { richTty: false })}\n${getRandomSarcasticMessage()}`
        );
        screen.render();
    }, 10000);
}
