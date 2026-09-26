import argparse
import os
from moviepy import ImageClip

def create_video_from_image(image_path, output_path, duration=5):
    """
    Creates a video from a single image.
    """
    try:
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Image not found at {image_path}")

        # Create a clip from the image
        clip = ImageClip(image_path, duration=duration)
        
        # Set fps (required for write_videofile)
        clip.fps = 24

        # Write the video file
        # codec='libx264' is standard for mp4
        clip.write_videofile(output_path, codec='libx264', fps=24)
        
        print(f"Video created successfully: {output_path}")

    except Exception as e:
        print(f"Error creating video: {e}")
        exit(1)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Convert an image to a video clip.")
    parser.add_argument("--image", required=True, help="Path to the input image.")
    parser.add_argument("--output", required=True, help="Path to the output video file.")
    parser.add_argument("--duration", type=int, default=5, help="Duration of the video in seconds.")
    
    args = parser.parse_args()
    
    create_video_from_image(args.image, args.output, args.duration)
