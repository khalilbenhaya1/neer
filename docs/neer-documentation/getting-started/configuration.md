---
title: "Configure NEER"
description: "Inspect and update NEER's validated JSON5 configuration for the Gateway, agents, and models."
---

# Configure NEER

NEER reads a JSON5 configuration file from the user configuration directory, normally `~/.neer/neer.json`. The setup command creates the initial configuration and workspace. Use the CLI to inspect or change settings rather than guessing key names; the configuration is validated against the repository schema.

## Read and set a value

The config CLI reads and writes values using dot paths:

```sh
pnpm neer config get gateway.bind
pnpm neer config set gateway.bind loopback
```

The set command validates the resulting file against the NEER schema and reports that the Gateway should be restarted to apply the change. Use `pnpm neer config --help` for supported commands and JSON5 values. Avoid printing secret-bearing sections into shared logs.

## Gateway basics

The Gateway defaults to port 18789. Its bind mode can be loopback, LAN, tailnet, custom, or auto; loopback is appropriate when access should remain on the local machine. Gateway mode distinguishes local and remote operation. Authentication supports token or password modes, with environment-variable alternatives for secrets.

A typical local development setup is created by pnpm neer setup; the repository's pnpm gateway:dev script starts a development Gateway. Avoid exposing a Gateway on a network until you have reviewed [Gateway Security](/neer-documentation/security/gateway-security).

## Configure an agent and model

Agent defaults and per-agent settings control workspaces, model selection, and routing. Model IDs must be present in the catalog available to your installation. Use:

```sh
pnpm neer agents list
pnpm neer models list
pnpm neer models set <model-id>
```

Replace the placeholder with an ID returned by models list. Provider credentials and provider-specific options belong to that provider's supported configuration.

## Validate changes

After changing configuration, check the Gateway and channel status:

```sh
pnpm neer health
pnpm neer status
```

Some configuration changes reload live; others may require restarting the Gateway. If validation reports an unknown key or invalid value, inspect `pnpm neer config --help` and the relevant [Core Concepts](/neer-documentation/concepts/architecture) page. Provider-specific fields should match the provider integration you configured.

## Related

[Gateway](/neer-documentation/concepts/gateway) · [Models](/neer-documentation/concepts/models) · [Permissions](/neer-documentation/security/permissions)
