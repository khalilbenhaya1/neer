---
title: "NEER SaaS architecture"
description: "Existing NEER runtime boundaries and the Phase 2 SaaS API architecture."
---

# NEER SaaS architecture

> **Status:** Phase 2 adds a separate account/API service, PostgreSQL tenant data, encrypted BYOK storage, and an adapter to the existing embedded model runtime. The API is a local implementation foundation; it has not been deployed or connected to a live database. Frontend, billing, and broad tenant-aware Core features are not implemented.

## Existing NEER architecture

NEER is a self-hostable Node.js and TypeScript application. Its Gateway hosts local HTTP/WebSocket routes, coordinates agents and channels, and serves the Lit Control UI. Agent execution uses the existing `@mariozechner/pi-ai` and `@mariozechner/pi-coding-agent` APIs. Provider configuration, auth profiles, sessions, workspaces, and memory are primarily scoped to one local installation and its agent directories.

The Gateway's shared token/password authentication, Tailscale checks, device pairing, and operator scopes remain a distinct installation security boundary. They are not SaaS account authentication. The SQLite memory index is specialized local memory storage, not a general account database.

The shipped `ui/` remains the self-hosted Control UI. This local worktree also contains a separate `ui-next/` React prototype with no SaaS auth flow or API integration. No frontend was added in Phase 2.

The inspected worktree includes local, untracked process-wide cognitive goal and experience managers in `src/cognition/`; they persist project-level JSON and are not tenant-owned. Local memory plugins and Core tools also do not automatically provide account ownership checks.

## Phase 2 service boundary

```text
Browser or API client
        |
        v
Separate apps/saas-api service
  - account cookie authentication
  - origin checks, request limits, safe errors
  - authenticated account/provider/model/session operations
        |
        +------> PostgreSQL SaaS repository
        |          accounts, sessions, encrypted BYOK,
        |          preferences, chat metadata, audit, limits
        |
        v
Per-account Core runtime adapter
  - server-generated user/session IDs and data paths
  - existing embedded NEER agent runner
  - request-scoped provider key
  - tools disabled in this phase
```

The SaaS API does not forward browser requests to Gateway RPC and does not share Gateway authentication with account sessions. It currently returns completed chat text; it does not provide a streaming response or browser application.

## Account and tenant data

PostgreSQL is the account and SaaS metadata store. The local SQLite memory index remains specialized to NEER memory and is not reused for account identity. Schema migrations add account/password records, hashed account sessions, encrypted provider connections, model preferences, agent-session metadata, hashed one-time reset tokens, persistent rate-limit buckets, and safe audit records.

Authenticated identity is derived from the session lookup. Owner IDs are passed by server code to repository calls, and repository queries include ownership filters. Provider connections, model preferences, agent sessions, and audit events additionally use forced row-level security policies with transaction-local `app.user_id` context. Composite constraints bind model preferences to a connection owned by the same account. Runtime startup rejects a PostgreSQL role that is a superuser or has `BYPASSRLS`.

Agent workspaces, agent state, and transcripts are placed below a server-owned per-user directory. This does not yet provide tenant-aware memory, goals, skills, automations, account export/deletion, or durable hosted file storage. SaaS chat disables Core tools until their ownership and authorization paths are independently scoped.

## BYOK and model execution

Provider credentials are encrypted before persistence with AES-256-GCM, unique nonces, authentication tags, versioned 32-byte keys from external service configuration, and authenticated context binding account, connection, and provider. The database contains ciphertext only. There is no KMS envelope encryption or automated rotation workflow yet; operators must preserve old key versions until records are manually re-encrypted.

Supported hosted providers are OpenAI, Anthropic, Google Gemini, and OpenRouter. Validation calls fixed provider endpoints over HTTPS and does not accept user-selected URLs. Ollama is omitted because a hosted service cannot reach a customer's loopback address.

The server selects an account-owned provider connection and model preference, decrypts the credential, and passes it to NEER's existing request-scoped Pi auth-storage override. It does not change `process.env` or persist the key in a shared auth-profile file. The local self-hosted model/provider paths remain separate.

## Authentication and API protections

Account passwords use salted scrypt hashes. Opaque random session and recovery tokens are stored as SHA-256 hashes; login sessions include expiry and revocation. Cookies are `HttpOnly` and `SameSite=Lax`, and `Secure` in production. State-changing requests require an exact configured `Origin`. Rate limits and safe audit events are persisted centrally; logs and errors omit credentials, prompt content, and provider response bodies.

The shipped API entry point does not configure a password-reset email adapter, so recovery routes currently return `503`. Registration activates accounts immediately; email verification is not present. See [API authentication](/API_AUTH) for endpoint details and [security](/SECURITY) for limits.

## Deployment boundary and next work

Existing Docker, Fly.io, Render, and Compose configurations run the self-hosted Gateway; they are not SaaS deployment configurations. `apps/saas-api/` has local build and start scripts, a separate migrator, and `.env.example`, but there is no production service manifest, live PostgreSQL run, health endpoint, backup/restore process, or staging deployment.

Before public use, configure mail and verification policy; run live database integration tests; define durable per-tenant file retention, export, and deletion; validate backups and restore; implement key rotation; and complete staging and security review. Later work may add a browser app, billing/entitlements, and Core tools only after each operation has server-verified ownership. See the [implementation plan](/SAAS_IMPLEMENTATION_PLAN), [tenant isolation](/TENANCY), and [deployment guide](/DEPLOYMENT).
