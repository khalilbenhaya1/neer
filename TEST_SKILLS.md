# How to Test Neer's New Skills

Here is how you can try out the new capabilities I added.

## 1. Setup Dependencies
First, ensure you have the required Python libraries for the TTS engine.

```powershell
pip install kokoro-onnx soundfile fastapi uvicorn pydantic
```

## CLI Examples with `neer agent --agent main`

```bash
# Vibe Coding
neer agent --agent main --message "Build a login page" --skill vibe-coding
```
<!-- slide -->
```bash
# Text to Speech
neer agent --agent main --message "/neer-tts Hello from Neer"
```
<!-- slide -->
```bash
# Video Creation
neer agent --agent main --message "Create a video from this script" --skill video-creator
```
<!-- slide -->
```bash
# Video Creation (Director)
neer agent --agent main --message "Director: Create a video about space exploration" --skill director
# OR
python skills/director/scripts/action.py --topic "Space Exploration"
```
<!-- slide -->
```bash
# Screen Share
# (Requires frontend integration, currently backend ready)
neer agent --agent main --message "Start prompt with screen context" --skill screen-share
```

## 2. Try Text-to-Speech (TTS) 🗣️
This will generate a spoken audio file using the high-quality Kokoro model.

```powershell
# Run this in your terminal
python skills/neer-tts/scripts/server.py --text "Hello Neer, this is a test of the new voice system." --out test_voice.wav
```
*Check the folder for `test_voice.wav`. On Windows, it will play automatically!*

## 3. Try Video Creator 🎬
This creates a video from an image and audio. We'll generate a dummy image first so you have something to test with.

```powershell
# 1. Create a dummy image (requires ffmpeg)
ffmpeg -y -f lavfi -i color=c=blue:s=1280x720 -frames:v 1 background.png

# 2. Create a simple manifest file
echo '{"scenes":[{"image":"background.png","duration":3,"text":"Hello User"}],"output":"my_video.mp4"}' > my_script.json

# 3. Create the video
python skills/video-creator/scripts/assemble.py --manifest my_script.json
```
*Check for `my_video.mp4`!*

## 4. Vibe Coding ✨
This is a persona integration. To use it, you would typically configure your agent to use the "Vibe" prompt. Since this is a new skill definition, you can manually invoke it if you are using the Neer CLI agent:

```bash
# If you are using the CLI agent
neer run --skill vibe-coding "Build a simple html page"
```
*(Note: This depends on how your specific Neer instance loads skills).*
