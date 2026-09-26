---
title: "NEER SaaS API authentication"
description: "Account sessions, authentication routes, cookies, and protected SaaS API endpoints."
---

# NEER SaaS API authentication

The API in `apps/saas-api/` has account authentication separate from the self-hosted Gateway's shared token, password, and device-pairing authentication. A successful account login does not grant Gateway RPC access.

## Account sessions

- `POST /api/auth/register` accepts an email and a password of at least 12 characters. It creates an active account and starts a session.
- `POST /api/auth/login` verifies the password and starts a session. Unknown email and incorrect password return the same error.
- `GET /api/auth/session` returns the authenticated account and session expiration.
- `POST /api/auth/logout` revokes the current session and clears the cookie.
- Sessions use random opaque tokens. The browser receives the token only as an `HttpOnly`, `SameSite=Lax` cookie; the database stores its SHA-256 hash, expiry, and revocation state.
- Cookies are `Secure` outside development and test. Production configuration requires an HTTPS public origin. Session lifetime defaults to seven days and cannot exceed 30 days.

State-changing API requests must include an `Origin` matching `SAAS_PUBLIC_ORIGIN`. Requests are JSON limited to 32 KiB. Responses use `Cache-Control: no-store` and generic safe errors. The API does not enable wildcard CORS.

## Password recovery status

The API contains one-time, hashed reset tokens with a 20-minute expiry. Consuming a token changes the password and revokes all account sessions. However, the production entry point does not configure a mail delivery adapter, so both password-reset routes return `503 PASSWORD_RESET_UNAVAILABLE`. Recovery cannot be used until a mailer is injected and configured. Email verification is not implemented; new accounts are active immediately.

## Protected routes

All routes below require the account session cookie:

| Method           | Route                         | Purpose                                                               |
| ---------------- | ----------------------------- | --------------------------------------------------------------------- |
| `GET`            | `/api/providers`              | List safe provider connection metadata                                |
| `POST`           | `/api/providers`              | Connect a supported provider key                                      |
| `GET`            | `/api/providers/:id`          | Read an owned connection's safe metadata                              |
| `DELETE`         | `/api/providers/:id`          | Remove an owned provider connection                                   |
| `POST`           | `/api/providers/:id/validate` | Check an owned credential at a fixed provider endpoint                |
| `GET` / `PUT`    | `/api/model-preference`       | Read or set the account's selected provider connection and model      |
| `GET` / `POST`   | `/api/agent-sessions`         | List or create owned conversation metadata                            |
| `GET` / `DELETE` | `/api/agent-sessions/:id`     | Read or delete an owned conversation                                  |
| `POST`           | `/api/chat`                   | Run a prompt using the authenticated account's saved model preference |

Provider keys, password hashes, session token hashes, and reset tokens are never returned. Login sessions are independent of agent conversation sessions.

## Rate limits and audit

Rate limits are centralized in the API and persisted in PostgreSQL. The current limits cover registration, login, password reset, provider connect/validate, model preference changes, and agent runs. Security audit events record account and provider actions without prompts or credentials. See [tenant isolation](/TENANCY) for database ownership controls and [deployment](/DEPLOYMENT) for required database roles and configuration.
