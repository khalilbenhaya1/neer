# Memory

NEER memory is workspace-backed context that an agent can retrieve through the memory tools. It is separate from the live conversation session and does not mean every exchange is automatically stored or recalled.

## What is implemented

The built-in backend, which is the default, indexes Markdown files in the agent workspace, including MEMORY.md and memory/\*.md. When available to the agent, the memory_search and memory_get tools retrieve indexed context. A QMD backend is also supported in configuration. Indexing and retrieval behavior depends on the selected backend and its embedding/search requirements.

The repository provides commands to inspect and refresh memory:

```sh
pnpm neer memory status
pnpm neer memory index
pnpm neer memory search "deployment notes"
```

Use pnpm neer memory --help for options such as selecting an agent or forcing a rebuild. Indexing updates the searchable index; it does not create a memory policy or guarantee automatic retention.

## Practical workflow

Keep durable notes in the workspace memory files, check the configured agent's workspace, then run memory index and search for a phrase you expect to retrieve. If results are missing, inspect memory status, confirm the active agent/workspace, and verify the selected backend is configured.

## Privacy boundary

Memory files and indexes live in the configured environment, but generating embeddings may involve a configured provider. Review provider settings before indexing sensitive content. See [Security Overview](/neer-documentation/security/overview).

## Related

[Agents](/neer-documentation/concepts/agents) · [Skills and Tools](/neer-documentation/concepts/skills-tools) · [Creating Agents](/neer-documentation/guides/creating-agents)
