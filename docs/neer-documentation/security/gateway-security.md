---
title: "Secure Gateway access"
description: "Limit Gateway network exposure and understand authentication and browser access controls."
---

# Secure Gateway access

The Gateway is the access point for CLI clients, browser UI, and configured channels. Its bind address and authentication mode determine network exposure and client access.

## Bind and authenticate

The default port is 18789, and the normal bind mode is loopback. Gateway bind options include loopback, LAN, tailnet, custom, and auto. Token and password authentication are supported; tokens can be supplied through NEER_GATEWAY_TOKEN, and passwords through NEER_GATEWAY_PASSWORD.

Keep a local Gateway on loopback unless remote access is necessary. Before using LAN or other remote exposure, set authentication, restrict network access, and review the remote-access configuration. Do not put tokens or passwords in a committed config file or paste a token-bearing dashboard URL into chat.

For unattended operation, account for the Gateway-started live proactive loop. `NEER_AUTONOMOUS_MODE` gates the separate pulse worker but does not disable the live proactive loop. See [Cognitive Core](/neer-documentation/concepts/cognitive-core) for the current behavior; the source does not expose a separate documented off switch for that loop.

## Browser access protections

The Control UI checks browser origin policy and uses device identity/pairing. Configure gateway.controlUi.allowedOrigins when the browser is served from an explicitly allowed origin. Insecure HTTP token-only authentication is disabled by default. The configuration includes a dangerous option to disable device authentication; do not enable it for convenience.

## Verify the service

```sh
pnpm neer gateway status
pnpm neer gateway health
pnpm neer security audit
```

Health confirms service reachability, not the correctness of the exposure policy. Inspect the effective config and network binding as part of deployment review.

## Related

[Security Overview](/neer-documentation/security/overview) · [Permissions](/neer-documentation/security/permissions) · [Gateway](/neer-documentation/concepts/gateway)
