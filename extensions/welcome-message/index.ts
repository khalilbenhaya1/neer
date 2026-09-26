import type { NeerPluginApi } from "neer/plugin-sdk";
import { emptyPluginConfigSchema } from "neer/plugin-sdk";

export const welcomeMessagePlugin = {
  id: "welcome-message",
  name: "Welcome Message",
  description: "Sends a welcome message on session start",
  configSchema: {
    type: "object",
    properties: {
      message: {
        type: "string",
        description: "The welcome message to send",
      },
    },
    additionalProperties: false,
  },
  register(api: NeerPluginApi) {
    api.on("session_start", async (event, ctx) => {
      // Only welcome on fresh sessions (not resumes)
      if (event.resumedFrom) {
        return;
      }

      const welcomeText = (api.pluginConfig?.message as string) || 
        "👋 Hi! I'm Neer, your local, secure, and fast AI assistant developed by Khalil Benhaya.\n\nI'm running locally on your machine. How can I help you today?";

      try {
        const storePath = api.runtime.channel.session.resolveStorePath(api.config.session?.store, { agentId: ctx.agentId });
        const store = await import("fs/promises").then(fs => fs.readFile(storePath, "utf-8")).then(JSON.parse).catch(() => ({}));
        
        const sessionEntry = store[ctx.sessionId] || Object.values(store).find((e: any) => e.sessionId === ctx.sessionId);
        
        if (!sessionEntry) {
          api.logger.warn(`[welcome-message] Could not find session entry for ${ctx.sessionId}`);
          return;
        }

        const lastChannel = sessionEntry.lastChannel || sessionEntry.channel; // channel might be 'telegram', 'discord', etc.
        const lastTo = sessionEntry.lastTo || sessionEntry.lastAccountId; // 'to' address
        
        if (!lastChannel || !lastTo) {
             api.logger.warn(`[welcome-message] Missing channel/to info for session ${ctx.sessionId}`);
             return;
        }

        api.logger.info(`[welcome-message] Sending welcome message to ${lastChannel}/${lastTo}`);

        // Dispatch based on channel
        if (lastChannel === "telegram") {
           await api.runtime.channel.telegram.sendMessageTelegram({
             to: lastTo,
             text: welcomeText,
             token: api.config.channels?.telegram?.botToken,
           }, api.config);
        } else if (lastChannel === "discord") {
           // Discord needs channelId
           await api.runtime.channel.discord.sendMessageDiscord({
               channelId: lastTo,
               content: welcomeText,
           }, api.config);
        } else if (lastChannel === "whatsapp") {
           await api.runtime.channel.whatsapp.sendMessageWhatsApp({
               to: lastTo,
               text: welcomeText,
           }, api.config);
        } else {
             api.logger.warn(`[welcome-message] Unsupported channel for welcome message: ${lastChannel}`);
        }

      } catch (err) {
        api.logger.error(`[welcome-message] Failed to send welcome message: ${String(err)}`);
      }
    });
  },
};

export default welcomeMessagePlugin;
