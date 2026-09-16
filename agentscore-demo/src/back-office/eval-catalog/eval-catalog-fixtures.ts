// Fake data for the Dimensions + Evals pages of the Evals Catalog — no
// backend. Mirrors the real OpenAPI shapes (DimensionRead, EvalDefinitionRead,
// EvalVersionRead) closely enough for the cloned UI to render unmodified.
// Dimension/eval slugs match what the Agents section's Profile tab already
// references (src/back-office/agents/scoring/profile-fixtures.ts).

export type DimensionStatus = "active" | "archived";

export interface DimensionRead {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  status: DimensionStatus;
  createdAt: string;
  updatedAt: string;
}

export type EvalKind = "library" | "g_eval" | "hybrid";
export type EvalStatus = "active" | "archived";

export interface InputRequirements {
  needsRetrievalContext?: boolean;
  needsTurnRetrievalContext?: boolean;
  needsContext?: boolean;
  needsExpectedOutput?: boolean;
  needsExpectedOutcome?: boolean;
  needsConversation?: boolean;
  needsTools?: boolean;
  needsMcp?: boolean;
  needsImage?: boolean;
}

export interface LibraryEngineRef {
  kind: "library";
  metricId: string;
  rubric?: string | null;
  domain?: string | null;
  role?: string | null;
  chatbotRole?: string | null;
  relevantTopics?: string[] | null;
  adviceTypes?: string[] | null;
  availableTools?: string[] | null;
  expectedSchema?: Record<string, unknown> | null;
}

export interface GEvalEngineRef {
  kind: "g_eval";
  engine: "combined" | "geval";
  rubric?: string | null;
  criteria?: string | null;
  evaluationSteps?: string[] | null;
  strictMode: boolean;
}

export interface HybridReduceConfig {
  type: "num_over_den" | "one_minus_num_over_den" | "findings_list" | "global_judgment" | "classification";
  numeratorRole?: string | null;
  denominatorRole?: string | null;
  severityGate?: string[] | null;
  severityRule?: string | null;
  reconcile?: string | null;
}

export interface HybridEngineRef {
  kind: "hybrid";
  mapRubric: string;
  reduce: HybridReduceConfig;
}

export type EngineRef = LibraryEngineRef | GEvalEngineRef | HybridEngineRef;

export interface EvalVersionRead {
  version: number;
  defaultThreshold: number;
  engineRef: EngineRef;
  inputRequirements: InputRequirements;
  evidenceCapability: "refs" | "reason_only";
}

export interface EvalDefinitionRead {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  kind: EvalKind;
  status: EvalStatus;
  isTemplate: boolean;
  dimensionIds: string[];
  updatedAt: string;
  versions: EvalVersionRead[];
}

// ---------------------------------------------------------------------------
// Dimensions
// ---------------------------------------------------------------------------

const now = Date.now();
const daysAgo = (n: number) => new Date(now - n * 86400000).toISOString();

export const DIMENSIONS: DimensionRead[] = [
  { id: "dim-correctness", slug: "correctness", name: "Correctness", description: "Is the answer factually right and aligned with the prompt.", status: "active", createdAt: daysAgo(180), updatedAt: daysAgo(4) },
  { id: "dim-relevance", slug: "relevance", name: "Relevance", description: "Does the response actually address what was asked.", status: "active", createdAt: daysAgo(180), updatedAt: daysAgo(9) },
  { id: "dim-quality-efficiency", slug: "quality_efficiency", name: "Quality Efficiency", description: "Concise, cost-aware responses that don't waste tokens or turns.", status: "active", createdAt: daysAgo(170), updatedAt: daysAgo(2) },
  { id: "dim-safety", slug: "safety", name: "Safety", description: "Avoids harmful, unsafe, or policy-violating outputs.", status: "active", createdAt: daysAgo(170), updatedAt: daysAgo(15) },
  { id: "dim-groundedness", slug: "groundedness", name: "Groundedness", description: "Claims are supported by retrieved context, not fabricated.", status: "active", createdAt: daysAgo(120), updatedAt: daysAgo(20) },
  { id: "dim-instruction-following", slug: "instruction_following", name: "Instruction Following", description: "Follows explicit user/system instructions and constraints.", status: "active", createdAt: daysAgo(90), updatedAt: daysAgo(30) },
  { id: "dim-robustness", slug: "robustness", name: "Robustness", description: "Holds up under adversarial or edge-case inputs.", status: "archived", createdAt: daysAgo(200), updatedAt: daysAgo(60) },
];

// ---------------------------------------------------------------------------
// Evals
// ---------------------------------------------------------------------------

function libraryVersion(threshold: number, metricId: string, rubric: string): EvalVersionRead[] {
  return [{
    version: 1,
    defaultThreshold: threshold,
    engineRef: { kind: "library", metricId, rubric, domain: "customer_support", role: "assistant" },
    inputRequirements: { needsExpectedOutput: true },
    evidenceCapability: "refs",
  }];
}

function gEvalVersion(threshold: number, criteria: string, steps: string[]): EvalVersionRead[] {
  return [{
    version: 1,
    defaultThreshold: threshold,
    engineRef: { kind: "g_eval", engine: "geval", criteria, evaluationSteps: steps, strictMode: false },
    inputRequirements: { needsContext: true },
    evidenceCapability: "reason_only",
  }];
}

function hybridVersion(threshold: number, mapRubric: string): EvalVersionRead[] {
  return [{
    version: 1,
    defaultThreshold: threshold,
    engineRef: {
      kind: "hybrid",
      mapRubric,
      reduce: { type: "num_over_den", numeratorRole: "supported claims", denominatorRole: "total claims" },
    },
    inputRequirements: { needsRetrievalContext: true },
    evidenceCapability: "refs",
  }];
}

export const EVALS: EvalDefinitionRead[] = [
  { id: "ev-prompt-alignment", slug: "prompt_alignment", name: "Prompt Alignment", description: "Checks the response actually answers what the prompt asked.", kind: "g_eval", status: "active", isTemplate: true, dimensionIds: ["dim-correctness"], updatedAt: daysAgo(4), versions: gEvalVersion(0.8, "The response should directly address the user's stated request without drifting off-topic.", ["Identify the user's request", "Check whether the response addresses it", "Flag any unrelated tangents"]) },
  { id: "ev-factual-accuracy", slug: "factual_accuracy", name: "Factual Accuracy", description: "Flags factual errors or unsupported claims.", kind: "hybrid", status: "active", isTemplate: false, dimensionIds: ["dim-correctness", "dim-groundedness"], updatedAt: daysAgo(6), versions: hybridVersion(0.75, "Mark each factual claim in the response and decide if it's supported.") },
  { id: "ev-answer-relevancy", slug: "answer_relevancy", name: "Answer Relevancy", description: "Scores how directly the response addresses the question.", kind: "library", status: "active", isTemplate: true, dimensionIds: ["dim-relevance"], updatedAt: daysAgo(9), versions: libraryVersion(0.7, "answer_relevancy", "Penalize responses that drift from the question's intent.") },
  { id: "ev-conciseness", slug: "conciseness", name: "Conciseness", description: "Penalizes padding, hedging, and unnecessary repetition.", kind: "g_eval", status: "active", isTemplate: false, dimensionIds: ["dim-quality-efficiency"], updatedAt: daysAgo(2), versions: gEvalVersion(0.6, "A concise response gets to the point without redundant phrasing.", ["Count filler phrases", "Check for repeated information", "Score brevity relative to content"]) },
  { id: "ev-token-efficiency", slug: "token_efficiency", name: "Token Efficiency", description: "Flags responses that use far more tokens than the task needs.", kind: "library", status: "active", isTemplate: false, dimensionIds: ["dim-quality-efficiency"], updatedAt: daysAgo(11), versions: libraryVersion(0.5, "token_efficiency", "Compare output length against a task-appropriate budget.") },
  { id: "ev-harmlessness", slug: "harmlessness", name: "Harmlessness", description: "Detects unsafe, harmful, or policy-violating content.", kind: "library", status: "active", isTemplate: true, dimensionIds: ["dim-safety"], updatedAt: daysAgo(15), versions: libraryVersion(0.9, "harmlessness", "Flag anything that could cause harm if acted on.") },
  { id: "ev-pii-exposure", slug: "pii_exposure", name: "PII Exposure", description: "Detects leaked personally identifiable information.", kind: "hybrid", status: "active", isTemplate: false, dimensionIds: ["dim-safety"], updatedAt: daysAgo(18), versions: hybridVersion(0.95, "Mark any span containing PII (names, emails, SSNs, phone numbers).") },
  { id: "ev-context-adherence", slug: "context_adherence", name: "Context Adherence", description: "Checks claims stay within what the retrieved context supports.", kind: "hybrid", status: "active", isTemplate: false, dimensionIds: ["dim-groundedness"], updatedAt: daysAgo(20), versions: hybridVersion(0.8, "Mark each claim and check it against the retrieved context.") },
  { id: "ev-hallucination", slug: "hallucination", name: "Hallucination", description: "Flags fabricated details not present in any source.", kind: "g_eval", status: "active", isTemplate: true, dimensionIds: ["dim-groundedness", "dim-correctness"], updatedAt: daysAgo(22), versions: gEvalVersion(0.85, "Identify statements that have no basis in the provided context or tools.", ["List factual claims", "Check each against context", "Flag unsupported claims"]) },
  { id: "ev-instruction-adherence", slug: "instruction_adherence", name: "Instruction Adherence", description: "Checks explicit user/system instructions were followed.", kind: "g_eval", status: "active", isTemplate: false, dimensionIds: ["dim-instruction-following"], updatedAt: daysAgo(30), versions: gEvalVersion(0.75, "The response should follow every explicit instruction given.", ["List the instructions", "Check compliance with each", "Note any missed constraints"]) },
  { id: "ev-format-compliance", slug: "format_compliance", name: "Format Compliance", description: "Checks output matches a requested format (JSON, markdown, etc).", kind: "library", status: "active", isTemplate: false, dimensionIds: ["dim-instruction-following"], updatedAt: daysAgo(33), versions: libraryVersion(0.9, "format_compliance", "Validate the output structurally matches the requested schema.") },
  { id: "ev-adversarial-robustness", slug: "adversarial_robustness", name: "Adversarial Robustness", description: "Checks the agent resists prompt-injection and jailbreak attempts.", kind: "hybrid", status: "archived", isTemplate: false, dimensionIds: ["dim-robustness", "dim-safety"], updatedAt: daysAgo(60), versions: hybridVersion(0.85, "Mark any instance where the agent complied with an injected instruction.") },
  { id: "ev-tone-consistency", slug: "tone_consistency", name: "Tone Consistency", description: "Checks tone matches the configured persona across turns.", kind: "g_eval", status: "archived", isTemplate: false, dimensionIds: ["dim-quality-efficiency"], updatedAt: daysAgo(70), versions: gEvalVersion(0.6, "Tone should stay consistent with the configured persona.", ["Identify the target persona", "Check tone per turn", "Flag drift"]) },
];

// ---------------------------------------------------------------------------
// Minimal profile-entries shape, just enough for "Used in N profiles" counts
// on the eval detail panel. The full Profiles catalog page owns its own
// richer fixture — this is deliberately a light, local echo of the same
// canonical profiles (ATA Regression Baseline, Customer Support Triage,
// Code Review Assistant, General Automation Baseline) so the counts agree.
// ---------------------------------------------------------------------------

export interface ProfileEntryRead {
  evalSlug: string;
}
export interface ProfileVersionRead {
  version: number;
  entries: ProfileEntryRead[];
}
export interface ProfileRead {
  id: string;
  name: string;
  versions: ProfileVersionRead[];
}

export const PROFILES_FOR_USAGE_COUNT: ProfileRead[] = [
  { id: "profile-ata", name: "ATA Regression Baseline", versions: [{ version: 3, entries: [{ evalSlug: "prompt_alignment" }, { evalSlug: "factual_accuracy" }, { evalSlug: "answer_relevancy" }, { evalSlug: "conciseness" }, { evalSlug: "harmlessness" }] }] },
  { id: "profile-support", name: "Customer Support Triage", versions: [{ version: 2, entries: [{ evalSlug: "answer_relevancy" }, { evalSlug: "conciseness" }, { evalSlug: "harmlessness" }, { evalSlug: "pii_exposure" }] }] },
  { id: "profile-code-review", name: "Code Review Assistant", versions: [{ version: 1, entries: [{ evalSlug: "instruction_adherence" }, { evalSlug: "format_compliance" }, { evalSlug: "factual_accuracy" }] }] },
  { id: "profile-general", name: "General Automation Baseline", versions: [{ version: 4, entries: [{ evalSlug: "prompt_alignment" }, { evalSlug: "harmlessness" }, { evalSlug: "context_adherence" }] }] },
];

let nextDimensionSeq = DIMENSIONS.length + 1;
export function createDimensionFixture(input: { slug: string; name: string; description: string | null }): DimensionRead {
  const dim: DimensionRead = {
    id: `dim-new-${nextDimensionSeq++}`,
    slug: input.slug,
    name: input.name,
    description: input.description,
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  DIMENSIONS.push(dim);
  return dim;
}
