# Cognitive Core: runtime concepts and roadmap

“Cognitive Core” describes the NEER product idea of coordinating agents, models, memory, skills, tools, and the Gateway. It is not the name of a standalone runtime package in the repository.

## Implemented runtime pieces

Today, an agent receives a routed message, builds model context from its instructions and session, may retrieve configured memory, and may use permitted tools. The Gateway connects local clients or channel adapters to agent sessions. Heartbeat controls and cron jobs can trigger work through the running system.

These pieces are configurable and conditional: an agent needs an available model, a running Gateway for Gateway-routed interactions, and any required channel or tool setup. Memory is not automatically attached to every request.

## What the concept does not imply

The current code does not provide a general goal queue, continuous self-reflection engine, automatic long-term planning loop, or guaranteed autonomous completion of goals. The Cognitive Pulse view in the separate ui-next app is a prototype, not evidence that these functions exist in the runtime.

## Follow the implementation

Start with [Architecture](/neer-documentation/concepts/architecture) for message flow, then read [Agents](/neer-documentation/concepts/agents), [Models](/neer-documentation/concepts/models), [Memory](/neer-documentation/concepts/memory), and [Skills and Tools](/neer-documentation/concepts/skills-tools). Future directions are tracked in [Cognitive Roadmap](/neer-documentation/roadmap/cognitive-roadmap).
