---
title: "Create and configure agents"
description: "Add a NEER agent with a workspace, optional model, and channel bindings."
---

# Create and configure agents

Use agents to give separate workflows their own identity, workspace, model settings, or channel bindings. An agent is not automatically isolated at the operating-system level; review its execution policy and sandbox settings separately.

## Before you start

Run setup, ensure a model provider is configured, and check the agent IDs already in use:

```sh
pnpm neer agents list
pnpm neer models list
```

## Add an agent

Start with the command help so you can choose the correct workspace and model options for your installation:

```sh
pnpm neer agents add --help
pnpm neer agents add research
```

The add command supports a workspace, model, agent directory, and repeated --bind options. Non-interactive creation requires a workspace. Use --model only with a model ID that exists in your catalog. Bindings control routing from supported channels or peers; inspect help for accepted binding syntax.

Confirm the agent was added and send a test message:

```sh
pnpm neer agents list
pnpm neer agent --agent research --message "Summarize the notes in my workspace."
```

## Maintain the agent

Use the workspace for agent instructions and memory files. Skills go in the workspace skills/ directory; see [Creating Skills](/neer-documentation/guides/creating-skills). Use pnpm neer agents set-identity --help to inspect identity options. Remove agents with pnpm neer agents delete --help after reviewing effects on associated configuration and sessions.

## Related

[Agents concept](/neer-documentation/concepts/agents) · [Models](/neer-documentation/concepts/models) · [Memory](/neer-documentation/concepts/memory) · [Permissions](/neer-documentation/security/permissions)
