---
title: "Cognitive Core"
description: "Understand NEER's implemented goal pulse and proactive loops, their gates, and their current limits."
---

# Cognitive Core

In NEER, **Cognitive Core** refers to code that tracks activity and internal state, stores goals and experience records, and can dispatch background agent work. It is a set of modules started with the Gateway, not a separate model or a guarantee of autonomous task completion.

## Runtime paths

The Gateway wires two distinct background paths during startup:

| Path                   | What the source does                                                                                                                  | Gate and limit                                                                                                                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Live proactive loop    | Checks activity, drive state, and self-state on a timer; may dispatch an agent request through the Gateway's normal message pipeline. | Starts with the Gateway. It applies inactivity, cooldown, in-flight agent, and cron guards. The source does not expose a separate documented configuration switch that disables only this loop. |
| Cognitive Pulse worker | Processes stored goals, updates drive state, recovers stale active goals, and may run one background agent turn.                      | A worker tick runs only when the process environment has `NEER_AUTONOMOUS_MODE=true`. It schedules its next tick based on activity and caps pulse executions at three per hour.                 |

The worker and the proactive loop are not the same feature. Setting `NEER_AUTONOMOUS_MODE` to anything other than `true` skips pulse-worker ticks; it does **not** disable the live proactive loop. Review [Gateway Security](/neer-documentation/security/gateway-security) before running an unattended or network-accessible Gateway.

## Goals and experience records

The agent tool set includes these goal tools when the effective tool policy permits them:

| Tool            | Purpose                                                                                  |
| --------------- | ---------------------------------------------------------------------------------------- |
| `create_goal`   | Store a goal with a title, description, and optional priority from 1 to 10.              |
| `list_goals`    | List goals, optionally filtered by `pending`, `active`, `completed`, or `failed` status. |
| `complete_goal` | Mark a goal completed by its ID.                                                         |
| `delete_goal`   | Permanently remove a goal by its ID.                                                     |

The pulse worker sorts pending goals by priority, selects one, and asks the configured main agent to work on it. Its prompt requests a memory recall and an experience record; model execution and tool availability still determine what happens. The goal manager stores records under the process working directory's `data/goals.json`.

`record_experience` and `recall_experiences` use a separate JSON-backed store under `data/experiences.json`. Recall uses simple keyword matching over recorded goal titles and lesson text; it is not the same as semantic workspace-memory search. See [Memory](/neer-documentation/concepts/memory).

## Scheduling and operational behavior

The pulse worker schedules its next check sooner when activity is high and more slowly when the system is idle. It can recover an active goal that has not been updated for 30 minutes. When there are no pending goals, it can ask the main agent for an idle reflection, at most once per hour per worker lifetime. These intervals are implementation details and may change with the source.

The live proactive loop checks every 10 seconds, but that does not mean it sends a message every 10 seconds. It applies a production inactivity threshold, a cooldown, and checks for in-flight agent and cron work before asking its intent logic whether to act or remain silent. `NEER_DEV=1` shortens some development timers.

## What this does not promise

- A goal will be completed without model, tool, filesystem, and provider availability.
- The system continuously learns from conversations or updates model weights.
- Every interaction is saved to the goal or experience stores.
- Setting `NEER_AUTONOMOUS_MODE=false` disables all background agent activity.
- The experimental `ui-next/` Cognitive Pulse screen displays the live goal queue or a complete event timeline. See [Cognitive State](/neer-documentation/interface/cognitive-state).

## Related

[Architecture](/neer-documentation/concepts/architecture) · [Agents](/neer-documentation/concepts/agents) · [Memory](/neer-documentation/concepts/memory) · [Monitoring](/neer-documentation/interface/monitoring) · [Cognitive Roadmap](/neer-documentation/roadmap/cognitive-roadmap)
