---
title: "Memory"
description: "Index and search workspace Markdown with NEER's configured memory backend."
---

# Memory

NEER memory is workspace-backed context that an agent can retrieve through the memory tools. It is separate from the live conversation session and does not mean every exchange is automatically stored or recalled.

## What is implemented

The built-in backend, which is the default, indexes Markdown files in the agent workspace, including MEMORY.md and memory/\*.md. When available to the agent, the memory_search and memory_get tools retrieve indexed context. A QMD backend is also supported in configuration. Indexing and retrieval behavior depends on the selected backend and its embedding/search requirements.

The repository provides commands to inspect and refresh workspace memory:

```sh
pnpm neer memory status
pnpm neer memory index
pnpm neer memory search "deployment notes"
```

Use `pnpm neer memory --help` for options such as selecting an agent or forcing a rebuild. Indexing updates the searchable index; it does not create a retention policy or guarantee that every conversation is saved.

## Cognitive experience records

NEER also has a separate experience store used by the `record_experience` and `recall_experiences` agent tools. The current implementation writes JSON records under the process working directory's `data/experiences.json` and searches goal titles and lesson text with keyword matching. This store is distinct from workspace Markdown indexing and does not train or fine-tune a model. See [Cognitive Core](/neer-documentation/concepts/cognitive-core).

## Practical workflow

Keep durable notes in the workspace memory files, check the configured agent's workspace, then run memory index and search for a phrase you expect to retrieve. If results are missing, inspect memory status, confirm the active agent/workspace, and verify the selected backend is configured.

## Privacy boundary

Workspace memory files and indexes live in the configured environment, but generating embeddings may involve a configured provider. The experience store is also local to the process working directory. Review provider settings before indexing sensitive content and protect both state locations. See [Security Overview](/neer-documentation/security/overview).

## Related

[Agents](/neer-documentation/concepts/agents) · [Skills and Tools](/neer-documentation/concepts/skills-tools) · [Creating Agents](/neer-documentation/guides/creating-agents)
