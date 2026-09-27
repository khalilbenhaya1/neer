---
title: "Gateway"
description: "Run the NEER coordination service and understand its connections, routing, and exposure."
---

# Gateway

The NEER Gateway is the long-running service that connects clients and channel adapters to agent sessions. It also exposes health, status, and control operations used by the CLI and browser Control UI. Gateway startup wires the live proactive loop and starts the Cognitive Pulse worker; see [Cognitive Core](/neer-documentation/concepts/cognitive-core) for the different gates on those paths.

## Run and inspect

For a development checkout:

```sh
pnpm gateway:dev
```

The default Gateway port is 18789. Check the running service from another terminal:

```sh
pnpm neer gateway status
pnpm neer gateway health
pnpm neer health
```

The repository's development script skips built-in channel startup. Production or channel-enabled operation requires the applicable channel configuration. See [Channels](/neer-documentation/guides/channels).

## Connections and routing

A client connects to the Gateway, authenticates according to configured policy, and requests or submits work. Channel messages are routed to an agent according to bindings and channel policies. The Gateway coordinates this flow; model inference is performed by the selected provider.

## Network and authentication

Gateway bind modes include loopback, LAN, tailnet, custom, and automatic selection. Token and password authentication are supported. Keep the service bound to loopback for local-only use unless remote access is deliberately configured. Review [Gateway Security](/neer-documentation/security/gateway-security) before changing exposure or authentication.

## Related

[Architecture](/neer-documentation/concepts/architecture) · [Dashboard](/neer-documentation/interface/dashboard) · [Monitoring](/neer-documentation/interface/monitoring)
