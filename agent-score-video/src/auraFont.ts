import { loadFont } from "@remotion/google-fonts/Inter";

// Aura's theme typography is set to Inter (aura-ui/src/constants/themeOptions.tsx).
export const { fontFamily: auraFontFamily } = loadFont("normal", {
  weights: ["400", "500", "600", "700", "800"],
});
