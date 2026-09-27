---
title: "Cognitive state"
description: "Separate the Gateway's implemented cognitive runtime state from experimental dashboard mockups."
---

# Cognitive state

NEER has implemented runtime state for activity, drives, goal records, experience records, and proactive decision logic. That state is separate from the experimental `ui-next/` Cognitive Pulse page, whose goal and timeline panels use demonstration values rather than a live view of those stores.

## Runtime state in the repository

The Gateway wires a live proactive loop and a Cognitive Pulse worker. The loop tracks user interaction, whether an agent or cron job is active, and a small self-state record used by its intent logic. The worker processes goal records and experience tools when `NEER_AUTONOMOUS_MODE=true`. The flag gates worker ticks only; it does not turn off the separate live proactive loop. See [Cognitive Core](/neer-documentation/concepts/cognitive-core) for startup, timing, and limits.

The current code stores several cognitive records as JSON under the process working directory's `data/` folder, including goals, experiences, drives, and self-state. These files are not the workspace Markdown index described in [Memory](/neer-documentation/concepts/memory).

## Supported operational signals

Use the Gateway health response and heartbeat controls for the signals exposed through the CLI:

```sh
pnpm neer health
pnpm neer system heartbeat last
pnpm neer system heartbeat enable
pnpm neer system heartbeat disable
```

These commands report Gateway health and system heartbeat state. They do not expose a complete event history for the cognitive loop or a dedicated goal-management CLI. Goal operations are currently available as agent tools when the effective tool policy permits them; see [Cognitive Core](/neer-documentation/concepts/cognitive-core).

## Experimental Cognitive Pulse screen

The separate `ui-next/` Cognitive Pulse page shows Gateway connectivity and heartbeat interval, but its active-goal count, recovery count, timeline entries, and queue are hard-coded sample content. Do not treat that page as an operational goal dashboard or audit log. For the current classic UI, see [Dashboard](/neer-documentation/interface/dashboard).

## Related

[Monitoring](/neer-documentation/interface/monitoring) · [Gateway](/neer-documentation/concepts/gateway) · [Cognitive Core](/neer-documentation/concepts/cognitive-core) · [Cognitive Roadmap](/neer-documentation/roadmap/cognitive-roadmap)
