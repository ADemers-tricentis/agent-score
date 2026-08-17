import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
  base: "./",
  plugins: [react(), viteSingleFile()],
  build: {
    // Published straight into the marketing site as a single static page.
    outDir: "../docs",
    emptyOutDir: true,
    // Inline every asset (including screenshots) as data URIs so the
    // singlefile plugin can fold them into the one published HTML file.
    assetsInlineLimit: Number.MAX_SAFE_INTEGER,
  },
});
