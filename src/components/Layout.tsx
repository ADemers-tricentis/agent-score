import type { ReactNode, ReactElement } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ButtonBase from "@mui/material/ButtonBase";
import { useTheme } from "@mui/material/styles";
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
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const borderColor = isDark ? "#222640" : theme.palette.divider;
  const surfaceBg = isDark ? "#131626" : theme.palette.background.paper;

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
    { id: "div-projects", variant: "divider" as const },
    ...PROJECTS.map((p) => ({
      id: p.id,
      text: p.name,
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
      <NavRail items={navItems} isChangeSelectedDisabled />

      {/* Main area */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Topbar */}
        <Box
          sx={{
            height: 48,
            px: 2,
            display: "flex",
            alignItems: "center",
            bgcolor: surfaceBg,
            borderBottom: `1px solid ${borderColor}`,
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
                color: isDark ? "#e2e8f0" : "text.primary",
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
                bgcolor: isDark ? "#1a1b3a" : "primary.light",
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
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
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
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, overflow: "auto", bgcolor: isDark ? "#0d0f1a" : "background.default" }}>
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
  }
}
