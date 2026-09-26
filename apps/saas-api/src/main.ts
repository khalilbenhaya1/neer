import { createServer } from "node:http";
import { Pool } from "pg";
import { createSaasApi } from "./api.js";
import { readSaasConfig } from "./config.js";
import { PostgresSaasRepository } from "./postgres-repository.js";
import { createCoreAgentRunner, deleteCoreAgentSessionFiles, isSupportedSaasModel } from "./runtime.js";

async function main(): Promise<void> {
  const config = readSaasConfig();
  const pool = new Pool({
    connectionString: config.databaseUrl,
    max: 20,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    application_name: "neer-saas-api",
  });
  pool.on("error", () => {
    process.stderr.write("SaaS database connection failed.\n");
  });
  try {
    await pool.query("SELECT 1");
    const role = await pool.query<{ rolsuper: boolean; rolbypassrls: boolean }>(
      `SELECT rolsuper, rolbypassrls FROM pg_roles WHERE rolname = current_user`,
    );
    if (!role.rows[0] || role.rows[0].rolsuper || role.rows[0].rolbypassrls) {
      throw new Error("The SaaS runtime database role must not bypass row-level security.");
    }
    await pool.query("SELECT version FROM saas_schema_migrations LIMIT 0");

    const repository = new PostgresSaasRepository(pool);
    const app = createSaasApi({
      config,
      repository,
      runAgent: createCoreAgentRunner(config.dataDir),
      validateModel: (provider, modelId, userId) =>
        isSupportedSaasModel(provider, modelId, config.dataDir, userId),
      deleteAgentSessionFiles: (userId, sessionId) =>
        deleteCoreAgentSessionFiles(config.dataDir, userId, sessionId),
      logger: (event, fields) => {
        process.stderr.write(`${event} ${JSON.stringify(fields)}\n`);
      },
    });

    const server = createServer(app);
    server.headersTimeout = 15_000;
    server.requestTimeout = 130_000;
    server.keepAliveTimeout = 5_000;
    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(config.port, config.host, () => {
        server.off("error", reject);
        resolve();
      });
    });

    process.stdout.write(`NEER SaaS API listening on ${config.host}:${config.port}\n`);
    let shuttingDown = false;
    const shutdown = () => {
      if (shuttingDown) {
        return;
      }
      shuttingDown = true;
      server.close(() => {
        void pool.end().finally(() => process.exit(0));
      });
    };
    process.once("SIGINT", shutdown);
    process.once("SIGTERM", shutdown);
  } catch (error) {
    await pool.end();
    throw error;
  }
}

void main().catch(() => {
  process.stderr.write("NEER SaaS API failed to start. Check server configuration and database connectivity.\n");
  process.exitCode = 1;
});
