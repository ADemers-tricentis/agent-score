/** Fake in-memory data for the Tenants section - no backend. Shapes mirror
 *  the real `TenantProfile`/`TenantApiKeyProfile`/`AuditEventProfile` wire
 *  types closely enough for the cloned UI to render unmodified. Tenant
 *  identity (ids/names/kind) is seeded from the Agents section's
 *  `FAKE_TENANTS` so the two sections never disagree about who's who. */
import { FAKE_TENANTS, FAKE_AGENTS } from "@/back-office/agents/fake-data";

export type TenantKind = "internal" | "external";

export interface TenantProfile {
  tenant_id: string;
  name: string;
  kind: TenantKind;
  env: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  metadata: Record<string, unknown> | null;
}

export interface TenantListResponse {
  items: TenantProfile[];
  total: number;
}

export interface TenantFacetsResponse {
  envs: string[];
}

export interface TenantApiKeyProfile {
  api_key_id: string;
  name: string;
  tk_display: string;
  created_at: string;
  disabled_at: string | null;
  last_used_at: string | null;
  is_simulation: boolean;
}

export interface TenantApiKeyListResponse {
  items: TenantApiKeyProfile[];
}

export interface CreateTenantApiKeyResponse {
  api_key: TenantApiKeyProfile;
  tk: string;
}

export type RotateTenantApiKeyResponse = CreateTenantApiKeyResponse;

export class ApiKeyNameConflictError extends Error {}

export type AuditSeverity = "info" | "warning" | "error";

export interface AuditEventProfile {
  id: string;
  created_at: string;
  severity: AuditSeverity;
  event_type: string;
  resource_type: string;
  resource_id: string | null;
  actor_type: string;
  actor_user_email: string | null;
  summary: string;
}

export interface AuditEventListResponse {
  items: AuditEventProfile[];
  total: number;
}

export interface AuditThroughputSummary {
  discovered: number;
  attributed: number;
  deferred: number;
  failed: number;
  purged: number;
}

const CREATED: Record<string, string> = {
  "tenant-tais": "2026-01-12T09:00:00Z",
  "tenant-tar": "2026-01-20T09:00:00Z",
  "tenant-acme": "2026-03-02T14:00:00Z",
  "tenant-northwind": "2026-04-18T11:30:00Z",
  "tenant-globex": "2026-08-27T16:00:00Z",
};

let nextTenantSeq = 1;
let nextKeySeq = 1;

export const TENANTS: TenantProfile[] = FAKE_TENANTS.map((t) => ({
  tenant_id: t.tenant_id,
  name: t.name,
  kind: t.kind,
  env: t.env ?? null,
  created_at: CREATED[t.tenant_id] ?? new Date().toISOString(),
  updated_at: CREATED[t.tenant_id] ?? new Date().toISOString(),
  deleted_at: null,
  metadata: null,
}));

const API_KEYS: Record<string, TenantApiKeyProfile[]> = {
  "tenant-tais": [
    { api_key_id: "key-tais-1", name: "default", tk_display: "tk_live_7f2a…c910", created_at: "2026-01-12T09:05:00Z", disabled_at: null, last_used_at: new Date(Date.now() - 3600_000).toISOString(), is_simulation: false },
  ],
  "tenant-tar": [],
  "tenant-acme": [
    { api_key_id: "key-acme-1", name: "production", tk_display: "tk_live_9b3e…4471", created_at: "2026-03-02T14:10:00Z", disabled_at: null, last_used_at: new Date(Date.now() - 7200_000).toISOString(), is_simulation: false },
    { api_key_id: "key-acme-2", name: "staging", tk_display: "tk_live_1c8d…2205", created_at: "2026-05-01T10:00:00Z", disabled_at: new Date("2026-08-01T00:00:00Z").toISOString(), last_used_at: null, is_simulation: true },
  ],
  "tenant-northwind": [
    { api_key_id: "key-nw-1", name: "default", tk_display: "tk_live_5a1f…8830", created_at: "2026-04-18T11:35:00Z", disabled_at: null, last_used_at: new Date(Date.now() - 86_400_000).toISOString(), is_simulation: false },
  ],
  "tenant-globex": [],
};

const AUDIT_EVENTS: Record<string, AuditEventProfile[]> = Object.fromEntries(
  TENANTS.map((t) => [
    t.tenant_id,
    [
      { id: `audit-${t.tenant_id}-1`, created_at: t.created_at, severity: "info" as const, event_type: "tenant.created", resource_type: "tenant", resource_id: t.tenant_id, actor_type: "user", actor_user_email: "a.demers@tricentis.com", summary: `Tenant ${t.name} created` },
      { id: `audit-${t.tenant_id}-2`, created_at: new Date(new Date(t.created_at).getTime() + 3600_000).toISOString(), severity: "info" as const, event_type: "tenant_api_key.created", resource_type: "tenant_api_key", resource_id: API_KEYS[t.tenant_id]?.[0]?.api_key_id ?? null, actor_type: "user", actor_user_email: "a.demers@tricentis.com", summary: "API key \"default\" created" },
      { id: `audit-${t.tenant_id}-3`, created_at: new Date(new Date(t.created_at).getTime() + 86_400_000 * 3).toISOString(), severity: "info" as const, event_type: "agent.created", resource_type: "agent", resource_id: FAKE_AGENTS.find((a) => a.tenant_id === t.tenant_id)?.agent_id ?? null, actor_type: "user", actor_user_email: "a.demers@tricentis.com", summary: "Agent created" },
    ],
  ]),
);

function matches(t: TenantProfile, q: string): boolean {
  return t.name.toLowerCase().includes(q.toLowerCase()) || t.tenant_id.toLowerCase().includes(q.toLowerCase());
}

export interface ListTenantsParams {
  limit?: number;
  offset?: number;
  q?: string;
  kind?: TenantKind[];
  env?: string[];
  includeDeleted?: boolean;
}

export async function listTenants(params: ListTenantsParams = {}): Promise<TenantListResponse> {
  const { limit = 25, offset = 0, q, kind = [], env = [], includeDeleted = false } = params;
  let items = TENANTS.filter((t) => includeDeleted || !t.deleted_at);
  if (q) items = items.filter((t) => matches(t, q));
  if (kind.length) items = items.filter((t) => kind.includes(t.kind));
  if (env.length) items = items.filter((t) => t.env && env.includes(t.env));
  const total = items.length;
  return { items: items.slice(offset, offset + limit), total };
}

export async function listTenantFacets(includeDeleted = false): Promise<TenantFacetsResponse> {
  const pool = TENANTS.filter((t) => includeDeleted || !t.deleted_at);
  return {
    envs: [...new Set(pool.map((t) => t.env).filter((v): v is string => !!v))],
  };
}

export async function getTenant(tenantId: string): Promise<TenantProfile> {
  const t = TENANTS.find((x) => x.tenant_id === tenantId);
  if (!t) throw new Error("Tenant not found");
  return t;
}

export interface CreateTenantParams {
  name: string;
  kind: TenantKind;
  env: string | null;
  metadata: Record<string, unknown> | null;
}

export async function createTenant(params: CreateTenantParams): Promise<TenantProfile> {
  const now = new Date().toISOString();
  const tenant: TenantProfile = {
    tenant_id: `tenant-new-${nextTenantSeq++}`,
    name: params.name,
    kind: params.kind,
    env: params.env,
    created_at: now,
    updated_at: now,
    deleted_at: null,
    metadata: params.metadata,
  };
  TENANTS.push(tenant);
  API_KEYS[tenant.tenant_id] = [];
  AUDIT_EVENTS[tenant.tenant_id] = [{ id: `audit-${tenant.tenant_id}-1`, created_at: now, severity: "info", event_type: "tenant.created", resource_type: "tenant", resource_id: tenant.tenant_id, actor_type: "user", actor_user_email: "a.demers@tricentis.com", summary: `Tenant ${tenant.name} created` }];
  return tenant;
}

export async function updateTenant(tenantId: string, name: string): Promise<TenantProfile> {
  const t = await getTenant(tenantId);
  t.name = name;
  t.updated_at = new Date().toISOString();
  return t;
}

export async function softDeleteTenant(tenantId: string): Promise<TenantProfile> {
  const t = await getTenant(tenantId);
  t.deleted_at = new Date().toISOString();
  return t;
}

export async function restoreTenant(tenantId: string): Promise<TenantProfile> {
  const t = await getTenant(tenantId);
  t.deleted_at = null;
  return t;
}

export async function purgeTenant(tenantId: string): Promise<void> {
  const idx = TENANTS.findIndex((t) => t.tenant_id === tenantId);
  if (idx !== -1) TENANTS.splice(idx, 1);
  delete API_KEYS[tenantId];
  delete AUDIT_EVENTS[tenantId];
}

export async function listTenantApiKeys(tenantId: string): Promise<TenantApiKeyListResponse> {
  return { items: API_KEYS[tenantId] ?? [] };
}

function fakeSecret(): string {
  const rand = Math.random().toString(16).slice(2, 10);
  return `tk_live_${rand}`;
}

export async function createTenantApiKey(tenantId: string, name: string): Promise<CreateTenantApiKeyResponse> {
  const keys = API_KEYS[tenantId] ?? (API_KEYS[tenantId] = []);
  if (keys.some((k) => k.name === name && !k.disabled_at)) throw new ApiKeyNameConflictError("An active key with this name already exists.");
  const secret = fakeSecret();
  const key: TenantApiKeyProfile = {
    api_key_id: `key-new-${nextKeySeq++}`,
    name,
    tk_display: `${secret.slice(0, 12)}…${secret.slice(-4)}`,
    created_at: new Date().toISOString(),
    disabled_at: null,
    last_used_at: null,
    is_simulation: false,
  };
  keys.push(key);
  return { api_key: key, tk: secret };
}

export async function updateTenantApiKey(tenantId: string, apiKeyId: string, patch: { name?: string; disabled?: boolean }): Promise<TenantApiKeyProfile> {
  const key = (API_KEYS[tenantId] ?? []).find((k) => k.api_key_id === apiKeyId);
  if (!key) throw new Error("Key not found");
  if (patch.name != null) {
    if ((API_KEYS[tenantId] ?? []).some((k) => k.api_key_id !== apiKeyId && k.name === patch.name && !k.disabled_at)) {
      throw new ApiKeyNameConflictError("An active key with this name already exists.");
    }
    key.name = patch.name;
  }
  if (patch.disabled != null) key.disabled_at = patch.disabled ? new Date().toISOString() : null;
  return key;
}

export async function rotateTenantApiKey(tenantId: string, apiKeyId: string): Promise<RotateTenantApiKeyResponse> {
  const key = (API_KEYS[tenantId] ?? []).find((k) => k.api_key_id === apiKeyId);
  if (!key) throw new Error("Key not found");
  const secret = fakeSecret();
  key.tk_display = `${secret.slice(0, 12)}…${secret.slice(-4)}`;
  key.last_used_at = null;
  return { api_key: key, tk: secret };
}

export async function revokeTenantApiKey(tenantId: string, apiKeyId: string): Promise<void> {
  const keys = API_KEYS[tenantId];
  if (!keys) return;
  const idx = keys.findIndex((k) => k.api_key_id === apiKeyId);
  if (idx !== -1) keys.splice(idx, 1);
}

export interface ListAuditEventsParams {
  limit?: number;
  offset?: number;
  from?: string;
  to?: string;
  eventTypes?: string[];
  severities?: string[];
  q?: string;
}

export async function listAuditEvents(tenantId: string, params: ListAuditEventsParams = {}): Promise<AuditEventListResponse> {
  const { limit = 25, offset = 0, eventTypes = [], severities = [], q } = params;
  let items = AUDIT_EVENTS[tenantId] ?? [];
  if (eventTypes.length) items = items.filter((e) => eventTypes.includes(e.event_type));
  if (severities.length) items = items.filter((e) => severities.includes(e.severity));
  if (q) items = items.filter((e) => e.summary.toLowerCase().includes(q.toLowerCase()) || (e.resource_id ?? "").toLowerCase().includes(q.toLowerCase()));
  items = [...items].sort((a, b) => b.created_at.localeCompare(a.created_at));
  const total = items.length;
  return { items: items.slice(offset, offset + limit), total };
}

export interface GetAuditThroughputSummaryParams {
  tenantId: string;
  from?: string;
  to?: string;
}

export async function getAuditThroughputSummary(_params: GetAuditThroughputSummaryParams): Promise<AuditThroughputSummary> {
  return { discovered: 12, attributed: 10, deferred: 1, failed: 1, purged: 0 };
}
