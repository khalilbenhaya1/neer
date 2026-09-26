import { describe, expect, it } from "vitest";
import {
  buildParseArgv,
  getFlagValue,
  getCommandPath,
  getPrimaryCommand,
  getPositiveIntFlagValue,
  getVerboseFlag,
  hasHelpOrVersion,
  hasFlag,
  shouldMigrateState,
  shouldMigrateStateFromPath,
} from "./argv.js";

describe("argv helpers", () => {
  it("detects help/version flags", () => {
    expect(hasHelpOrVersion(["node", "neer", "--help"])).toBe(true);
    expect(hasHelpOrVersion(["node", "neer", "-V"])).toBe(true);
    expect(hasHelpOrVersion(["node", "neer", "status"])).toBe(false);
  });

  it("extracts command path ignoring flags and terminator", () => {
    expect(getCommandPath(["node", "neer", "status", "--json"], 2)).toEqual(["status"]);
    expect(getCommandPath(["node", "neer", "agents", "list"], 2)).toEqual(["agents", "list"]);
    expect(getCommandPath(["node", "neer", "status", "--", "ignored"], 2)).toEqual(["status"]);
  });

  it("returns primary command", () => {
    expect(getPrimaryCommand(["node", "neer", "agents", "list"])).toBe("agents");
    expect(getPrimaryCommand(["node", "neer"])).toBeNull();
  });

  it("parses boolean flags and ignores terminator", () => {
    expect(hasFlag(["node", "neer", "status", "--json"], "--json")).toBe(true);
    expect(hasFlag(["node", "neer", "--", "--json"], "--json")).toBe(false);
  });

  it("extracts flag values with equals and missing values", () => {
    expect(getFlagValue(["node", "neer", "status", "--timeout", "5000"], "--timeout")).toBe(
      "5000",
    );
    expect(getFlagValue(["node", "neer", "status", "--timeout=2500"], "--timeout")).toBe(
      "2500",
    );
    expect(getFlagValue(["node", "neer", "status", "--timeout"], "--timeout")).toBeNull();
    expect(getFlagValue(["node", "neer", "status", "--timeout", "--json"], "--timeout")).toBe(
      null,
    );
    expect(getFlagValue(["node", "neer", "--", "--timeout=99"], "--timeout")).toBeUndefined();
  });

  it("parses verbose flags", () => {
    expect(getVerboseFlag(["node", "neer", "status", "--verbose"])).toBe(true);
    expect(getVerboseFlag(["node", "neer", "status", "--debug"])).toBe(false);
    expect(getVerboseFlag(["node", "neer", "status", "--debug"], { includeDebug: true })).toBe(
      true,
    );
  });

  it("parses positive integer flag values", () => {
    expect(getPositiveIntFlagValue(["node", "neer", "status"], "--timeout")).toBeUndefined();
    expect(
      getPositiveIntFlagValue(["node", "neer", "status", "--timeout"], "--timeout"),
    ).toBeNull();
    expect(
      getPositiveIntFlagValue(["node", "neer", "status", "--timeout", "5000"], "--timeout"),
    ).toBe(5000);
    expect(
      getPositiveIntFlagValue(["node", "neer", "status", "--timeout", "nope"], "--timeout"),
    ).toBeUndefined();
  });

  it("builds parse argv from raw args", () => {
    const nodeArgv = buildParseArgv({
      programName: "neer",
      rawArgs: ["node", "neer", "status"],
    });
    expect(nodeArgv).toEqual(["node", "neer", "status"]);

    const versionedNodeArgv = buildParseArgv({
      programName: "neer",
      rawArgs: ["node-22", "neer", "status"],
    });
    expect(versionedNodeArgv).toEqual(["node-22", "neer", "status"]);

    const versionedNodeWindowsArgv = buildParseArgv({
      programName: "neer",
      rawArgs: ["node-22.2.0.exe", "neer", "status"],
    });
    expect(versionedNodeWindowsArgv).toEqual(["node-22.2.0.exe", "neer", "status"]);

    const versionedNodePatchlessArgv = buildParseArgv({
      programName: "neer",
      rawArgs: ["node-22.2", "neer", "status"],
    });
    expect(versionedNodePatchlessArgv).toEqual(["node-22.2", "neer", "status"]);

    const versionedNodeWindowsPatchlessArgv = buildParseArgv({
      programName: "neer",
      rawArgs: ["node-22.2.exe", "neer", "status"],
    });
    expect(versionedNodeWindowsPatchlessArgv).toEqual(["node-22.2.exe", "neer", "status"]);

    const versionedNodeWithPathArgv = buildParseArgv({
      programName: "neer",
      rawArgs: ["/usr/bin/node-22.2.0", "neer", "status"],
    });
    expect(versionedNodeWithPathArgv).toEqual(["/usr/bin/node-22.2.0", "neer", "status"]);

    const nodejsArgv = buildParseArgv({
      programName: "neer",
      rawArgs: ["nodejs", "neer", "status"],
    });
    expect(nodejsArgv).toEqual(["nodejs", "neer", "status"]);

    const nonVersionedNodeArgv = buildParseArgv({
      programName: "neer",
      rawArgs: ["node-dev", "neer", "status"],
    });
    expect(nonVersionedNodeArgv).toEqual(["node", "neer", "node-dev", "neer", "status"]);

    const directArgv = buildParseArgv({
      programName: "neer",
      rawArgs: ["neer", "status"],
    });
    expect(directArgv).toEqual(["node", "neer", "status"]);

    const bunArgv = buildParseArgv({
      programName: "neer",
      rawArgs: ["bun", "src/entry.ts", "status"],
    });
    expect(bunArgv).toEqual(["bun", "src/entry.ts", "status"]);
  });

  it("builds parse argv from fallback args", () => {
    const fallbackArgv = buildParseArgv({
      programName: "neer",
      fallbackArgv: ["status"],
    });
    expect(fallbackArgv).toEqual(["node", "neer", "status"]);
  });

  it("decides when to migrate state", () => {
    expect(shouldMigrateState(["node", "neer", "status"])).toBe(false);
    expect(shouldMigrateState(["node", "neer", "health"])).toBe(false);
    expect(shouldMigrateState(["node", "neer", "sessions"])).toBe(false);
    expect(shouldMigrateState(["node", "neer", "memory", "status"])).toBe(false);
    expect(shouldMigrateState(["node", "neer", "agent", "--message", "hi"])).toBe(false);
    expect(shouldMigrateState(["node", "neer", "agents", "list"])).toBe(true);
    expect(shouldMigrateState(["node", "neer", "message", "send"])).toBe(true);
  });

  it("reuses command path for migrate state decisions", () => {
    expect(shouldMigrateStateFromPath(["status"])).toBe(false);
    expect(shouldMigrateStateFromPath(["agents", "list"])).toBe(true);
  });
});
