# Agent permissions and execution policy

An agent's practical permissions come from its tools, execution-approval policy, optional sandbox configuration, and connected-channel policies. Creating an agent or writing a skill does not grant broader system access by itself.

## Command execution controls

NEER's exec approval configuration supports security modes such as deny, allowlist, and full, plus approval prompts such as off, on-miss, and always. These settings may be scoped to defaults or an agent and interact with the applicable execution environment. Inspect current configuration and approval UI before changing a policy.

The mode named full is broad. Do not use it as a convenience default for an agent that processes untrusted messages. Prefer a restrictive policy and allow only the commands needed by the workflow.

## Sandbox and workspace access

Sandbox mode is configuration-dependent and defaults to off. When enabled, workspace access can be set to none, read-only (ro), or read/write (rw). Verify the effective settings for each agent rather than assuming every agent is isolated.

## Channel access

Direct-message policies, group policies, and sender allowlists determine who can invoke an agent through a channel. Configure these controls before connecting a channel to a public or shared group. See [Channels](/neer-documentation/guides/channels).

## Review

```sh
pnpm neer security audit
pnpm neer agents list
pnpm neer channels status
```

For supported options, consult pnpm neer security audit --help and pnpm neer config --help. Avoid copying configuration examples for unrelated deployments without verifying the schema.

## Related

[Security Overview](/neer-documentation/security/overview) · [Gateway Security](/neer-documentation/security/gateway-security) · [Skills and Tools](/neer-documentation/concepts/skills-tools)
