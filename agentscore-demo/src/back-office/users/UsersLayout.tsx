/** UsersLayout — shell for the Users + Access requests tabs.
 *
 * Renders an EntityShell with one "Users" title and a two-tab strip (Users /
 * Access requests) so the people list and the access-request queue are
 * reachable by clicking, and each is a real route so it can be opened,
 * refreshed and shared directly. Both tabs render into `<Outlet />` below the
 * shell chrome. Both are superadmin-only, and both tiers were already
 * superadmin before this merge — the gate lives here, once, so a refused
 * principal is told so a single time instead of once per tab (mirrors
 * `EvalCatalogLayout.tsx`).
 */

import { Outlet } from "@tanstack/react-router";

import {
  EntityShell,
  type EntityShellTabItem,
} from "@/shared/components/entity-shell";

const TABS: EntityShellTabItem[] = [
  { id: "users", label: "Users", to: "/users" },
  { id: "requests", label: "Access requests", to: "/users/requests" },
];

// No backend, no auth: the demo's "current user" (see fake-data.ts's
// CURRENT_USER_ID) is always a superadmin, so the real gate here would never
// fire anyway - dropped rather than left as dead code.
export function UsersLayout() {
  return (
    <EntityShell title="Users" tabs={<EntityShell.Tabs items={TABS} />}>
      <Outlet />
    </EntityShell>
  );
}
