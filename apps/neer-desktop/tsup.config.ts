import { defineConfig } from 'tsup';
import path from 'path';

// Plugin to shim qrcode-terminal and all its subpaths
const shimQrCodePlugin = {
    name: 'shim-qrcode',
    setup(build) {
        build.onResolve({ filter: /^qrcode-terminal/ }, args => {
            // Redirect all qrcode-terminal imports to our local shim
            return { path: path.resolve(__dirname, 'src/qs.js') };
        });
    },
};

export default defineConfig({
    entry: ['src/main.ts', 'src/preload.ts'],
    outDir: 'dist',
    format: ['cjs'],
    target: 'node16',
    clean: true,
    external: [
        'electron',
        'node-llama-cpp',
        '@napi-rs/canvas',
        'sharp',
        'sqlite-vec'
    ],
    noExternal: ['neer'],
    splitting: false,
    sourcemap: true,
    bundle: true,
    esbuildPlugins: [shimQrCodePlugin],
    esbuildOptions(options) {
        options.banner = {
            js: `import { createRequire } from 'module';const require = createRequire(import.meta.url);`
        };
        options.legalComments = 'none';
    }
});
