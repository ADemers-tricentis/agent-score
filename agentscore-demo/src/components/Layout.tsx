import type { ReactNode, ReactElement } from "react";
import { useRef, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ButtonBase from "@mui/material/ButtonBase";
import IconButton from "@mui/material/IconButton";
import SvgIcon from "@mui/material/SvgIcon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import Select from "@mui/material/Select";
import Tooltip from "@mui/material/Tooltip";
import { useColorScheme } from "@mui/material/styles";
import NavRail from "@tricentis/aura/components/NavRail.js";
import IconAgentsOutlined from "@tricentis/aura/components/IconAgentsOutlined.js";
import IconCellularDataOutlined from "@tricentis/aura/components/IconCellularDataOutlined.js";
import IconArtificialIntelligenceOutlined from "@tricentis/aura/components/IconArtificialIntelligenceOutlined.js";
import IconAgentCloudOutlined from "@tricentis/aura/components/IconAgentCloudOutlined.js";
import IconAgentTeamOutlined from "@tricentis/aura/components/IconAgentTeamOutlined.js";
import IconAgentSimOutlined from "@tricentis/aura/components/IconAgentSimOutlined.js";
import IconAgentPersonalOutlined from "@tricentis/aura/components/IconAgentPersonalOutlined.js";
import IconDeveloperModeOutlined from "@tricentis/aura/components/IconDeveloperModeOutlined.js";
import IconDistributionConstantOutlined from "@tricentis/aura/components/IconDistributionConstantOutlined.js";
import IconConnectionOutlined from "@tricentis/aura/components/IconConnectionOutlined.js";
import IconFileTableAdvancedOutlined from "@tricentis/aura/components/IconFileTableAdvancedOutlined.js";
import IconComponentsOutlined from "@tricentis/aura/components/IconComponentsOutlined.js";
import type { View, ProjectType, PreviewRole } from "../types";
import { PROJECTS, TENANTS } from "../data/mock";

interface Props {
  view: View;
  navigate: (v: View) => void;
  children: ReactNode;
  previewRole: PreviewRole;
  setPreviewRole: (r: PreviewRole) => void;
  tenantId: string;
  setTenantId: (id: string) => void;
}

function HomeIcon() {
  return <SvgIcon><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" /></SvgIcon>;
}

function PlayCircleIcon() {
  return <SvgIcon><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" /></SvgIcon>;
}

function BookIcon() {
  return <SvgIcon><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 18H6V4h5v8l2.5-1.5L16 12V4h2v16z" /></SvgIcon>;
}

function BadgeIcon() {
  return <SvgIcon><path d="M20 6h-4V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2H4c-1.1 0-1.99.9-1.99 2v11c0 1.1.89 2 1.99 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6 0h-4V4h4v2z" /></SvgIcon>;
}

function PeopleIcon() {
  return <SvgIcon><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" /></SvgIcon>;
}

function ReportsIcon() {
  return <SvgIcon><path d="M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z" /></SvgIcon>;
}

function projectIcon(type: ProjectType): ReactElement {
  switch (type) {
    case "ATA": return <IconAgentCloudOutlined />;
    case "ATC": return <IconAgentTeamOutlined />;
    case "CURA": return <IconAgentSimOutlined />;
    case "AI_WORKSPACE": return <IconAgentPersonalOutlined />;
    case "CODING": return <IconDeveloperModeOutlined />;
    case "APT": return <IconDistributionConstantOutlined />;
  }
}

export default function Layout({ view, navigate, children, previewRole, setPreviewRole, tenantId, setTenantId }: Props) {
  const { mode, setMode } = useColorScheme();
  const isDark = (mode ?? "light") === "dark";
  const [agentMenuOpen, setAgentMenuOpen] = useState(false);
  const agentButtonRef = useRef<HTMLDivElement>(null);

  const breadcrumbs = buildBreadcrumbs(view);

  const isAnyAgentView = ["agent", "agent-run", "session", "compare-runs", "eval-design", "chat-scoring"].includes(view.name);
  const activeProjectId = "projectId" in view ? view.projectId : null;
  const activeProject = PROJECTS.find((p) => p.id === activeProjectId);

  const advancedViewNames = ["metrics", "llm-judges", "add-judge", "dimensions", "profiles", "profile", "add-profile"];
  const isAdvancedView = advancedViewNames.includes(view.name);

  const adminViewNames = ["tenants", "users", "add-user", "llm-catalog", "reports", "tenant-usage"];
  const isAdminView = adminViewNames.includes(view.name);
  const isAdminPreview = previewRole === "admin";

  const navItems = [
    {
      id: "home",
      text: "Home",
      icon: <HomeIcon />,
      selected: view.name === "home",
      onClick: () => navigate({ name: "home" }),
    },
    {
      id: "agents",
      text: "My Agents",
      icon: <IconAgentsOutlined />,
      selected: view.name === "agents" || view.name === "add-agent",
      onClick: () => navigate({ name: "agents" }),
    },
    {
      id: "agent-registry",
      text: "Agent Registry",
      icon: <IconAgentCloudOutlined />,
      selected: ["agent-registry", "registry-slot", "registry-version", "registry-version-new"].includes(view.name),
      onClick: () => navigate({ name: "agent-registry" }),
    },
    {
      id: "integrations",
      text: "Integrations",
      icon: <IconConnectionOutlined />,
      selected: view.name === "integrations",
      onClick: () => navigate({ name: "integrations" }),
    },
    {
      id: "reports",
      text: "Reports",
      icon: <ReportsIcon />,
      selected: view.name === "reports" || view.name === "tenant-usage",
      onClick: () => navigate({ name: "reports" }),
    },
    {
      id: "demo-gallery",
      text: "Try a demo agent",
      icon: <PlayCircleIcon />,
      selected: view.name === "demo-gallery",
      onClick: () => navigate({ name: "demo-gallery" }),
    },
    {
      id: "getting-started",
      text: "Getting Started",
      icon: <BookIcon />,
      selected: view.name === "getting-started",
      onClick: () => navigate({ name: "getting-started" }),
    },
    {
      id: "advanced",
      text: "Advanced",
      icon: <IconDeveloperModeOutlined />,
      tooltipText: "Developer settings - judges, guard rules, and raw metrics",
      selected: isAdvancedView,
      items: [
        {
          id: "metrics",
          text: "Metrics",
          icon: <IconCellularDataOutlined />,
          selected: view.name === "metrics",
          onClick: () => navigate({ name: "metrics" }),
        },
        {
          id: "llm-judges",
          text: "LLM Judges",
          icon: <IconArtificialIntelligenceOutlined />,
          selected: view.name === "llm-judges" || view.name === "add-judge",
          onClick: () => navigate({ name: "llm-judges" }),
        },
        {
          id: "dimensions",
          text: "Dimensions",
          icon: <IconComponentsOutlined />,
          selected: view.name === "dimensions",
          onClick: () => navigate({ name: "dimensions" }),
        },
        {
          id: "profiles",
          text: "Profiles",
          icon: <IconFileTableAdvancedOutlined />,
          selected: view.name === "profiles" || view.name === "profile",
          onClick: () => navigate({ name: "profiles" }),
        },
      ],
    },
    ...(isAdminPreview
      ? [
          {
            id: "admin",
            text: "Admin",
            icon: <BadgeIcon />,
            tooltipText: "Superadmin-only surfaces - tenants, staff users, and the LLM catalog",
            selected: isAdminView,
            items: [
              {
                id: "tenants",
                text: "Tenants",
                icon: <IconAgentTeamOutlined />,
                selected: view.name === "tenants",
                onClick: () => navigate({ name: "tenants" }),
              },
              {
                id: "users",
                text: "Users",
                icon: <PeopleIcon />,
                selected: view.name === "users" || view.name === "add-user",
                onClick: () => navigate({ name: "users" }),
              },
              {
                id: "llm-catalog",
                text: "LLM Catalog",
                icon: <IconArtificialIntelligenceOutlined />,
                selected: view.name === "llm-catalog",
                onClick: () => navigate({ name: "llm-catalog" }),
              },
            ],
          },
        ]
      : []),
  ];

  return (
    <Box sx={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* Sidebar - same nav surface token as the content area (aura.navigationBackground)
          so the shell reads as one continuous surface, separated only by this divider,
          matching the real back office's SidebarShell/AppSidebar. */}
      <Box sx={{ width: 288, flexShrink: 0, display: "flex", flexDirection: "column", borderRight: "1px solid", borderColor: "divider", bgcolor: "aura.navigationBackground", overflow: "hidden" }}>
        {/* NavRail for top items - we clip it to hide its border since we add our own */}
        <Box sx={{ flex: 1, overflow: "hidden", position: "relative" }}>
          <NavRail items={navItems} isChangeSelectedDisabled open width={288} />

          {/* Agent section - overlaid at the bottom of the nav area */}
          <Box
            sx={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              borderTop: "1px solid",
              borderColor: "divider",
              bgcolor: "aura.navigationBackground",
            }}
          >
            {/* Agent nav item - flat full-width selection band (no rounding, no left
                accent border), matching the real nav's row style: state is carried by
                color alone, not an added border. */}
            <Box
              ref={agentButtonRef}
              onClick={() => setAgentMenuOpen((v) => !v)}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.25,
                px: 1.5,
                py: 1.25,
                cursor: "pointer",
                bgcolor: isAnyAgentView ? "action.selected" : "transparent",
                "&:hover": { bgcolor: isAnyAgentView ? "action.selected" : "action.hover" },
                transition: "background-color 0.15s",
              }}
            >
              <SvgIcon sx={{ fontSize: "1.25rem", color: isAnyAgentView ? "primary.main" : "text.secondary", flexShrink: 0 }}>
                {/* Agent/robot icon */}
                <path d="M20 9V7c0-1.1-.9-2-2-2h-3c0-1.66-1.34-3-3-3S9 3.34 9 5H6c-1.1 0-2 .9-2 2v2c-1.66 0-3 1.34-3 3s1.34 3 3 3v4c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-4c1.66 0 3-1.34 3-3s-1.34-3-3-3zm-2 10H6V7h12v12zm-9-6c-.83 0-1.5-.67-1.5-1.5S8.17 10 9 10s1.5.67 1.5 1.5S9.83 13 9 13zm6 0c-.83 0-1.5-.67-1.5-1.5S14.17 10 15 10s1.5.67 1.5 1.5S15.83 13 15 13zm-5 3h4v-2h-4v2z" />
              </SvgIcon>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: isAnyAgentView ? 700 : 500, color: isAnyAgentView ? "primary.main" : "text.primary" }}>
                  Agent
                </Typography>
                {activeProject && (
                  <Typography variant="caption" sx={{ color: "text.secondary", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {activeProject.name}
                  </Typography>
                )}
              </Box>
              <SvgIcon sx={{ fontSize: "1rem", color: "text.disabled", flexShrink: 0, transform: agentMenuOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
                <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
              </SvgIcon>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Agent dropdown Menu */}
      <Menu
        anchorEl={agentButtonRef.current}
        open={agentMenuOpen}
        onClose={() => setAgentMenuOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        transformOrigin={{ vertical: "bottom", horizontal: "left" }}
        slotProps={{ paper: { sx: { minWidth: 260, borderRadius: 1.5, mb: 1 } } }}
      >
        <Box sx={{ px: 2, py: 1, pb: 0.5 }}>
          <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, fontSize: "0.62rem" }}>
            Agents
          </Typography>
        </Box>
        {PROJECTS.map((p) => (
          <MenuItem
            key={p.id}
            selected={p.id === activeProjectId}
            onClick={() => { navigate({ name: "agent", projectId: p.id }); setAgentMenuOpen(false); }}
            sx={{ borderRadius: 1, mx: 0.5, my: 0.25, minHeight: 0 }}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              <SvgIcon sx={{ fontSize: "1.1rem", color: p.id === activeProjectId ? "primary.main" : "text.secondary" }}>
                {projectIcon(p.type)}
              </SvgIcon>
            </ListItemIcon>
            <ListItemText
              primary={p.name}
              slotProps={{ primary: { variant: "body2", noWrap: true, sx: { fontWeight: p.id === activeProjectId ? 700 : 400 } } }}
            />
          </MenuItem>
        ))}
        <Divider sx={{ my: 0.5 }} />
        <MenuItem
          onClick={() => { navigate({ name: "add-agent" }); setAgentMenuOpen(false); }}
          sx={{ borderRadius: 1, mx: 0.5, my: 0.25, minHeight: 0 }}
        >
          <ListItemIcon sx={{ minWidth: 32 }}>
            <SvgIcon sx={{ fontSize: "1.1rem", color: "text.secondary" }}>
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </SvgIcon>
          </ListItemIcon>
          <ListItemText primary="Add agent" slotProps={{ primary: { variant: "body2" } }} />
        </MenuItem>
        <MenuItem
          onClick={() => { navigate({ name: "demo-gallery" }); setAgentMenuOpen(false); }}
          sx={{ borderRadius: 1, mx: 0.5, my: 0.25, minHeight: 0 }}
        >
          <ListItemIcon sx={{ minWidth: 32 }}>
            <SvgIcon sx={{ fontSize: "1.1rem", color: "text.secondary" }}>
              <path d="M8 5v14l11-7z" />
            </SvgIcon>
          </ListItemIcon>
          <ListItemText primary="Try a demo agent" slotProps={{ primary: { variant: "body2" } }} />
        </MenuItem>
      </Menu>

      {/* Main area */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Topbar - 56px to match the real TopBar's height */}
        <Box
          sx={{
            height: 56,
            px: 2,
            display: "flex",
            alignItems: "center",
            bgcolor: "background.paper",
            borderBottom: "1px solid",
            borderColor: "divider",
            flexShrink: 0,
            gap: 2,
          }}
        >
          {/* Brand */}
          <ButtonBase
            onClick={() => navigate({ name: "agents" })}
            sx={{ borderRadius: 1, px: 0.75, py: 0.25, flexShrink: 0 }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: "text.primary",
                mr: 0.75,
              }}
            >
              AgentScore
            </Typography>
            <Typography
              variant="caption"
              sx={{
                px: 0.6,
                py: 0.1,
                borderRadius: 0.5,
                bgcolor: "action.selected",
                color: "primary.main",
                fontWeight: 700,
                fontSize: "0.6rem",
                letterSpacing: "0.04em",
              }}
            >
              beta
            </Typography>
          </ButtonBase>

          {/* Tenant switcher */}
          <Select
            size="small"
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            title="Switch tenant"
            sx={{
              flexShrink: 0,
              fontSize: "0.78rem",
              height: 30,
              "& .MuiSelect-select": { py: 0.4, px: 1 },
            }}
          >
            {TENANTS.map((t) => (
              <MenuItem key={t.id} value={t.id} sx={{ fontSize: "0.8rem" }}>
                {t.name}
              </MenuItem>
            ))}
          </Select>

          {/* Breadcrumbs */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flex: 1 }}>
            {breadcrumbs.map((crumb, i) => (
              <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                {i > 0 && (
                  <Typography variant="body2" sx={{ color: "text.disabled", mx: 0.25 }}>
                    /
                  </Typography>
                )}
                {crumb.onClick ? (
                  <ButtonBase
                    onClick={crumb.onClick}
                    sx={{
                      typography: "body2",
                      color: "text.secondary",
                      borderRadius: 0.5,
                      px: 0.5,
                      "&:hover": { color: "text.primary" },
                    }}
                  >
                    {crumb.label}
                  </ButtonBase>
                ) : (
                  <Typography variant="body2" sx={{ color: "text.primary", fontWeight: 500, px: 0.5 }}>
                    {crumb.label}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>

          {/* Preview-as demo control - a presenter aid, not a real account setting. Kept visually
              distinct (dashed border, "DEMO" tag) from the real dark/light toggle below. */}
          <Tooltip title="Demo control - preview the sidebar as an admin or a regular user. Not a real account setting.">
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                flexShrink: 0,
                border: "1px dashed",
                borderColor: "warning.main",
                borderRadius: 1.5,
                px: 0.5,
                py: 0.25,
              }}
            >
              <Typography
                variant="caption"
                sx={{ fontSize: "0.58rem", fontWeight: 700, color: "warning.main", letterSpacing: "0.06em", px: 0.25 }}
              >
                DEMO
              </Typography>
              <Box sx={{ display: "flex", border: "1px solid", borderColor: "divider", borderRadius: 1, overflow: "hidden" }}>
                {(["admin", "member"] as const).map((r) => (
                  <ButtonBase
                    key={r}
                    onClick={() => setPreviewRole(r)}
                    sx={{
                      py: 0.3, px: 1, fontSize: "0.68rem", textTransform: "capitalize", minWidth: 0,
                      fontWeight: previewRole === r ? 700 : 400,
                      bgcolor: previewRole === r ? "warning.main" : "transparent",
                      color: previewRole === r ? "warning.contrastText" : "text.secondary",
                    }}
                  >
                    Preview as {r}
                  </ButtonBase>
                ))}
              </Box>
            </Box>
          </Tooltip>

          {/* Mode toggle */}
          <IconButton
            size="small"
            onClick={() => setMode(isDark ? "light" : "dark")}
            sx={{ color: "text.secondary", flexShrink: 0 }}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            <SvgIcon fontSize="small">
              {isDark ? (
                <path d="M12 7a5 5 0 1 0 0 10A5 5 0 0 0 12 7zm0-5a1 1 0 0 1 1 1v1a1 1 0 0 1-2 0V3a1 1 0 0 1 1-1zm0 17a1 1 0 0 1 1 1v1a1 1 0 0 1-2 0v-1a1 1 0 0 1 1-1zm9-9h1a1 1 0 0 1 0 2h-1a1 1 0 0 1 0-2zM3 11H2a1 1 0 0 0 0 2h1a1 1 0 0 0 0-2zm14.66-6.07.71-.71a1 1 0 0 1 1.41 1.41l-.71.71a1 1 0 0 1-1.41-1.41zm-12.73 12.73-.71.71a1 1 0 1 1-1.41-1.41l.71-.71a1 1 0 0 1 1.41 1.41zm12.02.71.71.71a1 1 0 0 1-1.41 1.41l-.71-.71a1 1 0 0 1 1.41-1.41zM4.93 6.34l-.71-.71A1 1 0 0 1 5.63 4.22l.71.71a1 1 0 0 1-1.41 1.41z" />
              ) : (
                <path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z" />
              )}
            </SvgIcon>
          </IconButton>
        </Box>

        {/* Content - same surface token as the sidebar (aura.navigationBackground); the
            real back office delineates content with card borders/elevation, not a
            canvas tint, per its SidebarShell comment. */}
        <Box sx={{ flex: 1, overflow: "auto", bgcolor: "aura.navigationBackground" }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}

function buildBreadcrumbs(view: View): { label: string; onClick?: () => void }[] {
  switch (view.name) {
    case "home":
      return [{ label: "Home" }];
    case "agents":
      return [{ label: "My Agents" }];
    case "agent": {
      const agentName = PROJECTS.find((p) => p.id === view.projectId)?.name ?? "Agent";
      return [{ label: "My Agents" }, { label: agentName }];
    }
    case "agent-run":
      return [{ label: "My Agents" }, { label: "Agent" }, { label: "Run" }];
    case "session":
      return [{ label: "My Agents" }, { label: "Agent" }, { label: "Run" }, { label: "Session" }];
    case "score-breakdown":
      return [{ label: "My Agents" }, { label: "Agent" }, { label: "Score Breakdown" }];
    case "eval-design":
      return [{ label: "My Agents" }, { label: "Agent" }, { label: "Evaluation Design" }];
    case "metrics":
      return [{ label: "Metrics" }];
    case "llm-judges":
      return [{ label: "LLM Judges" }];
    case "add-judge":
      return [{ label: "LLM Judges" }, { label: "Add Judge" }];
    case "integrations":
      return [{ label: "Integrations" }];
    case "compare-runs":
      return [{ label: "My Agents" }, { label: "Agent" }, { label: "Compare Runs" }];
    case "add-agent":
      return [{ label: "My Agents" }, { label: "Add Agent" }];
    case "profiles":
      return [{ label: "Profiles" }];
    case "profile":
      return [{ label: "Profiles" }, { label: "Profile" }];
    case "add-profile":
      return [{ label: "Profiles" }, { label: "New Profile" }];
    case "dimensions":
      return [{ label: "Dimensions" }];
    case "demo-gallery":
      return [{ label: "Try a demo agent" }];
    case "getting-started":
      return [{ label: "Getting Started" }];
    case "chat-scoring": {
      const agentName = PROJECTS.find((p) => p.id === view.projectId)?.name ?? "Agent";
      return [{ label: "My Agents" }, { label: agentName }, { label: "Chat Setup" }];
    }
    case "tenants":
      return [{ label: "Tenants" }];
    case "users":
      return view.tab === "requests" ? [{ label: "Users" }, { label: "Access requests" }] : [{ label: "Users" }];
    case "add-user":
      return [{ label: "Users" }, { label: "Access requests" }, { label: "New user" }];
    case "agent-registry":
      return [{ label: "Agent Registry" }];
    case "registry-slot":
      return [{ label: "Agent Registry" }, { label: view.slotSlug }];
    case "registry-version":
      return [{ label: "Agent Registry" }, { label: view.slotSlug }, { label: `#${view.versionId}` }];
    case "registry-version-new":
      return [{ label: "Agent Registry" }, { label: view.slotSlug }, { label: "New version" }];
    case "reports":
      return [{ label: "Reports" }];
    case "tenant-usage": {
      const tenantName = TENANTS.find((t) => t.id === view.tenantId)?.name ?? view.tenantId;
      return [{ label: "Reports" }, { label: tenantName }];
    }
    case "llm-catalog":
      return [{ label: "LLM Catalog" }];
  }
}
