---
title: "Install and develop NEER"
description: "Prepare a supported Node.js and pnpm environment from the NEER source repository."
---

# Install and develop NEER

This page covers a source checkout, the reproducible path for contributors and developers. A source checkout requires Node.js and pnpm; optional model providers and channels have their own setup requirements.

## Requirements

- Node.js 22.12 or newer, as declared in the root package manifest.
- pnpm 10, matching the repository's package-manager declaration.
- Git.

The codebase aims to support both Node and Bun execution paths, but the documented repository install workflow uses pnpm.

## Clone and install

```sh
git clone https://github.com/y5uxm/neer.git
cd neer
pnpm install
```

For a user configuration and workspace, run first-time setup:

```sh
pnpm neer setup
```

Use `pnpm neer setup --help` to inspect workspace options. The related `pnpm neer onboard --help` command exposes the interactive wizard and local/remote setup options.

## Start NEER

For local development, start the Gateway in a second terminal:

```sh
pnpm gateway:dev
```

This repository script skips built-in channel startup and launches the Gateway in development mode. To run the development CLI, use `pnpm neer COMMAND`; `pnpm dev` runs the development entry point.

## Optional interfaces

`pnpm ui:dev` starts the classic Control UI development server. The separate `ui-next/` package remains experimental; some screens use demonstration data and are not a replacement for the classic Control UI. See [Dashboard](/neer-documentation/interface/dashboard).

## Troubleshooting

- If a command cannot find Node or pnpm, check the installed versions against the requirements above.
- If pnpm neer health cannot connect, confirm pnpm gateway:dev is running and check the configured Gateway URL and port.
- If an agent has no model response, configure a provider and select an available model as described in [Models](/neer-documentation/concepts/models).

## Related

[Quickstart](/neer-documentation/getting-started/quickstart) · [Development setup](/neer-documentation/development/setup) · [Testing](/neer-documentation/development/testing)
