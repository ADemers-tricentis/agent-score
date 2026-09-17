import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Typography from "@mui/material/Typography";
import BreadcrumbsItem from "@tricentis/aura/components/BreadcrumbsItem.js";
import IconMaterialSymbolsSmartToy from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsSmartToy.mjs";
import IconMaterialSymbolsGroup from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsGroup.mjs";
import IconMaterialSymbolsHistory from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsHistory.mjs";
import IconMaterialSymbolsSettings from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsSettings.mjs";
import IconMaterialSymbolsSpaceDashboard from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsSpaceDashboard.mjs";

import {
  EntityShell,
  type EntityShellTabItem,
} from "@/shared/components/entity-shell";

export interface TenantShellProps {
  /** Tenant slug (`tenant_name`), used in the breadcrumb + tab links. */
  tenantId: string;
  /** Display name for the tenant (h1). Defaults to `tenantId`. */
  tenantName?: ReactNode;
  /** Inline badges next to the title (kind, env, status). */
  badges?: ReactNode;
  /** Meta row beneath the title. */
  meta?: ReactNode;
  /** Right-side actions. */
  actions?: ReactNode;
  /** Optional count to surface on the Agents tab. */
  agentsCount?: ReactNode;
  /** Optional count to surface on the Members tab. */
  membersCount?: ReactNode;
  /** Page body (typically `<Outlet />` from the route component). */
  children?: ReactNode;
  className?: string;
}

/**
 * Tenant entity shell — breadcrumb + tenant header + tab strip.
 *
 * Wraps `EntityShell` with the tenant-specific tab config (Overview, Agents,
 * Members, Settings, Audit Log). Mirrors the chrome from the
 * tenant screens in `docs/03-backoffice-ui-design.html`.
 */
export function TenantShell({
  tenantId,
  tenantName,
  badges,
  meta,
  actions,
  agentsCount,
  membersCount,
  children,
  className,
}: TenantShellProps) {
  const base = `/tenants/${tenantId}`;
  const tabs: EntityShellTabItem[] = [
    {
      id: "overview",
      label: "Overview",
      to: base,
      icon: IconMaterialSymbolsSpaceDashboard,
    },
    {
      id: "agents",
      label: "Agents",
      to: `${base}/agents`,
      icon: IconMaterialSymbolsSmartToy,
      count: agentsCount,
    },
    {
      id: "members",
      label: "Members",
      to: `${base}/members`,
      icon: IconMaterialSymbolsGroup,
      count: membersCount,
    },
    {
      id: "settings",
      label: "Settings",
      to: `${base}/settings`,
      icon: IconMaterialSymbolsSettings,
    },
    {
      id: "audit-log",
      label: "Audit Log",
      to: `${base}/audit-log`,
      icon: IconMaterialSymbolsHistory,
      testId: "tenant-audit-log-tab",
    },
  ];

  return (
    <EntityShell
      className={className}
      breadcrumb={
        <Breadcrumbs data-slot="breadcrumb" aria-label="breadcrumb">
          <BreadcrumbsItem
            data-slot="breadcrumb-link"
            component={Link}
            to="/tenants"
            label="Tenants"
          />
          <Typography
            data-slot="breadcrumb-page"
            component="span"
            variant="body2"
            color="text.primary"
            aria-current="page"
          >
            {tenantName ?? tenantId}
          </Typography>
        </Breadcrumbs>
      }
      title={tenantName ?? tenantId}
      badges={badges}
      meta={meta}
      actions={actions}
      tabs={<EntityShell.Tabs items={tabs} />}
    >
      {children}
    </EntityShell>
  );
}
