import Box from "@mui/material/Box";

import {
  SPAN_TYPE_META,
  type SpanType,
} from "@/shared/components/span-type-meta";

interface InlineTimelineBarProps {
  /** Span start offset relative to trace, in milliseconds. */
  offsetMs: number;
  /** Span duration, in milliseconds. */
  durationMs: number;
  /** Total trace duration, in milliseconds. */
  totalMs: number;
  /** Span type — drives the bar color. Default `generic`. */
  type?: SpanType;
  className?: string;
}

const MIN_WIDTH_PCT = 0.5; // ensure very short spans remain visible

/**
 * Compact horizontal timeline bar. Renders a fixed-height track with a
 * colored segment positioned at `(offsetMs / totalMs) * 100%` and sized by
 * `(durationMs / totalMs) * 100%`. Color comes from the span-type palette.
 */
export function InlineTimelineBar({
  offsetMs,
  durationMs,
  totalMs,
  type = "generic",
  className,
}: InlineTimelineBarProps) {
  const safeTotal = totalMs > 0 ? totalMs : 1;
  const leftPct = Math.max(0, Math.min(100, (offsetMs / safeTotal) * 100));
  const widthPct = Math.max(
    MIN_WIDTH_PCT,
    Math.min(100 - leftPct, (durationMs / safeTotal) * 100),
  );
  return (
    <Box
      data-slot="timeline-bar"
      data-type={type}
      className={className}
      sx={{
        position: "relative",
        height: 8,
        width: "100%",
        overflow: "hidden",
        borderRadius: 0.5,
        bgcolor: "action.hover",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          height: "100%",
          borderRadius: 0.5,
          bgcolor: SPAN_TYPE_META[type].color,
          left: `${leftPct.toFixed(2)}%`,
          width: `${widthPct.toFixed(2)}%`,
        }}
      />
    </Box>
  );
}
