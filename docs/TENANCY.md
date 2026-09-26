---
title: "NEER SaaS tenant isolation"
description: "Account ownership boundaries in the Phase 2 SaaS API and the current limits of tenant support."
---

# NEER SaaS tenant isolation

The SaaS account principal comes from a verified account-session cookie. Protected request handlers pass that server-derived user ID to repository methods; clients cannot choose an owner ID. Gateway device identity and agent IDs do not serve as SaaS ownership claims.

## PostgreSQL ownership

`apps/saas-api/migrations/0001_initial.sql` creates:

| Table                        | Account-owned data                                |
| ---------------------------- | ------------------------------------------------- |
| `saas_users`                 | Account identity and password hash                |
| `saas_account_sessions`      | Hashed account session token, expiry, revocation  |
| `saas_provider_connections`  | Provider status and encrypted BYOK credential     |
| `saas_model_preferences`     | Selected model and same-owner provider connection |
| `saas_agent_sessions`        | Conversation metadata and soft-delete state       |
| `saas_audit_events`          | Safe account/security event metadata              |
| `saas_password_reset_tokens` | Hashed, one-time recovery tokens                  |
| `saas_rate_limit_buckets`    | Hashed limit key and fixed-window counter         |

Provider connections, model preferences, agent sessions, and audit events use PostgreSQL row-level security with forced policies based on the transaction-local `app.user_id` setting. Repository methods also filter by `user_id`, and a composite foreign key prevents a model preference from pointing at another account's provider connection. Each tenant repository operation runs in a transaction and sets the owner context on that same database connection.

Run the API with a dedicated database role that is neither a superuser nor has `BYPASSRLS`; startup refuses those roles. Use the separate migrator URL for schema changes and keep it out of the runtime service. RLS complements the explicit service ownership checks and should not be treated as a substitute for them.

## Runtime files and Core execution

Agent workspaces, agent state, and transcript files are placed below `SAAS_DATA_DIR/users/<server-user-uuid>/`. Session IDs and account IDs are validated UUIDs generated or resolved by the server; request values are never used as file paths. Deleting a conversation removes its transcript file and soft-deletes its owned database metadata.

The SaaS runner calls the existing embedded agent path and passes the selected provider key through the request-scoped credential hook. Tools are disabled in SaaS chat for this phase because existing tools, memory, goals, and automations do not all enforce authenticated tenant ownership. The API does not expose the Gateway's administrative RPC surface.

## Scope and remaining limits

The current ownership model covers account identity, provider connections, one model preference, conversation metadata, reset tokens, rate limits, and audit records. It does not yet provide tenant-owned memory, goals, skills, automations, uploads, billing, usage metering, account export, or account deletion. There is no frontend, email verification, or configured password-reset mail delivery. Do not expose these Core features to SaaS requests until each storage and tool path has an ownership model and cross-account tests.

Tests cover cross-account provider, preference, and conversation access; expired/revoked sessions; credential secrecy; and mismatched provider context. The migration tests inspect RLS declarations, but no live PostgreSQL integration or deployed multi-tenant test has been run for this implementation.
