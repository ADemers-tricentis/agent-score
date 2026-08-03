import type { DimensionKey } from "../types";

// Canonical dimension order, most heavily weighted first.
export const DIMENSION_ORDER: DimensionKey[] = [
  "benchmarkPerformance",
  "valueEfficiency",
  "uxSignal",
  "harmony",
  "stability",
  "agency",
  "groundedness",
  "instructionFollowing",
  "transparency",
  "robustness",
  "communication",
];

// Plain-language display name shown inline in the primary UI (REQ-072) —
// never show the DimensionKey code name or raw eval slug inline.
export const DIMENSION_LABEL: Record<DimensionKey, string> = {
  benchmarkPerformance: "Correctness",
  valueEfficiency: "Efficiency",
  uxSignal: "Relevance",
  harmony: "Safety",
  stability: "Consistency",
  agency: "Tool Use",
  groundedness: "Groundedness",
  instructionFollowing: "Instruction Following",
  transparency: "Transparency",
  robustness: "Robustness",
  communication: "Communication",
};

// Plain-language question shown in the hover tooltip, under the label.
export const DIMENSION_QUESTION: Record<DimensionKey, string> = {
  benchmarkPerformance: "Did the agent complete the task correctly?",
  valueEfficiency: "Did it stay within cost budget?",
  uxSignal: "Was it fast and reliable enough for the end user?",
  harmony: "Did the output stay grounded in the context it was given?",
  stability: "Does it produce consistent answers across equivalent inputs?",
  agency: "Did it choose tools efficiently and recover from failures?",
  groundedness: "Did the agent's output reflect only what it was given?",
  instructionFollowing: "Did it follow the instructions it was given?",
  transparency: "Did it explain its reasoning clearly?",
  robustness: "Did it hold up under adversarial or noisy inputs?",
  communication: "Was the output clear and appropriate for the audience?",
};

// Short label for each raw eval signal key — technical detail, only ever
// shown inside the hover tooltip, never inline.
export const SIG_LABEL: Record<string, string> = {
  task_success: "Task Success",
  completion_rate: "Completion Rate",
  prompt_compliance: "Prompt Compliance",
  value_cost_ratio: "Value / Cost Ratio",
  p95_tail_cost: "P95 Tail Cost",
  latency_score: "Latency Score",
  error_rate_score: "Error Rate Score",
  abandonment_score: "Abandonment Score",
  context_grounding: "Context Grounding",
  spec_adherence: "Spec Adherence",
  hallucination_rate: "Hallucination Rate",
  cross_variant_consistency: "Cross-Variant Consistency",
  noise_robustness: "Noise Robustness",
  format_consistency: "Format Consistency",
  tool_selection_accuracy: "Tool Selection Accuracy",
  planning_efficiency: "Planning Efficiency",
  avg_tool_calls_to_resolution: "Avg Tool Calls / Resolution",
};

/** Splits a raw sig string like "task_success: 0.92" into a plain-language label + value. */
export function parseSig(sig: string): { label: string; value: string } {
  const colonIdx = sig.indexOf(": ");
  const key = colonIdx >= 0 ? sig.slice(0, colonIdx) : sig;
  const value = colonIdx >= 0 ? sig.slice(colonIdx + 2) : "";
  return { label: SIG_LABEL[key] ?? key, value };
}
