import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";
import pkg from "./package.json";

export default defineConfig({
  base: "./",
  plugins: [react(), viteSingleFile()],
  define: {
    __DOCS_VERSION__: JSON.stringify(pkg.version),
    __DOCS_BUILD_DATE__: JSON.stringify(
      new Date().toISOString().slice(0, 10)
    ),
  },
  build: {
    // Published straight into the marketing site as a single static page.
    outDir: "../docs",
    emptyOutDir: true,
    // Inline every asset (including screenshots) as data URIs so the
    // singlefile plugin can fold them into the one published HTML file.
    assetsInlineLimit: Number.MAX_SAFE_INTEGER,
  },
});
