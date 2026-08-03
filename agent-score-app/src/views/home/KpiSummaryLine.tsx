import Typography from "@mui/material/Typography";
import type { Agent, ScoringRun } from "../../types";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * One-line context strip above the inbox — replaces the old 4-tile KPI grid.
 * The inbox itself is now the page's visual hero (see
 * plans/2026-08-03-agentscore-app-home-inbox.md), so this is deliberately
 * quiet: a fact, not a dashboard.
 */
export default function KpiSummaryLine({ agents, runs }: { agents: Agent[]; runs: ScoringRun[] }) {
  const now = Date.now();

  // Simplification (carried over from the old KpiCards): the mock data only
  // exposes a rolling 24h trace count per agent rather than a real 7-day
  // time series, so this approximates "traces in the last 7 days" as the sum
  // of every agent's traceCount24h.
  const traces7d = agents.reduce((sum, a) => sum + a.traceCount24h, 0);
  const recentRuns = runs.filter((r) => r.completedAt !== null && now - new Date(r.completedAt).getTime() <= SEVEN_DAYS_MS);

  return (
    <Typography variant="body2" sx={{ color: "text.secondary" }}>
      {agents.length} agent{agents.length === 1 ? "" : "s"} · {traces7d} traces and {recentRuns.length} scoring runs in the last
      7 days
    </Typography>
  );
}
