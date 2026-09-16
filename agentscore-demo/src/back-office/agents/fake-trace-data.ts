// Fake data for the Traces cluster (AgentTracesPage, AgentTraceDetailPage,
// TraceScorePanel, InteractionResultsPanel). No backend — everything below is
// generated deterministically from the canonical fake-agent roster shared
// across the Agents section.

export interface FakeAgent {
  id: string;
  name: string;
  tenantId: string;
  tenantName: string;
  lifecycle: "active" | "external" | "internal" | "provisioning";
  deletedAt: string | null;
}

export const FAKE_AGENTS: FakeAgent[] = [
  { id: "agent-1", name: "ATA Regression Suite", tenantId: "tenant-tais", tenantName: "TAIS (Testing AI team)", lifecycle: "external", deletedAt: null },
  { id: "agent-2", name: "jira epic poller", tenantId: "tenant-tar", tenantName: "tricentisairesearch", lifecycle: "internal", deletedAt: null },
  { id: "agent-3", name: "invoice-reconciler", tenantId: "tenant-acme", tenantName: "Acme Financial", lifecycle: "active", deletedAt: null },
  { id: "agent-4", name: "support-triage-bot", tenantId: "tenant-northwind", tenantName: "Northwind Retail", lifecycle: "active", deletedAt: null },
  { id: "agent-5", name: "code-review-assistant", tenantId: "tenant-globex", tenantName: "Globex Engineering", lifecycle: "provisioning", deletedAt: null },
];

export function getFakeAgent(agentId: string): FakeAgent {
  return FAKE_AGENTS.find((a) => a.id === agentId) ?? FAKE_AGENTS[0];
}

export async function getAgent(_tenantId: string, agentId: string): Promise<{ name: string; deleted_at: string | null }> {
  const a = getFakeAgent(agentId);
  return { name: a.name, deleted_at: a.deletedAt };
}

function seededHash(seed: string, salt: number): number {
  let h = salt * 2654435769;
  for (const c of seed) h = (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0;
  return h;
}
function di(seed: string, range: number, salt: number): number {
  return seededHash(seed, salt) % range;
}

// ---------------------------------------------------------------------------
// Trace list (AgentTracesPage)
// ---------------------------------------------------------------------------

export interface TraceScoreSummary {
  run_id: string;
  score: number | null;
  scored_evals: number;
  total_evals: number;
}

export interface TraceProfile {
  trace_id: string;
  timestamp: string;
  session_id: string | null;
  name: string | null;
  latency_ms: number;
  total_tokens: number | null;
  total_cost_usd: number | null;
  status: "ok" | "warning" | "error";
  score: TraceScoreSummary | null;
}

const TRACE_NAMES = ["invoke_agent", "run_test_suite", "score_interaction", "poll_queue", "reconcile_batch", "triage_ticket"];

export const TRACE_EXPORT_CAP = 5000;

const traceCache = new Map<string, TraceProfile[]>();

function buildTracesForAgent(agentId: string): TraceProfile[] {
  if (traceCache.has(agentId)) return traceCache.get(agentId)!;
  const agent = getFakeAgent(agentId);
  const count = agent.lifecycle === "provisioning" ? 2 : 18 + di(agentId, 8, 1);
  const now = Date.now();
  const out: TraceProfile[] = [];
  for (let i = 0; i < count; i++) {
    const seed = `${agentId}-trace-${i}`;
    const ts = new Date(now - i * (1000 * 60 * (20 + di(seed, 240, 2)))).toISOString();
    const statusRoll = di(seed, 10, 3);
    const status: TraceProfile["status"] = statusRoll < 1 ? "error" : statusRoll < 3 ? "warning" : "ok";
    const scored = di(seed, 10, 4) < 7;
    out.push({
      trace_id: `trace-${agentId}-${i}`,
      timestamp: ts,
      session_id: di(seed, 10, 5) < 8 ? `sess-${agentId}-${Math.floor(i / 3)}` : null,
      name: `${TRACE_NAMES[di(seed, TRACE_NAMES.length, 6)]}`,
      latency_ms: 400 + di(seed, 12000, 7),
      total_tokens: 200 + di(seed, 4000, 8),
      total_cost_usd: (200 + di(seed, 4000, 8)) * 0.000006,
      status,
      score: scored
        ? {
            run_id: `run-${agentId}-${Math.floor(i / 5)}`,
            score: status === "error" ? null : 0.55 + di(seed, 45, 9) / 100,
            scored_evals: 3 + di(seed, 4, 10),
            total_evals: 6 + di(seed, 2, 11),
          }
        : null,
    });
  }
  traceCache.set(agentId, out);
  return out;
}

export interface ListAgentTracesParams {
  cursor?: string;
  limit: number;
  from: string;
  to: string;
  search?: string;
  session_id?: string;
}

export interface TraceListResponse {
  items: TraceProfile[];
  total: number;
  next_cursor: string | null;
}

export async function listAgentTraces(_tenantId: string, agentId: string, params: ListAgentTracesParams): Promise<TraceListResponse> {
  let traces = buildTracesForAgent(agentId);
  if (params.search) {
    const q = params.search.toLowerCase();
    traces = traces.filter((t) => t.trace_id.toLowerCase().includes(q) || (t.name ?? "").toLowerCase().includes(q));
  }
  if (params.session_id) {
    traces = traces.filter((t) => t.session_id === params.session_id);
  }
  const offset = params.cursor ? Number(params.cursor) : 0;
  const page = traces.slice(offset, offset + params.limit);
  const nextOffset = offset + params.limit;
  return {
    items: page,
    total: traces.length,
    next_cursor: nextOffset < traces.length ? String(nextOffset) : null,
  };
}

export async function exportAgentTraces(_tenantId: string, agentId: string, _params: Record<string, unknown>): Promise<Blob> {
  const traces = buildTracesForAgent(agentId);
  const lines = traces.map((t) => JSON.stringify(t)).join("\n");
  return new Blob([lines], { type: "application/x-ndjson" });
}

// ---------------------------------------------------------------------------
// Trace detail (AgentTraceDetailPage)
// ---------------------------------------------------------------------------

export interface ObservationNode {
  observation_id: string;
  parent_observation_id: string | null;
  name: string | null;
  type: string;
  model: string | null;
  start_time: string;
  end_time: string | null;
  latency_ms: number | null;
  total_tokens: number | null;
  input_tokens: number | null;
  output_tokens: number | null;
  cost_usd: number | null;
  level: string | null;
  status_message: string | null;
  input: unknown;
  output: unknown;
  tool_calls: unknown[] | null;
  tool_call_names: string[] | null;
  token_usage: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
    cache_read_tokens?: number;
    cache_write_tokens?: number;
    reasoning_tokens?: number;
  } | null;
}

export interface TraceDetail {
  trace_id: string;
  name: string | null;
  timestamp: string;
  session_id: string | null;
  total_latency_ms: number | null;
  input: unknown;
  output: unknown;
  observations: ObservationNode[];
  token_usage: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
    cache_read_tokens?: number;
    cache_write_tokens?: number;
    reasoning_tokens?: number;
    cache_semantics_mixed?: boolean;
  } | null;
}

const traceDetailCache = new Map<string, TraceDetail>();

export async function getAgentTrace(_tenantId: string, agentId: string, traceId: string, _timestamp: string): Promise<TraceDetail> {
  const key = `${agentId}:${traceId}`;
  if (traceDetailCache.has(key)) return traceDetailCache.get(key)!;
  const list = buildTracesForAgent(agentId);
  const profile = list.find((t) => t.trace_id === traceId) ?? list[0];
  const startMs = new Date(profile.timestamp).getTime();

  const rootId = `${traceId}-obs-root`;
  const llmId = `${traceId}-obs-llm`;
  const toolId = `${traceId}-obs-tool`;
  const llm2Id = `${traceId}-obs-llm2`;

  const observations: ObservationNode[] = [
    {
      observation_id: rootId,
      parent_observation_id: null,
      name: profile.name,
      type: "SPAN",
      model: null,
      start_time: new Date(startMs).toISOString(),
      end_time: new Date(startMs + profile.latency_ms).toISOString(),
      latency_ms: profile.latency_ms,
      total_tokens: profile.total_tokens,
      input_tokens: null,
      output_tokens: null,
      cost_usd: profile.total_cost_usd,
      level: "DEFAULT",
      status_message: profile.status === "error" ? "Task failed after 2 retries." : null,
      input: { scenario: profile.name, session_id: profile.session_id },
      output: profile.status === "error" ? { error: "downstream timeout" } : { status: "ok" },
      tool_calls: null,
      tool_call_names: null,
      token_usage: null,
    },
    {
      observation_id: llmId,
      parent_observation_id: rootId,
      name: "chat.completions claude-sonnet-4-6",
      type: "GENERATION",
      model: "claude-sonnet-4-6",
      start_time: new Date(startMs + 40).toISOString(),
      end_time: new Date(startMs + 40 + Math.round(profile.latency_ms * 0.35)).toISOString(),
      latency_ms: Math.round(profile.latency_ms * 0.35),
      total_tokens: 320,
      input_tokens: 210,
      output_tokens: 110,
      cost_usd: 0.0021,
      level: "DEFAULT",
      status_message: null,
      input: [{ role: "user", content: `Plan how to handle: ${profile.name}` }],
      output: [{ role: "assistant", content: "I'll call the relevant tool, then summarize the result." }],
      tool_calls: null,
      tool_call_names: null,
      token_usage: { input_tokens: 210, output_tokens: 110, total_tokens: 320, cache_read_tokens: 64, reasoning_tokens: 18 },
    },
    {
      observation_id: toolId,
      parent_observation_id: rootId,
      name: "tool.lookup",
      type: "SPAN",
      model: null,
      start_time: new Date(startMs + 40 + Math.round(profile.latency_ms * 0.35) + 10).toISOString(),
      end_time: new Date(startMs + 40 + Math.round(profile.latency_ms * 0.6)).toISOString(),
      latency_ms: Math.round(profile.latency_ms * 0.25),
      total_tokens: null,
      input_tokens: null,
      output_tokens: null,
      cost_usd: null,
      level: "DEFAULT",
      status_message: null,
      input: { query: profile.session_id ?? profile.trace_id },
      output: { status: profile.status === "error" ? "error" : "ok", rows: 3 },
      tool_calls: [{ name: "lookup", args: { id: profile.trace_id } }],
      tool_call_names: ["lookup"],
      token_usage: null,
    },
    {
      observation_id: llm2Id,
      parent_observation_id: rootId,
      name: "chat.completions claude-sonnet-4-6",
      type: "GENERATION",
      model: "claude-sonnet-4-6",
      start_time: new Date(startMs + Math.round(profile.latency_ms * 0.75)).toISOString(),
      end_time: new Date(startMs + profile.latency_ms - 20).toISOString(),
      latency_ms: Math.round(profile.latency_ms * 0.2),
      total_tokens: 180,
      input_tokens: 130,
      output_tokens: 50,
      cost_usd: 0.0013,
      level: "DEFAULT",
      status_message: null,
      input: [{ role: "user", content: "Summarize the tool result for the final answer." }],
      output: [{ role: "assistant", content: profile.status === "error" ? "Unable to complete — downstream error." : "Done — result validated and recorded." }],
      tool_calls: null,
      tool_call_names: null,
      token_usage: { input_tokens: 130, output_tokens: 50, total_tokens: 180 },
    },
  ];

  const detail: TraceDetail = {
    trace_id: traceId,
    name: profile.name,
    timestamp: profile.timestamp,
    session_id: profile.session_id,
    total_latency_ms: profile.latency_ms,
    input: { scenario: profile.name },
    output: profile.status === "error" ? { error: "downstream timeout" } : { status: "ok" },
    observations,
    token_usage: {
      input_tokens: 340,
      output_tokens: 160,
      total_tokens: 500,
      cache_read_tokens: 64,
      reasoning_tokens: 18,
    },
  };
  traceDetailCache.set(key, detail);
  return detail;
}

export async function getAgentObservation(
  _tenantId: string,
  agentId: string,
  traceId: string,
  observationId: string,
  _startTime: string,
): Promise<{ input: unknown; output: unknown; tool_calls: unknown[] | null; tool_call_names: string[] | null }> {
  const detail = await getAgentTrace("", agentId, traceId, "");
  const obs = detail.observations.find((o) => o.observation_id === observationId);
  return { input: obs?.input ?? null, output: obs?.output ?? null, tool_calls: obs?.tool_calls ?? null, tool_call_names: obs?.tool_call_names ?? null };
}

// ---------------------------------------------------------------------------
// Trace score detail (TraceScorePanel)
// ---------------------------------------------------------------------------

export interface TraceEvalResultOut {
  evalSlug: string;
  score: number | null;
  reason: string | null;
  sampleCount: number;
  nullCount: number;
  evidenceRefs: unknown[] | null;
}

export interface TraceScoreDetailOut {
  run: { runId: string; state: string } | null;
  score: number | null;
  scoredEvals: number;
  totalEvals: number;
  results: TraceEvalResultOut[];
}

const EVAL_SLUGS = ["correctness.answer_accuracy", "relevance.on_topic", "efficiency.tool_use", "safety.no_pii_leak", "consistency.repeatable", "groundedness.cites_evidence"];

const traceScoreState = new Map<string, TraceScoreDetailOut>();

function buildTraceScore(agentId: string, traceId: string): TraceScoreDetailOut {
  const list = buildTracesForAgent(agentId);
  const profile = list.find((t) => t.trace_id === traceId);
  if (!profile?.score) {
    return { run: null, score: null, scoredEvals: 0, totalEvals: 0, results: [] };
  }
  const results: TraceEvalResultOut[] = EVAL_SLUGS.slice(0, profile.score.total_evals).map((slug, i) => {
    const scored = i < profile.score!.scored_evals;
    return {
      evalSlug: slug,
      score: scored ? 0.6 + di(`${traceId}-${slug}`, 40, 20) / 100 : null,
      reason: scored ? `Judge found the response met the "${slug.split(".")[1].replace(/_/g, " ")}" bar for this interaction.` : null,
      sampleCount: 3,
      nullCount: scored ? 0 : 3,
      evidenceRefs: scored ? [{ kind: "span", value: `${traceId}-obs-llm` }] : null,
    };
  });
  return {
    run: { runId: profile.score.run_id, state: "complete" },
    score: profile.score.score,
    scoredEvals: profile.score.scored_evals,
    totalEvals: profile.score.total_evals,
    results,
  };
}

export async function getTraceScoreDetail(_tenantId: string, agentId: string, traceId: string): Promise<TraceScoreDetailOut> {
  const key = `${agentId}:${traceId}`;
  if (!traceScoreState.has(key)) traceScoreState.set(key, buildTraceScore(agentId, traceId));
  return traceScoreState.get(key)!;
}

export class TraceRunConflictError extends Error {
  runId: string;
  constructor(runId: string) {
    super("This trace is already being scored by another run.");
    this.runId = runId;
  }
}

// ---------------------------------------------------------------------------
// Run interactions (InteractionResultsPanel)
// ---------------------------------------------------------------------------

export type RunInteractionEvidenceFilter = "all" | "available" | "insufficient" | "missing";

export interface RunInteractionSummaryOut {
  id: string;
  interactionRef: string;
  inputPreview: { availability: "available" | "missing"; value: string | null; truncated: boolean };
  verdictCount: number;
  expectedCount: number;
  scoredCount: number;
  insufficientEvidenceCount: number;
}

export interface RunInteractionValueOut {
  availability: "available" | "missing";
  value: string | null;
}

export interface RunInteractionEvaluationOut {
  id: string;
  evalSlug: string;
  score: number | null;
}

export interface RunInteractionDetailOut {
  interactionRef: string;
  input: RunInteractionValueOut;
  output: RunInteractionValueOut;
  evaluations: RunInteractionEvaluationOut[];
  traceNavigationRef: { traceId: string; timestamp: string | null };
}

function buildInteractionsForRun(runId: string): RunInteractionSummaryOut[] {
  const count = 10 + di(runId, 6, 40);
  const out: RunInteractionSummaryOut[] = [];
  for (let i = 0; i < count; i++) {
    const seed = `${runId}-int-${i}`;
    const expected = 4 + di(seed, 3, 41);
    const scored = di(seed, 10, 42) < 8 ? expected - di(seed, 2, 43) : Math.max(0, expected - 2 - di(seed, 2, 44));
    const insufficient = expected - scored;
    out.push({
      id: `${runId}-interaction-${i}`,
      interactionRef: `interaction-${runId}-${i}`,
      inputPreview: { availability: "available", value: `Sample request #${i} for ${runId}`, truncated: di(seed, 5, 45) === 0 },
      verdictCount: scored + insufficient,
      expectedCount: expected,
      scoredCount: scored,
      insufficientEvidenceCount: insufficient,
    });
  }
  return out;
}

export interface ListRunInteractionsParams {
  cursor: string | null;
  limit: number;
  search?: string;
  evalSlug?: string;
  evidence: RunInteractionEvidenceFilter;
}

export interface RunInteractionListOut {
  items: RunInteractionSummaryOut[];
  total: number;
  nextCursor: string | null;
  scannedCount: number;
}

export async function listRunInteractions(runId: string, params: ListRunInteractionsParams): Promise<RunInteractionListOut> {
  let items = buildInteractionsForRun(runId);
  if (params.search) {
    const q = params.search.toLowerCase();
    items = items.filter((it) => it.interactionRef.toLowerCase().includes(q) || (it.inputPreview.value ?? "").toLowerCase().includes(q));
  }
  if (params.evidence === "insufficient") items = items.filter((it) => it.insufficientEvidenceCount > 0);
  if (params.evidence === "available") items = items.filter((it) => it.insufficientEvidenceCount === 0);
  if (params.evidence === "missing") items = items.filter((it) => it.verdictCount < it.expectedCount);

  const offset = params.cursor ? Number(params.cursor) : 0;
  const page = items.slice(offset, offset + params.limit);
  const nextOffset = offset + params.limit;
  return {
    items: page,
    total: items.length,
    nextCursor: nextOffset < items.length ? String(nextOffset) : null,
    scannedCount: page.length,
  };
}

export async function getRunInteraction(runId: string, interactionRef: string): Promise<RunInteractionDetailOut> {
  const idx = Number(interactionRef.split("-").pop());
  const evaluations: RunInteractionEvaluationOut[] = EVAL_SLUGS.map((slug, i) => ({
    id: `${interactionRef}-eval-${i}`,
    evalSlug: slug,
    score: di(`${interactionRef}-${slug}`, 10, 50) < 8 ? 0.5 + di(`${interactionRef}-${slug}`, 45, 51) / 100 : null,
  }));
  return {
    interactionRef,
    input: { availability: "available", value: `Sample request #${idx} for ${runId}` },
    output: { availability: "available", value: "Sample agent response text for this interaction." },
    evaluations,
    traceNavigationRef: { traceId: `trace-agent-1-${idx % 5}`, timestamp: new Date().toISOString() },
  };
}

export async function triggerTraceRun(_tenantId: string, agentId: string, traceId: string, _body: { timestamp: string }): Promise<{ runId: string }> {
  const runId = `run-${agentId}-manual-${Date.now()}`;
  const key = `${agentId}:${traceId}`;
  await new Promise((r) => setTimeout(r, 500));
  traceScoreState.set(key, {
    run: { runId, state: "complete" },
    score: 0.7 + di(traceId, 25, 99) / 100,
    scoredEvals: 5,
    totalEvals: 6,
    results: EVAL_SLUGS.slice(0, 6).map((slug, i) => ({
      evalSlug: slug,
      score: i < 5 ? 0.65 + di(`${traceId}-${slug}-manual`, 30, 21) / 100 : null,
      reason: i < 5 ? "Manually triggered re-score confirmed the prior verdict." : null,
      sampleCount: 3,
      nullCount: i < 5 ? 0 : 3,
      evidenceRefs: i < 5 ? [{ kind: "span", value: `${traceId}-obs-llm` }] : null,
    })),
  });
  return { runId };
}
