# Dashboard and Control UI

NEER includes a browser Control UI served by the Gateway. It provides an interface for inspecting and operating supported Gateway features, including conversations, agents, channels, devices, skills, configuration, logs, usage, and approvals as available to the connected installation.

## Open the Control UI

With the Gateway running, ask NEER to print and open its configured dashboard URL:

```sh
pnpm neer dashboard
```

Use --no-open to print the URL without launching a browser. The URL may contain a token fragment for authentication. Treat it as a credential and do not share it. Browser access is subject to Gateway authentication, origin checks, and device-pairing policy.

For frontend development, pnpm ui:dev starts the classic ui/ app. The separate ui-next/ React app is still in development: several routes render placeholders, and some pages display hard-coded demonstration values. Do not treat it as a complete monitoring or threat-analysis system.

## What the interface can show

The classic Control UI reflects Gateway-backed data for its supported views. Availability varies with the connected Gateway, configured channels, agent state, and permissions. It is an operational interface, not an independent source of truth when disconnected.

The experimental ui-next/ includes functional views for command center, conversations, models/usage, agents, channels, and devices, plus partial Gateway, cognitive-pulse, and threat-monitor screens. The latter screens contain placeholder or synthesized values; see [Cognitive State](/neer-documentation/interface/cognitive-state) and [Monitoring](/neer-documentation/interface/monitoring).

## Related

[Gateway](/neer-documentation/concepts/gateway) · [Cognitive State](/neer-documentation/interface/cognitive-state) · [Monitoring](/neer-documentation/interface/monitoring) · [Gateway Security](/neer-documentation/security/gateway-security)
