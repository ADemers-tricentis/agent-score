import Box from "@mui/material/Box";
import { alpha, type Theme } from "@mui/material/styles";

import type { ScoreVerdict } from "@/shared/components/score-gauge";

const VERDICT_LABEL = {
  ship: "Ship",
  review: "Review",
  block: "Block",
  provisional: "Provisional",
} as const satisfies Record<ScoreVerdict, string>;

// Verdict zone → stock semantic palette slot (spec §4.8: success/warning/error).
// `provisional` (the gauge's neutral state) maps to null → the muted pill.
const VERDICT_COLOR = {
  ship: "success",
  review: "warning",
  block: "error",
  provisional: null,
} as const satisfies Record<ScoreVerdict, "success" | "warning" | "error" | null>;

const SHIP_DECISION_LABEL = {
  ship: "Ship",
  needs_work: "Needs work",
  dont_ship: "Don't ship",
  provisional: "Provisional",
} as const;

export type ShipDecision = keyof typeof SHIP_DECISION_LABEL;

// 3-state ship decision → semantic palette slot (spec §3.1). `provisional`
// reads as a neutral pill (no verdict zone yet), so it uses the muted
// text-secondary token rather than success/warning/error.
const SHIP_DECISION_COLOR = {
  ship: "success",
  needs_work: "warning",
  dont_ship: "error",
  provisional: null,
} as const satisfies Record<
  ShipDecision,
  "success" | "warning" | "error" | null
>;

interface VerdictBadgeProps
  extends Omit<React.ComponentProps<"span">, "children"> {
  /**
   * Verdict band (existing behavior). Accepts the full `ScoreVerdict` union so
   * it stays in lockstep with `ScoreGauge`; `provisional` renders the neutral
   * pill. The page chooses this mode.
   */
  verdict?: ScoreVerdict;
  /**
   * 3-state server-computed ship decision (spec §3.1). When set, takes
   * precedence over `verdict`. ship→success, needs_work→warning,
   * dont_ship→error, provisional→neutral.
   */
  shipDecision?: ShipDecision;
  /** Override the default label text. Useful for localization. */
  label?: string;
}

function pillSx(
  theme: Theme,
  colorSlot: "success" | "warning" | "error" | null,
) {
  // null colorSlot = the neutral (provisional) pill: muted background + text,
  // no semantic verdict zone. All values resolve from theme tokens (no hex).
  const bgcolor =
    colorSlot === null
      ? alpha(theme.palette.text.secondary, 0.12)
      : alpha(theme.palette[colorSlot].main, 0.15);
  const color =
    colorSlot === null ? theme.palette.text.secondary : `${colorSlot}.main`;
  return {
    display: "inline-flex",
    height: 20,
    width: "fit-content",
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9999,
    px: 1,
    typography: "caption",
    fontWeight: 500,
    whiteSpace: "nowrap",
    bgcolor,
    color,
  };
}

/**
 * Score-verdict pill. Two modes:
 *  - `verdict` (band): Ship (success) / Review (warning) / Block (error) /
 *    Provisional (neutral) — mirrors the `ScoreGauge` band set.
 *  - `shipDecision` (3-state, spec §3.1): Ship / Needs work / Don't ship /
 *    Provisional (neutral). When `shipDecision` is set it wins.
 */
export function VerdictBadge({
  verdict,
  shipDecision,
  label,
  className,
  ...rest
}: VerdictBadgeProps) {
  if (shipDecision) {
    return (
      <Box
        component="span"
        data-slot="verdict-badge"
        data-ship-decision={shipDecision}
        className={className}
        sx={(theme) => pillSx(theme, SHIP_DECISION_COLOR[shipDecision])}
        {...rest}
      >
        {label ?? SHIP_DECISION_LABEL[shipDecision]}
      </Box>
    );
  }

  const resolved: ScoreVerdict = verdict ?? "review";
  return (
    <Box
      component="span"
      data-slot="verdict-badge"
      data-verdict={resolved}
      className={className}
      sx={(theme) => pillSx(theme, VERDICT_COLOR[resolved])}
      {...rest}
    >
      {label ?? VERDICT_LABEL[resolved]}
    </Box>
  );
}
