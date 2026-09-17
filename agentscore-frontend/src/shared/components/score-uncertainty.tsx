import Box from "@mui/material/Box";
import { alpha } from "@mui/material/styles";
import Typography from "@mui/material/Typography";

import {
  boundaryCaveat,
  confidenceSentence,
} from "@/shared/components/score-confidence";

export interface ScoreUncertaintyProps {
  showInterval?: boolean;
  /** The composite this interval belongs to (0–100). */
  composite: number | null | undefined;
  /** Lower bound of the 95% interval (0–100). */
  lower: number | null | undefined;
  /** Upper bound of the 95% interval (0–100). */
  upper: number | null | undefined;
  /** The run's own authored bands, `{ship: 85, ship_note: 70, …}`. Drives the
   *  boundary caveat; omit it and only the range sentence renders. */
  bands?: Record<string, number> | null;
}

/**
 * How far the score could move, in words — replacing the `±5.3 SE (59–80)`
 * readout (see `score-confidence.ts` for why).
 *
 * The caveat is deliberately conditional. An interval sitting well inside one
 * band tells the reader nothing they need to act on, so it stays quiet; an
 * interval crossing a band edge is the one case where the number on the page
 * is not the whole story, and that is when it speaks up.
 */
export function ScoreUncertainty({
  composite,
  lower,
  upper,
  bands,
  showInterval = false,
}: ScoreUncertaintyProps) {
  const sentence = confidenceSentence(lower, upper);
  const caveat = boundaryCaveat({ composite, lower, upper, bands });
  if (sentence === null && caveat === null) {
    return null;
  }
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
      {sentence ? (
        <Typography
          data-slot="score-range"
          variant="caption"
          color="text.secondary"
          sx={{ fontVariantNumeric: "tabular-nums" }}
        >
          {sentence}
        </Typography>
      ) : null}
      {showInterval && lower != null && upper != null && composite != null && Number.isFinite(lower) && Number.isFinite(upper) && lower <= upper ? (
        <Box data-testid="score-uncertainty-interval" sx={{ my: 1.5 }}>
          <Box aria-hidden sx={{ position: "relative", height: 10, borderRadius: 9999, bgcolor: "action.hover" }}>
            <Box sx={{ position: "absolute", left: `${Math.max(0, Math.min(100, lower))}%`, width: `${Math.max(0, Math.min(100, upper) - Math.max(0, lower))}%`, height: "100%", bgcolor: "primary.light", borderRadius: 9999 }} />
            <Box sx={{ position: "absolute", left: `${Math.max(0, Math.min(100, composite))}%`, top: -2, width: 14, height: 14, transform: "translateX(-50%)", borderRadius: "50%", bgcolor: "primary.main", border: "2px solid", borderColor: "background.paper", boxShadow: 1 }} />
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1, gap: 1 }}>
            <Typography variant="caption" color="text.secondary">{lower.toFixed(0)}</Typography>
            <Typography variant="caption" color="text.secondary">{upper.toFixed(0)}</Typography>
          </Box>
        </Box>
      ) : null}
      {caveat ? (
        // Same tint recipe as `Chip tint="warning"` — a 15% wash of
        // `warning.main` under `warning.main` text. Reused rather than
        // re-derived: that pairing is the one the design-system contrast tests
        // already pin, and `warning.light` under `warning.dark` (the MUI
        // reflex) renders as dark orange on solid orange in this theme.
        // `alignSelf` keeps it hugging its own text instead of spanning the
        // card, so a secondary caveat does not outweigh the score it annotates.
        <Box
          data-slot="score-boundary-caveat"
          sx={(theme) => ({
            alignSelf: "flex-start",
            px: 1,
            py: 0.5,
            borderRadius: 1,
            backgroundColor: alpha(theme.palette.warning.main, 0.15),
            color: theme.palette.warning.main,
          })}
        >
          <Typography variant="caption">{caveat}</Typography>
        </Box>
      ) : null}
    </Box>
  );
}
