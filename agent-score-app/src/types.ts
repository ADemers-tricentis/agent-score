export type AgentKind = "external" | "internal";
export type ProvisioningStatus = "pending" | "active" | "failed";
export type AgentType = "ATA" | "ATC" | "CURA" | "AI_WORKSPACE" | "CODING" | "APT";
export type Grade = "A" | "B" | "C" | "D" | "F";
export type Verdict = "Ship" | "Review" | "Block";
export type SessionVerdict = "PASS" | "PARTIAL" | "FAIL";
export type Reliability = "RELIABLE" | "NEEDS_WORK" | "UNSTABLE";

export type DimensionKey =
  // Core (REQ-003)
  | "benchmarkPerformance"
  | "valueEfficiency"
  | "uxSignal"
  // Extended, commonly enabled (REQ-004)
  | "harmony"
  | "stability"
  | "agency"
  | "groundedness"
  | "instructionFollowing"
  | "transparency"
  | "robustness"
  | "communication";

export interface DimensionScore {
  score: number; // 0-100
  passed?: boolean;
  sigs: string[]; // raw signal strings, e.g. "task_success: 0.92"
  rawDeltaPct?: number;
}

// Mirrors the documented AgentProfile shape from the API reference, plus
// display-only fields this UI needs that a real client would fetch/derive
// from separate endpoints (scoring, traces) — kept clearly separated so a
// future real-client swap is obvious.
export interface Agent {
  agent_id: string;
  tenant_id: string;
  name: string;
  kind: AgentKind;
  agentType: AgentType;
  langfuse_project_id: string | null;
  provisioning_status: ProvisioningStatus;
  created_at: string; // ISO
  updated_at: string; // ISO

  // Derived/display fields (would come from scoring + trace endpoints in a real client)
  traceCount: number; // total ingested traces, all-time
  traceCount24h: number;
  p95LatencyMs24h: number | null;
  tokenSpend24hUsd: number | null;
  errorCount24h: number;
  compositeScore: number | null; // null until readiness.ready
  grade: Grade | null;
  verdict: Verdict | null;
  dimensionScores: Partial<Record<DimensionKey, DimensionScore>>;
  reliability: Reliability | null;
  isLive: boolean; // live status dot in header
  hasCriticalSafetyIssue: boolean;
  hasHighSafetyIssue: boolean;
  safetyDetail?: string;
}

export interface Readiness {
  captured: number; // sessions captured so far
  threshold: number; // 20, per REQ-006
  ready: boolean;
}

export interface Trace {
  id: string;
  ts: string; // ISO
  name: string; // scenario/span name
  durationMs: number;
  tokenCostUsd: number | null;
  status: "ok" | "error";
  verdict?: SessionVerdict;
}

export interface ScoringRun {
  id: string;
  agentId: string;
  label: string;
  mode: "production" | "sandbox";
  startedAt: string; // ISO
  completedAt: string | null; // null while in progress
  sessionCount: number;
  passRate: number; // 0-100
  compositeScore: number | null;
  grade: Grade | null;
  verdict: Verdict | null;
  inProgress: boolean;
}

// --- Milestone 2 additions --------------------------------------------------

export interface ScoringProfileSummary {
  name: string;
  version: number;
  evalCount: number;
  dimensions: DimensionKey[];
  verdictBands: { ship: number; shipWithNotes: number; review: number; block: number };
}

export interface JudgeInfo {
  name: string;
  provider: "Anthropic" | "AWS Bedrock" | "OpenAI-compatible";
  model: string;
  /** Plain-language explanation of why this judge was auto-selected for this agent type. */
  rationale: string;
}

export interface AttributionChainStep {
  step: string;
  detail: string;
  isCulprit: boolean;
}

export interface Attribution {
  /** Plain-language root cause category, e.g. "Picked the wrong tool". */
  rootCause: string;
  confidence: number; // 0-100
  agentFault: boolean;
  chain: AttributionChainStep[];
  recommendations: string[];
}

export interface ShipDecision {
  decision: "Ship" | "Hold" | "Reject";
  rationale: string;
  author: string;
  ts: string;
  overridesVerdict: boolean;
}

export interface SafetyOverride {
  severity: "Critical" | "High";
  signal: string;
  detail: string;
}

export interface Session {
  id: string;
  runId: string;
  agentId: string;
  scenario: string;
  ts: string;
  durationMs: number;
  verdict: SessionVerdict;
  compositeScore: number;
  grade: Grade;
  dimensionScores: Partial<Record<DimensionKey, DimensionScore>>;
  safetyOverride?: SafetyOverride;
  attribution?: Attribution; // present when verdict !== "PASS"
  shipDecision?: ShipDecision;
}

export interface ScoringRunDetail extends ScoringRun {
  sessions: Session[];
}

export type SpanKind = "agent" | "llm" | "tool";

export interface SpanNode {
  id: string;
  kind: SpanKind;
  name: string;
  startOffsetMs: number;
  durationMs: number;
  tokens?: number;
  costUsd?: number;
  input?: string;
  output?: string;
  children: SpanNode[];
}

export interface TraceDetail extends Trace {
  spans: SpanNode[];
}

export interface LabelingCandidate {
  id: string;
  traceId: string;
  traceName: string;
  ts: string;
  /** Why it's in the queue, e.g. "Low-confidence Pending verdict". */
  reason: string;
  suggestedVerdict: SessionVerdict;
}

export interface Golden {
  id: string;
  traceName: string;
  confirmedAt: string;
  decision: "confirm" | "override";
  note?: string;
}

export interface AgentSettingsData {
  verdictBands: { ship: number; review: number; block: number };
  traceSamplingRatePct: number;
  provisioningStatus: ProvisioningStatus;
  langfuseProjectId: string | null;
  createdByEmail: string;
  workspaceId: string;
}

export interface FingerprintMatch {
  profileName: string;
  confidence: number;
  sessionCount: number;
}

export interface DescribeAgentResult {
  matchedProfileName: string;
  confidence: number;
  evalsToAdd: string[];
  evalsToRemove: string[];
  weightAdjustments: { name: string; from: number; to: number }[];
  noChangesNeeded: boolean;
}

export interface DescribeAgentGuidedInput {
  whatItDoes: string;
  neverDo: string;
  mainConcern: string;
}

// --- Home inbox --------------------------------------------------------------

export type InboxSeverity = "critical" | "warning";

export interface InboxSessionItem {
  kind: "session";
  agentId: string;
  runId: string;
  runLabel: string;
  session: Session;
}

export interface InboxLabelingItem {
  kind: "labeling";
  agentId: string;
  candidate: LabelingCandidate;
}

export type InboxItem = InboxSessionItem | InboxLabelingItem;

export interface AgentInboxGroup {
  agentId: string;
  agentName: string;
  agentType: AgentType;
  severity: InboxSeverity;
  /** Plain-language summary of the single worst item. */
  topReason: string;
  items: InboxItem[];
  /** Flagged sessions from the latest run beyond the small cap surfaced in `items`. */
  hiddenSessionCount: number;
}

export interface RestingAgentSummary {
  agentId: string;
  agentName: string;
  agentType: AgentType;
  status: "ship" | "onboarding";
  /** Only present when status === "onboarding". */
  captured?: number;
  threshold?: number;
}
