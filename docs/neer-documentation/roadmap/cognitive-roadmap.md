---
title: "Cognitive roadmap"
description: "Separate implemented cognitive runtime foundations from incomplete and planned phases."
---

# Cognitive roadmap

This page records the status visible in the repository source. Phase names describe the NEER direction; they are not release commitments, dated milestones, or evidence that a phase is complete.

## Implemented in the repository

- **Gateway and agent foundation:** the Gateway routes client and channel requests to configured agents, models, memory, and tools.
- **Persona and behavior building blocks:** agents can have identity files and workspace instructions. A separate self-state and intent module participates in the live proactive loop. The repository does not declare the Persona & Behavioral Stability phase formally closed.
- **Cognitive Pulse building blocks:** Gateway startup starts a worker that processes stored goals and experience records. Pulse ticks run only with `NEER_AUTONOMOUS_MODE=true`, and are capped at three per hour. A separate live proactive loop starts regardless of that variable. These paths are experimental and do not guarantee task completion.
- **Memory building blocks:** workspace Markdown can be indexed and searched, and a separate experience store records explicit outcomes and lessons. The two stores do not form a unified learning system.
- **Scheduling and operations:** cron, heartbeat, health/status commands, and the classic Control UI are present in the repository.

See [Architecture](/neer-documentation/concepts/architecture), [Cognitive Core](/neer-documentation/concepts/cognitive-core), and [Memory](/neer-documentation/concepts/memory) for implementation details.

## Phase status

| Phase                                 | Status supported by the source                                                                                                                                                                                        |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1. Persona & Behavioral Stability** | Identity and self-state building blocks exist. No formal phase-completion record was found.                                                                                                                           |
| **2. Cognitive Pulse Engine**         | A Gateway-wired, environment-gated worker and a separate proactive loop exist. The current implementation is experimental and has limits documented in [Cognitive Core](/neer-documentation/concepts/cognitive-core). |
| **3. Memory Architecture**            | Workspace search and JSON-backed experiences exist as separate systems. A broader unified memory architecture remains incomplete.                                                                                     |
| **4. Autonomous Action Layer**        | Goal tools and gated background goal dispatch exist. Reliable autonomous planning, completion guarantees, and a complete operator control surface are not established.                                                |
| **5. Economic Intelligence**          | Planned direction. No economic-intelligence engine was verified in this repository.                                                                                                                                   |
| **6. Meta-Cognitive Layer**           | Basic self-state and intent logic exist. A general self-evaluation or model-adaptation layer remains planned and was not verified.                                                                                    |

## How to read these labels

“Implemented” means the corresponding code path is present; it does not mean every path is enabled by default, production-hardened, or exposed in the UI. “Planned” marks a direction without a verified implementation. The current source does not define dates or delivery commitments for these phases.

## Related

[Cognitive Core](/neer-documentation/concepts/cognitive-core) · [Cognitive State](/neer-documentation/interface/cognitive-state) · [Monitoring](/neer-documentation/interface/monitoring) · [Security Overview](/neer-documentation/security/overview)
