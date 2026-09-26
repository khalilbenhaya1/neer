import sys
import os

# Ensure the current directory is in the Python path
sys.path.append(os.getcwd())

from skills.media.comfyui import ComfyUISkill, ImageGenerationRequest

def main():
    print("🚀 Initializing ComfyUI Skill...")
    try:
        skill = ComfyUISkill()
    except Exception as e:
        print(f"❌ Failed to initialize skill: {e}")
        print("💡 Ensure ComfyUI matches the address in adapter.py (default 127.0.0.1:8188)")
        return

    prompt = "cyberpunk street scene, neon lights, rain, high detail, 8k"
    print(f"🎨 Generating image for prompt: '{prompt}'...")

    request = ImageGenerationRequest(
        prompt=prompt,
        steps=20,
        cfg_scale=7.0,
        width=512,
        height=512
    )

    try:
        result = skill.generate_image(request)
        print(f"✅ Generation complete in {result.execution_time:.2f}s")
        
        # Save the result
        for idx, b64_img in enumerate(result.images):
            import base64
            filename = f"output_{idx}.png"
            with open(filename, "wb") as f:
                f.write(base64.b64decode(b64_img))
            print(f"💾 Saved image to {filename}")

    except Exception as e:
        print(f"❌ Generation failed: {e}")

if __name__ == "__main__":
    main()
