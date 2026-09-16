import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import type { SvgIconProps } from "@mui/material/SvgIcon";
import IconMaterialSymbolsCheckCircle from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsCheckCircle.mjs";
import IconMaterialSymbolsWarning from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsWarning.mjs";
import IconMaterialSymbolsError from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsError.mjs";
import IconMaterialSymbolsHorizontalRule from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsHorizontalRule.mjs";
import IconMaterialSymbolsArrowUpward from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsArrowUpward.mjs";
import IconMaterialSymbolsArrowDownward from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsArrowDownward.mjs";
import IconMaterialSymbolsTrendingFlat from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsTrendingFlat.mjs";

import type { components } from "@/shared/api/generated";
import { dimensionAccent } from "@/shared/components/dimension-palette";

type RunMetricOut = components["schemas"]["RunMetricOut"];

export type PointStatus = "fail" | "partial" | "good" | "n_a";
export type TrendDirection = "up" | "down" | "flat" | "n_a";

export interface PerPointGridProps {
  /** Run metrics, served by the run schema; grouped by `dimensionSlug`. */
  metrics: RunMetricOut[];
  /**
   * Own-trend direction per `evalSlug` vs the prior same-profile run
   * (spec §3.1). Slugs absent from the map render `n_a`. The parent computes
   * these from `GET …/scoring/trend?eval=<slug>`.
   */
  trendBySlug?: Record<string, TrendDirection>;
  /**
   * Human-readable eval name per `evalSlug`. When a slug is absent the slug is
   * prettified (`_`→space, drops the `<kind>.` prefix) as a fallback.
   */
  labelBySlug?: Record<string, string>;
  /** Row click (non-N/A rows only) → drill into the eval's per-interaction view. */
  onDrillMetric?: (evalSlug: string) => void;
}

function prettifySlug(slug: string): string {
  const tail = slug.includes(".") ? slug.slice(slug.indexOf(".") + 1) : slug;
  return tail.replace(/_/g, " ");
}

function statusIcon(status: PointStatus): {
  Icon: React.ComponentType<SvgIconProps>;
  color: SvgIconProps["color"];
  label: string;
} {
  switch (status) {
    case "good":
      return {
        Icon: IconMaterialSymbolsCheckCircle,
        color: "success",
        label: "good",
      };
    case "partial":
      return {
        Icon: IconMaterialSymbolsWarning,
        color: "warning",
        label: "partial",
      };
    case "fail":
      return { Icon: IconMaterialSymbolsError, color: "error", label: "fail" };
    case "n_a":
      return {
        Icon: IconMaterialSymbolsHorizontalRule,
        color: "disabled",
        label: "not applicable",
      };
  }
}

function trendIcon(direction: TrendDirection): {
  Icon: React.ComponentType<SvgIconProps>;
  color: SvgIconProps["color"];
  label: string;
} | null {
  switch (direction) {
    case "up":
      return {
        Icon: IconMaterialSymbolsArrowUpward,
        color: "success",
        label: "trending up",
      };
    case "down":
      return {
        Icon: IconMaterialSymbolsArrowDownward,
        color: "error",
        label: "trending down",
      };
    case "flat":
      return {
        Icon: IconMaterialSymbolsTrendingFlat,
        color: "disabled",
        label: "flat",
      };
    case "n_a":
      return null;
  }
}

function pct(value: number | null | undefined): string {
  return value === null || value === undefined
    ? "—"
    : `${Math.round(value * 100)}%`;
}

/**
 * Per-point scorecard grid (spec §3.1). Groups the run's metrics by dimension
 * (stable accent from `dimension-palette`), one row per eval with a status
 * icon (good/partial/fail/N/A), mean %, target %, and an own-trend arrow.
 * N/A rows render greyed with no trend arrow and no drill affordance. Active
 * rows are clickable → `onDrillMetric(evalSlug)`. Built on MUI `Table`.
 */
export function PerPointGrid({
  metrics,
  trendBySlug,
  labelBySlug,
  onDrillMetric,
}: PerPointGridProps) {
  // Group by dimensionSlug, preserving first-seen order so the accent index is
  // stable across renders.
  const order: string[] = [];
  const groups = new Map<string, RunMetricOut[]>();
  for (const m of metrics) {
    const key = m.dimensionSlug;
    if (!groups.has(key)) {
      groups.set(key, []);
      order.push(key);
    }
    groups.get(key)!.push(m);
  }

  const hasTrend = Object.values(trendBySlug ?? {}).some((direction) => direction !== "n_a");
  return (
    <Box data-slot="per-point-grid" sx={{ overflowX: "auto" }}>
      {order.map((dimSlug, dimIndex) => {
        const accent = dimensionAccent(dimIndex);
        const rows = groups.get(dimSlug)!;
        return (
          <Box key={dimSlug} sx={{ mb: 2 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mb: 0.5,
              }}
            >
              <Box
                aria-hidden
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: 9999,
                  flexShrink: 0,
                  bgcolor: accent,
                }}
              />
              <Typography
                variant="subtitle2"
                sx={{ textTransform: "capitalize" }}
              >
                {prettifySlug(dimSlug)}
              </Typography>
            </Box>
            <Table size="small" aria-label={`${prettifySlug(dimSlug)} evals`}>
              <TableHead>
                <TableRow>
                  <TableCell>Evaluation</TableCell>
                  <TableCell>Result</TableCell>
                  <TableCell align="right">Average</TableCell>
                  <TableCell align="right">Target</TableCell>
                  {hasTrend ? <TableCell align="center">Trend</TableCell> : null}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((m) => {
                  const status: PointStatus = m.status ?? "n_a";
                  const isNa = status === "n_a";
                  const { Icon, color, label } = statusIcon(status);
                  const direction = trendBySlug?.[m.evalSlug] ?? "n_a";
                  const trend = isNa ? null : trendIcon(direction);
                  const name =
                    labelBySlug?.[m.evalSlug] ?? prettifySlug(m.evalSlug);
                  const clickable = !isNa && Boolean(onDrillMetric);
                  return (
                    <TableRow
                      key={m.evalSlug}
                      data-slot="per-point-row"
                      data-eval-slug={m.evalSlug}
                      data-status={status}
                      hover={clickable}
                      onClick={
                        clickable ? () => onDrillMetric!(m.evalSlug) : undefined
                      }
                      sx={{
                        cursor: clickable ? "pointer" : "default",
                        opacity: isNa ? 0.5 : 1,
                      }}
                    >
                      <TableCell
                        sx={{
                          textTransform: "capitalize",
                          color: isNa ? "text.disabled" : "text.primary",
                        }}
                      >
                        {clickable ? <Button data-testid={`score-evaluation-${m.evalSlug}`} onClick={(event) => { event.stopPropagation(); onDrillMetric!(m.evalSlug); }} sx={{ p: 0, textAlign: "left", justifyContent: "flex-start", textTransform: "capitalize", color: "text.primary" }}>{name}</Button> : name}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Icon
                          fontSize="small"
                          color={color}
                          titleAccess={label}
                          aria-label={label}
                        />
                        <Typography variant="body2">{status === "good" ? "Meets threshold" : status === "fail" ? "Needs attention" : status === "partial" ? "Partially meets threshold" : "Not scored"}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ fontVariantNumeric: "tabular-nums" }}
                      >
                        {pct(m.mean)}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ fontVariantNumeric: "tabular-nums" }}
                      >
                        {m.target == null ? "Not provided" : pct(m.target)}
                      </TableCell>
                      {hasTrend ? <TableCell align="center">
                        {trend ? (
                          <trend.Icon
                            fontSize="small"
                            color={trend.color}
                            titleAccess={trend.label}
                            aria-label={trend.label}
                          />
                        ) : null}
                      </TableCell> : null}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        );
      })}
    </Box>
  );
}
