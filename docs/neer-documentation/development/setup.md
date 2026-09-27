# Set up a NEER development environment

This guide prepares the repository for local development and a Gateway-backed agent session.

## Prerequisites

- Node.js 22.12 or newer.
- pnpm 10 as declared by the repository.
- Git.

## Install dependencies and initialize

```sh
git clone https://github.com/neer/neer.git
cd neer
pnpm install
pnpm neer setup
```

The setup command initializes local configuration and an agent workspace. Use pnpm neer setup --help for wizard, workspace, and local/remote mode options.

## Start the development Gateway

In one terminal:

```sh
pnpm gateway:dev
```

This repository script runs Gateway development mode with built-in channels skipped. In another terminal, inspect the service:

```sh
pnpm neer health
pnpm neer status
```

Configure a model provider before asking an agent to generate a response. Then list configured agents and send a test message. See [Quickstart](/neer-documentation/getting-started/quickstart).

## Development interfaces

- pnpm dev runs the development CLI entry point.
- pnpm ui:dev starts the classic Control UI frontend.
- ui-next/ has its own package and is a work in progress; several routes remain placeholders.

## Related

[Project Structure](/neer-documentation/development/project-structure) · [Testing](/neer-documentation/development/testing) · [Contributing](/neer-documentation/development/contributing)
