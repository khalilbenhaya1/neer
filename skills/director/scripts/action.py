import argparse
import subprocess
import json
import os
import sys
import shutil

def run_command(cmd, cwd=None):
    try:
        # shell=True for windows to find 'neer' if it's a batch file/cmd alias
        result = subprocess.run(cmd, shell=True, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, cwd=cwd)
        return result.stdout.decode('utf-8').strip()
    except subprocess.CalledProcessError as e:
        print(f"Error running command: {cmd}")
        print(e.stderr.decode('utf-8'))
        return None

def main():
    parser = argparse.ArgumentParser(description="Director: Create video from topic")
    parser.add_argument("--topic", required=True, help="Video topic")
    parser.add_argument("--output", default="output.mp4", help="Output video path")
    
    args = parser.parse_args()
    
    # 1. Generate Script via LLM
    print(f"🎬 Director: Generating script for topic '{args.topic}'...")
    
    system_prompt = (
        "You are a creative video producer. "
        "Generate a JSON manifest for a short video (3-5 scenes). "
        "Strictly output ONLY valid JSON. "
        "Schema: { \"scenes\": [ { \"description\": \"Visual description for DALL-E image generation\", \"narration\": \"Text for TTS\" } ] }"
    )
    
    # We use 'neer agent' to leverage the user's configured model
    # --json flag ensures JSON output from the CLI wrapper, but the agent's content is inside payloads. 
    # Actually, neer agent --json returns the whole response object.
    # We'll use a simple --message and hope for the best, or parse the JSON output of the CLI.
    # Let's try to get raw text. 'neer agent' output is usually the text response.
    # Wait, 'neer agent --message ...' prints the response.
    # We should ensure no extra logs.
    
    prompt = f"Create a video script about: {args.topic}"
    
    # Construct command
    # We use --json to get structured response from CLI, then parse 'payloads'.
    agent_cmd = f'neer agent --agent main --message "{prompt}" --extra-system-prompt "{system_prompt}" --json'
    
    agent_output = run_command(agent_cmd)
    if not agent_output:
        print("Failed to generate script from agent.")
        sys.exit(1)
        
    try:
        agent_resp = json.loads(agent_output)
        # Extract text from payloads
        # Structure: { result: { payloads: [ { text: "..." } ] } }
        text_content = ""
        if "result" in agent_resp and "payloads" in agent_resp["result"]:
            for p in agent_resp["result"]["payloads"]:
                if "text" in p:
                    text_content += p["text"]
        
        # Now text_content should be the JSON from logic.
        # It might be wrapped in ```json ... ```
        clean_json = text_content.strip()
        if clean_json.startswith("```json"):
            clean_json = clean_json.split("```json")[1]
        if clean_json.endswith("```"):
            clean_json = clean_json.split("```")[0]
        
        script_data = json.loads(clean_json)
        
    except Exception as e:
        print(f"Failed to parse agent response: {e}")
        print(f"Raw output: {agent_output}")
        sys.exit(1)
        
    scenes = script_data.get("scenes", [])
    if not scenes:
        print("No scenes generated.")
        sys.exit(1)
        
    print(f"📝 Generated {len(scenes)} scenes.")
    
    # 2. Asset Generation
    work_dir = "director_work"
    if os.path.exists(work_dir):
        shutil.rmtree(work_dir)
    os.makedirs(work_dir)
    
    # Resolve paths to other skills scripts
    # We assume we are running from 'neer' root or similar. 
    # But skills might be installed anywhere.
    # For now, let's assume standard layout: ../media-gen/..., ../neer-tts/...
    # Or better, search relative to this script.
    
    script_dir = os.path.dirname(os.path.abspath(__file__))
    # skills/director/scripts -> skills/
    skills_dir = os.path.dirname(os.path.dirname(script_dir)) 
    
    media_gen_script = os.path.join(skills_dir, "media-gen", "scripts", "generate.py")
    tts_script = os.path.join(skills_dir, "neer-tts", "scripts", "server.py")
    assembler_script = os.path.join(skills_dir, "video-creator", "scripts", "assemble.py")
    
    final_manifest = { "output": os.path.abspath(args.output), "scenes": [] }
    
    for i, scene in enumerate(scenes):
        print(f"🎨 Processing Scene {i+1}...")
        
        desc = scene.get("description", "")
        narration = scene.get("narration", "")
        
        img_path = os.path.abspath(os.path.join(work_dir, f"scene_{i}.png"))
        audio_path = os.path.abspath(os.path.join(work_dir, f"scene_{i}.wav"))
        
        # Generate Image
        print(f"   Generating image: {desc[:30]}...")
        # Quote arguments to avoid shell issues
        # Use python explicitly
        cmd = f'python "{media_gen_script}" --prompt "{desc}" --output "{img_path}"'
        if not run_command(cmd):
            print("   Image generation failed. Skipping scene.")
            continue
            
        # Generate Audio
        print(f"   Generating audio: {narration[:30]}...")
        cmd = f'python "{tts_script}" --text "{narration}" --out "{audio_path}"'
        if not run_command(cmd):
            print("   Audio generation failed. Skipping scene.")
            continue
            
        final_manifest["scenes"].append({
            "image": img_path,
            "audio": audio_path,
            "text": narration
        })
        
    # 3. Assembly
    print("🎬 Assembling final video...")
    manifest_path = os.path.join(work_dir, "manifest.json")
    with open(manifest_path, "w") as f:
        json.dump(final_manifest, f, indent=2)
        
    cmd = f'python "{assembler_script}" --manifest "{manifest_path}"'
    res = run_command(cmd)
    
    if res:
        print(f"✅ Video created: {args.output}")
    else:
        print("❌ Assembly failed.")
        
    # Cleanup? Maybe keep for debug for now.
    # shutil.rmtree(work_dir)

if __name__ == "__main__":
    main()
