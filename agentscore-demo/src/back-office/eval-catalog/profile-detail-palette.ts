/** Profile detail-panel accent ramp — a documented data-viz constant module.
 *
 *  Per the docs/10 convention that data-viz accent hues live in a documented
 *  constant module (precedents: `dimension-palette.ts`, `eval-detail-palette.ts`),
 *  this holds the single **indigo profile accent** the composite-first panel
 *  needs for its identity — the header badge fill, the formula box, and the
 *  Composite/Verdict pipeline-stage labels. It is deliberately **not** a theme
 *  slot: `primary` is the blue used by the Run button + the `CardGrid` border,
 *  so reusing it would collapse the profile's identity into the chrome. And it
 *  is a **deeper indigo (`#4338CA`) than `DIMENSION_ACCENTS[0]` (`#4F46E5`)** so
 *  the badge never reads as "dimension #0" — that dimension-0 hue appears in the
 * same panel's weight legend + eval-group dots.
 *
 *  Fixed hex constants (no theme import) — same shape as the two precedent
 *  modules. `accentText` is the AA-safe (≥4.5:1) dark shade for text on white
 *  and on `accentTint`; `accent` is the solid fill (white glyph ≥3:1 UI). Pinned
 *  by `tests/design-system/token-contrast.test.ts`. Used via a variable
 *  reference in `sx` (never an inline hex literal), so the raw-hex ESLint ban +
 *  `design_system_guard.py` are satisfied.
 */

export interface ProfileAccentRamp {
  /** Solid indigo fill — header badge + (with a white glyph) the only ≥3:1-UI pair. */
  accent: string;
  /** AA-safe (≥4.5:1) dark indigo for text — formula text, pipeline-stage labels. */
  accentText: string;
  /** Light indigo tint — formula box + Composite/Verdict stage fills. */
  accentTint: string;
  /** Light indigo border — formula box + tinted-stage borders. */
  accentBorder: string;
}

export const PROFILE: ProfileAccentRamp = {
  accent: "#4338CA",
  accentText: "#3730A3",
  accentTint: "#EEF0FE",
  accentBorder: "#D6D9FB",
};
