import type { CSSProperties } from "react";
import Box from "@mui/material/Box";
import { useTheme, type Theme } from "@mui/material/styles";

import { formatScore } from "@/shared/components/score-confidence";

/** The gauge's own four-state band. It is NOT the persisted `ship_decision`
 *  vocabulary — map one to the other with `gaugeVerdictFrom` in
 *  `score-gauge-verdict.ts` (a sibling module because this one exports a
 *  component and so may not export plain functions). */
export type ScoreVerdict = "ship" | "review" | "block" | "provisional";

type GaugeSize = "xxs" | "xs" | "sm" | "md" | "lg";

function ringColor(theme: Theme, verdict: ScoreVerdict): string {
  switch (verdict) {
    case "ship":
      return theme.palette.success.main;
    case "review":
      return theme.palette.warning.main;
    case "block":
      return theme.palette.error.main;
    case "provisional":
      // Neutral grey ring — the score is not yet confident enough to read as a
      // verdict zone (spec §3.1 / §3.5). Palette token, not a raw hex.
      return theme.palette.grey[400];
  }
}

// `sm` has two production callers — DimensionResult.tsx and RunResultCard.tsx
// — both at 64px; `xxs`/`xs` are additions below `sm`, not a renaming of it.
const ROOT_SIZE: Record<GaugeSize, number> = {
  xxs: 40,
  xs: 48,
  sm: 64,
  md: 96,
  lg: 128,
};
// Display-number sizing for the gauge value — a numeric (not body-text) scale
// like an icon size, so it lives outside the typography variant system. lg
// (30) is larger than any text variant by design. `xxs`/`xs` sit strictly
// below `sm`'s 16 — a 40px root leaves roughly a 23px hole for the number, so
// the digits themselves have to shrink well past the 12px typography floor
// (which doesn't apply here — this scale isn't a `Typography` variant).
const NUMBER_FONT: Record<GaugeSize, number> = {
  xxs: 10,
  xs: 13,
  sm: 16,
  md: 20,
  lg: 30,
};

interface ScoreGaugeProps {
  /** Score value (0..max), UNROUNDED. The gauge formats it to one decimal
   *  itself — callers must not pre-round. Rounding to an integer here is what
   *  let 70.43 (ship with note) and 69.87 (needs work) both render "70" on
   *  opposite sides of a band edge that is itself exactly 70. */
  value: number;
  /** Verdict band — drives the ring color. */
  verdict: ScoreVerdict;
  /** Max score. Default 100. */
  max?: number;
  /** Hide the "/ max" suffix. */
  hideMax?: boolean;
  /** Gauge size. Default "md". */
  size?: GaugeSize;
  className?: string;
}

/**
 * Conic-gradient score ring. The ring fills clockwise by `value / max`
 * and is masked to a thin annulus that surfaces the inner value text.
 * Matches the gauge in the Agent · Overview screen.
 *
 * The `provisional` verdict (spec §3.1 / §3.5) renders a full neutral-grey
 * annulus and a "?" center — the score is not yet confident enough to grade.
 */
export function ScoreGauge({
  value,
  verdict,
  max = 100,
  hideMax,
  size = "md",
  className,
}: ScoreGaugeProps) {
  const theme = useTheme();
  const isProvisional = verdict === "provisional";
  // Provisional: the score is not yet confident, so the ring renders as a full
  // neutral annulus (no fill arc) and the center reads "?" rather than a number.
  const pct = isProvisional
    ? 100
    : Math.max(0, Math.min(100, (value / max) * 100));
  const track = theme.palette.text.disabled;
  // The mask radius keyword matters: the ring `Box` below is a square element
  // clipped to a circle via `borderRadius: 9999`, but the CSS default radial
  // gradient extent — `farthest-corner` — sizes off the *square's* corner
  // distance (0.707·S), not the visible circle's edge (0.5·S). With the old
  // `transparent 58%, black 60%` stops, the opaque band starts at
  // 0.60 × 0.707·S = 0.424·S and (clipped by the circle) ends at the circle's
  // own edge, 0.5·S — an annulus ~0.076·S thick.
  //
  // Switching the extent to `closest-side` makes 100% of the gradient radius
  // land exactly on the circle's edge (0.5·S = the square's nearest side too),
  // so the same 0.424·S inner edge now needs 0.424 / 0.5 = 84.8% instead of
  // 60%. The published `transparent 82%, black 85%` pair keeps a soft blend
  // width comparable to the original (a few points, same as the old 58→60)
  // while landing the opaque band at ~0.425·S → 0.5·S — reproducing that same
  // ~0.076·S annulus thickness instead of the >2x-thicker ring a naive
  // keyword swap (58%/60% unchanged) would have produced.
  const ringStyle: CSSProperties = {
    background: isProvisional
      ? ringColor(theme, verdict)
      : `conic-gradient(${ringColor(theme, verdict)} 0% ${pct}%, ${track} ${pct}% 100%)`,
    WebkitMask:
      "radial-gradient(circle closest-side at center, transparent 82%, black 85%)",
    mask: "radial-gradient(circle closest-side at center, transparent 82%, black 85%)",
  };
  return (
    <Box
      data-slot="score-gauge"
      data-verdict={verdict}
      role="img"
      aria-label={
        isProvisional
          ? "Score provisional"
          : `Score ${formatScore(value)} of ${max} (${verdict})`
      }
      className={className}
      sx={{
        position: "relative",
        flexShrink: 0,
        width: ROOT_SIZE[size],
        height: ROOT_SIZE[size],
      }}
    >
      <Box
        sx={{ position: "absolute", inset: 0, borderRadius: 9999 }}
        style={ringStyle}
      />
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          display: "grid",
          placeItems: "center",
        }}
      >
        <Box sx={{ textAlign: "center" }}>
          <Box
            sx={{
              fontWeight: 600,
              fontVariantNumeric: "tabular-nums",
              lineHeight: 1,
              fontSize: NUMBER_FONT[size],
              color: isProvisional ? "text.disabled" : undefined,
            }}
          >
            {isProvisional ? "?" : formatScore(value)}
          </Box>
          {hideMax || isProvisional ? null : (
            <Box
              data-slot="score-gauge-max"
              sx={{
                mt: 0.25,
                typography: "caption",
                color: "text.secondary",
              }}
            >
              / {max}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
