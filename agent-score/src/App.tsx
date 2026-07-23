import { useState } from "react";
import type { View } from "./types";
import Layout from "./components/Layout";
import HomeView from "./views/HomeView";
import AgentsView from "./views/AgentsView";
import ProjectView from "./views/ProjectView";
import RunView from "./views/RunView";
import SessionView from "./views/SessionView";
import ScoreBreakdownView from "./views/ScoreBreakdownView";
import GuardLogView from "./views/GuardLogView";
import MetricsView from "./views/MetricsView";
import EvalDesignView from "./views/EvalDesignView";
import LLMJudgesView from "./views/LLMJudgesView";
import AddJudgeView from "./views/AddJudgeView";
import IntegrationsView from "./views/IntegrationsView";
import CompareRunsView from "./views/CompareRunsView";
import AddAgentView from "./views/AddAgentView";
import AgentDetailView from "./views/AgentDetailView";
import AgentSettingsView from "./views/AgentSettingsView";
import ProfilesView from "./views/ProfilesView";
import ProfileDetailView from "./views/ProfileDetailView";
import AddProfileView from "./views/AddProfileView";
import DimensionsView from "./views/DimensionsView";

export default function App() {
  const [view, setView] = useState<View>({ name: "home" });

  function renderView() {
    switch (view.name) {
      case "home":
        return <HomeView navigate={setView} />;
      case "agents":
        return <AgentsView navigate={setView} />;
      case "agent-detail":
        return <AgentDetailView projectId={view.projectId} navigate={setView} />;
      case "project":
        return <ProjectView projectId={view.projectId} initialTab={view.initialTab} initialTraceId={view.initialTraceId} navigate={setView} />;
      case "agent-settings":
        return <AgentSettingsView projectId={view.projectId} navigate={setView} />;
      case "run":
        return <RunView projectId={view.projectId} runId={view.runId} navigate={setView} />;
      case "session":
        return (
          <SessionView
            projectId={view.projectId}
            runId={view.runId}
            sessionId={view.sessionId}
            navigate={setView}
          />
        );
      case "score-breakdown":
        return (
          <ScoreBreakdownView
            projectId={view.projectId}
            runId={view.runId}
            sessionId={view.sessionId}
            navigate={setView}
          />
        );
      case "eval-design":
        return <EvalDesignView projectId={view.projectId} navigate={setView} />;
      case "guard-log":
        return <GuardLogView navigate={setView} />;
      case "metrics":
        return <MetricsView />;
      case "llm-judges":
        return <LLMJudgesView navigate={setView} />;
      case "add-judge":
        return <AddJudgeView navigate={setView} />;
      case "integrations":
        return <IntegrationsView />;
      case "add-agent":
        return <AddAgentView navigate={setView} />;
      case "profiles":
        return <ProfilesView navigate={setView} />;
      case "profile":
        return <ProfileDetailView profileId={view.profileId} navigate={setView} />;
      case "add-profile":
        return <AddProfileView navigate={setView} />;
      case "dimensions":
        return <DimensionsView />;
      case "compare-runs":
        return (
          <CompareRunsView
            projectId={view.projectId}
            runIdA={view.runIdA}
            runIdB={view.runIdB}
            navigate={setView}
          />
        );
    }
  }

  return (
    <Layout view={view} navigate={setView}>
      {renderView()}
    </Layout>
  );
}
