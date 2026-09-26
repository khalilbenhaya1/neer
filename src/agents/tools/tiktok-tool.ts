import { Type, type Static, type TObject } from "@sinclair/typebox";
import type { AgentTool } from "@mariozechner/pi-agent-core";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { promisify } from "util";

const execAsync = promisify(exec);

// Helper to create tool structure (matching goals-tool.ts pattern)
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
            try {
                const result = await config.execute(params);
                return result;
            } catch (error: any) {
                return {
                    isError: true,
                    content: [{ type: "text", text: `Error executing ${config.name}: ${error.message}` }]
                };
            }
        }
    } as any;
}

export const uploadToTikTokTool = createTool({
    name: "upload_to_tiktok",
    description: "Upload a video to TikTok using the 'tiktok-uploader' library. Requires 'cookies.txt' in the workspace root.",
    parameters: Type.Object({
        video_path: Type.String({ description: "Absolute path to the video file to upload" }),
        description: Type.String({ description: "Caption/Description for the video" }),
        cookies_path: Type.Optional(Type.String({ description: "Path to cookies.txt (default: 'cookies.txt' in root)" }))
    }),
    execute: async ({ video_path, description, cookies_path }) => {
        const workspaceRoot = process.cwd();
        const cookiesFile = cookies_path ? path.resolve(cookies_path) : path.join(workspaceRoot, "cookies.txt");

        if (!fs.existsSync(video_path)) {
            throw new Error(`Video file not found at: ${video_path}`);
        }

        if (!fs.existsSync(cookiesFile)) {
            throw new Error(`TikTok cookies file not found at: ${cookiesFile}. Please export using a browser extension and save as cookies.txt in the project root.`);
        }

        // Construct the command
        // tiktok-uploader -v {video} -d {description} -c {cookies}
        // Escaping double quotes in description for safety
        const safeDescription = description.replace(/"/g, '\\"');
        const command = `tiktok-uploader -v "${video_path}" -d "${safeDescription}" -c "${cookiesFile}"`;

        try {
            const { stdout, stderr } = await execAsync(command);

            // Check for common success/failure indicators in stdout/stderr if command exit code is 0 but still failed
            // tiktok-uploader usually throws non-zero exit code on failure, so execAsync catch block handles it.

            return {
                content: [
                    {
                        type: "text",
                        text: `Successfully uploaded video to TikTok!\n\nOutput:\n${stdout.slice(0, 500)}`
                    }
                ]
            };

        } catch (error: any) {
            // execAsync throws on non-zero exit code
            const output = error.stdout || error.stderr || error.message;
            throw new Error(`Upload failed. Command output:\n${output}`);
        }
    }
});
