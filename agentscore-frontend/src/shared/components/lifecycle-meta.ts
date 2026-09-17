/** The agent lifecycle vocabulary — one derived stage, two audiences.
 *
 * The stage itself is computed once on the server and recomputed there per
 * audience; this file owns only the WORDS + the tint/animation derived from
 * them. That split is deliberate: a renderer that decided its own precedence
 * would have to duplicate the server's ordering rules in TSX, and the two
 * would drift.
 *
 * Both apps read this. The back-office and the customer app deliberately
 * say different things about the same stage — "Awaiting fit" is an operator
 * sentence and would mean nothing to a customer — but they must never
 * disagree about WHICH stage an agent is in, which is why the copy is two
 * lookup tables over one input rather than two components.
 *
 * Split out of `lifecycle-chip.tsx` (`span-type-icon.tsx` / `span-type-meta.ts`
 * is the precedent) so the chip component's file exports nothing but
 * `LifecycleChip` — a file mixing a component with plain functions/constants
 * defeats React Fast Refresh (`react-refresh/only-export-components`).
 */

import type { components } from "@/shared/api/generated";

type OperatorLifecycle = components["schemas"]["AgentLifecycleOut"];
type CustomerLifecycle = components["schemas"]["CustomerAgentLifecycle"];

/** The shape both wire models share. The customer one is the operator one
 *  with a narrower `reason` union, so the wider type accepts either. */
export type Lifecycle = OperatorLifecycle | CustomerLifecycle;

type Stage = Lifecycle["stage"];
type Reason = NonNullable<OperatorLifecycle["reason"]>;

export type LifecycleTint = "muted" | "info" | "success" | "warning";
type Tint = LifecycleTint;

/** `info` for anything in motion or on its way, `success` only for done,
 *  `warning` only for something a human may need to act on. `muted` is for
 *  states that are true but uninformative. */
const STAGE_TINT: Record<Stage, Tint> = {
  connecting: "muted",
  collecting: "info",
  awaiting_fit: "info",
  fitting: "info",
  ready: "muted",
  scoring: "info",
  up_to_date: "success",
  needs_attention: "warning",
};

/** The two stages where work is actually executing right now. They get the
 *  pulsing dot — the thing a reader most needs to see, and the whole reason
 *  the list stopped reading "not scored" during a live run. */
const ANIMATED: ReadonlySet<Stage> = new Set<Stage>(["scoring", "fitting"]);

const OPERATOR_STAGE: Record<Stage, string> = {
  connecting: "Connecting",
  collecting: "Collecting traces",
  awaiting_fit: "Awaiting fit",
  fitting: "Fitting…",
  ready: "Ready to score",
  scoring: "Scoring…",
  up_to_date: "Up to date",
  needs_attention: "Needs attention",
};

/** `collecting`, `awaiting_fit` and `fitting` collapse to one customer
 *  sentence on purpose. The difference between them is whether we are waiting
 *  on traffic or on the fitter, which is an internal distinction; all three
 *  mean "a scoring profile is coming, automatically, without you doing
 *  anything". */
const CUSTOMER_STAGE: Record<Stage, string> = {
  connecting: "Setting up",
  collecting: "Learning your agent",
  awaiting_fit: "Building the scorecard",
  fitting: "Building the scorecard",
  ready: "Ready for its first score",
  scoring: "Scoring now…",
  up_to_date: "Scored",
  needs_attention: "Needs attention",
};

const OPERATOR_REASON: Record<Reason, string> = {
  no_enabled_checks: "bound profile has no enabled checks",
  no_applicable_profile: "refit cap reached, no applicable profile",
  profile_archived: "bound profile version is archived",
  run_produced_nothing: "last run finished without a score",
  // Distinct from `run_produced_nothing` above because the remedy is
  // opposite: that one clears itself once more traffic arrives, this one never
  // does without someone acting on the profile.
  no_population_checks: "no check in this profile scores live traffic",
  fit_failed: "last fit job failed",
  profile_quality: "profile quality",
  provision_failed: "provisioning failed",
};

/** Customer wording for the five reasons a customer may see. The two
 *  operator-only reasons are absent because the server cannot put them on a
 *  customer payload — the narrow reason union makes them unrepresentable, not
 *  merely filtered — so there is nothing here to fall back to. */
const CUSTOMER_REASON: Record<
  NonNullable<CustomerLifecycle["reason"]>,
  string
> = {
  no_enabled_checks: "no scoring profile",
  no_applicable_profile: "no scoring profile fits yet",
  profile_archived: "scoring profile withdrawn",
  run_produced_nothing: "last scoring run found nothing to score",
  no_population_checks: "this profile needs example answers to score",
  fit_failed: "could not build a scorecard",
};

/** Operator-only tooltip text, keyed by stage — the definition shown on hover
 *  in `LifecycleChip`. Customers never see a tooltip (the sentence itself is
 *  already all they get), so there is no customer table here. */
export const OPERATOR_TOOLTIP: Record<Stage, string> = {
  connecting: "Not active yet, or no traces captured.",
  collecting: "Traces are arriving; still under the readiness threshold.",
  awaiting_fit: "Enough traces, no fit running, still unbound.",
  fitting: "A fit job is in flight.",
  ready: "Bound to a profile, never scored.",
  scoring: "A scoring run is in flight.",
  up_to_date: "Bound and scored.",
  needs_attention: "Something needs an operator's attention.",
};

/** The stage words alone, with no reason and no counter appended.
 *
 * Exported because the customer card grid lays the three parts out separately
 * — stage, reason and progress each get their own place — where the chip
 * concatenates them into one string. Both read the same tables, so the two
 * surfaces cannot disagree about the words.
 */
export function lifecycleStageLabel(
  lifecycle: Lifecycle,
  voice: "operator" | "customer",
): string {
  return (voice === "operator" ? OPERATOR_STAGE : CUSTOMER_STAGE)[lifecycle.stage];
}

/** The reason clause alone, or `null` when the stage carries none.
 *
 * Returns `null` rather than the stage for an unrecognised reason from a newer
 * server, so a caller renders the stage by itself instead of the word
 * "undefined" — the same fallback the chip makes, expressed as absence.
 */
export function lifecycleReasonLabel(
  lifecycle: Lifecycle,
  voice: "operator" | "customer",
): string | null {
  if (!lifecycle.reason) return null;
  const reasons: Record<string, string> =
    voice === "operator" ? OPERATOR_REASON : CUSTOMER_REASON;
  return reasons[lifecycle.reason] ?? null;
}

/** The stage's tint, for a caller rendering the state as something other than
 *  a chip (the card grid's status dot and callout). */
export function lifecycleTint(lifecycle: Lifecycle): Tint {
  return STAGE_TINT[lifecycle.stage];
}

/** Whether this stage is work executing right now — the pulsing states. */
export function lifecycleIsAnimated(lifecycle: Lifecycle): boolean {
  return ANIMATED.has(lifecycle.stage);
}

/** The one place a lifecycle tint becomes a colour token. `AgentCard`'s
 *  status dot and `AgentCardStatus`'s progress bar both read this map, so
 *  the dot and the callout can never disagree. */
export const LIFECYCLE_COLOR: Record<LifecycleTint, string> = {
  muted: "text.disabled",
  info: "primary.main",
  success: "success.main",
  warning: "warning.main",
};
