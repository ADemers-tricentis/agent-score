/**
 * One tier per sidebar destination, keyed by nav id (`sidebar-nav.ts`).
 *
 * The tier is a literal, not something derived at runtime from the OpenAPI
 * contract — the sidebar needs to filter synchronously on render, before any
 * network round-trip. `tests/unit/sidebar-tier.test.ts` is the derivation: it
 * reads `openapi.json` and asserts every `{method, path}` below resolves to an
 * operation whose `x-auth-tier` equals the declared tier, so a drifted literal
 * fails CI instead of silently under- or over-gating a destination.
 *
 * `debug-logs` carries no `{method, path}` — it has no API surface for the
 * guard to check against (see its `exempt` reason).
 */
import type { UserProfile } from "@/shared/auth/api";

export type DestinationTier = "superadmin" | "staff";

type GatedDestination = {
  tier: DestinationTier;
  method: "GET" | "POST";
  path: string;
};

type ExemptDestination = {
  tier: DestinationTier;
  /** Why this destination has no `{method, path}` for the pin to check. */
  exempt: string;
};

export type DestinationGate = GatedDestination | ExemptDestination;

export const DESTINATION_GATES = {
  dashboard: { tier: "superadmin", method: "GET", path: "/admin/dashboard" },
  agents: { tier: "superadmin", method: "GET", path: "/admin/agents" },
  assistant: { tier: "staff", method: "GET", path: "/admin/chat/sessions" },
  "evals-catalog": {
    tier: "superadmin",
    method: "GET",
    path: "/admin/eval-catalog/evals",
  },
  tenants: { tier: "superadmin", method: "GET", path: "/admin/tenants" },
  users: { tier: "superadmin", method: "GET", path: "/admin/users" },
  integrations: {
    tier: "superadmin",
    method: "GET",
    path: "/admin/integrations",
  },
  "llm-catalog": {
    tier: "superadmin",
    method: "GET",
    path: "/admin/llm-inferences",
  },
  "agent-registry": {
    tier: "staff",
    method: "GET",
    path: "/admin/agent-registry/slots",
  },
  ingestion: {
    tier: "superadmin",
    method: "GET",
    path: "/admin/ingestion/overview",
  },
  "scoring-pipeline": {
    tier: "superadmin",
    method: "GET",
    path: "/admin/scoring-pipeline/overview",
  },
  simulation: {
    tier: "superadmin",
    method: "GET",
    path: "/admin/simulation/corpora",
  },
  reports: { tier: "superadmin", method: "GET", path: "/admin/reports/usage" },
  "debug-logs": {
    tier: "superadmin",
    exempt: "include_in_schema=False — absent from openapi.json",
  },
} satisfies Record<string, DestinationGate>;

/**
 * The 14 gated destination ids (13 sidebar nav ids plus `assistant`).
 * Derived from the object's own literal keys (not `Record<string, …>`) so a
 * typo'd id is a compile error, not a silent fail-closed `false` at runtime.
 */
export type NavId = keyof typeof DESTINATION_GATES;

/**
 * Gated ids reached through the sidebar's `PanelSwitch`, not through a
 * `sidebar-nav.ts` item — `assistant` since D3 (the panel switch is now the
 * only way in). Still a real destination gate: `PanelSwitch` calls
 * `canAccess(user, "assistant")` to decide whether to render its Assistant
 * half at all. `sidebar-tier.test.ts`'s "covers exactly the sidebar's nav
 * ids" pin asserts `DESTINATION_GATES` equals nav ids ∪ this set.
 */
export const PANEL_SWITCH_NAV_IDS = ["assistant"] as const satisfies readonly NavId[];

/** `user` is the principal the app already holds — this never re-fetches it. */
export function canAccess(user: UserProfile | null, id: NavId): boolean {
  const gate = DESTINATION_GATES[id];
  if (!gate || !user) return false;
  if (gate.tier === "superadmin") return user.is_superadmin;
  return true;
}

/**
 * The first `NavId` the gate table would let `user` reach, in
 * `DESTINATION_GATES`'s own declaration order — not sidebar order, and not
 * a hardcoded favourite, so a tier change here can't silently leave the
 * index route's fallback pointed at a destination the principal no longer
 * has. The index route (`router.tsx`) needs a home for a plain staff
 * member: `dashboard` is superadmin-only, so a non-superadmin's very first
 * screen was otherwise a refusal banner even though their session is
 * perfectly valid. `null` means the principal can access nothing at all —
 * the caller must render a terminal screen for that, never another
 * redirect, or an all-refused principal would bounce forever.
 */
export function firstAccessibleNavId(user: UserProfile | null): NavId | null {
  for (const id of Object.keys(DESTINATION_GATES) as NavId[]) {
    if (canAccess(user, id)) return id;
  }
  return null;
}

/**
 * Same derivation as `firstAccessibleNavId`, scoped to the WORKSPACE pane —
 * excludes `assistant`, which is the other pane (`PanelSwitch`'s two modes).
 * `sidebar-shell.tsx`'s `goToWorkspace` needs this for its fallback when the
 * person has no `lastWorkspaceLocation` yet: falling back to `firstAccessibleNavId`
 * (or to the hardcoded `/`) can hand back `assistant` itself — for a plain
 * staff member, whose only two gates are `assistant` and `agent-registry`,
 * that reproduces exactly the trap this function exists to close: the
 * Workspace tab lands back on Assistant, so the workspace pane is
 * unreachable. No hardcoded favourite — still a derivation, just filtered to
 * the pane the caller is asking for a home in.
 */
export function firstAccessibleWorkspaceNavId(user: UserProfile | null): NavId | null {
  for (const id of Object.keys(DESTINATION_GATES) as NavId[]) {
    if (id === "assistant") continue;
    if (canAccess(user, id)) return id;
  }
  return null;
}
