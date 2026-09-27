# NEER security overview

NEER security is configured across the Gateway, browser clients, channel policies, tool execution, and optional sandboxing. These controls reduce specific risks; they do not make an exposed instance safe by default or guarantee that model/provider traffic remains local.

## Security boundaries

- **Gateway access:** bind address, authentication, allowed browser origins, and device identity/pairing affect who can connect. See [Gateway Security](/neer-documentation/security/gateway-security).
- **Channel ingress:** channel-specific direct-message and group policies, sender allowlists, and routing determine which incoming messages can reach agents.
- **Tool execution:** execution approval/security settings govern whether commands are denied, allowlisted, or unrestricted, and when approval is requested.
- **Filesystem access:** sandbox settings can scope workspace access, but sandboxing is configuration-dependent and should not be assumed enabled.
- **Provider data:** models and media providers receive the data required to process requests. Check their configuration and data practices.

## Audit configuration

Run the built-in audit to check configuration and local state:

```sh
pnpm neer security audit
```

The command also has deep and fix modes. Deep mode can perform additional probes; fix mode can change state, so review its output and help before using it. An audit is a useful check, not a complete security certification.

## Operational baseline

Keep local-only Gateways on loopback, use authentication for Gateway access, limit channel senders and groups, and grant tools only the access required for the task. See [Permissions](/neer-documentation/security/permissions) and [Configuration](/neer-documentation/getting-started/configuration).
