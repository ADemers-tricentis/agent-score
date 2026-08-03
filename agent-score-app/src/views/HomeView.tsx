import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import type { View } from "../view";
import type { ScoringRun } from "../types";
import { useAgents } from "../data/useAgents";
import { listAgentScoringRuns } from "../data/mock";
import KpiSummaryLine from "./home/KpiSummaryLine";
import InboxSection from "./home/InboxSection";

/**
 * Home: a triage inbox rather than a dashboard — see
 * plans/2026-08-03-agentscore-app-home-inbox.md. Still fetches scoring runs
 * for every agent once, in one shared effect, to feed the summary line.
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
    <Box sx={{ p: 3, maxWidth: 900 }}>
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2, mb: 0.5 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Home
        </Typography>
        <Button variant="contained" onClick={() => navigate({ name: "add-agent" })}>
          Add Agent
        </Button>
      </Box>

      <Box sx={{ mb: 3 }}>
        <KpiSummaryLine agents={agents} runs={runs} />
      </Box>

      <InboxSection navigate={navigate} />
    </Box>
  );
}
