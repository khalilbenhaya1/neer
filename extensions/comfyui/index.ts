import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { type AgentTool } from "../../agents/tools/common.js";
import { type NeerPluginDefinition } from "../types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..", "..");

type ComfyUIGenParams = {
    prompt: string;
    negative_prompt?: string;
    seed?: number;
    steps?: number;
    width?: number;
    height?: number;
    cfg_scale?: number;
};

const definition: NeerPluginDefinition = {
    id: "comfyui",
    name: "ComfyUI Integration",
    description: "Generate images using local ComfyUI via Python bridge",
    version: "0.0.1",
    kind: "media",
    configSchema: {
        type: "object",
        properties: {
            pythonPath: { type: "string", default: "python" },
        },
    },
    register(api) {
        const logger = api.logger;

        api.registerTool({
            name: "comfyui.generate_image",
            description: "Generates an image using ComfyUI based on a text prompt.",
            parameters: {
                type: "object",
                properties: {
                    prompt: {
                        type: "string",
                        description: "The positive prompt describing the image to generate.",
                    },
                    negative_prompt: {
                        type: "string",
                        description: "The negative prompt describing what to avoid.",
                    },
                    seed: {
                        type: "integer",
                        description: "Random seed for reproducibility.",
                    },
                    steps: {
                        type: "integer",
                        default: 20,
                        description: "Number of sampling steps.",
                    },
                    width: {
                        type: "integer",
                        default: 512,
                        description: "Image width.",
                    },
                    height: {
                        type: "integer",
                        default: 512,
                        description: "Image height.",
                    },
                    cfg_scale: {
                        type: "number",
                        default: 7.0,
                        description: "Classifier Free Guidance scale.",
                    },
                },
                required: ["prompt"],
            },
            execute: async (runId, params: ComfyUIGenParams) => {
                logger.info(`Generating image for prompt: "${params.prompt}"`);

                return new Promise((resolve, reject) => {
                    const pythonParams = {
                        prompt: params.prompt,
                        negative_prompt: params.negative_prompt,
                        seed: params.seed,
                        steps: params.steps,
                        width: params.width,
                        height: params.height,
                        cfg_scale: params.cfg_scale,
                    };

                    // Use python -m to avoid import path issues and rely on package structure
                    // Assumes we are running from project root where 'skills' folder is located.
                    const pythonProcess = spawn("python", ["-m", "skills.media.comfyui.bridge"], {
                        stdio: ["pipe", "pipe", "pipe"],
                        cwd: projectRoot, // Use resolved project root to ensure 'skills' is found
                    });

                    let output = "";
                    let errorOutput = "";

                    pythonProcess.stdout.on("data", (data) => {
                        output += data.toString();
                    });

                    pythonProcess.stderr.on("data", (data) => {
                        errorOutput += data.toString();
                    });

                    pythonProcess.on("close", (code) => {
                        if (code !== 0) {
                            logger.error(`ComfyUI bridge failed with code ${code}: ${errorOutput}`);
                            resolve({
                                content: [{ type: "text", text: `Error generating image: ${errorOutput}` }],
                                isError: true,
                            });
                            return;
                        }

                        try {
                            const result = JSON.parse(output);
                            if (result.error) {
                                resolve({
                                    content: [{ type: "text", text: `Error from ComfyUI: ${result.error}` }],
                                    isError: true,
                                });
                                return;
                            }

                            const images = result.images || [];
                            const content = images.map((b64: string) => ({
                                type: "image",
                                data: b64,
                                mimeType: "image/png",
                            }));

                            content.unshift({
                                type: "text",
                                text: `Generated ${images.length} image(s) in ${result.execution_time?.toFixed(2)}s. Seed: ${result.seed}`
                            });

                            resolve({
                                content: content,
                            });
                        } catch (e) {
                            logger.error(`Failed to parse bridge output: ${e}. Output was: ${output}`);
                            resolve({
                                content: [{ type: "text", text: "Failed to parse generation result." }],
                                isError: true,
                            });
                        }
                    });

                    // Send params to stdin
                    pythonProcess.stdin.write(JSON.stringify(pythonParams));
                    pythonProcess.stdin.end();
                });
            },
        });
    },
};

export default definition;
