# Cognitive state: implemented signals and prototype screens

NEER has operational state such as Gateway health, agent/session information, and heartbeat events. The repository does not yet implement a general cognitive-state engine that tracks goals, reflection cycles, or memory consolidation as live system data.

## Signals available today

The Gateway health response includes heartbeat interval information alongside channel and agent state. Heartbeat commands can inspect the last event and enable or disable heartbeat processing:

```sh
pnpm neer system heartbeat last
pnpm neer system heartbeat enable
pnpm neer system heartbeat disable
```

Heartbeat behavior depends on the Gateway and agent configuration. It is distinct from a persistent goal planner.

## Experimental Cognitive Pulse view

The separate ui-next/ Cognitive Pulse page derives a pulse status from Gateway connectivity and displays the Gateway heartbeat interval. Its active-goal count, recovery count, timeline entries, and goal queue are hard-coded demo content. They do not report live reflection or goal-processing telemetry.

For actual heartbeat state, use the CLI commands above and inspect Gateway health. For longer-term goals and a full cognitive-cycle view, consult [Cognitive Roadmap](/neer-documentation/roadmap/cognitive-roadmap); those capabilities are planned.

## Related

[Monitoring](/neer-documentation/interface/monitoring) · [Gateway](/neer-documentation/concepts/gateway) · [Cognitive Core](/neer-documentation/concepts/cognitive-core)
