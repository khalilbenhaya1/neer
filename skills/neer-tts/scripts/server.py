import argparse
import os
import sys
import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from kokoro_onnx import Kokoro
import soundfile as sf

# Configuration
MODEL_PATH = "kokoro-v0_19.onnx"
VOICES_PATH = "voices.json"
DEFAULT_VOICE = "af_sarah" # A good default female voice

app = FastAPI()
kokoro = None

class TTSRequest(BaseModel):
    text: str
    voice: str = DEFAULT_VOICE
    speed: float = 1.0

def load_model():
    global kokoro
    if not os.path.exists(MODEL_PATH):
        print(f"Downloading model to {os.getcwd()}...")
        # In a real scenario, we'd automate this download or ask the user to do it.
        # For this script, we assume the user follows the setup or we could add wget.
        # For simplicity, let's assume the user runs the install step which fetches it.
        # Actually, let's try to fetch it if missing using standard library to be helpful.
        import urllib.request
        urllib.request.urlretrieve("https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files/kokoro-v0_19.onnx", MODEL_PATH)
        urllib.request.urlretrieve("https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files/voices.json", VOICES_PATH)
        print("Model downloaded.")

    kokoro = Kokoro(MODEL_PATH, VOICES_PATH)

@app.post("/tts")
async def generate_tts(req: TTSRequest):
    if not kokoro:
        load_model()
    
    try:
        samples, sample_rate = kokoro.create(
            req.text, 
            voice=req.voice, 
            speed=req.speed, 
            lang="en-us"
        )
        # We need to return audio. For simplicity in this skill, let's save to a temp file or return bytes?
        # Returning bytes is better for API, but for Neer file usage, saving to a known path is easier.
        # Let's return the simplified audio bytes (or base64) if this was a full API.
        # But this is "skills" -> usually CLI or file based.
        # Let's just save to 'output.wav' in current dir for now and return success.
        
        # Actually, let's just return a success message and path.
        out_path = "output.wav"
        sf.write(out_path, samples, sample_rate)
        return {"status": "success", "path": os.path.abspath(out_path)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def cli_mode(text, out_path, voice):
    load_model()
    samples, sample_rate = kokoro.create(
        text, 
        voice=voice, 
        speed=1.0, 
        lang="en-us"
    )
    sf.write(out_path, samples, sample_rate)
    print(f"Generated audio at {out_path}")
    
    # Auto-play on Windows
    if os.name == 'nt':
        try:
            import winsound
            winsound.PlaySound(out_path, winsound.SND_FILENAME)
        except Exception as e:
            print(f"Could not play audio: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Neer TTS (Kokoro)")
    parser.add_argument("--serve", action="store_true", help="Run as API server")
    parser.add_argument("--port", type=int, default=8000, help="Server port")
    parser.add_argument("--text", type=str, help="Text to speak (CLI mode)")
    parser.add_argument("--out", type=str, default="output.wav", help="Output file (CLI mode)")
    parser.add_argument("--voice", type=str, default=DEFAULT_VOICE, help="Voice ID")

    args = parser.parse_args()

    if args.serve:
        load_model()
        uvicorn.run(app, host="0.0.0.0", port=args.port)
    elif args.text:
        cli_mode(args.text, args.out, args.voice)
    else:
        parser.print_help()
