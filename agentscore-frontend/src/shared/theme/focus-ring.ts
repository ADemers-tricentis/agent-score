import type { Theme } from "@mui/material/styles";

/**
 * Shared focus-visible ring for custom interactive elements rendered as
 * `Box component="button"` (data-table sortable headers, json-viewer toggles,
 * spans-tree rows, time-range presets). MUI's own controls ship their own
 * focus styles; these hand-rolled buttons need an explicit, WCAG 2.4.7
 * keyboard-focus indicator. Apply via the `sx` array form so the theme
 * callback resolves the brand color token:
 *
 *   <Box component="button" sx={[focusRing, { ...rest }]} />
 *
 * 2px solid brand-blue outline, offset 2px. Uses `:focus-visible` so it only
 * appears for keyboard navigation, not mouse clicks.
 */
export const focusRing = (theme: Theme) => ({
  "&:focus-visible": {
    outline: `2px solid ${theme.vars?.palette.primary.main ?? theme.palette.primary.main}`,
    outlineOffset: "2px",
  },
});
