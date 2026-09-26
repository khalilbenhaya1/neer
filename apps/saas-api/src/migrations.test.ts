import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { Pool, PoolClient } from "pg";
import { describe, expect, it } from "vitest";
import { runSaasMigrations } from "./migrations.js";

class FakeMigrationPool {
  applied = new Map<number, string>();
  statements: string[] = [];

  async connect(): Promise<PoolClient> {
    return {
      query: async (queryText: string, values?: unknown[]) => {
        this.statements.push(queryText);
        if (queryText.includes("SELECT version FROM saas_schema_migrations")) {
          const version = Number(values?.[0]);
          return {
            rows: this.applied.has(version) ? [{ version }] : [],
            rowCount: this.applied.has(version) ? 1 : 0,
          };
        }
        if (queryText.includes("INSERT INTO saas_schema_migrations")) {
          this.applied.set(Number(values?.[0]), String(values?.[1]));
        }
        return { rows: [], rowCount: 0 };
      },
      release() {},
    } as unknown as PoolClient;
  }

  query() {
    throw new Error("Migrations should use one locked client for every operation.");
  }
}

describe("SaaS database migrations", () => {
  it("runs each migration once under a database advisory lock and transaction", async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), "neer-saas-migrations-"));
    try {
      await writeFile(path.join(directory, "0001_initial.sql"), "CREATE TABLE sample (id integer);", "utf8");
      const pool = new FakeMigrationPool();
      const first = await runSaasMigrations(pool as unknown as Pool, directory);
      const second = await runSaasMigrations(pool as unknown as Pool, directory);
      expect(first).toEqual(["0001_initial.sql"]);
      expect(second).toEqual([]);
      expect(pool.statements).toContain("SELECT pg_advisory_lock($1)");
      expect(pool.statements).toContain("BEGIN");
      expect(pool.statements).toContain("COMMIT");
      expect(pool.statements).toContain("SELECT pg_advisory_unlock($1)");
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("enables forced owner policies for all tenant-owned SaaS tables", async () => {
    const sql = await readFile(new URL("../migrations/0001_initial.sql", import.meta.url), "utf8");
    for (const table of [
      "saas_provider_connections",
      "saas_model_preferences",
      "saas_agent_sessions",
      "saas_audit_events",
    ]) {
      expect(sql).toContain(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`);
      expect(sql).toContain(`ALTER TABLE ${table} FORCE ROW LEVEL SECURITY`);
      expect(sql).toContain(`CREATE POLICY ${table}_owner_policy`);
    }
    expect(sql).toContain("UNIQUE (id, user_id)");
    expect(sql).toContain("FOREIGN KEY (provider_connection_id, user_id)");
  });
});
