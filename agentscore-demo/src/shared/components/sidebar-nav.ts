import type SvgIcon from "@mui/material/SvgIcon";

import { canAccess, type NavId } from "@/shared/auth/destination-tiers";
import type { UserProfile } from "@/shared/auth/api";

import IconMaterialSymbolsAccountTree from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsAccountTree.mjs";
import IconMaterialSymbolsApartment from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsApartment.mjs";
import IconMaterialSymbolsBalance from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsBalance.mjs";
import IconMaterialSymbolsBarChart from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsBarChart.mjs";
import IconMaterialSymbolsConveyorBelt from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsConveyorBelt.mjs";
import IconMaterialSymbolsGroup from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsGroup.mjs";
import IconMaterialSymbolsMonitorHeart from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsMonitorHeart.mjs";
import IconMaterialSymbolsReplay from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsReplay.mjs";
import IconMaterialSymbolsScience from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsScience.mjs";
import IconMaterialSymbolsSmartToy from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsSmartToy.mjs";
import IconMaterialSymbolsSpaceDashboard from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsSpaceDashboard.mjs";
import IconMaterialSymbolsTerminal from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsTerminal.mjs";

/**
 * Nav icon size (px, unitless). Matches the Tricentis Tosca portal left nav
 * (24px, vs the back-office's former 16px). Shared by the expanded sidebar and
 * the collapsed icon rail so the two can't drift.
 */
export const NAV_ICON_SIZE = 24;

export type SidebarNavItem = {
  /** Stable id, used for active-state lookup + `data-nav`. */
  id: string;
  /** Display label. */
  title: string;
  /** Route target. */
  to: string;
  /** Material Symbols icon component. */
  icon: typeof SvgIcon;
  /**
   * Override the default active-state matcher. Default is exact match for
   * the root path (`/`) and `startsWith(to)` for everything else.
   *
   * Provide a custom matcher to handle nested routes that should highlight a
   * different sidebar item — e.g. `/tenants/:id/agents/:id` highlights
   * "Agents", not "Tenants".
   */
  matches?: (pathname: string) => boolean;
};

export type SidebarNavSection = {
  /**
   * Group name. Never rendered — the nav is one unbroken list, with no visible
   * label and no divider between groups. Used as the group's `aria-label` (so
   * screen readers still announce it) and as the React key.
   */
  title: string;
  items: SidebarNavItem[];
};

export const sidebarNavSections: SidebarNavSection[] = [
  {
    title: "Workspace",
    items: [
      {
        id: "dashboard",
        title: "Home",
        to: "/",
        icon: IconMaterialSymbolsSpaceDashboard,
        matches: (p) => p === "/",
      },
      {
        id: "agents",
        title: "Agents",
        to: "/agents",
        icon: IconMaterialSymbolsSmartToy,
        matches: (p) =>
          p === "/agents" ||
          p.startsWith("/agents/") ||
          // Agent detail lives under /tenants/:tid/agents/:aid — keep
          // "Agents" highlighted there too.
          /\/agents(\/|$)/.test(p),
      },
      {
        id: "tenants",
        title: "Tenants",
        to: "/tenants",
        icon: IconMaterialSymbolsApartment,
        matches: (p) =>
          (p === "/tenants" || p.startsWith("/tenants/")) &&
          // Surrender to "Agents" when we're inside an agent detail URL.
          !/\/agents(\/|$)/.test(p),
      },
      {
        id: "users",
        title: "Users",
        to: "/users",
        icon: IconMaterialSymbolsGroup,
        matches: (p) => p === "/users" || p.startsWith("/users/"),
      },
      {
        id: "evals-catalog",
        title: "Evals Catalog",
        to: "/evals/catalog/evals",
        icon: IconMaterialSymbolsScience,
        matches: (p) => p.startsWith("/evals/catalog"),
      },
      {
        id: "llm-catalog",
        title: "LLM Catalog",
        to: "/llm-catalog",
        icon: IconMaterialSymbolsBalance,
        matches: (p) => p === "/llm-catalog" || p.startsWith("/llm-catalog/"),
      },
      {
        id: "agent-registry",
        title: "Agent Registry",
        to: "/agent-registry",
        icon: IconMaterialSymbolsAccountTree,
      },
      {
        id: "ingestion",
        title: "Ingestion",
        to: "/admin/ingestion",
        icon: IconMaterialSymbolsMonitorHeart,
        matches: (p) =>
          p === "/admin/ingestion" || p.startsWith("/admin/ingestion/"),
      },
      {
        id: "scoring-pipeline",
        title: "Scoring Pipeline",
        to: "/scoring-pipeline",
        icon: IconMaterialSymbolsConveyorBelt,
        matches: (p) =>
          p === "/scoring-pipeline" || p.startsWith("/scoring-pipeline/"),
      },
      {
        id: "simulation",
        title: "Simulation",
        to: "/simulation",
        icon: IconMaterialSymbolsReplay,
        matches: (p) => p === "/simulation" || p.startsWith("/simulation/"),
      },
      {
        id: "reports",
        title: "Reports",
        to: "/reports",
        icon: IconMaterialSymbolsBarChart,
        matches: (p) => p === "/reports" || p.startsWith("/reports/"),
      },
      // Debug Logs (superadmin only). Gated on the SAME
      // VITE_DEBUG_LOG_STREAM expression as the route in routes/router.tsx —
      // the two must never drift apart.
      ...(import.meta.env.VITE_DEBUG_LOG_STREAM !== "false"
        ? [
            {
              id: "debug-logs",
              title: "Debug Logs",
              to: "/admin/debug-logs",
              icon: IconMaterialSymbolsTerminal,
              matches: (p: string) =>
                p === "/admin/debug-logs" || p.startsWith("/admin/debug-logs/"),
            },
          ]
        : []),
    ],
  },
];

/** Flat list of all items — convenient for the collapsed icon rail. */
export const sidebarNavItems: SidebarNavItem[] = sidebarNavSections.flatMap(
  (s) => s.items,
);

/** Resolve which nav item is currently active for the given pathname. */
export function resolveActiveNavItem(
  pathname: string,
): SidebarNavItem | undefined {
  return sidebarNavItems.find((item) => {
    if (item.matches) return item.matches(pathname);
    if (item.to === "/") return pathname === "/";
    return pathname === item.to || pathname.startsWith(item.to + "/");
  });
}

/**
 * Sections filtered to what `user`'s tier can serve — a destination the
 * principal can't reach is hidden, never shown-and-disabled. A section that
 * ends up with no visible items is dropped rather than rendered empty: an
 * empty `<List>` is invisible on screen but is still announced to a screen
 * reader as a navigation group with nothing in it.
 *
 * `sidebarNavItems` and `resolveActiveNavItem` stay unfiltered: active-state
 * resolution must keep working for a superadmin deep-linking anywhere, and
 * those two are not what renders the nav to the user.
 */
export function visibleSidebarSections(
  user: UserProfile | null,
): SidebarNavSection[] {
  return sidebarNavSections
    .map((section) => ({
      ...section,
      // `item.id: string` — SidebarNavItem is a general nav-item shape, not
      // scoped to DESTINATION_GATES's keys. The pin in sidebar-tier.test.ts
      // ("covers exactly the sidebar's nav ids") is what actually guarantees
      // every id here is a valid NavId.
      items: section.items.filter((item) => canAccess(user, item.id as NavId)),
    }))
    .filter((section) => section.items.length > 0);
}
