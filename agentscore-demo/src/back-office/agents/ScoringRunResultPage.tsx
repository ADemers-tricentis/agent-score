/** ScoringRunResultPage — per-run result detail.
 *
 * Route: /tenants/$tenantId/agents/$agentId/runs/$runId
 *
 * Renders:
 *   - Composite /100 + VerdictBadge (3-state shipDecision headline,
 *     5-band verdict detail) beside the score-stability interval
 *   - Honesty flags: delta_approximate, spans_revision_boundary,
 *     insufficient_sample verdict, no-applicable-profile (§3.8)
 *   - Baseline comparison with approve/resume controls
 *   - Dimension breakdown (per-dimension score/weight/contributing evals;
 *     under-sampled → N/A) + per-dimension delta vs baseline (client-side diff)
 *   - excluded_dimensions alert (weighted dimension that contributed nothing)
 *   - Evaluation breakdown (PerPointGrid §3.1): per-eval status grade + mean +
 *     target + own-trend arrow, grouped by dimension; drill into interactions
 *   - scored/skipped counts + failure-rate guard (scoring-robustness
 *     §3.1 P4/§3.2 stories 1-2): prominent eval-attempt counts on the
 *     result card, a "provisional — high failure rate" banner when
 *     `provisionalReasons` includes `high_failure_rate`, and a per-eval
 *     failure-reason list (`failureSummary`: evalSlug/humanReason/count,
 *     errorClass shown as a dim secondary detail — never raw exception text)
 *   - low_sample_metrics / metrics_present coverage note
 *   - Collapsed dimension results and provenance details
 *   - Drill eval → interactions list with trace links + evidence refs
 */

import { useState, type ReactNode } from "react";
import {
  Link as RouterLink,
  useNavigate,
  useParams,
  useSearch,
} from "@tanstack/react-router";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import LinearProgress from "@mui/material/LinearProgress";
import Skeleton from "@mui/material/Skeleton";
import Tab from "@mui/material/Tab";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tabs from "@mui/material/Tabs";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import IconMaterialSymbolsArrowBack from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsArrowBack.mjs";
import IconMaterialSymbolsCheckCircle from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsCheckCircle.mjs";
import IconMaterialSymbolsChevronForward from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsChevronForward.mjs";
import IconMaterialSymbolsContentCopy from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsContentCopy.mjs";
import IconMaterialSymbolsInfo from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsInfo.mjs";
import IconMaterialSymbolsKeyboardArrowDown from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsKeyboardArrowDown.mjs";
import IconMaterialSymbolsRefresh from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsRefresh.mjs";
import { toast } from "@/shared/lib/toast";

import { InteractionResultsPanel } from "@/back-office/agents/scoring/InteractionResultsPanel";
import {
  getBenchmarkForAgent,
  getDrillThroughInteractions,
  getEvalTrendPoints,
  getRunById,
} from "@/back-office/agents/scoring/fake-runs";
import {
  allDimensionsUnscored,
  collapsedRunCopy,
  exclusionRefusedCopy,
  goldenScopeNote,
  hasNoNewEvidence,
  isCollapsedRun,
  noEvalsAttempted,
  excludedChecksNote,
  NO_APPLICABLE_PROFILE_COPY,
  NO_NEW_EVIDENCE_COPY,
  reuseCountsCopy,
  sampleIncompleteCopy,
  sampleSizeCapNote,
  verdictBandsOf,
} from "@/back-office/agents/scoring/run-format";
import type {
  RunPanel,
  RunResultSearch,
} from "@/back-office/agents/scoring/tab-params";
import type {
  DrillThroughInteraction,
  EvalTrendPoint,
  FailureSummaryItem,
  RunMetricOut,
  ScoringRunOut,
} from "@/back-office/agents/scoring-api";
import { Chip } from "@/shared/components/chip";
import { describeEvidenceRef } from "@/shared/api/evidence-ref";
import { EmptyState } from "@/shared/components/empty-state";
import { ErrorState } from "@/shared/components/error-state";
import { PerPointGrid } from "@/shared/components/per-point-grid";
import type { TrendDirection } from "@/shared/components/per-point-grid";
import { ProvenanceDl } from "@/shared/components/provenance-dl";
import { formatScore } from "@/shared/components/score-confidence";
import { ScoreUncertainty } from "@/shared/components/score-uncertainty";
import type { ShipDecision } from "@/shared/components/verdict-badge";
import { VerdictBadge } from "@/shared/components/verdict-badge";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** A dimension roll-up, rescaled for display — NOT the wire shape. */
interface DimensionAggregate {
  dimensionSlug: string;
  /**
   * 0–100, to match the composite rendered above it. The wire carries 0–1
   * `parseDimensionAggregates` is the single place that converts.
   * null ⇒ excluded at runtime (N/A — under-sampled / unsatisfiable evals).
   */
  score: number | null;
  weight: number;
  nScored: number;
  nPassed: number;
  contributingEvals: string[];
}

/**
 * Normalize the run's dimensionAggregates map into an ordered list, converting
 * each score from the wire's 0–1 to the composite's 0–100.
 *
 * This is the one conversion boundary for the back-office surface. Both callers
 * — the current run and its baseline — pass through here, so the two operands of
 * a per-dimension delta convert together or not at all. Converting at the render
 * sites instead would be two edits that must agree, and a half-applied pair
 * leaves every delta a hundred times too small while the cell still looks right.
 */
function parseDimensionAggregates(
  raw: ScoringRunOut["dimensionAggregates"],
): DimensionAggregate[] {
  if (!raw) return [];
  return Object.entries(raw).map(([slug, agg]: [string, any]) => ({
    dimensionSlug: agg.dimensionSlug ?? slug,
    score: agg.score == null ? null : agg.score * 100,
    weight: agg.weight,
    nScored: agg.nScored,
    nPassed: agg.nPassed,
    contributingEvals: agg.contributingEvals ?? [],
  }));
}

function verdictForRun(run: ScoringRunOut): "ship" | "review" | "block" | null {
  if (run.verdict === "ship") return "ship";
  if (run.verdict === "review") return "review";
  if (run.verdict === "block") return "block";
  return null;
}

const SHIP_DECISIONS: readonly ShipDecision[] = [
  "ship",
  "needs_work",
  "dont_ship",
  "provisional",
] as const;

/** Narrow the wire `ship_decision` (string | null) to the `ShipDecision` union. */
function shipDecisionForRun(run: ScoringRunOut): ShipDecision | null {
  const sd = run.shipDecision;
  return sd != null && (SHIP_DECISIONS as readonly string[]).includes(sd)
    ? (sd as ShipDecision)
    : null;
}

function stateColor(state: string): string {
  if (state === "complete" || state === "partial") return "success.main";
  if (state === "failed") return "error.main";
  return "warning.main";
}

/** evalSlug → frozen evidenceRefs (aggregate run-level list, RunMetricOut.evidenceRefs). */
function evidenceRefsByEval(
  metrics: RunMetricOut[] | null | undefined,
): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const m of metrics ?? []) {
    if (m.evidenceRefs && m.evidenceRefs.length > 0) {
      out.set(m.evalSlug, m.evidenceRefs);
    }
  }
  return out;
}

/** Human label from a slug: drop a leading "<dimension>." and de-snake. */
function evalLabel(slug: string): string {
  const tail = slug.includes(".") ? slug.slice(slug.indexOf(".") + 1) : slug;
  return tail.replace(/_/g, " ");
}

function stateTint(
  state: ScoringRunOut["state"],
): "success" | "warning" | "destructive" | "info" {
  if (state === "complete") return "success";
  if (state === "partial") return "warning";
  if (state === "failed") return "destructive";
  return "info";
}

/** Inline label + info glyph, for a term on the Overview tab that isn't
 *  self-explanatory to someone who didn't build the scoring pipeline. */
function TermLabel({ label, tooltip }: { label: ReactNode; tooltip: string }) {
  return (
    <Tooltip title={tooltip}>
      <Box
        component="span"
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0.4,
          cursor: "help",
        }}
      >
        {label}
        <IconMaterialSymbolsInfo
          sx={{ fontSize: 14, color: "text.disabled", flexShrink: 0 }}
        />
      </Box>
    </Tooltip>
  );
}

function RunDisclosure({
  title,
  description,
  testId,
  children,
}: {
  title: string;
  description: string;
  testId: string;
  children: ReactNode;
}) {
  return (
    <Accordion
      disableGutters
      elevation={0}
      sx={{
        border: 1,
        borderColor: "divider",
        borderRadius: 1,
        "&:before": { display: "none" },
      }}
    >
      <AccordionSummary
        expandIcon={<IconMaterialSymbolsKeyboardArrowDown fontSize="small" />}
        data-testid={testId}
      >
        <Box>
          <Box sx={{ typography: "subtitle2" }}>{title}</Box>
          <Box sx={{ typography: "caption", color: "text.secondary" }}>
            {description}
          </Box>
        </Box>
      </AccordionSummary>
      <AccordionDetails>{children}</AccordionDetails>
    </Accordion>
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export function ScoringRunResultPage() {
  const { tenantId, agentId, runId } = useParams({ strict: false }) as {
    tenantId: string;
    agentId: string;
    runId: string;
  };

  const runQuery = { data: getRunById(agentId, runId) ?? null, isLoading: false, isError: false, error: null as Error | null };

  if (runQuery.isLoading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, px: 4, py: 3 }}>
        <Skeleton sx={{ height: 32, width: 192 }} />
        <Skeleton variant="rounded" sx={{ height: 160, width: "100%" }} />
        <Skeleton variant="rounded" sx={{ height: 256, width: "100%" }} />
      </Box>
    );
  }

  if (runQuery.isError || !runQuery.data) {
    return (
      <Box sx={{ px: 4, py: 3 }}>
        <ErrorState
          title="Failed to load run"
          message={
            (runQuery.error as Error | undefined)?.message ?? "Run not found."
          }
        />
      </Box>
    );
  }

  return (
    <RunResultBody run={runQuery.data} tenantId={tenantId} agentId={agentId} />
  );
}

// Exported for direct testing (mirrors the `DimensionBreakdownSection` seam) —
// bypasses `useParams`/routing so a fixture `run` can be rendered standalone.
export function RunResultBody({
  run,
  tenantId,
  agentId,
}: {
  run: ScoringRunOut;
  tenantId: string;
  agentId: string;
}) {
  const verdict = verdictForRun(run);
  const shipDecision = shipDecisionForRun(run);
  const metricsPresent = run.metricsPresent ?? [];
  const lowSampleMetrics = run.lowSampleMetrics ?? [];
  const refsByEval = evidenceRefsByEval(run.metrics);
  // `aggregating` is retired (build plan row 6): the aggregator now commits
  // complete/partial/failed directly, with no externally-visible pre-finalize
  // state to poll through.
  const isActive = run.state === "queued" || run.state === "running";
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as Partial<RunResultSearch>;
  const panel = search.panel ?? "overview";

  // Live results-grain progress: run counters are derived only at fan-in for
  // queue-native runs, so scoredCount/sampleSize sits frozen at 0 while a
  // run is actively scoring. Prefer completedResults/scopeCount/enabledEvals
  // when the run has queue-native scope (scopeCount > 0); fall back to the
  // legacy scoredCount/sampleSize counters otherwise (legacy pre-queue run,
  // scopeCount === 0).
  const tasksQuery = { data: undefined as { scopeCount: number; enabledEvals: number; completedResults: number } | undefined };
  const taskProgress = tasksQuery.data;

  // No-applicable-profile banner: the run-level "scored
  // nothing" fact alone also fires for ordinary low-sample runs, so the banner
  // is gated on the authoritative agent-level `needsProfileAttention`. Only
  // fetch that signal when the run scored nothing (the sole case it can gate);
  // absent/loading/errored degrades to false so the banner never asserts
  // no-applicable without the signal.
  const scoredNothing = allDimensionsUnscored(run);
  const benchmarkQuery = { data: scoredNothing ? getBenchmarkForAgent(agentId) : undefined };
  // Narrowed per spec §3.1 Feature 6: a run where nothing was ever evaluated
  // cannot be described as a profile-fit fact — `noEvalsAttempted` catches
  // the total-collapse case (retired/cancelled tasks) that `scoredNothing`
  // alone conflates with genuine no-fit.
  const noApplicableProfile =
    scoredNothing &&
    (benchmarkQuery.data?.needsProfileAttention ?? false) &&
    !noEvalsAttempted(run);

  const isQueueNative = taskProgress != null && taskProgress.scopeCount > 0;
  const totalScoredEvals = isQueueNative
    ? taskProgress.scopeCount * taskProgress.enabledEvals
    : 0;
  const progressPct = isQueueNative
    ? totalScoredEvals > 0
      ? (taskProgress.completedResults / totalScoredEvals) * 100
      : 0
    : run.sampleSize > 0
      ? (run.scoredCount / run.sampleSize) * 100
      : 0;
  const progressLabel = isQueueNative
    ? `${taskProgress.completedResults} / ${totalScoredEvals} evals`
    : `${run.scoredCount} / ${run.sampleSize} scored`;
  const evaluationCount =
    run.metrics.length > 0
      ? new Set(run.metrics.map((metric: any) => metric.evalSlug)).size
      : (taskProgress?.enabledEvals ?? metricsPresent.length);
  const capNote = sampleSizeCapNote(run);
  const exclusionNote = excludedChecksNote(run);
  const goldenScope = goldenScopeNote(run);

  // Per-dimension delta is a CLIENT-SIDE diff vs the baseline run (NO BE delta
  // math). Load the baseline run via the existing run query factory (same
  // endpoint the page already uses) when a baseline exists; diff its
  // dimensionAggregates against this run's.
  const baselineRunId = run.baselineRunId ?? null;
  const baselineQuery = {
    data: baselineRunId != null && baselineRunId !== run.runId ? getRunById(agentId, baselineRunId) : undefined,
  };

  // Computed once: the banner needs both its title and its body, and the two
  // refusal reasons carry different titles (only the breaker refuses anything).
  const refusedCopy = exclusionRefusedCopy(run);
  const dimensions = parseDimensionAggregates(run.dimensionAggregates);
  const baselineDimensions = parseDimensionAggregates(
    baselineQuery.data?.dimensionAggregates,
  );
  const baselineByDimension = new Map(
    baselineDimensions.map((d) => [d.dimensionSlug, d]),
  );

  const approveMutation = {
    isPending: false,
    mutate: () => {
      for (const r of [run]) r.isBaseline = true;
      toast.success("Run approved as baseline.");
    },
  };

  const resumeMutation = {
    isPending: false,
    mutate: () => {
      run.state = "complete";
      toast.success("Run resumed.");
    },
  };

  const shortRunId =
    run.runId.length > 8 ? `${run.runId.slice(0, 8)}…` : run.runId;

  const copyRunId = () => {
    void navigator.clipboard.writeText(run.runId).then(
      () => toast.success("Run ID copied."),
      () => toast.error("Couldn't copy the run ID."),
    );
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, px: 4, py: 3 }}>
      <Button
        component={RouterLink}
        to="/tenants/$tenantId/agents/$agentId"
        params={{ tenantId, agentId } as never}
        size="small"
        startIcon={<IconMaterialSymbolsArrowBack sx={{ fontSize: 16 }} />}
        data-testid="run-detail-back"
        sx={{ alignSelf: "flex-start" }}
      >
        Back to Score
      </Button>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        <Typography component="h1" variant="h3">
          Scoring run
        </Typography>
        <Button
          size="small"
          variant="text"
          onClick={copyRunId}
          startIcon={<IconMaterialSymbolsContentCopy sx={{ fontSize: 14 }} />}
          aria-label={`Copy full run ID ${run.runId}`}
          data-testid="run-id-copy"
          sx={{ fontFamily: "monospace" }}
        >
          {shortRunId}
        </Button>
        <Chip
          tint={stateTint(run.state)}
          data-testid="run-state-badge"
          sx={{ textTransform: "capitalize" }}
        >
          {run.state.replace(/_/g, " ")}
        </Chip>
        {run.isBaseline ? <Chip tint="info">baseline</Chip> : null}
      </Box>

      {/* ------------------------------------------------------------------ */}
      {/* Honesty banners (load-bearing spec §4.3)                            */}
      {/* ------------------------------------------------------------------ */}
      {run.spansRevisionBoundary ? (
        <Alert severity="info">
          <AlertTitle>Spans revision boundary</AlertTitle>
          The scored set straddles a revision flip — the delta vs baseline is not
          a controlled comparison. Treat results as approximate.
        </Alert>
      ) : null}

      {run.deltaApproximate && run.deltaVsBaseline != null ? (
        <Alert severity="info">
          <AlertTitle>Approximate delta</AlertTitle>
          Δ vs baseline is approximate — baseline used a different sample, profile
          version, or dimension coverage. Not a controlled comparison.
        </Alert>
      ) : null}

      {/* Reuse honesty banner (build plan W4-A). Single-sourced in
          run-format.ts — ScorecardTab renders the same no-new-evidence
          copy, so the two surfaces cannot drift on it. */}
      {hasNoNewEvidence(run) ? (
        <Alert severity="info" data-slot="no-new-evidence">
          <AlertTitle>{NO_NEW_EVIDENCE_COPY.title}</AlertTitle>
          {NO_NEW_EVIDENCE_COPY.body}
        </Alert>
      ) : null}

      {refusedCopy != null ? (
        <Alert severity="warning" data-slot="exclusion-refused">
          <AlertTitle>{refusedCopy.title}</AlertTitle>
          {refusedCopy.body}
        </Alert>
      ) : null}

      {/* No-applicable-profile: gated on the agent-level
          `needsProfileAttention` signal, not the run's all-null aggregate
          alone — that fact alone also occurs for ordinary low-sample runs. */}
      {noApplicableProfile ? (
        <Alert severity="warning" data-slot="no-applicable-profile">
          <AlertTitle>{NO_APPLICABLE_PROFILE_COPY.title}</AlertTitle>
          {NO_APPLICABLE_PROFILE_COPY.body}
        </Alert>
      ) : null}

      {/* Verdict failure-rate guard (spec §3.1 P4/§3.2 story 2). Distinct from
          insufficient_sample, whose messaging is the existing low-n Chip
          below — this reason gets its own explanation since it means real
          eval failures, not a small sample. */}
      {run.provisionalReasons?.includes("high_failure_rate") ? (
        <Alert severity="warning" data-slot="high-failure-rate">
          <AlertTitle>Provisional — high failure rate</AlertTitle>
          {Math.round(run.genuineFailureRate * 100)}% of eval attempts genuinely
          failed — the ship/block verdict is withheld until the failures below
          are addressed.
        </Alert>
      ) : null}

      {/* Retired-task accounting (spec §3.1 Feature 3/6): a partial collapse
          still forces provisionality even when enough tasks scored to clear
          the sample minimum. Gated on !noEvalsAttempted(run) AND
          !isCollapsedRun(run) — on a total collapse this sentence would be
          false (the run covers NONE of the sample, not part of it) and the
          header branch above already states that case. One message per run,
          never both. `sampleIncompleteCopy` is single-sourced with
          `ScorecardTab` (run-format.ts) — it handles a positive count, a
          recorded zero, and an unrecorded (null) count without ever
          asserting a figure we don't have. */}
      {run.provisionalReasons?.includes("sample_incomplete") &&
      !noEvalsAttempted(run) &&
      !isCollapsedRun(run) ? (
        <Alert severity="warning" data-slot="sample-incomplete">
          <AlertTitle>Provisional — incomplete sample</AlertTitle>
          {sampleIncompleteCopy(run)}
        </Alert>
      ) : null}

      {/* ------------------------------------------------------------------ */}
      {/* Overview / interaction results tabs                               */}
      {/* ------------------------------------------------------------------ */}
      <Tabs
        value={panel}
        onChange={(_e, v) =>
          // No `to`: this body renders under both the per-agent run-detail
          // route and the fleet run-detail route (RunDetailPage), so there is
          // no single anchor to point at — and a `to`-anchored navigate would
          // never match the off-route unit-test harness (no such route is
          // registered there), leaving `panel` stuck at overview. Writing
          // relative keeps whichever route is actually active. The router's
          // generic param-reducer types can't resolve a search shape with no
          // `to`/`from` anchor, so the updater is cast through (same escape
          // hatch as `params` above).
          navigate({
            search: ((prev: Partial<RunResultSearch>) => ({
              ...prev,
              panel: v as RunPanel,
            })) as never,
            replace: true,
          })
        }
        data-testid="run-result-tabs"
        sx={{ borderBottom: 1, borderColor: "divider" }}
      >
        <Tab value="overview" label="Overview" data-testid="run-result-tab-overview" />
        <Tab
          value="tasks"
          label="Interaction results"
          data-testid="run-result-tab-tasks"
        />
      </Tabs>

      {panel === "tasks" ? (
        <InteractionResultsPanel
          tenantId={tenantId}
          agentId={agentId}
          runId={run.runId}
          isActive={isActive}
          interactionCount={taskProgress?.scopeCount ?? run.sampleSize}
          evaluationResultCount={
            taskProgress?.completedResults ?? run.scoredCount + run.skippedCount
          }
          evaluationCount={
            taskProgress?.enabledEvals ??
            new Set((run.metrics ?? []).map((metric: any) => metric.evalSlug)).size
          }
          evalSlugs={Array.from(
            new Set((run.metrics ?? []).map((metric: any) => metric.evalSlug)),
          )}
          selectedInteractionRef={search.interaction}
          selectedVerdictId={search.verdict}
          onSelect={(interaction, verdict) =>
            void navigate({
              search: ((prev: Partial<RunResultSearch>) => ({
                ...prev,
                panel: "tasks",
                interaction,
                verdict,
              })) as never,
              replace: true,
            })
          }
        />
      ) : (
        <>
      {/* ------------------------------------------------------------------ */}
      {/* Run result                                                         */}
      {/* ------------------------------------------------------------------ */}
      <Card variant="outlined" data-testid="run-result-summary">
        <CardContent>
          <Box sx={{ typography: "h6", mb: 1.5 }}>Run result</Box>
          <Grid container spacing={3} alignItems="center">
            <Grid size={{ xs: 12, md: 5 }}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 1,
                  textAlign: "center",
                }}
              >
                {isActive ? (
                  <>
                    <IconMaterialSymbolsRefresh
                      sx={{
                        fontSize: 32,
                        color: "warning.main",
                        "@keyframes run-result-spin": {
                          from: { transform: "rotate(0deg)" },
                          to: { transform: "rotate(360deg)" },
                        },
                        animation: "run-result-spin 1s linear infinite",
                      }}
                    />
                    <Box sx={{ typography: "body2", fontWeight: 500 }}>
                      {run.state === "queued" ? "Queued…" : "Running…"}
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={progressPct}
                      sx={{ width: 128 }}
                    />
                    <Box
                      sx={{ typography: "caption", color: "text.secondary" }}
                      data-testid="run-progress-label"
                    >
                      {progressLabel}
                    </Box>
                    {capNote ? (
                      <Box
                        sx={{ typography: "caption", color: "text.secondary" }}
                        data-testid="run-sample-size-cap-note"
                      >
                        {capNote}
                      </Box>
                    ) : null}
                  </>
                ) : run.compositeScore != null &&
                  (verdict || run.isProvisional || shipDecision) ? (
                  <>
                    <Box
                      data-slot="score-headline"
                      data-provisional={run.isProvisional ? "true" : undefined}
                      sx={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: 0.75,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      <Box sx={{ typography: "h2", fontWeight: 600 }}>
                        {run.isProvisional
                          ? "?"
                          : formatScore(run.compositeScore)}
                      </Box>
                      <Box sx={{ typography: "h5", color: "text.secondary" }}>
                        / 100
                      </Box>
                    </Box>
                    {shipDecision ? (
                      <VerdictBadge shipDecision={shipDecision} />
                    ) : verdict ? (
                      <VerdictBadge verdict={verdict} />
                    ) : null}
                    {shipDecision && verdict ? (
                      <Box
                        sx={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 0.5,
                          typography: "caption",
                          color: "text.secondary",
                        }}
                      >
                        <TermLabel
                          label="Verdict zone:"
                          tooltip="Which score range this result falls into. The decision above can be different because it also takes into account how reliable the score is and how much evidence backs it up."
                        />
                        <VerdictBadge verdict={verdict} />
                      </Box>
                    ) : null}
                  </>
                ) : collapsedRunCopy(run) != null ? (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 1,
                    }}
                    data-slot="collapsed-run"
                  >
                    <Chip tint="warning">Not scored</Chip>
                    <Box
                      sx={{ typography: "caption", color: "text.secondary" }}
                      data-testid="run-collapsed-copy"
                    >
                      {collapsedRunCopy(run)}
                    </Box>
                  </Box>
                ) : run.verdict === "insufficient_sample" ? (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 1,
                    }}
                    data-slot="insufficient-sample"
                  >
                    <Box
                      sx={{
                        typography: "h3",
                        fontWeight: 600,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {run.compositeScore != null
                        ? formatScore(run.compositeScore)
                        : "—"}
                    </Box>
                    <Chip tint="warning">Insufficient sample</Chip>
                    <Box sx={{ typography: "caption", color: "text.secondary" }}>
                      Scored {run.scoredCount} interaction
                      {run.scoredCount !== 1 ? "s" : ""} — too few for a verdict
                    </Box>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      typography: "body2",
                      fontWeight: 500,
                      color: stateColor(run.state),
                    }}
                    data-slot="run-state-fallback"
                  >
                    {run.state}
                    {run.failureReason ? ` — ${run.failureReason}` : ""}
                  </Box>
                )}
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 7 }}>
              <Box
                sx={{
                  pl: { xs: 0, md: 3 },
                  borderLeft: { xs: 0, md: 1 },
                  borderColor: "divider",
                }}
              >
                <Box sx={{ typography: "subtitle2", mb: 0.5 }}>
                  <TermLabel
                    label="Score stability"
                    tooltip="How much the score might change if we tested this agent again. A small range means you can trust this score; a large range means one test isn't enough to be sure."
                  />
                </Box>
                {run.compositeScore != null &&
                run.confidence?.lower != null &&
                run.confidence?.upper != null ? (
                  <ScoreUncertainty
                    composite={run.compositeScore}
                    lower={run.confidence.lower}
                    upper={run.confidence.upper}
                    bands={verdictBandsOf(run)}
                    showInterval
                  />
                ) : (
                  <Box sx={{ typography: "caption", color: "text.secondary" }}>
                    Score stability is available after a scored run completes.
                  </Box>
                )}
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />
          <Box data-testid="run-eval-counts">
            <Grid container>
              {[
                {
                  testId: "run-results-scored",
                  value: run.scoredCount,
                  label: "evaluation results scored",
                  tooltip:
                    "The number of individual checks that were run and given a score.",
                },
                {
                  testId: "run-evaluation-count",
                  value: evaluationCount,
                  label: evaluationCount === 1 ? "evaluation" : "evaluations",
                  tooltip:
                    "The number of different tests set up to check this agent.",
                },
                {
                  testId: "run-results-without-evidence",
                  value: run.skippedCount,
                  label: "results lacked evidence",
                  tooltip:
                    "Checks that couldn't be scored because there wasn't enough information in the conversation to judge them.",
                },
              ].map((item, index) => (
                <Grid key={item.testId} size={{ xs: 12, sm: 4 }}>
                  <Box
                    data-testid={item.testId}
                    sx={{
                      px: 2,
                      borderLeft: { xs: 0, sm: index === 0 ? 0 : 1 },
                      borderColor: "divider",
                    }}
                  >
                    <Box
                      sx={{
                        typography: "h5",
                        fontWeight: 600,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {item.value}
                    </Box>
                    <Box sx={{ typography: "caption", color: "text.secondary" }}>
                      <TermLabel label={item.label} tooltip={item.tooltip} />
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
            {reuseCountsCopy(run).length > 0 ? (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mt: 1.5 }}>
                {reuseCountsCopy(run).map((chip) => (
                  <Tooltip
                    key={chip.key}
                    title={
                      chip.key === "reused"
                        ? "Results carried over from an earlier run because nothing had changed since then."
                        : "Results scored fresh in this run."
                    }
                  >
                    <Box component="span">
                      <Chip tint="muted">{chip.text}</Chip>
                    </Box>
                  </Tooltip>
                ))}
              </Box>
            ) : null}
          </Box>
        </CardContent>
      </Card>

      <Card variant="outlined" data-testid="baseline-comparison">
        <CardContent
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box>
            <Box sx={{ typography: "h6" }}>
              <TermLabel
                label="Baseline comparison"
                tooltip="How this result compares to the agent's approved baseline, the reference score everything else is measured against."
              />
            </Box>
            {run.deltaVsBaseline != null ? (
              <Box
                data-testid="baseline-delta"
                sx={{ display: "flex", alignItems: "baseline", gap: 0.75 }}
              >
                <Box
                  sx={{
                    typography: "h5",
                    fontWeight: 600,
                    color:
                      run.deltaVsBaseline >= 0 ? "success.main" : "error.main",
                  }}
                >
                  {run.deltaVsBaseline >= 0 ? "+" : ""}
                  {run.deltaVsBaseline.toFixed(1)}
                  {run.deltaApproximate ? (
                    <Box
                      component="span"
                      sx={{
                        ml: 0.25,
                        typography: "caption",
                        color: "text.secondary",
                      }}
                    >
                      ≈
                    </Box>
                  ) : null}
                </Box>
                <Box sx={{ typography: "caption", color: "text.secondary" }}>
                  points vs baseline
                </Box>
              </Box>
            ) : run.isBaseline ? (
              <Box sx={{ typography: "caption", color: "text.secondary" }}>
                This run is the current baseline.
              </Box>
            ) : (
              <Box sx={{ typography: "caption", color: "text.secondary" }}>
                No comparable baseline
              </Box>
            )}
          </Box>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {run.state === "complete" &&
            !run.isBaseline &&
            !run.isProvisional ? (
              <Button
                variant="outlined"
                size="small"
                onClick={() => approveMutation.mutate()}
                disabled={approveMutation.isPending}
                data-testid="run-approve"
                startIcon={<IconMaterialSymbolsCheckCircle />}
              >
                Approve as baseline
              </Button>
            ) : null}
            {run.state === "failed" || run.state === "partial" ? (
              <Button
                variant="outlined"
                size="small"
                onClick={() => resumeMutation.mutate()}
                disabled={resumeMutation.isPending}
                data-testid="run-resume"
                startIcon={<IconMaterialSymbolsRefresh />}
              >
                Resume run
              </Button>
            ) : null}
          </Box>
        </CardContent>
      </Card>

      <Card variant="outlined" data-testid="evaluation-breakdown">
        <CardContent>
          <Box sx={{ mb: 1.5 }}>
            <Box sx={{ typography: "h6" }}>Evaluation breakdown</Box>
            {metricsPresent.length > 0 ? (
              <Box sx={{ typography: "caption", color: "text.secondary" }}>
                Scored on {metricsPresent.length} evaluation
                {metricsPresent.length !== 1 ? "s" : ""}
                {lowSampleMetrics.length > 0 ? (
                  <> · {lowSampleMetrics.length} excluded for a low sample</>
                ) : null}
              </Box>
            ) : null}
          </Box>
          {run.metrics.length === 0 ? (
            <Box sx={{ typography: "caption", color: "text.secondary" }}>
              {isActive
                ? "Results will appear here when the run completes."
                : "No eval aggregates available."}
            </Box>
          ) : (
            <PerPointScorecard
              metrics={run.metrics}
              refsByEval={refsByEval}
              tenantId={tenantId}
              agentId={agentId}
              runId={run.runId}
              runMean={runMeanBySlug(run.metrics)}
              profileVersionId={run.profileVersionId ?? null}
            />
          )}
          {run.failureSummary && run.failureSummary.length > 0 ? (
            <FailureSummaryList items={run.failureSummary} />
          ) : null}
        </CardContent>
      </Card>

      {/* ------------------------------------------------------------------ */}
      {/* Dimension breakdown + per-dimension deltas (spec §3 Feature 7)      */}
      {/* ------------------------------------------------------------------ */}
      <DimensionBreakdownSection
        dimensions={dimensions}
        baselineByDimension={baselineByDimension}
        hasBaseline={baselineRunId != null}
        excludedDimensions={run.excludedDimensions ?? []}
        dimensionWeights={dimensionWeightsFromSnapshot(run)}
      />

      {/* ------------------------------------------------------------------ */}
      {/* Provenance                                                          */}
      {/* ------------------------------------------------------------------ */}
      <RunDisclosure
        title="Run details"
        description="Scoring configuration, sample, versions, and execution timestamps"
        testId="run-details-disclosure"
      >
        <ProvenanceDl
          columns={3}
          items={[
            { label: "Mode", value: run.mode },
            { label: "Revision", value: run.revisionLabel },
            {
              label: "Benchmark version",
              value: `v${run.benchmarkVersion}`,
            },
            {
              label: "Profile version",
              value: run.profileVersionId ?? "—",
            },
            {
              label: "Interactions",
              value: `${run.scoredCount} scored · ${run.skippedCount} could not be evidenced`,
            },
              // Candidate-trace grain (a count of traces, before fan-out to
              // evals) — deliberately separate from the eval-attempt-grain
              // "Interactions" row above and from the run-eval-counts chip
              // strip; joining the two would mix denominators.
              {
                label: "Candidates examined",
                value:
                  run.candidatesExamined != null
                    ? `${run.candidatesExamined}`
                    : "—",
              },
              {
                // The clamp outlives the progress bar: a completed run must
                // still say the sample was smaller than the one requested.
                label: "Sample size",
                value: capNote ?? `${run.sampleSize}`,
              },
              ...(exclusionNote
                ? [{ label: "Checks assigned", value: exclusionNote }]
                : []),
              ...(goldenScope
                ? [{ label: "Golden scope", value: goldenScope }]
                : []),
              {
                label: "Created",
                value: new Date(run.createdAt).toLocaleString(),
              },
              run.startedAt
                ? {
                    label: "Started",
                    value: new Date(run.startedAt).toLocaleString(),
                  }
                : { label: "Started", value: "—" },
              run.completedAt
                ? {
                    label: "Completed",
                    value: new Date(run.completedAt).toLocaleString(),
                  }
                : { label: "Completed", value: "—" },
              // null → "—", never "$0.0000". A run with no usage-ledger rows,
              // or with only unpriced ones, is absent from the cost rollup
              // rather than carrying a zero, so this em-dash means "no cost
              // data" and never "this run cost nothing".
              //
              // What this figure is, because it does not match the per-eval
              // dollars in the Event log tab beside it and that looks like a
              // bug: this is total provider spend for the run — every call it
              // paid for, including a retry's duplicate rows and calls that
              // failed after the provider billed us. The event log carries one
              // row per evaluation. Two different quantities, so this reads
              // higher; see `ScoringStore.run_ledger_cost`.
              // The em-dash now means an unpriced model or a judge whose
              // provider we have no price for — not "the ledger is unwired",
              // which is what it meant before the sink was connected.
              run.ledgerCostUsd != null
                ? {
                    label: "Model spend",
                    value: `$${run.ledgerCostUsd.toFixed(4)}`,
                  }
                : { label: "Model spend", value: "—" },
          ]}
        />
      </RunDisclosure>
        </>
      )}
    </Box>
  );
}

/** Pull `dimension_weights` from the run's frozen snapshot, if present.
 * Used only to label the excluded-dimension alert with the lost weight. */
function dimensionWeightsFromSnapshot(
  run: ScoringRunOut,
): Record<string, number> {
  const snap = run.benchmarkConfigSnapshot as Record<string, unknown> | undefined;
  const raw = snap?.dimension_weights;
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const n = Number(v);
    if (Number.isFinite(n)) out[k] = n;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Dimension breakdown section (per-dimension score/weight/contributing evals
// + client-side per-dimension delta + excluded-dimension alerts)
// ---------------------------------------------------------------------------

export function DimensionBreakdownSection({
  dimensions,
  baselineByDimension,
  hasBaseline,
  excludedDimensions,
  dimensionWeights,
}: {
  dimensions: DimensionAggregate[];
  baselineByDimension: Map<string, DimensionAggregate>;
  hasBaseline: boolean;
  excludedDimensions: string[];
  dimensionWeights: Record<string, number>;
}) {
  if (dimensions.length === 0 && excludedDimensions.length === 0) return null;

  return (
    <RunDisclosure
      title="Dimension results"
      description="Scores and weights by dimension"
      testId="run-dimensions-disclosure"
    >
      {dimensions.length === 0 ? (
        <Box sx={{ typography: "caption", color: "text.secondary" }}>
          No dimension aggregates available.
        </Box>
      ) : (
        <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ typography: "subtitle2" }}>Dimension</TableCell>
                <TableCell sx={{ typography: "subtitle2" }}>Score</TableCell>
                <TableCell sx={{ typography: "subtitle2" }}>Weight</TableCell>
                {hasBaseline ? (
                  <TableCell sx={{ typography: "subtitle2" }}>Δ vs baseline</TableCell>
                ) : null}
                <TableCell sx={{ typography: "subtitle2" }}>N scored</TableCell>
                <TableCell sx={{ typography: "subtitle2" }}>Evals</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {dimensions.map((dim) => {
                const baseline = baselineByDimension.get(dim.dimensionSlug);
                return (
                  <TableRow key={dim.dimensionSlug}>
                    <TableCell sx={{ fontWeight: 500, textTransform: "capitalize" }}>
                      {dim.dimensionSlug.replace(/_/g, " ")}
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}
                    >
                      {dim.score != null ? (
                        `${dim.score.toFixed(1)}`
                      ) : (
                        <Box component="span" sx={{ color: "text.secondary" }}>
                          N/A
                        </Box>
                      )}
                    </TableCell>
                    <TableCell sx={{ fontVariantNumeric: "tabular-nums" }}>
                      {dim.weight}
                    </TableCell>
                    {hasBaseline ? (
                      <TableCell>
                        <DimensionDelta current={dim} baseline={baseline} />
                      </TableCell>
                    ) : null}
                    <TableCell sx={{ fontVariantNumeric: "tabular-nums" }}>
                      {dim.nScored}
                    </TableCell>
                    <TableCell>
                      {dim.contributingEvals.length > 0 ? (
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                          {dim.contributingEvals.map((slug) => (
                            <Chip key={slug} tint="muted">
                              {evalLabel(slug)}
                            </Chip>
                          ))}
                        </Box>
                      ) : (
                        <Box component="span" sx={{ color: "text.secondary" }}>
                          —
                        </Box>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
        </Table>
      )}

      {/* excluded dimensions — a weighted dimension that contributed nothing */}
      {excludedDimensions.length > 0 ? (
        <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 1 }}>
          {excludedDimensions.map((slug) => {
            const weight = dimensionWeights[slug];
            const weightPhrase = weight != null ? ` (weight ${weight})` : "";
            return (
              <Alert key={slug} severity="warning">
                <AlertTitle sx={{ textTransform: "capitalize" }}>
                  {slug.replace(/_/g, " ")} excluded
                </AlertTitle>
                dimension {slug}
                {weightPhrase} contributed nothing — its evals were
                unsatisfiable for this agent.
              </Alert>
            );
          })}
        </Box>
      ) : null}
    </RunDisclosure>
  );
}

/** Client-side per-dimension delta: current.score − baseline.score.
 * Present in both → numeric Δ; only one side present → "new" / "N/A". */
function DimensionDelta({
  current,
  baseline,
}: {
  current: DimensionAggregate;
  baseline: DimensionAggregate | undefined;
}) {
  const cur = current.score;
  const base = baseline?.score ?? null;

  if (cur == null) {
    return (
      <Box component="span" sx={{ typography: "caption", color: "text.secondary" }}>
        N/A
      </Box>
    );
  }
  if (baseline == null) {
    return <Chip tint="info">new</Chip>;
  }
  if (base == null) {
    return (
      <Box component="span" sx={{ typography: "caption", color: "text.secondary" }}>
        N/A
      </Box>
    );
  }

  const delta = cur - base;
  return (
    <Box
      component="span"
      sx={{
        typography: "caption",
        fontWeight: 600,
        fontVariantNumeric: "tabular-nums",
        color: delta >= 0 ? "success.main" : "error.main",
      }}
    >
      {delta >= 0 ? "+" : ""}
      {delta.toFixed(1)}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Per-point scorecard (PerPointGrid + own-trend + drill-through)
// ---------------------------------------------------------------------------

/** evalSlug → this run's mean (0–1), pulled straight off the run metrics so the
 * own-trend comparison reads from the same source the grid renders. */
function runMeanBySlug(metrics: RunMetricOut[]): Map<string, number | null> {
  const out = new Map<string, number | null>();
  for (const m of metrics) out.set(m.evalSlug, m.mean ?? null);
  return out;
}

/** Most recent PRIOR point on the SAME profile version. The series is the
 * agent's own per-eval trend (newest-first per the trend endpoint); "prior"
 * means a point distinct from this run whose profileVersionId matches. */
function priorSameProfileMean(
  series: EvalTrendPoint[],
  runId: string,
  profileVersionId: string | null,
): number | null {
  for (const pt of series) {
    if (pt.runId === runId) continue;
    if ((pt.profileVersionId ?? null) !== profileVersionId) continue;
    return pt.mean ?? null;
  }
  return null;
}

/** Compare this run's mean to the prior same-profile mean → trend direction.
 * `n_a` when either side is null or there is no comparable prior point. */
function trendDirection(
  current: number | null,
  prior: number | null,
): TrendDirection {
  if (current == null || prior == null) return "n_a";
  if (current > prior) return "up";
  if (current < prior) return "down";
  return "flat";
}

function PerPointScorecard({
  metrics,
  refsByEval,
  tenantId,
  agentId,
  runId,
  runMean,
  profileVersionId,
}: {
  metrics: RunMetricOut[];
  refsByEval: Map<string, string[]>;
  tenantId: string;
  agentId: string;
  runId: string;
  runMean: Map<string, number | null>;
  profileVersionId: string | null;
}) {
  const [drillSlug, setDrillSlug] = useState<string | null>(null);
  const navigate = useNavigate();

  // Own-trend (§3.1): one per-eval trend series per rendered metric.
  const slugs = metrics.map((m) => m.evalSlug);
  const trendQueries = slugs.map((slug) => ({ data: getEvalTrendPoints(agentId, slug) }));

  const trendBySlug: Record<string, TrendDirection> = {};
  slugs.forEach((slug, i) => {
    const series = (trendQueries[i]?.data ?? []) as EvalTrendPoint[];
    const prior = priorSameProfileMean(series, runId, profileVersionId);
    trendBySlug[slug] = trendDirection(runMean.get(slug) ?? null, prior);
  });

  return (
    <PerPointGrid
      metrics={metrics}
      trendBySlug={trendBySlug}
      onDrillMetric={(slug) =>
        setDrillSlug((cur) => (cur === slug ? null : slug))
      }
      expandedSlug={drillSlug}
      renderExpanded={(slug) => (
        <DrillThroughPanel
          tenantId={tenantId}
          agentId={agentId}
          runId={runId}
          evalSlug={slug}
          aggregateRefs={refsByEval.get(slug) ?? []}
          onNavigateToTrace={(traceId) =>
            void navigate({
              to: "/tenants/$tenantId/agents/$agentId/traces/$traceId",
              params: { tenantId, agentId, traceId },
              search: { timestamp: new Date().toISOString(), view: "spans" },
            })
          }
        />
      )}
    />
  );
}

function DrillThroughPanel({
  tenantId,
  agentId,
  runId,
  evalSlug,
  aggregateRefs,
  onNavigateToTrace,
}: {
  tenantId: string;
  agentId: string;
  runId: string;
  evalSlug: string;
  aggregateRefs: string[];
  onNavigateToTrace: (traceId: string) => void;
}) {
  const interactionsQuery = {
    isLoading: false,
    isError: false,
    data: getDrillThroughInteractions(agentId, runId, evalSlug),
  };

  return (
    <Box
      sx={(theme) => ({
        mt: 1.5,
        borderRadius: 1,
        border: 1,
        borderColor: "divider",
        bgcolor: alpha(theme.palette.action.hover, 0.2),
        p: 1.5,
      })}
    >
      <Box
        sx={{
          mb: 1,
          typography: "caption",
          fontWeight: 600,
          textTransform: "capitalize",
        }}
      >
        {evalLabel(evalSlug)} — per-interaction scores
      </Box>

      {/* Run-level aggregate evidence refs (frozen on the snapshot entry). */}
      {aggregateRefs.length > 0 ? (
        <EvidenceRefList refs={aggregateRefs} label="Evidence" />
      ) : null}

      {interactionsQuery.isLoading ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
          <Skeleton sx={{ height: 12, width: "100%" }} />
          <Skeleton sx={{ height: 12, width: "75%" }} />
        </Box>
      ) : interactionsQuery.isError ? (
        <Box sx={{ typography: "caption", color: "error.main" }}>
          Failed to load interactions.
        </Box>
      ) : !interactionsQuery.data || interactionsQuery.data.length === 0 ? (
        <EmptyState title="No interactions" />
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          {interactionsQuery.data.map((item: DrillThroughInteraction) => (
            <Box
              key={item.traceId}
              role="button"
              tabIndex={0}
              onClick={() => onNavigateToTrace(item.traceId)}
              sx={(theme) => ({
                display: "flex",
                alignItems: "flex-start",
                gap: 1.5,
                cursor: "pointer",
                borderRadius: 0.5,
                px: 1,
                py: 0.75,
                border: 1,
                borderColor: "transparent",
                "&:hover": {
                  bgcolor: alpha(theme.palette.action.hover, 0.4),
                  borderColor: "divider",
                  "& .row-chevron": { color: theme.palette.primary.main },
                  "& .trace-link": { textDecoration: "underline" },
                },
              })}
            >
              <Box
                sx={{
                  mt: 0.25,
                  width: 40,
                  flexShrink: 0,
                  textAlign: "right",
                  fontFamily: "monospace",
                  typography: "caption",
                  fontWeight: 600,
                }}
              >
                {(item.value * 100).toFixed(0)}%
              </Box>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Box
                  className="trace-link"
                  sx={{
                    fontFamily: "monospace",
                    typography: "caption",
                    color: "primary.main",
                  }}
                >
                  {item.traceId}
                </Box>
                {item.reason ? (
                  <Box
                    sx={{
                      mt: 0.25,
                      typography: "caption",
                      color: "text.primary",
                      opacity: 0.8,
                    }}
                  >
                    {item.reason}
                  </Box>
                ) : null}
                {item.evidenceRefs && item.evidenceRefs.length > 0 ? (
                  <EvidenceRefList refs={item.evidenceRefs} label="Evidence" />
                ) : null}
              </Box>
              <IconMaterialSymbolsChevronForward
                aria-hidden
                fontSize="small"
                className="row-chevron"
                sx={{ color: "text.disabled", flexShrink: 0, alignSelf: "center" }}
              />
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

/** Compact list of evidence citations.
 *
 * `refs` is `unknown[]`, not `string[]`: the drill-through passes
 * `verdicts.evidence_refs` straight through, so a real judge's entries are
 * `{span_id, verified, transcript_truncated}` triples while seeded fixtures
 * write bare span ids. `describeEvidenceRef` decides which is which, and an
 * unverified citation is called out rather than shown as ordinary evidence.
 */
function EvidenceRefList({ refs, label }: { refs: unknown[]; label: string }) {
  return (
    <Box
      sx={{
        mt: 0.5,
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 0.5,
      }}
    >
      <Box
        component="span"
        sx={{
          typography: "overline",
          letterSpacing: "0.05em",
          color: "text.secondary",
        }}
      >
        {label}
      </Box>
      {refs.map((ref, i) => {
        // Keyed by index, not by the entry: a judge's citation triple
        // stringifies to `[object Object]`, so every chip in a judged
        // verdict would otherwise share one key.
        const display = describeEvidenceRef(ref);
        return (
          <Chip
            key={i}
            tint={display.verified === false ? "warning" : "muted"}
            data-testid={`drill-through-evidence-ref-${display.kind}`}
          >
            <Box component="span" sx={{ fontFamily: "monospace" }}>
              {display.label}
              {display.kind === "malformed"
                ? " · unverified (malformed)"
                : display.verified === false
                  ? " · unverified"
                  : ""}
            </Box>
          </Chip>
        );
      })}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Per-eval failure reasons (spec §3.1 P3/§3.2 story 1)
// ---------------------------------------------------------------------------

/** Per-eval genuine-failure reasons. `humanReason` is the hardcoded,
 * PII-safe reason surfaced prominently; `errorClass` is a dim secondary
 * detail (sanitized class name only — never `str(exc)`). */
function FailureSummaryList({ items }: { items: FailureSummaryItem[] }) {
  return (
    <Box sx={{ mt: 2 }} data-testid="failure-summary">
      <Box sx={{ mb: 1, typography: "body2", fontWeight: 600 }}>
        Failure reasons
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {items.map((item) => (
          <Box
            key={`${item.evalSlug}-${item.errorClass}`}
            data-slot="failure-summary-row"
            data-eval-slug={item.evalSlug}
            sx={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 1.5,
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Box
                sx={{
                  typography: "body2",
                  fontWeight: 500,
                  textTransform: "capitalize",
                }}
              >
                {evalLabel(item.evalSlug)}
              </Box>
              <Box sx={{ typography: "caption", color: "text.primary" }}>
                {item.humanReason}
              </Box>
              <Box sx={{ typography: "caption", color: "text.secondary" }}>
                {item.errorClass}
              </Box>
            </Box>
            <Chip tint="destructive">
              {item.count}×
            </Chip>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
