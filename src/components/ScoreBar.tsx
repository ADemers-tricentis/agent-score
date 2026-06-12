import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import LinearProgress from "@mui/material/LinearProgress";
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

export default function ScoreBar({ label, dimension, compact = false }: Props) {
  if (!dimension) {
    return (
      <Box sx={{ mb: compact ? 1 : 1.5 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
          <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 500 }}>
            {label}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.disabled" }}>
            N/A
          </Typography>
        </Box>
        <LinearProgress variant="determinate" value={0} sx={{ height: 6, borderRadius: 3, opacity: 0.3 }} />
      </Box>
    );
  }

  const color = scoreColor(dimension.score);

  return (
    <Box sx={{ mb: compact ? 1 : 1.5 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
        <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 500 }}>
          {label}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {dimension.rawDeltaPct !== undefined && (
            <Typography
              variant="caption"
              sx={{
                color: dimension.rawDeltaPct >= 0 ? "success.main" : "error.main",
                fontWeight: 500,
              }}
            >
              {dimension.rawDeltaPct >= 0 ? "+" : ""}
              {dimension.rawDeltaPct}%
            </Typography>
          )}
          <Typography variant="caption" sx={{ fontWeight: 700, color: `${color}.main` }}>
            {dimension.score}
          </Typography>
        </Box>
      </Box>
      <LinearProgress
        variant="determinate"
        value={dimension.score}
        color={color}
        sx={{ height: compact ? 5 : 7, borderRadius: 4 }}
      />
      {!compact && dimension.sigs.length > 0 && (
        <Box sx={{ mt: 0.5, display: "flex", flexWrap: "wrap", gap: 0.5 }}>
          {dimension.sigs.map((sig) => (
            <Typography key={sig} variant="caption" sx={{ color: "text.disabled", fontSize: "0.65rem" }}>
              {sig}
            </Typography>
          ))}
        </Box>
      )}
    </Box>
  );
}
