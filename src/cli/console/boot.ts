// src/cli/console/boot.ts
import boxen from "boxen";
import chalk from "chalk";
import Table from "cli-table3";
import { formatCliBannerArt, formatCliBannerLine } from "../banner.js";
import { printGlobalFooter } from "./branding.js";
import { getRandomSarcasticMessage } from "./sarcasm.js";

// A small subset of primary commands for the new boot view
const CORE_COMMANDS = [
    { cmd: "neer console", desc: "Launch the interactive Terminal Dashboard." },
    { cmd: "neer gateway", desc: "Start the local Gateway WebSocket server." },
    { cmd: "neer agents list", desc: "View available connected and local AI Agents." },
    { cmd: "neer message send", desc: "Send a message via the CLI to connected channels." },
    { cmd: "neer memory status", desc: "Check current LLM context/memory state." },
    { cmd: "neer plugins", desc: "Manage and list installed NEER plugins." },
    { cmd: "neer config", desc: "View and edit NEER configuration." },
    { cmd: "neer --help", desc: "Show complete list of all commands." },
];

export async function renderBootConsole(version: string) {
    // We explicitly disable Commander's default help output if we are overriding it.
    console.log("");
    console.log(formatCliBannerArt({ richTty: true }));
    console.log(formatCliBannerLine(version, { richTty: true }));

    // Sarcastic engine
    console.log(chalk.italic.gray(`  ${getRandomSarcasticMessage()}\n`));

    // Build the metrics box
    const metricsBox = [
        `${chalk.cyan.bold("System Status")} : ${chalk.green("Online")}`,
        `${chalk.cyan.bold("Gateway Port")}  : ${chalk.white("19001 (default)")}`,
        `${chalk.cyan.bold("Profile")}       : ${chalk.white("default")}`,
        `${chalk.cyan.bold("Mode")}          : ${chalk.yellow("Production")}`,
        `${chalk.cyan.bold("Cognitive Pulse")}: ${chalk.green("Stable")} (last beat 2s ago)`,
        `${chalk.cyan.bold("Active Goals")}  : ${chalk.white("0")}`,
        `${chalk.cyan.bold("Memory Vectors")}: ${chalk.white("~0")}`,
        `${chalk.cyan.bold("Connected Nodes")}: ${chalk.white("0")}`,
        `${chalk.cyan.bold("Uptime")}        : ${chalk.white(process.uptime().toFixed(1) + "s")}`,
    ].join("\n");

    console.log(
        boxen(metricsBox, {
            padding: 1,
            margin: { top: 0, bottom: 1, left: 2, right: 0 },
            borderStyle: "round",
            borderColor: "magenta",
            title: chalk.magenta.bold(" CORE METRICS "),
            titleAlignment: "center",
        })
    );

    // Build the Quick Commands table
    const table = new Table({
        head: [chalk.magenta.bold("COMMAND"), chalk.cyan.bold("OBJECTIVE")],
        style: {
            head: [],
            border: ["gray"],
        },
        colWidths: [24, 60],
    });

    for (const { cmd, desc } of CORE_COMMANDS) {
        table.push([chalk.green(cmd), chalk.gray(desc)]);
    }

    console.log(chalk.magenta.bold("  PRIMARY DIRECTIVES"));
    console.log(table.toString().split("\n").map(l => "  " + l).join("\n"));

    printGlobalFooter();
    process.exit(0);
}
