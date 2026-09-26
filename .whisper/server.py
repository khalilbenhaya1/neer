"""
NEER Local Whisper STT Server
Loaded once at startup — base model only.
Endpoint: POST /speech-to-text
"""

import sys
import os
import tempfile
import traceback

# Ensure we can import from our venv
script_dir = os.path.dirname(os.path.abspath(__file__))
site_packages = os.path.join(script_dir, "venv", "Lib", "site-packages")
if site_packages not in sys.path:
    sys.path.insert(0, site_packages)

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
import uvicorn
import whisper
import io

app = FastAPI(title="NEER Whisper STT", version="1.0.0")

# Load model once at startup
MODEL_NAME = os.environ.get("WHISPER_MODEL", "base")
print(f"[whisper-server] Loading Whisper model: {MODEL_NAME}", flush=True)
try:
    model = whisper.load_model(MODEL_NAME)
    print(f"[whisper-server] Model '{MODEL_NAME}' loaded successfully.", flush=True)
except Exception as e:
    print(f"[whisper-server] FATAL: Failed to load model: {e}", flush=True)
    sys.exit(1)


@app.get("/health")
def health():
    return {"status": "ok", "model": MODEL_NAME}


@app.post("/speech-to-text")
async def speech_to_text(audio: UploadFile = File(...)):
    """
    Accept an audio file upload, transcribe with Whisper, and return text + language.
    """
    tmp_path = None
    try:
        # Write uploaded bytes to a temp file
        content = await audio.read()
        if len(content) == 0:
            raise HTTPException(status_code=400, detail="Empty audio file")

        # Use the original filename extension to help pydub/ffmpeg pick the right decoder
        suffix = os.path.splitext(audio.filename or "audio.webm")[1] or ".webm"

        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        # Transcribe
        result = model.transcribe(tmp_path, fp16=False)
        text = (result.get("text") or "").strip()
        language = result.get("language") or "unknown"

        return JSONResponse({"text": text, "language": language})

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.unlink(tmp_path)
            except Exception:
                pass


if __name__ == "__main__":
    port = int(os.environ.get("WHISPER_PORT", "8778"))
    print(f"[whisper-server] Starting on port {port}", flush=True)
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="warning")
