import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import LinearProgress from "@mui/material/LinearProgress";
import Tooltip from "@mui/material/Tooltip";
import type { DimensionKey, DimensionScore } from "../../types";
import { DIMENSION_LABEL, DIMENSION_QUESTION, parseSig } from "../../data/dimensionLabels";

function scoreColor(score: number): "success" | "warning" | "error" {
  if (score >= 75) return "success";
  if (score >= 55) return "warning";
  return "error";
}

function tooltipContent(dimension: DimensionKey, sigs: string[]) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, maxWidth: 240 }}>
      <Typography variant="caption" sx={{ color: "#fff", display: "block", mb: sigs.length > 0 ? 0.5 : 0 }}>
        {DIMENSION_QUESTION[dimension]}
      </Typography>
      {sigs.length > 0 && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          {sigs.map((sig) => {
            const { label, value } = parseSig(sig);
            return (
              <Box key={sig} sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.65)" }}>
                  {label}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, fontFamily: "monospace", color: "#fff" }}>
                  {value}
                </Typography>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}

/**
 * Plain-language dimension score bar (REQ-072). Always shows the display
 * name inline; the underlying eval sig values only ever appear in the hover
 * tooltip, never inline.
 */
export default function DimensionScoreBar({
  dimension,
  data,
  compact = false,
}: {
  dimension: DimensionKey;
  data: DimensionScore | null | undefined;
  compact?: boolean;
}) {
  const label = DIMENSION_LABEL[dimension];

  if (!data) {
    return (
      <Box sx={{ mb: compact ? 1 : 1.5 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
          <Tooltip title={DIMENSION_QUESTION[dimension]} arrow placement="top">
            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 500, cursor: "help" }}>
              {label}
            </Typography>
          </Tooltip>
          <Typography variant="caption" sx={{ color: "text.disabled" }}>
            N/A
          </Typography>
        </Box>
        <LinearProgress variant="determinate" value={0} sx={{ height: 6, borderRadius: 3, opacity: 0.3 }} />
      </Box>
    );
  }

  const color = scoreColor(data.score);

  return (
    <Box sx={{ mb: compact ? 1 : 1.5 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
        <Tooltip title={tooltipContent(dimension, data.sigs)} arrow placement="top">
          <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 500, cursor: "help", width: "fit-content" }}>
            {label}
          </Typography>
        </Tooltip>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {data.rawDeltaPct !== undefined && (
            <Typography variant="caption" sx={{ color: data.rawDeltaPct >= 0 ? "success.main" : "error.main", fontWeight: 500 }}>
              {data.rawDeltaPct >= 0 ? "+" : ""}
              {data.rawDeltaPct}%
            </Typography>
          )}
          <Typography variant="caption" sx={{ fontWeight: 700, color: `${color}.main` }}>
            {data.score}
          </Typography>
        </Box>
      </Box>
      <LinearProgress variant="determinate" value={data.score} color={color} sx={{ height: compact ? 5 : 7, borderRadius: 4 }} />
    </Box>
  );
}
