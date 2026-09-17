// No backend. Fake data for PricingTab / TaskRoutingTab / UsageLogTab /
// UsageCallDetailPage - model prices, task-type routing, and the LLM usage
// ledger + payload. Shapes mirror the real OpenAPI wire types closely enough
// for the cloned UI to render unmodified.
import { FAKE_AGENTS } from "@/back-office/agents/fake-data";
import { TENANTS } from "@/back-office/tenants/tenant-fixtures";
import type { ModelPriceOut } from "@/back-office/llm-catalog/pricing-schema";

export interface FakeInference {
  id: string;
  name: string;
  provider: "anthropic" | "openai" | "azure" | "bedrock";
  modelId: string;
  isDefault: boolean;
  deleted: boolean;
}

export const FAKE_INFERENCES: FakeInference[] = [
  { id: "inf-sonnet", name: "Claude Sonnet 4.6 (default)", provider: "anthropic", modelId: "claude-sonnet-4-6", isDefault: true, deleted: false },
  { id: "inf-haiku", name: "Claude Haiku 4.5 (fast)", provider: "anthropic", modelId: "claude-haiku-4-5", isDefault: false, deleted: false },
  { id: "inf-opus", name: "Claude Opus 4.8 (high quality)", provider: "anthropic", modelId: "claude-opus-4-8", isDefault: false, deleted: false },
  { id: "inf-gpt4o", name: "GPT-4o (fallback)", provider: "openai", modelId: "gpt-4o", isDefault: false, deleted: false },
  { id: "inf-gpt4o-mini", name: "GPT-4o mini (retired)", provider: "openai", modelId: "gpt-4o-mini", isDefault: false, deleted: true },
];

export function selectableInferences(): FakeInference[] {
  return FAKE_INFERENCES.filter((i) => !i.deleted);
}

// --- Pricing -----------------------------------------------------------

let _prices: ModelPriceOut[] = [
  { id: "price-1", provider: "anthropic", modelId: "claude-sonnet-4-6", effectiveFrom: "2026-06-01", inputPricePerMillionUsd: "3.00", outputPricePerMillionUsd: "15.00", cacheReadPricePerMillionUsd: "0.30", cacheWritePricePerMillionUsd: "3.75", manuallyOverridden: false } as unknown as ModelPriceOut,
  { id: "price-2", provider: "anthropic", modelId: "claude-haiku-4-5", effectiveFrom: "2026-06-01", inputPricePerMillionUsd: "0.80", outputPricePerMillionUsd: "4.00", cacheReadPricePerMillionUsd: "0.08", cacheWritePricePerMillionUsd: "1.00", manuallyOverridden: false } as unknown as ModelPriceOut,
  { id: "price-3", provider: "anthropic", modelId: "claude-opus-4-8", effectiveFrom: "2026-05-15", inputPricePerMillionUsd: "15.00", outputPricePerMillionUsd: "75.00", cacheReadPricePerMillionUsd: "1.50", cacheWritePricePerMillionUsd: "18.75", manuallyOverridden: true } as unknown as ModelPriceOut,
  { id: "price-4", provider: "openai", modelId: "gpt-4o", effectiveFrom: "2026-04-01", inputPricePerMillionUsd: "2.50", outputPricePerMillionUsd: "10.00", cacheReadPricePerMillionUsd: null, cacheWritePricePerMillionUsd: null, manuallyOverridden: false } as unknown as ModelPriceOut,
  { id: "price-5", provider: "openai", modelId: "gpt-4o-mini", effectiveFrom: "2026-04-01", inputPricePerMillionUsd: "0.15", outputPricePerMillionUsd: "0.60", cacheReadPricePerMillionUsd: null, cacheWritePricePerMillionUsd: null, manuallyOverridden: false } as unknown as ModelPriceOut,
];

export function listPricesFake(): ModelPriceOut[] {
  return _prices;
}
export function createPriceFake(body: Partial<ModelPriceOut>): ModelPriceOut {
  const row = { id: `price-${Date.now()}`, manuallyOverridden: true, ...body } as ModelPriceOut;
  _prices = [row, ..._prices];
  return row;
}
export function updatePriceFake(id: string, body: Partial<ModelPriceOut>): ModelPriceOut {
  let updated: ModelPriceOut | undefined;
  _prices = _prices.map((p) => {
    if (p.id !== id) return p;
    updated = { ...p, ...body, manuallyOverridden: true };
    return updated;
  });
  return updated ?? (body as ModelPriceOut);
}
export function deletePriceFake(id: string): void {
  _prices = _prices.filter((p) => p.id !== id);
}

// --- Task routing --------------------------------------------------------

export interface FakeTaskAssignment {
  taskType: string;
  inference: { inferenceId: string } | null;
  resolvedInference: { name: string } | null;
  inherited: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

let _assignments: FakeTaskAssignment[] = [
  {
    taskType: "guide_generation",
    inference: { inferenceId: "inf-haiku" },
    resolvedInference: { name: "Claude Haiku 4.5 (fast)" },
    inherited: false,
    createdAt: "2026-07-01T10:00:00Z",
    updatedAt: "2026-07-01T10:00:00Z",
  },
];

export function listTaskAssignmentsFake(): FakeTaskAssignment[] {
  return _assignments;
}
export function upsertTaskAssignmentFake(taskType: string, inferenceId: string): FakeTaskAssignment {
  const inf = FAKE_INFERENCES.find((i) => i.id === inferenceId);
  const row: FakeTaskAssignment = {
    taskType,
    inference: { inferenceId },
    resolvedInference: inf ? { name: inf.name } : null,
    inherited: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  _assignments = [row, ..._assignments.filter((a) => a.taskType !== taskType)];
  return row;
}
export function deleteTaskAssignmentFake(taskType: string): void {
  _assignments = _assignments.filter((a) => a.taskType !== taskType);
}

// --- Usage ledger ----------------------------------------------------------

export interface FakeUsageRow {
  id: string;
  callId: string;
  createdAt: string;
  purpose: string;
  tenantName: string | null;
  agentId: string | null;
  runId: string | null;
  jobId: string | null;
  traceId: string | null;
  traceTs: string | null;
  provider: string;
  modelId: string;
  modelIdResolved: string;
  modelDiffers: boolean;
  inferenceId: string | null;
  inferenceName: string | null;
  providerRequestId: string | null;
  schemaPath: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  reasoningTokens: number | null;
  cacheReadTokens: number | null;
  cacheWriteTokens: number | null;
  costUsd: string | null;
  inputCostUsd: string | null;
  outputCostUsd: string | null;
  cacheReadCostUsd: string | null;
  cacheWriteCostUsd: string | null;
  latencyMs: number | null;
  queueWaitMs: number | null;
  failureCode: string | null;
}

const PURPOSES = ["scoring_eval", "profile_fit", "agent_card", "guide_generation", "chat_assistant", "improvement_advisor"];

function seeded(i: number, salt: number): number {
  let h = salt * 2654435769 + i * 40503;
  h = (Math.imul(h, 31) + i) >>> 0;
  return h % 1000;
}

const now = Date.now();

export const FAKE_USAGE_ROWS: FakeUsageRow[] = Array.from({ length: 24 }, (_, i) => {
  const inf = FAKE_INFERENCES[i % FAKE_INFERENCES.length];
  const tenant = TENANTS[i % TENANTS.length];
  const agent = FAKE_AGENTS[i % FAKE_AGENTS.length];
  const purpose = PURPOSES[i % PURPOSES.length];
  const failed = seeded(i, 7) % 10 === 0;
  const inputTokens = 400 + seeded(i, 1);
  const outputTokens = 120 + seeded(i, 2) / 2;
  return {
    id: `usage-${i}`,
    callId: `call-${(1000 + i).toString(16)}`,
    createdAt: new Date(now - i * 45 * 60000).toISOString(),
    purpose,
    tenantName: purpose === "guide_generation" ? null : tenant.tenant_id,
    agentId: purpose === "guide_generation" || purpose === "chat_assistant" ? null : agent.agent_id,
    runId: purpose === "scoring_eval" ? `run-${(2000 + i).toString(16)}` : null,
    jobId: `job-${(3000 + i).toString(16)}`,
    traceId: purpose === "scoring_eval" ? `trace-${(4000 + i).toString(16)}` : null,
    traceTs: purpose === "scoring_eval" ? new Date(now - i * 45 * 60000 - 60000).toISOString() : null,
    provider: inf.provider,
    modelId: inf.modelId,
    modelIdResolved: inf.modelId,
    modelDiffers: false,
    inferenceId: inf.deleted ? null : inf.id,
    inferenceName: inf.deleted ? null : inf.name,
    providerRequestId: `req_${(5000 + i).toString(16)}`,
    schemaPath: purpose === "profile_fit" ? "scoring.profile_fit.v3" : null,
    inputTokens,
    outputTokens: failed ? null : Math.round(outputTokens),
    reasoningTokens: inf.modelId.includes("opus") ? Math.round(outputTokens * 0.3) : null,
    cacheReadTokens: seeded(i, 3) % 4 === 0 ? 200 : null,
    cacheWriteTokens: seeded(i, 4) % 5 === 0 ? 150 : null,
    costUsd: failed ? null : (0.001 * inputTokens * 0.01 + 0.001 * outputTokens * 0.05).toFixed(6),
    inputCostUsd: failed ? null : (0.001 * inputTokens * 0.01).toFixed(6),
    outputCostUsd: failed ? null : (0.001 * outputTokens * 0.05).toFixed(6),
    cacheReadCostUsd: null,
    cacheWriteCostUsd: null,
    latencyMs: 400 + seeded(i, 5) * 4,
    queueWaitMs: seeded(i, 6) % 3 === 0 ? 50 + seeded(i, 6) : null,
    failureCode: failed ? "provider_error" : null,
  };
});

export function getUsageRow(callId: string): FakeUsageRow | undefined {
  return FAKE_USAGE_ROWS.find((r) => r.callId === callId);
}

export interface FakeUsagePayload {
  state: "captured" | "nothing_to_capture" | "redaction_failed" | "expired" | "purged" | "never_captured";
  promptText: string | null;
  promptTruncated: boolean;
  responseText: string | null;
  responseTruncated: boolean;
  providerErrorText: string | null;
  purgeReason: string | null;
}

export function getUsagePayload(callId: string): FakeUsagePayload {
  const row = getUsageRow(callId);
  if (!row) return { state: "never_captured", promptText: null, promptTruncated: false, responseText: null, responseTruncated: false, providerErrorText: null, purgeReason: null };
  if (row.failureCode) {
    return { state: "nothing_to_capture", promptText: null, promptTruncated: false, responseText: null, responseTruncated: false, providerErrorText: "ProviderError: upstream request timed out after 30s.", purgeReason: null };
  }
  if (row.purpose === "guide_generation") {
    return { state: "expired", promptText: null, promptTruncated: false, responseText: null, responseTruncated: false, providerErrorText: null, purgeReason: null };
  }
  return {
    state: "captured",
    promptText: `[system]\nYou are the ${row.purpose} judge.\n[user]\nEvaluate this interaction for tenant ${row.tenantName ?? "n/a"}.`,
    promptTruncated: false,
    responseText: `{"score": 0.${70 + (row.inputTokens ?? 0) % 30}, "rationale": "Meets the profile's threshold for this check."}`,
    responseTruncated: false,
    providerErrorText: null,
    purgeReason: null,
  };
}

export function usageSummaryFake(rows: FakeUsageRow[]) {
  const attempts = rows.length;
  const failures = rows.filter((r) => r.failureCode).length;
  const spend = rows.reduce((sum, r) => sum + (r.costUsd ? Number(r.costUsd) : 0), 0);
  const latencies = rows.map((r) => r.latencyMs ?? 0).sort((a, b) => a - b);
  const p50 = latencies[Math.floor(latencies.length / 2)] ?? null;
  const waits = rows.map((r) => r.queueWaitMs).filter((v): v is number => v != null);
  const waitP50 = waits.length ? waits.sort((a, b) => a - b)[Math.floor(waits.length / 2)] : null;
  return {
    spendUsd: spend.toFixed(6),
    attempts,
    failureRate: attempts ? failures / attempts : 0,
    latencyMsP50: p50,
    queueWaitMsP50: waitP50,
    queueWaitSampleCount: waits.length,
    inputTokens: rows.reduce((s, r) => s + (r.inputTokens ?? 0), 0),
    outputTokens: rows.reduce((s, r) => s + (r.outputTokens ?? 0), 0),
  };
}
