// TEMPORARY shell for this pass (Agents section only) — NOT a copy of the
// real `sidebar-shell.tsx`, which pulls in auth + tenants/users/assistant
// APIs we haven't built yet. Swap for the real cloned shell once the nav/
// shell gets its own pass.
import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { Link } from "@tanstack/react-router";

import { canAccess, type NavId } from "@/shared/auth/destination-tiers";
import { useDemoMode } from "@/shared/demo-mode/demo-mode-context";
import { NAV_ICON_SIZE } from "@/shared/components/sidebar-nav";
import IconMaterialSymbolsAccountTree from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsAccountTree.mjs";
import IconMaterialSymbolsApartment from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsApartment.mjs";
import IconMaterialSymbolsBalance from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsBalance.mjs";
import IconMaterialSymbolsBarChart from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsBarChart.mjs";
import IconMaterialSymbolsGroup from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsGroup.mjs";
import IconMaterialSymbolsMenuBook from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsMenuBook.mjs";
import IconMaterialSymbolsScience from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsScience.mjs";
import IconMaterialSymbolsSmartToy from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsSmartToy.mjs";
import IconMaterialSymbolsSpaceDashboard from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsSpaceDashboard.mjs";

type NavItem = {
  id: NavId;
  to: string;
  search?: Record<string, unknown>;
  icon: typeof IconMaterialSymbolsSpaceDashboard;
  label: string;
};

/** The 8 destinations this trimmed shell actually routes to. `id` matches
 * `destination-tiers.ts` so the demo-mode role toggle can gate visibility
 * off the same tiers production uses for staff vs. superadmin (see
 * `STAFF_VISIBLE_EXTRA_IDS` below for this demo's deliberate override) —
 * deliberately NOT the full `sidebarNavItems` list, which also includes
 * sections this clone hasn't built (ingestion, scoring-pipeline, simulation,
 * debug-logs) and would otherwise turn into dead links for an admin. */
const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", to: "/", icon: IconMaterialSymbolsSpaceDashboard, label: "Home" },
  {
    id: "agents",
    to: "/agents",
    search: { view: "list", by: "tenant" },
    icon: IconMaterialSymbolsSmartToy,
    label: "My Agents",
  },
  { id: "tenants", to: "/tenants", icon: IconMaterialSymbolsApartment, label: "Tenants" },
  { id: "users", to: "/users", icon: IconMaterialSymbolsGroup, label: "Users" },
  { id: "evals-catalog", to: "/evals/catalog/evals", icon: IconMaterialSymbolsScience, label: "Evals Catalog" },
  {
    id: "llm-catalog",
    to: "/llm-catalog",
    search: { tab: "catalog" },
    icon: IconMaterialSymbolsBalance,
    label: "LLM Catalog",
  },
  {
    id: "agent-registry",
    to: "/agent-registry",
    search: {},
    icon: IconMaterialSymbolsAccountTree,
    label: "Agent Registry",
  },
  { id: "reports", to: "/reports", search: { tab: "usage" }, icon: IconMaterialSymbolsBarChart, label: "Reports" },
];

/** Demo-specific override, on top of `canAccess`: in the real product these
 * are superadmin-only, but for this demo a Staff viewer should still be able
 * to land on Home and see their own agents and the eval catalog they run
 * against - only Tenants/Users/LLM Catalog/Reports (genuinely admin-only
 * concerns) stay hidden. Deliberate deviation from production tiering, per
 * user request. */
const STAFF_VISIBLE_EXTRA_IDS: NavId[] = ["dashboard", "agents", "evals-catalog"];

function NavLink({ item }: { item: NavItem }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      search={item.search}
      style={{ textDecoration: "none", color: "inherit", display: "flex", alignItems: "center", gap: 8 }}
    >
      <Icon sx={{ fontSize: NAV_ICON_SIZE, flexShrink: 0, color: "text.secondary" }} />
      <Typography variant="body2">{item.label}</Typography>
    </Link>
  );
}

/** Presenter-only controls for switching the demo's role and data state —
 * see `shared/demo-mode/demo-mode-context.tsx`. Visually separated from the
 * real nav (border, caption label) so it doesn't read as a product feature. */
function DemoControls() {
  const { role, setRole, blank, setBlank } = useDemoMode();
  return (
    <Box sx={{ mt: "auto", pt: 1.5, borderTop: 1, borderColor: "divider" }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
        Demo controls
      </Typography>
      <FormControlLabel
        sx={{ ml: 0, display: "flex", justifyContent: "space-between" }}
        labelPlacement="start"
        control={
          <Switch
            size="small"
            checked={role === "admin"}
            onChange={(e) => setRole(e.target.checked ? "admin" : "staff")}
          />
        }
        label={<Typography variant="body2">{role === "admin" ? "Admin" : "Staff"}</Typography>}
      />
      <FormControlLabel
        sx={{ ml: 0, display: "flex", justifyContent: "space-between" }}
        labelPlacement="start"
        control={<Switch size="small" checked={blank} onChange={(e) => setBlank(e.target.checked)} />}
        label={<Typography variant="body2">Blank / new login</Typography>}
      />
    </Box>
  );
}

export function MinimalShell({ children }: { children: ReactNode }) {
  const { user, role } = useDemoMode();
  const visibleItems = NAV_ITEMS.filter(
    (item) => canAccess(user, item.id) || (role === "staff" && STAFF_VISIBLE_EXTRA_IDS.includes(item.id)),
  );

  return (
    <Box sx={{ display: "flex", height: "100vh" }}>
      <Box
        sx={{
          width: 220,
          flexShrink: 0,
          borderRight: 1,
          borderColor: "divider",
          p: 2,
          display: "flex",
          flexDirection: "column",
          gap: 1,
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
          AgentScore
        </Typography>
        {visibleItems.map((item) => (
          <NavLink key={item.id} item={item} />
        ))}
        {/* Not a `NavItem`/`NavId` — there's no production back-office
         * equivalent to gate against, so this is demo-only and always
         * visible regardless of role. */}
        <Link
          to="/docs/$slug"
          params={{ slug: "welcome" }}
          style={{ textDecoration: "none", color: "inherit", display: "flex", alignItems: "center", gap: 8 }}
        >
          <IconMaterialSymbolsMenuBook sx={{ fontSize: NAV_ICON_SIZE, flexShrink: 0, color: "text.secondary" }} />
          <Typography variant="body2">Docs</Typography>
        </Link>
        <DemoControls />
      </Box>
      <Box sx={{ flex: 1, overflow: "auto" }}>{children}</Box>
    </Box>
  );
}
