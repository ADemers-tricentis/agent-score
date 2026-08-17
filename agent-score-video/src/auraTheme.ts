// Tokens mirrored from Tricentis Aura's color schemes
// (aura-ui/src/constants/themeOptions.tsx) — Zinc-based surfaces, Inter
// typography, soft blue primary. Kept separate from ./theme.ts so the rest
// of the Explainer video keeps its own AgentScore marketing look.
export const auraDark = {
  backgroundBase: "hsl(240, 10%, 4%)",
  backgroundRaised: "hsl(240, 6%, 10%)",
  backgroundOverlay: "hsl(240, 3.7%, 15.9%)",
  divider: "hsla(240, 5%, 34%, 1)",
  textPrimary: "hsl(0, 0%, 100%)",
  textSecondary: "hsla(240, 5%, 84%, 1)",
  primary: "hsla(210, 71%, 68%, 1)",
  primaryLight: "hsla(210, 90%, 80%, 1)",
  warning: "hsla(26, 100%, 61%, 1)",
} as const;

// Aura's light color scheme uses one flat surface color — elevation is
// conveyed with shadows, not tonal layering (per themeOptions.tsx comment:
// "Light mode uses same color for all tiers - shadows provide depth").
export const auraLight = {
  backgroundBase: "hsla(240, 5%, 96%, 1)",
  backgroundRaised: "hsla(0, 0%, 100%, 1)",
  backgroundOverlay: "hsla(0, 0%, 100%, 1)",
  divider: "hsla(240, 5%, 84%, 1)",
  textPrimary: "hsla(0, 0%, 0%, 1)",
  textSecondary: "hsla(240, 4%, 46%, 1)",
  primary: "hsla(210, 60%, 47%, 1)",
  primaryLight: "hsla(210, 70%, 39%, 1)",
  warning: "hsla(23, 80%, 45%, 1)",
} as const;

export const auraRadius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 10,
  circular: 9999,
} as const;
