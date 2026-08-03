import type {
  Agent,
  AgentInboxGroup,
  AgentSettingsData,
  AgentType,
  Attribution,
  DescribeAgentGuidedInput,
  DescribeAgentResult,
  DimensionKey,
  DimensionScore,
  FingerprintMatch,
  Golden,
  InboxItem,
  InboxSeverity,
  JudgeInfo,
  LabelingCandidate,
  Readiness,
  RestingAgentSummary,
  ScoringProfileSummary,
  ScoringRun,
  ScoringRunDetail,
  Session,
  SessionVerdict,
  ShipDecision,
  SpanNode,
  Trace,
  TraceDetail,
} from "../types";

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 60 * 60 * 1000).toISOString();
}
function daysAgo(d: number, extraHours = 0): string {
  return hoursAgo(d * 24 + extraHours);
}

function dim(score: number, sigs: string[], rawDeltaPct?: number): DimensionScore {
  return { score, sigs, passed: score >= 55, rawDeltaPct };
}

const READY_DIMENSIONS: Record<DimensionKey, DimensionScore> = {
  benchmarkPerformance: dim(88, ["task_success: 0.91", "completion_rate: 0.94"]),
  valueEfficiency: dim(79, ["value_cost_ratio: 0.82", "p95_tail_cost: 1.10"], 4),
  uxSignal: dim(84, ["latency_score: 0.88", "error_rate_score: 0.95"]),
  harmony: dim(90, ["context_grounding: 0.93", "hallucination_rate: 0.02"]),
  stability: dim(86, ["cross_variant_consistency: 0.89"]),
  agency: dim(81, ["tool_selection_accuracy: 0.87", "planning_efficiency: 0.78"]),
  groundedness: dim(85, ["spec_adherence: 0.90"]),
  instructionFollowing: dim(83, []),
  transparency: dim(77, []),
  robustness: dim(74, []),
  communication: dim(80, []),
};

function scaleDims(base: Record<DimensionKey, DimensionScore>, factor: number): Partial<Record<DimensionKey, DimensionScore>> {
  const out: Partial<Record<DimensionKey, DimensionScore>> = {};
  for (const key of Object.keys(base) as DimensionKey[]) {
    out[key] = { ...base[key], score: Math.round(Math.max(0, Math.min(100, base[key].score * factor))) };
  }
  return out;
}

// --- Seed agents -----------------------------------------------------------
// Covers: below-threshold (locked), preliminary, fully-scored Ship, Review
// with a High safety issue, Block with a Critical safety issue, and a
// second Ship agent for variety across all six agent types.

let AGENTS: Agent[] = [
  {
    agent_id: "agt_ata_regression",
    tenant_id: "tenant_internal",
    name: "Regression Test Agent",
    kind: "internal",
    agentType: "ATA",
    langfuse_project_id: "lf_proj_ata_1",
    provisioning_status: "active",
    created_at: daysAgo(52),
    updated_at: hoursAgo(3),
    traceCount: 340,
    traceCount24h: 28,
    p95LatencyMs24h: 4200,
    tokenSpend24hUsd: 6.4,
    errorCount24h: 1,
    compositeScore: 91,
    grade: "A",
    verdict: "Ship",
    dimensionScores: scaleDims(READY_DIMENSIONS, 1.03),
    reliability: "RELIABLE",
    isLive: true,
    hasCriticalSafetyIssue: false,
    hasHighSafetyIssue: false,
  },
  {
    agent_id: "agt_atc_casegen",
    tenant_id: "tenant_internal",
    name: "Test Case Generator",
    kind: "internal",
    agentType: "ATC",
    langfuse_project_id: "lf_proj_atc_1",
    provisioning_status: "active",
    created_at: daysAgo(30),
    updated_at: hoursAgo(1),
    traceCount: 96,
    traceCount24h: 12,
    p95LatencyMs24h: 5100,
    tokenSpend24hUsd: 3.1,
    errorCount24h: 2,
    compositeScore: 68,
    grade: "D",
    verdict: "Review",
    dimensionScores: scaleDims(READY_DIMENSIONS, 0.8),
    reliability: "NEEDS_WORK",
    isLive: true,
    hasCriticalSafetyIssue: false,
    hasHighSafetyIssue: true,
    safetyDetail: "prompt_injection_detected — session escalated to PARTIAL",
  },
  {
    agent_id: "agt_cura_diagnostic",
    tenant_id: "tenant_internal",
    name: "Diagnostic Agent",
    kind: "internal",
    agentType: "CURA",
    langfuse_project_id: "lf_proj_cura_1",
    provisioning_status: "active",
    created_at: daysAgo(2),
    updated_at: hoursAgo(1),
    traceCount: 8,
    traceCount24h: 8,
    p95LatencyMs24h: null,
    tokenSpend24hUsd: null,
    errorCount24h: 0,
    compositeScore: null,
    grade: null,
    verdict: null,
    dimensionScores: {},
    reliability: null,
    isLive: true,
    hasCriticalSafetyIssue: false,
    hasHighSafetyIssue: false,
  },
  {
    agent_id: "agt_aiws_assistant",
    tenant_id: "tenant_internal",
    name: "Workspace Assistant",
    kind: "internal",
    agentType: "AI_WORKSPACE",
    langfuse_project_id: "lf_proj_aiws_1",
    provisioning_status: "active",
    created_at: daysAgo(9),
    updated_at: hoursAgo(6),
    traceCount: 25,
    traceCount24h: 5,
    p95LatencyMs24h: 3800,
    tokenSpend24hUsd: 2.2,
    errorCount24h: 0,
    compositeScore: 82,
    grade: "B",
    verdict: "Review",
    dimensionScores: scaleDims(READY_DIMENSIONS, 0.95),
    reliability: "NEEDS_WORK",
    isLive: true,
    hasCriticalSafetyIssue: false,
    hasHighSafetyIssue: false,
  },
  {
    agent_id: "agt_coding_review",
    tenant_id: "tenant_internal",
    name: "Code Review Agent",
    kind: "internal",
    agentType: "CODING",
    langfuse_project_id: "lf_proj_coding_1",
    provisioning_status: "active",
    created_at: daysAgo(18),
    updated_at: hoursAgo(2),
    traceCount: 150,
    traceCount24h: 14,
    p95LatencyMs24h: 6700,
    tokenSpend24hUsd: 9.8,
    errorCount24h: 6,
    compositeScore: 48,
    grade: "F",
    verdict: "Block",
    dimensionScores: scaleDims(READY_DIMENSIONS, 0.6),
    reliability: "UNSTABLE",
    isLive: false,
    hasCriticalSafetyIssue: true,
    hasHighSafetyIssue: false,
    safetyDetail: "credential_exposure — session forced to FAIL",
  },
  {
    agent_id: "agt_apt_perf",
    tenant_id: "tenant_internal",
    name: "Performance Test Agent",
    kind: "internal",
    agentType: "APT",
    langfuse_project_id: "lf_proj_apt_1",
    provisioning_status: "active",
    created_at: daysAgo(41),
    updated_at: hoursAgo(4),
    traceCount: 210,
    traceCount24h: 19,
    p95LatencyMs24h: 2900,
    tokenSpend24hUsd: 4.7,
    errorCount24h: 0,
    compositeScore: 88,
    grade: "B",
    verdict: "Ship",
    dimensionScores: scaleDims(READY_DIMENSIONS, 1.0),
    reliability: "RELIABLE",
    isLive: true,
    hasCriticalSafetyIssue: false,
    hasHighSafetyIssue: false,
  },
];

// --- Seed traces + scoring runs, keyed by agent id -------------------------

function makeTraces(agentId: string, n: number, startHoursAgo: number): Trace[] {
  const names = [
    "Generate payment test case",
    "Diagnose CI failure",
    "Summarize regression run",
    "Review pull request",
    "Draft release notes",
    "Classify support ticket",
    "Validate schema migration",
  ];
  return Array.from({ length: n }, (_, i) => {
    const hasError = i % 7 === 0;
    return {
      id: `${agentId}_trace_${i}`,
      ts: hoursAgo(startHoursAgo - i * 3),
      name: names[i % names.length],
      durationMs: 1200 + ((i * 137) % 4000),
      tokenCostUsd: 0.02 + ((i * 3) % 40) / 100,
      status: hasError ? "error" : "ok",
      verdict: hasError ? "FAIL" : i % 5 === 0 ? "PARTIAL" : "PASS",
    };
  });
}

function makeRuns(agentId: string, n: number, compositeBase: number | null, grade: Agent["grade"], verdict: Agent["verdict"]): ScoringRun[] {
  return Array.from({ length: n }, (_, i) => {
    const daysBack = i * 2 + 1;
    const inProgress = i === 0 && Math.random() < 0; // never in-progress in seed data, kept for shape parity
    return {
      id: `${agentId}_run_${n - i}`,
      agentId,
      label: `Run #${n - i}`,
      mode: "production",
      startedAt: daysAgo(daysBack, -1),
      completedAt: inProgress ? null : daysAgo(daysBack),
      sessionCount: 18 + i * 3,
      passRate: compositeBase != null ? Math.max(0, Math.min(100, compositeBase - i * 2)) : 0,
      compositeScore: compositeBase != null ? Math.max(0, compositeBase - i * 3) : null,
      grade,
      verdict,
      inProgress,
    };
  });
}

const TRACES: Record<string, Trace[]> = {
  agt_ata_regression: makeTraces("agt_ata_regression", 8, 6),
  agt_atc_casegen: makeTraces("agt_atc_casegen", 8, 4),
  agt_cura_diagnostic: makeTraces("agt_cura_diagnostic", 8, 20),
  agt_aiws_assistant: makeTraces("agt_aiws_assistant", 6, 12),
  agt_coding_review: makeTraces("agt_coding_review", 8, 3),
  agt_apt_perf: makeTraces("agt_apt_perf", 6, 8),
};

const SCORING_RUNS: Record<string, ScoringRun[]> = {
  agt_ata_regression: makeRuns("agt_ata_regression", 4, 91, "A", "Ship"),
  agt_atc_casegen: makeRuns("agt_atc_casegen", 3, 68, "D", "Review"),
  agt_cura_diagnostic: [],
  agt_aiws_assistant: makeRuns("agt_aiws_assistant", 2, 82, "B", "Review"),
  agt_coding_review: makeRuns("agt_coding_review", 3, 48, "F", "Block"),
  agt_apt_perf: makeRuns("agt_apt_perf", 4, 88, "B", "Ship"),
};

export const READINESS_THRESHOLD = 20;

// --- Subscription store ----------------------------------------------------
// Simple external store so React components can subscribe to mutations
// made by simulateTraces() below. Every mutation replaces AGENTS/TRACES with
// a new array/object reference so useSyncExternalStore's Object.is check
// picks up the change.

const listeners = new Set<() => void>();
function emitChange() {
  for (const l of listeners) l();
}
export function subscribeAgents(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}
export function getAgentsSnapshot(): Agent[] {
  return AGENTS;
}

// --- Mock "client" functions -------------------------------------------------
// Async, promise-returning, with the signatures a real API client would
// have — swapping in real fetch calls later only touches this file.

export async function listAgents(): Promise<Agent[]> {
  return AGENTS;
}

export async function getAgent(agentId: string): Promise<Agent | null> {
  return AGENTS.find((a) => a.agent_id === agentId) ?? null;
}

export async function getAgentReadiness(agentId: string): Promise<Readiness> {
  const agent = AGENTS.find((a) => a.agent_id === agentId);
  const captured = agent?.traceCount ?? 0;
  return { captured, threshold: READINESS_THRESHOLD, ready: captured >= READINESS_THRESHOLD };
}

export async function listAgentTraces(agentId: string, opts?: { limit?: number }): Promise<Trace[]> {
  const traces = TRACES[agentId] ?? [];
  const sorted = traces.slice().sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
  return opts?.limit ? sorted.slice(0, opts.limit) : sorted;
}

export async function listAgentScoringRuns(agentId: string, opts?: { limit?: number }): Promise<ScoringRun[]> {
  const runs = SCORING_RUNS[agentId] ?? [];
  return opts?.limit ? runs.slice(0, opts.limit) : runs;
}

/**
 * Demo-only affordance for the "Simulate traces" action (REQ-068). Mutates
 * the in-memory store so the UI can show unlock progression live. A real
 * client would not have this — kept isolated here so it's obvious to delete
 * once a real backend is wired up.
 */
export function simulateTraces(agentId: string, count: number): void {
  const agent = AGENTS.find((a) => a.agent_id === agentId);
  if (!agent) return;

  const newTraceCount = agent.traceCount + count;
  const justUnlocked = agent.compositeScore == null && newTraceCount >= READINESS_THRESHOLD;

  AGENTS = AGENTS.map((a) => {
    if (a.agent_id !== agentId) return a;
    return {
      ...a,
      traceCount: newTraceCount,
      traceCount24h: a.traceCount24h + count,
      ...(justUnlocked
        ? {
            compositeScore: 76,
            grade: "C" as const,
            verdict: "Review" as const,
            dimensionScores: scaleDims(READY_DIMENSIONS, 0.86),
            reliability: "NEEDS_WORK" as const,
            p95LatencyMs24h: 4400,
            tokenSpend24hUsd: 3.6,
          }
        : {}),
    };
  });

  const existing = TRACES[agentId] ?? [];
  TRACES[agentId] = [...makeTraces(agentId, count, 0.5), ...existing];

  if (justUnlocked) {
    const newRun = makeRuns(agentId, 1, 76, "C", "Review");
    SCORING_RUNS[agentId] = newRun;
    RUN_SESSIONS[newRun[0].id] = generateSessions(newRun[0], agentId);
  }

  emitChange();
}

// =============================================================================
// Milestone 2 additions
// =============================================================================

// --- Scoring profile + judge summaries, per agent type ----------------------

const DIMENSIONS_BY_TYPE: Record<AgentType, DimensionKey[]> = {
  ATA: ["benchmarkPerformance", "valueEfficiency", "uxSignal", "agency", "stability"],
  ATC: ["benchmarkPerformance", "uxSignal", "harmony", "stability"],
  CURA: ["benchmarkPerformance", "harmony", "agency", "transparency"],
  AI_WORKSPACE: ["benchmarkPerformance", "uxSignal", "harmony", "communication"],
  CODING: ["benchmarkPerformance", "harmony", "robustness", "agency"],
  APT: ["benchmarkPerformance", "valueEfficiency", "uxSignal"],
};

const PROFILE_NAME_BY_TYPE: Record<AgentType, string> = {
  ATA: "Automated Test Agent — Standard",
  ATC: "Test Case Generation — Standard",
  CURA: "Diagnostic Agent — Standard",
  AI_WORKSPACE: "AI Workspace — Standard",
  CODING: "Coding Assistant — Standard",
  APT: "Performance Testing — Standard",
};

function profileSummaryFor(agentType: AgentType): ScoringProfileSummary {
  const dimensions = DIMENSIONS_BY_TYPE[agentType];
  return {
    name: PROFILE_NAME_BY_TYPE[agentType],
    version: 3,
    evalCount: dimensions.length * 2,
    dimensions,
    verdictBands: { ship: 85, shipWithNotes: 70, review: 55, block: 40 },
  };
}

const JUDGE_BY_TYPE: Record<AgentType, JudgeInfo> = {
  ATA: {
    name: "Claude Sonnet Judge",
    provider: "Anthropic",
    model: "claude-sonnet-4-6",
    rationale: "Best balance of reasoning quality and cost for structured, multi-step test flows.",
  },
  ATC: {
    name: "Claude Sonnet Judge",
    provider: "Anthropic",
    model: "claude-sonnet-4-6",
    rationale: "Strong at judging whether generated test cases actually cover the stated requirement.",
  },
  CURA: {
    name: "Claude Opus Judge",
    provider: "Anthropic",
    model: "claude-opus-4-6",
    rationale: "Root-cause diagnosis needs the strongest available reasoning to catch subtle misattributions.",
  },
  AI_WORKSPACE: {
    name: "Bedrock Claude Judge",
    provider: "AWS Bedrock",
    model: "anthropic.claude-sonnet-4-6",
    rationale: "Matches the region/compliance boundary of AI Workspace's existing Bedrock deployment.",
  },
  CODING: {
    name: "Claude Opus Judge",
    provider: "Anthropic",
    model: "claude-opus-4-6",
    rationale: "Code correctness and safety review benefit from the highest-capability judge available.",
  },
  APT: {
    name: "Claude Sonnet Judge",
    provider: "Anthropic",
    model: "claude-sonnet-4-6",
    rationale: "Performance-test output is short and structured — a lighter-weight judge is fast and sufficient.",
  },
};

// --- Sessions, per scoring run -----------------------------------------------

const ROOT_CAUSES: { rootCause: string; recs: string[] }[] = [
  { rootCause: "Picked the wrong tool", recs: ["Narrow the tool description so it's not ambiguous with similar tools.", "Add a disambiguating example to the system prompt."] },
  { rootCause: "Missed an edge case in the instructions", recs: ["Add the missed edge case as an explicit calibration scenario.", "Clarify the instruction wording that was ambiguous."] },
  { rootCause: "Made up information not in the source", recs: ["Tighten the grounding instructions to cite only provided context.", "Lower the model's temperature for this task type."] },
  { rootCause: "Ran out of budget partway through", recs: ["Increase the step/token budget for this scenario type.", "Break the task into smaller sub-steps."] },
  { rootCause: "Repeated a failed action instead of recovering", recs: ["Add a retry-limit guard for this tool.", "Give the agent an explicit fallback path on tool error."] },
];

function scenarioNames(): string[] {
  return [
    "Generate payment test case",
    "Diagnose CI failure",
    "Summarize regression run",
    "Review pull request",
    "Draft release notes",
    "Classify support ticket",
    "Validate schema migration",
    "Reconcile test data mismatch",
  ];
}

function sessionDims(factor: number, forceLowDims: DimensionKey[] = []): Partial<Record<DimensionKey, DimensionScore>> {
  const scaled = scaleDims(READY_DIMENSIONS, factor);
  for (const key of forceLowDims) {
    const current = scaled[key];
    if (current) scaled[key] = { ...current, score: 30 + Math.round(Math.random() * 15) };
  }
  return scaled;
}

function generateSessions(run: ScoringRun, agentId: string): Session[] {
  const names = scenarioNames();
  const n = run.sessionCount;
  const passWeight = run.verdict === "Ship" ? 0.85 : run.verdict === "Review" ? 0.6 : 0.3;

  return Array.from({ length: n }, (_, i) => {
    const roll = (i + 1) / (n + 1);
    const verdict: SessionVerdict = roll < passWeight ? "PASS" : roll < passWeight + 0.15 ? "PARTIAL" : "FAIL";
    const factor = verdict === "PASS" ? 0.95 + Math.random() * 0.1 : verdict === "PARTIAL" ? 0.65 + Math.random() * 0.15 : 0.4 + Math.random() * 0.15;
    const forceLow: DimensionKey[] = verdict !== "PASS" ? ["benchmarkPerformance"] : [];
    const dims = sessionDims(factor, forceLow);
    const composite = Math.round(Object.values(dims).reduce((sum, d) => sum + (d?.score ?? 0), 0) / Object.values(dims).length);
    const grade = composite >= 90 ? "A" : composite >= 80 ? "B" : composite >= 70 ? "C" : composite >= 60 ? "D" : "F";

    const isCriticalSafetyRun = run.verdict === "Block" && i === 0;
    const cause = ROOT_CAUSES[i % ROOT_CAUSES.length];

    const attribution: Attribution | undefined =
      verdict !== "PASS"
        ? {
            rootCause: cause.rootCause,
            confidence: 60 + Math.round(Math.random() * 30),
            agentFault: !isCriticalSafetyRun,
            chain: [
              { step: "Received task", detail: names[i % names.length], isCulprit: false },
              { step: "Selected an approach", detail: "Chose a plan based on the immediate context.", isCulprit: false },
              { step: cause.rootCause, detail: "This is where the session went wrong.", isCulprit: true },
              { step: "Produced final output", detail: "Returned a result despite the earlier misstep.", isCulprit: false },
            ],
            recommendations: cause.recs,
          }
        : undefined;

    return {
      id: `${run.id}_sess_${i}`,
      runId: run.id,
      agentId,
      scenario: names[i % names.length],
      ts: run.completedAt ?? run.startedAt,
      durationMs: 1500 + ((i * 173) % 5000),
      verdict: isCriticalSafetyRun ? "FAIL" : verdict,
      compositeScore: composite,
      grade,
      dimensionScores: dims,
      safetyOverride: isCriticalSafetyRun ? { severity: "Critical", signal: "credential_exposure", detail: "Session output included what looks like a live API key." } : undefined,
      attribution: isCriticalSafetyRun
        ? { rootCause: "Exposed a credential in its output", confidence: 92, agentFault: true, chain: [{ step: "Included raw tool output", detail: "Pasted an environment variable dump verbatim.", isCulprit: true }], recommendations: ["Redact environment/config output before it reaches the final response.", "Add a credential-pattern guard to the safety layer."] }
        : attribution,
    };
  });
}

const RUN_SESSIONS: Record<string, Session[]> = {};
for (const agentId of Object.keys(SCORING_RUNS)) {
  for (const run of SCORING_RUNS[agentId]) {
    RUN_SESSIONS[run.id] = generateSessions(run, agentId);
  }
}

// --- Span trees, generated on demand per trace -------------------------------

const SPAN_CACHE = new Map<string, SpanNode[]>();

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function generateSpanTree(traceId: string, totalDurationMs: number): SpanNode[] {
  const cached = SPAN_CACHE.get(traceId);
  if (cached) return cached;

  const seed = hashString(traceId);
  const toolNames = ["search_tickets", "run_query", "fetch_diff", "read_file", "write_file", "call_api"];
  const stepCount = 3 + (seed % 3);
  let offset = Math.round(totalDurationMs * 0.05);
  const children: SpanNode[] = [];

  for (let i = 0; i < stepCount; i++) {
    const isLlm = i % 2 === 0;
    const dur = Math.round((totalDurationMs * 0.8) / stepCount);
    const kind: SpanNode["kind"] = isLlm ? "llm" : "tool";
    children.push({
      id: `${traceId}_span_${i}`,
      kind,
      name: isLlm ? "Reasoning step" : toolNames[(seed + i) % toolNames.length],
      startOffsetMs: offset,
      durationMs: dur,
      tokens: isLlm ? 200 + ((seed + i * 37) % 800) : undefined,
      costUsd: isLlm ? Math.round((0.001 + ((seed + i) % 50) / 1000) * 1000) / 1000 : undefined,
      input: isLlm ? "Given the current context, decide the next step..." : `{"query": "example ${i}"}`,
      output: isLlm ? "Decided to proceed with the next tool call." : `{"result": "ok", "rows": ${(seed + i) % 12}}`,
      children: [],
    });
    offset += dur;
  }

  const tree: SpanNode[] = [
    {
      id: `${traceId}_root`,
      kind: "agent",
      name: "Agent session",
      startOffsetMs: 0,
      durationMs: totalDurationMs,
      children,
    },
  ];
  SPAN_CACHE.set(traceId, tree);
  return tree;
}

// --- Labeling queue + goldens, per agent --------------------------------------

const LABELING_QUEUE: Record<string, LabelingCandidate[]> = {};
const GOLDENS: Record<string, Golden[]> = {};

for (const agentId of Object.keys(TRACES)) {
  const traces = TRACES[agentId];
  LABELING_QUEUE[agentId] = traces.slice(0, 2).map((t, i) => ({
    id: `${agentId}_label_${i}`,
    traceId: t.id,
    traceName: t.name,
    ts: t.ts,
    reason: i === 0 ? "Low-confidence Pending verdict" : "Flagged by Runtime Guard for review",
    suggestedVerdict: (t.verdict ?? "PARTIAL") as SessionVerdict,
  }));
  GOLDENS[agentId] = traces.slice(3, 5).map((t, i) => ({
    id: `${agentId}_golden_${i}`,
    traceName: t.name,
    confirmedAt: hoursAgo(24 + i * 20),
    decision: i === 0 ? "confirm" : "override",
    note: i === 0 ? undefined : "Verdict should have been Passed — the tool error was transient.",
  }));
}
// Regression Test Agent is the cleanest seeded agent (Ship, Grade A, no
// safety issues, no FAIL sessions in its latest run) — give it an empty
// labeling queue too so the Home inbox's "shipping cleanly" resting state
// has a real example rather than every ready agent always having at least
// its 2 seeded labeling candidates.
LABELING_QUEUE["agt_ata_regression"] = [];

// --- Agent settings, per agent -------------------------------------------------

const AGENT_SETTINGS: Record<string, AgentSettingsData> = {};
for (const agent of AGENTS) {
  AGENT_SETTINGS[agent.agent_id] = {
    verdictBands: { ship: 85, review: 55, block: 40 },
    traceSamplingRatePct: 25,
    provisioningStatus: agent.provisioning_status,
    langfuseProjectId: agent.langfuse_project_id,
    createdByEmail: "a.demers@tricentis.com",
    workspaceId: "ws_internal_01",
  };
}

// --- Mock "client" functions, Milestone 2 -------------------------------------

export async function getAgentProfile(agentId: string): Promise<ScoringProfileSummary> {
  const agent = AGENTS.find((a) => a.agent_id === agentId);
  return profileSummaryFor(agent?.agentType ?? "ATA");
}

export async function getAgentJudge(agentId: string): Promise<JudgeInfo> {
  const agent = AGENTS.find((a) => a.agent_id === agentId);
  return JUDGE_BY_TYPE[agent?.agentType ?? "ATA"];
}

export async function getScoringRun(agentId: string, runId: string): Promise<ScoringRunDetail | null> {
  const run = (SCORING_RUNS[agentId] ?? []).find((r) => r.id === runId);
  if (!run) return null;
  return { ...run, sessions: RUN_SESSIONS[runId] ?? [] };
}

export async function getSession(agentId: string, runId: string, sessionId: string): Promise<Session | null> {
  void agentId;
  return (RUN_SESSIONS[runId] ?? []).find((s) => s.id === sessionId) ?? null;
}

export async function recordShipDecision(agentId: string, runId: string, sessionId: string, decision: ShipDecision): Promise<void> {
  void agentId;
  const sessions = RUN_SESSIONS[runId];
  if (!sessions) return;
  RUN_SESSIONS[runId] = sessions.map((s) => (s.id === sessionId ? { ...s, shipDecision: decision } : s));
  emitChange();
}

export async function describeAgent(
  agentId: string,
  input: { mode: "guided" | "expert"; guided?: DescribeAgentGuidedInput; expertSpec?: string },
): Promise<DescribeAgentResult> {
  void input;
  const agent = AGENTS.find((a) => a.agent_id === agentId);
  const profile = profileSummaryFor(agent?.agentType ?? "ATA");
  const alreadyGood = (agent?.compositeScore ?? 0) >= 85;
  return alreadyGood
    ? { matchedProfileName: profile.name, confidence: 94, evalsToAdd: [], evalsToRemove: [], weightAdjustments: [], noChangesNeeded: true }
    : {
        matchedProfileName: profile.name,
        confidence: 87,
        evalsToAdd: ["Format Invariance", "Consistency Across Retries"],
        evalsToRemove: [],
        weightAdjustments: [{ name: "Correctness", from: 1.0, to: 1.5 }],
        noChangesNeeded: false,
      };
}

export async function applyDescribeAgentResult(agentId: string, result: DescribeAgentResult): Promise<void> {
  void agentId;
  void result;
  // Mock-only: nothing to persist since profile evals aren't modeled beyond the summary.
}

export async function getTraceDetail(agentId: string, traceId: string): Promise<TraceDetail | null> {
  const trace = (TRACES[agentId] ?? []).find((t) => t.id === traceId);
  if (!trace) return null;
  return { ...trace, spans: generateSpanTree(traceId, trace.durationMs) };
}

export async function listLabelingQueue(agentId: string): Promise<LabelingCandidate[]> {
  return LABELING_QUEUE[agentId] ?? [];
}

export async function submitLabel(agentId: string, candidateId: string, decision: "confirm" | "override", note?: string): Promise<void> {
  const queue = LABELING_QUEUE[agentId] ?? [];
  const candidate = queue.find((c) => c.id === candidateId);
  if (!candidate) return;
  LABELING_QUEUE[agentId] = queue.filter((c) => c.id !== candidateId);
  GOLDENS[agentId] = [{ id: `${agentId}_golden_${Date.now()}`, traceName: candidate.traceName, confirmedAt: new Date().toISOString(), decision, note }, ...(GOLDENS[agentId] ?? [])];
  emitChange();
}

export async function listGoldens(agentId: string): Promise<Golden[]> {
  return GOLDENS[agentId] ?? [];
}

export async function getAgentSettings(agentId: string): Promise<AgentSettingsData> {
  return AGENT_SETTINGS[agentId];
}

export async function updateAgentSettings(agentId: string, patch: Partial<AgentSettingsData>): Promise<void> {
  AGENT_SETTINGS[agentId] = { ...AGENT_SETTINGS[agentId], ...patch };
  emitChange();
}

export async function archiveAgent(agentId: string): Promise<void> {
  AGENTS = AGENTS.map((a) => (a.agent_id === agentId ? { ...a, provisioning_status: "pending" as const, isLive: false } : a));
  emitChange();
}

export async function removeAgent(agentId: string): Promise<void> {
  AGENTS = AGENTS.filter((a) => a.agent_id !== agentId);
  emitChange();
}

export function createAgent(input: { name: string; agentType: AgentType; kind: Agent["kind"] }): Agent {
  const id = `agt_custom_${Date.now()}`;
  const agent: Agent = {
    agent_id: id,
    tenant_id: "tenant_internal",
    name: input.name,
    kind: input.kind,
    agentType: input.agentType,
    langfuse_project_id: `lf_proj_${id}`,
    provisioning_status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    traceCount: 0,
    traceCount24h: 0,
    p95LatencyMs24h: null,
    tokenSpend24hUsd: null,
    errorCount24h: 0,
    compositeScore: null,
    grade: null,
    verdict: null,
    dimensionScores: {},
    reliability: null,
    isLive: true,
    hasCriticalSafetyIssue: false,
    hasHighSafetyIssue: false,
  };
  AGENTS = [...AGENTS, agent];
  TRACES[id] = [];
  SCORING_RUNS[id] = [];
  LABELING_QUEUE[id] = [];
  GOLDENS[id] = [];
  AGENT_SETTINGS[id] = { verdictBands: { ship: 85, review: 55, block: 40 }, traceSamplingRatePct: 25, provisioningStatus: "active", langfuseProjectId: agent.langfuse_project_id, createdByEmail: "a.demers@tricentis.com", workspaceId: "ws_internal_01" };
  emitChange();
  return agent;
}

export async function getFingerprintMatch(agentId: string): Promise<FingerprintMatch | null> {
  const agent = AGENTS.find((a) => a.agent_id === agentId);
  if (!agent || agent.traceCount < 1) return null;
  return { profileName: profileSummaryFor(agent.agentType).name, confidence: 78, sessionCount: agent.traceCount };
}

// --- Home inbox ---------------------------------------------------------------
// Aggregates across every agent into "things that need a human decision"
// (see plans/2026-08-03-agentscore-app-home-inbox.md). Priority order for an
// agent's single topReason line: a Critical safety override outranks a High
// one, which outranks a FAIL session, which outranks a PARTIAL session, which
// outranks a labeling-queue candidate.

interface RankedReason {
  rank: number;
  reason: string;
}

// A bare PARTIAL session (no safety override) reads as "pending, low
// confidence" — the same ambiguous state the labeling queue already exists
// to resolve. Only FAIL and safety overrides represent an unambiguous
// "review this" decision at the session level; PARTIAL-without-override is
// intentionally left out of the inbox rather than double-counted.
function sessionReason(session: Session): RankedReason | null {
  if (session.safetyOverride?.severity === "Critical") {
    return { rank: 0, reason: session.attribution?.rootCause ?? session.safetyOverride.detail };
  }
  if (session.safetyOverride?.severity === "High") {
    return { rank: 1, reason: session.attribution?.rootCause ?? session.safetyOverride.detail };
  }
  if (session.verdict === "FAIL") {
    return { rank: 2, reason: session.attribution?.rootCause ?? "Failed a scoring session" };
  }
  return null;
}

function sessionRank(session: Session): number {
  return sessionReason(session)?.rank ?? 99;
}

// A run can carry a dozen-plus non-PASS sessions across its full history — an
// inbox needs to read as "a few things to look at," not a re-listing of every
// session that ever missed. Cap what surfaces per agent; the rest is a single
// "+N more" count pointing at the Scoring tab rather than N more rows.
const MAX_SESSION_ITEMS_PER_AGENT = 3;

export async function listInboxGroups(): Promise<AgentInboxGroup[]> {
  const agents = await listAgents();

  const groups = await Promise.all(
    agents.map(async (agent): Promise<AgentInboxGroup | null> => {
      const readiness = await getAgentReadiness(agent.agent_id);
      if (!readiness.ready) return null; // onboarding, not actionable — see listRestingAgents

      const [latestRuns, labelingCandidates] = await Promise.all([
        listAgentScoringRuns(agent.agent_id, { limit: 1 }),
        listLabelingQueue(agent.agent_id),
      ]);
      const latestRun = latestRuns[0];
      const runDetail = latestRun ? await getScoringRun(agent.agent_id, latestRun.id) : null;
      const sessions = runDetail?.sessions ?? [];
      const flaggedSessions = sessions
        .filter((s) => s.verdict === "FAIL" || s.safetyOverride)
        .sort((a, b) => sessionRank(a) - sessionRank(b) || new Date(b.ts).getTime() - new Date(a.ts).getTime());
      const shownSessions = flaggedSessions.slice(0, MAX_SESSION_ITEMS_PER_AGENT);
      const hiddenSessionCount = flaggedSessions.length - shownSessions.length;

      const items: InboxItem[] = [
        ...shownSessions.map(
          (session): InboxItem => ({
            kind: "session",
            agentId: agent.agent_id,
            runId: latestRun!.id,
            runLabel: latestRun!.label,
            session,
          }),
        ),
        ...labelingCandidates.map(
          (candidate): InboxItem => ({ kind: "labeling", agentId: agent.agent_id, candidate }),
        ),
      ];
      if (items.length === 0) return null;

      const ranked = [
        ...flaggedSessions.map(sessionReason).filter((r): r is RankedReason => r !== null),
        ...labelingCandidates.map((c): RankedReason => ({ rank: 4, reason: c.reason })),
      ].sort((a, b) => a.rank - b.rank);

      const severity: InboxSeverity = flaggedSessions.some((s) => s.safetyOverride?.severity === "Critical")
        ? "critical"
        : "warning";

      return {
        agentId: agent.agent_id,
        agentName: agent.name,
        agentType: agent.agentType,
        severity,
        topReason: ranked[0]?.reason ?? "Needs review",
        items,
        hiddenSessionCount,
      };
    }),
  );

  return groups
    .filter((g): g is AgentInboxGroup => g !== null)
    .sort((a, b) => {
      if (a.severity !== b.severity) return a.severity === "critical" ? -1 : 1;
      return b.items.length - a.items.length;
    });
}

export async function listRestingAgents(): Promise<RestingAgentSummary[]> {
  const [agents, groups] = await Promise.all([listAgents(), listInboxGroups()]);
  const flaggedIds = new Set(groups.map((g) => g.agentId));

  return Promise.all(
    agents
      .filter((a) => !flaggedIds.has(a.agent_id))
      .map(async (agent): Promise<RestingAgentSummary> => {
        const readiness = await getAgentReadiness(agent.agent_id);
        return readiness.ready
          ? { agentId: agent.agent_id, agentName: agent.name, agentType: agent.agentType, status: "ship" }
          : {
              agentId: agent.agent_id,
              agentName: agent.name,
              agentType: agent.agentType,
              status: "onboarding",
              captured: readiness.captured,
              threshold: readiness.threshold,
            };
      }),
  );
}
