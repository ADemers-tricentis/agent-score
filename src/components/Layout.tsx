import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import ButtonBase from "@mui/material/ButtonBase";
import Chip from "@mui/material/Chip";
import { useTheme } from "@mui/material/styles";
import type { View } from "../types";
import { PROJECTS } from "../data/mock";

const SIDEBAR_W = 220;

interface Props {
  view: View;
  navigate: (v: View) => void;
  children: ReactNode;
}

export default function Layout({ view, navigate, children }: Props) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const surfaceBg = isDark ? "#131626" : theme.palette.background.paper;
  const borderColor = isDark ? "#222640" : theme.palette.divider;

  const navItemStyle = (active: boolean) => ({
    display: "flex",
    alignItems: "center",
    width: "100%",
    px: 1.5,
    py: 0.75,
    borderRadius: 1,
    mb: 0.25,
    bgcolor: active ? (isDark ? "#1a1b3a" : "action.selected") : "transparent",
    color: active ? "primary.main" : "text.secondary",
    typography: "body2",
    fontWeight: active ? 600 : 400,
    "&:hover": {
      bgcolor: isDark ? "#1a1b3a" : "action.hover",
      color: "text.primary",
    },
    transition: "all 0.15s",
    textAlign: "left" as const,
  });

  const breadcrumbs = buildBreadcrumbs(view);

  return (
    <Box sx={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* Sidebar */}
      <Box
        component="nav"
        sx={{
          width: SIDEBAR_W,
          flexShrink: 0,
          bgcolor: surfaceBg,
          borderRight: `1px solid ${borderColor}`,
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
        }}
      >
        {/* Logo */}
        <Box sx={{ px: 2, pt: 2.5, pb: 2 }}>
          <ButtonBase onClick={() => navigate({ name: "fleet" })} sx={{ borderRadius: 1 }}>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: isDark ? "#e2e8f0" : "text.primary",
              }}
            >
              AgentScore
            </Typography>
            <Chip
              label="beta"
              size="small"
              sx={{
                ml: 1,
                height: 18,
                fontSize: "0.65rem",
                bgcolor: isDark ? "#1a1b3a" : "primary.light",
                color: "primary.main",
                fontWeight: 600,
              }}
            />
          </ButtonBase>
        </Box>

        <Divider sx={{ borderColor }} />

        {/* Main nav */}
        <Box sx={{ px: 1.5, pt: 1.5 }}>
          <Typography
            variant="caption"
            sx={{ px: 0.5, pb: 0.75, display: "block", color: "text.disabled", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}
          >
            Overview
          </Typography>
          <ButtonBase sx={navItemStyle(view.name === "fleet")} onClick={() => navigate({ name: "fleet" })}>
            Fleet
          </ButtonBase>
          <ButtonBase sx={navItemStyle(view.name === "guard-log")} onClick={() => navigate({ name: "guard-log" })}>
            Guard Log
          </ButtonBase>
          <ButtonBase sx={navItemStyle(view.name === "metrics")} onClick={() => navigate({ name: "metrics" })}>
            Metrics
          </ButtonBase>
          <ButtonBase
            sx={navItemStyle(view.name === "llm-judges" || view.name === "add-judge")}
            onClick={() => navigate({ name: "llm-judges" })}
          >
            LLM Judges
          </ButtonBase>
        </Box>

        <Box sx={{ px: 1.5, pt: 2 }}>
          <Typography
            variant="caption"
            sx={{ px: 0.5, pb: 0.75, display: "block", color: "text.disabled", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}
          >
            Projects
          </Typography>
          {PROJECTS.map((p) => {
            const active = "projectId" in view && view.projectId === p.id;
            const evalDesignActive = view.name === "eval-design" && "projectId" in view && view.projectId === p.id;
            return (
              <Box key={p.id}>
                <ButtonBase
                  sx={navItemStyle(active && view.name === "project")}
                  onClick={() => navigate({ name: "project", projectId: p.id })}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        bgcolor: reliabilityColor(p.reliability),
                        flexShrink: 0,
                      }}
                    />
                    <Typography
                      variant="body2"
                      noWrap
                      sx={{ fontWeight: active ? 600 : 400, color: "inherit", fontSize: "0.8125rem" }}
                    >
                      {p.name}
                    </Typography>
                  </Box>
                </ButtonBase>
                {active && (
                  <ButtonBase
                    sx={{
                      ...navItemStyle(evalDesignActive),
                      pl: 3.5,
                      fontSize: "0.775rem",
                    }}
                    onClick={() => navigate({ name: "eval-design", projectId: p.id })}
                  >
                    <Typography variant="caption" sx={{ color: "inherit", fontSize: "0.775rem", fontWeight: evalDesignActive ? 600 : 400 }}>
                      Evaluation Design
                    </Typography>
                  </ButtonBase>
                )}
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Main area */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Topbar */}
        <Box
          sx={{
            height: 48,
            px: 3,
            display: "flex",
            alignItems: "center",
            bgcolor: surfaceBg,
            borderBottom: `1px solid ${borderColor}`,
            flexShrink: 0,
          }}
        >
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

function reliabilityColor(r: string) {
  if (r === "RELIABLE") return "success.main";
  if (r === "NEEDS_WORK") return "warning.main";
  return "error.main";
}

function buildBreadcrumbs(view: View): { label: string; onClick?: () => void }[] {
  // This is a simplified version — the views handle click logic via navigate prop
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
