/** RunsTab — the agent Score page's run-history section: a URL-synced By-run /
 * By-version toggle (`?sub=`, mirrors `AgentsSearchPage`'s view toggle /
 * `FitTab`'s sub-tab pattern) so:
 *   - By run (default): trend chart (with profile-transition markers) + the
 *     run history table.
 *   - By version: one row per revision_label with ≥1 completed run.
 *
 * Mount-gated: `versionsQueryOptions` lives inside `VersionsView` so it only
 * fetches once `sub === "version"` is selected, never at top level.
 *
 * There is no per-row "Event log" column: clicking a run row already opens
 * the run-detail page, so a separate column would be a redundant second entry
 * point to the same destination.
 *
 * The run history is a keyset-paginated page, so this component takes its
 * pager config from the query's owner (`AgentScorePage`) rather than deriving
 * one: an opaque cursor cannot produce a page index, so "Previous" needs the
 * cursor stack the owner holds. It shipped with the page and no pager at all,
 * which presented the newest 50 runs as the agent's whole history.
 */

import { useMemo } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { useTheme } from "@mui/material/styles";
import IconMaterialSymbolsCancel from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsCancel.mjs";
import IconMaterialSymbolsCheckCircle from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsCheckCircle.mjs";
import IconMaterialSymbolsSpeed from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsSpeed.mjs";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type {
  ScoringRunOut,
  TrendPoint,
  VersionGrade,
} from "@/back-office/agents/scoring-api";
import { getTrendPoints, getVersionGrades } from "@/back-office/agents/scoring/fake-runs";
import {
  hasNoNewEvidence,
  shipDecisionFromString,
  shipDecisionOf,
  stateLabel,
  verdictForRun,
} from "@/back-office/agents/scoring/run-format";
import type { RunsSub } from "@/back-office/agents/scoring/tab-params";
import { Chip } from "@/shared/components/chip";
import {
  DataTable,
  type PaginationConfig,
} from "@/shared/components/data-table";
import { EmptyState } from "@/shared/components/empty-state";
import { ErrorState } from "@/shared/components/error-state";
import { formatScore } from "@/shared/components/score-confidence";
import { VerdictBadge } from "@/shared/components/verdict-badge";

// ---------------------------------------------------------------------------
// Runs tab — By-run (trend chart + run history) / By-version toggle.
// ---------------------------------------------------------------------------

export function RunsTab({
  runs,
  tenantId,
  agentId,
  loading,
  error,
  pagination,
}: {
  runs: ScoringRunOut[];
  tenantId: string;
  agentId: string;
  loading: boolean;
  error: Error | null;
  /** Required, not optional: a caller that forgot it would silently be back to
   *  showing one page as the whole history, which is the defect this closed. */
  pagination: PaginationConfig;
}) {
  // validateSearch (router.tsx → parseAgentScoreSearch) guarantees a valid
  // `sub`; strict:false is loosely typed here (mirrors
  // `FitTab`/`InternalTab` — the route tree isn't globally registered).
  const search = useSearch({ strict: false }) as { sub?: RunsSub };
  const sub = search.sub ?? "run";
  const navigate = useNavigate();

  const toggle = (
    <ToggleButtonGroup
      exclusive
      size="small"
      value={sub}
      onChange={(_e, v) => {
        // ToggleButtonGroup emits `null` on re-click of the already-selected
        // option — the guard keeps `sub` from being wiped out of the URL.
        if (v) {
          navigate({
            to: ".",
            search: (prev: { sub?: RunsSub }) => ({ ...prev, sub: v as RunsSub }),
            replace: true,
          });
        }
      }}
      aria-label="Runs view"
      data-testid="runs-view-toggle"
      sx={{ mb: 2 }}
    >
      <ToggleButton value="run" data-testid="runs-view-run">
        By run
      </ToggleButton>
      <ToggleButton value="version" data-testid="runs-view-version">
        By version
      </ToggleButton>
    </ToggleButtonGroup>
  );

  if (loading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Skeleton sx={{ height: 16, width: "100%" }} />
        <Skeleton sx={{ height: 16, width: "75%" }} />
      </Box>
    );
  }
  if (error) {
    return <ErrorState title="Failed to load runs" message={error.message} />;
  }
  if (runs.length === 0) {
    return (
      <EmptyState
        icon={IconMaterialSymbolsSpeed}
        title="No scoring runs yet"
        description="Trigger a scoring run to start measuring this agent."
      />
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", border: 1, borderColor: "divider", borderRadius: 2, p: { xs: 2, md: 3 }, minWidth: 0 }} data-testid="scoring-history">
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "baseline" }}><Typography variant="h6">Scoring history</Typography>{toggle}</Box>
      {sub === "version" ? (
        <VersionsView tenantId={tenantId} agentId={agentId} />
      ) : (
        <>
          <TrendChart tenantId={tenantId} agentId={agentId} />
          <RunsTable
            runs={runs}
            tenantId={tenantId}
            agentId={agentId}
            pagination={pagination}
          />
        </>
      )}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Trend chart
//
// recharts is kept (the shadcn `ui/chart` wrapper is dropped per F7). recharts
// needs concrete string colors, so we resolve the line + grid colors from the
// active theme. `ReferenceLine` markers (§3.4) annotate runs where the
// effective profile changed (`profileChangedFromPrev`).
//
// The series is `GET …/scoring/trend`'s own, NOT the run table's page. It used
// to plot the page and read only the transition flags off the trend query, so
// the line stopped wherever the page did and then MOVED as the user paged —
// the same drawn-to-the-edge shape whether the agent had 40 runs or 4000. The
// endpoint's window and cap are passed explicitly rather than defaulted, so
// the caption below states the scope the request actually asked for.
// ---------------------------------------------------------------------------

const TREND_WINDOW_DAYS = 90;
const TREND_MAX_POINTS = 100;

function TrendChart({
  tenantId,
  agentId,
}: {
  tenantId: string;
  agentId: string;
}) {
  const theme = useTheme();
  const trendQuery = { data: getTrendPoints(agentId) };

  // The composite trend endpoint returns TrendPoint[] (no eval/evals params).
  const trendPoints = (trendQuery.data ?? []) as TrendPoint[];

  // The endpoint serves newest-first; the chart reads left-to-right in time.
  // Sorted on a copy — the query's cached array must not be mutated.
  const completed = trendPoints
    .filter((p) => p.compositeScore != null)
    .slice()
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )
    .map((p) => ({
      label: new Date(p.createdAt).toLocaleDateString(),
      score: Math.round(p.compositeScore!),
      runId: p.runId,
      transition: p.profileChangedFromPrev === true,
    }));

  if (completed.length < 2) return <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }} data-testid="scoring-trend-insufficient">Not enough scored runs in the last {TREND_WINDOW_DAYS} days to show a trend.</Typography>;

  const lineColor = theme.palette.primary.main;
  const gridColor = theme.palette.divider;
  const markerColor = theme.palette.text.secondary;

  return (
    <Box
      sx={{ mb: 2, width: "100%", display: "flex", flexDirection: "column", gap: 0.5 }}
      data-testid="scoring-trend"
    >
      <Box sx={{ height: 112, width: "100%" }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={completed}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} width={28} />
          <Tooltip
            contentStyle={{
              fontSize: 12,
              borderColor: gridColor,
              borderRadius: 8,
              backgroundColor: theme.palette.background.paper,
            }}
            labelStyle={{ color: theme.palette.text.secondary }}
          />
          {completed
            .filter((d) => d.transition)
            .map((d) => (
              <ReferenceLine
                key={d.runId}
                x={d.label}
                stroke={markerColor}
                strokeDasharray="4 2"
                label={{ value: "profile", fontSize: 9, fill: markerColor }}
              />
            ))}
          <Line
            type="monotone"
            dataKey="score"
            name="Composite"
            stroke={lineColor}
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
      </Box>
      {/* The chart's scope is narrower than the table's: the table pages back
          through every run, the trend is a bounded window. Saying so is the
          difference between a chart that starts somewhere and a chart that
          looks like the agent has no earlier history. */}
      <Box
        component="p"
        data-testid="scoring-trend-scope"
        sx={{ m: 0, typography: "caption", color: "text.secondary" }}
      >
        {completed.length === TREND_MAX_POINTS
          ? `Composite score — the ${TREND_MAX_POINTS} most recent completed runs of the last ${TREND_WINDOW_DAYS} days. Page the table below for older runs.`
          : `Composite score — completed runs of the last ${TREND_WINDOW_DAYS} days.`}
      </Box>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Run history table
// ---------------------------------------------------------------------------

// Exported (a component, so this file stays `react-refresh/only-export-
// components`-clean) so `RunsTab.test.tsx` can render the real single-trace
// Mode/Scope/Score/Verdict rendering directly through `DataTable`, mirroring
// `AgentTracesPage.test.tsx`'s `TraceScoreCell` export.
export function RunsTable({
  runs,
  tenantId,
  agentId,
  pagination,
}: {
  runs: ScoringRunOut[];
  tenantId: string;
  agentId: string;
  pagination: PaginationConfig;
}) {
  const navigate = useNavigate();

  const columns = useMemo<ColumnDef<ScoringRunOut, unknown>[]>(
    () => [
      {
        id: "run",
        header: "Run",
        accessorFn: (r) => r.runId,
        cell: ({ row }) => (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              fontFamily: "monospace",
              typography: "caption",
              color: "text.secondary",
            }}
          >
            {row.original.runId.slice(0, 8)}…
            {row.original.isBaseline ? <Chip tint="info">baseline</Chip> : null}
          </Box>
        ),
      },
      {
        id: "mode",
        header: "Mode",
        accessorFn: (r) => r.mode,
        // "population" is the standard run mode and carries no information for
        // most runs, so it stays silent — only the single-trace exception (an
        // engineer re-scoring one trace) gets a visible flag.
        cell: ({ row }) => (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Box component="span" sx={{ typography: "caption", color: "text.secondary" }}>
              {row.original.mode === "population" ? "Standard run" : row.original.mode}
            </Box>
            {row.original.singleTraceRef != null ? (
              <Chip tint="info">single trace</Chip>
            ) : null}
          </Box>
        ),
      },
      {
        id: "scope",
        header: "Scope",
        accessorFn: (r) => r.singleTraceRef ?? r.sampleSize,
        cell: ({ row }) => {
          const r = row.original;
          return (
            <Box
              data-testid={`run-scope-${r.runId}`}
              component="span"
              sx={{ typography: "caption", color: "text.secondary" }}
            >
              {r.singleTraceRef != null ? (
                <Box component="span" sx={{ fontFamily: "monospace" }}>
                  {r.singleTraceRef.slice(0, 8)}…
                </Box>
              ) : (
                `${r.sampleSize} interaction${r.sampleSize === 1 ? "" : "s"}`
              )}
            </Box>
          );
        },
      },
      {
        id: "score",
        header: "Score",
        accessorFn: (r) => r.compositeScore,
        cell: ({ row }) => {
          const r = row.original;
          // A single-trace run computes a composite like any other (the
          // aggregate math is untouched), but no agent-level reader ever
          // includes it — presenting the number here would invite a
          // comparison against agent-grain runs that has no meaning.
          if (r.singleTraceRef != null) {
            return (
              <Box component="span" sx={{ color: "text.secondary" }}>
                —
              </Box>
            );
          }
          return (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Box component="span" sx={{ typography: "caption", fontWeight: 600 }}>
                {r.compositeScore != null ? formatScore(r.compositeScore) : "—"}
              </Box>
              {/* No new column (build plan W4-A) — a compact marker inside the
                  existing score cell, the same treatment the `≈` glyph below
                  gets for delta-approximate. Text plus colour, never colour
                  alone (frontend-ux.mdc). */}
              {hasNoNewEvidence(r) ? <Chip tint="info">no new evidence</Chip> : null}
            </Box>
          );
        },
      },
      {
        id: "verdict",
        header: "Verdict",
        accessorFn: (r) => r.shipDecision ?? r.verdict,
        cell: ({ row }) => {
          const r = row.original;
          // Same reasoning as the Score cell above: the run's own verdict
          // math ran, but it describes one interaction, and nothing at the
          // agent grain reads it.
          if (r.singleTraceRef != null) {
            return (
              <Box
                component="span"
                sx={{ typography: "caption", color: "text.secondary" }}
              >
                not applicable
              </Box>
            );
          }
          if (r.shipDecision)
            return <VerdictBadge shipDecision={shipDecisionOf(r)} />;
          const verdict = verdictForRun(r);
          if (verdict) return <VerdictBadge verdict={verdict} />;
          if (r.verdict === "insufficient_sample")
            return <Chip tint="warning">low-n</Chip>;
          return (
            <Box
              component="span"
              sx={{ typography: "caption", color: "text.secondary" }}
            >
              —
            </Box>
          );
        },
      },
      {
        id: "delta",
        header: "Score change",
        accessorFn: (r) => r.deltaVsBaseline,
        cell: ({ row }) => {
          const r = row.original;
          if (r.deltaVsBaseline == null)
            return (
              <Box component="span" sx={{ color: "text.secondary" }}>
                —
              </Box>
            );
          return (
            <Box
              component="span"
              sx={{
                typography: "caption",
                color: r.deltaVsBaseline >= 0 ? "success.main" : "error.main",
              }}
            >
              {r.deltaVsBaseline >= 0 ? "+" : ""}
              {r.deltaVsBaseline.toFixed(1)}
              {r.deltaApproximate ? (
                <Box
                  component="span"
                  sx={{ ml: 0.25, color: "text.secondary" }}
                >
                  ≈
                </Box>
              ) : null}
            </Box>
          );
        },
      },
      {
        id: "state",
        header: "State",
        accessorFn: (r) => r.state,
        cell: ({ row }) => (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              typography: "caption",
            }}
          >
            {row.original.state === "complete" ||
            row.original.state === "partial" ? (
              <IconMaterialSymbolsCheckCircle
                sx={{ fontSize: 12, color: "success.main" }}
              />
            ) : row.original.state === "failed" ? (
              <IconMaterialSymbolsCancel
                sx={{ fontSize: 12, color: "error.main" }}
              />
            ) : null}
            {stateLabel(row.original.state)}
          </Box>
        ),
      },
      {
        id: "when",
        header: "When",
        accessorFn: (r) => r.createdAt,
        cell: ({ row }) => (
          <Box
            component="span"
            sx={{ typography: "caption", color: "text.secondary" }}
          >
            {new Date(row.original.createdAt).toLocaleString()}
          </Box>
        ),
      },
    ],
    [],
  );

  return (
    <DataTable
      columns={columns.filter((column) => column.id !== "delta" || runs.some((run) => run.deltaVsBaseline != null))}
      data={runs}
      getRowId={(r) => r.runId}
      getRowTestId={(r) => `run-row-${r.runId}`}
      onRowClick={(r) =>
        void navigate({
          to: "/tenants/$tenantId/agents/$agentId/runs/$runId",
          params: { tenantId, agentId, runId: r.runId },
          search: { panel: "overview" },
        })
      }
      pagination={pagination}
      enableSorting={false}
    />
  );
}

// ---------------------------------------------------------------------------
// By-version view (§3.4) — one row per revision_label with ≥1 completed run.
// Mount-gated by the parent `RunsTab`: this is the only place
// `versionsQueryOptions` is called, so it only fetches once `sub ===
// "version"` is selected.
// ---------------------------------------------------------------------------

function VersionsView({
  tenantId,
  agentId,
}: {
  tenantId: string;
  agentId: string;
}) {
  const versionsQuery = { data: getVersionGrades(agentId), isLoading: false, isError: false, error: null as Error | null };

  if (versionsQuery.isLoading) {
    return <Skeleton sx={{ height: 80, width: "100%" }} />;
  }
  if (versionsQuery.isError) {
    return (
      <ErrorState
        title="Failed to load version grades"
        message={(versionsQuery.error as Error)?.message}
      />
    );
  }
  const versions: VersionGrade[] = versionsQuery.data ?? [];
  if (versions.length === 0) {
    return (
      <EmptyState
        icon={IconMaterialSymbolsSpeed}
        title="No graded versions yet"
        description="Complete a run on a revision to see its grade here."
      />
    );
  }

  return (
    <Table size="small" data-testid="versions-table">
      <TableHead>
        <TableRow>
          <TableCell>Version</TableCell>
          <TableCell>Latest verdict</TableCell>
          <TableCell align="right">Runs</TableCell>
          <TableCell align="right">Best composite</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {versions.map((v) => (
          <TableRow
            key={v.revisionLabel}
            data-testid={`version-row-${v.revisionLabel}`}
          >
            <TableCell sx={{ fontFamily: "monospace", typography: "caption" }}>
              {v.revisionLabel}
            </TableCell>
            <TableCell>
              {v.latestRun.shipDecision ? (
                <VerdictBadge
                  shipDecision={shipDecisionFromString(
                    v.latestRun.shipDecision,
                  )}
                />
              ) : (
                <Box component="span" sx={{ color: "text.secondary" }}>
                  —
                </Box>
              )}
            </TableCell>
            <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
              {v.runCount}
            </TableCell>
            <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
              {v.bestComposite != null ? Math.round(v.bestComposite) : "—"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
