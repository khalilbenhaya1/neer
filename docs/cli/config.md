---
summary: "CLI reference for `neer config` (get/set/unset config values)"
read_when:
  - You want to read or edit config non-interactively
title: "config"
---

# `neer config`

Config helpers: get/set/unset values by path. Run without a subcommand to open
the configure wizard (same as `neer configure`).

## Examples

```bash
neer config get browser.executablePath
neer config set browser.executablePath "/usr/bin/google-chrome"
neer config set agents.defaults.heartbeat.every "2h"
neer config set agents.list[0].tools.exec.node "node-id-or-name"
neer config unset tools.web.search.apiKey
```

## Paths

Paths use dot or bracket notation:

```bash
neer config get agents.defaults.workspace
neer config get agents.list[0].id
```

Use the agent list index to target a specific agent:

```bash
neer config get agents.list
neer config set agents.list[1].tools.exec.node "node-id-or-name"
```

## Values

Values are parsed as JSON5 when possible; otherwise they are treated as strings.
Use `--json` to require JSON5 parsing.

```bash
neer config set agents.defaults.heartbeat.every "0m"
neer config set gateway.port 19001 --json
neer config set channels.whatsapp.groups '["*"]' --json
```

Restart the gateway after edits.
