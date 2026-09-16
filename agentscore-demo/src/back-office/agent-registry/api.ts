// Fake in-memory data + hooks for the Agent Registry section - no backend.
// Manages the internal task "slots" AgentScore's own product runs on top of
// (agent_card, chat_assistant, improvement_advisor, profile_fit,
// scoring_judge), each with immutable versions and a binding (global default
// or per-tenant override) pointing at the version currently serving it.
import { useCallback, useEffect, useMemo, useState } from "react";

export class RegistryApiError extends Error {
  readonly detail: unknown;
  readonly status?: number;
  constructor(message: string, detailValue: unknown, status?: number) {
    super(message);
    this.name = "RegistryApiError";
    this.detail = detailValue;
    this.status = status;
  }
}

export interface AgentVersionRead {
  id: string;
  slotSlug: string;
  tenantId: string | null;
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

export interface AgentVersionCreate {
  slotSlug: string;
  name: string;
  instructions: string;
  toolAllowlist: string[];
  modelProvider: string;
  modelId: string;
  dollarCeilingUsd: string;
  turnCap: number | null;
  wallClockCapSeconds: number | null;
  baseVersionId?: string;
}

export interface SlotBindingImpact {
  id: string;
  slotSlug: string;
  tenantId: string | null;
  isGlobal: boolean;
}

export interface VersionRevokeRead {
  affectedBindingCount: number;
  affectedBindings: SlotBindingImpact[];
}

export interface SlotRead {
  id: string;
  slug: string;
  description: string | null;
  outputContract: Record<string, unknown>;
  toolAllowlist: string[];
  readOnly: boolean;
  priorityClass: string;
  globalVersionId: string | null;
  globalVersionNumber: number | null;
  boundVersionModelProvider: string | null;
  boundVersionModelId: string | null;
  boundVersionRevoked: boolean;
}

export interface TenantSlotRead extends Omit<SlotRead, "globalVersionId" | "globalVersionNumber"> {
  boundVersionId: string | null;
  boundVersionNumber: number | null;
  source: "global" | "tenant" | null;
  stale: boolean;
}

export type SlotBindingRead = SlotBindingImpact;

// ── Fixtures ─────────────────────────────────────────────────────────────

interface SlotDef {
  id: string;
  slug: string;
  description: string;
  outputContract: Record<string, unknown>;
  toolAllowlist: string[];
  readOnly: boolean;
  priorityClass: string;
  globalVersionId: string | null;
}

const SLOTS: Record<string, SlotDef> = {
  agent_card: {
    id: "slot-agent-card",
    slug: "agent_card",
    description: "Generates the observed Agent Card shown on each agent's Agent Card tab.",
    outputContract: { type: "object", required: ["identity", "purpose", "observedTools"] },
    toolAllowlist: ["query_traces", "summarize_content"],
    readOnly: true,
    priorityClass: "background",
    globalVersionId: "av-card-2",
  },
  chat_assistant: {
    id: "slot-chat-assistant",
    slug: "chat_assistant",
    description: "Backs the in-product chat assistant an operator can open from any agent.",
    outputContract: { type: "object", required: ["reply"] },
    toolAllowlist: ["query_traces", "query_metrics", "fetch_document"],
    readOnly: false,
    priorityClass: "interactive",
    globalVersionId: "av-chat-1",
  },
  improvement_advisor: {
    id: "slot-improvement-advisor",
    slug: "improvement_advisor",
    description: "Backs the Improve tab's advice generation.",
    outputContract: { type: "object", required: ["recommendations"] },
    toolAllowlist: ["query_traces", "get_alert_history"],
    readOnly: false,
    priorityClass: "background",
    globalVersionId: "av-advisor-3",
  },
  profile_fit: {
    id: "slot-profile-fit",
    slug: "profile_fit",
    description: "Backs auto-fit on the Profile tab - picks and re-evaluates the adopted scoring profile.",
    outputContract: { type: "object", required: ["chosenProfileVersionId", "confidence", "rationale"] },
    toolAllowlist: ["query_metrics"],
    readOnly: false,
    priorityClass: "background",
    globalVersionId: "av-fit-2",
  },
  scoring_judge: {
    id: "slot-scoring-judge",
    slug: "scoring_judge",
    description: "The default LLM judge backing scoring runs when a profile's evals don't pin their own model.",
    outputContract: { type: "object", required: ["score", "reason"] },
    toolAllowlist: [],
    readOnly: true,
    priorityClass: "interactive",
    globalVersionId: "av-judge-2",
  },
};

let VERSIONS: AgentVersionRead[] = [
  { id: "av-card-1", slotSlug: "agent_card", tenantId: null, versionNumber: 1, name: "Baseline card generator", instructions: "Summarize the agent's observed tools, purpose, and behavior from its recent traces into a structured Agent Card.", toolAllowlist: ["query_traces"], modelProvider: "anthropic", modelId: "claude-haiku-4-5", dollarCeilingUsd: "0.50", turnCap: 4, wallClockCapSeconds: 30, baseVersionId: null, createdAt: "2026-01-10T09:00:00Z", createdByUserId: null, revokedAt: null },
  { id: "av-card-2", slotSlug: "agent_card", tenantId: null, versionNumber: 2, name: "Card generator with tool summaries", instructions: "Summarize the agent's observed tools, purpose, and behavior from its recent traces into a structured Agent Card. Include a plain-language summary of each distinct tool call pattern observed.", toolAllowlist: ["query_traces", "summarize_content"], modelProvider: "anthropic", modelId: "claude-haiku-4-5", dollarCeilingUsd: "0.75", turnCap: 6, wallClockCapSeconds: 45, baseVersionId: "av-card-1", createdAt: "2026-04-02T14:00:00Z", createdByUserId: "a.demers@tricentis.com", revokedAt: null },

  { id: "av-chat-1", slotSlug: "chat_assistant", tenantId: null, versionNumber: 1, name: "Assistant v1", instructions: "You are the AgentScore in-product assistant. Answer operator questions about an agent's scoring, traces, and profile using the tools available. Be concise.", toolAllowlist: ["query_traces", "query_metrics", "fetch_document"], modelProvider: "anthropic", modelId: "claude-sonnet-4-6", dollarCeilingUsd: "2.00", turnCap: 12, wallClockCapSeconds: 90, baseVersionId: null, createdAt: "2026-02-01T10:00:00Z", createdByUserId: null, revokedAt: null },

  { id: "av-advisor-1", slotSlug: "improvement_advisor", tenantId: null, versionNumber: 1, name: "Advisor v1", instructions: "Given a scoring run's failing evals and labeled interactions, produce concrete, actionable recommendations to improve the agent or its profile.", toolAllowlist: ["query_traces"], modelProvider: "anthropic", modelId: "claude-sonnet-4-6", dollarCeilingUsd: "1.50", turnCap: 8, wallClockCapSeconds: 60, baseVersionId: null, createdAt: "2026-02-15T11:00:00Z", createdByUserId: null, revokedAt: null },
  { id: "av-advisor-2", slotSlug: "improvement_advisor", tenantId: null, versionNumber: 2, name: "Advisor v2 - cites evidence", instructions: "Given a scoring run's failing evals and labeled interactions, produce concrete, actionable recommendations to improve the agent or its profile. Cite the specific trace ids and verdicts backing each recommendation.", toolAllowlist: ["query_traces", "get_alert_history"], modelProvider: "anthropic", modelId: "claude-sonnet-4-6", dollarCeilingUsd: "1.75", turnCap: 10, wallClockCapSeconds: 60, baseVersionId: "av-advisor-1", createdAt: "2026-05-20T11:00:00Z", createdByUserId: "a.demers@tricentis.com", revokedAt: "2026-08-01T00:00:00Z" },
  { id: "av-advisor-3", slotSlug: "improvement_advisor", tenantId: null, versionNumber: 3, name: "Advisor v3 - cites evidence", instructions: "Given a scoring run's failing evals and labeled interactions, produce concrete, actionable recommendations to improve the agent or its profile. Cite the specific trace ids and verdicts backing each recommendation. Prefer the smallest change that would plausibly fix the failure.", toolAllowlist: ["query_traces", "get_alert_history"], modelProvider: "anthropic", modelId: "claude-sonnet-4-6", dollarCeilingUsd: "1.75", turnCap: 10, wallClockCapSeconds: 60, baseVersionId: "av-advisor-2", createdAt: "2026-08-01T09:00:00Z", createdByUserId: "a.demers@tricentis.com", revokedAt: null },

  { id: "av-fit-1", slotSlug: "profile_fit", tenantId: null, versionNumber: 1, name: "Fitter v1", instructions: "Given an agent's traces and the eval catalog, choose the scoring profile version that best matches its observed behavior. Report a confidence and a plain-language rationale.", toolAllowlist: ["query_metrics"], modelProvider: "anthropic", modelId: "claude-sonnet-4-6", dollarCeilingUsd: "1.00", turnCap: 6, wallClockCapSeconds: 45, baseVersionId: null, createdAt: "2026-01-20T09:00:00Z", createdByUserId: null, revokedAt: null },
  { id: "av-fit-2", slotSlug: "profile_fit", tenantId: null, versionNumber: 2, name: "Fitter v2 - shadow heuristic", instructions: "Given an agent's traces and the eval catalog, choose the scoring profile version that best matches its observed behavior. Report a confidence and a plain-language rationale. Also compute what the heuristic-only ranking would have chosen, for divergence monitoring.", toolAllowlist: ["query_metrics"], modelProvider: "anthropic", modelId: "claude-sonnet-4-6", dollarCeilingUsd: "1.00", turnCap: 6, wallClockCapSeconds: 45, baseVersionId: "av-fit-1", createdAt: "2026-06-10T09:00:00Z", createdByUserId: "a.demers@tricentis.com", revokedAt: null },
  { id: "av-fit-tais-1", slotSlug: "profile_fit", tenantId: "tenant-tais", versionNumber: 1, name: "Fitter v2 - TAIS tuning", instructions: "Given an agent's traces and the eval catalog, choose the scoring profile version that best matches its observed behavior, weighting ATA-suite signals more heavily. Report a confidence and a plain-language rationale.", toolAllowlist: ["query_metrics"], modelProvider: "anthropic", modelId: "claude-sonnet-4-6", dollarCeilingUsd: "1.00", turnCap: 6, wallClockCapSeconds: 45, baseVersionId: "av-fit-2", createdAt: "2026-07-01T09:00:00Z", createdByUserId: "a.demers@tricentis.com", revokedAt: null },

  { id: "av-judge-1", slotSlug: "scoring_judge", tenantId: null, versionNumber: 1, name: "Default judge v1", instructions: "Score the interaction against the eval's judge criteria on a 0-1 scale. Return a brief reason.", toolAllowlist: [], modelProvider: "anthropic", modelId: "claude-sonnet-4-6", dollarCeilingUsd: "0.25", turnCap: 2, wallClockCapSeconds: 15, baseVersionId: null, createdAt: "2026-01-05T09:00:00Z", createdByUserId: null, revokedAt: null },
  { id: "av-judge-2", slotSlug: "scoring_judge", tenantId: null, versionNumber: 2, name: "Default judge v2", instructions: "Score the interaction against the eval's judge criteria on a 0-1 scale. Return a brief reason citing the specific span or field that drove the score.", toolAllowlist: [], modelProvider: "anthropic", modelId: "claude-sonnet-4-6", dollarCeilingUsd: "0.25", turnCap: 2, wallClockCapSeconds: 15, baseVersionId: "av-judge-1", createdAt: "2026-03-12T09:00:00Z", createdByUserId: "a.demers@tricentis.com", revokedAt: null },
];

const TENANT_BINDINGS = new Map<string, string>([
  ["tenant-tais:profile_fit", "av-fit-tais-1"],
]);

let gen = 0;
const listeners = new Set<() => void>();
function bumpGen() {
  gen++;
  listeners.forEach((l) => l());
}
function useRegistryGen(): number {
  const [, setLocalGen] = useState(0);
  useEffect(() => {
    const l = () => setLocalGen((g) => g + 1);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
  return gen;
}

function resolveGlobalSlotRow(slug: string): SlotRead {
  const slot = SLOTS[slug];
  const version = slot.globalVersionId ? VERSIONS.find((v) => v.id === slot.globalVersionId) : undefined;
  return {
    id: slot.id,
    slug: slot.slug,
    description: slot.description,
    outputContract: slot.outputContract,
    toolAllowlist: slot.toolAllowlist,
    readOnly: slot.readOnly,
    priorityClass: slot.priorityClass,
    globalVersionId: slot.globalVersionId,
    globalVersionNumber: version?.versionNumber ?? null,
    boundVersionModelProvider: version?.modelProvider ?? null,
    boundVersionModelId: version?.modelId ?? null,
    boundVersionRevoked: version?.revokedAt != null,
  };
}

function resolveTenantSlotRow(tenantId: string, slug: string): TenantSlotRead {
  const slot = SLOTS[slug];
  const key = `${tenantId}:${slug}`;
  const override = TENANT_BINDINGS.get(key);
  const boundId = override ?? slot.globalVersionId;
  const version = boundId ? VERSIONS.find((v) => v.id === boundId) : undefined;
  return {
    id: slot.id,
    slug: slot.slug,
    description: slot.description,
    outputContract: slot.outputContract,
    toolAllowlist: slot.toolAllowlist,
    readOnly: slot.readOnly,
    priorityClass: slot.priorityClass,
    boundVersionId: boundId ?? null,
    boundVersionNumber: version?.versionNumber ?? null,
    source: boundId ? (override ? "tenant" : "global") : null,
    stale: false,
    boundVersionModelProvider: version?.modelProvider ?? null,
    boundVersionModelId: version?.modelId ?? null,
    boundVersionRevoked: version?.revokedAt != null,
  };
}

// ── Public API (hooks return the same {data,isLoading,...} shape the pages
// already destructure, so no page JSX needed to change) ────────────────────

export const MAX_VERSIONS_OFFSET = 10000;
export const agentRegistryKeys = {
  slots: (tenantId: string | null) => ["agent-registry", "slots", tenantId] as const,
};

export function listSlots(tenantId: string | null): (SlotRead | TenantSlotRead)[] {
  return Object.keys(SLOTS).map((slug) => (tenantId === null ? resolveGlobalSlotRow(slug) : resolveTenantSlotRow(tenantId, slug)));
}

export function findVersion(versionId: string): AgentVersionRead | undefined {
  return VERSIONS.find((v) => v.id === versionId);
}

export function useRegistrySlots(tenantId: string | null) {
  useRegistryGen();
  const data = useMemo(
    () => Object.keys(SLOTS).map((slug) => (tenantId === null ? resolveGlobalSlotRow(slug) : resolveTenantSlotRow(tenantId, slug))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tenantId, gen],
  );
  return { data, isLoading: false, isError: false, error: null };
}

export interface SlotVersionsParams {
  tenantId: string | null;
  slotSlug: string;
  limit: number;
  offset: number;
}

export function listVersions(params: SlotVersionsParams): AgentVersionRead[] {
  if (params.offset > 0) return [];
  return VERSIONS.filter((v) => v.slotSlug === params.slotSlug && v.tenantId === params.tenantId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function useSlotVersions(params: SlotVersionsParams) {
  useRegistryGen();
  const data = useMemo(
    () => listVersions(params),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [params.tenantId, params.slotSlug, params.offset, gen],
  );
  return { data, isLoading: false, error: null };
}

export function useRegistryVersion(params: { tenantId: string | null; slotSlug: string; versionId: string | null }) {
  useRegistryGen();
  const data = useMemo(
    () => (params.versionId ? VERSIONS.find((v) => v.id === params.versionId) : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [params.versionId, gen],
  );
  return { data, isLoading: false, isError: false, error: null };
}

export function useVersionLineage(params: { tenantId: string | null; slotSlug: string; versionId: string }) {
  useRegistryGen();
  const data = useMemo(
    () => VERSIONS.filter((v) => v.slotSlug === params.slotSlug),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [params.slotSlug, gen],
  );
  return { data, isLoading: false, isError: false, error: null };
}

interface ScopeQueryState {
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isTruncated: boolean;
  fetchNextPage: () => void;
  refetch: () => void;
}
function idleScopeState(): ScopeQueryState {
  return { isLoading: false, isError: false, error: null, hasNextPage: false, isFetchingNextPage: false, isTruncated: false, fetchNextPage: () => {}, refetch: () => {} };
}

export interface BindableVersionsParams {
  tenantId: string | null;
  slotSlug: string;
}
export interface BindableVersionsResult {
  versions: AgentVersionRead[];
  tenant: ScopeQueryState;
  global: ScopeQueryState;
}

export function useBindableVersions(params: BindableVersionsParams): BindableVersionsResult {
  useRegistryGen();
  const versions = useMemo(() => {
    const tenantVersions = params.tenantId === null ? [] : VERSIONS.filter((v) => v.slotSlug === params.slotSlug && v.tenantId === params.tenantId);
    const globalVersions = VERSIONS.filter((v) => v.slotSlug === params.slotSlug && v.tenantId === null);
    return [...tenantVersions, ...globalVersions].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.tenantId, params.slotSlug, gen]);
  return { versions, tenant: idleScopeState(), global: idleScopeState() };
}

interface CreateVersionCallOpts {
  onSuccess?: (created: AgentVersionRead) => void;
}
export function useCreateVersion() {
  const [isPending, setIsPending] = useState(false);
  const [error] = useState<unknown>(null);
  const mutate = useCallback((vars: { tenantId: string | null; body: AgentVersionCreate }, opts?: CreateVersionCallOpts) => {
    setIsPending(true);
    setTimeout(() => {
      const existing = VERSIONS.filter((v) => v.slotSlug === vars.body.slotSlug && v.tenantId === vars.tenantId);
      const nextNumber = existing.length ? Math.max(...existing.map((v) => v.versionNumber)) + 1 : 1;
      const created: AgentVersionRead = {
        id: `av-${Date.now()}`,
        slotSlug: vars.body.slotSlug,
        tenantId: vars.tenantId,
        versionNumber: nextNumber,
        name: vars.body.name,
        instructions: vars.body.instructions,
        toolAllowlist: vars.body.toolAllowlist,
        modelProvider: vars.body.modelProvider,
        modelId: vars.body.modelId,
        dollarCeilingUsd: vars.body.dollarCeilingUsd,
        turnCap: vars.body.turnCap,
        wallClockCapSeconds: vars.body.wallClockCapSeconds,
        baseVersionId: vars.body.baseVersionId ?? null,
        createdAt: new Date().toISOString(),
        createdByUserId: "a.demers@tricentis.com",
        revokedAt: null,
      };
      VERSIONS = [...VERSIONS, created];
      setIsPending(false);
      bumpGen();
      opts?.onSuccess?.(created);
    }, 400);
  }, []);
  const reset = useCallback(() => {}, []);
  return { mutate, isPending, error, reset };
}

interface RevokeVersionCallOpts {
  onSuccess?: (result: VersionRevokeRead) => void;
}
export function useRevokeVersion() {
  const [isPending, setIsPending] = useState(false);
  const [error] = useState<unknown>(null);
  const mutate = useCallback((vars: { tenantId: string | null; versionId: string }, opts?: RevokeVersionCallOpts) => {
    setIsPending(true);
    setTimeout(() => {
      const v = VERSIONS.find((x) => x.id === vars.versionId);
      if (v) v.revokedAt = new Date().toISOString();
      const affected: SlotBindingImpact[] = [];
      for (const slug of Object.keys(SLOTS)) {
        const slot = SLOTS[slug];
        if (slot.globalVersionId === vars.versionId) {
          affected.push({ id: `slot-local:${slot.id}:global`, slotSlug: slug, tenantId: null, isGlobal: true });
        }
      }
      for (const [key, boundId] of TENANT_BINDINGS.entries()) {
        if (boundId !== vars.versionId) continue;
        const [tId, slugKey] = key.split(":");
        affected.push({ id: `slot-local:${SLOTS[slugKey]?.id ?? slugKey}:${tId}`, slotSlug: slugKey, tenantId: tId, isGlobal: false });
      }
      setIsPending(false);
      bumpGen();
      opts?.onSuccess?.({ affectedBindingCount: affected.length, affectedBindings: affected });
    }, 400);
  }, []);
  const reset = useCallback(() => {}, []);
  return { mutate, isPending, error, reset };
}

interface SetBindingCallOpts {
  onSuccess?: () => void;
}
export function useSetBinding() {
  const [isPending, setIsPending] = useState(false);
  const [error] = useState<unknown>(null);
  const mutate = useCallback((vars: { tenantId: string | null; slotSlug: string; agentVersionId: string }, opts?: SetBindingCallOpts) => {
    setIsPending(true);
    setTimeout(() => {
      if (vars.tenantId === null) {
        SLOTS[vars.slotSlug].globalVersionId = vars.agentVersionId;
      } else {
        TENANT_BINDINGS.set(`${vars.tenantId}:${vars.slotSlug}`, vars.agentVersionId);
      }
      setIsPending(false);
      bumpGen();
      opts?.onSuccess?.();
    }, 400);
  }, []);
  const reset = useCallback(() => {}, []);
  return { mutate, isPending, error, reset };
}
