---
title: "Skills and tools"
description: "Extend agents with instruction-based skills and runtime tools controlled by policy."
---

# Skills and tools

Skills and tools serve different purposes in NEER. A skill is a SKILL.md instruction bundle that helps an agent follow a workflow. A tool is a runtime operation the agent can call when it is available and allowed by policy. A skill does not automatically grant a tool or operating-system permission.

## Inspect skills

```sh
pnpm neer skills list
pnpm neer skills info <skill-name>
pnpm neer skills check
```

Skills can be loaded from bundled, managed, personal, project, workspace, and configured extra directories. Which copy wins depends on the loader's source precedence; check skills info and the workspace when diagnosing a conflict.

## Create a workspace skill

Create a directory under the agent workspace's skills/ directory and add a SKILL.md. The file should explain when the workflow applies and give the agent ordered, concrete instructions. Optional YAML frontmatter can name the skill; follow the shape used by existing bundled skills rather than inventing metadata fields. Then run pnpm neer skills check and confirm it appears in pnpm neer skills list.

## Tool access and policy

Tools are supplied by the NEER runtime and extensions. Their availability depends on the active agent, loaded extensions, and execution/security configuration. The runtime also registers goal and experience tools such as `create_goal`, `list_goals`, `complete_goal`, `delete_goal`, `record_experience`, and `recall_experiences`; effective tool policy can restrict their use. Review [Cognitive Core](/neer-documentation/concepts/cognitive-core) and [Permissions](/neer-documentation/security/permissions) before enabling actions that can modify files, run commands, or interact with external systems.

## Related

[Creating Skills](/neer-documentation/guides/creating-skills) · [Agents](/neer-documentation/concepts/agents) · [Security Overview](/neer-documentation/security/overview)
