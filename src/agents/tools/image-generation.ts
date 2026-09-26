
import { Static, TObject, Type } from "@sinclair/typebox";
import * as fs from "node:fs";
import * as path from "node:path";
import type { AgentTool } from "@mariozechner/pi-agent-core";

// Helper to create tools with proper typing
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


// Local Stable Diffusion (Forge) Implementation
async function generateLocalImage(params: {
    prompt: string;
    width?: number;
    height?: number;
}): Promise<string> {
    const outputDir = "C:\\Users\\khali\\.neer\\output\\images";
    const width = params.width || 512; // SD 1.5/SDXL default
    const height = params.height || 512;
    const apiUrl = "http://127.0.0.1:7860/sdapi/v1/txt2img";

    const payload = {
        prompt: params.prompt,
        negative_prompt: "nsfw, lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry",
        steps: 20,
        width: width,
        height: height,
        cfg_scale: 7,
        sampler_name: "Euler a",
        n_iter: 1,
        batch_size: 1,
    };

    try {
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`Local SD API error! status: ${response.status}`);
        }

        const data = await response.json();
        const base64Image = data.images[0];

        if (!base64Image) {
            throw new Error("No image data received from Local SD API");
        }

        const buffer = Buffer.from(base64Image, 'base64');
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const safePrompt = params.prompt.replace(/[^a-z0-9]/gi, "_").substring(0, 30);
        const filename = `img_${timestamp}_${safePrompt}.png`;
        const filepath = path.join(outputDir, filename);

        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        fs.writeFileSync(filepath, buffer);
        return filepath;

    } catch (error: any) {
        throw new Error(`Failed to generate image via Local SD: ${error.message}. Is Forge running on port 7860?`);
    }
}

// Tool Definition
export const generateImageTool = createTool({
    name: "generate_image",
    description: "Generates images using the Local Stable Diffusion (Forge) API. Use this tool whenever the user asks to draw or generate an image.",
    parameters: Type.Object({
        prompt: Type.String({ description: "The detailed text prompt describing the image." }),
        width: Type.Optional(Type.Number({ default: 512, description: "Width of the image." })),
        height: Type.Optional(Type.Number({ default: 512, description: "Height of the image." })),
    }),
    execute: async (params) => {
        try {
            // Send the "Processing" message first is tricky in a tool, 
            // but the user asked the AGENT to reply. 
            // We can return the specific text in the tool result content.
            const filepath = await generateLocalImage(params);

            // The user requested: "جاري رسم الصورة باستخدام كرت RTX 2060... 🎨"
            // We'll prepend this to the tool output so the agent (or gateway) sees it.
            // However, the tool result is usually consumed by the agent to *formulate* a response.
            // To force the exact reply, we might need the agent to output it. 
            // But if the Telegram gateway parses "Image: [path]", we can just return that.

            // NOTE: The user's request "Then, wait for the local Forge API... Finally, send..."
            // implies the "Processing" message should happen *before* the tool finishes.
            // Standard tools don't stream "processing" status to the user easily.
            // COMPROMISE: We will return the text as part of the tool result, 
            // and relying on the agent to say it, OR we can try to hack it.
            // Given "System Override Mode", I will make the tool return the image path 
            // formatted in a way `telegram_gateway.py` picks it up, AND include the Arabic text.

            return {
                content: [
                    {
                        type: "text",
                        text: `جاري رسم الصورة باستخدام كرت RTX 2060... 🎨\nImage: ${filepath}`
                    }
                ],
            };
        } catch (error: any) {
            return {
                isError: true,
                content: [{ type: "text", text: `Error generating image: ${error.message}` }],
            };
        }
    },
});
