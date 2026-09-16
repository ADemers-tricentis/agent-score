/** AgentRegistryLayout — shell for the merged Agent Registry destination.
 *
 * Renders the "Agent Registry" title and a tab strip; each tab is a real
 * route, so a reload or a shared link lands on the tab it names. Mirrors
 * `SimulationLayout` — a pathless layout route whose children carry the full
 * paths — because the alternative (nesting paths under a parent `path`)
 * would have made the Registry tab reachable only at a new URL.
 *
 * NO superadmin gate here: registry reads are staff-tier
 * (`destination-tiers.ts`). The Agent runs tab is hidden — never shown
 * disabled — for a non-superadmin, mirroring the sidebar's own "hidden, not
 * disabled" rule; a direct URL to `/agent-registry/runs` still hits
 * `AgentRunsPage`'s own page-level `AccessDenied`, unaffected by this layout.
 *
 * `?tenant=` is validated on the Registry route only — the Agent runs tab has
 * its own multi-tenant facet and does not read it.
 */

import { Outlet } from "@tanstack/react-router";

import { useAuth } from "@/shared/auth/use-auth";
import {
  EntityShell,
  type EntityShellTabItem,
} from "@/shared/components/entity-shell";

export function AgentRegistryLayout() {
  const { user } = useAuth();

  const tabs: EntityShellTabItem[] = [
    {
      id: "registry",
      label: "Registry",
      to: "/agent-registry",
      testId: "agent-registry-tab-registry",
    },
    ...(user?.is_superadmin
      ? [
          {
            id: "runs",
            label: "Agent runs",
            to: "/agent-registry/runs",
            testId: "agent-registry-tab-runs",
          },
        ]
      : []),
  ];

  return (
    <EntityShell
      title="Agent Registry"
      testId="agent-registry-shell"
      meta={
        user?.is_superadmin
          ? "Task slots, the agent versions serving them, and every run the fleet executed."
          : "Task slots and the agent versions serving them."
      }
      tabs={<EntityShell.Tabs items={tabs} />}
    >
      <Outlet />
    </EntityShell>
  );
}
