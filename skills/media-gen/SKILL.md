---
name: media-gen
description: Generate visual assets (images) for content creation.
metadata:
  {
    "neer":
      {
        "emoji": "🎨",
        "requires": { "bins": ["python", "python3"], "env": ["OPENAI_API_KEY"] },
      },
  }
---

# Media Gen 🎨

Generates images using OpenAI DALL-E 3.

## Usage

```bash
# Generate an image
python3 scripts/generate.py --prompt "A futuristic city with flying cars" --output "city.png"
```
