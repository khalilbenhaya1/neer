import os
import argparse
import sys
from openai import OpenAI

def generate_image(prompt, output_path):
    client = OpenAI() # defaults to os.environ.get("OPENAI_API_KEY")

    try:
        response = client.images.generate(
            model="dall-e-3",
            prompt=prompt,
            size="1024x1024",
            quality="standard",
            n=1,
        )

        image_url = response.data[0].url
        
        # Download the image
        import requests
        img_data = requests.get(image_url).content
        with open(output_path, 'wb') as handler:
            handler.write(img_data)
        
        print(f"Image saved to {output_path}")
        return True
    
    except Exception as e:
        print(f"Error generating image: {e}", file=sys.stderr)
        return False

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate image using DALL-E 3")
    parser.add_argument("--prompt", required=True, help="Image prompt")
    parser.add_argument("--output", required=True, help="Output file path")
    
    args = parser.parse_args()
    
    if not os.environ.get("OPENAI_API_KEY"):
        print("Error: OPENAI_API_KEY environment variable is not set.", file=sys.stderr)
        sys.exit(1)

    success = generate_image(args.prompt, args.output)
    if not success:
        sys.exit(1)
