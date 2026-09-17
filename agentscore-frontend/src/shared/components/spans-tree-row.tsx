import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import { alpha } from "@mui/material/styles";

import { focusRing } from "@/shared/theme/focus-ring";
import { InlineTimelineBar } from "@/shared/components/inline-timeline-bar";
import { SpanTypeIcon } from "@/shared/components/span-type-icon";
import { type SpanType } from "@/shared/components/span-type-meta";

interface SpansTreeRowProps {
  /** Display name (e.g. "billing-agent.invoke", "llm.openai.gpt-4o"). */
  name: ReactNode;
  /** OTel span.kind → SpanType mapping. */
  type: SpanType;
  /** Indent level (nesting depth). */
  depth?: number;
  /** Offset of this span from the trace start, in ms. */
  offsetMs: number;
  /** Duration of this span, in ms. */
  durationMs: number;
  /** Total trace duration, in ms (denominator for the mini-bar). */
  totalMs: number;
  /** Formatted duration (e.g. "680ms", "1.21s"). Right-aligned. */
  durationLabel: ReactNode;
  /** Optional second-line chips under the name. */
  chips?: ReactNode;
  /** When true, render in the selected state. */
  selected?: boolean;
  onClick?: () => void;
  /** Stable per-row hook for e2e — lands as `data-testid` on the row `<button>`. */
  testId?: string;
  className?: string;
}

const INDENT_PX = 16;
const BASE_INDENT_PX = 12;

/**
 * One row in the spans tree. Shows the type icon, name (truncated), inline
 * timeline mini-bar, and duration, with an optional second line of chips.
 * Selected rows get an accent left border + tinted background.
 */
export function SpansTreeRow({
  name,
  type,
  depth = 0,
  offsetMs,
  durationMs,
  totalMs,
  durationLabel,
  chips,
  selected = false,
  onClick,
  testId,
  className,
}: SpansTreeRowProps) {
  return (
    <Box
      component="button"
      type="button"
      data-slot="spans-tree-row"
      data-testid={testId}
      data-selected={selected || undefined}
      onClick={onClick}
      className={className}
      style={{ paddingLeft: BASE_INDENT_PX + depth * INDENT_PX }}
      sx={[
        focusRing,
        (theme) => ({
          appearance: "none",
          cursor: "pointer",
          width: "100%",
          borderTop: 0,
          borderRight: 0,
          borderBottom: 0,
          borderLeft: 2,
          borderStyle: "solid",
          borderLeftColor: selected ? theme.palette.primary.main : "transparent",
          py: 1,
          pr: 1.5,
          textAlign: "left",
          typography: "caption",
          bgcolor: selected
            ? alpha(theme.palette.primary.main, 0.1)
            : "transparent",
          "&:hover": {
            bgcolor: selected
              ? alpha(theme.palette.primary.main, 0.1)
              : alpha(theme.palette.action.hover, 0.6),
          },
        }),
      ]}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Box
          sx={{
            display: "flex",
            width: 128,
            minWidth: 0,
            flexShrink: 0,
            alignItems: "center",
            gap: 0.75,
          }}
        >
          <SpanTypeIcon type={type} />
          <Box
            component="span"
            sx={(theme) => ({
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontWeight: selected ? 500 : 400,
              color: selected
                ? theme.palette.text.primary
                : alpha(theme.palette.text.primary, 0.85),
            })}
          >
            {name}
          </Box>
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <InlineTimelineBar
            offsetMs={offsetMs}
            durationMs={durationMs}
            totalMs={totalMs}
            type={type}
          />
        </Box>
        <Box
          component="span"
          sx={{
            width: 56,
            flexShrink: 0,
            textAlign: "right",
            fontFamily: "monospace",
            typography: "caption",
            color: "text.secondary",
          }}
        >
          {durationLabel}
        </Box>
      </Box>
      {chips ? (
        <Box
          sx={{
            ml: 2.5,
            mt: 0.5,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 0.5,
            typography: "caption",
            fontFamily: "monospace",
            color: "text.secondary",
          }}
        >
          {chips}
        </Box>
      ) : null}
    </Box>
  );
}
