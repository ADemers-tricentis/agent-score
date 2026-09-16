import { useEffect, useState } from "react";
import type { PreviewRole, View } from "./types";
import Layout from "./components/Layout";
import { ToastProvider } from "./components/Toast";
import HomeView from "./views/HomeView";
import AgentsView from "./views/AgentsView";
import AgentShellView from "./views/AgentShellView";
import SessionView from "./views/SessionView";
import ScoreBreakdownView from "./views/ScoreBreakdownView";
import MetricsView from "./views/MetricsView";
import EvalDesignView from "./views/EvalDesignView";
import LLMJudgesView from "./views/LLMJudgesView";
import AddJudgeView from "./views/AddJudgeView";
import IntegrationsView from "./views/IntegrationsView";
import CompareRunsView from "./views/CompareRunsView";
import AddAgentView from "./views/AddAgentView";
import RunView from "./views/RunView";
import ProfilesView from "./views/ProfilesView";
import ProfileDetailView from "./views/ProfileDetailView";
import AddProfileView from "./views/AddProfileView";
import DimensionsView from "./views/DimensionsView";
import DemoGalleryView from "./views/DemoGalleryView";
import GettingStartedView from "./views/GettingStartedView";
import ChatScoringView from "./views/ChatScoringView";
import TenantsView from "./views/TenantsView";
import UsersView from "./views/UsersView";
import AddUserView from "./views/AddUserView";
import AgentRegistryView from "./views/AgentRegistryView";
import RegistrySlotDetailView from "./views/RegistrySlotDetailView";
import RegistryVersionDetailView from "./views/RegistryVersionDetailView";
import RegistryVersionCreateView from "./views/RegistryVersionCreateView";
import ReportsView from "./views/ReportsView";
import TenantUsageDetailView from "./views/TenantUsageDetailView";
import LLMCatalogView from "./views/LLMCatalogView";

const ADMIN_ONLY_VIEWS: View["name"][] = ["tenants", "users", "add-user", "llm-catalog", "reports", "tenant-usage"];

export default function App() {
  const [view, setView] = useState<View>({ name: "home" });
  const [previewRole, setPreviewRole] = useState<PreviewRole>("admin");
  const [tenantId, setTenantId] = useState("tais");

  useEffect(() => {
    if (previewRole === "member" && ADMIN_ONLY_VIEWS.includes(view.name)) {
      setView({ name: "home" });
    }
  }, [previewRole, view.name]);

  function renderView() {
    switch (view.name) {
      case "home":
        return <HomeView navigate={setView} tenantId={tenantId} previewRole={previewRole} />;
      case "agents":
        return <AgentsView navigate={setView} tenantId={tenantId} />;
      case "agent":
        return <AgentShellView projectId={view.projectId} tab={view.tab} initialTraceId={view.initialTraceId} navigate={setView} />;
      case "agent-run":
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
      case "demo-gallery":
        return <DemoGalleryView navigate={setView} />;
      case "getting-started":
        return <GettingStartedView navigate={setView} />;
      case "chat-scoring":
        return <ChatScoringView projectId={view.projectId} navigate={setView} />;
      case "compare-runs":
        return (
          <CompareRunsView
            projectId={view.projectId}
            runIdA={view.runIdA}
            runIdB={view.runIdB}
            navigate={setView}
          />
        );
      case "tenants":
        return <TenantsView navigate={setView} />;
      case "users":
        return <UsersView navigate={setView} tab={view.tab} />;
      case "add-user":
        return <AddUserView email={view.email} requestId={view.requestId} navigate={setView} />;
      case "agent-registry":
        return <AgentRegistryView tenantId={view.tenantId} navigate={setView} />;
      case "registry-slot":
        return <RegistrySlotDetailView slotSlug={view.slotSlug} tenantId={view.tenantId} navigate={setView} />;
      case "registry-version":
        return <RegistryVersionDetailView slotSlug={view.slotSlug} versionId={view.versionId} tenantId={view.tenantId} navigate={setView} />;
      case "registry-version-new":
        return <RegistryVersionCreateView slotSlug={view.slotSlug} fromVersionId={view.fromVersionId} tenantId={view.tenantId} navigate={setView} />;
      case "reports":
        return <ReportsView tab={view.tab} range={view.range} navigate={setView} />;
      case "tenant-usage":
        return <TenantUsageDetailView tenantId={view.tenantId} range={view.range} navigate={setView} />;
      case "llm-catalog":
        return <LLMCatalogView />;
    }
  }

  return (
    <ToastProvider>
      <Layout
        view={view}
        navigate={setView}
        previewRole={previewRole}
        setPreviewRole={setPreviewRole}
        tenantId={tenantId}
        setTenantId={setTenantId}
      >
        {renderView()}
      </Layout>
    </ToastProvider>
  );
}
