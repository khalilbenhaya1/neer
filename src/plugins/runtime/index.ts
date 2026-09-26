import { createRequire } from "node:module";
import type { PluginRuntime } from "./types.js";
import { resolveEffectiveMessagesConfig, resolveHumanDelayConfig } from "../../agents/identity.js";
import { createMemoryGetTool, createMemorySearchTool } from "../../agents/tools/memory-tool.js";
import { handleSlackAction } from "../../agents/tools/slack-actions.js";
import { handleWhatsAppAction } from "../../agents/tools/whatsapp-actions.js";
import {
  chunkByNewline,
  chunkMarkdownText,
  chunkMarkdownTextWithMode,
  chunkText,
  chunkTextWithMode,
  resolveChunkMode,
  resolveTextChunkLimit,
} from "../../auto-reply/chunk.js";
import {
  hasControlCommand,
  isControlCommandMessage,
  shouldComputeCommandAuthorized,
} from "../../auto-reply/command-detection.js";
import { shouldHandleTextCommands } from "../../auto-reply/commands-registry.js";
import {
  formatAgentEnvelope,
  formatInboundEnvelope,
  resolveEnvelopeFormatOptions,
} from "../../auto-reply/envelope.js";
import {
  createInboundDebouncer,
  resolveInboundDebounceMs,
} from "../../auto-reply/inbound-debounce.js";
import { dispatchReplyFromConfig } from "../../auto-reply/reply/dispatch-from-config.js";
import { finalizeInboundContext } from "../../auto-reply/reply/inbound-context.js";
import {
  buildMentionRegexes,
  matchesMentionPatterns,
  matchesMentionWithExplicit,
} from "../../auto-reply/reply/mentions.js";
import { dispatchReplyWithBufferedBlockDispatcher } from "../../auto-reply/reply/provider-dispatcher.js";
import { createReplyDispatcherWithTyping } from "../../auto-reply/reply/reply-dispatcher.js";
import { removeAckReactionAfterReply, shouldAckReaction } from "../../channels/ack-reactions.js";
import { resolveCommandAuthorizedFromAuthorizers } from "../../channels/command-gating.js";
import { discordMessageActions } from "../../channels/plugins/actions/discord.js";
import { signalMessageActions } from "../../channels/plugins/actions/signal.js";
import { telegramMessageActions } from "../../channels/plugins/actions/telegram.js";
import { createWhatsAppLoginTool } from "../../channels/plugins/agent-tools/whatsapp-login.js";
import { recordInboundSession } from "../../channels/session.js";
import { monitorWebChannel } from "../../channels/web/index.js";
import { registerMemoryCli } from "../../cli/memory-cli.js";
import { loadConfig, writeConfigFile } from "../../config/config.js";
import {
  resolveChannelGroupPolicy,
  resolveChannelGroupRequireMention,
} from "../../config/group-policy.js";
import { resolveMarkdownTableMode } from "../../config/markdown-tables.js";
import { resolveStateDir } from "../../config/paths.js";
import {
  readSessionUpdatedAt,
  recordSessionMetaFromInbound,
  resolveStorePath,
  updateLastRoute,
} from "../../config/sessions.js";
import { auditDiscordChannelPermissions } from "../../discord/audit.js";
import {
  listDiscordDirectoryGroupsLive,
  listDiscordDirectoryPeersLive,
} from "../../discord/directory-live.js";
import { monitorDiscordProvider } from "../../discord/monitor.js";
import { probeDiscord } from "../../discord/probe.js";
import { resolveDiscordChannelAllowlist } from "../../discord/resolve-channels.js";
import { resolveDiscordUserAllowlist } from "../../discord/resolve-users.js";
import { sendMessageDiscord, sendPollDiscord } from "../../discord/send.js";
import { shouldLogVerbose } from "../../globals.js";
import { monitorIMessageProvider } from "../../imessage/monitor.js";
import { probeIMessage } from "../../imessage/probe.js";
import { sendMessageIMessage } from "../../imessage/send.js";
import { getChannelActivity, recordChannelActivity } from "../../infra/channel-activity.js";
import { enqueueSystemEvent } from "../../infra/system-events.js";
import {
  listLineAccountIds,
  normalizeAccountId as normalizeLineAccountId,
  resolveDefaultLineAccountId,
  resolveLineAccount,
} from "../../line/accounts.js";
import { monitorLineProvider } from "../../line/monitor.js";
import { probeLineBot } from "../../line/probe.js";
import {
  createQuickReplyItems,
  pushMessageLine,
  pushMessagesLine,
  pushFlexMessage,
  pushTemplateMessage,
  pushLocationMessage,
  pushTextMessageWithQuickReplies,
  sendMessageLine,
} from "../../line/send.js";
import { buildTemplateMessageFromPayload } from "../../line/template-messages.js";
import { getChildLogger } from "../../logging.js";
import { normalizeLogLevel } from "../../logging/levels.js";
import { convertMarkdownTables } from "../../markdown/tables.js";
import { isVoiceCompatibleAudio } from "../../media/audio.js";
import { mediaKindFromMime } from "../../media/constants.js";
import { fetchRemoteMedia } from "../../media/fetch.js";
import { getImageMetadata, resizeToJpeg } from "../../media/image-ops.js";
import { detectMime } from "../../media/mime.js";
import { saveMediaBuffer } from "../../media/store.js";
import { buildPairingReply } from "../../pairing/pairing-messages.js";
import {
  readChannelAllowFromStore,
  upsertChannelPairingRequest,
} from "../../pairing/pairing-store.js";
import { runCommandWithTimeout } from "../../process/exec.js";
import { resolveAgentRoute } from "../../routing/resolve-route.js";
import { monitorSignalProvider } from "../../signal/index.js";
import { probeSignal } from "../../signal/probe.js";
import { sendMessageSignal } from "../../signal/send.js";
import {
  listSlackDirectoryGroupsLive,
  listSlackDirectoryPeersLive,
} from "../../slack/directory-live.js";
import { monitorSlackProvider } from "../../slack/index.js";
import { probeSlack } from "../../slack/probe.js";
import { resolveSlackChannelAllowlist } from "../../slack/resolve-channels.js";
import { resolveSlackUserAllowlist } from "../../slack/resolve-users.js";
import { sendMessageSlack } from "../../slack/send.js";
import {
  auditTelegramGroupMembership,
  collectTelegramUnmentionedGroupIds,
} from "../../telegram/audit.js";
import { monitorTelegramProvider } from "../../telegram/monitor.js";
import { probeTelegram } from "../../telegram/probe.js";
import { sendMessageTelegram } from "../../telegram/send.js";
import { resolveTelegramToken } from "../../telegram/token.js";
import { textToSpeechTelephony } from "../../tts/tts.js";
import { getActiveWebListener } from "../../web/active-listener.js";
import {
  getWebAuthAgeMs,
  logoutWeb,
  logWebSelfId,
  readWebSelfId,
  webAuthExists,
} from "../../web/auth-store.js";
import { startWebLoginWithQr, waitForWebLogin } from "../../web/login-qr.js";
import { loginWeb } from "../../web/login.js";
import { loadWebMedia } from "../../web/media.js";
import { sendMessageWhatsApp, sendPollWhatsApp } from "../../web/outbound.js";
import { formatNativeDependencyHint } from "./native-deps.js";

let cachedVersion: string | null = null;

function resolveVersion(): string {
  if (cachedVersion) {
    return cachedVersion;
  }
  try {
    const require = createRequire(import.meta.url);
    const pkg = require("../../../package.json") as { version?: string };
    cachedVersion = pkg.version ?? "unknown";
    return cachedVersion;
  } catch {
    cachedVersion = "unknown";
    return cachedVersion;
  }
}

export function createPluginRuntime(): PluginRuntime {
  return {
    version: resolveVersion(),
    config: {
      loadConfig: loadConfig,
      writeConfigFile: writeConfigFile,
    },
    system: {
      enqueueSystemEvent: enqueueSystemEvent,
      runCommandWithTimeout: runCommandWithTimeout,
      formatNativeDependencyHint: formatNativeDependencyHint,
    },
    media: {
      loadWebMedia: loadWebMedia,
      detectMime: detectMime,
      mediaKindFromMime: mediaKindFromMime,
      isVoiceCompatibleAudio: isVoiceCompatibleAudio,
      getImageMetadata: getImageMetadata,
      resizeToJpeg: resizeToJpeg,
    },
    tts: {
      textToSpeechTelephony: textToSpeechTelephony,
    },
    tools: {
      createMemoryGetTool: createMemoryGetTool,
      createMemorySearchTool: createMemorySearchTool,
      registerMemoryCli: registerMemoryCli,
    },
    channel: {
      text: {
        chunkByNewline: chunkByNewline,
        chunkMarkdownText: chunkMarkdownText,
        chunkMarkdownTextWithMode: chunkMarkdownTextWithMode,
        chunkText: chunkText,
        chunkTextWithMode: chunkTextWithMode,
        resolveChunkMode: resolveChunkMode,
        resolveTextChunkLimit: resolveTextChunkLimit,
        hasControlCommand: hasControlCommand,
        resolveMarkdownTableMode: resolveMarkdownTableMode,
        convertMarkdownTables: convertMarkdownTables,
      },
      reply: {
        dispatchReplyWithBufferedBlockDispatcher: dispatchReplyWithBufferedBlockDispatcher,
        createReplyDispatcherWithTyping: createReplyDispatcherWithTyping,
        resolveEffectiveMessagesConfig: resolveEffectiveMessagesConfig,
        resolveHumanDelayConfig: resolveHumanDelayConfig,
        dispatchReplyFromConfig: dispatchReplyFromConfig,
        finalizeInboundContext: finalizeInboundContext,
        formatAgentEnvelope: formatAgentEnvelope,
        /** @deprecated Prefer `BodyForAgent` + structured user-context blocks (do not build plaintext envelopes for prompts). */
        formatInboundEnvelope: formatInboundEnvelope,
        resolveEnvelopeFormatOptions: resolveEnvelopeFormatOptions,
      },
      routing: {
        resolveAgentRoute: resolveAgentRoute,
      },
      pairing: {
        buildPairingReply: buildPairingReply,
        readAllowFromStore: readChannelAllowFromStore,
        upsertPairingRequest: upsertChannelPairingRequest,
      },
      media: {
        fetchRemoteMedia: fetchRemoteMedia,
        saveMediaBuffer: saveMediaBuffer,
      },
      activity: {
        record: recordChannelActivity,
        get: getChannelActivity,
      },
      session: {
        resolveStorePath: resolveStorePath,
        readSessionUpdatedAt: readSessionUpdatedAt,
        recordSessionMetaFromInbound: recordSessionMetaFromInbound,
        recordInboundSession: recordInboundSession,
        updateLastRoute: updateLastRoute,
      },
      mentions: {
        buildMentionRegexes: buildMentionRegexes,
        matchesMentionPatterns: matchesMentionPatterns,
        matchesMentionWithExplicit: matchesMentionWithExplicit,
      },
      reactions: {
        shouldAckReaction: shouldAckReaction,
        removeAckReactionAfterReply: removeAckReactionAfterReply,
      },
      groups: {
        resolveGroupPolicy: resolveChannelGroupPolicy,
        resolveRequireMention: resolveChannelGroupRequireMention,
      },
      debounce: {
        createInboundDebouncer: createInboundDebouncer,
        resolveInboundDebounceMs: resolveInboundDebounceMs,
      },
      commands: {
        resolveCommandAuthorizedFromAuthorizers: resolveCommandAuthorizedFromAuthorizers,
        isControlCommandMessage: isControlCommandMessage,
        shouldComputeCommandAuthorized: shouldComputeCommandAuthorized,
        shouldHandleTextCommands: shouldHandleTextCommands,
      },
      discord: {
        messageActions: discordMessageActions,
        auditChannelPermissions: auditDiscordChannelPermissions,
        listDirectoryGroupsLive: listDiscordDirectoryGroupsLive,
        listDirectoryPeersLive: listDiscordDirectoryPeersLive,
        probeDiscord: probeDiscord,
        resolveChannelAllowlist: resolveDiscordChannelAllowlist,
        resolveUserAllowlist: resolveDiscordUserAllowlist,
        sendMessageDiscord: sendMessageDiscord,
        sendPollDiscord: sendPollDiscord,
        monitorDiscordProvider: monitorDiscordProvider,
      },
      slack: {
        listDirectoryGroupsLive: listSlackDirectoryGroupsLive,
        listDirectoryPeersLive: listSlackDirectoryPeersLive,
        probeSlack: probeSlack,
        resolveChannelAllowlist: resolveSlackChannelAllowlist,
        resolveUserAllowlist: resolveSlackUserAllowlist,
        sendMessageSlack: sendMessageSlack,
        monitorSlackProvider: monitorSlackProvider,
        handleSlackAction: handleSlackAction,
      },
      telegram: {
        auditGroupMembership: auditTelegramGroupMembership,
        collectUnmentionedGroupIds: collectTelegramUnmentionedGroupIds,
        probeTelegram: probeTelegram,
        resolveTelegramToken: resolveTelegramToken,
        sendMessageTelegram: sendMessageTelegram,
        monitorTelegramProvider: monitorTelegramProvider,
        messageActions: telegramMessageActions,
      },
      signal: {
        probeSignal: probeSignal,
        sendMessageSignal: sendMessageSignal,
        monitorSignalProvider: monitorSignalProvider,
        messageActions: signalMessageActions,
      },
      imessage: {
        monitorIMessageProvider: monitorIMessageProvider,
        probeIMessage: probeIMessage,
        sendMessageIMessage: sendMessageIMessage,
      },
      whatsapp: {
        getActiveWebListener: getActiveWebListener,
        getWebAuthAgeMs: getWebAuthAgeMs,
        logoutWeb: logoutWeb,
        logWebSelfId: logWebSelfId,
        readWebSelfId: readWebSelfId,
        webAuthExists: webAuthExists,
        sendMessageWhatsApp: sendMessageWhatsApp,
        sendPollWhatsApp: sendPollWhatsApp,
        loginWeb: loginWeb,
        startWebLoginWithQr: startWebLoginWithQr,
        waitForWebLogin: waitForWebLogin,
        monitorWebChannel: monitorWebChannel,
        handleWhatsAppAction: handleWhatsAppAction,
        createLoginTool: createWhatsAppLoginTool,
      },
      line: {
        listLineAccountIds: listLineAccountIds,
        resolveDefaultLineAccountId: resolveDefaultLineAccountId,
        resolveLineAccount: resolveLineAccount,
        normalizeAccountId: normalizeLineAccountId,
        probeLineBot: probeLineBot,
        sendMessageLine: sendMessageLine,
        pushMessageLine: pushMessageLine,
        pushMessagesLine: pushMessagesLine,
        pushFlexMessage: pushFlexMessage,
        pushTemplateMessage: pushTemplateMessage,
        pushLocationMessage: pushLocationMessage,
        pushTextMessageWithQuickReplies: pushTextMessageWithQuickReplies,
        createQuickReplyItems: createQuickReplyItems,
        buildTemplateMessageFromPayload: buildTemplateMessageFromPayload,
        monitorLineProvider: monitorLineProvider,
      },
    },
    logging: {
      shouldLogVerbose: shouldLogVerbose,
      getChildLogger: (bindings, opts) => {
        const logger = getChildLogger(bindings, {
          level: opts?.level ? normalizeLogLevel(opts.level) : undefined,
        });
        return {
          debug: (message) => logger.debug?.(message),
          info: (message) => logger.info(message),
          warn: (message) => logger.warn(message),
          error: (message) => logger.error(message),
        };
      },
    },
    state: {
      resolveStateDir: resolveStateDir,
    },
  };
}

export type { PluginRuntime } from "./types.js";
