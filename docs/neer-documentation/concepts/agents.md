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

The agent ID must exist and a working model provider must be configured. The command also supports a local embedded mode; inspect pnpm neer agent --help before choosing it.

## Agent configuration and context

NEER resolves agent identity, workspace, model, session, and routing from configuration. Different agents can use separate workspaces and model choices. Tool availability and execution policy still apply; creating a separate agent does not by itself create an OS-level security boundary.

## Related

[Creating Agents](/neer-documentation/guides/creating-agents) · [Models](/neer-documentation/concepts/models) · [Memory](/neer-documentation/concepts/memory) · [Permissions](/neer-documentation/security/permissions)
