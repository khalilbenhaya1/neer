---
title: "Bring your own AI provider key"
description: "How the NEER SaaS API stores and uses account-owned provider credentials."
---

# Bring your own AI provider key

> **SaaS status:** The Phase 2 API supports account-owned credentials for OpenAI, Anthropic, Google Gemini, and OpenRouter. There is no browser dashboard yet.

## Local and SaaS credentials

The self-hosted NEER runtime can use provider credentials from environment configuration and local agent auth profiles. Those local flows remain separate from SaaS account credentials.

The SaaS API accepts a provider key over an authenticated HTTPS request, encrypts it before database storage, and returns only provider metadata and connection status. The selected key is decrypted server-side for an agent request and passed into the existing request-scoped Pi auth-storage override. It is not written to `auth-profiles.json` or a shared environment variable.

The hosted API currently supports OpenAI, Anthropic, Google Gemini, and OpenRouter. Ollama and arbitrary provider URLs are excluded: a cloud service cannot reach a customer's loopback address, and accepting arbitrary endpoints would create an SSRF boundary.

## Encryption and key operations

- Credentials use AES-256-GCM with a fresh 12-byte nonce and an authentication tag. The authenticated context binds ciphertext to the account, connection, and provider.
- The 32-byte encryption keys are loaded from `SAAS_CREDENTIAL_ENCRYPTION_KEYS`; the active key version is selected with `SAAS_CREDENTIAL_ACTIVE_KEY_VERSION`. Keep the key material in the deployment secret manager, separate from PostgreSQL.
- Each database record stores ciphertext, nonce, authentication tag, and key version. Old keys must remain configured while records still use them. Rotation currently requires an operator-managed re-encryption procedure; there is no automated rotation job or KMS envelope-key integration.
- Decryption fails closed if the key version or authenticated context is unavailable or invalid. Provider credentials never appear in API responses, logs, or audit metadata.
- Deleting a provider connection removes its encrypted credential and any preference that refers to it.

The service does not validate a credential automatically when it is added. An authenticated `POST /api/providers/:id/validate` request checks it against a fixed provider endpoint. Provider error response bodies and authorization headers are not exposed to clients or logs.

## Model preferences and agent requests

Model preference is stored separately from provider credentials and must reference a connection owned by the same account. The API resolves that connection and model on the server, then executes through the existing NEER embedded agent runner. SaaS agent tools are disabled in this phase because the existing tools do not yet all have tenant-aware authorization.

## Billing

BYOK subscriptions are intended to pay for NEER platform features. The customer pays the AI provider directly for inference. Billing and paid-plan entitlements are not implemented in this phase.
