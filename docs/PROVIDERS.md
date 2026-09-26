---
title: "NEER model providers"
description: "Existing NEER model/provider runtime and how it will support SaaS BYOK."
---

# NEER model providers

## Existing runtime

NEER already routes model turns through the `@mariozechner/pi-ai` and `@mariozechner/pi-coding-agent` provider/model interfaces. The provider model registry is constructed in `src/agents/pi-model-discovery.ts`; model references, aliases, and configured allowlists are handled in `src/agents/model-selection.ts`; the embedded runner invokes the common stream API. Provider-specific defaults and model metadata are configured in `src/agents/models-config*.ts`.

The local model selection is driven by NEER configuration and agent defaults. Provider auth can come from environment configuration or local auth profiles. This is not yet an account-owned SaaS provider router.

The embedded agent also accepts an optional request-scoped credential for one provider. It is applied to that run's in-memory Pi `AuthStorage` and carried into compaction. If an explicit key is present, a different provider cannot fall through to local/server credentials. No authenticated SaaS request currently supplies this parameter.

## Existing provider options

The repository includes integrations for OpenAI, Anthropic, Google Gemini, OpenRouter, and Ollama, along with additional provider integrations documented under [model providers](/concepts/model-providers). The existing runtime supports provider model metadata and streaming through its shared model API. Do not add another provider framework solely to give SaaS accounts a key field.

Ollama is configured as a local service, with a default base URL on the Gateway host. A public cloud instance cannot interpret that URL as the user's computer. Remote local-model support needs a separately authenticated connector or a network path with explicit authorization and SSRF defenses.

## Planned SaaS model selection

The public account preference should contain a provider ID and model ID. The server must validate that combination against provider capabilities and the user's account configuration, then ask a request-scoped adapter to run the existing NEER agent path. The agent should consume the shared model interface and should not own SaaS billing, account lookup, credential decryption, or provider-specific payment logic.

The router contract should leave room for three backend modes:

- **BYOK:** use the authenticated account's own provider credential; the provider bills the customer.
- **Local connection:** route only through an authenticated local NEER connector or a self-hosted Gateway that can reach the model.
- **NEER-managed:** a future mode with server-owned credentials, cost controls, usage accounting, and explicit limits.

No SaaS router or user-owned model preference is implemented yet. Provider support in the local runtime does not by itself make a provider available through the public SaaS API.
