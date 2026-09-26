import type {
  AnyAgentTool,
  NeerPluginApi,
  NeerPluginToolFactory,
} from "../../src/plugins/types.js";
import { createLobsterTool } from "./src/lobster-tool.js";

export default function register(api: NeerPluginApi) {
  api.registerTool(
    ((ctx) => {
      if (ctx.sandboxed) {
        return null;
      }
      return createLobsterTool(api) as AnyAgentTool;
    }) as NeerPluginToolFactory,
    { optional: true },
  );
}
