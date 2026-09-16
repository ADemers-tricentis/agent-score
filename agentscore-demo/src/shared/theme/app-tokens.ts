/// <reference types="@mui/material/themeCssVarsAugmentation" />

/**
 * App-specific theme overlay, merged last into Aura's base theme via
 * `extendTheme(themeOptions, themeOptionsDataGrid, appTokens)`. The app adopts
 * Aura's tokens, typography, and shape **natively** — this fragment
 * carries only the product-level deviations Aura's base does not cover:
 * light-only mode; a WCAG-AA correction to `text.secondary`; and the
 * thin dashed-outlined-button affordance. (The Inter font is registered under
 * the name Aura asks for — "Inter" — in `globals.css`, not here. The content
 * canvas uses the nav surface — see `SidebarShell` — so no canvas token override
 * lives here.)
 */
export const appTokens = {
  // Light-only (Non-Goal #3): disable Aura's dark scheme so the app never
  // follows the OS `prefers-color-scheme: dark` (Aura's theme uses the `media`
  // colorSchemeSelector, which `defaultMode` alone cannot override). With no
  // dark scheme there is nothing to switch to — the app always renders light.
  colorSchemes: {
    dark: false,
    // A11y override of the "native palette" stance: Aura's
    // light `text.secondary` (#71717A) is only marginal on the app's white
    // surfaces (4.83:1 — AA passes but no AAA headroom). Darken to #52525B
    // (7.73:1 on white) so every secondary-text site clears AA comfortably.
    // Compliance override per CLAUDE.md "Overrides"; the token-contrast test pins it.
    light: {
      palette: {
        text: { secondary: "#52525B" },
      },
    },
  },
  components: {
    MuiButton: {
      // Match the Tosca portal's compact button (32px / 13px); Aura's default
      // `medium` renders ~36px / 14px. A button opts into a larger size
      // explicitly where a CTA needs extra prominence.
      defaultProps: { size: "small" as const },
      styleOverrides: {
        // Override (Aura-compat): Aura's outlined variant draws its outline with
        // a box-shadow and leaves `border-style: none`, so border-width is
        // invisible on normal outlined buttons. Buttons that re-enable a
        // border-style via sx — the "Show deleted" toggles (`toggle-deleted`)
        // use `dashed`; the `FacetedFilter` trigger
        // uses `solid` — would otherwise fall back to the CSS initial
        // `border-width: medium` (3px). Pin it to 1px here so every such outlined
        // button has a thin, consistent border without per-site overrides.
        outlined: { borderWidth: 1 },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        // Match the 32px height of our buttons (`size="small"`); MUI's default
        // small ToggleButton renders ~39px. Trim the vertical padding so the
        // text still fits the shorter box. Applies to every toggle group (eval
        // view, traces, studio) from one place.
        root: { height: 32, paddingTop: 4, paddingBottom: 4 },
      },
    },
    MuiBreadcrumbs: {
      styleOverrides: {
        // Aura styles breadcrumbs as a "bar": a `borderBottom` divider plus
        // `marginInline: 20px` that indents them from the page title. Render the
        // breadcrumb as plain inline text instead — no border and no side margin,
        // so it sits flush-left, inline with the page title. (Object replaces
        // Aura's function root; the `li` last-child color override is untouched.)
        root: {
          display: "flex",
          alignItems: "center",
          marginInline: 0,
          paddingBlock: 0,
          borderBottom: "none",
        },
      },
    },
  },
};
