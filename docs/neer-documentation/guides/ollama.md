---
title: "Use Ollama as a model provider"
description: "Configure NEER to discover and use models served by an Ollama instance."
---

# Use Ollama as a model provider

NEER can configure an Ollama provider for a local or remote Ollama server. The provider is added only when Ollama is explicitly configured through OLLAMA_API_KEY or an authentication profile. The default API base is [the local Ollama endpoint](http://127.0.0.1:11434); an explicit provider base URL can point to another instance.

## Prerequisites

- An Ollama server that is running and has at least one model available.
- NEER configured to recognize Ollama through its supported environment or profile configuration.
- A model ID supported by that server.

Follow Ollama's own installation instructions to install and run its server. This guide does not add a paid service or download a model on your behalf.

## Configure and select a model

Set up the provider using your environment's secret/configuration management. NEER checks for `OLLAMA_API_KEY` or an Ollama auth profile before adding the provider. For a non-default server, configure the Ollama provider's `baseUrl` in the model-provider configuration accepted by your NEER version. The default provider endpoint is `http://127.0.0.1:11434`; the adapter accepts an OpenAI-compatible `/v1` suffix and normalizes it.

Then inspect models and choose an available model:

```sh
pnpm neer models list --provider ollama
pnpm neer models status
pnpm neer models set ollama/<model-id>
```

Replace the placeholder with the model identifier reported by your Ollama server. If it is not listed, check that Ollama is reachable, `OLLAMA_API_KEY` or an auth profile is present, and the configured server address is correct before changing agent configuration.

## Verify

Send a small prompt to an agent using the selected model. The Gateway health command confirms Gateway connectivity; it does not prove the Ollama server can complete inference. Check both the Ollama process and NEER's provider status when requests fail.

## Related

[Models](/neer-documentation/concepts/models) · [Configuration](/neer-documentation/getting-started/configuration) · [Agents](/neer-documentation/concepts/agents)
