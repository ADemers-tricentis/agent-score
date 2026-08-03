import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import type { Agent, ScoringRun, Verdict } from "../../types";

// Ship threshold (REQ-055/056): agents below this composite score, but
// already scored (compositeScore !== null), count as "needing attention".
const SHIP_THRESHOLD = 85;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/** KPI row for the Home dashboard (REQ-054). */
export default function KpiCards({ agents, runs }: { agents: Agent[]; runs: ScoringRun[] }) {
  const now = Date.now();

  // Simplification (REQ-054): the mock data only exposes a rolling 24h trace
  // count per agent rather than a real 7-day time series, so "traces
  // ingested in the last 7 days" is approximated as the sum of every
  // agent's traceCount24h.
  const traces7d = agents.reduce((sum, a) => sum + a.traceCount24h, 0);

  const recentRuns = runs.filter((r) => r.completedAt !== null && now - new Date(r.completedAt).getTime() <= SEVEN_DAYS_MS);
  const verdictCounts: Record<Verdict, number> = { Ship: 0, Review: 0, Block: 0 };
  for (const r of recentRuns) {
    if (r.verdict) verdictCounts[r.verdict]++;
  }

  const needingAttention = agents.filter((a) => a.compositeScore !== null && a.compositeScore < SHIP_THRESHOLD).length;

  const cards: { label: string; value: number; sub: ReactNode }[] = [
    {
      label: "ACTIVE AGENTS",
      value: agents.length,
      sub: (
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          Across all agent types
        </Typography>
      ),
    },
    {
      label: "TRACES (7D)",
      value: traces7d,
      sub: (
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          Ingested in the last 7 days
        </Typography>
      ),
    },
    {
      label: "SCORING RUNS (7D)",
      value: recentRuns.length,
      sub: (
        <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
          <Chip label={`${verdictCounts.Ship} Ship`} size="small" color="success" sx={{ height: 18, fontSize: "0.62rem" }} />
          <Chip label={`${verdictCounts.Review} Review`} size="small" color="warning" sx={{ height: 18, fontSize: "0.62rem" }} />
          <Chip label={`${verdictCounts.Block} Block`} size="small" color="error" sx={{ height: 18, fontSize: "0.62rem" }} />
        </Box>
      ),
    },
    {
      label: "NEEDS ATTENTION",
      value: needingAttention,
      sub:
        needingAttention > 0 ? (
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Below the Ship threshold ({SHIP_THRESHOLD})
          </Typography>
        ) : (
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            All scored agents are shipping
          </Typography>
        ),
    },
  ];

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2 }}>
      {cards.map((card) => (
        <Paper key={card.label} sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
          <Typography variant="overline" sx={{ color: "text.disabled", fontSize: "0.62rem", letterSpacing: 1, display: "block", mb: 0.75 }}>
            {card.label}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1 }}>
            {card.value}
          </Typography>
          <Box sx={{ mt: 0.75 }}>{card.sub}</Box>
        </Paper>
      ))}
    </Box>
  );
}
