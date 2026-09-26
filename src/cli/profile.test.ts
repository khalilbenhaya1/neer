import path from "node:path";
import { describe, expect, it } from "vitest";
import { formatCliCommand } from "./command-format.js";
import { applyCliProfileEnv, parseCliProfileArgs } from "./profile.js";

describe("parseCliProfileArgs", () => {
  it("leaves gateway --dev for subcommands", () => {
    const res = parseCliProfileArgs([
      "node",
      "neer",
      "gateway",
      "--dev",
      "--allow-unconfigured",
    ]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBeNull();
    expect(res.argv).toEqual(["node", "neer", "gateway", "--dev", "--allow-unconfigured"]);
  });

  it("still accepts global --dev before subcommand", () => {
    const res = parseCliProfileArgs(["node", "neer", "--dev", "gateway"]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBe("dev");
    expect(res.argv).toEqual(["node", "neer", "gateway"]);
  });

  it("parses --profile value and strips it", () => {
    const res = parseCliProfileArgs(["node", "neer", "--profile", "work", "status"]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBe("work");
    expect(res.argv).toEqual(["node", "neer", "status"]);
  });

  it("rejects missing profile value", () => {
    const res = parseCliProfileArgs(["node", "neer", "--profile"]);
    expect(res.ok).toBe(false);
  });

  it("rejects combining --dev with --profile (dev first)", () => {
    const res = parseCliProfileArgs(["node", "neer", "--dev", "--profile", "work", "status"]);
    expect(res.ok).toBe(false);
  });

  it("rejects combining --dev with --profile (profile first)", () => {
    const res = parseCliProfileArgs(["node", "neer", "--profile", "work", "--dev", "status"]);
    expect(res.ok).toBe(false);
  });
});

describe("applyCliProfileEnv", () => {
  it("fills env defaults for dev profile", () => {
    const env: Record<string, string | undefined> = {};
    applyCliProfileEnv({
      profile: "dev",
      env,
      homedir: () => "/home/peter",
    });
    const expectedStateDir = path.join(path.resolve("/home/peter"), ".neer-dev");
    expect(env.NEER_PROFILE).toBe("dev");
    expect(env.NEER_STATE_DIR).toBe(expectedStateDir);
    expect(env.NEER_CONFIG_PATH).toBe(path.join(expectedStateDir, "neer.json"));
    expect(env.NEER_GATEWAY_PORT).toBe("19001");
  });

  it("does not override explicit env values", () => {
    const env: Record<string, string | undefined> = {
      NEER_STATE_DIR: "/custom",
      NEER_GATEWAY_PORT: "19099",
    };
    applyCliProfileEnv({
      profile: "dev",
      env,
      homedir: () => "/home/peter",
    });
    expect(env.NEER_STATE_DIR).toBe("/custom");
    expect(env.NEER_GATEWAY_PORT).toBe("19099");
    expect(env.NEER_CONFIG_PATH).toBe(path.join("/custom", "neer.json"));
  });

  it("uses NEER_HOME when deriving profile state dir", () => {
    const env: Record<string, string | undefined> = {
      NEER_HOME: "/srv/neer-home",
      HOME: "/home/other",
    };
    applyCliProfileEnv({
      profile: "work",
      env,
      homedir: () => "/home/fallback",
    });

    const resolvedHome = path.resolve("/srv/neer-home");
    expect(env.NEER_STATE_DIR).toBe(path.join(resolvedHome, ".neer-work"));
    expect(env.NEER_CONFIG_PATH).toBe(
      path.join(resolvedHome, ".neer-work", "neer.json"),
    );
  });
});

describe("formatCliCommand", () => {
  it("returns command unchanged when no profile is set", () => {
    expect(formatCliCommand("neer doctor --fix", {})).toBe("neer doctor --fix");
  });

  it("returns command unchanged when profile is default", () => {
    expect(formatCliCommand("neer doctor --fix", { NEER_PROFILE: "default" })).toBe(
      "neer doctor --fix",
    );
  });

  it("returns command unchanged when profile is Default (case-insensitive)", () => {
    expect(formatCliCommand("neer doctor --fix", { NEER_PROFILE: "Default" })).toBe(
      "neer doctor --fix",
    );
  });

  it("returns command unchanged when profile is invalid", () => {
    expect(formatCliCommand("neer doctor --fix", { NEER_PROFILE: "bad profile" })).toBe(
      "neer doctor --fix",
    );
  });

  it("returns command unchanged when --profile is already present", () => {
    expect(
      formatCliCommand("neer --profile work doctor --fix", { NEER_PROFILE: "work" }),
    ).toBe("neer --profile work doctor --fix");
  });

  it("returns command unchanged when --dev is already present", () => {
    expect(formatCliCommand("neer --dev doctor", { NEER_PROFILE: "dev" })).toBe(
      "neer --dev doctor",
    );
  });

  it("inserts --profile flag when profile is set", () => {
    expect(formatCliCommand("neer doctor --fix", { NEER_PROFILE: "work" })).toBe(
      "neer --profile work doctor --fix",
    );
  });

  it("trims whitespace from profile", () => {
    expect(formatCliCommand("neer doctor --fix", { NEER_PROFILE: "  jbneer  " })).toBe(
      "neer --profile jbneer doctor --fix",
    );
  });

  it("handles command with no args after neer", () => {
    expect(formatCliCommand("neer", { NEER_PROFILE: "test" })).toBe(
      "neer --profile test",
    );
  });

  it("handles pnpm wrapper", () => {
    expect(formatCliCommand("pnpm neer doctor", { NEER_PROFILE: "work" })).toBe(
      "pnpm neer --profile work doctor",
    );
  });
});
