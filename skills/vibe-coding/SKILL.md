---
name: vibe-coding
description: Enter a high-velocity "Vibe Coding" flow state. Minimal friction, maximum output.
metadata:
  {
    "neer":
      {
        "emoji": "✨",
        "requires": { "anyBins": ["codex", "claude"] },
      },
  }
---

# Vibe Coding ✨

Vibe Coding is about **flow**. It's coding without the friction. You describe the *vibe* or the *outcome*, and the agent handles the implementation details.

## Usage

Use the `vibe` command to start a session.

```bash
# Start a vibe session (uses your default coding agent)
neer vibe "Make the homepage pop with some glassmorphism"

# Specific instructions
neer vibe --mode "fast" "Fix the login bug, don't ask questions, just do it"
```

## The Vibe Persona

When in Vibe Mode, the agent:

1.  **Assumes competence**: Doesn't explain basic concepts.
2.  **Acts autonomously**: Makes reasonable decisions without asking for permission on every small detail.
3.  **Focuses on outcome**: Prioritizes "working code" and "good UX" over pedantic architectural debates (unless critical).
4.  **Keeps it brief**: Updates are short. "Done.", "Fixed.", "Deploying."

## Examples

### rapid prototyping

```bash
neer vibe "Spin up a Next.js app with Tailwind. I want a landing page for a dog walking service called 'Paws & Paths'. Use a warm color palette."
```

### rapid fix

```bash
neer vibe "The footer is broken on mobile. Fix it. YOLO."
```

## Configuration

You can set your preferred "vibe" level in `~/.neer/config.toml`:

```toml
[skills.vibe-coding]
default_agent = "claude" # or "codex"
prolixity = "minimal"    # "minimal", "normal", "verbose"
safety = "yolo"          # "safe", "yolo" (auto-approves executing commands)
```
