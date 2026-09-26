import sys
import os
import json
import base64

# Ensure the current directory is in the Python path so we can import skills
# bridge.py is in neer/skills/media/comfyui/bridge.py
# We want to add 'neer' root to sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
# Go up 3 levels: comfyui -> media -> skills -> neer root
project_root = os.path.dirname(os.path.dirname(os.path.dirname(current_dir)))
if project_root not in sys.path:
    sys.path.append(project_root)

try:
    from skills.media.comfyui import ComfyUISkill, ImageGenerationRequest
except ImportError as e:
    print(json.dumps({"error": f"ImportError: {e}. Path: {sys.path}"}))
    sys.exit(1)

def main():
    try:
        # Read JSON from stdin
        input_data = sys.stdin.read()
        if not input_data:
            print(json.dumps({"error": "No input provided"}))
            return

        params = json.loads(input_data)
        
        # Initialize Skill
        skill = ComfyUISkill()
        
        # Map parameters
        prompt = params.get("prompt")
        if not prompt:
            print(json.dumps({"error": "Prompt is required"}))
            return

        request = ImageGenerationRequest(
            prompt=prompt,
            steps=params.get("steps", 20),
            cfg_scale=params.get("cfg_scale", 7.0),
            width=params.get("width", 512),
            height=params.get("height", 512),
            seed=params.get("seed"),
            negative_prompt=params.get("negative_prompt", "")
        )

        # Execute
        result = skill.generate_image(request)
        
        # Output result as JSON
        output = {
            "success": True,
            "images": result.images,
            "seed": result.seed,
            "execution_time": result.execution_time
        }
        print(json.dumps(output))

    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))

if __name__ == "__main__":
    main()
