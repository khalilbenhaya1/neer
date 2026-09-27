---
title: "NEER repository structure"
description: "Locate runtime, CLI, UI, extension, native app, and documentation code in the repository."
---

# NEER repository structure

The repository keeps the Gateway runtime, CLI, browser interfaces, channel extensions, native clients, and documentation in separate areas.

| Path        | Purpose                                                                                            |
| ----------- | -------------------------------------------------------------------------------------------------- |
| src/        | TypeScript runtime, CLI, Gateway, agent execution, providers, tools, channels, and infrastructure. |
| ui/         | Classic browser Control UI.                                                                        |
| ui-next/    | Separate React/Vite interface in development; some routes are placeholders.                        |
| extensions/ | Extension packages, including optional channel integrations.                                       |
| apps/       | Native and companion applications.                                                                 |
| skills/     | Bundled skill instruction directories.                                                             |
| packages/   | Shared workspace packages.                                                                         |
| scripts/    | Development, build, release, and maintenance scripts.                                              |
| docs/       | Mintlify documentation and repository guidance.                                                    |

## Where to make changes

Changes to shared channel routing, allowlists, onboarding, or command gating should consider built-in channels under src/ and channel extensions under extensions/. UI changes belong in the appropriate interface package. Runtime APIs and types should follow the existing source and test patterns in src/.

## Related

[Development Setup](/neer-documentation/development/setup) · [Testing](/neer-documentation/development/testing) · [Contributing](/neer-documentation/development/contributing)
