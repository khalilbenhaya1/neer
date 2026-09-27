# Test and check NEER changes

Choose checks that cover the code or documentation you changed. The repository uses Vitest for tests and Oxlint/Oxfmt for code quality; documentation has separate formatting and link checks.

## Common repository checks

```sh
pnpm check
pnpm build
pnpm test
```

pnpm check runs formatting, type checks, and lint. pnpm build creates distributable output. pnpm test runs the repository test suite. These can take time and may require platform-specific tooling for affected areas.

For faster iteration, inspect package.json for focused scripts such as pnpm test:fast or pnpm test:ui, and run the colocated Vitest file where appropriate. Do not raise the test worker count beyond repository guidance.

## Documentation checks

The global pnpm check:docs checks all tracked documentation. For a scoped change, pass only the relevant files to the formatter and Markdown linter, and run a link checker with the intended documentation scope. Do not assume the global docs script is a scoped check.

## Test-backed claims

A passing test demonstrates behavior in that test's conditions. It does not prove provider connectivity, every channel's capabilities, production security, or UI data completeness. Add or update tests when a code change requires coverage, and report checks that were not run.

## Related

[Development Setup](/neer-documentation/development/setup) · [Project Structure](/neer-documentation/development/project-structure) · [Contributing](/neer-documentation/development/contributing)
