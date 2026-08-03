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
import { useColorScheme } from "@mui/material/styles";
import NavRail from "@tricentis/aura/components/NavRail.js";
import IconAgentsOutlined from "@tricentis/aura/components/IconAgentsOutlined.js";
import IconRunPrivatelyOutlined from "@tricentis/aura/components/IconRunPrivatelyOutlined.js";
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
import type { View, ProjectType } from "../types";
import { PROJECTS } from "../data/mock";

interface Props {
  view: View;
  navigate: (v: View) => void;
  children: ReactNode;
}

function HomeIcon() {
  return <SvgIcon><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" /></SvgIcon>;
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

export default function Layout({ view, navigate, children }: Props) {
  const { mode, setMode } = useColorScheme();
  const isDark = (mode ?? "dark") === "dark";
  const [agentMenuOpen, setAgentMenuOpen] = useState(false);
  const agentButtonRef = useRef<HTMLDivElement>(null);

  const breadcrumbs = buildBreadcrumbs(view);

  const isAnyAgentView = ["agent-detail", "project", "run", "session", "compare-runs", "eval-design", "agent-settings"].includes(view.name);
  const activeProjectId = "projectId" in view ? view.projectId : null;
  const activeProject = PROJECTS.find((p) => p.id === activeProjectId);

  const advancedViewNames = ["guard-log", "metrics", "llm-judges", "add-judge", "dimensions", "profiles", "profile", "add-profile"];
  const isAdvancedView = advancedViewNames.includes(view.name);

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
      text: "Agents",
      icon: <IconAgentsOutlined />,
      selected: view.name === "agents" || view.name === "add-agent",
      onClick: () => navigate({ name: "agents" }),
    },
    {
      id: "integrations",
      text: "Integrations",
      icon: <IconConnectionOutlined />,
      selected: view.name === "integrations",
      onClick: () => navigate({ name: "integrations" }),
    },
    {
      id: "advanced",
      text: "Advanced",
      icon: <IconDeveloperModeOutlined />,
      tooltipText: "Developer settings - judges, guard rules, and raw metrics",
      selected: isAdvancedView,
      items: [
        {
          id: "guard-log",
          text: "Guard Log",
          icon: <IconRunPrivatelyOutlined />,
          selected: view.name === "guard-log",
          onClick: () => navigate({ name: "guard-log" }),
        },
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
  ];

  return (
    <Box sx={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* Sidebar */}
      <Box sx={{ width: 280, flexShrink: 0, display: "flex", flexDirection: "column", borderRight: "1px solid", borderColor: "divider", bgcolor: "background.paper", overflow: "hidden" }}>
        {/* NavRail for top items - we clip it to hide its border since we add our own */}
        <Box sx={{ flex: 1, overflow: "hidden", position: "relative" }}>
          <NavRail items={navItems} isChangeSelectedDisabled open width={280} />

          {/* Agent section - overlaid at the bottom of the nav area */}
          <Box
            sx={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              borderTop: "1px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
            }}
          >
            {/* Agent nav item */}
            <Box
              ref={agentButtonRef}
              onClick={() => setAgentMenuOpen((v) => !v)}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                px: 2,
                py: 1.5,
                cursor: "pointer",
                borderLeft: isAnyAgentView ? "3px solid" : "3px solid transparent",
                borderLeftColor: isAnyAgentView ? "primary.main" : "transparent",
                bgcolor: isAnyAgentView ? "action.selected" : "transparent",
                "&:hover": { bgcolor: "action.hover" },
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
            onClick={() => { navigate({ name: "project", projectId: p.id }); setAgentMenuOpen(false); }}
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
      </Menu>

      {/* Main area */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Topbar */}
        <Box
          sx={{
            height: 48,
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

        {/* Content */}
        <Box sx={{ flex: 1, overflow: "auto", bgcolor: "background.default" }}>
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
      return [{ label: "Agents" }];
    case "agent-detail": {
      const agentName = PROJECTS.find((p) => p.id === view.projectId)?.name ?? "Agent";
      return [{ label: "Agents" }, { label: agentName }];
    }
    case "project": {
      const agentName = PROJECTS.find((p) => p.id === view.projectId)?.name ?? "Agent";
      return [{ label: "Agents" }, { label: agentName }];
    }
    case "agent-settings":
      return [{ label: "Agents" }, { label: "Agent" }, { label: "Settings" }];
    case "run":
      return [{ label: "Agents" }, { label: "Agent" }, { label: "Run" }];
    case "session":
      return [{ label: "Agents" }, { label: "Agent" }, { label: "Run" }, { label: "Session" }];
    case "score-breakdown":
      return [{ label: "Agents" }, { label: "Agent" }, { label: "Score Breakdown" }];
    case "eval-design":
      return [{ label: "Agents" }, { label: "Agent" }, { label: "Evaluation Design" }];
    case "guard-log":
      return [{ label: "Guard Log" }];
    case "metrics":
      return [{ label: "Metrics" }];
    case "llm-judges":
      return [{ label: "LLM Judges" }];
    case "add-judge":
      return [{ label: "LLM Judges" }, { label: "Add Judge" }];
    case "integrations":
      return [{ label: "Integrations" }];
    case "compare-runs":
      return [{ label: "Agents" }, { label: "Agent" }, { label: "Compare Runs" }];
    case "add-agent":
      return [{ label: "Agents" }, { label: "Add Agent" }];
    case "profiles":
      return [{ label: "Profiles" }];
    case "profile":
      return [{ label: "Profiles" }, { label: "Profile" }];
    case "add-profile":
      return [{ label: "Profiles" }, { label: "New Profile" }];
    case "dimensions":
      return [{ label: "Dimensions" }];
  }
}
