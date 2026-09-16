import type { ReactNode } from "react";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import type { SvgIconProps } from "@mui/material/SvgIcon";
import IconMaterialSymbolsArrowUpward from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsArrowUpward.mjs";
import IconMaterialSymbolsArrowDownward from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsArrowDownward.mjs";
import IconMaterialSymbolsTrendingFlat from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsTrendingFlat.mjs";
import IconMaterialSymbolsChevronForward from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsChevronForward.mjs";

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
  /** `evalSlug` of the row whose detail should render inline, directly under
   *  that row — so drilling into an eval near the top of the list doesn't pop
   *  a panel below unrelated categories further down. */
  expandedSlug?: string | null;
  /** Renders the inline detail panel for `expandedSlug`. Only called for the
   *  row matching `expandedSlug`. */
  renderExpanded?: (evalSlug: string) => ReactNode;
}

function prettifySlug(slug: string): string {
  const tail = slug.includes(".") ? slug.slice(slug.indexOf(".") + 1) : slug;
  return tail.replace(/_/g, " ");
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

function statusResultLabel(status: PointStatus): string {
  switch (status) {
    case "good":
      return "Meets threshold";
    case "fail":
      return "Needs attention";
    case "partial":
      return "Partially meets threshold";
    case "n_a":
      return "Not scored";
  }
}

/** Status → theme color slot for the pill background/text, resolved at
 *  render time via `sx` callback rather than a fixed hex (matches `Chip`'s
 *  tint recipe: a 15% wash of the semantic color under the same color text). */
function statusPillColor(status: PointStatus): "success" | "warning" | "error" | null {
  switch (status) {
    case "good":
      return "success";
    case "partial":
      return "warning";
    case "fail":
      return "error";
    case "n_a":
      return null;
  }
}

/**
 * Per-point scorecard grid (spec §3.1). Groups the run's metrics by dimension
 * (stable accent from `dimension-palette`), one row per eval with a status
 * pill (good/partial/fail/N/A), mean %, target %, and an own-trend arrow.
 * N/A rows render greyed with no trend arrow and no drill affordance. Active
 * rows are clickable → `onDrillMetric(evalSlug)`. Rendered as grouped cards
 * rather than a table so four dimensions don't read as four stacked report
 * tables with their own repeated column headers.
 */
export function PerPointGrid({
  metrics,
  trendBySlug,
  labelBySlug,
  onDrillMetric,
  expandedSlug,
  renderExpanded,
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

  return (
    <Box data-slot="per-point-grid" sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {order.map((dimSlug, dimIndex) => {
        const accent = dimensionAccent(dimIndex);
        const rows = groups.get(dimSlug)!;
        const passing = rows.filter((m) => (m.status ?? "n_a") === "good").length;
        const scored = rows.filter((m) => (m.status ?? "n_a") !== "n_a").length;
        return (
          <Box
            key={dimSlug}
            sx={{
              border: 1,
              borderColor: "divider",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1,
                px: 2,
                py: 1.25,
                bgcolor: alpha(accent, 0.06),
                borderBottom: 1,
                borderColor: "divider",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
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
              {scored > 0 ? (
                <Typography variant="caption" color="text.secondary" sx={{ fontVariantNumeric: "tabular-nums" }}>
                  {passing} of {scored} passing
                </Typography>
              ) : null}
            </Box>
            <Box>
              {rows.map((m, rowIndex) => {
                const status: PointStatus = m.status ?? "n_a";
                const isNa = status === "n_a";
                const pillColor = statusPillColor(status);
                const direction = trendBySlug?.[m.evalSlug] ?? "n_a";
                const trend = isNa ? null : trendIcon(direction);
                const name =
                  labelBySlug?.[m.evalSlug] ?? prettifySlug(m.evalSlug);
                const clickable = !isNa && Boolean(onDrillMetric);
                const isExpanded = expandedSlug === m.evalSlug;
                return (
                  <Box key={m.evalSlug}>
                  <Box
                    data-slot="per-point-row"
                    data-eval-slug={m.evalSlug}
                    data-status={status}
                    onClick={
                      clickable ? () => onDrillMetric!(m.evalSlug) : undefined
                    }
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 1.5,
                      px: 2,
                      py: 1.5,
                      borderTop: rowIndex === 0 ? 0 : 1,
                      borderColor: "divider",
                      cursor: clickable ? "pointer" : "default",
                      opacity: isNa ? 0.6 : 1,
                      "&:hover": clickable ? { bgcolor: "action.hover" } : undefined,
                    }}
                  >
                    <Box
                      sx={(theme) => ({
                        display: "inline-flex",
                        alignItems: "center",
                        borderRadius: 9999,
                        px: 1,
                        py: 0.375,
                        typography: "caption",
                        fontWeight: 500,
                        whiteSpace: "nowrap",
                        ...(pillColor
                          ? {
                              backgroundColor: alpha(theme.palette[pillColor].main, 0.15),
                              color: theme.palette[pillColor].main,
                            }
                          : {
                              backgroundColor: theme.palette.action.hover,
                              color: theme.palette.text.disabled,
                            }),
                      })}
                    >
                      {statusResultLabel(status)}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 160 }}>
                      {clickable ? (
                        <Button
                          data-testid={`score-evaluation-${m.evalSlug}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            onDrillMetric!(m.evalSlug);
                          }}
                          sx={{ p: 0, minWidth: 0, textAlign: "left", justifyContent: "flex-start", textTransform: "capitalize", fontWeight: 500, color: "text.primary" }}
                        >
                          {name}
                        </Button>
                      ) : (
                        <Typography
                          variant="body2"
                          fontWeight={500}
                          sx={{ textTransform: "capitalize", color: isNa ? "text.disabled" : "text.primary" }}
                        >
                          {name}
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                      <Typography variant="body2" fontWeight={600} sx={{ fontVariantNumeric: "tabular-nums" }}>
                        {pct(m.mean)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontVariantNumeric: "tabular-nums" }}>
                        target {m.target == null ? "—" : pct(m.target)}
                      </Typography>
                      {trend ? (
                        <trend.Icon
                          fontSize="small"
                          color={trend.color}
                          titleAccess={trend.label}
                          aria-label={trend.label}
                        />
                      ) : null}
                    </Box>
                    {clickable ? (
                      <IconMaterialSymbolsChevronForward
                        aria-hidden
                        fontSize="small"
                        sx={{
                          color: "text.disabled",
                          flexShrink: 0,
                          transform: isExpanded ? "rotate(90deg)" : "none",
                        }}
                      />
                    ) : null}
                  </Box>
                  {isExpanded && renderExpanded ? (
                    <Box sx={{ px: 2, pb: 1.5, bgcolor: "action.hover" }}>
                      {renderExpanded(m.evalSlug)}
                    </Box>
                  ) : null}
                  </Box>
                );
              })}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
