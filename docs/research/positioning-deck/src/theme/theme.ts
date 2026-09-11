// AgentScore brand tokens - ported from agent-score-video/src/theme.ts
// (the real marketing-site palette) and agent-score-video/src/auraTheme.ts
// (surface/radius reference only). This file is the single source of
// truth for the positioning deck; nothing here should drift from the
// values in agent-score-video without a deliberate reason.

export const brand = {
  navy: "#1b365d",
  navyDeep: "#12264a",
  navyMid: "#254a7a",
  primary: "#004c97",
  orange: "#ff6c0e",
  orangeDark: "#e55c00",
  teal: "#0087ae",
  tealLight: "#59c8e6",
  bgLight: "#f4f7fb",
  bgMid: "#e8eef6",
  white: "#ffffff",
  shipBg: "#e8f7f0",
  reviewBg: "#fff3e6",
  blockBg: "#fde8e6",
} as const;

// Surface / elevation language borrowed from Aura's "shadows convey
// elevation on light surfaces" approach (auraTheme.ts), applied on top of
// the navy/orange/teal brand palette rather than Aura's zinc/blue tokens.
export const surface = {
  base: brand.bgLight,
  raised: brand.white,
  divider: "rgba(27, 54, 93, 0.12)",
  dividerStrong: "rgba(27, 54, 93, 0.22)",
  textPrimary: brand.navyDeep,
  textSecondary: "rgba(18, 38, 74, 0.62)",
  textOnDark: brand.white,
  textOnDarkSecondary: "rgba(255, 255, 255, 0.72)",
} as const;

export const radius = {
  xs: 4,
  sm: 6,
  md: 10,
  lg: 16,
  circular: 9999,
} as const;

export const shadow = {
  card: "0 1px 2px rgba(18, 38, 74, 0.06), 0 8px 24px rgba(18, 38, 74, 0.08)",
  raised: "0 2px 4px rgba(18, 38, 74, 0.08), 0 16px 40px rgba(18, 38, 74, 0.12)",
} as const;

export const font = {
  family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

// Accent registers - each slide "kind" borrows one accent from the single
// brand palette rather than introducing new hues.
export const accents = {
  differentiator: { color: brand.teal, tint: "rgba(0, 135, 174, 0.10)", tintStrong: "rgba(0, 135, 174, 0.16)" },
  gap: { color: brand.orange, tint: "rgba(255, 108, 14, 0.10)", tintStrong: "rgba(255, 108, 14, 0.16)" },
  recommendation: { color: brand.primary, tint: "rgba(0, 76, 151, 0.08)", tintStrong: "rgba(0, 76, 151, 0.14)" },
  neutral: { color: brand.navy, tint: "rgba(27, 54, 93, 0.06)", tintStrong: "rgba(27, 54, 93, 0.12)" },
} as const;

export type AccentKind = keyof typeof accents;

export const SLIDE_W = 1920;
export const SLIDE_H = 1080;
