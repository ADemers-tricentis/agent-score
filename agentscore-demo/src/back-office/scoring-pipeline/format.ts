/** Scoring-pipeline display formatters — kept local to this slice so the
 * dashboard/settings tiles and their unit tests share one vocabulary
 * (mirrors `back-office/ingestion/format.ts`).
 */

/** Compact integer with thousands separators (e.g. 12,405). */
export function fmtCount(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString();
}

/** A rate metric (e.g. tasks/min) — one decimal below 100, whole above. */
export function fmtRate(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return value >= 100 ? Math.round(value).toLocaleString() : value.toFixed(1);
}

/** An already-0-100 percentage — one decimal. Its only caller is `fmtFraction`
 *  below; the token-budget tile that used it directly went with the rate
 *  governor, so no example is cited rather than citing one that no longer
 *  exists. */
export function fmtPct(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `${value.toFixed(1)}%`;
}

/** A 0–1 fraction (e.g. `fallbackRate`/`disagreementRate`/`avgConfidence`/a
 *  fit decision's `confidence`) rendered as a one-decimal percentage —
 *  shared by `FitHealthStrip` and the fit-visibility fleet feed/queue so a
 *  fraction never silently reads as "82" instead of "82.0%" (fit-visibility
 *  spec §3.1 R6). */
export function fmtFraction(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return fmtPct(value * 100);
}

/** Absolute short timestamp for provenance rows. */
export function fmtTimestamp(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Single-largest-unit compact duration (e.g. "22s", "4m", "6h", "2d") —
 *  mirrors the console mock's Age / lease / backoff columns (slice S9b). */
function fmtCompactSeconds(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

/** Compact age from an ISO timestamp to now (e.g. task/run `createdAt`). */
export function fmtAge(iso: string | null | undefined): string {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms)) return "—";
  return fmtCompactSeconds(ms / 1000);
}

/** Compact duration from a raw seconds count (workers' oldest-queued-age,
 *  lease/backoff countdowns). */
export function fmtAgeSeconds(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined) return "—";
  return fmtCompactSeconds(seconds);
}

/** Compact duration from a raw milliseconds count (`fit_health.timeInSystemMs`
 *  p50/p95 — fit-visibility spec §3.1 R6). Null when the window has no
 *  `done` fit-jobs rows yet, not "0s". */
export function fmtDurationMs(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) return "—";
  return fmtCompactSeconds(ms / 1000);
}

/** `scoring_tasks.state` / `scoring_runs.state` → `StatusDot` tone (spec
 *  §3.3 — shared by the Queue and Runs tabs so the same state reads the same
 *  color everywhere in the console). */
export function scoringStateTone(
  state: string,
): "success" | "warning" | "destructive" | "muted" | "info" {
  switch (state) {
    case "done":
    case "complete":
      return "success";
    case "claimed":
    case "partial":
      return "warning";
    case "running":
      return "info";
    case "failed":
    case "dead":
      return "destructive";
    case "cancelled":
      return "muted";
    default:
      return "muted";
  }
}

/** `fit_jobs.state` → `StatusDot` tone (fit-visibility spec §3.1 R1) — the
 *  fit-job queue's own state set (`pending/running/done/failed/superseded`)
 *  is distinct from `scoring_tasks.state`, so it gets its own mapping rather
 *  than overloading `scoringStateTone`'s switch with unrelated cases. */
export function fitJobStateTone(
  state: string,
): "success" | "warning" | "destructive" | "muted" | "info" {
  switch (state) {
    case "done":
      return "success";
    case "running":
      return "info";
    case "failed":
      return "destructive";
    case "pending":
    case "superseded":
      return "muted";
    default:
      return "muted";
  }
}

/** `fit_method` enum label — shared by `FitHealthStrip`'s method-mix tiles
 *  and the fleet fit-decision feed's Method column (fit-visibility spec
 *  §3.1 R6, "Fleet fit-decision activity feed"). */
export const FIT_METHOD_LABELS: Record<string, string> = {
  llm: "LLM",
  heuristic: "Heuristic",
};

/** `fit_decisions.outcome` enum label — shared by `FitHealthStrip`'s
 *  outcome-rate tiles and the fleet feed's Outcome column. */
export const FIT_OUTCOME_LABELS: Record<string, string> = {
  adopted: "Adopted",
  no_change: "No change",
  fallback: "Fallback",
  superseded: "Superseded",
};

/** `fit_decisions.fallback_reason` enum label (spec `llm-profile-fit-s5`
 *  §4.3; reused by `fit-visibility`'s fleet feed + `FitHealthStrip`'s
 *  by-reason breakdown) — one wording everywhere a fallback reason renders. */
export const FALLBACK_REASON_LABELS: Record<string, string> = {
  llm_error: "LLM error",
  parse_invalid: "Parse invalid",
  refusal: "Refusal",
  low_confidence: "Low confidence",
  token_cap: "Token cap",
};

/** Null-safe single `fallback_reason` label — "—" when the decision didn't
 *  fall back (the fleet feed's per-row Fallback-reason column). */
export function fmtFallbackReason(reason: string | null | undefined): string {
  if (!reason) return "—";
  return FALLBACK_REASON_LABELS[reason] ?? reason;
}

/** `fit_decisions.fallback_class` enum label ("bug" vs "expected" —
 *  fallback-fallback-visibility spec §5A) — the API classifies each fallback
 *  so the fleet feed and `FitHealthStrip` can render one wording everywhere
 *  a fallback class renders. */
export const FALLBACK_CLASS_LABELS: Record<"bug" | "expected", string> = {
  bug: "BUG-class",
  expected: "Expected",
};

/** `fallback_class` → `Chip` tint — "bug" reads as an incident (destructive),
 *  "expected" as a known/accepted path (warning), anything else (null/
 *  undefined/unrecognized) as muted rather than guessing. The class itself
 *  is API-provided; this only maps an already-classified string to a tint. */
export function fallbackClassTint(
  cls: string | null | undefined,
): "destructive" | "warning" | "muted" {
  switch (cls) {
    case "bug":
      return "destructive";
    case "expected":
      return "warning";
    default:
      return "muted";
  }
}

/** `fit_jobs.trigger` / `fit_decisions.trigger` facet options (spec §10
 *  glossary) — shared by the fit-jobs queue and the fleet fit-decision feed
 *  filter bars so the values + wording can't drift between the two. */
export const FIT_TRIGGER_OPTIONS = [
  { value: "first_run", label: "first run" },
  { value: "shape_change", label: "shape change" },
  { value: "zero_score", label: "zero score" },
  { value: "manual", label: "manual" },
  { value: "evidence_diversified", label: "evidence diversified" },
  { value: "low_confidence_refit", label: "low confidence refit" },
];

export type DiscriminationTint =
  | "info"
  | "warning"
  | "destructive"
  | "muted"
  | "outline";

/** `profile_discrimination.verdict` (the six pooled states, spec
 *  §3.1/§4.5) → chip word + tint. Shared by the agent Profile tab's
 *  discrimination block and the Eval Catalog profile card so one verdict can
 *  never look like two different things; only the chip is shared, each
 *  surface owns its own explanatory copy.
 *
 *  `discriminating` deliberately avoids `success` (spec §4.6): a green
 *  "validated" badge would overclaim what is a judge-relative separation, not
 *  a green light. `inverted` gets `destructive`, distinct from
 *  `not_discriminating`'s `warning`, because "scores run backwards" is a
 *  different and worse problem than "doesn't separate classes".
 *
 *  Keyed by `string`, not the generated verdict union, so a verdict this
 *  build has never heard of misses the lookup and yields `undefined` — each
 *  call site then decides what an unrecognized verdict looks like (the
 *  catalog card renders no chip; the agent tab labels it as unrecognized).
 *  Never default it here: an unknown verdict must not silently read as a
 *  benign, understood one. */
export const DISCRIMINATION_VERDICT_CHIP: Record<
  string,
  { label: string; tint: DiscriminationTint }
> = {
  discriminating: { label: "Discriminating", tint: "info" },
  not_discriminating: { label: "Not discriminating", tint: "warning" },
  inverted: { label: "Inverted", tint: "destructive" },
  degenerate: { label: "Degenerate", tint: "outline" },
  inconclusive: { label: "Inconclusive", tint: "muted" },
  insufficient_evidence: { label: "Insufficient evidence", tint: "muted" },
};
