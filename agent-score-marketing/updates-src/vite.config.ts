import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
  base: "./",
  plugins: [react(), viteSingleFile()],
  build: {
    // Published straight into the marketing site as a single static page.
    outDir: "../updates",
    emptyOutDir: true,
  },
});
