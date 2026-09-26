---
title: "NEER SaaS implementation plan"
description: "Phase status and next steps for adding accounts, BYOK, and tenant-aware SaaS capabilities to NEER."
---

# NEER SaaS implementation plan

> **Status:** Phase 1 runtime support and the Phase 2 SaaS backend foundation are implemented locally. This checkout has not been deployed or verified against a live PostgreSQL service. Work stops here; the frontend, billing, and later product phases remain unstarted.

## Phase 1 — Request-scoped model runtime

**Status: Implemented.** The embedded NEER agent accepts a request-scoped provider key, injects it into that run's Pi auth storage, carries it into compaction, and rejects provider mismatch without falling back to another credential. Local environment/auth-profile behavior remains available to the self-hosted runtime.

## Phase 2 — Accounts, tenant isolation, and BYOK API

**Status: Implemented foundation; not production-ready.** The separate `apps/saas-api/` workspace package provides:

- Account registration, login, logout, hashed opaque sessions, expiry and revocation, and a one-time password-reset repository flow.
- PostgreSQL migrations for accounts, sessions, encrypted provider credentials, model preferences, agent-session metadata, password-reset tokens, rate-limit buckets, and safe audit events.
- Owner-scoped repository operations and forced row-level security policies for provider connections, preferences, agent sessions, and audit records.
- AES-256-GCM provider credential encryption using a versioned keyring supplied outside the database; the supported providers are OpenAI, Anthropic, Google Gemini, and OpenRouter.
- Provider connect/list/get/delete/validate routes, account-owned model preference routes, agent-session metadata routes, and a chat endpoint using the Phase 1 runtime hook.
- Exact-origin checks, safe API errors, fixed-window persisted rate limits, safe audit metadata, and per-account workspace/session paths.
- Agent tools disabled for SaaS chat until their storage and authorization paths enforce tenant ownership.

Password-reset routes return `503` from the shipped main entry point because no mail adapter is configured. Email verification is absent. Key rotation is an operator-managed re-encryption procedure, not an automated job. The service has not been exercised against a live PostgreSQL server, and local tests do not establish deployed RLS behavior.

**Verification:** `apps/saas-api` focused suite passes 21 tests across seven files. Root `pnpm build` and the SaaS package TypeScript build pass. Scoped Oxlint, formatting checks for the Core runtime export and SaaS docs, Markdown lint, and the documentation link audit pass. The repository-wide `pnpm tsgo` check currently fails on unrelated local changes in extensions, Gateway, macOS, tests, and UI. No production deployment or live database test has been run.

## Phase 3 — Browser application

**Not started.** Build a public web app against the API contract, with registration/login, provider settings, model selection, chat, and account settings. The existing Lit Control UI and local `ui-next/` prototype have different trust and Gateway assumptions; evaluate them before connecting them. Keep user keys out of browser storage and never send Gateway credentials to the browser.

## Phase 4 — Production operations and security review

**Not started.** Add and validate email delivery and verification policy, live PostgreSQL integration tests, service health/readiness, backup and restore, durable tenant file storage, automated key rotation, retention and account deletion, abuse controls, staging deployment, and an independent security review before a public launch.

## Phase 5 — Billing and entitlements

**Not started.** Select a billing provider only after the seller's market and legal requirements are clear. Add verified idempotent webhooks and a central entitlement service after account operations are production-ready. BYOK inference remains billed by the customer's provider.

## Phase 6 — Tenant-aware product features

**Not started.** Extend ownership guarantees to memory, goals, skills, automations, uploads, usage metadata, and tools before exposing those features to SaaS accounts. The existing process-wide cognitive goal and experience managers and local memory plugins require explicit tenant context and cross-account tests.

## Phase 2 implementation map

- API and repositories: `apps/saas-api/src/`
- PostgreSQL schema: `apps/saas-api/migrations/`
- Existing Core runtime adapter: `apps/saas-api/src/runtime.ts` and `src/saas-runtime.ts`
- Account API contract: [API authentication](/API_AUTH)
- Ownership rules and current limits: [tenant isolation](/TENANCY)
- Encryption and provider support: [BYOK](/BYOK)
- Deployment caveats: [SaaS deployment](/DEPLOYMENT)

The worktree contains other local user changes. Phase 2 changes were kept to the new SaaS package, its existing Core runtime integration, and the SaaS docs/navigation; unrelated work was preserved.
