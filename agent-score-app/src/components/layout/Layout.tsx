import type { ReactNode } from "react";
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
import { useColorScheme } from "@mui/material/styles";
import NavRail from "@tricentis/aura/components/NavRail.js";
import IconAgentCloudOutlined from "@tricentis/aura/components/IconAgentCloudOutlined.js";
import IconAgentTeamOutlined from "@tricentis/aura/components/IconAgentTeamOutlined.js";
import IconAgentSimOutlined from "@tricentis/aura/components/IconAgentSimOutlined.js";
import IconAgentPersonalOutlined from "@tricentis/aura/components/IconAgentPersonalOutlined.js";
import IconDeveloperModeOutlined from "@tricentis/aura/components/IconDeveloperModeOutlined.js";
import IconDistributionConstantOutlined from "@tricentis/aura/components/IconDistributionConstantOutlined.js";
import type { View } from "../../view";
import type { AgentType } from "../../types";
import { useAgents } from "../../data/useAgents";

function HomeIcon() {
  return (
    <SvgIcon>
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
    </SvgIcon>
  );
}

function agentTypeIcon(type: AgentType) {
  switch (type) {
    case "ATA":
      return <IconAgentCloudOutlined />;
    case "ATC":
      return <IconAgentTeamOutlined />;
    case "CURA":
      return <IconAgentSimOutlined />;
    case "AI_WORKSPACE":
      return <IconAgentPersonalOutlined />;
    case "CODING":
      return <IconDeveloperModeOutlined />;
    case "APT":
      return <IconDistributionConstantOutlined />;
  }
}

export default function Layout({ view, navigate, children }: { view: View; navigate: (v: View) => void; children: ReactNode }) {
  const { mode, setMode } = useColorScheme();
  const isDark = (mode ?? "dark") === "dark";
  const agents = useAgents();
  const [agentMenuOpen, setAgentMenuOpen] = useState(false);
  const agentButtonRef = useRef<HTMLDivElement>(null);

  const AGENT_SCOPED_VIEWS = ["agent-overview", "run-detail", "session-detail"] as const;
  const isAgentView = (AGENT_SCOPED_VIEWS as readonly string[]).includes(view.name);
  const activeAgent = "agentId" in view ? agents.find((a) => a.agent_id === view.agentId) : undefined;

  const breadcrumbs = ((): { label: string; onClick?: () => void }[] => {
    const home = { label: "Home", onClick: () => navigate({ name: "home" }) };
    switch (view.name) {
      case "home":
        return [{ label: "Home" }];
      case "add-agent":
        return [home, { label: "Add Agent" }];
      case "agent-overview":
        return [home, { label: activeAgent?.name ?? "Agent" }];
      case "run-detail":
        return [
          home,
          { label: activeAgent?.name ?? "Agent", onClick: () => navigate({ name: "agent-overview", agentId: view.agentId, tab: "scoring" }) },
          { label: "Run" },
        ];
      case "session-detail":
        return [
          home,
          { label: activeAgent?.name ?? "Agent", onClick: () => navigate({ name: "agent-overview", agentId: view.agentId, tab: "scoring" }) },
          { label: "Run", onClick: () => navigate({ name: "run-detail", agentId: view.agentId, runId: view.runId }) },
          { label: "Session" },
        ];
    }
  })();

  const navItems = [
    {
      id: "home",
      text: "Home",
      icon: <HomeIcon />,
      selected: view.name === "home",
      onClick: () => navigate({ name: "home" }),
    },
  ];

  return (
    <Box sx={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* Sidebar */}
      <Box sx={{ width: 240, flexShrink: 0, display: "flex", flexDirection: "column", borderRight: "1px solid", borderColor: "divider", bgcolor: "background.paper", overflow: "hidden" }}>
        <Box sx={{ flex: 1, overflow: "hidden", position: "relative" }}>
          <NavRail items={navItems} isChangeSelectedDisabled open width={240} />

          {/* Current-agent indicator, overlaid at the bottom of the nav area.
              NavRail's internal Drawer paper is `position: fixed` with
              `z-index: theme.zIndex.drawer` (1200), which otherwise paints
              over this sibling regardless of DOM order — needs an explicit
              higher z-index to actually be visible/clickable. */}
          <Box sx={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: (t) => t.zIndex.drawer + 1, borderTop: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
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
                borderLeft: isAgentView ? "3px solid" : "3px solid transparent",
                borderLeftColor: isAgentView ? "primary.main" : "transparent",
                bgcolor: isAgentView ? "action.selected" : "transparent",
                "&:hover": { bgcolor: "action.hover" },
                transition: "background-color 0.15s",
              }}
            >
              <SvgIcon sx={{ fontSize: "1.25rem", color: isAgentView ? "primary.main" : "text.secondary", flexShrink: 0 }}>
                <path d="M20 9V7c0-1.1-.9-2-2-2h-3c0-1.66-1.34-3-3-3S9 3.34 9 5H6c-1.1 0-2 .9-2 2v2c-1.66 0-3 1.34-3 3s1.34 3 3 3v4c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-4c1.66 0 3-1.34 3-3s-1.34-3-3-3zm-2 10H6V7h12v12zm-9-6c-.83 0-1.5-.67-1.5-1.5S8.17 10 9 10s1.5.67 1.5 1.5S9.83 13 9 13zm6 0c-.83 0-1.5-.67-1.5-1.5S14.17 10 15 10s1.5.67 1.5 1.5S15.83 13 15 13zm-5 3h4v-2h-4v2z" />
              </SvgIcon>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: isAgentView ? 700 : 500, color: isAgentView ? "primary.main" : "text.primary" }}>
                  Agent
                </Typography>
                {activeAgent && (
                  <Typography variant="caption" sx={{ color: "text.secondary", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {activeAgent.name}
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

      {/* Agent switcher menu */}
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
        {agents.map((a) => (
          <MenuItem
            key={a.agent_id}
            selected={a.agent_id === activeAgent?.agent_id}
            onClick={() => {
              navigate({ name: "agent-overview", agentId: a.agent_id });
              setAgentMenuOpen(false);
            }}
            sx={{ borderRadius: 1, mx: 0.5, my: 0.25, minHeight: 0 }}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              <SvgIcon sx={{ fontSize: "1.1rem", color: a.agent_id === activeAgent?.agent_id ? "primary.main" : "text.secondary" }}>
                {agentTypeIcon(a.agentType)}
              </SvgIcon>
            </ListItemIcon>
            <ListItemText primary={a.name} slotProps={{ primary: { variant: "body2", noWrap: true, sx: { fontWeight: a.agent_id === activeAgent?.agent_id ? 700 : 400 } } }} />
          </MenuItem>
        ))}
      </Menu>

      {/* Main area */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Topbar */}
        <Box sx={{ height: 48, px: 2, display: "flex", alignItems: "center", bgcolor: "background.paper", borderBottom: "1px solid", borderColor: "divider", flexShrink: 0, gap: 2 }}>
          <ButtonBase onClick={() => navigate({ name: "home" })} sx={{ borderRadius: 1, px: 0.75, py: 0.25, flexShrink: 0 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, letterSpacing: "-0.02em", color: "text.primary", mr: 0.75 }}>
              AgentScore
            </Typography>
            <Typography
              variant="caption"
              sx={{ px: 0.6, py: 0.1, borderRadius: 0.5, bgcolor: "action.selected", color: "primary.main", fontWeight: 700, fontSize: "0.6rem", letterSpacing: "0.04em" }}
            >
              beta
            </Typography>
          </ButtonBase>

          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flex: 1 }}>
            {breadcrumbs.map((crumb, i) => (
              <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                {i > 0 && (
                  <Typography variant="body2" sx={{ color: "text.disabled", mx: 0.25 }}>
                    /
                  </Typography>
                )}
                {crumb.onClick ? (
                  <ButtonBase onClick={crumb.onClick} sx={{ typography: "body2", color: "text.secondary", borderRadius: 0.5, px: 0.5, "&:hover": { color: "text.primary" } }}>
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

          <IconButton size="small" onClick={() => setMode(isDark ? "light" : "dark")} sx={{ color: "text.secondary", flexShrink: 0 }} title={isDark ? "Switch to light mode" : "Switch to dark mode"}>
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
        <Box sx={{ flex: 1, overflow: "auto", bgcolor: "background.default" }}>{children}</Box>
      </Box>
    </Box>
  );
}
