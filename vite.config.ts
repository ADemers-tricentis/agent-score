import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const AURA_ROOT = path.resolve(__dirname, "../Tricentis/aura-ui");
const ICONS_ROOT = path.resolve(AURA_ROOT, "node_modules/@tricentis/mui-icons");

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: /^@tricentis\/aura\//,
        replacement: AURA_ROOT + "/",
      },
      {
        find: /^@tricentis\/mui-icons\//,
        replacement: ICONS_ROOT + "/",
      },
    ],
  },
});
