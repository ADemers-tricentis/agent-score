import { useState } from "react";
import type { View } from "./view";
import Layout from "./components/layout/Layout";
import HomeView from "./views/HomeView";
import AgentOverviewView from "./views/AgentOverviewView";
import RunDetailView from "./views/RunDetailView";
import SessionDetailView from "./views/SessionDetailView";
import AddAgentView from "./views/AddAgentView";

export default function App() {
  const [view, setView] = useState<View>({ name: "home" });

  function renderView() {
    switch (view.name) {
      case "home":
        return <HomeView navigate={setView} />;
      case "agent-overview":
        return <AgentOverviewView agentId={view.agentId} initialTab={view.tab} navigate={setView} />;
      case "add-agent":
        return <AddAgentView navigate={setView} />;
      case "run-detail":
        return <RunDetailView agentId={view.agentId} runId={view.runId} navigate={setView} />;
      case "session-detail":
        return <SessionDetailView agentId={view.agentId} runId={view.runId} sessionId={view.sessionId} navigate={setView} />;
    }
  }

  return <Layout view={view} navigate={setView}>{renderView()}</Layout>;
}
