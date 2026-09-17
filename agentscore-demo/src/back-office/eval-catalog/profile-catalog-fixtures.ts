// Fake data for the Evals Catalog's Profiles pages (ProfilesPage,
// ProfileDetailPage, ProfileBuilderPage) — no backend. Reconciled with the
// Agents section's profile-fixtures.ts (same profile ids/names/versions) so
// an agent's adopted profile and this catalog agree.

export interface DimensionRead {
  id: string;
  slug: string;
  name: string;
}

export interface EvalVersionRef {
  id: string;
  version: number;
}

export interface EvalDefinitionRead {
  id: string;
  name: string;
  slug: string;
  kind: "library" | "g_eval" | "hybrid";
  dimensionIds: string[];
  status: "active" | "archived";
  versions: EvalVersionRef[];
}

export interface ProfileVersionEntryRead {
  id: string;
  evalVersionId: string;
  evalName: string;
  evalVersion: number;
  dimensionId: string;
  kind: "library" | "g_eval" | "hybrid";
  threshold: number;
  weight: number;
  enabled: boolean;
}

export interface ProfileVersionRead {
  id: string;
  version: number;
  dimensionWeights: Record<string, number>;
  verdictBands: Record<string, number>;
  entries: ProfileVersionEntryRead[];
  createdAt: string;
}

export interface ProfileRead {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  status: "active" | "archived";
  discriminationVerdict?: string | null;
  createdAt: string;
  updatedAt: string;
  versions: ProfileVersionRead[];
}

const now = Date.now();
const daysAgo = (n: number) => new Date(now - n * 86400000).toISOString();

export const DIMENSIONS: DimensionRead[] = [
  { id: "dim-correctness", slug: "correctness", name: "Correctness" },
  { id: "dim-relevance", slug: "relevance", name: "Relevance" },
  { id: "dim-quality-efficiency", slug: "quality_efficiency", name: "Quality Efficiency" },
  { id: "dim-safety", slug: "safety", name: "Safety" },
];

export const EVALS: EvalDefinitionRead[] = [
  { id: "eval-prompt-alignment", name: "Prompt Alignment", slug: "prompt_alignment", kind: "g_eval", dimensionIds: ["dim-correctness"], status: "active", versions: [{ id: "ev-prompt-alignment-v1", version: 1 }, { id: "ev-prompt-alignment-v2", version: 2 }] },
  { id: "eval-factual-accuracy", name: "Factual Accuracy", slug: "factual_accuracy", kind: "library", dimensionIds: ["dim-correctness"], status: "active", versions: [{ id: "ev-factual-accuracy-v1", version: 1 }] },
  { id: "eval-answer-relevancy", name: "Answer Relevancy", slug: "answer_relevancy", kind: "g_eval", dimensionIds: ["dim-relevance"], status: "active", versions: [{ id: "ev-answer-relevancy-v1", version: 1 }] },
  { id: "eval-conciseness", name: "Conciseness", slug: "conciseness", kind: "library", dimensionIds: ["dim-quality-efficiency"], status: "active", versions: [{ id: "ev-conciseness-v1", version: 1 }] },
  { id: "eval-token-efficiency", name: "Token Efficiency", slug: "token_efficiency", kind: "library", dimensionIds: ["dim-quality-efficiency"], status: "active", versions: [{ id: "ev-token-efficiency-v1", version: 1 }] },
  { id: "eval-harmlessness", name: "Harmlessness", slug: "harmlessness", kind: "g_eval", dimensionIds: ["dim-safety"], status: "active", versions: [{ id: "ev-harmlessness-v1", version: 1 }] },
];

const evalById = new Map(EVALS.map((e) => [e.id, e]));

function entry(evalId: string, dimensionId: string, opts: { threshold: number; weight: number; enabled?: boolean; versionIndex?: number }): ProfileVersionEntryRead {
  const def = evalById.get(evalId)!;
  const v = def.versions[opts.versionIndex ?? def.versions.length - 1];
  return {
    id: `entry-${v.id}`,
    evalVersionId: v.id,
    evalName: def.name,
    evalVersion: v.version,
    dimensionId,
    kind: def.kind,
    threshold: opts.threshold,
    weight: opts.weight,
    enabled: opts.enabled ?? true,
  };
}

const DEFAULT_VERDICT_BANDS = { ship: 85, ship_note: 70, review: 55, block_rec: 40 };

export const PROFILES: ProfileRead[] = [
  {
    id: "profile-ata",
    slug: "ata-regression-baseline",
    name: "ATA Regression Baseline",
    description: "Baseline scoring profile for ATA regression-suite agents — weighted toward correctness and safety.",
    status: "active",
    discriminationVerdict: "discriminating",
    createdAt: daysAgo(120),
    updatedAt: daysAgo(1),
    versions: [
      {
        id: "pv-ata-2",
        version: 2,
        dimensionWeights: { correctness: 2, relevance: 1, safety: 3 },
        verdictBands: DEFAULT_VERDICT_BANDS,
        entries: [
          entry("eval-prompt-alignment", "dim-correctness", { threshold: 0.75, weight: 2, versionIndex: 0 }),
          entry("eval-answer-relevancy", "dim-relevance", { threshold: 0.7, weight: 1 }),
          entry("eval-harmlessness", "dim-safety", { threshold: 0.9, weight: 3 }),
        ],
        createdAt: daysAgo(80),
      },
      {
        id: "pv-ata-3",
        version: 3,
        dimensionWeights: { correctness: 2, relevance: 1, quality_efficiency: 1, safety: 3 },
        verdictBands: DEFAULT_VERDICT_BANDS,
        entries: [
          entry("eval-prompt-alignment", "dim-correctness", { threshold: 0.8, weight: 2, versionIndex: 1 }),
          entry("eval-factual-accuracy", "dim-correctness", { threshold: 0.75, weight: 1 }),
          entry("eval-answer-relevancy", "dim-relevance", { threshold: 0.7, weight: 1 }),
          entry("eval-conciseness", "dim-quality-efficiency", { threshold: 0.6, weight: 1 }),
          entry("eval-token-efficiency", "dim-quality-efficiency", { threshold: 0.5, weight: 1, enabled: false }),
          entry("eval-harmlessness", "dim-safety", { threshold: 0.9, weight: 3 }),
        ],
        createdAt: daysAgo(1),
      },
    ],
  },
  {
    id: "profile-support",
    slug: "customer-support-triage",
    name: "Customer Support Triage",
    description: "Scoring profile for customer-facing support/triage agents — weighted toward relevance and safety.",
    status: "active",
    discriminationVerdict: "not_discriminating",
    createdAt: daysAgo(90),
    updatedAt: daysAgo(2),
    versions: [
      {
        id: "pv-support-1",
        version: 1,
        dimensionWeights: { correctness: 1, relevance: 2, safety: 2 },
        verdictBands: DEFAULT_VERDICT_BANDS,
        entries: [
          entry("eval-prompt-alignment", "dim-correctness", { threshold: 0.7, weight: 1, versionIndex: 0 }),
          entry("eval-answer-relevancy", "dim-relevance", { threshold: 0.75, weight: 2 }),
          entry("eval-harmlessness", "dim-safety", { threshold: 0.85, weight: 2 }),
        ],
        createdAt: daysAgo(90),
      },
      {
        id: "pv-support-2",
        version: 2,
        dimensionWeights: { correctness: 1, relevance: 2, quality_efficiency: 1, safety: 2 },
        verdictBands: DEFAULT_VERDICT_BANDS,
        entries: [
          entry("eval-prompt-alignment", "dim-correctness", { threshold: 0.7, weight: 1, versionIndex: 1 }),
          entry("eval-answer-relevancy", "dim-relevance", { threshold: 0.75, weight: 2 }),
          entry("eval-conciseness", "dim-quality-efficiency", { threshold: 0.65, weight: 1 }),
          entry("eval-harmlessness", "dim-safety", { threshold: 0.85, weight: 2 }),
        ],
        createdAt: daysAgo(2),
      },
    ],
  },
  {
    id: "profile-code-review",
    slug: "code-review-assistant",
    name: "Code Review Assistant",
    description: "Scoring profile for internal code-review agents.",
    status: "active",
    discriminationVerdict: "insufficient_evidence",
    createdAt: daysAgo(6),
    updatedAt: daysAgo(6),
    versions: [
      {
        id: "pv-code-1",
        version: 1,
        dimensionWeights: { correctness: 2, quality_efficiency: 1 },
        verdictBands: DEFAULT_VERDICT_BANDS,
        entries: [
          entry("eval-factual-accuracy", "dim-correctness", { threshold: 0.8, weight: 2 }),
          entry("eval-conciseness", "dim-quality-efficiency", { threshold: 0.6, weight: 1 }),
        ],
        createdAt: daysAgo(6),
      },
    ],
  },
  {
    id: "profile-general",
    slug: "general-automation-baseline",
    name: "General Automation Baseline",
    description: "Fallback profile for agents without a specialized match.",
    status: "active",
    discriminationVerdict: "discriminating",
    createdAt: daysAgo(200),
    updatedAt: daysAgo(5),
    versions: [
      {
        id: "pv-general-4",
        version: 4,
        dimensionWeights: { correctness: 1, relevance: 1, quality_efficiency: 1, safety: 1 },
        verdictBands: DEFAULT_VERDICT_BANDS,
        entries: [
          entry("eval-prompt-alignment", "dim-correctness", { threshold: 0.65, weight: 1, versionIndex: 1 }),
          entry("eval-answer-relevancy", "dim-relevance", { threshold: 0.6, weight: 1 }),
          entry("eval-conciseness", "dim-quality-efficiency", { threshold: 0.55, weight: 1 }),
          entry("eval-harmlessness", "dim-safety", { threshold: 0.8, weight: 1 }),
        ],
        createdAt: daysAgo(5),
      },
    ],
  },
  {
    id: "profile-docs-assistant",
    slug: "docs-assistant-baseline",
    name: "Documentation Assistant Baseline",
    description: "Baseline scoring profile for a RAG-based Q&A agent that answers from a knowledge base — weighted toward factual accuracy and relevance, since users trust it not to make things up.",
    status: "active",
    discriminationVerdict: "insufficient_evidence",
    createdAt: daysAgo(3),
    updatedAt: daysAgo(3),
    versions: [
      {
        id: "pv-docs-1",
        version: 1,
        dimensionWeights: { correctness: 3, relevance: 2, safety: 2, quality_efficiency: 1 },
        verdictBands: DEFAULT_VERDICT_BANDS,
        entries: [
          entry("eval-factual-accuracy", "dim-correctness", { threshold: 0.85, weight: 3 }),
          entry("eval-prompt-alignment", "dim-correctness", { threshold: 0.7, weight: 1, versionIndex: 1 }),
          entry("eval-answer-relevancy", "dim-relevance", { threshold: 0.75, weight: 2 }),
          entry("eval-harmlessness", "dim-safety", { threshold: 0.85, weight: 2 }),
          entry("eval-conciseness", "dim-quality-efficiency", { threshold: 0.6, weight: 1 }),
        ],
        createdAt: daysAgo(3),
      },
    ],
  },
  {
    id: "profile-archived-legacy",
    slug: "legacy-triage-v0",
    name: "Legacy Triage (v0)",
    description: "Superseded by Customer Support Triage. Kept for history.",
    status: "archived",
    discriminationVerdict: null,
    createdAt: daysAgo(300),
    updatedAt: daysAgo(90),
    versions: [
      {
        id: "pv-legacy-1",
        version: 1,
        dimensionWeights: { relevance: 1 },
        verdictBands: DEFAULT_VERDICT_BANDS,
        entries: [entry("eval-answer-relevancy", "dim-relevance", { threshold: 0.6, weight: 1 })],
        createdAt: daysAgo(300),
      },
    ],
  },
];

let profiles = [...PROFILES];
let nextProfileSeq = profiles.length + 1;

export function listDimensions(): DimensionRead[] {
  return DIMENSIONS;
}

export function listEvals(status?: "active" | "archived"): EvalDefinitionRead[] {
  return status ? EVALS.filter((e) => e.status === status) : EVALS;
}

export function getEval(id: string): EvalDefinitionRead | undefined {
  return evalById.get(id);
}

export function listProfiles(status: "active" | "archived" = "active"): ProfileRead[] {
  return profiles.filter((p) => p.status === status);
}

export function getProfile(id: string): ProfileRead | undefined {
  return profiles.find((p) => p.id === id);
}

export function patchProfile(id: string, patch: Partial<Pick<ProfileRead, "name" | "description" | "status">>): ProfileRead {
  const idx = profiles.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error("Profile not found");
  profiles[idx] = { ...profiles[idx], ...patch, updatedAt: new Date().toISOString() };
  return profiles[idx];
}

export function createProfile(input: { slug: string; name: string; description: string | null; version: { dimensionWeights: Record<string, number>; verdictBands: Record<string, number>; entries: { evalVersionId: string; dimensionId: string; threshold: number; weight: number; enabled: boolean }[] } }): ProfileRead {
  const id = `profile-new-${nextProfileSeq++}`;
  const entries: ProfileVersionEntryRead[] = input.version.entries.map((e) => {
    const def = EVALS.find((ev) => ev.versions.some((v) => v.id === e.evalVersionId));
    const v = def?.versions.find((x) => x.id === e.evalVersionId);
    return { id: `entry-${e.evalVersionId}`, evalVersionId: e.evalVersionId, evalName: def?.name ?? e.evalVersionId, evalVersion: v?.version ?? 1, dimensionId: e.dimensionId, kind: def?.kind ?? "library", threshold: e.threshold, weight: e.weight, enabled: e.enabled };
  });
  const profile: ProfileRead = {
    id,
    slug: input.slug,
    name: input.name,
    description: input.description,
    status: "active",
    discriminationVerdict: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    versions: [{ id: `${id}-v1`, version: 1, dimensionWeights: input.version.dimensionWeights, verdictBands: input.version.verdictBands, entries, createdAt: new Date().toISOString() }],
  };
  profiles = [profile, ...profiles];
  return profile;
}

export function addProfileVersion(profileId: string, input: { dimensionWeights: Record<string, number>; verdictBands: Record<string, number>; entries: { evalVersionId: string; dimensionId: string; threshold: number; weight: number; enabled: boolean }[] }): ProfileVersionRead {
  const idx = profiles.findIndex((p) => p.id === profileId);
  if (idx === -1) throw new Error("Profile not found");
  const profile = profiles[idx];
  const nextVersionNum = Math.max(0, ...profile.versions.map((v) => v.version)) + 1;
  const entries: ProfileVersionEntryRead[] = input.entries.map((e) => {
    const def = EVALS.find((ev) => ev.versions.some((v) => v.id === e.evalVersionId));
    const v = def?.versions.find((x) => x.id === e.evalVersionId);
    return { id: `entry-${e.evalVersionId}-${nextVersionNum}`, evalVersionId: e.evalVersionId, evalName: def?.name ?? e.evalVersionId, evalVersion: v?.version ?? 1, dimensionId: e.dimensionId, kind: def?.kind ?? "library", threshold: e.threshold, weight: e.weight, enabled: e.enabled };
  });
  const version: ProfileVersionRead = { id: `${profileId}-v${nextVersionNum}`, version: nextVersionNum, dimensionWeights: input.dimensionWeights, verdictBands: input.verdictBands, entries, createdAt: new Date().toISOString() };
  profiles[idx] = { ...profile, versions: [...profile.versions, version], updatedAt: new Date().toISOString() };
  return version;
}
