import type { ShowcaseCategory, Session, RootCause, SafetySignal } from "../types";

// Plain-language labels for the internal root-cause slugs shown in
// Attribution panels, reports, and metrics breakdowns.
export const ROOT_CAUSE_LABEL: Record<RootCause, string> = {
  credential_exposure: "Leaked a credential or secret",
  hallucinated_state: "Acted on made-up information",
  tool_selection_error: "Picked the wrong tool for the job",
  pii_exposure: "Exposed personal data",
};

// Plain-language labels for safety override signals.
export const SAFETY_SIGNAL_LABEL: Record<SafetySignal, string> = {
  prompt_injection_detected: "Prompt injection detected",
  credential_exposure: "Leaked a credential or secret",
  pii_leak: "Exposed personal data",
  path_violation: "Accessed files outside its allowed scope",
};

// Canonical dimension order, most heavily weighted first — mirrors
// sessionCompositeScore's weighting and the order used across score views.
export const DIMENSION_ORDER: ShowcaseCategory[] = [
  "Correctness",
  "Efficiency",
  "Relevance",
  "Safety",
  "Consistency",
  "Tool Use",
  "Groundedness",
  "Instruction Following",
  "Transparency",
  "Robustness",
  "Communication",
];

export const DIMENSION_KEY_MAP: Record<ShowcaseCategory, keyof Session["scores"]> = {
  Correctness: "benchmarkPerformance",
  Efficiency: "valueEfficiency",
  Relevance: "uxSignal",
  Safety: "harmony",
  Consistency: "stability",
  "Tool Use": "agency",
  Groundedness: "groundedness",
  "Instruction Following": "instructionFollowing",
  Transparency: "transparency",
  Robustness: "robustness",
  Communication: "communication",
};

const DOT_COLORS = ["#6366f1", "#0ea5e9", "#14b8a6", "#8b5cf6", "#ec4899", "#f59e0b", "#22c55e", "#ef4444", "#06b6d4", "#a855f7", "#84cc16"];

export const DIMENSION_DOT_COLOR: Record<ShowcaseCategory, string> = DIMENSION_ORDER.reduce(
  (acc, dim, i) => ({ ...acc, [dim]: DOT_COLORS[i % DOT_COLORS.length] }),
  {} as Record<ShowcaseCategory, string>,
);

// Average score (0-100) for a dimension across a set of sessions, or null if
// none of the sessions have that dimension scored.
export function averageDimensionScore(dimension: ShowcaseCategory, sessions: Session[]): number | null {
  const key = DIMENSION_KEY_MAP[dimension];
  const scores = sessions.map((s) => s.scores[key]?.score).filter((v): v is number => v != null);
  if (scores.length === 0) return null;
  return scores.reduce((sum, v) => sum + v, 0) / scores.length;
}
