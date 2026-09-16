/** The agent lifecycle chip — one derived stage, two vocabularies.
 *
 * Renders the chip only; the vocabulary tables, the tint/animation
 * derivation, and the `Lifecycle` type itself live in `lifecycle-meta.ts`
 * (`span-type-icon.tsx` / `span-type-meta.ts` is the precedent) so this file
 * exports nothing but the component.
 */

import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";

import { Chip } from "@/shared/components/chip";
import {
  lifecycleIsAnimated,
  lifecycleReasonLabel,
  lifecycleStageLabel,
  lifecycleTint,
  OPERATOR_TOOLTIP,
  type Lifecycle,
} from "@/shared/components/lifecycle-meta";

/** The stage plus its progress counter, but never the reason — the label a
 *  `reasonBelow` chip carries, with the sentence rendered under it instead. */
function labelWithoutReason(
  lifecycle: Lifecycle,
  voice: "operator" | "customer",
): string {
  const base = lifecycleStageLabel(lifecycle, voice);
  if (lifecycle.stage === "collecting" && lifecycle.threshold > 0) {
    const progress = `${lifecycle.captured} of ${lifecycle.threshold}`;
    return voice === "operator"
      ? `${base} — ${progress}`
      : `${base} — ${progress} traces`;
  }
  return base;
}

function label(
  lifecycle: Lifecycle,
  voice: "operator" | "customer",
): string {
  const base = lifecycleStageLabel(lifecycle, voice);

  // The counter is the load-bearing part of the warm-up message: "8 of 20
  // traces" is self-explanatory and visibly progressing, where the stage name
  // alone says nothing about how long this lasts. Only `collecting` renders
  // it — past the threshold the number stops answering "how much longer".
  if (lifecycle.stage === "collecting" && lifecycle.threshold > 0) {
    const progress = `${lifecycle.captured} of ${lifecycle.threshold}`;
    return voice === "operator"
      ? `${base} — ${progress}`
      : `${base} — ${progress} traces`;
  }

  // Any stage carrying a reason renders it — NOT just `needs_attention`.
  // `connecting` is the case that makes this load-bearing: a permanently
  // failed provision never leaves that stage, so without the reason an
  // operator reads "Connecting" forever on an agent that will never connect.
  // (A customer is told nothing extra there by design — `provision_failed` is
  // internal saga output the server never puts on a customer payload, so the
  // customer lookup has no entry to find and the stage renders alone.)
  if (lifecycle.reason) {
    const reason = lifecycleReasonLabel(lifecycle, voice);
    return reason ? `${base} — ${reason}` : base;
  }

  return base;
}

/**
 * One agent's stage, as a chip.
 *
 * `voice` selects the vocabulary, not the value — an agent reads the same
 * stage in both apps, in different words.
 */
export function LifecycleChip({
  lifecycle,
  voice,
  tooltip,
  testId = "lifecycle-chip",
  reasonBelow = false,
  suppressed = false,
}: {
  lifecycle: Lifecycle | null | undefined;
  voice: "operator" | "customer";
  /** Replaces the operator tooltip for this one chip. The agents list uses it
   *  to carry a failed provision's `failure_reason`, which is internal saga
   *  text the stage deliberately reduces to a reason name — the detail was
   *  reachable on hover before the stage absorbed the provisioning badge, and
   *  stays reachable now. Ignored for `voice="customer"`, where that text is
   *  never shown at all. */
  tooltip?: string | null;
  testId?: string;
  /** Render the reason as a wrapping line UNDER the chip instead of joining it
   *  onto the stage with a dash.
   *
   *  For a table cell this is not cosmetic. The chip is `nowrap`, so inside a
   *  fixed-layout column it cannot shrink — "Needs attention — last run
   *  finished without a score" simply ran out of its 17% column and printed on
   *  top of the Score cell beside it. A stage alone fits; the sentence needs
   *  its own line. */
  reasonBelow?: boolean;
  /** Renders nothing when true (the agent activation gate). The stage is
   *  still derived server-side and unchanged — a deactivated agent's pipeline
   *  stage keeps computing exactly as before — this is presentation only, so
   *  that a caller can suppress a pipeline-stage chip that would otherwise sit
   *  beside an `Inactive` badge and read as a contradiction ("Up to date" next
   *  to "Inactive"). */
  suppressed?: boolean;
}) {
  // Null is "no answer", never "nothing is happening" — an agent with no
  // benchmark row, or a binding pointing at a profile that is not there.
  // Rendering a confident stage for either would be worse than the blank the
  // rest of the row already shows.
  if (!lifecycle || suppressed) {
    return null;
  }

  const reason = reasonBelow ? lifecycleReasonLabel(lifecycle, voice) : null;
  const text = reasonBelow
    ? labelWithoutReason(lifecycle, voice)
    : label(lifecycle, voice);
  const chip = (
    <Chip
      tint={lifecycleTint(lifecycle)}
      data-testid={testId}
      // The backstop, independent of `reasonBelow`: whatever the words turn
      // out to be, the chip can never be wider than what contains it. Without
      // this a `nowrap` chip in a fixed-layout table column prints over its
      // neighbour rather than being clipped by it.
      sx={{ maxWidth: "100%", "& > span:last-of-type": { overflow: "hidden", textOverflow: "ellipsis" } }}
    >
      {lifecycleIsAnimated(lifecycle) ? <PulseDot /> : null}
      {text}
    </Chip>
  );

  // Operators get the definition of the stage on hover; customers get the
  // sentence itself and nothing more, because a tooltip explaining our
  // pipeline's internal states to a customer is the vocabulary leaking.
  const withTooltip =
    voice === "operator" ? (
      <Tooltip title={tooltip || OPERATOR_TOOLTIP[lifecycle.stage]}>
        <Box component="span" sx={{ display: "inline-flex", maxWidth: "100%" }}>
          {chip}
        </Box>
      </Tooltip>
    ) : (
      chip
    );

  if (!reasonBelow) {
    return withTooltip;
  }

  return (
    <Box sx={{ minWidth: 0 }}>
      {withTooltip}
      {reason ? (
        <Box
          data-testid={`${testId}-reason`}
          sx={{ mt: 0.5, typography: "caption", color: "text.secondary" }}
        >
          {reason.charAt(0).toUpperCase() + reason.slice(1)}
        </Box>
      ) : null}
    </Box>
  );
}

/** A 6px dot pulsing in the chip's own colour — the "work is happening now"
 *  signal. Motion is suppressed under `prefers-reduced-motion`, where the dot
 *  stays solid; the chip's WORDS already carry the state, so nothing is lost
 *  (status is text + colour, never motion alone). */
function PulseDot() {
  return (
    <Box
      component="span"
      aria-hidden
      sx={{
        width: 6,
        height: 6,
        borderRadius: "50%",
        bgcolor: "currentColor",
        flexShrink: 0,
        animation: "lifecycle-pulse 1.4s ease-in-out infinite",
        "@keyframes lifecycle-pulse": {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.25 },
        },
        "@media (prefers-reduced-motion: reduce)": { animation: "none" },
      }}
    />
  );
}
