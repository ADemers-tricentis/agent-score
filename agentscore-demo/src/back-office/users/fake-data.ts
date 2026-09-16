// Fake data for Users + Access Requests — no backend. Module-level arrays
// mutated directly by page components (same "local optimistic mutation"
// pattern used across the rest of this clone), so state persists across a
// tab switch within one browser session without a real store.

export type UserKind = "staff" | "customer";
export type UserRole = "superadmin" | "member";
export type UserStatus = "active" | "deleted";

export interface FakeUserTenant {
  tenant_id: string;
  name: string;
}

export interface FakeUser {
  user_id: string;
  email: string;
  kind: UserKind;
  is_superadmin: boolean;
  tenants: FakeUserTenant[];
  created_at: string;
  deleted_at: string | null;
}

export interface FakeTenantOption {
  tenant_id: string;
  name: string;
  kind: string;
  env?: string;
}

export const FAKE_TENANT_OPTIONS: FakeTenantOption[] = [
  { tenant_id: "tenant-tais", name: "TAIS (Testing AI team)", kind: "internal", env: "prod" },
  { tenant_id: "tenant-tar", name: "tricentisairesearch", kind: "internal", env: "prod" },
  { tenant_id: "tenant-acme", name: "Acme Financial", kind: "customer", env: "prod" },
  { tenant_id: "tenant-northwind", name: "Northwind Retail", kind: "customer", env: "prod" },
  { tenant_id: "tenant-globex", name: "Globex Engineering", kind: "customer", env: "prod" },
];

function tenantRef(tenantId: string): FakeUserTenant {
  const t = FAKE_TENANT_OPTIONS.find((x) => x.tenant_id === tenantId);
  return { tenant_id: tenantId, name: t?.name ?? tenantId };
}

export const CURRENT_USER_ID = "user-1";

export const FAKE_USERS: FakeUser[] = [
  { user_id: "user-1", email: "a.demers@tricentis.com", kind: "staff", is_superadmin: true, tenants: [], created_at: "2025-11-03T09:00:00Z", deleted_at: null },
  { user_id: "user-2", email: "s.patel@tricentis.com", kind: "staff", is_superadmin: false, tenants: [tenantRef("tenant-tais"), tenantRef("tenant-tar")], created_at: "2026-01-15T09:00:00Z", deleted_at: null },
  { user_id: "user-3", email: "ops@acmefinancial.com", kind: "customer", is_superadmin: false, tenants: [tenantRef("tenant-acme")], created_at: "2026-03-11T11:30:00Z", deleted_at: null },
  { user_id: "user-4", email: "it@northwindretail.com", kind: "customer", is_superadmin: false, tenants: [tenantRef("tenant-northwind")], created_at: "2026-06-20T08:00:00Z", deleted_at: null },
  { user_id: "user-5", email: "eng@globex.com", kind: "customer", is_superadmin: false, tenants: [tenantRef("tenant-globex")], created_at: "2026-09-10T16:45:00Z", deleted_at: null },
  { user_id: "user-6", email: "m.chen@tricentis.com", kind: "staff", is_superadmin: false, tenants: [tenantRef("tenant-tais")], created_at: "2026-02-01T09:00:00Z", deleted_at: null },
  { user_id: "user-7", email: "former.contractor@tricentis.com", kind: "staff", is_superadmin: false, tenants: [tenantRef("tenant-tar")], created_at: "2025-12-05T09:00:00Z", deleted_at: "2026-08-01T09:00:00Z" },
];

let nextUserSeq = FAKE_USERS.length + 1;

export function listUsersFake(params: {
  limit: number;
  offset: number;
  q?: string;
  role?: UserRole[];
  tenantId?: string[];
  status?: UserStatus[];
  includeDeleted?: boolean;
}): { items: FakeUser[]; total: number } {
  let items = FAKE_USERS.filter((u) => params.includeDeleted || !u.deleted_at);
  if (params.q) {
    const q = params.q.toLowerCase();
    items = items.filter((u) => u.email.toLowerCase().includes(q));
  }
  if (params.role && params.role.length > 0) {
    items = items.filter((u) => (u.is_superadmin ? params.role!.includes("superadmin") : params.role!.includes("member")));
  }
  if (params.tenantId && params.tenantId.length > 0) {
    items = items.filter((u) => u.tenants.some((t) => params.tenantId!.includes(t.tenant_id)));
  }
  if (params.status && params.status.length > 0) {
    items = items.filter((u) => (u.deleted_at ? params.status!.includes("deleted") : params.status!.includes("active")));
  }
  const total = items.length;
  return { items: items.slice(params.offset, params.offset + params.limit), total };
}

export function getUserFake(userId: string): FakeUser | undefined {
  return FAKE_USERS.find((u) => u.user_id === userId);
}

export function createUserFake(body: {
  email: string;
  kind: UserKind;
  is_superadmin: boolean;
  tenant_ids: string[];
}): FakeUser {
  const user: FakeUser = {
    user_id: `user-${nextUserSeq++}`,
    email: body.email,
    kind: body.kind,
    is_superadmin: body.is_superadmin,
    tenants: body.tenant_ids.map(tenantRef),
    created_at: new Date().toISOString(),
    deleted_at: null,
  };
  FAKE_USERS.push(user);
  return user;
}

export function updateUserFake(userId: string, body: { email?: string; is_superadmin?: boolean }): void {
  const u = getUserFake(userId);
  if (!u) return;
  if (body.email != null) u.email = body.email;
  if (body.is_superadmin != null) u.is_superadmin = body.is_superadmin;
}

export function deleteUserFake(userId: string): void {
  const u = getUserFake(userId);
  if (u) u.deleted_at = new Date().toISOString();
}

export function restoreUserFake(userId: string): void {
  const u = getUserFake(userId);
  if (u) u.deleted_at = null;
}

export function revokeSessionsFake(_userId: string): { revoked: number } {
  return { revoked: 1 + Math.floor(Math.random() * 3) };
}

export function addMembershipFake(userId: string, tenantId: string): void {
  const u = getUserFake(userId);
  if (u && !u.tenants.some((t) => t.tenant_id === tenantId)) u.tenants.push(tenantRef(tenantId));
}

export function removeMembershipFake(userId: string, tenantId: string): void {
  const u = getUserFake(userId);
  if (u) u.tenants = u.tenants.filter((t) => t.tenant_id !== tenantId);
}

// ---------------------------------------------------------------------------
// Access requests
// ---------------------------------------------------------------------------

export type AccessRequestState = "waiting" | "declined" | "approved";

export interface FakeAccessRequest {
  id: string;
  email: string;
  requested_at: string;
  state: AccessRequestState;
  declined_at: string | null;
  existing_user: { user_id: string; deleted: boolean } | null;
}

export const FAKE_ACCESS_REQUESTS: FakeAccessRequest[] = [
  { id: "req-1", email: "new.hire@tricentis.com", requested_at: "2026-09-15T13:20:00Z", state: "waiting", declined_at: null, existing_user: null },
  { id: "req-2", email: "contractor2@tricentis.com", requested_at: "2026-09-14T08:05:00Z", state: "waiting", declined_at: null, existing_user: null },
  { id: "req-3", email: "former.contractor@tricentis.com", requested_at: "2026-09-13T17:40:00Z", state: "waiting", declined_at: null, existing_user: { user_id: "user-7", deleted: true } },
  { id: "req-4", email: "vendor@partner.io", requested_at: "2026-09-10T10:00:00Z", state: "declined", declined_at: "2026-09-10T15:00:00Z", existing_user: null },
  { id: "req-5", email: "s.patel@tricentis.com", requested_at: "2026-01-14T09:00:00Z", state: "approved", declined_at: null, existing_user: { user_id: "user-2", deleted: false } },
];

export function listAccessRequestsFake(params: {
  limit: number;
  offset: number;
  state: AccessRequestState | "all";
}): { items: FakeAccessRequest[]; total: number } {
  const items = params.state === "all" ? FAKE_ACCESS_REQUESTS : FAKE_ACCESS_REQUESTS.filter((r) => r.state === params.state);
  const total = items.length;
  return { items: items.slice(params.offset, params.offset + params.limit), total };
}

export function declineAccessRequestFake(id: string): void {
  const r = FAKE_ACCESS_REQUESTS.find((x) => x.id === id);
  if (r) {
    r.state = "declined";
    r.declined_at = new Date().toISOString();
  }
}

export function removeAccessRequestFake(id: string): void {
  const idx = FAKE_ACCESS_REQUESTS.findIndex((x) => x.id === id);
  if (idx !== -1) FAKE_ACCESS_REQUESTS.splice(idx, 1);
}

export function approveAccessRequestFake(id: string): void {
  const r = FAKE_ACCESS_REQUESTS.find((x) => x.id === id);
  if (r) r.state = "approved";
}
