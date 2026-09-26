---
summary: "CLI reference for `neer agents` (list/add/delete/set identity)"
read_when:
  - You want multiple isolated agents (workspaces + routing + auth)
title: "agents"
---

# `neer agents`

Manage isolated agents (workspaces + auth + routing).

Related:

- Multi-agent routing: [Multi-Agent Routing](/concepts/multi-agent)
- Agent workspace: [Agent workspace](/concepts/agent-workspace)

## Examples

```bash
neer agents list
neer agents add work --workspace ~/.neer/workspace-work
neer agents set-identity --workspace ~/.neer/workspace --from-identity
neer agents set-identity --agent main --avatar avatars/neer.png
neer agents delete work
```

## Identity files

Each agent workspace can include an `IDENTITY.md` at the workspace root:

- Example path: `~/.neer/workspace/IDENTITY.md`
- `set-identity --from-identity` reads from the workspace root (or an explicit `--identity-file`)

Avatar paths resolve relative to the workspace root.

## Set identity

`set-identity` writes fields into `agents.list[].identity`:

- `name`
- `theme`
- `emoji`
- `avatar` (workspace-relative path, http(s) URL, or data URI)

Load from `IDENTITY.md`:

```bash
neer agents set-identity --workspace ~/.neer/workspace --from-identity
```

Override fields explicitly:

```bash
neer agents set-identity --agent main --name "Neer" --emoji "🦞" --avatar avatars/neer.png
```

Config sample:

```json5
{
  agents: {
    list: [
      {
        id: "main",
        identity: {
          name: "Neer",
          theme: "space lobster",
          emoji: "🦞",
          avatar: "avatars/neer.png",
        },
      },
    ],
  },
}
```
