---
summary: "Run Neer with Ollama (local LLM runtime)"
read_when:
  - You want to run Neer with local models via Ollama
  - You need Ollama setup and configuration guidance
title: "Ollama"
---

# Ollama

Ollama is a local LLM runtime for running models on your machine and connecting to Ollama Cloud models through the same local daemon. Neer integrates with Ollama's OpenAI-compatible API and can discover model tags when you opt in with `OLLAMA_API_KEY` (or an auth profile) and do not define an explicit `models.providers.ollama` entry.

## Quick start

1. Install Ollama: [https://ollama.ai](https://ollama.ai)

2. Pull a model:

```bash
ollama pull gpt-oss:20b
# or
ollama pull llama3.3
# or
ollama pull qwen2.5-coder:32b
# or
ollama pull deepseek-r1:32b
```

3. Enable Ollama for Neer (any value works; Ollama doesn't require a real key):

```bash
# Set environment variable
export OLLAMA_API_KEY="ollama-local"

# Or configure in your config file
neer config set models.providers.ollama.apiKey "ollama-local"
```

4. Use Ollama models:

```json5
{
  agents: {
    defaults: {
      model: { primary: "ollama/gpt-oss:20b" },
    },
  },
}
```

## Ollama Cloud

Ollama Cloud model requests pass through the local Ollama daemon at `http://127.0.0.1:11434`. Sign in with the Ollama CLI, then pull the cloud model pointer you want to use:

```bash
ollama signin
ollama pull gemma4:31b-cloud
```

For Cloud models, define an explicit provider entry so Neer has the model's context size and current metered costs. This entry uses the existing Ollama provider and OpenAI-compatible API; `ollama-local` is a placeholder API key for Neer's provider configuration, while Ollama CLI sign-in authenticates Cloud access.

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://127.0.0.1:11434/v1",
        apiKey: "ollama-local",
        api: "openai-completions",
        models: [
          {
            id: "gemma4:31b-cloud",
            name: "Gemma 4 31B Cloud",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0.14, output: 0.4, cacheRead: 0.05, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "ollama/gemma4:31b-cloud" },
    },
  },
}
```

Ollama labels `gemma4:31b-cloud` as a low-usage model and lists 256K context, tool calling, and image input. The Free plan includes a monthly amount of starter usage for a subset of models; Cloud usage is metered at published per-token rates after included credits are used. Check your Ollama account's usage page to confirm which credits apply before running larger workloads. See [Ollama pricing](https://ollama.com/pricing) and the [Gemma 4 model page](https://ollama.com/library/gemma4:31b-cloud) for current availability and rates.

Verify that the model is available to the local daemon and Neer:

```bash
ollama run gemma4:31b-cloud
neer models list
```

## Model discovery (implicit provider)

When you set `OLLAMA_API_KEY` (or an auth profile) and **do not** define `models.providers.ollama`, Neer reads model tags from the local Ollama instance at `http://127.0.0.1:11434`:

- Queries `/api/tags` and includes the returned model names
- Marks `reasoning` when the model name contains `r1` or `reasoning`
- Uses a default `contextWindow` of `128000` and `maxTokens` of `8192`
- Sets costs to `0` and disables streaming for discovered entries

These defaults are intended for local models. For Cloud model pointers, use explicit configuration and set the model's actual context window and current pricing rather than relying on the zero-cost discovery defaults.

This keeps the catalog aligned with Ollama's model tags. Discovery does not read model capability or pricing metadata, so use explicit entries when those values matter.

To see what models are available:

```bash
ollama list
neer models list
```

To add a new model, simply pull it with Ollama:

```bash
ollama pull mistral
```

The new model will be automatically discovered and available to use.

If you set `models.providers.ollama` explicitly, auto-discovery is skipped and you must define models manually (see below).

## Configuration

### Basic setup (implicit discovery)

The simplest way to enable Ollama is via environment variable:

```bash
export OLLAMA_API_KEY="ollama-local"
```

### Explicit setup (manual models)

Use explicit config when:

- Ollama runs on another host/port.
- You want to force specific context windows or model lists.
- You want to include models that do not report tool support.

```json5
{
  models: {
    providers: {
      ollama: {
        // Use a host that includes /v1 for OpenAI-compatible APIs
        baseUrl: "http://ollama-host:11434/v1",
        apiKey: "ollama-local",
        api: "openai-completions",
        models: [
          {
            id: "gpt-oss:20b",
            name: "GPT-OSS 20B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 8192,
            maxTokens: 8192 * 10
          }
        ]
      }
    }
  }
}
```

If `OLLAMA_API_KEY` is set, you can omit `apiKey` in the provider entry and Neer will fill it for availability checks.

### Custom base URL (explicit config)

If Ollama is running on a different host or port (explicit config disables auto-discovery, so define models manually):

```json5
{
  models: {
    providers: {
      ollama: {
        apiKey: "ollama-local",
        baseUrl: "http://ollama-host:11434/v1",
      },
    },
  },
}
```

### Model selection

Once configured, all your Ollama models are available:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "ollama/gpt-oss:20b",
        fallbacks: ["ollama/llama3.3", "ollama/qwen2.5-coder:32b"],
      },
    },
  },
}
```

## Advanced

### Reasoning models

For automatically discovered models, Neer infers reasoning support from model names containing `r1` or `reasoning`. Set `reasoning` explicitly for other models:

```bash
ollama pull deepseek-r1:32b
```

### Model costs

Models running on your own hardware do not incur Ollama Cloud usage charges. Cloud models are metered; set accurate per-token costs in explicit Neer configuration so usage estimates are meaningful. Automatic discovery sets costs to zero and should not be used as a pricing source for Cloud models.

### Streaming Configuration

Due to a [known issue](https://github.com/badlogic/pi-mono/issues/1205) in the underlying SDK with Ollama's response format, **streaming is disabled for automatically discovered Ollama models**. This prevents corrupted responses when using tool-capable models.

When streaming is disabled, responses are delivered all at once (non-streaming mode), which avoids the issue where interleaved content/reasoning deltas cause garbled output.

#### Re-enable Streaming (Advanced)

If you want to re-enable streaming for Ollama (may cause issues with tool-capable models):

```json5
{
  agents: {
    defaults: {
      models: {
        "ollama/gpt-oss:20b": {
          streaming: true,
        },
      },
    },
  },
}
```

#### Disable Streaming for Other Providers

You can also disable streaming for any provider if needed:

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-4": {
          streaming: false,
        },
      },
    },
  },
}
```

### Context windows

For auto-discovered models, Neer uses a `128000` token context window by default. You can override `contextWindow` and `maxTokens` in explicit provider config.

## Troubleshooting

### Ollama not detected

Make sure Ollama is running and that you set `OLLAMA_API_KEY` (or an auth profile), and that you did **not** define an explicit `models.providers.ollama` entry:

```bash
ollama serve
```

And that the API is accessible:

```bash
curl http://localhost:11434/api/tags
```

### No models available

Neer lists model names returned by Ollama's `/api/tags` endpoint without checking tool support. If a model isn't listed, either:

- Pull the model, or
- Define the model explicitly in `models.providers.ollama`.

If the model is listed but agent tool calls fail, check that Ollama reports support for tools for that model.

To add models:

```bash
ollama list  # See what's installed
ollama pull gpt-oss:20b  # Pull a tool-capable model
ollama pull llama3.3     # Or another model
```

### Connection refused

Check that Ollama is running on the correct port:

```bash
# Check if Ollama is running
ps aux | grep ollama

# Or restart Ollama
ollama serve
```

### Corrupted responses or tool names in output

If you see garbled responses containing tool names (like `sessions_send`, `memory_get`) or fragmented text when using Ollama models, this is due to an upstream SDK issue with streaming responses. **This is fixed by default** in the latest Neer version by disabling streaming for Ollama models.

If you manually enabled streaming and experience this issue:

1. Remove the `streaming: true` configuration from your Ollama model entries, or
2. Explicitly set `streaming: false` for Ollama models (see [Streaming Configuration](#streaming-configuration))

## See Also

- [Model Providers](/concepts/model-providers) - Overview of all providers
- [Model Selection](/concepts/models) - How to choose models
- [Configuration](/gateway/configuration) - Full config reference
