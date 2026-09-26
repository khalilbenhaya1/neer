import path from "node:path";
import { describe, expect, it } from "vitest";
import { resolveGatewayStateDir } from "./paths.js";

describe("resolveGatewayStateDir", () => {
  it("uses the default state dir when no overrides are set", () => {
    const env = { HOME: "/Users/test" };
    expect(resolveGatewayStateDir(env)).toBe(path.join("/Users/test", ".neer"));
  });

  it("appends the profile suffix when set", () => {
    const env = { HOME: "/Users/test", NEER_PROFILE: "rescue" };
    expect(resolveGatewayStateDir(env)).toBe(path.join("/Users/test", ".neer-rescue"));
  });

  it("treats default profiles as the base state dir", () => {
    const env = { HOME: "/Users/test", NEER_PROFILE: "Default" };
    expect(resolveGatewayStateDir(env)).toBe(path.join("/Users/test", ".neer"));
  });

  it("uses NEER_STATE_DIR when provided", () => {
    const env = { HOME: "/Users/test", NEER_STATE_DIR: "/var/lib/neer" };
    expect(resolveGatewayStateDir(env)).toBe(path.resolve("/var/lib/neer"));
  });

  it("expands ~ in NEER_STATE_DIR", () => {
    const env = { HOME: "/Users/test", NEER_STATE_DIR: "~/neer-state" };
    expect(resolveGatewayStateDir(env)).toBe(path.resolve("/Users/test/neer-state"));
  });

  it("preserves Windows absolute paths without HOME", () => {
    const env = { NEER_STATE_DIR: "C:\\State\\neer" };
    expect(resolveGatewayStateDir(env)).toBe("C:\\State\\neer");
  });
});
