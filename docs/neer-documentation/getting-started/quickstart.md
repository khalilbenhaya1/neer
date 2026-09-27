# Quickstart: Run NEER locally

This quickstart starts the development Gateway from a source checkout. It does not configure a model provider or messaging channel for you; those are separate setup steps.

## Prerequisites

- Node.js 22.12 or newer.
- pnpm 10, matching the repository's declared package-manager version.
- Git and network access to fetch the repository and packages.

## Start the Gateway

```sh
git clone https://github.com/neer/neer.git
cd neer
pnpm install
pnpm neer setup
pnpm gateway:dev
```

The setup command creates local configuration and an agent workspace. The gateway:dev script starts the development Gateway with built-in channels skipped, which is useful for a first local run. Leave it running in that terminal.

In another terminal, check that the Gateway responds:

```sh
pnpm neer health
pnpm neer status
```

Health checks the running Gateway. Status reports configured channel health and recent session recipients; before a channel is configured, channel status may be empty or unavailable.

## Configure a model

NEER needs a configured model provider before an agent can produce model responses. List models already available, then select a model shown by that command:

```sh
pnpm neer models list
pnpm neer models set <model-id>
```

Replace the placeholder with an actual entry. Provider credentials or local provider configuration may be required; see [Models](/neer-documentation/concepts/models) and [Configuration](/neer-documentation/getting-started/configuration).

## Send a local agent message

After selecting a usable model, try:

```sh
pnpm neer agent --agent main --message "Summarize the purpose of this repository."
```

The agent command normally routes through the Gateway. The configured agent ID may differ; use pnpm neer agents list to see configured agents.

## Next steps

Add an agent using [Creating Agents](/neer-documentation/guides/creating-agents), configure a channel with [Channels](/neer-documentation/guides/channels), or inspect the browser interface in [Dashboard](/neer-documentation/interface/dashboard).
