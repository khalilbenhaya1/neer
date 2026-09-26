type StateDirEnvSnapshot = {
  neerStateDir: string | undefined;
  neerStateDir: string | undefined;
};

export function snapshotStateDirEnv(): StateDirEnvSnapshot {
  return {
    neerStateDir: process.env.NEER_STATE_DIR,
    neerStateDir: process.env.NEER_STATE_DIR,
  };
}

export function restoreStateDirEnv(snapshot: StateDirEnvSnapshot): void {
  if (snapshot.neerStateDir === undefined) {
    delete process.env.NEER_STATE_DIR;
  } else {
    process.env.NEER_STATE_DIR = snapshot.neerStateDir;
  }
  if (snapshot.neerStateDir === undefined) {
    delete process.env.NEER_STATE_DIR;
  } else {
    process.env.NEER_STATE_DIR = snapshot.neerStateDir;
  }
}

export function setStateDirEnv(stateDir: string): void {
  process.env.NEER_STATE_DIR = stateDir;
  delete process.env.NEER_STATE_DIR;
}
