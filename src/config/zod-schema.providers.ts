import { z } from "zod";
import { ChannelHeartbeatVisibilitySchema } from "./zod-schema.channels.js";
import { GroupPolicySchema } from "./zod-schema.core.js";
import {
  BlueBubblesConfigSchema,
  DiscordConfigSchema,
  GoogleChatConfigSchema,
  IMessageConfigSchema,
  IrcConfigSchema,
  MSTeamsConfigSchema,
  SignalConfigSchema,
  SlackConfigSchema,
  TelegramConfigSchema,
} from "./zod-schema.providers-core.js";
import { WhatsAppConfigSchema } from "./zod-schema.providers-whatsapp.js";

export {
  TelegramTopicSchema,
  TelegramGroupSchema,
  TelegramAccountSchemaBase,
  TelegramAccountSchema,
  TelegramConfigSchema,
  DiscordDmSchema,
  DiscordGuildChannelSchema,
  DiscordGuildSchema,
  DiscordAccountSchema,
  DiscordConfigSchema,
  GoogleChatDmSchema,
  GoogleChatGroupSchema,
  GoogleChatAccountSchema,
  GoogleChatConfigSchema,
  SlackDmSchema,
  SlackChannelSchema,
  SlackThreadSchema,
  SlackAccountSchema,
  SlackConfigSchema,
  SignalAccountSchemaBase,
  SignalAccountSchema,
  SignalConfigSchema,
  IrcGroupSchema,
  IrcNickServSchema,
  IrcAccountSchemaBase,
  IrcAccountSchema,
  IrcConfigSchema,
  IMessageAccountSchemaBase,
  IMessageAccountSchema,
  IMessageConfigSchema,
  BlueBubblesAccountSchemaBase,
  BlueBubblesAccountSchema,
  BlueBubblesConfigSchema,
  MSTeamsChannelSchema,
  MSTeamsTeamSchema,
  MSTeamsConfigSchema,
} from "./zod-schema.providers-core.js";
export {
  WhatsAppAccountSchema,
  WhatsAppConfigSchema,
} from "./zod-schema.providers-whatsapp.js";
export { ChannelHeartbeatVisibilitySchema } from "./zod-schema.channels.js";

export const ChannelsSchema = z
  .object({
    defaults: z
      .object({
        groupPolicy: GroupPolicySchema.optional(),
        heartbeat: ChannelHeartbeatVisibilitySchema,
      })
      .strict()
      .optional(),
    whatsapp: WhatsAppConfigSchema.optional(),
    telegram: TelegramConfigSchema.optional(),
    discord: DiscordConfigSchema.optional(),
    irc: IrcConfigSchema.optional(),
    googlechat: GoogleChatConfigSchema.optional(),
    slack: SlackConfigSchema.optional(),
    signal: SignalConfigSchema.optional(),
    imessage: IMessageConfigSchema.optional(),
    bluebubbles: BlueBubblesConfigSchema.optional(),
    msteams: MSTeamsConfigSchema.optional(),
  })
  .passthrough() // Allow extension channel configs (nostr, matrix, zalo, etc.)
  .optional();
