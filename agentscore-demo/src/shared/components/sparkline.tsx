import { styled, type Theme } from "@mui/material/styles";

type SparklineTone =
  | "success"
  | "warning"
  | "destructive"
  | "accent"
  | "muted";

// tone → theme color the SVG's `currentColor` stroke resolves to.
function toneColor(theme: Theme, tone: SparklineTone): string {
  switch (tone) {
    case "success":
      return theme.palette.success.main;
    case "warning":
      return theme.palette.warning.main;
    case "destructive":
      return theme.palette.error.main;
    case "accent":
      return theme.palette.primary.main;
    case "muted":
      return theme.palette.text.secondary;
  }
}

interface SparklineProps {
  /** Numeric series. Auto-scaled to fit the viewBox. Min length 2. */
  values: number[];
  /** Stroke tone. Default "accent". */
  tone?: SparklineTone;
  /** SVG width. Default 88. */
  width?: number;
  /** SVG height. Default 18. */
  height?: number;
  /** Stroke width. Default 1.5. */
  strokeWidth?: number;
  /** Stretch the SVG horizontally to fill its container. */
  stretch?: boolean;
  className?: string;
  ariaLabel?: string;
}

const Svg = styled("svg", {
  shouldForwardProp: (prop) => prop !== "tone" && prop !== "stretch",
})<{ tone: SparklineTone; stretch: boolean }>(({ theme, tone, stretch }) => ({
  fill: "none",
  color: toneColor(theme, tone),
  ...(stretch ? { width: "100%" } : null),
}));

/**
 * Tiny inline trend chart. Renders a polyline auto-scaled to the SVG box.
 * Used in table cells (score column) and dashboard KPI cards.
 */
export function Sparkline({
  values,
  width = 88,
  height = 18,
  strokeWidth = 1.5,
  tone = "accent",
  stretch = false,
  className,
  ariaLabel,
}: SparklineProps) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const stepX = width / (values.length - 1);
  const pad = strokeWidth;
  const usable = height - pad * 2;
  const points = values
    .map((v, i) => {
      const x = i * stepX;
      const y = pad + (1 - (v - min) / span) * usable;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
  return (
    <Svg
      data-slot="sparkline"
      role="img"
      aria-label={ariaLabel ?? "trend"}
      viewBox={`0 0 ${width} ${height}`}
      width={stretch ? undefined : width}
      height={height}
      preserveAspectRatio="none"
      tone={tone}
      stretch={stretch}
      className={className}
    >
      <polyline
        points={points}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
