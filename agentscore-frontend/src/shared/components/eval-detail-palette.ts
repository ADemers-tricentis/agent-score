/** Eval detail-panel accent palette — a documented data-viz constant module.
 *
 *  Per the docs/10 convention that data-viz accent hues live in a documented
 *  constant module (precedent: `dimension-palette.ts`),
 *  this holds the **irreducible darker shades** the detail panel's "how it
 *  scores" visuals need that no theme token provides and that `alpha()` of an
 *  accent cannot reach while clearing WCAG AA. Specifically: the per-kind dark
 *  TEXT shade (kind tag + tinted labels) and the semantic verdict TEXT shades
 *  (verdict pills). The light `tint`/`border` fills live here
 *  too so each kind's tinted surface is one source of truth.
 *
 *  Fixed hex constants (no theme import) — same shape as the two precedent
 *  modules. Every text-bearing pair clears WCAG AA (≥4.5:1) on white AND on its
 *  own `tint`; pinned by `tests/design-system/token-contrast.test.ts`. Used via
 *  a variable reference in `sx` (never an inline hex literal), so the raw-hex
 *  ESLint ban + `design_system_guard.py` are satisfied.
 */

/** Per-kind ramp for the detail panel. `text` is the AA-safe dark shade for the
 *  kind tag + tinted-section labels; `tint`/`border` back the kind's tinted
 *  surfaces (G-Eval stepper, Hybrid stages/formula). The solid
 *  kind hue (icon badge, judge-node glyph) is `kindAccent` in `eval-card.tsx`. */
export interface KindRamp {
  text: string;
  tint: string;
  border: string;
}

export const KIND_RAMP: Record<string, KindRamp> = {
  library: { text: "#1E64A9", tint: "#EAF2FA", border: "#CFE0F2" },
  g_eval: { text: "#6D28D9", tint: "#F1ECFB", border: "#E0D4F7" },
  hybrid: { text: "#A21CAF", tint: "#FCF1FD", border: "#EBC7EE" },
};

/** Neutral fallback for an unknown kind. */
export const KIND_RAMP_FALLBACK: KindRamp = {
  text: "#3F3F46",
  tint: "#F4F4F5",
  border: "#E4E4E7",
};

export function kindRamp(kind: string): KindRamp {
  return KIND_RAMP[kind] ?? KIND_RAMP_FALLBACK;
}

/** Deepest fuchsia shade for the Hybrid reduce formula text on its tint. */
export const HYBRID_FORMULA_TEXT = "#86198F";

/** Semantic verdict shades for verdict pills. Text shades
 *  are deepened so they clear AA (≥4.5:1) as TEXT on their own light `*Tint`
 *  and on white — the theme `success`/`error`/`warning` mains are only ≥3:1 (UI
 *  bar) and read sub-AA as small text on these fills. */
export const VERDICT = {
  passText: "#166534",
  passTint: "#EAF5EA",
  failText: "#B42318",
  failTint: "#FBEAEA",
  midText: "#B45309",
  midTint: "#FDF2E6",
} as const;
