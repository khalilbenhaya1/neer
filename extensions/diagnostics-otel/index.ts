import type { NeerPluginApi } from "neer/plugin-sdk";
import { emptyPluginConfigSchema } from "neer/plugin-sdk";
import { createDiagnosticsOtelService } from "./src/service.js";

const plugin = {
  id: "diagnostics-otel",
  name: "Diagnostics OpenTelemetry",
  description: "Export diagnostics events to OpenTelemetry",
  configSchema: emptyPluginConfigSchema(),
  register(api: NeerPluginApi) {
    api.registerService(createDiagnosticsOtelService());
  },
};

export default plugin;
