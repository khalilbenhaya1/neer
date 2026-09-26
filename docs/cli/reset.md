---
summary: "CLI reference for `neer reset` (reset local state/config)"
read_when:
  - You want to wipe local state while keeping the CLI installed
  - You want a dry-run of what would be removed
title: "reset"
---

# `neer reset`

Reset local config/state (keeps the CLI installed).

```bash
neer reset
neer reset --dry-run
neer reset --scope config+creds+sessions --yes --non-interactive
```
