---
title: "Agents"
description: "Configure NEER agents with their own identity, workspace, model, session context, and routing."
---

# Agents

An agent is a configured NEER identity that runs conversations with a selected model and workspace. The workspace supplies agent instructions and files; routing bindings can direct channel or peer traffic to an agent.

## Create and inspect agents

List configured agents:

```sh
pnpm neer agents list
```

Create an agent interactively, or inspect supported options first:

```sh
pnpm neer agents add --help
pnpm neer agents add analyst
```

The add command supports a workspace, a model, an agent directory, and repeated channel bindings. Non-interactive creation requires a workspace. Use a model ID that exists in your catalog. Bindings control routing from supported channels or peers; inspect help for the binding syntax accepted by your version.

Send a message to an agent through the Gateway:

```sh
pnpm neer agent --agent analyst --message "Summarize the latest project notes."
```

The agent ID must exist and a working model provider must be configured. The command also supports embedded local execution with `--local`; inspect `pnpm neer agent --help` before choosing it. The selected model and tool policy still apply.

## Agent configuration and context

NEER resolves agent identity, workspace, model, session, and routing from configuration. Different agents can use separate workspaces and model choices. Tool availability, execution approval, and sandbox policy still apply. Goal and experience tools are part of the runtime tool set, but their use depends on the effective policy. Creating a separate agent does not by itself create an OS-level security boundary.

## Related

[Creating Agents](/neer-documentation/guides/creating-agents) · [Models](/neer-documentation/concepts/models) · [Memory](/neer-documentation/concepts/memory) · [Permissions](/neer-documentation/security/permissions)
