import type { NeerPluginApi } from "neer/plugin-sdk";
import { spawn } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

export const notepadPlugin = {
    id: "notepad",
    name: "Notepad",
    description: "Open Windows Notepad",
    register(api: NeerPluginApi) {
        api.registerTool((ctx) => {
            return {
                name: "notepad_edit", // Using a unique name to avoid conflicts, alias to 'edit' if needed or user can call this
                label: "Open Notepad",
                description: "Open Windows Notepad. Can optionally provide text to edit or a specific file path.",
                parameters: {
                    type: "object",
                    properties: {
                        path: {
                            type: "string",
                            description: "The file path to open. If omitted, opens a new/temp file.",
                        },
                        text: {
                            type: "string",
                            description: "The text context to pre-fill if opening a new file.",
                        },
                    },
                },
                execute: async ({ path, text }: { path?: string; text?: string }) => {
                    let targetPath = path;

                    if (!targetPath && text) {
                        // Create a temp file with the text
                        const tempFile = join(tmpdir(), `neer_note_${Date.now()}.txt`);
                        await writeFile(tempFile, text, "utf-8");
                        targetPath = tempFile;
                    }

                    const args = targetPath ? [targetPath] : [];

                    // Spawn notepad detached so it doesn't block Neer
                    const child = spawn("notepad.exe", args, {
                        detached: true,
                        stdio: "ignore",
                    });
                    child.unref();

                    return {
                        content: [
                            {
                                type: "text",
                                text: targetPath
                                    ? `Opened Notepad for file: ${targetPath}`
                                    : "Opened new Notepad window.",
                            },
                        ],
                    };
                },
            };
        });
    },
};

export default notepadPlugin;
