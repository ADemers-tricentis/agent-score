/** Fake in-memory data for the Home dashboard — no backend. Shapes mirror the
 *  real `DashboardOverview`/`IngestionOverview` wire types closely enough for
 *  the cloned UI to render unmodified. Agent/tenant/run ids reuse the same
 *  fixture identities as `agents/fake-data.ts` and
 *  `agents/scoring/fake-runs.ts` (run ids follow that module's
 *  `run-${agentId}-${idx}` convention) so drilling into a KPI or a table row
 *  lands on a real, populated page instead of a dead end.
 */

export type ShipDecision = "ship" | "needs_work" | "dont_ship" | "provisional";

export interface DashboardRunRow {
  runId: string;
  agentId: string;
  agentName: string;
  tenantId: string;
  tenantName: string;
  compositeScore: number | null;
  shipDecision: ShipDecision;
  createdAt: string;
}

export interface DashboardTrendPoint {
  day: string;
  ship: number;
  review: number;
  block: number;
}

export interface DashboardCounts {
  agentsActive: number;
  agentsTotal: number;
}

export interface DashboardVerdictBuckets {
  ship: number;
  review: number;
  block: number;
}

export interface DashboardScoring {
  runsTotal: number;
  buckets: DashboardVerdictBuckets;
  noVerdict: number;
  collapsed: number;
  collapsedByClass: {
    backpressure: number;
    infrastructure: number;
    profile_attributable: number;
  };
  attention: DashboardRunRow[];
  recentRuns: DashboardRunRow[];
  needsAttentionAgents: number;
  needsReviewAgents: number;
  profileAttentionAgents: number;
  trend7D: DashboardTrendPoint[];
}

export interface DashboardOverview {
  counts: DashboardCounts;
  scoring: DashboardScoring;
}

export interface PointSummary {
  point: string;
  enabled: boolean;
  tracesInFlight?: number;
}

export interface IngestionOverview {
  currentTps: number;
  tracesToday: number;
  errorRate: number;
  writeSuccessRate: number;
  activeAlertCount: number;
  points: PointSummary[];
}

function hoursAgo(n: number): string {
  return new Date(Date.now() - n * 3600_000).toISOString();
}

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86_400_000).toISOString();
}

function row(
  runId: string,
  agentId: string,
  agentName: string,
  tenantId: string,
  tenantName: string,
  compositeScore: number | null,
  shipDecision: ShipDecision,
  createdAt: string,
): DashboardRunRow {
  return { runId, agentId, agentName, tenantId, tenantName, compositeScore, shipDecision, createdAt };
}

const ATTENTION: DashboardRunRow[] = [
  row("run-agent-6-0", "agent-6", "expense-classifier", "tenant-acme", "Acme Financial", 51, "dont_ship", hoursAgo(2)),
  row("run-agent-4-0", "agent-4", "support-triage-bot", "tenant-northwind", "Northwind Retail", 68, "needs_work", hoursAgo(5)),
  row("run-agent-2-0", "agent-2", "jira epic poller", "tenant-tar", "tricentisairesearch", 71, "needs_work", hoursAgo(9)),
];

const RECENT: DashboardRunRow[] = [
  row("run-agent-1-0", "agent-1", "ATA Regression Suite", "tenant-tais", "TAIS (Testing AI team)", 91, "ship", hoursAgo(1)),
  row("run-agent-6-0", "agent-6", "expense-classifier", "tenant-acme", "Acme Financial", 51, "dont_ship", hoursAgo(2)),
  row("run-agent-3-0", "agent-3", "invoice-reconciler", "tenant-acme", "Acme Financial", 88, "ship", hoursAgo(4)),
  row("run-agent-4-0", "agent-4", "support-triage-bot", "tenant-northwind", "Northwind Retail", 68, "needs_work", hoursAgo(5)),
  row("run-agent-5-0", "agent-5", "code-review-assistant", "tenant-globex", "Globex Engineering", 94, "ship", hoursAgo(7)),
  row("run-agent-2-0", "agent-2", "jira epic poller", "tenant-tar", "tricentisairesearch", 71, "needs_work", hoursAgo(9)),
  row("run-agent-7-0", "agent-7", "support-triage-bot", "tenant-northwind", "Northwind Retail", 89, "ship", hoursAgo(14)),
];

const TREND_7D: DashboardTrendPoint[] = Array.from({ length: 7 }, (_, i) => {
  const seed = 6 - i;
  return {
    day: daysAgo(seed),
    ship: 8 + (seed % 3) * 2,
    review: 2 + (seed % 2),
    block: seed % 4 === 0 ? 1 : 0,
  };
});

export const DASHBOARD_OVERVIEW: DashboardOverview = {
  counts: {
    agentsActive: 6,
    agentsTotal: 7,
  },
  scoring: {
    runsTotal: 14,
    buckets: { ship: 9, review: 3, block: 1 },
    noVerdict: 1,
    collapsed: 0,
    collapsedByClass: { backpressure: 0, infrastructure: 0, profile_attributable: 0 },
    attention: ATTENTION,
    recentRuns: RECENT,
    needsAttentionAgents: 3,
    needsReviewAgents: 2,
    profileAttentionAgents: 1,
    trend7D: TREND_7D,
  },
};

export const INGESTION_OVERVIEW: IngestionOverview = {
  currentTps: 12.4,
  tracesToday: 48_213,
  errorRate: 0.006,
  writeSuccessRate: 0.994,
  activeAlertCount: 0,
  points: [
    { point: "otel-collector", enabled: true, tracesInFlight: 3 },
    { point: "langfuse-bridge", enabled: true, tracesInFlight: 1 },
  ],
};

/** "Blank / new login" demo state — what a brand-new tenant with nothing
 * configured yet looks like: no agents, no runs, no traces. Driven by the
 * `blank` toggle in `shared/demo-mode/demo-mode-context.tsx`. */
export const DASHBOARD_OVERVIEW_BLANK: DashboardOverview = {
  counts: {
    agentsActive: 0,
    agentsTotal: 0,
  },
  scoring: {
    runsTotal: 0,
    buckets: { ship: 0, review: 0, block: 0 },
    noVerdict: 0,
    collapsed: 0,
    collapsedByClass: { backpressure: 0, infrastructure: 0, profile_attributable: 0 },
    attention: [],
    recentRuns: [],
    needsAttentionAgents: 0,
    needsReviewAgents: 0,
    profileAttentionAgents: 0,
    trend7D: [],
  },
};

export const INGESTION_OVERVIEW_BLANK: IngestionOverview = {
  currentTps: 0,
  tracesToday: 0,
  errorRate: 0,
  writeSuccessRate: 0,
  activeAlertCount: 0,
  points: [
    { point: "otel-collector", enabled: true, tracesInFlight: 0 },
    { point: "langfuse-bridge", enabled: true, tracesInFlight: 0 },
  ],
};
