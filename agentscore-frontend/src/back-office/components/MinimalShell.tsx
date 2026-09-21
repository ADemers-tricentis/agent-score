// TEMPORARY shell for this pass (Agents section only) — NOT a copy of the
// real `sidebar-shell.tsx`, which pulls in auth + assistant APIs we haven't
// built yet. Swap for the real cloned shell once the nav/shell gets its own
// pass.
import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { Link } from "@tanstack/react-router";

import { canAccess, type NavId } from "@/shared/auth/destination-tiers";
import { useDemoMode } from "@/shared/demo-mode/demo-mode-context";
import { NAV_ICON_SIZE } from "@/shared/components/sidebar-nav";
import IconMaterialSymbolsBarChart from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsBarChart.mjs";
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

/** The destinations this trimmed shell actually routes to. `id` matches
 * `destination-tiers.ts` so the demo-mode role toggle can gate visibility
 * off the same tiers production uses for staff vs. superadmin (see
 * `STAFF_VISIBLE_EXTRA_IDS` below for this demo's deliberate override) —
 * deliberately NOT the full `sidebarNavItems` list, which also includes
 * sections this clone hasn't built (ingestion, scoring-pipeline, simulation,
 * debug-logs) and would otherwise turn into dead links for an admin.
 * `tenants` and `users` are intentionally absent, not just unbuilt - per
 * user request, this beta drops both as visible concepts: a person's tenant
 * is resolved automatically from their Tosca login (never picked/created by
 * hand - see `useDemoMode().tenantId`), and anyone who logs in and resolves
 * to that tenant is already a member, with no invite/approval step and no
 * RBAC yet. `llm-catalog` is intentionally absent too - LLM provider is now
 * a per-agent setting (`AgentSettingsPage`), not a shared catalog. All three
 * may come back later, for staff debugging - out of scope for this pass.
 * `integrations` is also intentionally absent - API-key management moved
 * into the tenant detail Settings tab, so there's no top-level page for it.
 * `agent-registry` is intentionally absent too - not yet ready for users.
 * With so few destinations left, there's no longer a collapsible "Advanced"
 * group splitting them off - every destination is a flat, always-visible
 * menu item (per user request). */
const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", to: "/", icon: IconMaterialSymbolsSpaceDashboard, label: "Home" },
  {
    id: "agents",
    to: "/agents",
    search: { view: "list", by: "tenant" },
    icon: IconMaterialSymbolsSmartToy,
    label: "My Agents",
  },
  { id: "evals-catalog", to: "/evals/catalog/evals", icon: IconMaterialSymbolsScience, label: "Evals Catalog" },
  { id: "reports", to: "/reports", search: { tab: "usage" }, icon: IconMaterialSymbolsBarChart, label: "Reports" },
];

/** Demo-specific override, on top of `canAccess`: in the real product these
 * are superadmin-only, but for this demo a Staff viewer should still be able
 * to land on Home and see their own agents and the eval catalog they run
 * against - only Reports (a genuinely admin-only concern) stays hidden.
 * Deliberate deviation from production tiering, per user request. */
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
  const isVisible = (item: NavItem) =>
    canAccess(user, item.id) || (role === "staff" && STAFF_VISIBLE_EXTRA_IDS.includes(item.id));
  const visibleItems = NAV_ITEMS.filter(isVisible);

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
        {/* `data-tour="sidebar-nav"` scopes the tour's "everything starts
         * here" spotlight to just the nav links — excludes the title above
         * and the demo-only controls below. */}
        <Box component="nav" data-tour="sidebar-nav" sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
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
        </Box>
        <DemoControls />
      </Box>
      <Box sx={{ flex: 1, overflow: "auto" }}>{children}</Box>
    </Box>
  );
}
