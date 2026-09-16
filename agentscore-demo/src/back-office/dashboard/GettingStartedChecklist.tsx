/** "Get started" card — shown on Home only in the demo-mode "blank / new
 * login" state (`useDemoMode`), where the rest of the dashboard is zeroed
 * out and otherwise gives a brand-new viewer nothing to do. Each step links
 * straight to where the action happens; there's no backend to track real
 * completion, so this is guidance, not a progress tracker — no checkboxes
 * claiming a step is "done".
 */

import type { ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import IconMaterialSymbolsGroup from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsGroup.mjs";
import IconMaterialSymbolsScience from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsScience.mjs";
import IconMaterialSymbolsSmartToy from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsSmartToy.mjs";
import IconMaterialSymbolsVisibility from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsVisibility.mjs";
import type SvgIcon from "@mui/material/SvgIcon";

import { SAMPLE_AGENT_ID, SAMPLE_TENANT_ID } from "@/back-office/agents/fake-data";
import type { DemoRole } from "@/shared/demo-mode/demo-mode-context";

interface Step {
  icon: typeof SvgIcon;
  title: string;
  description: string;
  cta: string;
  to: string;
  params?: Record<string, string>;
  search?: Record<string, unknown>;
}

function stepsFor(role: DemoRole): Step[] {
  const steps: Step[] = [
    {
      icon: IconMaterialSymbolsVisibility,
      title: "Explore the sample agent",
      description: "See a fully scored agent — profile fit, runs, and evals — before connecting your own.",
      cta: "View sample agent",
      to: "/tenants/$tenantId/agents/$agentId",
      params: { tenantId: SAMPLE_TENANT_ID, agentId: SAMPLE_AGENT_ID },
    },
    {
      icon: IconMaterialSymbolsSmartToy,
      title: "Connect your first agent",
      description: "Point your agent's traces at AgentScore to start collecting evidence for a real score.",
      cta: "Go to My Agents",
      to: "/agents",
      search: { view: "list", by: "tenant" },
    },
    {
      icon: IconMaterialSymbolsScience,
      title: "Browse the Evals Catalog",
      description: "See what AgentScore checks for out of the box, by dimension.",
      cta: "Open Evals Catalog",
      to: "/evals/catalog/evals",
    },
  ];
  if (role === "admin") {
    steps.push({
      icon: IconMaterialSymbolsGroup,
      title: "Invite your team",
      description: "Add teammates so more than one person can review scores and manage agents.",
      cta: "Go to Users",
      to: "/users",
    });
  }
  return steps;
}

function StepRow({ step }: { step: Step }) {
  const navigate = useNavigate();
  const Icon = step.icon;
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        py: 1.5,
        borderBottom: 1,
        borderColor: "divider",
        "&:last-of-type": { borderBottom: "none" },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 36,
          height: 36,
          borderRadius: "50%",
          bgcolor: "action.hover",
          flexShrink: 0,
        }}
      >
        <Icon sx={{ fontSize: 18, color: "text.secondary" }} />
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Box sx={{ typography: "body2", fontWeight: 600 }}>{step.title}</Box>
        <Box sx={{ typography: "caption", color: "text.secondary" }}>{step.description}</Box>
      </Box>
      <Button
        variant="outlined"
        size="small"
        sx={{ flexShrink: 0 }}
        onClick={() =>
          void navigate({ to: step.to, params: step.params, search: step.search } as never)
        }
      >
        {step.cta}
      </Button>
    </Box>
  );
}

export function GettingStartedChecklist({ role }: { role: DemoRole }): ReactNode {
  const steps = stepsFor(role);
  return (
    <Card>
      <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
        <Box sx={{ px: 2.5, py: 1.5 }}>
          <Box sx={{ typography: "body2", fontWeight: 600 }}>Get started</Box>
          <Box sx={{ typography: "caption", color: "text.secondary" }}>
            A few first steps to get value out of AgentScore quickly.
          </Box>
        </Box>
        <Box sx={{ px: 2.5, pb: 1 }}>
          {steps.map((step) => (
            <StepRow key={step.title} step={step} />
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}
