import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import type SvgIcon from "@mui/material/SvgIcon";
import type { SxProps, Theme } from "@mui/material/styles";

type DeltaTone = "neutral" | "success" | "warning" | "destructive";

// delta tone → palette color string (spec §4.8).
const DELTA_COLOR: Record<DeltaTone, string> = {
  neutral: "text.secondary",
  success: "success.main",
  warning: "warning.main",
  destructive: "error.main",
};

interface StatCardProps {
  /** Eyebrow label (uppercase). */
  label: ReactNode;
  /** Primary numeric value. */
  value: ReactNode;
  /** Optional icon in the top-right corner. */
  icon?: typeof SvgIcon;
  /** Optional delta indicator next to the value (e.g. "▲ 12%", "+4 new"). */
  delta?: ReactNode;
  /** Tone for the delta. */
  tone?: DeltaTone;
  /** Optional secondary hint line below the value. */
  hint?: ReactNode;
  /** Optional sparkline / chart slot rendered between value and hint. */
  chart?: ReactNode;
  className?: string;
  /** Extra styles merged onto the card root (e.g. `height: "100%"` to fill a grid cell). */
  sx?: SxProps<Theme>;
}

/**
 * KPI card for dashboards. Eyebrow label + big value + optional
 * delta / hint / inline chart. Matches the dashboard stat cards in
 * `docs/03-backoffice-ui-design.html`.
 */
export function StatCard({
  label,
  value,
  icon: Icon,
  delta,
  tone = "neutral",
  hint,
  chart,
  className,
  sx,
}: StatCardProps) {
  return (
    <Box
      data-slot="stat-card"
      className={className}
      sx={[
        {
          display: "flex",
          flexDirection: "column",
          gap: 0.75,
          borderRadius: 1,
          border: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
          p: 2,
          color: "text.primary",
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box
          sx={{
            typography: "overline",
            color: "text.secondary",
          }}
        >
          {label}
        </Box>
        {Icon ? (
          <Box
            component="span"
            sx={{ display: "inline-flex", color: "text.secondary" }}
          >
            <Icon sx={{ fontSize: 14 }} />
          </Box>
        ) : null}
      </Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 1,
        }}
      >
        <Box
          sx={{
            typography: "h3",
            fontWeight: 600,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {value}
        </Box>
        {delta !== undefined && delta !== null ? (
          <Box
            data-slot="stat-card-delta"
            sx={{
              typography: "caption",
              lineHeight: 1.25,
              fontVariantNumeric: "tabular-nums",
              whiteSpace: "nowrap",
              color: DELTA_COLOR[tone],
            }}
          >
            {delta}
          </Box>
        ) : null}
      </Box>
      {chart ? (
        <Box data-slot="stat-card-chart" sx={{ mt: 0.5, width: "100%" }}>
          {chart}
        </Box>
      ) : null}
      {hint ? (
        <Box sx={{ typography: "caption", color: "text.secondary" }}>
          {hint}
        </Box>
      ) : null}
    </Box>
  );
}
