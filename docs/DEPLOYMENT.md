---
title: "NEER SaaS deployment"
description: "Configuration and deployment status for the Phase 2 NEER SaaS API."
---

# NEER SaaS deployment

> **Status:** `apps/saas-api/` is a separate API workspace package with PostgreSQL migrations and a runnable service entry point. No SaaS service has been deployed or live-tested; existing Docker, Fly.io, Render, and Compose files still describe self-hosted Gateway deployments.

## Local service workflow

The SaaS package is part of the existing pnpm workspace. Build the root package first so the request-scoped runtime entry point exists, then build and start the API:

```sh
pnpm build
pnpm --filter @neer/saas-api build
pnpm --filter @neer/saas-api start
```

Apply database migrations separately with the configured migrator role:

```sh
pnpm --filter @neer/saas-api migrate
```

The API listens on `127.0.0.1:8788` by default. Configure `SAAS_HOST` only for a private service network or behind a TLS-terminating reverse proxy. Production must set `SAAS_PUBLIC_ORIGIN` to the exact HTTPS origin used by the browser.

## Required settings

See the placeholder values in `apps/saas-api/.env.example`. Production configuration requires:

- `SAAS_DATABASE_URL`: PostgreSQL URL for the runtime role. This role must not be superuser or have `BYPASSRLS`.
- `SAAS_MIGRATION_DATABASE_URL`: separate, more privileged URL used only by the migration command.
- `SAAS_CREDENTIAL_ENCRYPTION_KEYS`: JSON object mapping key versions to base64-encoded 32-byte keys.
- `SAAS_CREDENTIAL_ACTIVE_KEY_VERSION`: version used for new credentials.
- `SAAS_PUBLIC_ORIGIN`: one HTTPS origin, with no path or query.
- `SAAS_DATA_DIR`: durable private storage root for account agent files.
- `SAAS_HOST`, `SAAS_PORT`, `SAAS_SESSION_TTL_SECONDS`, and `SAAS_TRUST_PROXY` as required by the deployment topology.

Supply key material from a deployment secret manager; do not commit it or reuse a database credential. Keep previous encryption-key versions available until existing records have been re-encrypted. Do not trust forwarded client IP headers unless `SAAS_TRUST_PROXY` matches the actual proxy topology.

## Gaps before a public service

There is no production deployment manifest, health/readiness endpoint, mail adapter for password recovery, email verification, distributed file-storage adapter, backup/restore procedure, or automated encryption-key rotation. The service has not been connected to a live PostgreSQL instance or staged behind a public TLS proxy. These are operational launch requirements, not claims satisfied by the local build.

Keep the SaaS API private from the self-hosted Gateway and do not expose Gateway admin/RPC credentials to browsers. The API currently disables agent tools, and SaaS sessions, workspaces, and transcript files are stored under the configured per-account data directory.

## Local model connectivity

The hosted API supports only fixed cloud-provider validation endpoints for OpenAI, Anthropic, Google Gemini, and OpenRouter. Ollama is not included because the server's loopback address does not reach a user's device. Self-hosted NEER can continue using Ollama reachable from its local Gateway host.
