# NEER: Cognitive AI Infrastructure

NEER is a self-hostable agent runtime built around a Gateway, configurable agents, model providers, workspace memory, skills, tools, and channel adapters. It provides one place to run and operate agents through the channels you configure.

## What NEER provides

- A Gateway process that coordinates client connections, channel events, agent sessions, and operational RPCs.
- Agents with their own identity, workspace, model settings, and routing bindings.
- Provider configuration for language and supported media-understanding models.
- Workspace-backed memory and searchable memory indexes.
- Skills and runtime tools that extend an agent's instructions and available actions.
- A browser Control UI, health/status commands, and scheduled jobs.

These capabilities are present in the repository today. The Cognitive Core, cognitive pulse, goal queue, and broader autonomous planning described in the roadmap are product concepts or UI prototypes, not a separate implemented reasoning engine. Likewise, local-first describes a deployment direction: a configured provider may still send data to an external service.

## How a request moves through NEER

A channel or local client sends an event to the Gateway. NEER resolves the target agent and session, applies configuration and tool policies, calls the selected model provider, and returns the result to the originating client or channel. Memory and skills can contribute context; tools are available according to the agent's setup and permissions.

## Start here

For a local source checkout, follow [Quickstart](/neer-documentation/getting-started/quickstart). Review [Installation](/neer-documentation/getting-started/installation) for prerequisites, then [Configuration](/neer-documentation/getting-started/configuration) for Gateway and agent settings.

## Related

[Architecture](/neer-documentation/concepts/architecture) · [Agents](/neer-documentation/concepts/agents) · [Gateway](/neer-documentation/concepts/gateway) · [Roadmap](/neer-documentation/roadmap/cognitive-roadmap)
