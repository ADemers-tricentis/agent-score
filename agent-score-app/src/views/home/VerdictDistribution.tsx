import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import LinearProgress from "@mui/material/LinearProgress";
import type { Agent, Verdict } from "../../types";
import { TrendChart } from "../../components/shared/charts";

const VERDICTS = ["Ship", "Review", "Block"] as const;

const VERDICT_COLOR: Record<Verdict, "success" | "warning" | "error"> = {
  Ship: "success",
  Review: "warning",
  Block: "error",
};

const VERDICT_HEX: Record<Verdict, string> = {
  Ship: "#4ade80",
  Review: "#fbbf24",
  Block: "#f87171",
};

/** Ship/Review/Block distribution panel for the Home dashboard (REQ-057). */
export default function VerdictDistribution({ agents }: { agents: Agent[] }) {
  const counts: Record<Verdict, number> = { Ship: 0, Review: 0, Block: 0 };
  for (const a of agents) {
    if (a.verdict) counts[a.verdict]++;
  }
  const total = VERDICTS.reduce((sum, v) => sum + counts[v], 0);

  // Simplification (REQ-057): the mock layer has no real daily verdict time
  // series, so the 7-day trend is derived deterministically as a gentle
  // linear ramp from 60% of today's counts up to today's actual counts —
  // enough to give the chart a plausible shape without new mock data.
  const trend = (count: number) => Array.from({ length: 7 }, (_, i) => Math.round(count * (0.6 + (0.4 * i) / 6)));

  return (
    <Paper sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.25 }}>
        Verdict distribution
      </Typography>
      <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 2 }}>
        Across all scored agents
      </Typography>

      {VERDICTS.map((v) => {
        const count = counts[v];
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        const color = VERDICT_COLOR[v];
        return (
          <Box key={v} sx={{ mb: 1.5 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: `${color}.main` }}>
                {v}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {count} ({pct}%)
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={pct}
              color={color}
              sx={{ height: 8, borderRadius: 4, bgcolor: `rgba(var(--mui-palette-${color}-mainChannel) / 0.12)` }}
            />
          </Box>
        );
      })}

      <Divider sx={{ my: 2 }} />

      <Typography variant="overline" sx={{ color: "text.disabled", fontSize: "0.62rem", letterSpacing: 1, display: "block", mb: 1.5 }}>
        TREND (7 DAYS)
      </Typography>
      <TrendChart series={VERDICTS.map((v) => ({ data: trend(counts[v]), color: VERDICT_HEX[v] }))} />

      <Box sx={{ display: "flex", gap: 2, mt: 1.5 }}>
        {VERDICTS.map((v) => (
          <Box key={v} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: VERDICT_HEX[v] }} />
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {v}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
}
