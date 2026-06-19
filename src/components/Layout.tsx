import type { ReactNode, ReactElement } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ButtonBase from "@mui/material/ButtonBase";
import IconButton from "@mui/material/IconButton";
import SvgIcon from "@mui/material/SvgIcon";
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
import type { View, ProjectType } from "../types";
import { PROJECTS } from "../data/mock";

interface Props {
  view: View;
  navigate: (v: View) => void;
  children: ReactNode;
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

  const breadcrumbs = buildBreadcrumbs(view);

  const isProjectActive = (id: string) =>
    "projectId" in view && view.projectId === id;

  const navItems = [
    {
      id: "fleet",
      text: "Fleet",
      icon: <IconAgentsOutlined />,
      selected: view.name === "fleet",
      onClick: () => navigate({ name: "fleet" }),
    },
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
      id: "profiles",
      text: "Profiles",
      icon: <IconFileTableAdvancedOutlined />,
      selected: view.name === "profiles" || view.name === "profile",
      onClick: () => navigate({ name: "profiles" }),
    },
    {
      id: "integrations",
      text: "Integrations",
      icon: <IconConnectionOutlined />,
      selected: view.name === "integrations",
      onClick: () => navigate({ name: "integrations" }),
    },
    { id: "div-projects", variant: "divider" as const },
    ...PROJECTS.map((p) => ({
      id: p.id,
      text: p.name.length > 22 ? p.name.slice(0, 21) + "…" : p.name,
      tooltipText: p.name,
      icon: projectIcon(p.type),
      selected: isProjectActive(p.id) && view.name === "project",
      onClick: () => navigate({ name: "project", projectId: p.id }),
      items: [
        {
          id: `eval-${p.id}`,
          text: "Evaluation Design",
          selected:
            view.name === "eval-design" &&
            "projectId" in view &&
            view.projectId === p.id,
          onClick: () => navigate({ name: "eval-design", projectId: p.id }),
        },
      ],
    })),
  ];

  return (
    <Box sx={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <NavRail items={navItems} isChangeSelectedDisabled open width={280} />

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
            onClick={() => navigate({ name: "fleet" })}
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
                /* Sun */
                <path d="M12 7a5 5 0 1 0 0 10A5 5 0 0 0 12 7zm0-5a1 1 0 0 1 1 1v1a1 1 0 0 1-2 0V3a1 1 0 0 1 1-1zm0 17a1 1 0 0 1 1 1v1a1 1 0 0 1-2 0v-1a1 1 0 0 1 1-1zm9-9h1a1 1 0 0 1 0 2h-1a1 1 0 0 1 0-2zM3 11H2a1 1 0 0 0 0 2h1a1 1 0 0 0 0-2zm14.66-6.07.71-.71a1 1 0 0 1 1.41 1.41l-.71.71a1 1 0 0 1-1.41-1.41zm-12.73 12.73-.71.71a1 1 0 1 1-1.41-1.41l.71-.71a1 1 0 0 1 1.41 1.41zm12.02.71.71.71a1 1 0 0 1-1.41 1.41l-.71-.71a1 1 0 0 1 1.41-1.41zM4.93 6.34l-.71-.71A1 1 0 0 1 5.63 4.22l.71.71a1 1 0 0 1-1.41 1.41z" />
              ) : (
                /* Moon */
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
    case "fleet":
      return [{ label: "Fleet" }];
    case "project":
      return [{ label: "Fleet" }, { label: "Project" }];
    case "run":
      return [{ label: "Fleet" }, { label: "Project" }, { label: "Run" }];
    case "session":
      return [{ label: "Fleet" }, { label: "Project" }, { label: "Run" }, { label: "Session" }];
    case "eval-design":
      return [{ label: "Fleet" }, { label: "Project" }, { label: "Evaluation Design" }];
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
      return [{ label: "Fleet" }, { label: "Project" }, { label: "Compare Runs" }];
    case "add-agent":
      return [{ label: "Fleet" }, { label: "Add Agent" }];
    case "profiles":
      return [{ label: "Profiles" }];
    case "profile":
      return [{ label: "Profiles" }, { label: "Profile" }];
    case "add-profile":
      return [{ label: "Profiles" }, { label: "New Profile" }];
  }
}
