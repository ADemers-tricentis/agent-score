// TRIMMED router for this pass — Agents section only (per the user's "one
// section at a time" instruction). No auth gates (no backend, nothing to
// authenticate against): the real root route wraps AuthProvider/AuthGuard/
// BackOfficeAppGate/SetupGate; those get reintroduced (faked, not real) when
// auth/nav gets its own pass. Mirrors the real router.tsx's Agents subtree
// (see agent-score/frontend/src/back-office/routes/router.tsx) 1:1 for paths.
import {
  createHashHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  redirect,
} from "@tanstack/react-router";

import { DashboardPage } from "@/back-office/dashboard/DashboardPage";
import { AgentCardPage } from "@/back-office/agents/AgentCardPage";
import { AgentDetailLayout } from "@/back-office/agents/AgentDetailLayout";
import { AgentImprovePage } from "@/back-office/agents/AgentImprovePage";
import { AgentLabelingPage } from "@/back-office/agents/AgentLabelingPage";
import { AgentProfilePage } from "@/back-office/agents/AgentProfilePage";
import { AgentScorePage } from "@/back-office/agents/AgentScorePage";
import { AgentSettingsPage } from "@/back-office/agents/AgentSettingsPage";
import { AgentsSearchPage } from "@/back-office/agents/AgentsSearchPage";
import { AgentTraceDetailPage } from "@/back-office/agents/AgentTraceDetailPage";
import { AgentTracesPage } from "@/back-office/agents/AgentTracesPage";
import { ScoringRunResultPage } from "@/back-office/agents/ScoringRunResultPage";
import { parseAgentScoreSearch, parseRunResultSearch } from "@/back-office/agents/scoring/tab-params";
import { parseAgentsViewSearch } from "@/back-office/agents/view-params";
import { MinimalShell } from "@/back-office/components/MinimalShell";
import { TourProvider } from "@/shared/tour/tour-context";
import { DocsPage } from "@/back-office/docs/DocsPage";
import { DEFAULT_DOCS_SLUG } from "@/back-office/docs/nav";
import { DimensionCreatePage } from "@/back-office/eval-catalog/DimensionCreatePage";
import { DimensionDetailPage } from "@/back-office/eval-catalog/DimensionDetailPage";
import { DimensionsPage } from "@/back-office/eval-catalog/DimensionsPage";
import { EvalCatalogLayout } from "@/back-office/eval-catalog/EvalCatalogLayout";
import { EvalCatalogPage } from "@/back-office/eval-catalog/EvalCatalogPage";
import { ProfileBuilderPage } from "@/back-office/eval-catalog/ProfileBuilderPage";
import { ProfileDetailPage } from "@/back-office/eval-catalog/ProfileDetailPage";
import { ProfilesPage } from "@/back-office/eval-catalog/ProfilesPage";
import { AgentRegistryLayout } from "@/back-office/agent-registry/AgentRegistryLayout";
import { AgentRegistryPage } from "@/back-office/agent-registry/AgentRegistryPage";
import { SlotDetailPage } from "@/back-office/agent-registry/SlotDetailPage";
import { VersionCreatePage } from "@/back-office/agent-registry/VersionCreatePage";
import { VersionDetailPage } from "@/back-office/agent-registry/VersionDetailPage";
import { parseRegistryScopeSearch } from "@/back-office/agent-registry/scope-params";
import { ReportsPage } from "@/back-office/reports/ReportsPage";
import { TenantUsageDetailPage } from "@/back-office/reports/TenantUsageDetailPage";
import { parseReportsSearch, parseReportsWindowSearch } from "@/back-office/reports/tab-params";

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

const protectedLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "protected",
  component: () => (
    <TourProvider>
      <MinimalShell>
        <Outlet />
      </MinimalShell>
    </TourProvider>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/",
  component: DashboardPage,
});

const agentsRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/agents",
  component: AgentsSearchPage,
  validateSearch: (search: Record<string, unknown>) => parseAgentsViewSearch(search),
});

const agentDetailLayoutRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/tenants/$tenantId/agents/$agentId",
  component: AgentDetailLayout,
});

const agentScoreRoute = createRoute({
  getParentRoute: () => agentDetailLayoutRoute,
  path: "/",
  component: AgentScorePage,
  validateSearch: (search: Record<string, unknown>) => parseAgentScoreSearch(search),
});

const agentImproveRoute = createRoute({
  getParentRoute: () => agentDetailLayoutRoute,
  path: "/improve",
  component: AgentImprovePage,
  validateSearch: (search: Record<string, unknown>) => ({
    advice: typeof search.advice === "string" && search.advice.length <= 128 ? search.advice : undefined,
    request: typeof search.request === "string" && search.request.length <= 128 ? search.request : undefined,
  }),
});

const agentCardRoute = createRoute({
  getParentRoute: () => agentDetailLayoutRoute,
  path: "/card",
  component: AgentCardPage,
});

const agentTracesRoute = createRoute({
  getParentRoute: () => agentDetailLayoutRoute,
  path: "/traces",
  component: AgentTracesPage,
});

const agentProfileRoute = createRoute({
  getParentRoute: () => agentDetailLayoutRoute,
  path: "/profile",
  component: AgentProfilePage,
});

const agentScoringRunResultRoute = createRoute({
  getParentRoute: () => agentDetailLayoutRoute,
  path: "/runs/$runId",
  component: ScoringRunResultPage,
  validateSearch: (search: Record<string, unknown>) => parseRunResultSearch(search),
});

const agentLabelingRoute = createRoute({
  getParentRoute: () => agentDetailLayoutRoute,
  path: "/labeling",
  component: AgentLabelingPage,
});

const agentSettingsRoute = createRoute({
  getParentRoute: () => agentDetailLayoutRoute,
  path: "/settings",
  component: AgentSettingsPage,
});

const agentTraceDetailRoute = createRoute({
  getParentRoute: () => agentDetailLayoutRoute,
  path: "/traces/$traceId",
  component: AgentTraceDetailPage,
  validateSearch: (search: Record<string, unknown>): { timestamp?: string; view: "spans" | "scores" } => ({
    timestamp: typeof search.timestamp === "string" ? search.timestamp : undefined,
    view: search.view === "scores" ? "scores" : "spans",
  }),
});

// ── Docs (demo-only — no production back-office equivalent) ────────────────

const docsIndexRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/docs",
  beforeLoad: () => {
    throw redirect({ to: "/docs/$slug", params: { slug: DEFAULT_DOCS_SLUG } });
  },
});

const docsPageRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/docs/$slug",
  component: DocsPage,
});

// ── Evals Catalog (dimensions / evals / profiles) ───────────────────────────
// Mirrors the real router: a pathless layout renders the tab strip for the
// three list routes; taxonomy create/detail/builder pages are standalone
// (direct children of the protected layout, own breadcrumb back to the list).

const evalsCatalogLayoutRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  id: "evals-catalog",
  component: EvalCatalogLayout,
});

const evalsCatalogEvalsRoute = createRoute({
  getParentRoute: () => evalsCatalogLayoutRoute,
  path: "/evals/catalog/evals",
  component: EvalCatalogPage,
});

const evalsCatalogDimensionsRoute = createRoute({
  getParentRoute: () => evalsCatalogLayoutRoute,
  path: "/evals/catalog/dimensions",
  component: DimensionsPage,
});

const evalsCatalogProfilesRoute = createRoute({
  getParentRoute: () => evalsCatalogLayoutRoute,
  path: "/evals/catalog/profiles",
  component: ProfilesPage,
});

const dimensionCreateRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/evals/catalog/dimensions/new",
  component: DimensionCreatePage,
});

const dimensionEditRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/evals/catalog/dimensions/$dimensionId",
  component: DimensionDetailPage,
});

const profileBuilderRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/evals/catalog/profiles/new",
  component: ProfileBuilderPage,
});

const profileDetailRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/evals/catalog/profiles/$profileId",
  component: ProfileDetailPage,
});

const profileVersionRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/evals/catalog/profiles/$profileId/version",
  component: ProfileBuilderPage,
});

// ── Agent Registry (slots / versions / bindings) ────────────────────────────
// Mirrors the real router: a pathless layout renders the "Agent Registry"
// title + tab strip; the Registry list route nests under it. The "Agent
// runs" tab (AgentRunsPage) and its run-detail subtree are a separate
// section (runtime-runs) not in scope for this pass - the layout itself
// already hides that tab for a non-superadmin (useAuth() defaults to
// user: null with no AuthProvider mounted, so it's always hidden here),
// so there's no dead link.

const agentRegistryLayoutRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  id: "agent-registry",
  component: AgentRegistryLayout,
});

const agentRegistryRoute = createRoute({
  getParentRoute: () => agentRegistryLayoutRoute,
  path: "/agent-registry",
  component: AgentRegistryPage,
  validateSearch: parseRegistryScopeSearch,
});

const agentRegistrySlotDetailRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/agent-registry/slots/$slotSlug",
  component: SlotDetailPage,
});

const agentRegistryVersionCreateRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/agent-registry/slots/$slotSlug/versions/new",
  component: VersionCreatePage,
});

const agentRegistryVersionDetailRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/agent-registry/slots/$slotSlug/versions/$versionId",
  component: VersionDetailPage,
});

// ── Reports (superadmin only) ───────────────────────────────────────────────

const reportsRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/reports",
  component: ReportsPage,
  validateSearch: parseReportsSearch,
});

const tenantUsageDetailRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/reports/usage/$tenantId",
  component: TenantUsageDetailPage,
  validateSearch: parseReportsWindowSearch,
});

const protectedChildren = [
  indexRoute,
  agentsRoute,
  agentDetailLayoutRoute.addChildren([
    agentScoreRoute,
    agentImproveRoute,
    agentCardRoute,
    agentTracesRoute,
    agentProfileRoute,
    agentScoringRunResultRoute,
    agentLabelingRoute,
    agentSettingsRoute,
    agentTraceDetailRoute,
  ]),
  docsIndexRoute,
  docsPageRoute,
  evalsCatalogLayoutRoute.addChildren([
    evalsCatalogEvalsRoute,
    evalsCatalogDimensionsRoute,
    evalsCatalogProfilesRoute,
  ]),
  dimensionCreateRoute,
  dimensionEditRoute,
  profileBuilderRoute,
  profileDetailRoute,
  profileVersionRoute,
  agentRegistryLayoutRoute.addChildren([agentRegistryRoute]),
  agentRegistrySlotDetailRoute,
  agentRegistryVersionCreateRoute,
  agentRegistryVersionDetailRoute,
  reportsRoute,
  tenantUsageDetailRoute,
];

const routeTree = rootRoute.addChildren([protectedLayoutRoute.addChildren(protectedChildren)]);

export const router = createRouter({ routeTree, history: createHashHistory() });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
