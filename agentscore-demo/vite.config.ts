import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";
import path from "path";

const AURA_ROOT = path.resolve(__dirname, "../../aura-ui");
const ICONS_ROOT = path.resolve(AURA_ROOT, "node_modules/@tricentis/mui-icons");

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  resolve: {
    // Force all packages to share a single copy of these — prevents the
    // dual-context bug where aura-ui's bundled MUI and our MUI are separate
    // React context instances, causing theme.vars to be undefined in aura components.
    dedupe: [
      "react",
      "react-dom",
      "@mui/material",
      "@emotion/react",
      "@emotion/styled",
    ],
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
