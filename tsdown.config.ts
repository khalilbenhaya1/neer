import { defineConfig } from "tsdown";

const env = {
  NODE_ENV: "production",
};

const patchExportAllPlugin = {
  name: "patch-export-all",
  renderChunk(code: string) {
    if (code.includes(' as __exportAll } from')) {
      const replaced = code.replace(/import\s*\{\s*\S+\s+as\s+__exportAll\s*\}\s*from\s*["'].*?["'];?/g, `
        var __exportAll = globalThis.__exportAll || (globalThis.__exportAll = (all, no_symbols) => {
          let target = {};
          for (var name in all) {
            Object.defineProperty(target, name, {
              get: all[name],
              enumerable: true
            });
          }
          if (!no_symbols) {
            Object.defineProperty(target, Symbol.toStringTag, { value: "Module" });
          }
          return target;
        });
      `);
      return { code: replaced };
    }
    return null;
  }
};

export default defineConfig([
  {
    entry: "src/index.ts",
    env,
    fixedExtension: false,
    platform: "node",
    splitting: false,
    plugins: [patchExportAllPlugin as any],
  },
  {
    entry: "src/entry.ts",
    env,
    fixedExtension: false,
    platform: "node",
    splitting: false,
    plugins: [patchExportAllPlugin as any],
  },
  {
    entry: "src/infra/warning-filter.ts",
    env,
    fixedExtension: false,
    platform: "node",
    plugins: [patchExportAllPlugin as any],
  },
  {
    entry: "src/cognition/pulse.worker.ts",
    env,
    fixedExtension: false,
    platform: "node",
    plugins: [patchExportAllPlugin as any],
  },
  {
    entry: "src/plugin-sdk/index.ts",
    outDir: "dist/plugin-sdk",
    env,
    fixedExtension: false,
    platform: "node",
    plugins: [patchExportAllPlugin as any],
  },
  {
    entry: "src/extensionAPI.ts",
    env,
    fixedExtension: false,
    platform: "node",
    plugins: [patchExportAllPlugin as any],
  },
  {
    entry: ["src/hooks/bundled/*/handler.ts", "src/hooks/llm-slug-generator.ts"],
    env,
    fixedExtension: false,
    platform: "node",
    plugins: [patchExportAllPlugin as any],
  },
  {
    entry: "src/gateway/server.ts",
    env,
    fixedExtension: false,
    platform: "node",
    dts: true,
    plugins: [patchExportAllPlugin as any],
  },
  {
    entry: "src/saas-runtime.ts",
    env,
    fixedExtension: false,
    platform: "node",
    dts: true,
    plugins: [patchExportAllPlugin as any],
  },
]);
