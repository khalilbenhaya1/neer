# Monitor NEER

Use the CLI and classic Control UI for operational state backed by the running Gateway. The experimental ui-next/ contains prototype metrics; distinguish those screens from live health checks.

## CLI checks

```sh
pnpm neer health
pnpm neer status
pnpm neer status --all
pnpm neer channels status --probe
pnpm neer logs
```

Health fetches health from the running Gateway. Status summarizes channel health and recent session recipients; --all produces a fuller read-only diagnosis. Channel probes are limited to adapters that support them. Logs exposes runtime logs.

For Gateway service state, use pnpm neer gateway status and pnpm neer gateway health. For model inventory and configured provider state, use pnpm neer models list and pnpm neer models status.

## Interface status

The classic Control UI shows Gateway-backed operational views, subject to the connected instance and permissions. In ui-next/, Command Center polls Gateway health/status and selected usage, model, approval, agent, and channel data. Its page coverage is incomplete.

The experimental Threat Monitor calculates a risk score from a default threat level and displays a fixed sample tool history. Those values are not a real-time threat feed, audit record, or guarantee that tools were blocked. The experimental Gateway Core page also hard-codes its port and shows placeholder process controls. Use CLI output and [Security Overview](/neer-documentation/security/overview) for mechanisms that are actually implemented.

## Related

[Dashboard](/neer-documentation/interface/dashboard) · [Gateway](/neer-documentation/concepts/gateway) · [Gateway Security](/neer-documentation/security/gateway-security)
