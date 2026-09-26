---
name: director
description: Orchestrates content creation workflows (Script -> TTS -> Images -> Video).
metadata:
  {
    "neer":
      {
        "emoji": "🎬",
        "requires": { "bins": ["python", "python3"], "env": ["OPENAI_API_KEY"] },
      },
  }
---

# Director 🎬

The Director skill automates the creation of short video content.

## Workflow
1.  **Ideation**: Generates a video script and scene manifest from a topic.
2.  **Asset Generation**: 
    -   Calls `media-gen` for images.
    -   Calls `neer-tts` for audio.
3.  **Assembly**: Calls `video-creator` to stitch everything together.

## Usage

```bash
# Create a video about a topic
python3 scripts/action.py --topic "The history of coffee" --output "coffee_history.mp4"
```
