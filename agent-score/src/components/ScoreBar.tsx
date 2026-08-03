import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import LinearProgress from "@mui/material/LinearProgress";
import Tooltip from "@mui/material/Tooltip";
import type { DimensionScore } from "../types";

interface Props {
  label: string;
  dimension: DimensionScore | null;
  compact?: boolean;
}

function scoreColor(score: number): "success" | "warning" | "error" {
  if (score >= 75) return "success";
  if (score >= 55) return "warning";
  return "error";
}

// Human-readable question shown below each bar
export const DIMENSION_QUESTION: Record<string, string> = {
  Correctness:            "Did the agent complete the task correctly?",
  Efficiency:             "Did it stay within cost budget?",
  Relevance:              "Was it fast and reliable enough for the end user?",
  Safety:                 "Did the output stay grounded in the context it was given?",
  Consistency:            "Does it produce consistent answers across semantically equivalent inputs?",
  "Tool Use":             "Did it choose tools efficiently and recover from failures?",
  Groundedness:           "Did the agent's output reflect only what it was given?",
  "Instruction Following":"Did it follow the instructions it was given?",
  Transparency:           "Did it explain its reasoning clearly?",
  Robustness:             "Did it hold up under adversarial or noisy inputs?",
  Communication:          "Was the output clear and appropriate for the audience?",
};

// Short label for each raw metric key, shown in the hover tooltip
export const SIG_LABEL: Record<string, string> = {
  task_success:                 "Task Success",
  completion_rate:              "Completion Rate",
  prompt_compliance:            "Prompt Compliance",
  value_cost_ratio:             "Value / Cost Ratio",
  p95_tail_cost:                "P95 Tail Cost",
  latency_score:                "Latency Score",
  error_rate_score:             "Error Rate Score",
  abandonment_score:            "Abandonment Score",
  context_grounding:            "Context Grounding",
  spec_adherence:               "Spec Adherence",
  hallucination_rate:           "Hallucination Rate",
  cross_variant_consistency:    "Cross-Variant Consistency",
  noise_robustness:             "Noise Robustness",
  format_consistency:           "Format Consistency",
  tool_selection_accuracy:      "Tool Selection Accuracy",
  planning_efficiency:          "Planning Efficiency",
  avg_tool_calls_to_resolution: "Avg Tool Calls / Resolution",
};

function sigsTooltip(sigs: string[]) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
      {sigs.map((sig) => {
        const colonIdx = sig.indexOf(": ");
        const key = colonIdx >= 0 ? sig.slice(0, colonIdx) : sig;
        const val = colonIdx >= 0 ? sig.slice(colonIdx + 2) : "";
        const label = SIG_LABEL[key] ?? key;
        return (
          <Box key={sig} sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.65)" }}>{label}</Typography>
            <Typography variant="caption" sx={{ fontWeight: 700, fontFamily: "monospace", color: "#fff" }}>{val}</Typography>
          </Box>
        );
      })}
    </Box>
  );
}

function labelTooltip(label: string, sigs: string[]) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, maxWidth: 220 }}>
      <Typography variant="caption" sx={{ color: "#fff", display: "block", mb: sigs.length > 0 ? 0.5 : 0 }}>
        {DIMENSION_QUESTION[label] ?? label}
      </Typography>
      {sigs.length > 0 && sigsTooltip(sigs)}
    </Box>
  );
}

export default function ScoreBar({ label, dimension, compact = false }: Props) {
  if (!dimension) {
    return (
      <Box sx={{ mb: compact ? 1 : 1.5 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
          <Tooltip title={DIMENSION_QUESTION[label] ?? label} arrow placement="top">
            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 500, cursor: "help" }}>
              {label}
            </Typography>
          </Tooltip>
          <Typography variant="caption" sx={{ color: "text.disabled" }}>
            N/A
          </Typography>
        </Box>
        {!compact && DIMENSION_QUESTION[label] && (
          <Typography variant="caption" sx={{ display: "block", color: "text.disabled", fontSize: "0.7rem", mb: 0.5 }}>
            {DIMENSION_QUESTION[label]}
          </Typography>
        )}
        <LinearProgress variant="determinate" value={0} sx={{ height: 6, borderRadius: 3, opacity: 0.3 }} />
      </Box>
    );
  }

  const color = scoreColor(dimension.score);
  const hasSigs = dimension.sigs.length > 0;

  return (
    <Box sx={{ mb: compact ? 1 : 1.5 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
        <Tooltip title={labelTooltip(label, dimension.sigs)} arrow placement="top">
          <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 500, cursor: "help", width: "fit-content" }}>
            {label}
          </Typography>
        </Tooltip>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {dimension.rawDeltaPct !== undefined && (
            <Typography
              variant="caption"
              sx={{ color: dimension.rawDeltaPct >= 0 ? "success.main" : "error.main", fontWeight: 500 }}
            >
              {dimension.rawDeltaPct >= 0 ? "+" : ""}{dimension.rawDeltaPct}%
            </Typography>
          )}
          <Typography variant="caption" sx={{ fontWeight: 700, color: `${color}.main` }}>
            {dimension.score}
          </Typography>
        </Box>
      </Box>
      {!compact && DIMENSION_QUESTION[label] && (
        <Typography variant="caption" sx={{ display: "block", color: "text.disabled", fontSize: "0.7rem", mb: 0.5 }}>
          {DIMENSION_QUESTION[label]}
        </Typography>
      )}
      <LinearProgress
        variant="determinate"
        value={dimension.score}
        color={color}
        sx={{ height: compact ? 5 : 7, borderRadius: 4 }}
      />
      {!compact && hasSigs && (
        <Typography
          variant="caption"
          sx={{
            mt: 0.5,
            display: "block",
            color: "text.disabled",
            fontSize: "0.65rem",
            width: "fit-content",
          }}
        >
          {dimension.sigs.slice(0, 2).map((sig) => {
            const colonIdx = sig.indexOf(": ");
            const key = colonIdx >= 0 ? sig.slice(0, colonIdx) : sig;
            const val = colonIdx >= 0 ? sig.slice(colonIdx + 2) : "";
            return `${SIG_LABEL[key] ?? key}: ${val}`;
          }).join(" · ")}
        </Typography>
      )}
    </Box>
  );
}
