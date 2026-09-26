---
name: video-creator
description: Assemble videos from images, audio, and subtitles using ffmpeg.
metadata:
  {
    "neer":
      {
        "emoji": "🎬",
        "requires": { "bins": ["ffmpeg", "python", "python3"] },
      },
  }
---

# Video Creator 🎬

Stitch together images, audio (TTS), and text into a final video.

## Usage

1.  **Prepare a manifest (script.json)**:
    ```json
    {
      "scenes": [
        {
          "image": "image1.png",
          "audio": "audio1.wav",
          "duration": 5.0,
          "text": "Hello world"
        },
        {
          "image": "image2.png",
          "audio": "audio2.wav",
          "duration": 3.0,
          "text": "This is a cat"
        }
      ],
      "output": "final_video.mp4"
    }
    ```

2.  **Run Assembly**:
    ```bash
    python3 {baseDir}/scripts/assemble.py --manifest script.json
    ```
