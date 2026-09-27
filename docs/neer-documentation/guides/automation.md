---
title: "Schedule work with cron"
description: "Create, inspect, and manage Gateway cron jobs for system events or agent turns."
---

# Schedule work with cron

NEER's Gateway includes a cron scheduler for one-time, interval-based, or five-field cron jobs. Jobs can enqueue a system event in the main session or send a message as an agent turn. The Gateway must be running for scheduled jobs to execute. Cron is separate from the Cognitive Pulse worker and the live proactive loop described in [Cognitive Core](/neer-documentation/concepts/cognitive-core).

## Add a recurring agent job

This example schedules a message each weekday morning in UTC:

```sh
pnpm neer cron add --name "weekday-summary" --cron "0 9 * * 1-5" --tz "Etc/UTC" --session isolated --message "Summarize the current project notes."
```

The name is required. Choose exactly one schedule (--at, --every, or --cron) and exactly one payload (--system-event or --message). An isolated agent turn runs in its own session context. Add --agent AGENT_ID when the job should use a specific configured agent.

A one-time job can use an ISO time or relative duration such as --at 20m; an interval can use a duration such as --every 1h. Check pnpm neer cron add --help for delivery and model options.

## Review and remove jobs

```sh
pnpm neer cron list
pnpm neer cron status
```

Use `pnpm neer cron --help` to inspect edit and remove commands. Scheduled work only has the capabilities of its agent, model, tools, and channel configuration. Cron is a scheduler; it does not guarantee agent task completion.

## Related

[Agents](/neer-documentation/concepts/agents) · [Gateway](/neer-documentation/concepts/gateway) · [Permissions](/neer-documentation/security/permissions) · [Cognitive Roadmap](/neer-documentation/roadmap/cognitive-roadmap)
