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
  scores: {
    benchmarkPerformance: DimensionScore;
    valueEfficiency: DimensionScore | null;
    uxSignal: DimensionScore;
    harmony?: DimensionScore;
    stability?: DimensionScore;
    agency?: DimensionScore;
  };
  attr?: Attribution;
  shipDecision?: ShipDecision;
  atcBeta?: boolean;
}

export interface Run {
  id: string;
  label: string;
  date: string;
  sessions: Session[];
}

export interface Project {
  id: string;
  name: string;
  service: string;
  type: ProjectType;
  phase: 1 | 2;
  reliability: Reliability;
  runs: Run[];
  adoptedProfileId?: string;
  traceSampleRate?: number;
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

export type View =
  | { name: "fleet" }
  | { name: "project"; projectId: string }
  | { name: "run"; projectId: string; runId: string }
  | { name: "session"; projectId: string; runId: string; sessionId: string }
  | { name: "compare-runs"; projectId: string; runIdA: string; runIdB: string }
  | { name: "eval-design"; projectId: string }
  | { name: "guard-log" }
  | { name: "metrics" }
  | { name: "llm-judges" }
  | { name: "add-judge" }
  | { name: "integrations" }
  | { name: "add-agent" }
  | { name: "profiles" }
  | { name: "profile"; profileId: string }
  | { name: "add-profile" };

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

export type VerdictBandKey = "ship" | "ship_note" | "review" | "block_rec";

export interface ProfileEntry {
  id: string;
  evalSlug: string;
  evalName: string;
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
}
