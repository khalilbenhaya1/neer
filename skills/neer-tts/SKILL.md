---
name: neer-tts
description: High-quality, local Text-to-Speech using Kokoro-ONNX (Windows/Linux/Mac compatible).
metadata:
  {
    "neer":
      {
        "emoji": "🗣️",
        "requires": { "bins": ["python", "python3"] },
        "install":
          [
            {
              "id": "pip-deps",
              "kind": "pip",
              "packages": ["kokoro-onnx", "soundfile", "fastapi", "uvicorn", "pydantic"],
              "label": "Install Kokoro-ONNX & Dependencies",
            },
          ],
      },
  }
---

# Neer TTS (Kokoro) 🗣️

Local, high-quality TTS running on your machine. No cloud API keys required.

## Setup

1.  **Install Dependencies**:
    ```bash
    pip install kokoro-onnx soundfile fastapi uvicorn pydantic
    ```
2.  **Download Model**:
    The script will automatically download the `kokoro-v0_19.onnx` model and voices.json on first run.

## Usage

### CLI

```bash
# Speak text
python3 {baseDir}/scripts/server.py --text "Hello world" --out output.wav
```

### Server Mode

Start the TTS server (for Neer to use):

```bash
python3 {baseDir}/scripts/server.py --serve --port 8000
```
