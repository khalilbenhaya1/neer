# Create a workspace skill

A skill is a set of instructions that NEER can load into an agent's context. It can describe a repeatable workflow, decision rules, and how to use tools that are already available. A skill does not add executable tools or permissions by itself.

## Create the skill file

In the selected agent workspace, create a directory under skills/ and add a SKILL.md file. Write when the workflow applies, then give ordered steps, required inputs, expected output, and important limits. Keep instructions specific enough that the agent can follow them without assuming access it does not have.

A minimal example:

```markdown
# Release notes

Use this workflow when asked to summarize changes for a release.

1. Read the requested commit range.
2. Group user-visible changes by area.
3. Exclude internal maintenance and unverified claims.
4. Return a concise draft with links to the relevant changes.
```

Check existing bundled skills for the supported optional frontmatter shape before adding metadata. Do not copy metadata keys from another skill format without verifying them.

## Validate discovery

```sh
pnpm neer skills check
pnpm neer skills list
pnpm neer skills info release-notes
```

If the skill is not listed, confirm the file is named SKILL.md, placed in the active agent's workspace skills/ directory, and readable by the NEER process. Review [Skills and Tools](/neer-documentation/concepts/skills-tools) for other skill locations and policy behavior.

## Related

[Agents](/neer-documentation/concepts/agents) · [Permissions](/neer-documentation/security/permissions)
