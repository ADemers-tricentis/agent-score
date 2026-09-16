import type { components } from "@/shared/api/generated";

/**
 * The four-member provisional-reason set. Defined once on the backend
 * (`ProvisionalReason` in `api/admin/schemas/scoring.py`) and surfaced under
 * two different field casings by codegen: the customer schema's
 * `provisional_reasons` (snake_case) and the admin schema's
 * `provisionalReasons` (camelCase). Derived from the customer side here —
 * `ProvisionalReasonSetsMatch` below is the compatibility check that keeps
 * the admin side honest.
 */
export type ProvisionalReason =
  components["schemas"]["CustomerScoreSummary"]["provisional_reasons"][number];

/**
 * Type-level assertion, not a runtime check: resolves to `true` only when
 * the admin schema's `ScoringRunOut.provisionalReasons` element type is
 * exactly `ProvisionalReason`, in both directions. If a future backend
 * change adds a reason to one generated union without the other, this
 * resolves to `never` and the assignment below fails `tsc` — the two
 * casings are meant to be the same server-side `Literal` and must not
 * silently split.
 */
type AdminProvisionalReason = NonNullable<
  components["schemas"]["ScoringRunOut"]["provisionalReasons"]
>[number];
export type ProvisionalReasonSetsMatch =
  AdminProvisionalReason extends ProvisionalReason
    ? ProvisionalReason extends AdminProvisionalReason
      ? true
      : never
    : never;
export const provisionalReasonSetsMatch: ProvisionalReasonSetsMatch = true;

// ---------------------------------------------------------------------------
// Provisional-reason copy (spec §3.1 Feature 1). The reconstruction is
// lossy by design — `cancelled_count` is deliberately never persisted, so
// every unreconstructable cause is labelled `sample_incomplete` — and the
// copy is written to be true of that too, not just of a literally-short
// sample.
// ---------------------------------------------------------------------------

export const PROVISIONAL_REASON_COPY: Record<ProvisionalReason, string> = {
  insufficient_sample: "not enough interactions have been scored yet",
  high_failure_rate: "too many evaluations failed to produce a confident verdict",
  sample_incomplete: "the sample was incomplete",
  // The coverage feature's own copy, authored on main by its owner — kept over
  // the placeholder this branch carried. Note for a future editor: the
  // server's trigger is `coverage_weight_scored <= COVERAGE_FLOOR` (0.5), a
  // *weight* fraction, not a count of evaluations, so do not sharpen this
  // into a specific fraction of the evaluation count.
  low_coverage: "too few of the profile's evaluations produced a score",
};
