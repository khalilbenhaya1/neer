---
title: "Models and providers"
description: "Inspect configured models and connect NEER agents to local or remote model providers."
---

# Models and providers

NEER separates the model ID used by an agent from the provider integration that serves it. The available catalog depends on installed code, provider configuration, credentials, and local services.

## Inspect available models

```sh
pnpm neer models list
pnpm neer models status
```

Models list supports filters including local models and providers. Select a model that appears in your catalog:

```sh
pnpm neer models set <model-id>
```

Use the exact ID shown by models list. Per-agent model settings can override defaults when configured. The CLI also has models set-image for image-model selection; check pnpm neer models --help for supported options.

## Provider setup

A provider may require credentials, a local server, or an explicit provider profile. Keep secrets out of committed files and shell history where possible; use provider-supported environment variables or the configuration mechanism for your deployment. A local Gateway does not guarantee inference stays local: that depends on the selected provider and model. Provider catalogs and media/tool support vary; the model being listed does not guarantee every request path supports every capability.

For a local Ollama server, follow [Ollama](/neer-documentation/guides/ollama). For supported image, audio, or video paths and provider requirements, see [Multimodal](/neer-documentation/guides/multimodal).

## Troubleshooting

If a model does not appear, check provider setup and then run pnpm neer models status. If the provider is reachable but requests fail, verify the selected model ID and provider credentials/configuration. pnpm neer health checks the Gateway connection, not every provider's inference quality.

## Related

[Configuration](/neer-documentation/getting-started/configuration) · [Agents](/neer-documentation/concepts/agents) · [Ollama](/neer-documentation/guides/ollama)
