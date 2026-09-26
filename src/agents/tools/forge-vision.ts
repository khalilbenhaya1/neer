
import { Type, Static, TObject } from "@sinclair/typebox";
import * as fs from "node:fs";
import * as path from "node:path";
import { exec } from "node:child_process";
import * as util from "node:util";
import type { AgentTool } from "@mariozechner/pi-agent-core";

const execAsync = util.promisify(exec);

// Helper to create tools with proper typing - copied/adapted from image-generation.ts
function createTool<T extends TObject>(config: {
    name: string;
    description: string;
    parameters: T;
    execute: (params: Static<T>) => Promise<any>;
}): AgentTool<T, unknown> {
    return {
        name: config.name,
        description: config.description,
        parameters: config.parameters,
        execute: async (_id: string, params: any) => {
            const result = await config.execute(params);
            return result;
        }
    } as any;
}

// SD Forge API Config
const SD_API_URL = "http://127.0.0.1:7860/sdapi/v1/txt2img";
const OUTPUT_DIR = "c:/Users/khali/OneDrive/Desktop/Neer-folder/neer/assets/auto_posts"; // Use absolute path safely

// Video generation script path
const MAKE_VIDEO_SCRIPT = "c:/Users/khali/OneDrive/Desktop/Neer-folder/neer/scripts/make_video.py";

async function generateLocalImage(prompt: string, negativePrompt?: string): Promise<string> {
    const payload = {
        prompt: prompt,
        negative_prompt: negativePrompt || "low quality, bad anatomy, worst quality, lowres",
        steps: 25, // Reasonable default
        width: 512, // Standard SD 1.5/SDXL resolution base. 
        height: 768, // Portrait for TikTok/Vertical video
        cfg_scale: 7,
        sampler_name: "DPM++ 2M Karras", // Good general purpose sampler
        // Overrides for optimization (Xformers/Cuda-Malloc are usually server-side flags, 
        // but we can try setting them if the API supports override_settings)
        override_settings: {
            sd_model_checkpoint: "realisticVisionV60B1_v51VAE.safetensors", // Trying to request specific model
            // "Xformers" and "Cuda-Malloc" are typically launch arguments, not API settings.
            // But we will assume the server is running with them as requested.
        }
    };

    try {
        console.log(`Generating image with prompt: ${prompt}`);
        const response = await fetch(SD_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`SD API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        if (!data.images || data.images.length === 0) {
            throw new Error("No images returned from SD API");
        }

        // Base64 decoding
        const imageBase64 = data.images[0];
        const buffer = Buffer.from(imageBase64, 'base64');

        // Save
        if (!fs.existsSync(OUTPUT_DIR)) {
            fs.mkdirSync(OUTPUT_DIR, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const safePrompt = prompt.replace(/[^a-z0-9]/gi, "_").substring(0, 30);
        const filename = `influencer_${timestamp}_${safePrompt}.png`;
        const filepath = path.join(OUTPUT_DIR, filename);

        fs.writeFileSync(filepath, buffer);
        console.log(`Saved image to: ${filepath}`);

        return filepath;

    } catch (error: any) {
        console.error("Image generation failed:", error);
        throw new Error(`Failed to generate image: ${error.message}`);
    }
}

async function convertToVideo(imagePath: string): Promise<string> {
    const outputFilename = parseVideoPath(imagePath);
    const cmd = `python "${MAKE_VIDEO_SCRIPT}" --image "${imagePath}" --output "${outputFilename}" --duration 5`;

    try {
        console.log(`Converting to video: ${cmd}`);
        await execAsync(cmd);
        return outputFilename;
    } catch (error: any) {
        console.error("Video conversion failed:", error);
        throw new Error(`Failed to convert image to video: ${error.message}`);
    }
}

function parseVideoPath(imagePath: string): string {
    const ext = path.extname(imagePath);
    return imagePath.replace(ext, ".mp4");
}

function generateMetadata(prompt: string) {
    // Simple logic for now. Could call an LLM here for better captions.
    const caption = `Trending now! ${prompt} #viral #trending #fyp #aiart`;
    return caption;
}

export const generateInfluencerContentTool = createTool({
    name: "generate_influencer_content",
    description: "Generates a 5-second vertical video based on a trending TikTok theme using local Stable Diffusion and MoviePy. Saves to /assets/auto_posts/.",
    parameters: Type.Object({
        theme: Type.String({ description: "The theme or prompt for the content (e.g., 'cyberpunk street fashion', 'cozy rain vibes')." }),
        negative_prompt: Type.Optional(Type.String({ description: "Things to avoid in the image." })),
    }),
    execute: async (params) => {
        try {
            // 1. Generate Image
            const imagePath = await generateLocalImage(params.theme, params.negative_prompt);

            // 2. Convert to Video
            const videoPath = await convertToVideo(imagePath);

            // 3. Generate Metadata
            const caption = generateMetadata(params.theme);
            const metadataPath = videoPath.replace(".mp4", ".txt");
            fs.writeFileSync(metadataPath, caption);

            return {
                content: [{
                    type: "text",
                    text: `Successfully generated influencer content!\n\nImage: ${imagePath}\nVideo: ${videoPath}\nMetadata: ${metadataPath}\nCaption: ${caption}`
                }],
            };
        } catch (error: any) {
            return {
                isError: true,
                content: [{ type: "text", text: `Error generating content: ${error.message}` }],
            };
        }
    },
});
