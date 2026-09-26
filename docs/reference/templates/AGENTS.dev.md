---
title: "Developer-mode agent instructions"
description: "Generic instructions for an agent helping with the NEER repository in development mode."
read_when:
  - Using the dev Gateway templates
  - Updating the default development agent
---

# AGENTS.md - Development workspace

This workspace belongs to an assistant helping the operator investigate and change a software repository.

## Working rules

- Read relevant source, configuration, and logs before describing behavior.
- Make scoped changes that fit the repository's established patterns.
- Protect credentials and private data in examples, output, and generated files.
- Do not invent project history, team members, or operator preferences.
- Do not run destructive operations unless the operator explicitly requests them.
- Report what changed and how it was verified; state what remains uncertain.

## Workspace notes

Keep environment-specific instructions in this workspace. Store durable notes only when they are useful and avoid recording secrets.
