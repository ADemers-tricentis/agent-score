// Fake data for the Profile tab (AgentProfilePage / ProfileFitTab / ActivityTab) —
// no backend. Shapes mirror the real OpenAPI schemas (BenchmarkConfigOut,
// FitDecisionOut, FitDecisionDetailOut, DiscriminationOut, ReadinessOut,
// DriftNudgeOut) closely enough for the cloned UI to render unmodified.

export interface ProfileEntryOut {
  dimensionSlug: string;
  enabled: boolean;
  evalSlug: string;
  evalVersionId: string;
  threshold: number;
  weight: number;
}

export interface DriftNudgeOut {
  active: boolean;
  detectedAt?: string | null;
  fitScore?: number | null;
  rationale?: string | null;
  wouldAdoptProfileName?: string | null;
  wouldAdoptProfileVersionId?: string | null;
}

export type DiscriminationVerdict = "discriminating" | "inverted" | "not_discriminating" | "inconclusive" | "degenerate" | "insufficient_evidence";

export interface EvalDiscriminationOut {
  auc?: number | null;
  aucLower?: number | null;
  aucUpper?: number | null;
  comparablePairs: number;
  computedAt: string;
  contributingAgents: number;
  evalSlug: string;
  evalVersionId: string;
  labeledInteractions: number;
  minorityClassCount: number;
  scoredInteractions: number;
  verdict: DiscriminationVerdict;
}

export interface DiscriminationOut {
  computedAt: string;
  evals: EvalDiscriminationOut[];
  verdict: DiscriminationVerdict;
}

export interface BenchmarkConfigOut {
  attentionReason?: ("fallback" | "low_confidence" | "no_applicable_profile" | "inverted" | "not_discriminating" | "profile_quality") | null;
  autonomousScoringEnabled: boolean;
  bindingInvalid: boolean;
  bindingSource: string;
  checkQualityState?: "unassessable_no_labels" | null;
  configVersion: number;
  dimensionWeights: Record<string, number>;
  discrimination?: DiscriminationOut | null;
  discriminationAssessedAt?: string | null;
  driftNudge?: DriftNudgeOut | null;
  evalsByDimension: Record<string, ProfileEntryOut[]>;
  evidenceDiversity?: number | null;
  evidenceState: "recorded" | "not_recorded" | "not_computed";
  fitMethod: string;
  needsProfileAttention: boolean;
  profileId: string;
  profileName?: string | null;
  profileVersion?: number | null;
  profileVersionId: string;
  provisionalFit: boolean;
  rationale?: string | null;
}

export interface FitDecisionOut {
  id: string;
  chosenProfileVersionId?: string | null;
  confidence?: number | null;
  createdAt: string;
  detectedSignals?: string[] | null;
  fallbackClass: ("bug" | "expected") | null;
  fallbackReason?: string | null;
  fitMethod: string;
  fitterPromptVersion?: string | null;
  modelId?: string | null;
  outcome: string;
  perCandidate?: Record<string, unknown>[] | null;
  rationale?: string | null;
  shadowHeuristicProfileVersionId?: string | null;
  trigger: string;
}

export interface FitDecisionDetailOut extends FitDecisionOut {
  configVersion?: number | null;
  fallbackDiagnostic?: Record<string, unknown> | null;
  inputHash?: string | null;
  runId?: string | null;
  sampledTraceIds?: string[] | null;
  tokenUsage?: Record<string, unknown> | null;
}

export interface ReadinessOut {
  captured: number;
  lastReadinessCheckAt?: string | null;
  nextRecheckAt?: string | null;
  ready: boolean;
  threshold: number;
}

export interface AdoptableProfileVersionOut {
  profileVersionId: string;
  version: number;
  label: string;
}

export interface AdoptableProfileOut {
  id: string;
  name: string;
  versions: AdoptableProfileVersionOut[];
}

export interface ScoringEventOut {
  id: string;
  eventType: string;
  createdAt: string;
  actorEmail?: string | null;
  referenceData?: Record<string, unknown> | null;
}

// ---------------------------------------------------------------------------
// Profile catalog — shared "adoptable profiles" fixture (version-select
// dropdown + fit-decision candidate labels).
// ---------------------------------------------------------------------------

export const PROFILE_CATALOG: AdoptableProfileOut[] = [
  { id: "profile-ata", name: "ATA Regression Baseline", versions: [{ profileVersionId: "pv-ata-2", version: 2, label: "ATA Regression Baseline · v2" }, { profileVersionId: "pv-ata-3", version: 3, label: "ATA Regression Baseline · v3" }] },
  { id: "profile-support", name: "Customer Support Triage", versions: [{ profileVersionId: "pv-support-1", version: 1, label: "Customer Support Triage · v1" }, { profileVersionId: "pv-support-2", version: 2, label: "Customer Support Triage · v2" }] },
  { id: "profile-code-review", name: "Code Review Assistant", versions: [{ profileVersionId: "pv-code-1", version: 1, label: "Code Review Assistant · v1" }] },
  { id: "profile-general", name: "General Automation Baseline", versions: [{ profileVersionId: "pv-general-4", version: 4, label: "General Automation Baseline · v4" }] },
];

export function profileLabelFor(profileVersionId: string): string | null {
  for (const p of PROFILE_CATALOG) {
    const v = p.versions.find((x) => x.profileVersionId === profileVersionId);
    if (v) return `${p.name} · v${v.version}`;
  }
  return null;
}

const DIMENSIONS = ["correctness", "relevance", "quality_efficiency", "safety"];

function evalsFor(profileVersionId: string): Record<string, ProfileEntryOut[]> {
  return {
    correctness: [
      { dimensionSlug: "correctness", enabled: true, evalSlug: "prompt_alignment", evalVersionId: `${profileVersionId}-prompt-alignment`, threshold: 0.8, weight: 2 },
      { dimensionSlug: "correctness", enabled: true, evalSlug: "factual_accuracy", evalVersionId: `${profileVersionId}-factual-accuracy`, threshold: 0.75, weight: 1 },
    ],
    relevance: [
      { dimensionSlug: "relevance", enabled: true, evalSlug: "answer_relevancy", evalVersionId: `${profileVersionId}-answer-relevancy`, threshold: 0.7, weight: 1 },
    ],
    quality_efficiency: [
      { dimensionSlug: "quality_efficiency", enabled: true, evalSlug: "conciseness", evalVersionId: `${profileVersionId}-conciseness`, threshold: 0.6, weight: 1 },
      { dimensionSlug: "quality_efficiency", enabled: false, evalSlug: "token_efficiency", evalVersionId: `${profileVersionId}-token-efficiency`, threshold: 0.5, weight: 1 },
    ],
    safety: [
      { dimensionSlug: "safety", enabled: true, evalSlug: "harmlessness", evalVersionId: `${profileVersionId}-harmlessness`, threshold: 0.9, weight: 3 },
    ],
  };
}

const now = Date.now();
const daysAgo = (n: number) => new Date(now - n * 86400000).toISOString();

function discriminationFor(profileVersionId: string, verdict: DiscriminationVerdict, assessedAt: string): DiscriminationOut {
  const evals = evalsFor(profileVersionId).correctness.concat(evalsFor(profileVersionId).safety);
  return {
    computedAt: assessedAt,
    verdict,
    evals: evals.map((e, i) => ({
      evalSlug: e.evalSlug,
      evalVersionId: e.evalVersionId,
      verdict,
      auc: verdict === "inverted" ? 0.34 : verdict === "discriminating" ? 0.82 - i * 0.04 : 0.51,
      aucLower: verdict === "discriminating" ? 0.74 - i * 0.04 : null,
      aucUpper: verdict === "discriminating" ? 0.89 - i * 0.04 : null,
      labeledInteractions: 40 + i * 12,
      minorityClassCount: 8 + i * 2,
      comparablePairs: 120 + i * 40,
      scoredInteractions: 260 + i * 30,
      contributingAgents: 4 + i,
      computedAt: assessedAt,
    })),
  };
}

function fitDecision(opts: {
  id: string;
  daysAgoN: number;
  method: "llm" | "heuristic";
  outcome: "adopted" | "fallback" | "no_change" | "superseded";
  chosenProfileVersionId: string;
  trigger: string;
  confidence?: number;
  rationale: string;
  fallbackReason?: string;
  detectedSignals?: string[];
  candidates?: { profileVersionId: string; score: number; reason: string }[];
}): FitDecisionDetailOut {
  return {
    id: opts.id,
    createdAt: daysAgo(opts.daysAgoN),
    fitMethod: opts.method,
    outcome: opts.outcome,
    chosenProfileVersionId: opts.chosenProfileVersionId,
    trigger: opts.trigger,
    confidence: opts.method === "llm" ? opts.confidence ?? 0.82 : null,
    rationale: opts.rationale,
    fallbackClass: opts.outcome === "fallback" ? "expected" : null,
    fallbackReason: opts.fallbackReason ?? null,
    shadowHeuristicProfileVersionId: null,
    detectedSignals: opts.detectedSignals ?? ["stable pass-rate trend"],
    perCandidate: (opts.candidates ?? [{ profileVersionId: opts.chosenProfileVersionId, score: opts.confidence ?? 0.82, reason: "Best agent-type + eval-coverage match." }]) as unknown as Record<string, unknown>[],
    modelId: opts.method === "llm" ? "claude-sonnet-4-6" : null,
    fitterPromptVersion: opts.method === "llm" ? "profile-fit-v3" : null,
    configVersion: 3,
    inputHash: opts.method === "llm" ? opts.id.replace("fit-", "").padEnd(10, "0").slice(0, 10) : null,
    runId: opts.method === "llm" ? `run-${opts.id}` : null,
    tokenUsage: opts.method === "llm" ? { prompt_tokens: 940, completion_tokens: 210 } : null,
    sampledTraceIds: [`trace-${opts.id}-a`, `trace-${opts.id}-b`],
    fallbackDiagnostic: opts.outcome === "fallback" ? { finish_reason: "length", model_id: "claude-sonnet-4-6", provider: "anthropic" } : null,
  };
}

interface AgentProfileFixture {
  benchmark: BenchmarkConfigOut;
  fitHistory: FitDecisionDetailOut[];
  readiness?: ReadinessOut;
  activity: ScoringEventOut[];
}

function baseBenchmark(profileVersionId: string, profileName: string, profileVersion: number, profileId: string): BenchmarkConfigOut {
  return {
    attentionReason: null,
    autonomousScoringEnabled: true,
    bindingInvalid: false,
    bindingSource: "auto",
    checkQualityState: null,
    configVersion: profileVersion,
    dimensionWeights: { correctness: 2, relevance: 1, quality_efficiency: 1, safety: 3 },
    discrimination: discriminationFor(profileVersionId, "discriminating", daysAgo(2)),
    discriminationAssessedAt: daysAgo(2),
    driftNudge: null,
    evalsByDimension: evalsFor(profileVersionId),
    evidenceDiversity: 4.1,
    evidenceState: "recorded",
    fitMethod: "llm",
    needsProfileAttention: false,
    profileId,
    profileName,
    profileVersion,
    profileVersionId,
    provisionalFit: false,
    rationale: `${profileName} v${profileVersion} matched on agent type and current eval coverage.`,
  };
}

const FIXTURES: Record<string, AgentProfileFixture> = {
  // Pre-loaded walkthrough agent for a brand-new tenant ("blank / new login"
  // demo state) — a clean, healthy example with no attention-needed edge
  // cases, so it reads as "this is what a good result looks like."
  "agent-sample": {
    benchmark: baseBenchmark("pv-sample-1", "Sample Support Profile", 1, "profile-sample"),
    fitHistory: [
      fitDecision({ id: "fit-sample-a", daysAgoN: 3, method: "llm", outcome: "adopted", chosenProfileVersionId: "pv-sample-1", trigger: "new_agent", confidence: 0.88, rationale: "Sample Support Profile v1 was the only applicable profile for this agent type at creation." }),
    ],
    activity: [
      { id: "ev-sample-a", eventType: "profile_auto_refit", createdAt: daysAgo(3), actorEmail: null, referenceData: { outcome: "adopted" } },
      { id: "ev-sample-b", eventType: "run_completed", createdAt: daysAgo(1), actorEmail: null, referenceData: null },
    ],
  },
  // Flagship — full richness: pinned + drift nudge + discrimination + rich fit history.
  "agent-1": {
    benchmark: {
      ...baseBenchmark("pv-ata-3", "ATA Regression Baseline", 3, "profile-ata"),
      bindingSource: "pinned",
      driftNudge: {
        active: true,
        detectedAt: daysAgo(1),
        fitScore: 0.91,
        rationale: "Recent traffic shifted toward edge-case scenarios this profile under-weights.",
        wouldAdoptProfileName: "ATA Regression Baseline",
        wouldAdoptProfileVersionId: "pv-ata-2",
      },
    },
    fitHistory: [
      fitDecision({ id: "fit-1a", daysAgoN: 1, method: "llm", outcome: "adopted", chosenProfileVersionId: "pv-ata-3", trigger: "manual", confidence: 0.87, rationale: "ATA Regression Baseline v3 matched on agent type (external, ATA) and covers this agent's full regression-suite eval coverage." }),
      fitDecision({ id: "fit-1b", daysAgoN: 9, method: "heuristic", outcome: "fallback", chosenProfileVersionId: "pv-ata-3", trigger: "scheduled", rationale: "LLM fitter call timed out; fell back to heuristic ranking.", fallbackReason: "judge_timeout", detectedSignals: ["high tool-call fan-out", "long-tail latency outliers"] }),
      fitDecision({ id: "fit-1c", daysAgoN: 21, method: "llm", outcome: "no_change", chosenProfileVersionId: "pv-ata-3", trigger: "new_agent", confidence: 0.79, rationale: "Initial fit at agent creation — ATA Regression Baseline v3 was the only applicable profile for this agent type." }),
    ],
    readiness: { captured: 97, threshold: 20, ready: true, lastReadinessCheckAt: daysAgo(21), nextRecheckAt: null },
    activity: [
      { id: "ev-1a", eventType: "profile_auto_refit", createdAt: daysAgo(1), actorEmail: null, referenceData: { outcome: "adopted", profile: "ATA Regression Baseline v3" } },
      { id: "ev-1b", eventType: "run_started", createdAt: daysAgo(1), actorEmail: null, referenceData: null },
      { id: "ev-1c", eventType: "window_rescored", createdAt: daysAgo(9), actorEmail: "a.demers@tricentis.com", referenceData: { sessions: 22 } },
    ],
  },
  "agent-2": {
    benchmark: baseBenchmark("pv-support-2", "Customer Support Triage", 2, "profile-support"),
    fitHistory: [
      fitDecision({ id: "fit-2a", daysAgoN: 3, method: "llm", outcome: "adopted", chosenProfileVersionId: "pv-support-2", trigger: "scheduled", confidence: 0.9, rationale: "Customer Support Triage v2 remains the strongest match for this agent's traffic." }),
    ],
    activity: [
      { id: "ev-2a", eventType: "profile_auto_refit", createdAt: daysAgo(3), actorEmail: null, referenceData: { outcome: "adopted" } },
    ],
  },
  "agent-3": {
    benchmark: baseBenchmark("pv-general-4", "General Automation Baseline", 4, "profile-general"),
    fitHistory: [
      fitDecision({ id: "fit-3a", daysAgoN: 5, method: "heuristic", outcome: "no_change", chosenProfileVersionId: "pv-general-4", trigger: "scheduled", rationale: "General Automation Baseline v4 remains the best available match." }),
    ],
    activity: [
      { id: "ev-3a", eventType: "run_completed", createdAt: daysAgo(1), actorEmail: null, referenceData: null },
    ],
  },
  "agent-4": {
    benchmark: {
      ...baseBenchmark("pv-support-1", "Customer Support Triage", 1, "profile-support"),
      needsProfileAttention: true,
      attentionReason: "low_confidence",
      discrimination: discriminationFor("pv-support-1", "not_discriminating", daysAgo(4)),
      discriminationAssessedAt: daysAgo(4),
    },
    fitHistory: [
      fitDecision({ id: "fit-4a", daysAgoN: 2, method: "llm", outcome: "adopted", chosenProfileVersionId: "pv-support-1", trigger: "manual", confidence: 0.58, rationale: "Low-confidence match — traffic doesn't cleanly fit any cataloged profile yet." }),
    ],
    activity: [
      { id: "ev-4a", eventType: "profile_auto_refit", createdAt: daysAgo(2), actorEmail: null, referenceData: { outcome: "adopted", confidence: 0.58 } },
    ],
  },
  // Provisioning — not enough traces yet, still default-bound.
  "agent-5": {
    benchmark: {
      ...baseBenchmark("pv-code-1", "Code Review Assistant", 1, "profile-code-review"),
      bindingSource: "default",
      discrimination: null,
      discriminationAssessedAt: null,
      evidenceState: "not_recorded",
      evidenceDiversity: null,
      rationale: null,
    },
    fitHistory: [],
    readiness: { captured: 6, threshold: 20, ready: false, lastReadinessCheckAt: daysAgo(0), nextRecheckAt: new Date(now + 3 * 3600000).toISOString() },
    activity: [],
  },
};

const DEFAULT_FIXTURE = FIXTURES["agent-1"];

export function getFixture(agentId: string): AgentProfileFixture {
  return FIXTURES[agentId] ?? DEFAULT_FIXTURE;
}

export { DIMENSIONS };
