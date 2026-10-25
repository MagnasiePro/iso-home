import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

// One ES module, installable through HACS (research.md §6).
export default defineConfig({
  resolve: {
    alias: [
      {
        find: /.*\/(gpu\/WebGPURenderer|browser\/isWebGPUSupported)\.mjs$/,
        replacement: fileURLToPath(new URL("./src/webgpu-stub.ts", import.meta.url)),
      },
    ],
  },
  build: {
    lib: { entry: "src/iso-home-card.ts", formats: ["es"], fileName: () => "iso-home-card.js" },
    // Pixi lazy-loads its renderers; HACS needs exactly one file.
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
});
