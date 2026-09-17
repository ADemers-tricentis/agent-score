// Fake data for the Score/Runs cluster (AgentScorePage, ScorecardTab, RunsTab,
// ScoringRunResultPage, RunEvaluationDetail, run-actions). No backend - every
// export here is a plain, deterministic in-memory fixture standing in for
// what scoring-api.ts's react-query hooks used to fetch.

export interface FakeAgent {
  id: string;
  name: string;
  tenantId: string;
  tenantName: string;
}

export const FAKE_AGENTS: FakeAgent[] = [
  { id: "agent-1", name: "ATA Regression Suite", tenantId: "tenant-tais", tenantName: "TAIS (Testing AI team)" },
  { id: "agent-2", name: "jira epic poller", tenantId: "tenant-tar", tenantName: "tricentisairesearch" },
  { id: "agent-3", name: "invoice-reconciler", tenantId: "tenant-acme", tenantName: "Acme Financial" },
  { id: "agent-4", name: "support-triage-bot", tenantId: "tenant-northwind", tenantName: "Northwind Retail" },
  { id: "agent-5", name: "code-review-assistant", tenantId: "tenant-globex", tenantName: "Globex Engineering" },
];

export function getAgent(agentId: string): FakeAgent {
  return FAKE_AGENTS.find((a) => a.id === agentId) ?? FAKE_AGENTS[0];
}

interface FakeMetric {
  evalSlug: string;
  dimensionSlug: string;
  status: "good" | "partial" | "fail" | "n_a";
  mean: number | null;
  target: number | null;
  evidenceRefs?: string[];
}

interface FakeRun {
  runId: string;
  agentId: string;
  mode: "population" | "golden_match";
  state: "queued" | "running" | "complete" | "partial" | "failed" | "cancelled";
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  compositeScore: number | null;
  verdict: "ship" | "review" | "block" | "insufficient_sample" | null;
  shipDecision: "ship" | "needs_work" | "dont_ship" | "provisional" | null;
  confidence: { lower: number; upper: number } | null;
  scoredCount: number;
  skippedCount: number;
  failedCount: number;
  evalsAssigned: number | null;
  evalsScored: number | null;
  retiredCount: number | null;
  isBaseline: boolean;
  isProvisional: boolean;
  provisionalReasons: string[] | null;
  genuineFailureRate: number;
  deltaVsBaseline: number | null;
  deltaApproximate: boolean;
  spansRevisionBoundary: boolean;
  baselineRunId: string | null;
  singleTraceRef: string | null;
  sampleSize: number;
  requestedSampleSize: number | null;
  metrics: FakeMetric[];
  dimensionAggregates: Record<string, { dimensionSlug: string; score: number | null; weight: number; nScored: number; nPassed: number; contributingEvals: string[] }> | null;
  excludedDimensions: string[];
  failureReason: string | null;
  emptyReason: string | null;
  exclusionRefusedReason: string | null;
  newlyScoredCount: number | null;
  reusedCount: number | null;
  candidatesExamined: number | null;
  ledgerCostUsd: number | null;
  benchmarkVersion: number;
  revisionLabel: string;
  profileVersionId: string | null;
  failureSummary: { evalSlug: string; humanReason: string; errorClass: string; count: number }[] | null;
  metricsPresent: string[];
  lowSampleMetrics: string[];
  benchmarkConfigSnapshot: Record<string, unknown>;
}

const DIMENSIONS = ["correctness", "relevance", "quality_efficiency", "safety"];
const EVALS_BY_DIM: Record<string, string[]> = {
  correctness: ["correctness.answer_accuracy", "correctness.task_completion"],
  relevance: ["relevance.context_alignment"],
  quality_efficiency: ["quality_efficiency.conciseness", "quality_efficiency.latency"],
  safety: ["safety.harmlessness"],
};

function buildMetrics(seed: number, degrade: boolean): FakeMetric[] {
  const metrics: FakeMetric[] = [];
  for (const dim of DIMENSIONS) {
    for (const slug of EVALS_BY_DIM[dim]) {
      const bad = degrade && (seed + slug.length) % 3 === 0;
      const mean = bad ? 0.42 + (seed % 10) / 100 : 0.78 + (seed % 15) / 100;
      metrics.push({
        evalSlug: slug,
        dimensionSlug: dim,
        status: bad ? "fail" : mean > 0.9 ? "good" : "good",
        mean: Math.min(0.98, mean),
        target: 0.7,
        evidenceRefs: [`span-${seed}-${slug.slice(0, 3)}`],
      });
    }
  }
  return metrics;
}

function buildDimensionAggregates(metrics: FakeMetric[]): FakeRun["dimensionAggregates"] {
  const out: FakeRun["dimensionAggregates"] = {};
  const weights: Record<string, number> = { correctness: 3, relevance: 2, quality_efficiency: 1, safety: 3 };
  for (const dim of DIMENSIONS) {
    const rows = metrics.filter((m) => m.dimensionSlug === dim);
    const scored = rows.filter((r) => r.mean != null);
    const avg = scored.length ? scored.reduce((s, r) => s + (r.mean ?? 0), 0) / scored.length : null;
    out[dim] = {
      dimensionSlug: dim,
      score: avg,
      weight: weights[dim] ?? 1,
      nScored: scored.length,
      nPassed: rows.filter((r) => r.status === "good").length,
      contributingEvals: rows.map((r) => r.evalSlug),
    };
  }
  return out;
}

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86400000).toISOString();
}

function makeRun(agentId: string, idx: number, opts: Partial<FakeRun> & { seed: number }): FakeRun {
  const { seed, ...overrides } = opts;
  const degrade = seed % 4 === 0;
  const metrics = overrides.metrics ?? buildMetrics(seed, degrade);
  const composite = overrides.compositeScore !== undefined ? overrides.compositeScore : Math.round((degrade ? 62 + (seed % 10) : 84 + (seed % 12)) * 10) / 10;
  const compositeForMath = composite ?? 50;
  const verdict = overrides.verdict ?? (compositeForMath >= 85 ? "ship" : compositeForMath >= 55 ? "review" : "block");
  const shipDecision = overrides.shipDecision ?? (compositeForMath >= 85 ? "ship" : compositeForMath >= 55 ? "needs_work" : "dont_ship");
  return {
    runId: `run-${agentId}-${idx}`,
    agentId,
    mode: "population",
    state: "complete",
    createdAt: daysAgo(idx * 3),
    startedAt: daysAgo(idx * 3),
    completedAt: daysAgo(idx * 3 - 0.01),
    compositeScore: composite,
    verdict,
    shipDecision,
    confidence: composite == null ? null : { lower: Math.max(0, composite - 6), upper: Math.min(100, composite + 6) },
    scoredCount: 18 + (seed % 6),
    skippedCount: seed % 3,
    failedCount: 0,
    evalsAssigned: metrics.length,
    evalsScored: metrics.filter((m) => m.mean != null).length,
    retiredCount: 0,
    isBaseline: idx === 4,
    isProvisional: false,
    provisionalReasons: null,
    genuineFailureRate: 0,
    deltaVsBaseline: idx === 4 || composite == null ? null : Math.round((composite - 82) * 10) / 10,
    deltaApproximate: false,
    spansRevisionBoundary: false,
    baselineRunId: idx === 4 ? null : `run-${agentId}-4`,
    singleTraceRef: null,
    sampleSize: 20,
    requestedSampleSize: 20,
    metrics,
    dimensionAggregates: buildDimensionAggregates(metrics),
    excludedDimensions: [],
    failureReason: null,
    emptyReason: null,
    exclusionRefusedReason: null,
    newlyScoredCount: 16 + (seed % 4),
    reusedCount: seed % 3,
    candidatesExamined: 22 + (seed % 5),
    ledgerCostUsd: 0.42 + (seed % 10) / 20,
    benchmarkVersion: 3,
    revisionLabel: `v1.${4 - Math.min(idx, 4)}`,
    profileVersionId: "profile-v-1",
    failureSummary: null,
    metricsPresent: metrics.map((m) => m.evalSlug),
    lowSampleMetrics: [],
    benchmarkConfigSnapshot: {
      verdict_bands: { ship: 85, review: 55, block: 0 },
      dimension_weights: { correctness: 3, relevance: 2, quality_efficiency: 1, safety: 3 },
      excluded_checks: [],
      metrics: metrics.map((m) => ({ eval_slug: m.evalSlug })),
    },
    ...overrides,
  };
}

const RUNS_BY_AGENT: Record<string, FakeRun[]> = {
  "agent-sample": [
    makeRun("agent-sample", 0, { seed: 5, compositeScore: 87, verdict: "ship", shipDecision: "ship" }),
    makeRun("agent-sample", 1, { seed: 9, compositeScore: 83, verdict: "ship", shipDecision: "ship" }),
  ],
  "agent-1": [
    makeRun("agent-1", 0, { seed: 7, compositeScore: 84, verdict: "review", shipDecision: "needs_work" }),
    makeRun("agent-1", 1, { seed: 3 }),
    makeRun("agent-1", 2, { seed: 11 }),
    makeRun("agent-1", 3, {
      seed: 4,
      state: "partial",
      isProvisional: true,
      provisionalReasons: ["high_failure_rate"],
      genuineFailureRate: 0.34,
      compositeScore: null,
      verdict: null,
      shipDecision: "provisional",
      failureSummary: [{ evalSlug: "correctness.answer_accuracy", humanReason: "Judge model timed out on 6 interactions", errorClass: "JudgeTimeoutError", count: 6 }],
    }),
    makeRun("agent-1", 4, { seed: 1, compositeScore: 82, verdict: "review", shipDecision: "needs_work" }),
  ],
  "agent-2": [
    makeRun("agent-2", 0, { seed: 9, compositeScore: 91, verdict: "ship", shipDecision: "ship" }),
    makeRun("agent-2", 1, { seed: 5, compositeScore: 79, verdict: "review", shipDecision: "needs_work" }),
    makeRun("agent-2", 2, { seed: 13, compositeScore: 88, verdict: "ship", shipDecision: "ship" }),
    makeRun("agent-2", 3, { seed: 2, compositeScore: 85, verdict: "ship", shipDecision: "ship" }),
    makeRun("agent-2", 4, { seed: 6, compositeScore: 80, verdict: "review", shipDecision: "needs_work" }),
  ],
  "agent-3": [
    makeRun("agent-3", 0, { seed: 8, compositeScore: 90, verdict: "ship", shipDecision: "ship" }),
    makeRun("agent-3", 1, { seed: 2, compositeScore: 87, verdict: "ship", shipDecision: "ship" }),
  ],
  "agent-4": [
    makeRun("agent-4", 0, { seed: 12, compositeScore: 76, verdict: "review", shipDecision: "needs_work" }),
    makeRun("agent-4", 1, { seed: 4, compositeScore: 71, verdict: "review", shipDecision: "needs_work" }),
  ],
  "agent-5": [],
};

export function getRunsForAgent(agentId: string): FakeRun[] {
  return RUNS_BY_AGENT[agentId] ?? [];
}

export function getRunById(agentId: string, runId: string): FakeRun | undefined {
  return getRunsForAgent(agentId).find((r) => r.runId === runId);
}

export function getScoreAnchorRun(agentId: string): FakeRun | null {
  const runs = getRunsForAgent(agentId);
  return runs.find((r) => r.state === "complete" || r.state === "partial" || r.state === "failed") ?? null;
}

export function getBenchmarkForAgent(agentId: string) {
  const runs = getRunsForAgent(agentId);
  return {
    hasEnabledChecks: agentId !== "agent-5",
    needsProfileAttention: agentId === "agent-1",
    minSampleForVerdict: 20,
    firstRealScoreReachedAt: runs.length ? runs[runs.length - 1].createdAt : null,
  };
}

export function getTrendPoints(agentId: string): { compositeScore: number | null; createdAt: string; runId: string; profileChangedFromPrev: boolean }[] {
  return getRunsForAgent(agentId)
    .filter((r) => r.compositeScore != null)
    .map((r, i) => ({ compositeScore: r.compositeScore, createdAt: r.createdAt, runId: r.runId, profileChangedFromPrev: i === 2 }));
}

export function getEvalTrendPoints(agentId: string, evalSlug: string): { runId: string; profileVersionId: string | null; mean: number | null; createdAt: string }[] {
  return getRunsForAgent(agentId).map((r) => {
    const m = r.metrics.find((x) => x.evalSlug === evalSlug);
    return { runId: r.runId, profileVersionId: r.profileVersionId, mean: m?.mean ?? null, createdAt: r.createdAt };
  });
}

export function getVersionGrades(agentId: string) {
  const runs = getRunsForAgent(agentId).filter((r) => r.compositeScore != null);
  const byLabel = new Map<string, FakeRun[]>();
  for (const r of runs) {
    const bucket = byLabel.get(r.revisionLabel);
    if (bucket) bucket.push(r);
    else byLabel.set(r.revisionLabel, [r]);
  }
  return [...byLabel.entries()].map(([revisionLabel, rows]) => ({
    revisionLabel,
    latestRun: { shipDecision: rows[0].shipDecision },
    runCount: rows.length,
    bestComposite: Math.max(...rows.map((r) => r.compositeScore ?? 0)),
  }));
}

export function getDrillThroughInteractions(agentId: string, runId: string, evalSlug: string): { traceId: string; value: number; reason: string | null; evidenceRefs: string[] }[] {
  const run = getRunById(agentId, runId);
  if (!run) return [];
  const metric = run.metrics.find((m) => m.evalSlug === evalSlug);
  const base = metric?.mean ?? 0.7;
  return Array.from({ length: 4 }, (_, i) => ({
    traceId: `trace-${runId}-${i}`,
    value: Math.max(0, Math.min(1, base + (i % 2 === 0 ? 0.05 : -0.08))),
    reason: i === 0 ? "Answer matched the expected outcome on key facts." : i === 3 ? "Response omitted a required disclaimer." : null,
    evidenceRefs: [`${runId}-span-${i}`],
  }));
}

let runCounter = 1000;

/** Fakes triggerRun: appends a new "running" run and returns its id. */
export function createFakeRun(agentId: string, mode: "population" | "golden_match", sampleSize?: number): { runId: string } {
  const runId = `run-${agentId}-new-${runCounter++}`;
  const runs = getRunsForAgent(agentId);
  const seed = runCounter % 15;
  const metrics = buildMetrics(seed, false);
  runs.unshift({
    ...makeRun(agentId, -1, { seed }),
    runId,
    mode,
    state: "queued",
    sampleSize: sampleSize ?? 20,
    requestedSampleSize: sampleSize ?? null,
    metrics,
  });
  return { runId };
}

/** Fakes the queued/running → complete transition after a short delay, so a
 * freshly-triggered run resolves to a real result instead of spinning forever. */
export function settleFakeRun(agentId: string, runId: string) {
  const run = getRunById(agentId, runId);
  if (run) {
    run.state = "complete";
    run.startedAt = run.startedAt ?? new Date().toISOString();
    run.completedAt = new Date().toISOString();
  }
}
