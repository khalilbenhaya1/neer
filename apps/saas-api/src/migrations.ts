import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Pool } from "pg";

const DEFAULT_MIGRATIONS_DIR = fileURLToPath(new URL("../migrations", import.meta.url));

export async function runSaasMigrations(
  pool: Pool,
  migrationsDir = DEFAULT_MIGRATIONS_DIR,
): Promise<string[]> {
  const client = await pool.connect();
  try {
    await client.query("SELECT pg_advisory_lock($1)", [1_395_910_017]);
    await client.query(
      `CREATE TABLE IF NOT EXISTS saas_schema_migrations (
         version integer PRIMARY KEY,
         name text NOT NULL,
         applied_at timestamptz NOT NULL DEFAULT now()
       )`,
    );
    const files = (await readdir(migrationsDir))
      .filter((name) => /^\d+_[a-z0-9_]+\.sql$/.test(name))
      .toSorted((a, b) => Number(a.split("_")[0]) - Number(b.split("_")[0]));
    const applied: string[] = [];
    for (const file of files) {
      const version = Number(file.split("_")[0]);
      const existing = await client.query(
        "SELECT version FROM saas_schema_migrations WHERE version = $1",
        [version],
      );
      if (existing.rowCount) {
        continue;
      }
      const sql = await readFile(path.join(migrationsDir, file), "utf8");
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query(
          "INSERT INTO saas_schema_migrations (version, name) VALUES ($1, $2)",
          [version, file],
        );
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK").catch(() => undefined);
        throw error;
      }
      applied.push(file);
    }
    return applied;
  } finally {
    await client.query("SELECT pg_advisory_unlock($1)", [1_395_910_017]).catch(() => undefined);
    client.release();
  }
}
