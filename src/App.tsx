import { useState } from "react";
import type { View } from "./types";
import Layout from "./components/Layout";
import FleetView from "./views/FleetView";
import ProjectView from "./views/ProjectView";
import RunView from "./views/RunView";
import SessionView from "./views/SessionView";
import GuardLogView from "./views/GuardLogView";
import MetricsView from "./views/MetricsView";
import EvalDesignView from "./views/EvalDesignView";
import LLMJudgesView from "./views/LLMJudgesView";
import AddJudgeView from "./views/AddJudgeView";
import IntegrationsView from "./views/IntegrationsView";
import CompareRunsView from "./views/CompareRunsView";

export default function App() {
  const [view, setView] = useState<View>({ name: "fleet" });

  function renderView() {
    switch (view.name) {
      case "fleet":
        return <FleetView navigate={setView} />;
      case "project":
        return <ProjectView projectId={view.projectId} navigate={setView} />;
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
