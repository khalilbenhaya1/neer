const electron = require("electron");
console.log("Electron require keys:", Object.keys(electron));
const { app, BrowserWindow, shell, ipcMain } = electron;
const path = require("node:path");

// ====== Global Error Handlers ======
process.on("unhandledRejection", (reason) => {
    console.error("Unhandled Promise Rejection:", reason);
});

process.on("uncaughtException", (error) => {
    console.error("Uncaught Exception:", error);
});

let mainWindow = null;
let gatewayServer = null;

async function createWindow(port) {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 850,
        title: "Neer",
        titleBarStyle: 'hiddenInset',
        backgroundColor: '#090a0f',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, "preload.js"),
        },
        show: false,
    });

    // Determine UI URL: Dev server or local dist
    const isDev = !app.isPackaged;
    const uiUrl = isDev
        ? `http://localhost:3000/`
        : `file://${path.join(__dirname, "../../ui-next/dist/index.html")}`;

    console.log(`Loading UI from ${uiUrl}`);

    mainWindow.once('ready-to-show', () => {
        mainWindow?.show();
        // Only open DevTools in development
        if (isDev) {
            mainWindow?.webContents.openDevTools();
        }
    });

    await mainWindow.loadURL(uiUrl);

    // Open external links in default browser
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith("http:") || url.startsWith("https:")) {
            shell.openExternal(url);
            return { action: "deny" };
        }
        return { action: "allow" };
    });

    mainWindow.on("closed", () => {
        mainWindow = null;
    });
}

const dynamicImport = new Function('specifier', 'return import(specifier)');

async function startApp() {
    try {
        console.log("Loading Neer modules...");
        // Dynamic import for ESM-only neer package
        const { startGatewayServer } = await dynamicImport("neer/server");
        const { readConfigFileSnapshot, writeConfigFile } = await dynamicImport("neer");

        // IPC Handlers
        ipcMain.handle('config:get', async () => {
            try {
                const snapshot = await readConfigFileSnapshot();
                return snapshot.config;
            } catch (err) {
                console.error("Failed to get config:", err);
                return {};
            }
        });

        ipcMain.handle('config:save', async (event, setupConfig) => {
            try {
                const snapshot = await readConfigFileSnapshot();
                const currentConfig = snapshot.config || {};

                const updatedConfig = {
                    ...currentConfig,
                    agents: {
                        ...currentConfig.agents,
                        defaults: {
                            ...currentConfig.agents?.defaults,
                            model: {
                                primary: setupConfig.mode === 'local'
                                    ? 'ollama/llama3:latest'
                                    : `${setupConfig.provider}/gpt-4o`
                            }
                        }
                    },
                    models: {
                        ...currentConfig.models,
                        providers: {
                            ...currentConfig.models?.providers,
                            [setupConfig.provider]: {
                                apiKey: setupConfig.apiKey,
                                enabled: true
                            }
                        }
                    }
                };

                await writeConfigFile(updatedConfig);
                console.log("Configuration saved successfully.");
                return { ok: true };
            } catch (err) {
                console.error("Failed to save config:", err);
                return { ok: false, error: String(err) };
            }
        });

        const port = 18789;
        console.log(`Starting Neer Core on port ${port}...`);

        gatewayServer = await startGatewayServer(port, {
            controlUiEnabled: true,
            openAiChatCompletionsEnabled: true,
            openResponsesEnabled: true,
            auth: {
                mode: "password",
                password: "khalil",
            },
        });

        ipcMain.handle('DESKTOP_CAPTURER_GET_SOURCES', async (event, opts) => {
            const sources = await electron.desktopCapturer.getSources({
                types: opts.types || ['window', 'screen'],
                thumbnailSize: opts.thumbnailSize || { width: 150, height: 150 },
                fetchWindowIcons: opts.fetchWindowIcons || true
            });
            return sources;
        });

        await createWindow(port);
    } catch (err) {
        console.error("Failed to start Neer:", err);
        app.quit();
    }
}

app.whenReady().then(startApp);

app.on("window-all-closed", async () => {
    if (process.platform !== "darwin") {
        if (gatewayServer) {
            await gatewayServer.close();
        }
        app.quit();
    }
});

app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        if (!gatewayServer) {
            await startApp();
        }
    }
});
