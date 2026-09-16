import type { ReactNode } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import type SvgIcon from "@mui/material/SvgIcon";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";

import { PageTitleIcon } from "@/shared/components/page-title-icon";

export interface EntityShellTabItem {
  /** Stable id used for `data-tab` and React `key`. */
  id: string;
  /** Tab label. */
  label: ReactNode;
  /** Destination path (TanStack Router). */
  to: string;
  /** Optional leading icon. */
  icon?: typeof SvgIcon;
  /** Optional trailing count/badge (number formatted by the caller). */
  count?: ReactNode;
  /** Optional explicit `data-testid` forwarded to the leaf tab. */
  testId?: string;
}

export interface EntityShellProps {
  /** Breadcrumb element (use MUI `Breadcrumbs` + Aura `BreadcrumbsItem`). */
  breadcrumb?: ReactNode;
  /** Title (rendered as `<h1>`). */
  title: ReactNode;
  /**
   * Optional inline badges / status next to the title (e.g. tenant kind,
   * provisioning state). Children should render as small chips/pills.
   */
  badges?: ReactNode;
  /**
   * Optional meta row below the title (id, last activity, created info).
   * Caller supplies the separators.
   */
  meta?: ReactNode;
  /** Right-side actions (buttons). */
  actions?: ReactNode;
  /** Tab strip. Usually `<EntityShell.Tabs items={...} />`. */
  tabs?: ReactNode;
  /** Page body (typically `<Outlet />`). */
  children?: ReactNode;
  className?: string;
  /**
   * Optional `data-testid` for the shell root, identifying WHICH entity page
   * rendered. The shell's own chrome carries `data-slot` attributes only, and
   * those are shared by every page built on it, so without this a browser
   * script has no hook that distinguishes one detail page from another —
   * exactly the product gap `.cursor/rules/e2e-testing.mdc` says to close in
   * the component rather than work around with a text selector.
   */
  testId?: string;
  /**
   * When true, the page-title icon is omitted and the title sits flush left
   * in its place — the same layout the shell already renders on routes
   * `PageTitleIcon` itself can't resolve (e.g. login, the dev gallery), so no
   * new reserved-space behavior is introduced. Default undefined/false —
   * every existing caller keeps the icon unchanged. Inverted (hide, not
   * show) so adding this prop requires no edits at any existing call site:
   * the icon stays the default and only a caller that needs it gone has to
   * opt in.
   *
   * The icon resolves its glyph against the back-office navigation config,
   * which the customer bundle does not carry.
   */
  hideTitleIcon?: boolean;
}

/**
 * Entity-detail shell — used by tenant and agent detail pages. Renders:
 *
 *   ┌──────────────────────────────────────────────────────────┐
 *   │ breadcrumb                                               │
 *   │ title  badges                                  actions   │
 *   │ meta                                                     │
 *   │ tab tab tab                                              │
 *   ├──────────────────────────────────────────────────────────┤
 *   │ children (page body / <Outlet />)                        │
 *   └──────────────────────────────────────────────────────────┘
 *
 * Mirrors the chrome from `docs/03-backoffice-ui-design.html` (the agent and
 * tenant entity screens). The thin wrappers `AgentShell` and `TenantShell`
 * pre-fill the tab config.
 */
export function EntityShell({
  breadcrumb,
  title,
  badges,
  meta,
  actions,
  tabs,
  children,
  className,
  hideTitleIcon,
  testId,
}: EntityShellProps) {
  return (
    <Box
      data-slot="entity-shell"
      data-testid={testId}
      className={className}
      sx={{
        display: "flex",
        minHeight: 0,
        flex: 1,
        flexDirection: "column",
      }}
    >
      <Box
        data-slot="entity-shell-header"
        sx={{
          flexShrink: 0,
          bgcolor: "background.paper",
          px: 4,
          pt: 3,
        }}
      >
        {breadcrumb ? (
          <Box data-slot="entity-shell-breadcrumb" sx={{ mb: 1.5 }}>
            {breadcrumb}
          </Box>
        ) : null}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 1.5,
          }}
        >
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 1.25,
              }}
            >
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 1,
                  minWidth: 0,
                }}
              >
                {hideTitleIcon ? null : <PageTitleIcon />}
                <Typography
                  variant="h3"
                  component="h1"
                  data-slot="entity-shell-title"
                  sx={{ minWidth: 0, color: "text.primary" }}
                >
                  {title}
                </Typography>
              </Box>
              {badges ? (
                <Box
                  data-slot="entity-shell-badges"
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  {badges}
                </Box>
              ) : null}
            </Box>
            {meta ? (
              <Box
                data-slot="entity-shell-meta"
                sx={{
                  mt: 0.5,
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: 1.5,
                  typography: "caption",
                  color: "text.secondary",
                }}
              >
                {meta}
              </Box>
            ) : null}
          </Box>
          {actions ? (
            <Box
              data-slot="entity-shell-actions"
              sx={{
                display: "flex",
                flexShrink: 0,
                alignItems: "center",
                gap: 1,
              }}
            >
              {actions}
            </Box>
          ) : null}
        </Box>
        {tabs ? <Box sx={{ mt: 2.5 }}>{tabs}</Box> : null}
      </Box>
      {/* Default scroll region for the active tab. Tabs that need their own
          pinned sub-chrome (e.g. the traces toolbar, the trace-detail panes)
          render a full-height container and manage scrolling internally. */}
      <Box
        data-slot="entity-shell-body"
        sx={{ minHeight: 0, flex: 1, overflowY: "auto" }}
      >
        {children}
      </Box>
    </Box>
  );
}

export interface EntityShellTabsProps {
  items: EntityShellTabItem[];
  /**
   * Override the active tab id. Default: derive from current pathname by
   * matching items[].to against `location.pathname`.
   */
  activeId?: string;
  className?: string;
}

/**
 * URL-aware tab strip. Each tab is a TanStack Router `<Link>` (MUI `Tab`
 * `component={Link}`); the active tab is determined by matching `item.to`
 * against the current path, not by MUI's click-driven selection — so the
 * indicator follows the URL even on back/forward navigation. `data-active`
 * mirrors the resolved active id for the e2e/component suites.
 */
function EntityShellTabs({ items, activeId, className }: EntityShellTabsProps) {
  const location = useLocation();
  const path = location.pathname;
  const resolvedActive =
    activeId ?? resolveActiveTab(items, path) ?? items[0]?.id;

  return (
    <Tabs
      value={resolvedActive ?? false}
      data-slot="entity-shell-tabs"
      aria-label="Entity sections"
      className={className}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = item.id === resolvedActive;
        return (
          <Tab
            key={item.id}
            value={item.id}
            component={Link}
            to={item.to}
            data-slot="entity-shell-tab"
            data-tab={item.id}
            data-testid={item.testId}
            data-active={isActive ? "true" : "false"}
            aria-current={isActive ? "page" : undefined}
            label={
              <Box
                component="span"
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.75,
                }}
              >
                {Icon ? <Icon sx={{ fontSize: 14 }} /> : null}
                <span>{item.label}</span>
                {item.count !== undefined && item.count !== null ? (
                  <Box
                    component="span"
                    data-slot="entity-shell-tab-count"
                    sx={{
                      borderRadius: 0.5,
                      bgcolor: "action.hover",
                      px: 0.5,
                      fontFamily: "monospace",
                      typography: "caption",
                      color: "text.secondary",
                    }}
                  >
                    {item.count}
                  </Box>
                ) : null}
              </Box>
            }
          />
        );
      })}
    </Tabs>
  );
}

/**
 * Pick the active tab by longest-prefix match against `pathname`. Falls back
 * to undefined if nothing matches.
 */
function resolveActiveTab(
  items: EntityShellTabItem[],
  pathname: string,
): string | undefined {
  let bestId: string | undefined;
  let bestLen = -1;
  for (const item of items) {
    if (pathname === item.to || pathname.startsWith(item.to + "/")) {
      if (item.to.length > bestLen) {
        bestId = item.id;
        bestLen = item.to.length;
      }
    }
  }
  return bestId;
}

EntityShell.Tabs = EntityShellTabs;
