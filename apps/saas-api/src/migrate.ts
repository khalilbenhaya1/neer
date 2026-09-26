import { Pool } from "pg";
import { runSaasMigrations } from "./migrations.js";

const connectionString = process.env.SAAS_MIGRATION_DATABASE_URL?.trim();
if (!connectionString) {
  throw new Error("Set SAAS_MIGRATION_DATABASE_URL to run SaaS schema migrations.");
}

const pool = new Pool({ connectionString, max: 2, connectionTimeoutMillis: 5_000 });
try {
  const applied = await runSaasMigrations(pool);
  process.stdout.write(applied.length ? `Applied ${applied.length} SaaS migration(s).\n` : "SaaS schema is up to date.\n");
} catch {
  process.stderr.write("SaaS migration failed. Check database connectivity and schema permissions.\n");
  process.exitCode = 1;
} finally {
  await pool.end();
}
