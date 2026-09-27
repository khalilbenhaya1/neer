# Contribute to NEER

Contributions should follow the existing architecture and repository checks. Before changing shared behavior, identify the affected runtime, UI, channel, and extension surfaces.

## Before editing

1. Read the relevant code and tests.
2. Check repository status so existing local changes remain untouched.
3. For channel, routing, allowlist, pairing, onboarding, or command-gating changes, consider built-in channels and extensions.
4. Keep documentation examples generic and verify commands, keys, and behaviors in source.

## Implement and validate

Use the existing TypeScript ESM patterns and colocated \*.test.ts files. Run relevant focused checks, then broader pnpm check, pnpm build, or pnpm test as the change warrants. See [Testing](/neer-documentation/development/testing).

For documentation edits, use root-relative Mintlify links without .md, follow existing page conventions, and verify targets. Keep user-specific hostnames, file paths, phone numbers, and credentials out of docs.

## Pull requests

Write a concise, action-oriented summary, explain the user-facing effect, and report validation results. Repository maintainer workflow and submission guidance are in the project contribution docs linked from the root docs tree.

## Related

[Setup](/neer-documentation/development/setup) · [Project Structure](/neer-documentation/development/project-structure) · [Testing](/neer-documentation/development/testing)
