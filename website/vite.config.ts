import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "..");

// The marketing site + in-browser cropper. It is a separate Vite project that
// lives next to the desktop app and shares its Mantine theme (`src/theme.ts`),
// so the two always look like one product.
//
//   npm run website          dev server  (http://localhost:3000)
//   npm run website:build    client build + SSR build + prerender -> website/dist
export default defineConfig({
  root: here,
  publicDir: path.resolve(here, "public"),
  plugins: [react()],
  resolve: {
    alias: {
      "@app": path.resolve(repo, "src"),
      "@site": path.resolve(here, "src"),
    },
  },
  // Re-use the repo's postcss-preset-mantine config.
  css: { postcss: repo },
  server: {
    port: 3000,
    strictPort: true,
    fs: { allow: [repo] },
  },
  preview: { port: 3000 },
  build: {
    outDir: path.resolve(here, "dist"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(here, "index.html"),
        cropper: path.resolve(here, "cropper/index.html"),
      },
    },
  },
});
