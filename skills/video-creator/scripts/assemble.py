import argparse
import json
import subprocess
import os
import shutil

def assemble_video(manifest_path):
    with open(manifest_path, 'r') as f:
        data = json.load(f)

    scenes = data.get("scenes", [])
    output_filename = data.get("output", "output.mp4")
    
    # Create temporary file list for ffmpeg concat
    # We will create individual clips for each scene, then concat them.
    # Clip creation: loop image for duration of audio (or explicit duration) + combine with audio
    
    temp_dir = "temp_clips"
    if os.path.exists(temp_dir):
        shutil.rmtree(temp_dir)
    os.makedirs(temp_dir)

    clip_files = []

    for i, scene in enumerate(scenes):
        image = scene["image"]
        audio = scene.get("audio")
        duration = scene.get("duration")
        text = scene.get("text", "")
        
        clip_name = os.path.join(temp_dir, f"clip_{i:03d}.mp4")
        
        # Command construction
        # Base: input image, loop it.
        cmd = ["ffmpeg", "-y", "-loop", "1", "-i", image]
        
        # If audio exists, input audio
        if audio:
            cmd.extend(["-i", audio])
            # Shortest determines length (image loops infinitely, so audio length cuts it)
            # cmd.extend(["-shortest"])
            # Better approach: use audio duration
            # But -shortest with loop image works well usually.
            cmd.extend(["-c:v", "libx264", "-tune", "stillimage", "-c:a", "aac", "-b:a", "192k", "-pix_fmt", "yuv420p", "-shortest"])
        else:
            # Silent scene with duration
            if not duration:
                duration = 5 # default
            cmd.extend(["-t", str(duration)])
            cmd.extend(["-c:v", "libx264", "-tune", "stillimage", "-pix_fmt", "yuv420p"])
            # Generate silent audio for concat compatibility? 
            # Often concat fails if some clips have audio and others don't.
            # Let's add silent audio filter
            cmd.extend(["-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=44100", "-shortest"])

        # Add text overlay? (Simple implementation)
        if text:
            # Escaping for filter is painful in raw ffmpeg cli via python list, but let's try basic.
            # drawtext=text='Hello':fontcolor=white:fontsize=24:x=(w-text_w)/2:y=(h-text_h)/2
            # We need a font file usually. Defaults might fail on Windows.
            # Skipping text overlay for MVP to avoid "Font not found" errors.
            pass

        cmd.append(clip_name)
        
        print(f"Generating clip {i}...")
        subprocess.run(cmd, check=True)
        clip_files.append(clip_name)

    # Concat clips
    # Create list file
    list_path = os.path.abspath(os.path.join(temp_dir, "list.txt"))
    with open(list_path, "w") as f:
        for clip in clip_files:
            # ffmpeg requires safe paths. usage of absolute paths is best with safe 0.
            # escape backslashes for windows
            abs_clip = os.path.abspath(clip).replace("\\", "/")
            f.write(f"file '{abs_clip}'\n")

    print("Concatenating clips...")
    # ffmpeg -f concat -safe 0 -i list.txt -c copy output.mp4
    # Run in original CWD, use absolute path for list
    cmd = ["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", list_path, "-c", "copy", output_filename]
    subprocess.run(cmd, check=True)
    
    # Cleanup
    shutil.rmtree(temp_dir)
    print(f"Video saved to {output_filename}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", required=True, help="Path to script.json")
    args = parser.parse_args()
    
    assemble_video(args.manifest)
