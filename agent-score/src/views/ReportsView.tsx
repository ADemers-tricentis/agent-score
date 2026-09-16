import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import type { PreviewRole } from "../types";
import { reportsSummary } from "../data/mock";

interface Props {
  tenantId: string;
  previewRole: PreviewRole;
}

export default function ReportsView({ tenantId, previewRole }: Props) {
  const summary = reportsSummary(tenantId);

  const usageTiles = [
    { label: "ACTIVE AGENTS", value: summary.activeAgents },
    { label: "TRACES", value: summary.traces },
    { label: "EVAL RESULTS", value: summary.evalResults },
    { label: "AGENT CARDS", value: summary.agentCards },
  ];

  return (
    <Box sx={{ p: 3, maxWidth: 1000 }}>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>Reports</Typography>
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
        Usage and cost across agents for this tenant
      </Typography>

      {/* Usage section - always visible */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2, mb: 4 }}>
        {usageTiles.map((tile) => (
          <Paper key={tile.label} sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
            <Typography variant="overline" sx={{ color: "text.disabled", fontSize: "0.62rem", letterSpacing: 1, display: "block", mb: 0.75 }}>
              {tile.label}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1 }}>{tile.value}</Typography>
          </Paper>
        ))}
      </Box>

      {/* Cost breakdown - admin preview only */}
      {previewRole === "admin" && (
        <Paper sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
          <Box sx={{ px: 2, pt: 2, pb: 1.5, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Cost breakdown by category</Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Total: ${summary.totalCostUsd.toFixed(2)}
              </Typography>
            </Box>
            <Button size="small" variant="outlined" sx={{ flexShrink: 0 }}>
              Export to Excel
            </Button>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", px: 2, pb: 0.5, gap: 1 }}>
            {["Category", "Cost", "Units", "Avg / unit"].map((h) => (
              <Typography key={h} variant="caption" sx={{ color: "text.disabled", fontWeight: 700, fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: 0.5 }}>
                {h}
              </Typography>
            ))}
          </Box>
          <Divider />

          {summary.costByCategory.map((row, idx) => {
            const avgPerUnit = row.unitCount > 0 ? row.costUsd / row.unitCount : 0;
            return (
              <Box
                key={row.category}
                sx={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr 1fr",
                  px: 2,
                  py: 1.25,
                  gap: 1,
                  alignItems: "center",
                  borderTop: idx > 0 ? "1px solid" : "none",
                  borderColor: "divider",
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.category}</Typography>
                <Typography variant="body2">${row.costUsd.toFixed(2)}</Typography>
                <Typography variant="body2">{row.unitCount}</Typography>
                <Typography variant="body2">${avgPerUnit.toFixed(2)}</Typography>
              </Box>
            );
          })}
        </Paper>
      )}
    </Box>
  );
}
