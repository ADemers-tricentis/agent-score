export type Verdict = "PASS" | "PARTIAL" | "FAIL";
export type ProjectType = "ATA" | "ATC" | "CURA" | "AI_WORKSPACE" | "CODING" | "APT";
export type Reliability = "RELIABLE" | "NEEDS_WORK" | "UNSTABLE";
export type GuardDecision = "allow" | "warn" | "block";
export type GuardRule = "R1" | "R2" | "R3" | null;
export type RootCause =
  | "credential_exposure"
  | "hallucinated_state"
  | "tool_selection_error"
  | "pii_exposure";
export type SafetySignal =
  | "prompt_injection_detected"
  | "credential_exposure"
  | "pii_leak"
  | "path_violation";

export interface DimensionScore {
  score: number;
  passed?: boolean;
  sigs: string[];
  rawDeltaPct?: number;
}

export interface AttributionChainStep {
  n: number;
  tool: string;
  desc: string;
  culprit: boolean;
}

export interface Attribution {
  rootCause: RootCause;
  confidence: number;
  agentFault: boolean;
  chain: AttributionChainStep[];
  recs: string[];
}

export interface SafetyOverride {
  signal: SafetySignal;
  severity: "Critical" | "High";
  detail: string;
}

export interface ShipDecision {
  decision: "Ship" | "Hold" | "Reject";
  rationale: string;
  author: string;
  ts: string;
  overridesVerdict: boolean;
}

export interface Session {
  id: string;
  ts: string;
  dur: number;
  scenario: string;
  verdict: Verdict;
  baseline: number | null;
  safetyOverride?: SafetyOverride;
  labeled?: boolean;
  scores: {
    benchmarkPerformance: DimensionScore;
    valueEfficiency: DimensionScore | null;
    uxSignal: DimensionScore;
    harmony?: DimensionScore;
    stability?: DimensionScore;
    agency?: DimensionScore;
    // Extended dimensions (Gap 2)
    groundedness?: DimensionScore;
    instructionFollowing?: DimensionScore;
    transparency?: DimensionScore;
    robustness?: DimensionScore;
    communication?: DimensionScore;
  };
  attr?: Attribution;
  shipDecision?: ShipDecision;
  atcBeta?: boolean;
}

export type RunState = "collecting" | "scoring" | "scored" | "error";

export interface Run {
  id: string;
  label: string;
  date: string;
  sessions: Session[];
  regradedWithProfileVersion?: number;
  status: RunState;
}

export type ActivityEventKind =
  | "profile_adopted"
  | "run_completed"
  | "milestone_reached"
  | "decision_override"
  | "profile_version_changed"
  | "regrade_completed";

export interface ActivityEvent {
  id: string;
  kind: ActivityEventKind;
  ts: string;
  title: string;
  detail: string;
  author?: string;
}

export type AgentLifecycleStatus = "active" | "provisioning" | "deactivated" | "deleted";

export interface Project {
  id: string;
  name: string;
  service: string;
  type: ProjectType;
  phase: 1 | 2;
  reliability: Reliability;
  runs: Run[];
  tenantId?: string;
  adoptedProfileId?: string;
  llmJudgeId?: string;
  traceSampleRate?: number;
  fingerprintMatchedAt?: string;
  fingerprintConfidence?: number;
  fingerprintSessionCount?: number;
  events?: ActivityEvent[];
  lifecycleStatus?: AgentLifecycleStatus;
  autonomousScoringEnabled?: boolean;
  refreshCadenceMinutes?: number | null;
  refreshLookbackDays?: number | null;
}

// ── Preview role (demo-only presenter control, not a real account attribute) ──

export type PreviewRole = "admin" | "member";

// ── Tenants & staff users ────────────────────────────────────────────────────

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  plan: "Pilot" | "Standard" | "Enterprise";
  status: "active" | "trial";
  createdAt: string;
}

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "member";
  tenantIds: string[];
  lastActive: string;
}

// ── Agent Registry (slots, immutable versions, scope bindings) ───────────────

export type RegistrySlotSlug =
  | "agent_card"
  | "chat_assistant"
  | "improvement_advisor"
  | "profile_fit"
  | "scoring_judge";

export interface RegistrySlot {
  id: string;
  slug: RegistrySlotSlug;
  name: string;
  description: string | null;
  outputContract: Record<string, unknown>;
  toolAllowlist: string[];
  readOnly: boolean;
  priorityClass: string;
}

export interface AgentVersion {
  id: string;
  slotId: string;
  tenantId: string | null; // null = global
  versionNumber: number;
  name: string;
  instructions: string;
  toolAllowlist: string[];
  modelProvider: string;
  modelId: string;
  dollarCeilingUsd: string;
  turnCap: number | null;
  wallClockCapSeconds: number | null;
  baseVersionId: string | null;
  createdAt: string;
  createdByUserId: string | null;
  revokedAt: string | null;
}

export interface SlotBinding {
  id: string;
  slotId: string;
  tenantId: string | null; // null = global
  agentVersionId: string;
  createdAt: string;
  updatedAt: string;
  updatedByUserId: string | null;
}

export interface SlotBindingImpact {
  id: string;
  slotSlug: RegistrySlotSlug;
  tenantId: string | null;
  isGlobal: boolean;
}

// ── Access requests ────────────────────────────────────────────────────────

export type AccessRequestState = "waiting" | "declined" | "approved";

export interface ExistingUserRef {
  userId: string;
  deleted: boolean;
}

export interface AccessRequest {
  id: string;
  email: string;
  requestedAt: string;
  state: AccessRequestState;
  declinedAt: string | null;
  approvedAt: string | null;
  existingUser: ExistingUserRef | null;
}

// ── Improvement advice ────────────────────────────────────────────────────

export type AdvicePriority = "high" | "medium" | "low";

export interface Recommendation {
  title: string;
  priority: AdvicePriority;
  rationale: string;
  recommendation: string;
  evidenceCount: number;
}

export interface AdviceRequest {
  id: string;
  projectId: string;
  createdAt: string;
  status: "succeeded" | "failed";
  recommendations: Recommendation[];
}

// ── Agent card ─────────────────────────────────────────────────────────────

export interface AgentCardTool {
  name: string;
  calls: number;
  successRate: number;
}

export interface AgentCard {
  projectId: string;
  createdAt: string;
  purpose: string;
  tools: AgentCardTool[];
  behavioralPatterns: string[];
  successCriteria: string[];
  failureModes: string[];
}

// ── Reports (cross-tenant usage) ──────────────────────────────────────────

export interface UsageTenantRow {
  tenantId: string;
  tenantName: string;
  isDeleted: boolean;
  activeAgents: number;
  traces: number;
  avgTracesPerActiveAgent: number | null;
  evalResults: number;
  profileFits: number;
  agentCards: number;
  costUsd: string;
  costScoringUsd: string;
  costProfileFitUsd: string;
  costAgentCardUsd: string;
  costOtherUsd: string;
  avgCostPerEvalResult: string | null;
  avgCostPerProfileFit: string | null;
  avgCostPerAgentCard: string | null;
}

export interface UsageAgentRow {
  agentId: string;
  agentName: string;
  tenantId: string;
  tenantName: string;
  traces: number;
  evalResults: number;
  profileFits: number;
  agentCards: number;
  costUsd: string;
  costScoringUsd: string;
  costProfileFitUsd: string;
  costAgentCardUsd: string;
  costOtherUsd: string;
  avgCostPerEvalResult: string | null;
  avgCostPerProfileFit: string | null;
  avgCostPerAgentCard: string | null;
}

export interface UsageReport {
  windowFrom: string;
  windowTo: string;
  tenants: UsageTenantRow[];
  agents: UsageAgentRow[];
}

export interface GuardLogEntry {
  ts: string;
  proj: string;
  sess: string;
  tool: string;
  fingerprint: string;
  rule: GuardRule;
  dec: GuardDecision;
  reason: string;
}

export type AgentTab = "score" | "improve" | "card" | "traces" | "profile" | "labeling" | "settings";

export type View =
  | { name: "home" }
  | { name: "agents" }
  | { name: "agent"; projectId: string; tab?: AgentTab; initialTraceId?: string }
  | { name: "agent-run"; projectId: string; runId: string }
  | { name: "session"; projectId: string; runId: string; sessionId: string }
  | { name: "score-breakdown"; projectId: string; runId: string; sessionId: string }
  | { name: "compare-runs"; projectId: string; runIdA: string; runIdB: string }
  | { name: "eval-design"; projectId: string }
  | { name: "metrics" }
  | { name: "llm-judges" }
  | { name: "add-judge" }
  | { name: "integrations" }
  | { name: "add-agent" }
  | { name: "profiles" }
  | { name: "profile"; profileId: string }
  | { name: "add-profile" }
  | { name: "dimensions" }
  | { name: "demo-gallery" }
  | { name: "getting-started" }
  | { name: "chat-scoring"; projectId: string }
  | { name: "tenants" }
  | { name: "users"; tab?: "list" | "requests" }
  | { name: "add-user"; email?: string; requestId?: string }
  | { name: "agent-registry"; tenantId?: string }
  | { name: "registry-slot"; slotSlug: string; tenantId?: string }
  | { name: "registry-version"; slotSlug: string; versionId: string; tenantId?: string }
  | { name: "registry-version-new"; slotSlug: string; fromVersionId?: string; tenantId?: string }
  | { name: "reports"; tab?: "usage"; range?: string }
  | { name: "tenant-usage"; tenantId: string; range?: string }
  | { name: "llm-catalog" };

export type LLMProvider = "Anthropic" | "AWS Bedrock" | "OpenAI-compatible";

export interface LLMJudge {
  id: string;
  name: string;
  description: string;
  provider: LLMProvider;
  model: string;
  createdAt: string;
  status: "live" | "error";
}

// ── LLM Catalog (usage, pricing, routing) ────────────────────────────────────

export interface LLMPricingRow {
  id: string;
  judgeId: string;
  model: string;
  inputPer1M: number;
  outputPer1M: number;
  cacheReadPer1M: number;
  cacheWritePer1M: number;
  effectiveDate: string;
}

export interface LLMUsageLogEntry {
  id: string;
  ts: string;
  judgeId: string;
  task: string;
  tokens: number;
  costUsd: number;
}

export interface LLMRoutingAssignment {
  id: string;
  taskSlot: string;
  judgeId: string;
}

// ── Evaluation Design types ──────────────────────────────────────────────────

export type CalibrationCategory = "nightmare" | "reality" | "dream";
export type Directionality = "higher_is_better" | "lower_is_better";
export type ShowcaseCategory =
  | "Safety"
  | "Correctness"
  | "Relevance"
  | "Efficiency"
  | "Consistency"
  | "Tool Use"
  | "Instruction Following"
  | "Groundedness"
  | "Transparency"
  | "Robustness"
  | "Communication";

export interface CalibrationScenario {
  id: string;
  category: CalibrationCategory;
  title: string;
  description: string;
  inputData: string;
  expectedBehavior: string;
  confirmed: boolean;
}

export interface SuggestedDimension {
  name: ShowcaseCategory;
  directionality: Directionality;
  suggestedThreshold: number;
  rationale: string;
  source: "observed_failure" | "observed_behavior" | "spec_derived";
}

export interface MeasurementRecommendation {
  generatedAt: string;
  shadowSessionCount: number;
  suggestedDimensions: SuggestedDimension[];
  calibrationSeed: CalibrationScenario[];
  status: "pending_review" | "confirmed" | "dismissed";
}

export interface EvalQuestion {
  id: string;
  rank: number;
  showcaseCategory: ShowcaseCategory;
  question: string;
  behaviorClass: "permissible" | "impermissible";
  taskDefinition: string;
  testDimensions: string[];
  requiredData: string;
  candidateMeasure: string;
  judgeCriteria: string;
  specCitation: string;
  directionality: Directionality;
  riskLevel: "high" | "medium" | "low";
  selected: boolean;
}

export interface EvalDesign {
  projectId: string;
  status: "no_design" | "observation_ready" | "confirmed";
  confirmedDimensions: SuggestedDimension[];
  calibrationSet: CalibrationScenario[];
  measurementRecommendation?: MeasurementRecommendation;
}

// ── Scoring Profiles ─────────────────────────────────────────────────────────

export type VerdictBandKey = "ship" | "review" | "block";

export type EvalKind = "library_metric" | "llm_judge" | "hybrid" | "decision_tree";

export interface ProfileEntry {
  id: string;
  evalSlug: string;
  evalName: string;
  evalKind: EvalKind;
  dimension: ShowcaseCategory;
  threshold: number;
  weight: number;
  enabled: boolean;
  question: string;
  taskDefinition: string;
  judgeCriteria: string;
  behaviorClass: "permissible" | "impermissible";
  riskLevel: "high" | "medium" | "low";
  directionality: Directionality;
}

export interface ProfileVersion {
  id: string;
  version: number;
  dimensionWeights: Partial<Record<ShowcaseCategory, number>>;
  verdictBands: Record<VerdictBandKey, number>;
  entries: ProfileEntry[];
  createdAt: string;
}

export interface ScoringProfile {
  id: string;
  slug: string;
  name: string;
  description: string;
  agentType: ProjectType;
  status: "active" | "archived";
  versions: ProfileVersion[];
  createdAt: string;
  origin?: "manual" | "auto";
  autoGenReason?: string;
}
