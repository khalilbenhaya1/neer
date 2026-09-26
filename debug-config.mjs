import { createConfigIO } from "./dist/config/io.js";
import { resolveConfigPathCandidate } from "./dist/config/paths.js";
import { resolveDefaultModelForAgent } from "./dist/agents/model-selection.js";
import fs from "node:fs";
import { loadDotEnv } from "./dist/infra/dotenv.js";

loadDotEnv();

console.log("NEER_GATEWAY_TOKEN:", process.env.NEER_GATEWAY_TOKEN);
console.log("NEER_GATEWAY_PORT:", process.env.NEER_GATEWAY_PORT);
console.log("NEER_STATE_DIR:", process.env.NEER_STATE_DIR);

const configPath = resolveConfigPathCandidate();
console.log("Config Path:", configPath);

const io = createConfigIO();
const config = io.loadConfig();

const model = resolveDefaultModelForAgent({ cfg: config });
console.log("Resolved Model:", JSON.stringify(model, null, 2));

console.log("Config agents.defaults.model:", JSON.stringify(config.agents?.defaults?.model, null, 2));
