// AgentScore Business Case deck - dark "status tracker" visual system,
// color-picked from the AIDA status slide reference (Tricentis internal
// template look): deep navy canvas, pastel stat cards, dark corner-fold
// info cards, teal kickers, diagonal dotted footer band.

export const brand = {
  pageBg: "#183053",
  pageBgDeep: "#12233F",
  cardDark: "#132140",
  cardDarkAlt: "#15233A",
  navyText: "#122139",
  orange: "#FFAA2A",
  orangeDeep: "#E8951A",
  teal: "#41B6D5",
  white: "#FFFFFF",
  footerNavy: "#0A2A52",
  footerBlue: "#00458C",
  footerYellow: "#CBD457",
} as const;

// Pastel status-card palette, one per phase/category - background + a
// readable dark-on-pastel text color for headers and glyphs.
export const pastel = {
  mint: { bg: "#DCF1EC", text: "#1F7A5C", accent: "#2FA84F" },
  peach: { bg: "#FFF1DC", text: "#B5651D", accent: "#F08C2E" },
  sky: { bg: "#E2EEFB", text: "#1E5FA8", accent: "#3E8FE0" },
  lavender: { bg: "#F4E2F8", text: "#7B3F9E", accent: "#A855C9" },
} as const;

export type PastelKind = keyof typeof pastel;

export const surface = {
  textOnDark: brand.white,
  textOnDarkSecondary: "rgba(255,255,255,0.72)",
  textOnDarkFaint: "rgba(255,255,255,0.5)",
  divider: "rgba(255,255,255,0.12)",
} as const;

export const font = {
  family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

export const SLIDE_W = 1920;
export const SLIDE_H = 1080;
