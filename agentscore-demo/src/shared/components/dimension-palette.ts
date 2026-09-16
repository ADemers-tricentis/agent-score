/** Categorical dimension accent palette — a documented data-viz constant module.
 *
 *  Per the docs/10 convention that data-viz accent hues live in a documented
 *  constant module (precedent for `eval-detail-palette.ts`'s own accents).
 *  `categoryTint` maps eval *category labels* to a tint; this module maps
 *  *dimensions-as-entities* to a categorical accent **by index** so each
 *  dimension gets a stable, visually distinct color for its dot, group
 *  header, chip, and weight-bar segment.
 *
 *  Fixed hex constants (no MUI/theme import at module load) so the palette is
 *  a pure constant. The hues are spread around the wheel for categorical
 *  distinctness. Each accent clears the WCAG 1.4.11 non-text-UI bar (≥3:1) on
 *  `background.paper` (white) as a dot / weight-bar segment — pinned by
 *  `tests/design-system/token-contrast.test.ts`.
 */

const ACCENT_INDIGO = "#4f46e5";
const ACCENT_SKY = "#0284c7";
const ACCENT_TEAL = "#0d9488";
const ACCENT_GREEN = "#059669";
const ACCENT_AMBER = "#b45309";
const ACCENT_ORANGE = "#ea580c";
const ACCENT_ROSE = "#e11d48";
const ACCENT_FUCHSIA = "#c026d3";
const ACCENT_VIOLET = "#7c3aed";
const ACCENT_CYAN = "#0e7490";

/** The categorical dimension accent scale, cycled by `dimensionAccent`. */
export const DIMENSION_ACCENTS: readonly string[] = [
  ACCENT_INDIGO,
  ACCENT_SKY,
  ACCENT_TEAL,
  ACCENT_GREEN,
  ACCENT_AMBER,
  ACCENT_ORANGE,
  ACCENT_ROSE,
  ACCENT_FUCHSIA,
  ACCENT_VIOLET,
  ACCENT_CYAN,
] as const;

/** Accent for a dimension at a stable categorical `index`, cycling the palette.
 *  Negative / non-finite indices fall back to index 0 so a bad caller can never
 *  produce an out-of-range read. */
export function dimensionAccent(index: number): string {
  if (!Number.isFinite(index) || index < 0) {
    return DIMENSION_ACCENTS[0];
  }
  return DIMENSION_ACCENTS[Math.floor(index) % DIMENSION_ACCENTS.length];
}
