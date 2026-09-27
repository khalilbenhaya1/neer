# Cognitive roadmap

This roadmap separates capabilities present in the repository from directions that are still being developed or planned. Status labels below describe the code inspected for this documentation pass; they are not release commitments or a substitute for a published milestone schedule.

## Implemented foundation

The repository contains the operational foundation for agent workflows: Gateway coordination, configurable agents and model providers, workspace memory indexing and retrieval, skills and runtime tools, channel adapters, browser Control UI, heartbeat controls, cron scheduling, and operational CLI commands.

Identity and workspace instructions are also implemented. The repository does not identify a formal milestone closure or completion date for the original Persona & Behavioral Stability phase, so that milestone should be treated as unverified even though related building blocks exist.

## Active direction: Cognitive Pulse

The existing project roadmap identifies a Cognitive Pulse direction. Current code provides Gateway heartbeat behavior and a ui-next/ prototype screen. It does not implement the screen's represented goal queue, reflective timeline, or full pulse engine. Those parts remain planned; the active label here describes the roadmap direction, not shipped functionality.

## Planned phases

- **Memory Architecture:** broader memory organization and lifecycle beyond the implemented workspace Markdown index and search backends.
- **Autonomous Action Layer:** persistent goal management and multi-step planning beyond current agent turns, heartbeat events, and scheduled cron jobs.
- **Economic Intelligence:** a future product direction; no corresponding economic-analysis engine was verified in the repository.
- **Meta-Cognitive Layer:** a future direction for introspection and adaptation; no general self-evaluation engine was verified.

## How to read status

Use [Cognitive State](/neer-documentation/interface/cognitive-state) for current heartbeat signals and prototype limits. Use [Architecture](/neer-documentation/concepts/architecture) for implemented execution flow. A page or UI route alone does not establish that a roadmap feature is implemented.

## Related

[Cognitive Core](/neer-documentation/concepts/cognitive-core) · [Memory](/neer-documentation/concepts/memory) · [Monitoring](/neer-documentation/interface/monitoring)
