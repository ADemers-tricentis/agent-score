/** TraceScorePanel — the trace detail page's "Score details" view
 * (per-trace-scoring spec §3.1). Shows every eval a scoring run ever judged
 * for this one trace, and lets an operator trigger a run scoped to exactly
 * this trace.
 *
 * One query (`["trace-score", tenantId, agentId, traceId]`) drives every
 * state: loading skeletons, an `ErrorState`, the never-covered `EmptyState`,
 * and the populated header + per-eval cards. It self-polls while the
 * covering run is `queued`/`running` (`RUN_STATES_ACTIVE`, shared with the
 * agent-level run poll) and stops on a terminal state.
 *
 * The trigger button lives in this panel's own header and in its empty
 * state — never in the pinned trace header above it (that header already has
 * no scoring CTA of its own; adding one here would be a second "Score now"
 * on screen). The mockup draws the button inside the shared detail-pane
 * header next to the span/score toggle, but that header is owned by
 * `AgentTraceDetailPage` and stays view-agnostic; keeping the button here
 * instead means this panel owns its own trigger lifecycle end to end.
 */

import { useEffect, useState, type ReactNode } from "react";
import { useFakeMutation as useMutation, useFakeQuery as useQuery, useFakeQueryClient as useQueryClient } from "@/back-office/agents/fake-query";
import { Link as RouterLink } from "@tanstack/react-router";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import LinearProgress from "@mui/material/LinearProgress";
import Skeleton from "@mui/material/Skeleton";
import Tooltip from "@mui/material/Tooltip";
import IconMaterialSymbolsPlayArrow from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsPlayArrow.mjs";
import IconMaterialSymbolsSpeed from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsSpeed.mjs";

import * as scoringApi from "@/back-office/agents/fake-trace-data";
import type {
  TraceEvalResultOut,
  TraceScoreDetailOut,
} from "@/back-office/agents/fake-trace-data";
import {
  RUN_STATES_ACTIVE,
  stateLabel,
} from "@/back-office/agents/scoring/run-format";
import {
  coverageLabel,
  evalLabel,
  insufficientEvidenceCopy,
  isScored,
  JUDGE_REASON_ABSENT,
  sortResults,
} from "@/back-office/agents/trace-score-format";
import { Chip, ChipStrip } from "@/shared/components/chip";
import { describeEvidenceRef } from "@/shared/api/evidence-ref";
import { EmptyState } from "@/shared/components/empty-state";
import { ErrorState } from "@/shared/components/error-state";
import { toast } from "@/shared/lib/toast";

type RunHeader = NonNullable<TraceScoreDetailOut["run"]>;

export function TraceScorePanel({
  tenantId,
  agentId,
  traceId,
  traceTimestamp,
}: {
  tenantId: string;
  agentId: string;
  traceId: string;
  traceTimestamp: string;
}) {
  const qc = useQueryClient();
  const queryKey = ["trace-score", tenantId, agentId, traceId] as const;
  // Active run id captured at 409 time so the conflict message survives the
  // refetch that follows (mirrors `RunNowButton`'s `conflictRunId`).
  const [conflictRunId, setConflictRunId] = useState<string | null>(null);
  // `Date.now()` at the moment `conflictRunId` was set — the second
  // clearing arm below needs this to tell "a fetch that has looked since
  // the 409" apart from a stale one that predates it.
  const [conflictSetAt, setConflictSetAt] = useState<number | null>(null);
  // Bridges the gap between a successful 202 and the next poll landing: the
  // just-created run may not be visible in `query.data.run` yet even though
  // the trigger already succeeded, so the button must not flash back to
  // "Score this trace" in between.
  const [pendingRunId, setPendingRunId] = useState<string | null>(null);

  const query = useQuery({
    queryKey,
    queryFn: () => scoringApi.getTraceScoreDetail(tenantId, agentId, traceId),
    refetchInterval: (q) => {
      const state = q.state.data?.run?.state;
      const activeNow = state != null && RUN_STATES_ACTIVE.has(state);
      // `pendingRunId`/`conflictRunId` keep polling alive even when this
      // read shows no active run at all: `run` here is "the latest run that
      // wrote a result row for this trace", and a run that was JUST created
      // (ours, at `pendingRunId`) or is running elsewhere (the one behind
      // `conflictRunId`) is invisible until it writes its first row — for a
      // beat, this query still reports the PREVIOUS run's terminal state,
      // or `null`. The trigger's own 202 return value (`pendingRunId`) and
      // the 409's own run id (`conflictRunId`) are the only evidence such a
      // run exists during that window, so they alone must be enough to keep
      // refetching — otherwise the panel would never poll far enough to see
      // either one resolve.
      return pendingRunId != null || conflictRunId != null || activeNow
        ? 2000
        : false;
    },
  });

  useEffect(() => {
    if (
      pendingRunId != null &&
      query.data?.run?.runId === pendingRunId &&
      !RUN_STATES_ACTIVE.has(query.data.run.state)
    ) {
      setPendingRunId(null);
    }
  }, [pendingRunId, query.data]);

  // Mirrors the effect above, but a 409 needs TWO independent ways to clear
  // — a conflicting run's fate is only observable through this trace's own
  // read, and neither arm alone covers every way it can resolve:
  //
  //   Arm 1 — we SAW the conflicting run finish: it appears as `run.runId`
  //   and has gone terminal. This is the common case (a run scoped to this
  //   trace normally writes a result row for it, so this trace's own read
  //   eventually names it directly) — same shape as the `pendingRunId`
  //   effect above.
  //
  //   Arm 2 — we have since LOOKED and found nothing active for this trace
  //   at all, on a fetch that landed strictly after the 409
  //   (`query.dataUpdatedAt > conflictSetAt`). Arm 1 alone misses a
  //   conflicting run that fails outright or is cancelled before writing
  //   ANY result row for this trace — its id can never appear in `run`, so
  //   without this arm the button would stay dead forever in exactly that
  //   case. The timestamp gate is load-bearing, not "no active run" alone:
  //   a STALE pre-conflict read (the query's cached data from before the
  //   409 even happened) would otherwise satisfy "no active run" instantly
  //   and clear the flag the moment it's set, before the query has ever
  //   actually observed the conflicting run — the exact premature-clear
  //   failure mode arm 1's runId check exists to avoid, and this arm must
  //   not reintroduce it.
  useEffect(() => {
    if (conflictRunId == null) return;
    const sawItFinish =
      query.data?.run?.runId === conflictRunId &&
      !RUN_STATES_ACTIVE.has(query.data.run.state);
    const state = query.data?.run?.state;
    const activeNow = state != null && RUN_STATES_ACTIVE.has(state);
    const lookedSinceConflict =
      conflictSetAt != null && query.dataUpdatedAt > conflictSetAt;
    if (sawItFinish || (lookedSinceConflict && !activeNow)) {
      setConflictRunId(null);
      setConflictSetAt(null);
    }
  }, [conflictRunId, conflictSetAt, query.data, query.dataUpdatedAt]);

  const triggerMutation = useMutation({
    mutationFn: () =>
      scoringApi.triggerTraceRun(tenantId, agentId, traceId, {
        timestamp: traceTimestamp,
      }),
    onSuccess: (created) => {
      setConflictRunId(null);
      setConflictSetAt(null);
      setPendingRunId(created.runId);
      void qc.invalidateQueries({ queryKey });
    },
    onError: (e: Error) => {
      if (e instanceof scoringApi.TraceRunConflictError) {
        setConflictRunId(e.runId);
        setConflictSetAt(Date.now());
      } else {
        toast.error(e.message);
      }
    },
  });

  // `trace-score-panel` is the stable container hook — it is present in
  // EVERY state (loading, error, empty, populated) so a caller (the e2e
  // flow in particular) can assert the view mounted at all without caring
  // which state it landed in. Each state additionally carries its own,
  // more specific hook: `trace-score-loading` here, `trace-score-error`
  // below (via `ErrorState`'s `testId`), `trace-score-empty` and
  // `trace-eval-<slug>` further down.
  if (query.isLoading) {
    return (
      <Box data-testid="trace-score-panel">
        <Box
          data-testid="trace-score-loading"
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          <Skeleton sx={{ height: 24, width: "50%" }} />
          <Skeleton variant="rounded" sx={{ height: 96, width: "100%" }} />
          <Skeleton variant="rounded" sx={{ height: 96, width: "100%" }} />
        </Box>
      </Box>
    );
  }

  if (query.isError || !query.data) {
    return (
      <Box data-testid="trace-score-panel">
        <ErrorState
          testId="trace-score-error"
          title="Failed to load this trace's score details"
          message={
            (query.error as Error | undefined)?.message ??
            "Trace score details not found."
          }
        />
      </Box>
    );
  }

  const data = query.data;
  const run = data.run;
  const isConflict = conflictRunId != null;
  const isRunActive = run != null && RUN_STATES_ACTIVE.has(run.state);
  const isInFlight =
    isConflict || isRunActive || triggerMutation.isPending || pendingRunId != null;
  // A run this panel itself just created, before `data.run` has caught up to
  // it — `trace_eval_results` (the backend read this query drives) only
  // resolves a trace's `run` once that run has written its FIRST verdict row
  // for this trace, so a single-trace run (one checkpoint covering every eval
  // at once) can sit in this window for its entire duration. Without this,
  // `isInFlight` still disables the trigger correctly (via `pendingRunId`),
  // but nothing ever told the operator WHY — the panel rendered no alert at
  // all until the run's own row finally appeared.
  const isPendingUnconfirmed =
    pendingRunId != null && !(run != null && run.runId === pendingRunId);
  // The other side of the same backend change: `get_trace_score_detail` can
  // now return a non-null, ACTIVE `run` with an empty `results` — the run
  // covers this trace but has not written anything for it yet (only
  // reachable via that path: the alternative, `trace_eval_results`, never
  // resolves a run with zero rows). `totalEvals === 0` there is "not known
  // yet", not "nothing scored", and must not render as either.
  const isActiveWithNoCoverageYet =
    isRunActive && data.totalEvals === 0 && data.results.length === 0;

  const insufficientEvidenceCount = data.results.filter((r) => !isScored(r)).length;

  const triggerButton = (
    <TriggerButton
      disabled={isInFlight}
      reason={
        isConflict
          ? "This trace is already being scored by another run — wait for it to finish."
          : isInFlight
            ? "This trace is currently being scored."
            : null
      }
      onClick={() => {
        if (!isInFlight) triggerMutation.mutate();
      }}
    />
  );

  return (
    <Box
      data-testid="trace-score-panel"
      sx={{ display: "flex", flexDirection: "column", gap: 2 }}
    >
      {run != null ? (
        <ScoreHeader
          score={data.score}
          scoredEvals={data.scoredEvals}
          totalEvals={data.totalEvals}
          insufficientEvidenceCount={insufficientEvidenceCount}
          triggerButton={triggerButton}
          pending={isActiveWithNoCoverageYet}
        />
      ) : null}

      {isConflict ? (
        <Alert severity="warning" data-testid="trace-score-conflict">
          This trace is already being scored by run{" "}
          {conflictRunId ? (
            <RouterLink
              to="/tenants/$tenantId/agents/$agentId/runs/$runId"
              params={{ tenantId, agentId, runId: conflictRunId } as never}
              search={{ panel: "overview" }}
            >
              <Box component="span" sx={{ fontFamily: "monospace" }}>
                {conflictRunId.slice(0, 8)}…
              </Box>
            </RouterLink>
          ) : (
            "— refresh to view it"
          )}
          . Wait for it to finish before starting another.
        </Alert>
      ) : isRunActive && run ? (
        <InFlightAlert
          run={run}
          resultCount={data.results.length}
          totalEvals={data.totalEvals}
          tenantId={tenantId}
          agentId={agentId}
        />
      ) : isPendingUnconfirmed ? (
        <PendingRunAlert
          runId={pendingRunId!}
          tenantId={tenantId}
          agentId={agentId}
        />
      ) : null}

      {run == null ? (
        <EmptyState
          testId="trace-score-empty"
          icon={IconMaterialSymbolsSpeed}
          title="No scoring run has covered this trace"
          description="Scoring runs sample an agent's traces, so a trace can be missed. Results are also pruned after the retention window, so an old trace can lose the rows it once had. Score it now to judge it against the agent's adopted profile."
          action={triggerButton}
        />
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {sortResults(data.results).map((result) => (
            <EvalCard key={result.evalSlug} result={result} />
          ))}
        </Box>
      )}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Trigger button — mirrors `RunNowButton` (`scoring/run-actions.tsx`).
// ---------------------------------------------------------------------------

function TriggerButton({
  disabled,
  reason,
  onClick,
}: {
  disabled: boolean;
  /** Why the button is disabled — rendered in a `Tooltip` so the
   *  non-interactive state has an accessible explanation. Null/ignored when
   *  `disabled` is false. */
  reason: string | null;
  onClick: () => void;
}) {
  // A native `disabled` button drops out of the tab order, and MUI moves the
  // Tooltip's `aria-describedby` onto a wrapping `<span>` in that case — so a
  // keyboard or screen-reader user could never reach the reason. `aria-
  // disabled` keeps the control focusable and announced, which is exactly
  // what lets the `Tooltip` below attach straight to the `Button` itself
  // (no wrapper needed) and actually be reachable.
  if (disabled) {
    const button = (
      <Button
        variant="outlined"
        size="small"
        startIcon={<IconMaterialSymbolsPlayArrow />}
        aria-disabled="true"
        tabIndex={0}
        data-testid="trace-score"
        sx={{
          color: "action.disabled",
          borderColor: "action.disabledBackground",
          cursor: "not-allowed",
        }}
      >
        Scoring…
      </Button>
    );
    return reason ? <Tooltip title={reason}>{button}</Tooltip> : button;
  }
  return (
    <Button
      variant="outlined"
      size="small"
      startIcon={<IconMaterialSymbolsPlayArrow />}
      onClick={onClick}
      data-testid="trace-score"
    >
      Score this trace
    </Button>
  );
}

// ---------------------------------------------------------------------------
// Header block — run identity + coverage.
// ---------------------------------------------------------------------------

function ScoreHeader({
  score,
  scoredEvals,
  totalEvals,
  insufficientEvidenceCount,
  triggerButton,
  pending = false,
}: {
  score: number | null;
  scoredEvals: number;
  totalEvals: number;
  insufficientEvidenceCount: number;
  triggerButton: ReactNode;
  /** True while a run covers this trace but has written no result for it
   *  yet — the window `get_trace_score_detail` now reports as an active
   *  run before any verdict row exists (a single-trace run's checkpoint
   *  lands every eval it covers in one commit at completion, never
   *  incrementally). `totalEvals`/`scoredEvals` are both 0 here, not
   *  "nothing scored" — mirrors `InFlightAlert`'s own rule that nothing
   *  renders below a known denominator. */
  pending?: boolean;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 0.75,
        pb: 1.5,
        borderBottom: 1,
        borderColor: "divider",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.25 }}>
          {/* No colour on the score itself: a verdict band is defined for
              the agent's weighted composite, not for one trace's unweighted
              mean, and tinting this number would assert a band that doesn't
              exist at this grain. */}
          <Box
            component="span"
            sx={{ typography: "h5", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}
          >
            {pending ? "…" : score != null ? `${Math.round(score * 100)}%` : "—"}
          </Box>
          <Box component="span" sx={{ typography: "caption", color: "text.secondary" }}>
            {pending
              ? "waiting for the run to judge this trace"
              : score != null
                ? `unweighted mean of the ${scoredEvals} scored eval${scoredEvals === 1 ? "" : "s"}`
                : "no eval produced a score"}
          </Box>
        </Box>
        {/* The trigger is the right-hand child of the SCORE row, not of the
            chip row: on a narrow panel the chips wrap to their own line, and a
            button trailing them would wrap with them and land mid-row instead
            of against the right edge. */}
        {triggerButton}
      </Box>

      {pending ? null : (
        <ChipStrip>
          <Chip tint="muted">{coverageLabel(scoredEvals, totalEvals)}</Chip>
          {insufficientEvidenceCount > 0 ? (
            <Chip tint="muted">{insufficientEvidenceCount} insufficient evidence</Chip>
          ) : null}
        </ChipStrip>
      )}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// In-flight alert
// ---------------------------------------------------------------------------

function InFlightAlert({
  run,
  resultCount,
  totalEvals,
  tenantId,
  agentId,
}: {
  run: RunHeader;
  resultCount: number;
  totalEvals: number;
  tenantId: string;
  agentId: string;
}) {
  // Nothing renders here below a known denominator — a partial mean over an
  // unknown fraction of evals is a different number from the one this run
  // will report, so the progress bar only appears once the denominator is
  // actually known.
  const progress = totalEvals > 0 ? (resultCount / totalEvals) * 100 : null;

  return (
    <Alert severity="info" data-testid="trace-score-inflight">
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
        <Box sx={{ typography: "body1" }}>
          Scoring this trace — run{" "}
          {/* The drill-through to the run this trace is being scored by. The
              e2e flow follows it to prove the run-detail page is reachable
              from here, so it carries a stable hook rather than being selected
              by its truncated run id. */}
          <RouterLink
            to="/tenants/$tenantId/agents/$agentId/runs/$runId"
            params={{ tenantId, agentId, runId: run.runId } as never}
            search={{ panel: "overview" }}
            data-testid="trace-score-run-link"
          >
            <Box component="span" sx={{ fontFamily: "monospace" }}>
              {run.runId.slice(0, 8)}…
            </Box>
          </RouterLink>{" "}
          is{" "}
          <Box component="span" sx={{ fontWeight: 600 }}>
            {stateLabel(run.state).toLowerCase()}
          </Box>
          .
        </Box>
        {progress != null ? (
          <>
            <LinearProgress
              variant="determinate"
              value={progress}
              aria-label="Evals judged"
            />
            <Box
              sx={{
                typography: "caption",
                color: "text.secondary",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {resultCount} of {totalEvals} evals judged
            </Box>
          </>
        ) : null}
      </Box>
    </Alert>
  );
}

/** The window `InFlightAlert` cannot cover: a run this panel just created
 * (`pendingRunId`, from the trigger's own 202) that `data.run` has not yet
 * reflected. Carries no state claim — `RunCreatedOut` returns only a
 * `runId`, never a state — so unlike `InFlightAlert` this never renders
 * "queued"/"running" text it cannot back. Same `trace-score-inflight` hook:
 * both alerts answer the same question ("is a run covering this trace right
 * now"), just from different evidence. */
function PendingRunAlert({
  runId,
  tenantId,
  agentId,
}: {
  runId: string;
  tenantId: string;
  agentId: string;
}) {
  return (
    <Alert severity="info" data-testid="trace-score-inflight">
      Scoring this trace — run{" "}
      <RouterLink
        to="/tenants/$tenantId/agents/$agentId/runs/$runId"
        params={{ tenantId, agentId, runId } as never}
        search={{ panel: "overview" }}
        data-testid="trace-score-run-link"
      >
        <Box component="span" sx={{ fontFamily: "monospace" }}>
          {runId.slice(0, 8)}…
        </Box>
      </RouterLink>{" "}
      was just triggered.
    </Alert>
  );
}

// ---------------------------------------------------------------------------
// One eval's result card
// ---------------------------------------------------------------------------

/** "3 samples · 1 null" — the same evidence `RunEventLogPanel` surfaces per
 * row, here on a single trace's per-eval card. What lets a reader trust (or
 * distrust) the score above it, scored or not. */
function sampleSummary(result: TraceEvalResultOut): string {
  const { sampleCount, nullCount } = result;
  const base = `${sampleCount} sample${sampleCount === 1 ? "" : "s"}`;
  return nullCount > 0 ? `${base} · ${nullCount} null` : base;
}

function EvalCard({ result }: { result: TraceEvalResultOut }) {
  const scored = result.score != null;
  return (
    <Box
      data-testid={`trace-eval-${result.evalSlug}`}
      sx={(theme) => ({
        border: 1,
        borderColor: "divider",
        borderRadius: 1,
        p: 1.5,
        display: "flex",
        flexDirection: "column",
        gap: 0.75,
        bgcolor: scored ? "background.paper" : theme.palette.action.hover,
      })}
    >
      <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 1 }}>
        <Box
          component="span"
          sx={{ typography: "body1", fontWeight: 600, textTransform: "capitalize" }}
        >
          {evalLabel(result.evalSlug)}
        </Box>
        {scored ? (
          <Box
            component="span"
            sx={{
              fontFamily: "monospace",
              typography: "body1",
              fontWeight: 600,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {result.score!.toFixed(2)}
          </Box>
        ) : (
          <Chip tint="muted">insufficient evidence</Chip>
        )}
      </Box>

      {scored ? <ScoredBody result={result} /> : <InsufficientEvidenceBody result={result} />}
    </Box>
  );
}

function ScoredBody({ result }: { result: TraceEvalResultOut }) {
  return (
    <>
      <Box
        sx={{
          typography: "caption",
          color: "text.secondary",
          fontStyle: result.reason == null ? "italic" : "normal",
        }}
      >
        {result.reason ?? JUDGE_REASON_ABSENT}
      </Box>
      {result.evidenceRefs && result.evidenceRefs.length > 0 ? (
        <ChipStrip>
          <Box
            component="span"
            sx={{ typography: "overline", letterSpacing: "0.05em", color: "text.secondary" }}
          >
            Evidence
          </Box>
          {result.evidenceRefs.map((ref, i) => {
            // Keyed by index, not by the entry: a judge's citation triple
            // stringifies to `[object Object]`, so every chip in a judged
            // verdict would otherwise share one key.
            const display = describeEvidenceRef(ref);
            return (
              <Chip
                key={i}
                tint={display.verified === false ? "warning" : "muted"}
                data-testid={`trace-evidence-ref-${display.kind}`}
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
        </ChipStrip>
      ) : null}
      <ChipStrip>
        <Chip tint="muted">{sampleSummary(result)}</Chip>
      </ChipStrip>
    </>
  );
}

function InsufficientEvidenceBody({ result }: { result: TraceEvalResultOut }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
      <Box sx={{ typography: "caption", color: "text.secondary" }}>
        {insufficientEvidenceCopy(result)}
      </Box>
      {result.reason ? (
        <Box sx={{ typography: "caption", color: "text.secondary", fontStyle: "italic" }}>
          “{result.reason}”
        </Box>
      ) : null}
    </Box>
  );
}
