import type { ScoringRunOut } from "@/back-office/agents/scoring-api";
import { PROVISIONAL_REASON_COPY } from "@/shared/format/provisional-reason";
import type { ShipDecision } from "@/shared/components/verdict-badge";

// The runner finalizes inline in one fenced transaction — there is no
// separate aggregation phase, so `queued`/`running` are the only two
// non-terminal states a run can observably be in. Exported for direct
// testing (mirrors `ScoringRunResultPage`'s `DimensionBreakdownSection`
// seam) — these are pure predicates, no need to mount the full routed page
// to assert on them.
export const RUN_STATES_ACTIVE = new Set(["queued", "running"]);

// The three-way `failure_reason` literals — mirrors the
// backend's closed set exactly (`store.py::_COLLAPSE_FAILURE_REASONS`).
// `finalize_completion` derives exactly one of these when a run collapses
// (nothing scored/skipped/failed, at least one task retired or cancelled);
// `global_scoring_window` (the dashboard's own collapsed-run query) filters
// on this exact set for the same reason this file does: a bare
// `state === "failed"` check also catches unrelated failures — e.g.
// `reclaim_jobless_runs`'s `failure_reason: "interrupted"` restart-orphan rows —
// that have nothing to do with a retirement/cancellation collapse.
//
// Since the per-eval scoring engine that fed a retired-count was retired,
// `ALL_TASKS_RETIRED` and `NO_TASK_PRODUCED_A_RESULT` have no server-side
// producer any more — the backend deliberately kept the constants, and this
// file keeps rendering them, so runs already in the database that carry one
// of the two still get honest copy. `ALL_TASKS_CANCELLED` is the only
// literal a run created today can collapse with.
export const ALL_TASKS_RETIRED = "all_tasks_retired";
export const ALL_TASKS_CANCELLED = "all_tasks_cancelled";
export const NO_TASK_PRODUCED_A_RESULT = "no_task_produced_a_result";
export const COLLAPSE_FAILURE_REASONS: ReadonlySet<string> = new Set([
  ALL_TASKS_RETIRED,
  ALL_TASKS_CANCELLED,
  NO_TASK_PRODUCED_A_RESULT,
]);

/**
 * True when this run is a genuine collapse — the single definition
 * `collapsedRunCopy` and the Score-tab anchor filter both key off of, so a
 * run can no longer get collapse copy in one place while being excluded
 * from anchoring in the other (or vice versa).
 *
 * Requires BOTH `state === "failed"` AND a `failureReason` from the closed
 * 3-literal set — `failureReason` alone is not enough: a bare reason check
 * would depend on every write path that ever moves a run OFF `failed`
 * remembering to clear this column in the same transaction. The resume
 * path does exactly that today (it nulls `failureReason` in the same write
 * that flips a run back to `running`) — but nothing enforces that
 * discipline on a future writer, and a bare reason check would silently
 * call a run "collapsed" off whatever stale value one left behind.
 * Checking `state` too makes this predicate correct on its own terms, not
 * on every writer's continued cooperation.
 */
export function isCollapsedRun(run: ScoringRunOut): boolean {
  return (
    run.state === "failed" &&
    run.failureReason != null &&
    COLLAPSE_FAILURE_REASONS.has(run.failureReason)
  );
}

/**
 * True when every outcome bucket is empty — no evaluator ever ran for this
 * run. Depends only on `scoredCount` / `skippedCount` / `failedCount`,
 * fields that have always existed on `ScoringRunOut`, so it identifies a
 * collapsed run correctly for pre-migration rows too (no `retiredCount`
 * recorded) with no data migration needed (spec §3.1 Feature 6).
 */
export function noEvalsAttempted(run: ScoringRunOut): boolean {
  return run.scoredCount + run.skippedCount + run.failedCount === 0;
}

/** Run-state slug → display label. */
export function stateLabel(state: string): string {
  switch (state) {
    case "queued":
      return "Queued";
    case "running":
      return "Running";
    case "complete":
      return "Complete";
    case "partial":
      return "Partial";
    case "failed":
      return "Failed";
    case "cancelled":
      return "Cancelled";
    default:
      return state;
  }
}

export function verdictForRun(run: ScoringRunOut): "ship" | "review" | "block" | null {
  if (run.verdict === "ship") return "ship";
  if (run.verdict === "review") return "review";
  if (run.verdict === "block") return "block";
  return null;
}

/** "20 of 50 requested — capped by benchmark", or null when nothing was capped.
 *
 * Describes a run whose effective size came in under what was requested.
 * That gap is history now, not a live path: the trigger no longer clamps a
 * request to the benchmark's cap, so a manual run made today always records
 * equal requested and effective sizes, and this note stays silent for it.
 * Only a run recorded while the trigger still clamped can show it.
 *
 * Null when the caller named no size (`requestedSampleSize` absent) or asked
 * for no more than the cap: there is nothing to explain in either case.
 */
export function sampleSizeCapNote(run: ScoringRunOut): string | null {
  const requested = run.requestedSampleSize;
  if (requested == null || requested <= run.sampleSize) return null;
  return `${run.sampleSize} of ${requested} requested — capped by benchmark`;
}

/** "6 of 7 profile checks assigned · 1 excluded (needs ground truth)".
 *
 * Reads ONLY the run's own frozen `excluded_checks`, never the live profile.
 * A run predating that record returns null and the line is simply omitted:
 * re-deriving from today's profile and today's exclusion rule would state a
 * decision that run never made. Nothing is backfilled.
 */
export function excludedChecksNote(run: ScoringRunOut): string | null {
  const snap = run.benchmarkConfigSnapshot as Record<string, unknown> | undefined;
  const raw = snap?.excluded_checks;
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const assigned = Array.isArray(snap?.metrics) ? snap.metrics.length : 0;
  const slugs = raw
    .map((e) => (e as Record<string, unknown>)?.eval_slug)
    .filter((s): s is string => typeof s === "string");
  if (slugs.length === 0) return null;
  return (
    `${assigned} of ${assigned + slugs.length} profile checks assigned · ` +
    `${slugs.join(", ")} excluded — needs ground truth, not available in a population run`
  );
}

/** The verdict bands this run was actually graded against.
 *
 * Read from the run's FROZEN snapshot, never the live profile: a profile
 * re-authored after the run would otherwise silently restate which edges an
 * old score was judged on. The snapshot is `unknown`-typed JSON, so every
 * value is re-checked rather than asserted.
 */
export function verdictBandsOf(run: ScoringRunOut): Record<string, number> {
  const snap = run.benchmarkConfigSnapshot as Record<string, unknown> | undefined;
  const raw = snap?.verdict_bands;
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const n = Number(v);
    if (Number.isFinite(n)) out[k] = n;
  }
  return out;
}

/** ship_decision string → the typed prop ShipDecision (falls back to provisional). */
export function shipDecisionOf(run: ScoringRunOut): ShipDecision {
  return shipDecisionFromString(run.shipDecision ?? "");
}

/**
 * Run-level fact: every weighted dimension came back unscored (all
 * aggregates null). Occurs for genuine no-fit AND for ordinary
 * low-sample/zero-trace runs, so it is NOT by itself "no applicable
 * profile" — callers must additionally check the agent-level
 * `benchmark.needsProfileAttention` signal before drawing that conclusion.
 */
export function allDimensionsUnscored(run: ScoringRunOut): boolean {
  const aggs = run.dimensionAggregates;
  if (!aggs) return false;
  const entries = Object.values(aggs);
  if (entries.length === 0) return false;
  return entries.every((d: any) => d.score == null);
}
export const EMPTY_RUN_NO_ENABLED_CHECKS = "no_enabled_checks";
export const EMPTY_RUN_ALL_EXCLUDED = "all_candidates_excluded";
export const EMPTY_RUN_NO_GOLDENS = "no_goldens";

/**
 * Why a run scored nothing, when the backend recorded the cause.
 *
 * `null` for an unrecorded cause (a run predating the column) and for an
 * unrecognised one from a newer server, so the caller falls through to its
 * existing generic copy rather than rendering a blank or the raw slug.
 *
 * `no_traces` deliberately keeps the insufficient-sample framing by returning
 * `null`: that copy is already correct for it, and the caller pairs it with
 * the scored-interaction count. Only the two causes that are NOT about sample
 * size get their own sentence — naming a lever is the whole point, and
 * "insufficient sample" names the wrong one.
 */
export function emptyRunCopy(emptyReason: string | null | undefined): string | null {
  switch (emptyReason) {
    case EMPTY_RUN_NO_ENABLED_CHECKS:
      return "Not scored — no check in this profile can score live traffic. Every check it carries needs an expected answer, so scoring here requires uploading golden answers or switching to a different profile.";
    case EMPTY_RUN_ALL_EXCLUDED:
      return "Not scored — every interaction sampled for this run was excluded. See this run's excluded-check list for what was dropped.";
    case EMPTY_RUN_NO_GOLDENS:
      return "Not scored — this agent has no confirmed golden carrying an expected answer, so a golden-match run had nothing to score; label some interactions first.";
    default:
      return null;
  }
}

/**
 * "4 of 7 candidate goldens scoped · 2 verdict-only excluded, 1 source trace
 * expired" — a `golden_match` run's frozen scope accounting (`store.py`'s
 * `golden_scope`, D1/D2/D3 of the golden-linkage change).
 *
 * Reads ONLY the run's own frozen `golden_scope`, never re-derived: a run
 * predating the column returns null. The snapshot is `unknown`-typed JSON,
 * so every value is re-checked rather than asserted (mirrors
 * `excludedChecksNote` above). The two optional clauses (verdict-only
 * excluded, source trace expired) render only when non-zero — most runs
 * have neither, and a bare "0 excluded" adds noise without signal.
 */
export function goldenScopeNote(run: ScoringRunOut): string | null {
  const snap = run.benchmarkConfigSnapshot as Record<string, unknown> | undefined;
  const raw = snap?.golden_scope;
  if (!raw || typeof raw !== "object") return null;
  const scope = raw as Record<string, unknown>;
  const candidates = Number(scope.candidate_goldens);
  const scoped = Number(scope.scoped);
  if (!Number.isFinite(candidates) || !Number.isFinite(scoped)) return null;

  const extras: string[] = [];
  const verdictOnlyExcluded = Number(scope.verdict_only_excluded);
  if (Number.isFinite(verdictOnlyExcluded) && verdictOnlyExcluded > 0) {
    extras.push(`${verdictOnlyExcluded} verdict-only excluded`);
  }
  const sourceTraceExpired = Number(scope.source_trace_expired);
  if (Number.isFinite(sourceTraceExpired) && sourceTraceExpired > 0) {
    extras.push(`${sourceTraceExpired} source trace${sourceTraceExpired === 1 ? "" : "s"} expired`);
  }

  const base = `${scoped} of ${candidates} candidate goldens scoped`;
  return extras.length > 0 ? `${base} · ${extras.join(", ")}` : base;
}

/**
 * Collapsed-run explanation for the header on any run that recorded nothing
 * (`noEvalsAttempted(run)`) — both later collapses, which carry an
 * explicit cause, and earlier ones, which do not. Shared by
 * `ScoringRunResultPage` and
 * `ScorecardTab` so both surfaces render identical copy for the same
 * situation instead of duplicating (and drifting on) the strings (spec
 * §3.1 Feature 6). Discriminates on `run.failureReason` — the same 3-literal
 * fact the backend's own dashboard query filters on — NOT on `retiredCount`:
 * an all-cancelled collapse always carries `retiredCount === 0` (only
 * retirements are persisted on the run row; cancellations are not a
 * separate column), so keying off "retired > 0" silently dropped that case
 * to `null` and let the caller's generic "Insufficient sample" copy render
 * instead — blaming the customer's sample for work that was cancelled, not
 * missing. Returns `null` when the run is not a collapse at all.
 */
export function collapsedRunCopy(run: ScoringRunOut): string | null {
  // Recording nothing is the precondition for ANY collapse copy.
  if (!noEvalsAttempted(run)) return null;

  // The backend's own recorded cause wins over every derivation
  // below, because it is the only one that did not have to be inferred.
  // These runs reach this function as `state="complete"` with no
  // `failureReason` and `retiredCount === 0`, which is the exact shape the
  // `retiredCount === 0` branch further down returns `null` for — so before
  // this, all three causes rendered as "Insufficient sample" and a
  // permanently unscorable binding was indistinguishable from an agent that
  // had simply not sent enough traffic yet.
  const emptyCopy = emptyRunCopy(run.emptyReason);
  if (emptyCopy) return emptyCopy;

  // Earlier runs recorded nothing but predate the cause column, so they
  // carry `state='complete'` and no `failureReason` and never match
  // `isCollapsedRun`. They are the five production runs this whole change
  // exists to explain, so they MUST still get honest copy — that retroactive
  // fix is the point of keying the precondition on the counts (which have
  // always existed) rather than on data only new runs have (spec §1.3
  // non-goal 3, §1.4, §3.1 Feature 6). Verified against production: without
  // this branch they fall through to "Insufficient sample — Scored 0
  // interactions", which is not the false profile-fit claim but still isn't
  // the truth (none of the interactions could be processed).
  if (!isCollapsedRun(run)) {
    // A `failed` run carrying some OTHER reason — `interrupted` from
    // `reclaim_jobless_runs` is the live one — is not a collapse. Its own failure
    // reason already renders, and claiming "the cause was not recorded"
    // would be false when it plainly was.
    if (run.state === "failed") return null;
    if (run.retiredCount != null && run.retiredCount > 0) {
      return `Not scored — none of the ${run.sampleSize} interactions could be processed (${run.retiredCount} tasks retired). Re-run to try again.`;
    }
    if (run.retiredCount == null) {
      return "Not scored — no evaluations were recorded for this run. The cause was not recorded.";
    }
    // `retiredCount === 0`: a genuinely empty sample (the N=0 path writes 0,
    // not NULL). "Insufficient sample" is the correct copy there.
    return null;
  }

  switch (run.failureReason) {
    case ALL_TASKS_RETIRED: {
      // `retiredCount` is always populated by the backend whenever this
      // literal is written (it IS the count that drove the decision) — the
      // null branch is defensive only, and never asserts a number we don't
      // have.
      const detail =
        run.retiredCount != null ? ` (${run.retiredCount} tasks retired)` : "";
      return `Not scored — none of the ${run.sampleSize} interactions could be processed${detail}. Re-run to try again.`;
    }
    case ALL_TASKS_CANCELLED:
      // Honest framing: nobody cancelled anything — this literal is now
      // reached when the run's job failed before any trace was attempted
      // (e.g. an agent pinned to an eval version whose engine reference no
      // longer resolves), so the traces sampled are not at fault here. The
      // real cause lives on the run's owning job, not on this run.
      return "Not scored — the run's job failed before any trace was attempted. See Scoring Pipeline for the job's failure reason.";
    case NO_TASK_PRODUCED_A_RESULT:
      // The genuine-mix case: some tasks retired, some cancelled. Only
      // `retiredCount` is on the wire (`cancelledCount` is fan-in-only on
      // the backend, never persisted), so this names both causes without
      // asserting a cancelled-task figure we don't have.
      return `Not scored — none of the ${run.sampleSize} interactions could be processed (a mix of retired and cancelled tasks). Re-run to try again.`;
    default:
      return null;
  }
}

/**
 * Honest provisional caption for the Scorecard (spec's provisional-caption
 * ruling): the interaction-count sentence renders ONLY when
 * `provisionalReasons` includes `insufficient_sample` AND `remaining > 0` —
 * never "0 more", the reported bug, since the interaction count was never
 * the blocker for every other reason on this run. Every other non-empty
 * reason list falls back to the shared per-reason copy
 * (`PROVISIONAL_REASON_COPY`, moved to `shared/format/provisional-reason.ts`
 * for exactly this cross-surface reuse). An empty reason list still needs a
 * caption for a provisional run — that gets a generic sentence, never a
 * count it cannot honestly report. `null` when the run is not provisional at
 * all.
 */
export function provisionalCaption(
  run: ScoringRunOut,
  remaining: number | null,
): string | null {
  if (!run.isProvisional) return null;
  const reasons = run.provisionalReasons ?? [];
  if (reasons.includes("insufficient_sample") && remaining != null && remaining > 0) {
    return `Score will be provisional until ${remaining} more interaction${
      remaining === 1 ? "" : "s"
    } ${remaining === 1 ? "is" : "are"} scored.`;
  }
  if (reasons.length > 0) {
    return `Score is provisional — ${reasons
      .map((reason: any) => PROVISIONAL_REASON_COPY[reason])
      .join("; ")}.`;
  }
  return "Score is provisional.";
}

/**
 * The "part of the sample could not be processed" provisional sentence
 * (spec §3.1 Feature 3/6, `provisionalReasons` includes `sample_incomplete`).
 * Single-sourced here — `ScoringRunResultPage` and `ScorecardTab` had
 * already drifted on it despite the intent to share it: one surface read
 * `run.retiredCount ?? 0` (rendering the self-contradictory "0 of 50
 * interactions could not be processed" — asserting nothing was lost while
 * the alert is only shown because part of the sample WAS lost), the other
 * read `run.retiredCount` raw (rendering nothing at all — a blank — when it
 * was `null`, the exact null-as-zero failure mode this change exists to
 * remove). Handles all three shapes honestly: a positive count, a recorded
 * zero (an all-cancelled partial — `cancelledCount > 0`, `retiredCount ===
 * 0`), and an unrecorded (`null`/`undefined`, e.g. a pre-migration row)
 * count — the last two never state a figure we don't have.
 */
export function sampleIncompleteCopy(run: ScoringRunOut): string {
  const retired = run.retiredCount;
  if (retired != null && retired > 0) {
    return `${retired} of ${run.sampleSize} interactions could not be processed — this score covers only part of the intended sample.`;
  }
  if (retired === 0) {
    return `Some of this run's ${run.sampleSize} interactions could not be processed — this score covers only part of the intended sample.`;
  }
  return `Part of this run's ${run.sampleSize}-interaction sample could not be processed (the exact count was not recorded) — this score covers only part of the intended sample.`;
}

/** Honest no-applicable-profile copy: names the real cause (traces don't
 * carry the evidence these evaluators need) and the remedy's location,
 * without implying an inline control. Shared by ScoringRunResultPage and
 * ScorecardTab so the message is single-sourced. */
export const NO_APPLICABLE_PROFILE_COPY = {
  title: "No applicable profile",
  body:
    "No profile currently fits this agent well enough to score it — every dimension in this run came back not applicable. The agent's traces likely don't carry the evidence these evaluators need (retrieved context, a reference answer, or tool calls). Pin a profile whose evaluators match this agent, or instrument its traces to capture the missing evidence — from the agent's profile controls.",
} as const;

/** Copy for an agent whose bound profile version has no enabled checks.
 *  Lives beside NO_APPLICABLE_PROFILE_COPY so the agent detail and the agents
 *  list share one string. */
export const NO_ENABLED_CHECKS_COPY = {
  title: "Waiting for a scoring profile",
  body:
    "This agent's profile has no enabled checks, so there is nothing to score it against. " +
    "A profile is chosen automatically once the fit job runs — or pin one now from the agent's profile controls.",
  listChip: "No checks in profile",
  listTooltip:
    "This agent's profile has no enabled checks — it cannot be scored until a profile with checks is bound.",
  buttonReason: "This agent's profile has no enabled checks.",
} as const;

/**
 * True when this run scored nothing NEW — every eval that produced a result
 * copied a prior one (build plan W4-A). `newlyScoredCount === 0` alone would
 * also be true of a run that reused nothing AND scored nothing (a genuine
 * collapse, already covered by `collapsedRunCopy`), so this additionally
 * requires `reusedCount > 0` — there must have been something to reuse.
 * Both counters are nullable (pre-migration runs never populated them):
 * `run.newlyScoredCount === 0` is `false` for `null`/`undefined`, so a
 * pre-migration run renders no banner and no chip, never a false "0 newly
 * scored" (spec's tri-state rule, `run-format.ts:216-228`'s drift history).
 */
export function hasNoNewEvidence(run: ScoringRunOut): boolean {
  return run.newlyScoredCount === 0 && (run.reusedCount ?? 0) > 0;
}

// The two literals `finalize_run` writes to `exclusion_refused_reason`
// (store.py `EXCLUSION_REFUSED_BREAKER`/`EXCLUSION_REFUSED_CUMULATIVE`,
// D19/D48/D60) — mirrored here rather than imported, since the FE has no
// import path into the backend module.
export const EXCLUSION_REFUSED_BREAKER = "mass_exclusion_breaker";
export const EXCLUSION_REFUSED_CUMULATIVE = "cumulative_rate_high";

/**
 * Explains why this run's exclusion step did not behave normally (the
 * two safety breakers). `null` when `exclusionRefusedReason` is absent —
 * the overwhelming majority of runs, where exclusion (if any) applied
 * cleanly and needs no explanation.
 *
 * The two reasons need DIFFERENT titles, which is why this returns a title
 * alongside the body. Only the breaker refuses anything; the cumulative
 * signal is alarm-only and its exclusions were written (D60). A single
 * shared "Exclusion refused" heading over the cumulative body contradicted
 * itself inside one alert.
 *
 * `mass_exclusion_breaker`: more than half of this run's sampled
 * interactions would have been newly excluded, so nothing was written. Note
 * those interactions did NOT score — an interaction only becomes an
 * exclusion candidate by failing to hydrate after its attempts ran out. The
 * breaker's only effect is that the failure was not made durable.
 *
 * `cumulative_rate_high`: this run's exclusions WERE applied, and separately
 * the agent's running total of durable exclusions has crossed the threshold
 * against the candidates this run examined — worth a human look.
 */
export interface ExclusionRefusedCopy {
  title: string;
  body: string;
}

export function exclusionRefusedCopy(run: ScoringRunOut): ExclusionRefusedCopy | null {
  switch (run.exclusionRefusedReason) {
    case EXCLUSION_REFUSED_BREAKER:
      return {
        title: "Exclusion refused",
        body: "More than half of this run's sampled interactions would have been newly excluded, so the exclusion was refused — nothing was added to the exclusion list. Those traces failed to hydrate rather than scoring, and they will be attempted again on the next run. Investigate before then.",
      };
    case EXCLUSION_REFUSED_CUMULATIVE:
      return {
        title: "High cumulative exclusion rate",
        body: "This run's exclusions were applied. Separately, this agent's running total of durably excluded traces has crossed half the candidates this run examined — a rate high enough to warrant a look before it grows further.",
      };
    default:
      return null;
  }
}

/** No-new-evidence banner copy, single-sourced so `ScoringRunResultPage` and
 *  `ScorecardTab` render identical wording (this file's own comment at
 *  `:216-228`, above `sampleIncompleteCopy`, records what happens when two
 *  surfaces are left to author the same fact separately).
 *
 *  The body deliberately claims ONLY what `newlyScoredCount === 0` supports.
 *  An earlier wording said "every eval reused a prior result" and "no fresh
 *  pass over this agent's traces" — both false, because the two counters are
 *  not complements: `reusedCount` counts copied `scored` AND `skipped` rows,
 *  while `newlyScoredCount` counts only freshly-`scored` ones. A run that
 *  copies five results and then freshly hydrates three interactions whose
 *  evals all skip has `newlyScoredCount === 0` with a real fresh pass behind
 *  it. That is not a corner case: the non-reused candidates are by
 *  construction the traces closest to the freshness floor, which are exactly
 *  the ones likeliest to skip on input/output resolution. */
export const NO_NEW_EVIDENCE_COPY = {
  title: "No new evidence",
  body:
    "Nothing in this run was newly scored. Every result carrying a score was copied from an earlier run, so the composite rests on evidence already gathered rather than confirming it against new traces.",
} as const;

/** One reuse-count chip's rendered text, keyed for a stable React `key`. */
export interface ReuseCountChip {
  key: "reused" | "newly-scored";
  text: string;
}

/**
 * Null-safe chip text for the reuse counters (spec's tri-state rule). Each
 * counter renders independently of the other — a run mid-flight can carry
 * `reusedCount: 0` (stamped at creation) while `newlyScoredCount` is still
 * `null` (only stamped at finalize), and each must show only what it
 * actually has, exactly like the existing `retiredCount != null` guard
 * (`ScorecardTab.tsx:210`). Never `0 reused` / `0 newly scored` for a count
 * that was never recorded.
 */
export function reuseCountsCopy(run: ScoringRunOut): ReuseCountChip[] {
  const chips: ReuseCountChip[] = [];
  if (run.reusedCount != null) {
    chips.push({ key: "reused", text: `${run.reusedCount} reused` });
  }
  if (run.newlyScoredCount != null) {
    chips.push({ key: "newly-scored", text: `${run.newlyScoredCount} newly scored` });
  }
  return chips;
}

export function shipDecisionFromString(s: string): ShipDecision {
  switch (s) {
    case "ship":
    case "needs_work":
    case "dont_ship":
      return s;
    default:
      return "provisional";
  }
}

/** Human label from a slug: drop a leading "<dimension>." and de-snake
 * (mirrors `ScoringRunResultPage`'s `evalLabel`). */
export function evalLabel(slug: string): string {
  const tail = slug.includes(".") ? slug.slice(slug.indexOf(".") + 1) : slug;
  return tail.replace(/_/g, " ");
}
