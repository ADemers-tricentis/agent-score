// Fake data + local types for the LLM Catalog's inference registry - no
// backend. Types mirror the real OpenAPI schemas (LLMInferenceOut/Create/
// Update, TestConnectionIn/Out, the per-provider EndpointSettings/Credential
// discriminated unions) directly rather than deriving from the stubbed
// `shared/api/generated.ts` (which collapses everything to `any` and breaks
// switch-exhaustiveness checks in schema.ts).
//
// Exported so the Pricing/Routing/Usage cluster's files can reference the
// same model roster (ids, names, providers) their fixtures need to agree with.

export type Provider = "anthropic" | "openai" | "azure" | "bedrock";
export type CredentialKind = "api_key" | "aws" | "ambient";

export type EndpointSettings =
  | { provider: "anthropic" }
  | { provider: "openai"; baseUrl?: string | null }
  | { provider: "azure"; endpoint: string; deployment: string; apiVersion: string }
  | { provider: "bedrock"; region: string };

export type CredentialIn =
  | { kind: "api_key"; apiKey?: string | null }
  | { kind: "aws"; accessKeyId?: string | null; secretAccessKey?: string | null }
  | { kind: "ambient" };

export interface LLMInferenceOut {
  readonly configured: boolean;
  createdAt: string;
  credentialKind: CredentialKind;
  deletedAt?: string | null;
  description?: string | null;
  id: string;
  isDefault: boolean;
  keyHint?: string | null;
  maxConcurrency?: number | null;
  modelId: string;
  name: string;
  provider: Provider;
  settings: EndpointSettings;
  updatedAt: string;
}

export interface LLMInferenceCreate {
  credential: CredentialIn;
  description?: string | null;
  isDefault: boolean;
  maxConcurrency?: number | null;
  modelId: string;
  name: string;
  provider: Provider;
  settings: EndpointSettings;
}

export interface LLMInferenceUpdate {
  credential?: CredentialIn | null;
  description?: string | null;
  isDefault: boolean;
  maxConcurrency?: number | null;
  modelId: string;
  name: string;
  provider: Provider;
  settings: EndpointSettings;
}

export interface TestConnectionIn {
  apiKey?: string | null;
  inferenceId?: string | null;
  modelId: string;
  provider: Provider;
  settings?: EndpointSettings | null;
}

export interface TestConnectionOut {
  code?: string | null;
  message?: string | null;
  ok: boolean;
}

export interface LLMInferenceSelectableOut {
  id: string;
  isDefault: boolean;
  modelId: string;
  name: string;
  provider: string;
}

const now = Date.now();
const daysAgo = (n: number) => new Date(now - n * 86400000).toISOString();

let nextId = 100;

/** Canonical fake model/inference roster - exported for cross-cluster reuse
 * (Pricing/Routing/Usage tabs key their fixtures off these same ids/names). */
export const INFERENCES: LLMInferenceOut[] = [
  { configured: true, createdAt: daysAgo(120), credentialKind: "api_key", deletedAt: null, description: "Primary judge for scoring runs.", id: "inf-sonnet-4-6", isDefault: true, keyHint: "8f2a", maxConcurrency: 24, modelId: "claude-sonnet-4-6", name: "Claude Sonnet 4.6 (default)", provider: "anthropic", settings: { provider: "anthropic" }, updatedAt: daysAgo(3) },
  { configured: true, createdAt: daysAgo(120), credentialKind: "api_key", deletedAt: null, description: "Cheap/fast fitter and label-suggestion model.", id: "inf-haiku-4-5", isDefault: false, keyHint: "8f2a", maxConcurrency: 40, modelId: "claude-haiku-4-5", name: "Claude Haiku 4.5", provider: "anthropic", settings: { provider: "anthropic" }, updatedAt: daysAgo(10) },
  { configured: true, createdAt: daysAgo(95), credentialKind: "api_key", deletedAt: null, description: "High-stakes safety/discrimination judge.", id: "inf-opus-4-8", isDefault: false, keyHint: "8f2a", maxConcurrency: 8, modelId: "claude-opus-4-8", name: "Claude Opus 4.8", provider: "anthropic", settings: { provider: "anthropic" }, updatedAt: daysAgo(5) },
  { configured: true, createdAt: daysAgo(80), credentialKind: "api_key", deletedAt: null, description: "Comparison judge for cross-provider calibration.", id: "inf-gpt-4o", isDefault: false, keyHint: "a91c", maxConcurrency: 20, modelId: "gpt-4o", name: "GPT-4o", provider: "openai", settings: { provider: "openai", baseUrl: null }, updatedAt: daysAgo(12) },
  { configured: true, createdAt: daysAgo(80), credentialKind: "ambient", deletedAt: null, description: "Cheap comparison judge, keyless via ambient chain.", id: "inf-gpt-4o-mini", isDefault: false, keyHint: null, maxConcurrency: 50, modelId: "gpt-4o-mini", name: "GPT-4o mini", provider: "openai", settings: { provider: "openai", baseUrl: null }, updatedAt: daysAgo(30) },
  { configured: true, createdAt: daysAgo(60), credentialKind: "api_key", deletedAt: null, description: "Enterprise Azure deployment for tenants requiring data residency.", id: "inf-azure-gpt4o", isDefault: false, keyHint: "c221", maxConcurrency: 16, modelId: "gpt-4o", name: "Azure GPT-4o (EU)", provider: "azure", settings: { provider: "azure", endpoint: "https://tricentis-eu.openai.azure.com", deployment: "gpt-4o-eu", apiVersion: "2024-06-01" }, updatedAt: daysAgo(18) },
  { configured: true, createdAt: daysAgo(45), credentialKind: "aws", deletedAt: null, description: "Bedrock-hosted fallback judge.", id: "inf-bedrock-claude", isDefault: false, keyHint: null, maxConcurrency: 12, modelId: "anthropic.claude-3-5-sonnet", name: "Bedrock Claude 3.5 Sonnet", provider: "bedrock", settings: { provider: "bedrock", region: "us-east-1" }, updatedAt: daysAgo(45) },
  { configured: true, createdAt: daysAgo(200), credentialKind: "api_key", deletedAt: daysAgo(2), description: "Retired after the 4.6 migration.", id: "inf-sonnet-3-7", isDefault: false, keyHint: "8f2a", maxConcurrency: 10, modelId: "claude-sonnet-3-7", name: "Claude Sonnet 3.7 (retired)", provider: "anthropic", settings: { provider: "anthropic" }, updatedAt: daysAgo(2) },
];

export function listInferences(opts: { includeDeleted?: boolean; q?: string } = {}): LLMInferenceOut[] {
  const q = opts.q?.trim().toLowerCase();
  return INFERENCES.filter((i) => {
    if (!opts.includeDeleted && i.deletedAt) return false;
    if (q && !i.name.toLowerCase().includes(q) && !i.modelId.toLowerCase().includes(q)) return false;
    return true;
  });
}

export function getInference(id: string): LLMInferenceOut | undefined {
  return INFERENCES.find((i) => i.id === id);
}

export function createInference(body: LLMInferenceCreate): LLMInferenceOut {
  const credentialKind = body.credential.kind;
  const inference: LLMInferenceOut = {
    configured: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null,
    credentialKind,
    keyHint: credentialKind === "api_key" && "apiKey" in body.credential && body.credential.apiKey ? body.credential.apiKey.slice(-4) : null,
    id: `inf-${nextId++}`,
    name: body.name,
    description: body.description ?? null,
    provider: body.provider,
    modelId: body.modelId,
    isDefault: body.isDefault,
    maxConcurrency: body.maxConcurrency ?? null,
    settings: body.settings,
  };
  if (inference.isDefault) INFERENCES.forEach((i) => { i.isDefault = false; });
  INFERENCES.unshift(inference);
  return inference;
}

export function updateInference(id: string, body: LLMInferenceUpdate): LLMInferenceOut {
  const existing = getInference(id);
  if (!existing) throw new Error("Inference not found.");
  existing.name = body.name;
  existing.description = body.description ?? null;
  existing.provider = body.provider;
  existing.modelId = body.modelId;
  existing.isDefault = body.isDefault;
  existing.maxConcurrency = body.maxConcurrency ?? null;
  existing.settings = body.settings;
  existing.updatedAt = new Date().toISOString();
  if (body.credential) {
    existing.credentialKind = body.credential.kind;
    existing.keyHint = body.credential.kind === "api_key" && "apiKey" in body.credential && body.credential.apiKey ? body.credential.apiKey.slice(-4) : null;
  }
  if (existing.isDefault) INFERENCES.forEach((i) => { if (i.id !== id) i.isDefault = false; });
  return existing;
}

export function deleteInference(id: string): void {
  const existing = getInference(id);
  if (!existing) throw new Error("Inference not found.");
  if (existing.isDefault) throw new Error("Can't delete the default inference — set another default first.");
  existing.deletedAt = new Date().toISOString();
}

export function restoreInference(id: string): void {
  const existing = getInference(id);
  if (!existing) throw new Error("Inference not found.");
  existing.deletedAt = null;
}

export function setDefaultInference(id: string): LLMInferenceOut {
  const existing = getInference(id);
  if (!existing) throw new Error("Inference not found.");
  INFERENCES.forEach((i) => { i.isDefault = i.id === id; });
  return existing;
}

export function testConnection(_payload: TestConnectionIn): TestConnectionOut {
  return { ok: true, message: "Connection OK — auth and model verified.", code: null };
}

export function listSelectableInferences(): LLMInferenceSelectableOut[] {
  return listInferences().map((i) => ({ id: i.id, isDefault: i.isDefault, modelId: i.modelId, name: i.name, provider: i.provider }));
}
