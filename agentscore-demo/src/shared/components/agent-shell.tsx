import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Typography from "@mui/material/Typography";
import BreadcrumbsItem from "@tricentis/aura/components/BreadcrumbsItem.js";
import IconMaterialSymbolsSpeed from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsSpeed.mjs";
import IconMaterialSymbolsLayers from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsLayers.mjs";
import IconMaterialSymbolsFormatListBulleted from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsFormatListBulleted.mjs";
import IconMaterialSymbolsSettings from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsSettings.mjs";
import IconMaterialSymbolsTune from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsTune.mjs";
import IconMaterialSymbolsSmartToy from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsSmartToy.mjs";
import IconMaterialSymbolsLightbulb from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsLightbulb.mjs";

import {
  EntityShell,
  type EntityShellTabItem,
} from "@/shared/components/entity-shell";

export interface AgentShellProps {
  /** Tenant slug (`tenant_name`), used in the breadcrumb + tab links. */
  tenantId: string;
  /** Agent slug, used in tab links. */
  agentId: string;
  /** Display name for the agent (h1). Defaults to `agentId`. */
  agentName?: ReactNode;
  /** Inline badges next to the title (e.g. tenant kind, status dot). */
  badges?: ReactNode;
  /** Meta row beneath the title. */
  meta?: ReactNode;
  /** Right-side actions. */
  actions?: ReactNode;
  /** Page body (typically `<Outlet />` from the route component). */
  children?: ReactNode;
  className?: string;
}

/**
 * Agent entity shell — breadcrumb + agent header + tab strip.
 *
 * Wraps `EntityShell` with the agent-specific tab config (Score, Improve,
 * Agent Card, Traces, Profile, Labeling, Settings). Mirrors the chrome from
 * the agent screens in `docs/03-backoffice-ui-design.html`.
 */
export function AgentShell({
  tenantId,
  agentId,
  agentName,
  badges,
  meta,
  actions,
  children,
  className,
}: AgentShellProps) {
  const base = `/tenants/${tenantId}/agents/${agentId}`;
  const tabs: EntityShellTabItem[] = [
    {
      id: "score",
      label: "Score",
      to: base,
      icon: IconMaterialSymbolsSpeed,
    },
    {
      id: "improve",
      label: "Improve",
      to: `${base}/improve`,
      icon: IconMaterialSymbolsLightbulb,
    },
    {
      id: "card",
      label: "Agent Card",
      to: `${base}/card`,
      icon: IconMaterialSymbolsSmartToy,
    },
    {
      id: "traces",
      label: "Traces",
      to: `${base}/traces`,
      icon: IconMaterialSymbolsFormatListBulleted,
    },
    {
      id: "profile",
      label: "Profile",
      to: `${base}/profile`,
      icon: IconMaterialSymbolsTune,
    },
    {
      id: "labeling",
      label: "Labeling",
      to: `${base}/labeling`,
      icon: IconMaterialSymbolsLayers,
    },
    {
      id: "settings",
      label: "Settings",
      to: `${base}/settings`,
      icon: IconMaterialSymbolsSettings,
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
            to="/agents"
            label="Agents"
          />
          <Typography
            data-slot="breadcrumb-page"
            component="span"
            variant="body2"
            color="text.primary"
            aria-current="page"
          >
            {agentName ?? agentId}
          </Typography>
        </Breadcrumbs>
      }
      title={agentName ?? agentId}
      badges={badges}
      meta={meta}
      actions={actions}
      tabs={<EntityShell.Tabs items={tabs} />}
    >
      {children}
    </EntityShell>
  );
}
