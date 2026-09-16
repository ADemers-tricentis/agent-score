/** Fake in-memory data for the Agents section — no backend. Every shape here
 *  mirrors the real `AgentProfile`/`FlatAgentListItem`/`AgentFitStatus`/
 *  `AgentGroup` wire types closely enough for the cloned UI to render
 *  unmodified; nothing here is fetched, it's just local fixtures other
 *  agents-section files import directly instead of calling `api`/`scoringApi`.
 */

export type AgentKind = "internal" | "external";
export type LifecycleStage =
  | "connecting"
  | "collecting"
  | "awaiting_fit"
  | "fitting"
  | "ready"
  | "scoring"
  | "up_to_date"
  | "needs_attention";

export interface FakeLifecycle {
  stage: LifecycleStage;
  threshold: number;
  captured: number;
  reason?: string | null;
}

export interface FakeLatestScore {
  composite_score: number | null;
  ship_decision: "ship" | "needs_work" | "dont_ship" | "provisional";
  scored_at: string;
  superseded_by_unscored_run?: boolean;
}

export interface FakeAgent {
  agent_id: string;
  tenant_id: string;
  name: string;
  kind: AgentKind;
  source_service: string | null;
  lifecycle: FakeLifecycle;
  provisioning_status: "active" | "provisioning" | "failed";
  failure_reason: string | null;
  deactivated_at: string | null;
  deleted_at: string | null;
  created_at: string;
  last_seen_at: string | null;
  forwarded_trace_count: number;
  latest_score: FakeLatestScore | null;
  drop_pressure: { dropped_count: number; last_dropped_at: string | null } | null;
}

export interface FakeFitStatus {
  state:
    | "fitted_auto"
    | "fitted_pinned"
    | "awaiting_traces"
    | "awaiting_fit"
    | "no_applicable_profile"
    | "default";
  profile_name?: string | null;
  has_enabled_checks?: boolean;
  needs_profile_attention?: boolean;
  binding_invalid?: boolean;
  binding_source?: "default" | "auto" | "pinned";
  attention_reason?: "fallback" | "low_confidence" | "no_applicable_profile" | null;
  fallback_class?: "bug" | "expected" | null;
  captured?: number;
  threshold?: number;
}

export interface FakeTenant {
  tenant_id: string;
  name: string;
  kind: AgentKind;
  env?: string;
}

const now = Date.now();
const hoursAgo = (h: number) => new Date(now - h * 3600_000).toISOString();
const daysAgo = (d: number) => new Date(now - d * 86_400_000).toISOString();

export const FAKE_TENANTS: FakeTenant[] = [
  { tenant_id: "tenant-tais", name: "TAIS (Testing AI team)", kind: "external", env: "prod" },
  { tenant_id: "tenant-tar", name: "tricentisairesearch", kind: "internal", env: "prod" },
  { tenant_id: "tenant-acme", name: "Acme Financial", kind: "internal", env: "prod" },
  { tenant_id: "tenant-northwind", name: "Northwind Retail", kind: "external", env: "prod" },
  { tenant_id: "tenant-globex", name: "Globex Engineering", kind: "internal", env: "staging" },
];

export const FAKE_AGENTS: FakeAgent[] = [
  {
    agent_id: "agent-1",
    tenant_id: "tenant-tais",
    name: "ATA Regression Suite",
    kind: "external",
    source_service: "ata-regression-suite",
    lifecycle: { stage: "needs_attention", threshold: 20, captured: 22 },
    provisioning_status: "active",
    failure_reason: null,
    deactivated_at: null,
    deleted_at: null,
    created_at: daysAgo(94),
    last_seen_at: hoursAgo(6),
    forwarded_trace_count: 22,
    latest_score: { composite_score: 84, ship_decision: "needs_work", scored_at: hoursAgo(9) },
    drop_pressure: null,
  },
  {
    agent_id: "agent-2",
    tenant_id: "tenant-tar",
    name: "jira epic poller",
    kind: "internal",
    source_service: "relic-service",
    lifecycle: { stage: "up_to_date", threshold: 20, captured: 97 },
    provisioning_status: "active",
    failure_reason: null,
    deactivated_at: null,
    deleted_at: null,
    created_at: daysAgo(180),
    last_seen_at: hoursAgo(1),
    forwarded_trace_count: 97,
    latest_score: { composite_score: 79.1, ship_decision: "needs_work", scored_at: hoursAgo(3) },
    drop_pressure: null,
  },
  {
    agent_id: "agent-3",
    tenant_id: "tenant-acme",
    name: "invoice-reconciler",
    kind: "internal",
    source_service: "billing-service",
    lifecycle: { stage: "up_to_date", threshold: 20, captured: 214 },
    provisioning_status: "active",
    failure_reason: null,
    deactivated_at: null,
    deleted_at: null,
    created_at: daysAgo(240),
    last_seen_at: hoursAgo(0.5),
    forwarded_trace_count: 214,
    latest_score: { composite_score: 91.4, ship_decision: "ship", scored_at: hoursAgo(2) },
    drop_pressure: null,
  },
  {
    agent_id: "agent-4",
    tenant_id: "tenant-northwind",
    name: "support-triage-bot",
    kind: "external",
    source_service: null,
    lifecycle: { stage: "scoring", threshold: 20, captured: 58 },
    provisioning_status: "active",
    failure_reason: null,
    deactivated_at: null,
    deleted_at: null,
    created_at: daysAgo(60),
    last_seen_at: hoursAgo(0.1),
    forwarded_trace_count: 58,
    latest_score: { composite_score: 61.2, ship_decision: "dont_ship", scored_at: daysAgo(1) },
    drop_pressure: null,
  },
  {
    agent_id: "agent-5",
    tenant_id: "tenant-globex",
    name: "code-review-assistant",
    kind: "internal",
    source_service: "review-gateway",
    lifecycle: { stage: "collecting", threshold: 20, captured: 6 },
    provisioning_status: "provisioning",
    failure_reason: null,
    deactivated_at: null,
    deleted_at: null,
    created_at: daysAgo(3),
    last_seen_at: hoursAgo(4),
    forwarded_trace_count: 6,
    latest_score: null,
    drop_pressure: null,
  },
  {
    agent_id: "agent-6",
    tenant_id: "tenant-acme",
    name: "expense-classifier",
    kind: "internal",
    source_service: "billing-service",
    lifecycle: { stage: "connecting", threshold: 20, captured: 0, reason: "provision_failed" },
    provisioning_status: "failed",
    failure_reason: "Model deployment failed: quota exceeded for claude-sonnet-4-6 in region us-east-1.",
    deactivated_at: null,
    deleted_at: null,
    created_at: daysAgo(2),
    last_seen_at: null,
    forwarded_trace_count: 0,
    latest_score: null,
    drop_pressure: null,
  },
  {
    agent_id: "agent-7",
    tenant_id: "tenant-northwind",
    name: "returns-approval-agent",
    kind: "external",
    source_service: null,
    lifecycle: { stage: "ready", threshold: 20, captured: 20, reason: null },
    provisioning_status: "active",
    failure_reason: null,
    deactivated_at: daysAgo(10),
    deleted_at: null,
    created_at: daysAgo(120),
    last_seen_at: daysAgo(11),
    forwarded_trace_count: 20,
    latest_score: { composite_score: 88, ship_decision: "ship", scored_at: daysAgo(11), superseded_by_unscored_run: true },
    drop_pressure: { dropped_count: 14, last_dropped_at: hoursAgo(2) },
  },
  {
    agent_id: "agent-8",
    tenant_id: "tenant-tais",
    name: "legacy-triage-bot",
    kind: "external",
    source_service: null,
    lifecycle: { stage: "up_to_date", threshold: 20, captured: 340 },
    provisioning_status: "active",
    failure_reason: null,
    deactivated_at: null,
    deleted_at: daysAgo(5),
    created_at: daysAgo(300),
    last_seen_at: daysAgo(5),
    forwarded_trace_count: 340,
    latest_score: { composite_score: 72, ship_decision: "needs_work", scored_at: daysAgo(5) },
    drop_pressure: null,
  },
];

export const FAKE_FIT_STATUS: Record<string, FakeFitStatus> = {
  "agent-1": { state: "fitted_auto", profile_name: "ATA Regression Profile", has_enabled_checks: true, needs_profile_attention: true, attention_reason: "low_confidence", binding_source: "auto" },
  "agent-2": { state: "fitted_pinned", profile_name: "Internal Automation Profile", has_enabled_checks: true, binding_source: "pinned" },
  "agent-3": { state: "fitted_auto", profile_name: "Finance Ops Profile", has_enabled_checks: true, binding_source: "auto" },
  "agent-4": { state: "fitted_auto", profile_name: "Customer Support Profile", has_enabled_checks: true, needs_profile_attention: true, attention_reason: "fallback", fallback_class: "expected", binding_source: "auto" },
  "agent-5": { state: "awaiting_traces", captured: 6, threshold: 20 },
  "agent-6": { state: "awaiting_fit" },
  "agent-7": { state: "fitted_auto", profile_name: "Customer Support Profile", has_enabled_checks: true, binding_source: "auto", binding_invalid: true },
  "agent-8": { state: "no_applicable_profile", needs_profile_attention: true, attention_reason: "no_applicable_profile" },
};

export function getFakeTenant(tenantId: string): FakeTenant | undefined {
  return FAKE_TENANTS.find((t) => t.tenant_id === tenantId);
}

export function getFakeAgent(agentId: string): FakeAgent | undefined {
  return FAKE_AGENTS.find((a) => a.agent_id === agentId);
}

export interface FakeFlatAgentItem {
  agent: FakeAgent;
  tenant_id: string;
  tenant_name: string;
  fit_status: FakeFitStatus | null;
}

export function toFlatItem(agent: FakeAgent): FakeFlatAgentItem {
  return {
    agent,
    tenant_id: agent.tenant_id,
    tenant_name: getFakeTenant(agent.tenant_id)?.name ?? agent.tenant_id,
    fit_status: FAKE_FIT_STATUS[agent.agent_id] ?? null,
  };
}

export interface ListAgentsFlatFakeParams {
  limit?: number;
  offset?: number;
  includeDeleted?: boolean;
  q?: string;
  tenantId?: string | string[];
  kind?: string | string[];
  source?: string | string[];
  sort?: "last_active" | "name" | "score";
  dir?: "asc" | "desc";
}

function matchesArrayFilter(value: string | null | undefined, filter: string | string[] | undefined): boolean {
  if (!filter || (Array.isArray(filter) && filter.length === 0)) return true;
  const list = Array.isArray(filter) ? filter : [filter];
  return value != null && list.includes(value);
}

/** Client-side stand-in for `GET /admin/agents` — filters/sorts/paginates the
 *  fixed fake roster the same way the real endpoint would. */
export function listAgentsFlat(params: ListAgentsFlatFakeParams = {}): { items: FakeFlatAgentItem[]; total: number } {
  const { limit = 25, offset = 0, includeDeleted, q, tenantId, kind, source, sort = "last_active", dir = "desc" } = params;
  let rows = FAKE_AGENTS.filter((a) => includeDeleted || !a.deleted_at);
  if (q) {
    const needle = q.toLowerCase();
    rows = rows.filter((a) => a.name.toLowerCase().includes(needle));
  }
  rows = rows.filter((a) => matchesArrayFilter(a.tenant_id, tenantId));
  rows = rows.filter((a) => matchesArrayFilter(a.kind, kind));
  rows = rows.filter((a) => matchesArrayFilter(a.source_service, source));

  const sorted = [...rows].sort((a, b) => {
    let cmp = 0;
    if (sort === "name") cmp = a.name.localeCompare(b.name);
    else if (sort === "score") cmp = (a.latest_score?.composite_score ?? -1) - (b.latest_score?.composite_score ?? -1);
    else cmp = (a.last_seen_at ? new Date(a.last_seen_at).getTime() : 0) - (b.last_seen_at ? new Date(b.last_seen_at).getTime() : 0);
    return dir === "asc" ? cmp : -cmp;
  });

  const total = sorted.length;
  const items = sorted.slice(offset, offset + limit).map(toFlatItem);
  return { items, total };
}

export interface ListAgentGroupsFakeParams {
  by: "tenant" | "source" | "kind";
  q?: string;
  includeDeleted?: boolean;
  tenantId?: string;
  kind?: "internal" | "external";
}

export function listAgentGroups(params: ListAgentGroupsFakeParams): { groups: { key: string; label: string; count: number; rollup: { total_traces: number; last_active: string | null; scored_count: number } }[] } {
  const { by, q, includeDeleted, tenantId, kind } = params;
  let rows = FAKE_AGENTS.filter((a) => includeDeleted || !a.deleted_at);
  if (q) {
    const needle = q.toLowerCase();
    rows = rows.filter((a) => a.name.toLowerCase().includes(needle));
  }
  if (tenantId) rows = rows.filter((a) => a.tenant_id === tenantId);
  if (kind) rows = rows.filter((a) => a.kind === kind);

  const keyOf = (a: FakeAgent) => (by === "tenant" ? a.tenant_id : by === "kind" ? a.kind : a.source_service ?? "none");
  const labelOf = (key: string) => (by === "tenant" ? getFakeTenant(key)?.name ?? key : key);

  const byKey = new Map<string, FakeAgent[]>();
  for (const a of rows) {
    const key = keyOf(a);
    const bucket = byKey.get(key);
    if (bucket) bucket.push(a);
    else byKey.set(key, [a]);
  }

  return {
    groups: [...byKey.entries()].map(([key, agents]) => ({
      key,
      label: labelOf(key),
      count: agents.length,
      rollup: {
        total_traces: agents.reduce((sum, a) => sum + a.forwarded_trace_count, 0),
        last_active: agents.reduce<string | null>((latest, a) => (!a.last_seen_at ? latest : !latest || a.last_seen_at > latest ? a.last_seen_at : latest), null),
        scored_count: agents.filter((a) => a.latest_score?.composite_score != null).length,
      },
    })),
  };
}
