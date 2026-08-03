import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import type { View } from "../view";
import type { ScoringRun } from "../types";
import { useAgents } from "../data/useAgents";
import { listAgentScoringRuns } from "../data/mock";
import KpiCards from "./home/KpiCards";
import AttentionTable from "./home/AttentionTable";
import VerdictDistribution from "./home/VerdictDistribution";
import RecentScoringRunsTable from "./home/RecentScoringRunsTable";

/**
 * Home dashboard (REQ-054 through REQ-058). Fetches scoring runs for every
 * agent once, in one shared effect, and hands the merged result down to the
 * KPI cards and the recent-runs table so neither has to fetch on its own.
 */
export default function HomeView({ navigate }: { navigate: (v: View) => void }) {
  const agents = useAgents();
  const [runs, setRuns] = useState<ScoringRun[]>([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all(agents.map((a) => listAgentScoringRuns(a.agent_id))).then((results) => {
      if (!cancelled) setRuns(results.flat());
    });
    return () => {
      cancelled = true;
    };
    // Re-fetch whenever the agent list reference changes (e.g. after
    // simulateTraces() mutates the store and emits a new snapshot).
  }, [agents]);

  return (
    <Box sx={{ p: 3, maxWidth: 1200 }}>
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
            Home
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
            Activity across all agents · last 7 days
          </Typography>
        </Box>
        <Button variant="contained" onClick={() => navigate({ name: "add-agent" })}>
          Add Agent
        </Button>
      </Box>

      <Box sx={{ mb: 3 }}>
        <KpiCards agents={agents} runs={runs} />
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 2, mb: 3, alignItems: "start" }}>
        <AttentionTable agents={agents} navigate={navigate} />
        <VerdictDistribution agents={agents} />
      </Box>

      <RecentScoringRunsTable runs={runs} agents={agents} navigate={navigate} />
    </Box>
  );
}
