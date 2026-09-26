---
title: "NEER SaaS security"
description: "Security boundaries and implementation status for the Phase 2 NEER SaaS API."
---

# NEER SaaS security

> **Status:** The Phase 2 API implements account sessions, owner-checked repositories, PostgreSQL row-level policies, encrypted provider credentials, origin checks, rate limits, and safe audit/error paths. It is an implementation foundation, not a production security certification or deployed service.

## Existing NEER controls

The self-hosted Gateway has shared token/password authentication, optional Tailscale identity checks, device pairing, operator roles/scopes, protected HTTP/WebSocket routes, and Core tool policies. Those controls protect a Gateway installation; they do not establish SaaS account identity or tenant ownership. SaaS account cookies are separate and do not grant Gateway access.

## SaaS controls in this phase

- Account passwords use salted scrypt hashes. Session and password-reset tokens are random and only their hashes are stored.
- Account sessions have explicit expiry and revocation. Cookies are `HttpOnly`, `SameSite=Lax`, and `Secure` in production. Mutating requests require the configured exact `Origin`; wildcard CORS is not enabled.
- Provider keys are encrypted with AES-256-GCM before PostgreSQL persistence. The configured keyring is external to the database, key versions are stored with ciphertext, and authenticated data binds the account, connection, and provider.
- Protected repository operations derive ownership from the verified session and include account filters. Key tables also use forced PostgreSQL row-level security.
- The runtime database role is checked at startup for superuser and `BYPASSRLS` privileges. Schema migration uses a separate database URL.
- Provider validation calls fixed HTTPS provider endpoints and does not follow redirects. Error bodies, prompts, credentials, and authorization headers are not logged.
- API errors are mapped to safe messages. Audit events retain event types and safe metadata, not chat content or provider keys. Central rate limits use hashed actor keys.
- SaaS chat passes the selected credential to the existing request-scoped provider hook and disables agent tools while those tools lack complete tenant-aware authorization.

## Known gaps before public deployment

- The production entry point does not configure an email delivery adapter. Password reset therefore returns `503`; email verification is also absent.
- There is no live PostgreSQL integration run, deployment, penetration test, security review, backup/restore exercise, or operational key-rotation job in this phase. Rotation currently requires a controlled manual re-encryption process and retaining old key versions until migration is complete.
- SaaS tools, memory, goals, skills, automations, account deletion/export, billing, and entitlements are not tenant-enabled. Do not expose them through the SaaS API.
- Agent transcripts and workspaces use per-account server-owned directories, but hosted storage durability, encryption at rest, retention, and deletion policy are not yet established.
- Accounts are active immediately after registration; there is no abuse review or email verification gate.

## Threat-driven verification

Focused tests cover cross-account provider, model preference, and agent-session access; unauthenticated and expired/revoked sessions; provider/account mismatch; reset-token one-time use; cookie/origin behavior; and secret-free responses and audit metadata. These tests are necessary but do not replace live database, deployment, load, or independent security review. See [API authentication](/API_AUTH), [tenant isolation](/TENANCY), and [SaaS deployment](/DEPLOYMENT).
