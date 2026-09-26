import type { NeerPluginApi } from "neer/plugin-sdk";
import { spawn, exec } from "node:child_process";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { promises as fs } from "node:fs";

// Helper to run PowerShell commands
const runPowershell = (command: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        const ps = spawn("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", command]);

        ps.on("close", (code) => {
            if (code === 0) resolve();
            else reject(new Error(`PowerShell command failed with code ${code}`));
        });

        ps.on("error", reject);
    });
};

export const deviceControlPlugin = {
    id: "device-control",
    name: "Device Control",
    description: "Screen capture and audio recording capabilities",
    register(api: NeerPluginApi) {
        // 1. Tool: take_screenshot
        api.registerTool((ctx) => {
            return {
                name: "take_screenshot",
                label: "Take Screenshot",
                description: "Capture the primary screen content.",
                parameters: {
                    type: "object",
                    properties: {},
                },
                execute: async () => {
                    const filename = `neer_screen_${Date.now()}.png`;
                    const filePath = join(tmpdir(), filename);

                    // PowerShell script to capture screen using System.Windows.Forms
                    const psCommand = `
            Add-Type -AssemblyName System.Windows.Forms
            Add-Type -AssemblyName System.Drawing
            $screen = [System.Windows.Forms.Screen]::PrimaryScreen
            $bitmap = New-Object System.Drawing.Bitmap $screen.Bounds.Width, $screen.Bounds.Height
            $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
            $graphics.CopyFromScreen($screen.Bounds.X, $screen.Bounds.Y, 0, 0, $bitmap.Size)
            $bitmap.Save("${filePath.replace(/\\/g, "\\\\")}")
          `;

                    try {
                        await runPowershell(psCommand);
                        return {
                            content: [
                                {
                                    type: "text",
                                    text: "Screenshot captured.",
                                },
                                {
                                    type: "image",
                                    image: await fs.readFile(filePath).then(b => b.toString("base64")),
                                    mimeType: "image/png"
                                }
                            ],
                        };
                    } catch (error) {
                        return {
                            content: [
                                {
                                    type: "text",
                                    text: `Failed to capture screenshot: ${String(error)}`,
                                },
                            ],
                            isError: true,
                        };
                    }
                },
            };
        });

        // 2. Tool: record_audio
        api.registerTool((ctx) => {
            return {
                name: "record_audio",
                label: "Record Audio",
                description: "Record audio from the default microphone.",
                parameters: {
                    type: "object",
                    properties: {
                        durationSeconds: {
                            type: "number",
                            description: "Duration of the recording in seconds. Default 10.",
                        },
                    },
                },
                execute: async ({ durationSeconds }: { durationSeconds?: number }) => {
                    const duration = durationSeconds || 10;
                    const filename = `neer_audio_${Date.now()}.wav`;
                    const filePath = join(tmpdir(), filename);

                    // Using ffmpeg for recording. Expects ffmpeg in PATH.
                    // On Windows, 'dshow' is sound input. 'audio="Microphone (Realtek Audio)"' is typical but varies.
                    // A safer generic default might be difficult without listing devices.
                    // We will try a generic 'primary source' approach or a PowerShell fallback if ffmpeg fails?
                    // PowerShell audio recording is hard. Let's assume ffmpeg is available or fail gracefully.

                    // Note: Finding the right device name is tricky. 
                    // We'll try to use a simpler executable if available or guide user.
                    // For now, let's try a common ffmpeg command that lists devices? No, that's interactive.
                    // We'll try to just return a text saying "Audio recording requires configured device." 
                    // OR, ideally, we can use a small C# inline script in PowerShell to record audio.

                    const psAudioCommand = `
            $duration = ${duration}
            $file = "${filePath.replace(/\\/g, "\\\\")}"
            
            Add-Type -TypeDefinition @"
            using System;
            using System.Runtime.InteropServices;

            public class AudioRecorder {
                [DllImport("winmm.dll", EntryPoint = "mciSendStringA", CharSet = CharSet.Ansi)]
                public static extern int mciSendString(string lpstrCommand, string lpstrReturnString, int uReturnLength, int hwndCallback);

                public static void Record(string fileName, int durationSec) {
                    mciSendString("open new type waveaudio alias mywave", null, 0, 0);
                    mciSendString("record mywave", null, 0, 0);
                    System.Threading.Thread.Sleep(durationSec * 1000);
                    mciSendString("save mywave " + fileName, null, 0, 0);
                    mciSendString("close mywave", null, 0, 0);
                }
            }
"@
            [AudioRecorder]::Record($file, $duration)
          `;

                    try {
                        await runPowershell(psAudioCommand);
                        // Check if file exists
                        await fs.access(filePath);

                        return {
                            content: [
                                {
                                    type: "text",
                                    text: `Audio recorded (${duration}s).`,
                                },
                                // Sending as audio/wav if supported by frontend, otherwise file path
                                // Neer likely supports media blocks.
                                {
                                    type: "text", // Placeholder for actual media handling if "audio" type isn't standard in tool result yet
                                    text: `[Audio file created at: ${filePath}]`
                                }
                            ]
                        };
                    } catch (error) {
                        return {
                            content: [{ type: "text", text: `Failed to record audio: ${String(error)}. Make sure a microphone is available and permissions are granted.` }],
                            isError: true
                        };
                    }
                },
            };
        });
    },
};

export default deviceControlPlugin;
