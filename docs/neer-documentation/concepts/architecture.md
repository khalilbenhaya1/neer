# NEER architecture

NEER is a long-running Gateway plus configured agents, provider integrations, channel adapters, and local interfaces. The Gateway is the coordination and access point; it does not itself represent a separate cognitive model.

## Request flow

1. A channel adapter or local client submits a message or event to the Gateway.
2. NEER resolves the target agent using agent and routing configuration, then loads relevant session and workspace context.
3. The agent runtime prepares instructions and context, including eligible skills and memory results where enabled.
4. A configured model provider generates the response. Available tools are selected and invoked according to runtime and permission policy.
5. The response or tool result returns through the Gateway to the client or channel.

The specific path depends on channel, agent, model, session state, and tool configuration. Not every request uses memory or invokes a tool.

## Components

- **Gateway:** WebSocket and HTTP server, channel coordination, client access, health/status, and control operations. See [Gateway](/neer-documentation/concepts/gateway).
- **Agents:** identity, workspace, model choice, session context, and routing. See [Agents](/neer-documentation/concepts/agents).
- **Models:** configured provider/model choices used for text and supported media tasks. See [Models](/neer-documentation/concepts/models).
- **Memory:** workspace documents and a searchable index exposed through memory tools. See [Memory](/neer-documentation/concepts/memory).
- **Skills and tools:** instruction bundles and runtime operations available to an agent. See [Skills and Tools](/neer-documentation/concepts/skills-tools).
- **Channels:** adapters that connect messaging systems to Gateway routing. See [Channels](/neer-documentation/guides/channels).

## Cognitive Core is a product concept

The documentation uses “Cognitive Core” for the combined agent-runtime concepts, not for a single source-code service or dedicated planning engine. The repository implements agent execution, heartbeat controls, scheduled jobs, model calls, and tool policies. A persistent goal queue and reflective cognitive cycle remain roadmap work.

## Deployment boundary

NEER can run on a local machine or host and connect to local or remote providers. A local Gateway can still call external providers when configured, so verify data handling and network destinations for your chosen model and channel.

## Related

[Cognitive Core](/neer-documentation/concepts/cognitive-core) · [Security Overview](/neer-documentation/security/overview) · [Roadmap](/neer-documentation/roadmap/cognitive-roadmap)
