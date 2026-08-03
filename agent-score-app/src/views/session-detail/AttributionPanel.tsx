import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import type { Attribution } from "../../types";

/**
 * Attribution/root-cause panel for a non-PASS session (only rendered when
 * `session.attribution` is present). This is the "why" half of the core
 * "is my agent good, and why" story.
 */
export default function AttributionPanel({ attribution }: { attribution: Attribution }) {
  return (
    <Paper sx={{ p: 2.5, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
        Why did this happen?
      </Typography>

      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 4, flexWrap: "wrap", mb: 2.5 }}>
        <Box>
          <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 600, display: "block" }}>
            ROOT CAUSE
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            {attribution.rootCause}
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 600, display: "block" }}>
            CONFIDENCE
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            {attribution.confidence}%
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 600, display: "block", mb: 0.5 }}>
            AGENT FAULT
          </Typography>
          <Chip
            label={attribution.agentFault ? "Yes" : "No"}
            size="small"
            color={attribution.agentFault ? "error" : "default"}
            variant={attribution.agentFault ? "filled" : "outlined"}
          />
        </Box>
      </Box>

      <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 600, display: "block", mb: 1 }}>
        ATTRIBUTION CHAIN
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 2.5 }}>
        {attribution.chain.map((step, i) => (
          <Box
            key={i}
            sx={{
              p: 1.5,
              borderRadius: 1.5,
              border: "1px solid",
              borderColor: step.isCulprit ? "error.main" : "divider",
              bgcolor: step.isCulprit ? "rgba(var(--mui-palette-error-mainChannel) / 0.08)" : "transparent",
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600, color: step.isCulprit ? "error.main" : "text.primary" }}>
              {step.step}
              {step.isCulprit && (
                <Typography component="span" variant="caption" sx={{ color: "error.main", fontWeight: 700, ml: 1 }}>
                  ROOT CAUSE
                </Typography>
              )}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {step.detail}
            </Typography>
          </Box>
        ))}
      </Box>

      <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 600, display: "block", mb: 1 }}>
        RECOMMENDATIONS
      </Typography>
      <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
        {attribution.recommendations.map((rec, i) => (
          <Typography component="li" variant="body2" key={i} sx={{ mb: 0.5, color: "text.secondary" }}>
            {rec}
          </Typography>
        ))}
      </Box>
    </Paper>
  );
}
