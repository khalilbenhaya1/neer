import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export const POSIX_NEER_TMP_DIR = "/tmp/neer";

type ResolvePreferredNeerTmpDirOptions = {
  accessSync?: (path: string, mode?: number) => void;
  statSync?: (path: string) => { isDirectory(): boolean };
  tmpdir?: () => string;
};

type MaybeNodeError = { code?: string };

function isNodeErrorWithCode(err: unknown, code: string): err is MaybeNodeError {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as MaybeNodeError).code === code
  );
}

export function resolvePreferredNeerTmpDir(
  options: ResolvePreferredNeerTmpDirOptions = {},
): string {
  const accessSync = options.accessSync ?? fs.accessSync;
  const statSync = options.statSync ?? fs.statSync;
  const tmpdir = options.tmpdir ?? os.tmpdir;

  try {
    const preferred = statSync(POSIX_NEER_TMP_DIR);
    if (!preferred.isDirectory()) {
      return path.join(tmpdir(), "neer");
    }
    accessSync(POSIX_NEER_TMP_DIR, fs.constants.W_OK | fs.constants.X_OK);
    return POSIX_NEER_TMP_DIR;
  } catch (err) {
    if (!isNodeErrorWithCode(err, "ENOENT")) {
      return path.join(tmpdir(), "neer");
    }
  }

  try {
    accessSync("/tmp", fs.constants.W_OK | fs.constants.X_OK);
    return POSIX_NEER_TMP_DIR;
  } catch {
    return path.join(tmpdir(), "neer");
  }
}
