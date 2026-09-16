import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import { useNavigate } from "@tanstack/react-router";
import IconMaterialSymbolsSpeed from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsSpeed.mjs";
import IconMaterialSymbolsWarning from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsWarning.mjs";

import type {
  BenchmarkConfigOut,
  FailureSummaryItem,
  ScoringRunOut,
} from "@/back-office/agents/scoring-api";
import {
  allDimensionsUnscored,
  collapsedRunCopy,
  evalLabel,
  hasNoNewEvidence,
  isCollapsedRun,
  noEvalsAttempted,
  NO_APPLICABLE_PROFILE_COPY,
  NO_ENABLED_CHECKS_COPY,
  NO_NEW_EVIDENCE_COPY,
  provisionalCaption,
  reuseCountsCopy,
  sampleIncompleteCopy,
  shipDecisionOf,
  stateLabel,
  verdictBandsOf,
} from "@/back-office/agents/scoring/run-format";
import { Chip } from "@/shared/components/chip";
import { EmptyState } from "@/shared/components/empty-state";
import { ErrorState } from "@/shared/components/error-state";
import { PerPointGrid } from "@/shared/components/per-point-grid";
import { formatScore } from "@/shared/components/score-confidence";
import { ScoreUncertainty } from "@/shared/components/score-uncertainty";
import { verdictBandLabel } from "@/shared/components/verdict-band";
import { VerdictBadge } from "@/shared/components/verdict-badge";

// ---------------------------------------------------------------------------
// ScoreCard — headline gauge + 3-state badge + SE band + per-point grid (§3.1).
// Drill a row → the run-result page (its drill-through panel owns the per-
// interaction view, spec §3.6). No completed run → "Score now" empty state.
// A collapsed anchor run (every outcome bucket empty — retired/cancelled,
// spec §3.1 Feature 6) renders the shared explanation instead of a gauge.
//
// scoring-robustness §3.1 P4/§3.2 stories 1-2: also surfaces the eval-attempt
// counts (scored/skipped/failed), a "provisional — high failure rate" banner
// when `provisionalReasons` includes `high_failure_rate`, and the per-eval
// `failureSummary` (humanReason prominent, errorClass a dim secondary detail
// — never raw exception text). Exported for direct testing (mirrors the
// `ScoringProfilePanel`/`ScheduleTab` seam).
// ---------------------------------------------------------------------------

export function ScoreCard({
  tenantId,
  agentId,
  run,
  benchmark,
  loading,
  error = null,
}: {
  tenantId: string;
  agentId: string;
  run: ScoringRunOut | null;
  benchmark: BenchmarkConfigOut | null;
  loading: boolean;
  error?: Error | null;
}) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Skeleton sx={{ height: 96, width: 96, borderRadius: 9999 }} />
        <Skeleton sx={{ height: 16, width: "100%" }} />
        <Skeleton sx={{ height: 16, width: "75%" }} />
      </Box>
    );
  }

  if (error) {
    return <ErrorState title="Failed to load scores" message={error.message} />;
  }

  // An agent whose bound profile version has no enabled checks has
  // nothing to score against, independent of whether it has ever produced a
  // run — so this must sit ahead of the no-runs branch below. Without that
  // placement a stuck agent with no runs falls into "No scores yet — Score
  // now to see results", which is now false, and it must also fire for an
  // agent that DOES have runs, which is why it is not folded into the
  // `if (!run)` branch instead.
  //
  // `benchmark?.hasEnabledChecks === false` (not `!benchmark?.hasEnabledChecks`)
  // so a null benchmark — a failed or absent benchmark read — takes no
  // branch at all here: this is a success-path state, matching the customer
  // rule that it fires only on present data, never on loading or error.
  if (benchmark?.hasEnabledChecks === false) {
    return (
      <EmptyState
        icon={IconMaterialSymbolsWarning}
        title={NO_ENABLED_CHECKS_COPY.title}
        description={NO_ENABLED_CHECKS_COPY.body}
        testId="scorecard-no-profile"
      />
    );
  }

  if (!run) {
    return (
      <EmptyState
        icon={IconMaterialSymbolsSpeed}
        title="No scores yet"
        description="Score now to see results — the first run returns a provisional grade."
        testId="scorecard-empty"
      />
    );
  }

  // Collapsed run (spec §3.1 Feature 6, agent-ia drift D2): every outcome
  // bucket is empty, so there is no score to gauge. Render the shared
  // explanation instead of falling into the gauge render below, which would
  // otherwise show `ScoreGauge value={run.compositeScore ?? 0}`
  // — a 0 reading with a provisional badge — where this tab used to show
  // "No scores yet". Gate on the copy itself, NOT on `isCollapsedRun`: that
  // predicate requires `state='failed'` plus a collapse `failureReason`,
  // which earlier runs cannot have, so gating on it excluded the very
  // runs this feature was built to explain. `collapsedRunCopy` is the single
  // source of truth for "is there something honest to say here" — it covers
  // the post-migration causes, the pre-migration unknown-cause case, and
  // stays silent for an unrelated `interrupted` failure or a genuinely empty
  // N=0 sample.
  if (collapsedRunCopy(run) != null) {
    return (
      <EmptyState
        icon={IconMaterialSymbolsWarning}
        title="Not scored"
        description={collapsedRunCopy(run)}
        testId="scorecard-collapsed"
      />
    );
  }

  // The conjunction, unchanged: this predicate stays scoped
  // to a run on purpose (`allDimensionsUnscored(run)` requires a run to
  // exist), while the no-checks state above keys off the benchmark
  // ALONE because it must render for an agent with no run at all — the run
  // half of this conjunction has no input to evaluate in that case. Both are
  // correct for their own case; do not "fix" this conjunction to match the
  // new branch, and do not delete the benchmark term — it is what keeps this
  // banner from firing on an all-null run alone.
  const noApplicable =
    allDimensionsUnscored(run) && (benchmark?.needsProfileAttention ?? false);
  const minSample = benchmark?.minSampleForVerdict ?? null;
  const remaining =
    minSample != null ? Math.max(0, minSample - run.scoredCount) : null;
  const provisionalNote = provisionalCaption(run, remaining);

  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", gap: 2 }}
      data-testid="scorecard"
    >
      <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 2, mb: 3 }}>
        <Typography variant="h6">Latest scored run</Typography>
        <Typography variant="body2" color="text.secondary">{run.startedAt ? new Date(run.startedAt).toLocaleString() : "Start time not recorded"}</Typography>
        <Chip tint="muted">{stateLabel(run.state)}</Chip>
        <Button data-testid="scorecard-view-run" onClick={() => void navigate({ to: "/tenants/$tenantId/agents/$agentId/runs/$runId", params: { tenantId, agentId, runId: run.runId }, search: { panel: "overview" } })}>View run</Button>
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(180px, 0.5fr) minmax(0, 1fr)" }, alignItems: "start", gap: 3 }}>
        <Box>
          <Typography variant="h1" data-testid="scorecard-composite" sx={{ fontVariantNumeric: "tabular-nums" }}>{run.compositeScore == null ? "Not scored" : formatScore(run.compositeScore)}{run.compositeScore != null ? <Typography component="span" variant="h5" color="text.secondary"> / 100</Typography> : null}</Typography>
          <VerdictBadge shipDecision={shipDecisionOf(run)} label={verdictBandLabel(run.verdict) ?? undefined} />
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
          <Typography variant="subtitle2">How stable is this score?</Typography>
          {run.confidence?.lower == null || run.confidence?.upper == null ? <Typography variant="body2" color="text.secondary">An uncertainty range is not available for this run.</Typography> : null}
          <ScoreUncertainty
            showInterval
            composite={run.compositeScore}
            lower={run.confidence?.lower}
            upper={run.confidence?.upper}
            bands={verdictBandsOf(run)}
          />
          {/*: no-applicable now requires needsProfileAttention (the
              agent-level authoritative signal), not the run's all-null
              aggregate alone — else falls to the provisional/insufficient
              caption below (natural XOR precedence). */}
          {noApplicable ? (
            <Typography
              variant="body2"
              color="text.secondary"
              data-testid="scorecard-no-applicable"
            >
              {NO_APPLICABLE_PROFILE_COPY.body}
            </Typography>
          ) : provisionalNote != null ? (
            <Typography
              variant="body2"
              color="text.secondary"
              data-testid="scorecard-provisional-note"
            >
              {provisionalNote}
            </Typography>
          ) : null}
        </Box>
      </Box>

      {/* Counts (§3.1 P4/§3.2 story 2) — prominent, not buried.

          The UNITS are load-bearing and used to be absent. `scoredCount` is
          INTERACTIONS (those with at least one score); `skippedCount` and
          `failedCount` are EVALUATIONS (one per check per interaction). Read
          without units, "14 scored · 40 skipped" invites the reading "14 of 54"
          and makes the evidence base look far narrower than it is — the real
          run behind that example scored 40 evaluations across 14 of 20
          interactions. Two different grains sat in adjacent chips saying
          neither.

          `skippedCount` no longer means "not applicable" — the applicability
          gate that produced that fact is gone. It now counts null verdicts:
          the judge ran, read the trace, and could not evidence the check on
          it. `failedCount` can no longer be positive: a genuine judge or
          infrastructure fault now fails the whole run before any per-check
          row is written, so this field keeps its persisted default of 0. */}
      <Box data-testid="scorecard-counts">
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" }, gap: 1.5, mt: 3, pt: 3, borderTop: 1, borderColor: "divider" }}>
        <Box sx={{ borderRadius: 2, bgcolor: "action.hover", p: 1.5 }}>
          <Typography variant="h5" sx={{ fontVariantNumeric: "tabular-nums" }}>{run.scoredCount}</Typography>
          <Typography variant="body2" color="text.secondary">interactions scored</Typography>
        </Box>
        {run.evalsAssigned != null && run.evalsAssigned > 0 ? (
          <Box sx={{ borderRadius: 2, bgcolor: "action.hover", p: 1.5 }}>
            <Typography variant="h5" sx={{ fontVariantNumeric: "tabular-nums" }}>{run.evalsScored == null ? "Not recorded" : `${run.evalsScored}/${run.evalsAssigned}`}</Typography>
            <Typography variant="body2" color="text.secondary">checks contributed</Typography>
          </Box>
        ) : null}
        <Box sx={{ borderRadius: 2, bgcolor: "action.hover", p: 1.5 }}>
          <Typography variant="h5" sx={{ fontVariantNumeric: "tabular-nums" }}>{run.skippedCount}</Typography>
          <Typography variant="body2" color="text.secondary">checks could not be evidenced</Typography>
        </Box>
        {run.retiredCount != null ? (
          <Box sx={{ borderRadius: 2, bgcolor: "action.hover", p: 1.5 }}>
            <Typography variant="h5" sx={{ fontVariantNumeric: "tabular-nums" }}>{run.retiredCount}</Typography>
            <Typography variant="body2" color="text.secondary">interactions retired</Typography>
          </Box>
        ) : null}
      </Box>
      {reuseCountsCopy(run).length ? <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 2 }}>{reuseCountsCopy(run).map((item) => <Chip key={item.key} tint="muted">{item.text}</Chip>)}</Box> : null}
      </Box>

      </Box>

      {/* No-new-evidence (build plan W4-A): single-sourced copy with
          ScoringRunResultPage's "no-new-evidence" banner (run-format.ts). */}
      {hasNoNewEvidence(run) ? (
        <Alert severity="info" data-testid="scorecard-no-new-evidence">
          <AlertTitle>{NO_NEW_EVIDENCE_COPY.title}</AlertTitle>
          {NO_NEW_EVIDENCE_COPY.body}
        </Alert>
      ) : null}

      {/* Verdict failure-rate guard (§3.2 story 2). Distinct from
          insufficient_sample, whose messaging is the "provisional-note"
          Typography above — this reason means real eval failures, not a
          small sample, so it gets its own explanation. */}
      {run.provisionalReasons?.includes("high_failure_rate") ? (
        <Alert severity="warning" data-testid="scorecard-high-failure-rate">
          <AlertTitle>Provisional — high failure rate</AlertTitle>
          {Math.round(run.genuineFailureRate * 100)}% of eval attempts
          genuinely failed — the ship/block verdict is withheld until the
          failures below are addressed.
        </Alert>
      ) : null}

      {/* Sample-incomplete guard (spec §3.1 Feature 3/6): a run that retired
          or cancelled part of its sample is forced provisional even if it
          scored ≥ the minimum. Gated on `!noEvalsAttempted(run) &&
          !isCollapsedRun(run)` — on a total collapse this sentence would be
          false (the run covers *none* of the sample) and the collapsed
          branch above already states that case; one message per run, never
          both. `sampleIncompleteCopy` is single-sourced with
          `ScoringRunResultPage` (run-format.ts). */}
      {run.provisionalReasons?.includes("sample_incomplete") &&
      !noEvalsAttempted(run) &&
      !isCollapsedRun(run) ? (
        <Alert severity="warning" data-testid="scorecard-sample-incomplete">
          <AlertTitle>Provisional — incomplete sample</AlertTitle>
          {sampleIncompleteCopy(run)}
        </Alert>
      ) : null}

      {run.metrics.length > 0 ? (
        <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: { xs: 2, md: 3 } }}>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center", mb: 2 }}>
            <Typography variant="h6">Evaluation breakdown</Typography>
            {run.metrics.some((metric: any) => metric.status === "fail" || metric.status === "partial") ? <Chip tint="warning">{run.metrics.filter((metric: any) => metric.status === "fail" || metric.status === "partial").length} need attention</Chip> : null}
            <Typography variant="caption" color="text.secondary">Results follow each evaluation’s scoring rule.</Typography>
          </Box>
        <PerPointGrid
          metrics={run.metrics}
          onDrillMetric={() =>
            void navigate({
              to: "/tenants/$tenantId/agents/$agentId/runs/$runId",
              params: { tenantId, agentId, runId: run.runId },
              search: { panel: "overview" },
            })
          }
        />
        </Box>
      ) : null}

      {/* Per-eval failure reasons (P3). */}
      {run.failureSummary && run.failureSummary.length > 0 ? (
        <FailureSummaryList items={run.failureSummary} />
      ) : null}
    </Box>
  );
}

/** Per-eval genuine-failure reasons (spec §3.1 P3/§3.2 story 1).
 * `humanReason` is the hardcoded, PII-safe reason surfaced prominently;
 * `errorClass` is a dim secondary detail (sanitized class name only — never
 * `str(exc)`). */
function FailureSummaryList({ items }: { items: FailureSummaryItem[] }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }} data-testid="failure-summary">
      <Typography variant="body2" fontWeight={600}>
        Failure reasons
      </Typography>
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
            <Typography
              variant="body2"
              fontWeight={500}
              sx={{ textTransform: "capitalize" }}
            >
              {evalLabel(item.evalSlug)}
            </Typography>
            <Typography variant="caption" color="text.primary" component="div">
              {item.humanReason}
            </Typography>
            <Typography variant="caption" color="text.secondary" component="div">
              {item.errorClass}
            </Typography>
          </Box>
          <Chip tint="destructive">{item.count}×</Chip>
        </Box>
      ))}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// ScorecardTab — thin card wrapper the shell renders. Score-now/active-run
// controls stay page-level (the shell owns them); this wrapper only owns the
// card header + ScoreCard body.
// ---------------------------------------------------------------------------

export function ScorecardTab({
  tenantId,
  agentId,
  run,
  benchmark,
  loading,
  error,
}: {
  tenantId: string;
  agentId: string;
  run: ScoringRunOut | null;
  benchmark: BenchmarkConfigOut | null;
  loading: boolean;
  error: Error | null;
}) {
  return <ScoreCard tenantId={tenantId} agentId={agentId} run={run} benchmark={benchmark} loading={loading} error={error} />;
}
