import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import type { View } from "../view";
import type { Readiness, ScoringRun, Trace } from "../types";
import { useAgent } from "../data/useAgents";
import { getAgentReadiness, listAgentScoringRuns, listAgentTraces, simulateTraces } from "../data/mock";
import ScoreRing from "../components/shared/ScoreRing";
import StatCard from "../components/shared/StatCard";
import AgentHeader from "./agent-overview/AgentHeader";
import AgentTabBar, { AGENT_TAB_LABEL, type AgentTab } from "./agent-overview/AgentTabBar";
import KeepSendingTracesBanner from "./agent-overview/KeepSendingTracesBanner";
import RecentTracesTable from "./agent-overview/RecentTracesTable";
import RecentScoringRunsTable from "./agent-overview/RecentScoringRunsTable";
import ComingSoonPanel from "./agent-overview/ComingSoonPanel";
import ScoringTab from "./agent-overview/scoring/ScoringTab";
import TracesTab from "./agent-overview/traces/TracesTab";
import LabelingTab from "./agent-overview/labeling/LabelingTab";
import SettingsTab from "./agent-overview/settings/SettingsTab";

// Step size for the demo "Simulate traces" action. Large enough to cross the
// 20-trace readiness threshold in a single click from the seeded low-trace
// agent (agt_cura_diagnostic starts at 8), without being tied to that one
// agent's specific numbers.
const SIMULATE_TRACE_COUNT = 12;

function formatLatency(ms: number | null): string {
  if (ms == null) return "-";
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${ms}ms`;
}

function formatUsd(value: number | null): string {
  if (value == null) return "-";
  return `$${value.toFixed(2)}`;
}

export default function AgentOverviewView({
  agentId,
  initialTab,
  navigate,
}: {
  agentId: string;
  initialTab?: AgentTab;
  navigate: (v: View) => void;
}) {
  const agent = useAgent(agentId);
  const [activeTab, setActiveTab] = useState<AgentTab>(initialTab ?? "overview");
  const [refreshKey, setRefreshKey] = useState(0);
  const [readiness, setReadiness] = useState<Readiness | null>(null);
  const [traces, setTraces] = useState<Trace[]>([]);
  const [runs, setRuns] = useState<ScoringRun[]>([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getAgentReadiness(agentId), listAgentTraces(agentId, { limit: 5 }), listAgentScoringRuns(agentId, { limit: 3 })]).then(
      ([nextReadiness, nextTraces, nextRuns]) => {
        if (cancelled) return;
        setReadiness(nextReadiness);
        setTraces(nextTraces);
        setRuns(nextRuns);
      },
    );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refreshKey intentionally re-triggers the fetch after simulateTraces()
  }, [agentId, refreshKey]);

  if (!agent) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Agent not found.</Typography>
      </Box>
    );
  }

  function handleSimulateTraces() {
    simulateTraces(agentId, SIMULATE_TRACE_COUNT);
    setRefreshKey((k) => k + 1);
  }

  // While the readiness fetch is still in flight, fall back to the agent
  // record's own signal (compositeScore is only ever populated once ready).
  const ready = readiness ? readiness.ready : agent.compositeScore != null;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Box sx={{ px: 3, pt: 2.5, pb: 0, bgcolor: "background.paper" }}>
        <AgentHeader agent={agent} />
        <Box sx={{ mt: 2 }}>
          <AgentTabBar value={activeTab} onChange={setActiveTab} />
        </Box>
        <Divider />
      </Box>

      <Box sx={{ flex: 1, overflow: "auto", p: 3 }}>
        {activeTab === "scoring" ? (
          <ScoringTab agentId={agentId} navigate={navigate} />
        ) : activeTab === "traces" ? (
          <TracesTab agentId={agentId} />
        ) : activeTab === "labeling" ? (
          <LabelingTab agentId={agentId} />
        ) : activeTab === "settings" ? (
          <SettingsTab agentId={agentId} navigate={navigate} />
        ) : activeTab !== "overview" ? (
          <ComingSoonPanel tabName={AGENT_TAB_LABEL[activeTab]} />
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {!ready && readiness && (
              <KeepSendingTracesBanner captured={readiness.captured} threshold={readiness.threshold} onSimulate={handleSimulateTraces} />
            )}

            <Box sx={{ display: "grid", gridTemplateColumns: "260px 1fr 1fr", gridTemplateRows: "auto auto", gap: 2 }}>
              <Paper
                sx={{
                  p: 2.5,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                  gridRow: "1 / 3",
                  gridColumn: "1 / 2",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1.5,
                }}
              >
                <Typography variant="overline" sx={{ color: "text.disabled", fontSize: "0.62rem", letterSpacing: 1 }}>
                  Composite Score
                </Typography>
                {ready ? (
                  <ScoreRing score={agent.compositeScore} size={120} label={agent.grade ? `Grade ${agent.grade}` : undefined} />
                ) : (
                  <ScoreRing
                    score={null}
                    size={120}
                    locked={{ captured: readiness?.captured ?? agent.traceCount, threshold: readiness?.threshold ?? 20 }}
                  />
                )}
              </Paper>

              <StatCard
                label="Traces (24h)"
                value={agent.traceCount24h}
                locked={ready ? undefined : { threshold: readiness?.threshold ?? 20 }}
              />
              <StatCard
                label="P95 Latency"
                value={formatLatency(agent.p95LatencyMs24h)}
                locked={ready ? undefined : { threshold: readiness?.threshold ?? 20 }}
              />
              <StatCard
                label="Token Spend (24h)"
                value={formatUsd(agent.tokenSpend24hUsd)}
                locked={ready ? undefined : { threshold: readiness?.threshold ?? 20 }}
              />
              <StatCard
                label="Errors (24h)"
                value={agent.errorCount24h}
                locked={ready ? undefined : { threshold: readiness?.threshold ?? 20 }}
              />
            </Box>

            <RecentTracesTable traces={traces} />
            <RecentScoringRunsTable runs={runs} />
          </Box>
        )}
      </Box>
    </Box>
  );
}
