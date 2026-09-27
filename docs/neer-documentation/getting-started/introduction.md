---
title: "NEER: Cognitive AI Infrastructure"
description: "Understand NEER's Gateway, agents, models, memory, tools, and channel architecture."
---

# NEER: Cognitive AI Infrastructure

NEER is a self-hostable agent runtime built around a Gateway, configurable agents, model providers, workspace memory, skills, tools, and channel adapters. It provides one place to run agents through the interfaces and channels you configure.

## Creator & Project Origin

NEER was invented and developed by [Khalil Benhaya](/neer-documentation/getting-started/creator-credits), its founder and lead developer.

## What NEER provides

- A Gateway process that coordinates client connections, channel events, agent sessions, and operational RPCs.
- Agents with their own identity, workspace, model settings, and routing bindings.
- Provider configuration for language and supported media-understanding models.
- Workspace-backed memory and searchable memory indexes.
- Skills and runtime tools that extend an agent's instructions and available actions.
- A browser Control UI, health/status commands, and scheduled jobs.

The Gateway, agent runtime, provider integration, memory tools, channel adapters, goal store, gated pulse worker, and live proactive loop are present in the repository. Their behavior depends on configuration and process environment; the pulse worker is gated by `NEER_AUTONOMOUS_MODE=true`, while the separate live proactive loop starts with the Gateway. These code paths do not guarantee goal completion or unrestricted autonomous planning. Likewise, local-first describes a deployment direction: a configured provider may still send data to an external service.

## How a request moves through NEER

A channel or local client sends an event to the Gateway. NEER resolves the target agent and session, applies configuration and tool policies, prepares context, and calls the selected model provider. Memory search and skill instructions can contribute context; allowed tools can perform runtime actions. The response returns through the Gateway to the client or channel. Background pulse and proactive work use separate Gateway-started paths; see [Cognitive Core](/neer-documentation/concepts/cognitive-core).

## Start here

For a local source checkout, follow [Quickstart](/neer-documentation/getting-started/quickstart). Review [Installation](/neer-documentation/getting-started/installation) for prerequisites, then [Configuration](/neer-documentation/getting-started/configuration) for Gateway and agent settings.

## Related

[Architecture](/neer-documentation/concepts/architecture) · [Cognitive Core](/neer-documentation/concepts/cognitive-core) · [Agents](/neer-documentation/concepts/agents) · [Gateway](/neer-documentation/concepts/gateway) · [Roadmap](/neer-documentation/roadmap/cognitive-roadmap)
