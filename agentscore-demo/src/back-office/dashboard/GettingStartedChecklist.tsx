/** "Get started" card — shown on Home only in the demo-mode "blank / new
 * login" state (`useDemoMode`), where the rest of the dashboard is zeroed
 * out and otherwise gives a brand-new viewer nothing to do. Each step links
 * straight to where the action happens. The checkbox is self-reported, not
 * derived from real state (there's no backend to track it against) — it's
 * there so a presenter can visibly mark steps off while walking through the
 * demo, not as a claim that the step was actually completed.
 */

import { useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Checkbox from "@mui/material/Checkbox";
import IconMaterialSymbolsGroup from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsGroup.mjs";
import IconMaterialSymbolsScience from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsScience.mjs";
import IconMaterialSymbolsSmartToy from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsSmartToy.mjs";
import IconMaterialSymbolsVisibility from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsVisibility.mjs";
import type SvgIcon from "@mui/material/SvgIcon";

import { SAMPLE_AGENT_ID, SAMPLE_TENANT_ID } from "@/back-office/agents/fake-data";
import type { DemoRole } from "@/shared/demo-mode/demo-mode-context";

interface Step {
  id: string;
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
      id: "explore-sample",
      icon: IconMaterialSymbolsVisibility,
      title: "Explore the sample agent",
      description: "See a fully scored agent — profile fit, runs, and evals — before connecting your own.",
      cta: "View sample agent",
      to: "/tenants/$tenantId/agents/$agentId",
      params: { tenantId: SAMPLE_TENANT_ID, agentId: SAMPLE_AGENT_ID },
    },
    {
      id: "connect-agent",
      icon: IconMaterialSymbolsSmartToy,
      title: "Connect your first agent",
      description: "Point your agent's traces at AgentScore to start collecting evidence for a real score.",
      cta: "Go to My Agents",
      to: "/agents",
      search: { view: "list", by: "tenant" },
    },
    {
      id: "browse-evals",
      icon: IconMaterialSymbolsScience,
      title: "Browse the Evals Catalog",
      description: "See what AgentScore checks for out of the box, by dimension.",
      cta: "Open Evals Catalog",
      to: "/evals/catalog/evals",
    },
  ];
  if (role === "admin") {
    steps.push({
      id: "invite-team",
      icon: IconMaterialSymbolsGroup,
      title: "Invite your team",
      description: "Add teammates so more than one person can review scores and manage agents.",
      cta: "Go to Users",
      to: "/users",
    });
  }
  return steps;
}

function StepRow({
  step,
  checked,
  onToggle,
}: {
  step: Step;
  checked: boolean;
  onToggle: () => void;
}) {
  const navigate = useNavigate();
  const Icon = step.icon;
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        py: 1.5,
        borderBottom: 1,
        borderColor: "divider",
        "&:last-of-type": { borderBottom: "none" },
      }}
    >
      <Checkbox
        checked={checked}
        onChange={onToggle}
        size="small"
        sx={{ flexShrink: 0 }}
        inputProps={{ "aria-label": `Mark "${step.title}" as done` }}
      />
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
          opacity: checked ? 0.5 : 1,
        }}
      >
        <Icon sx={{ fontSize: 18, color: "text.secondary" }} />
      </Box>
      <Box sx={{ minWidth: 0, flex: 1, opacity: checked ? 0.5 : 1 }}>
        <Box
          sx={{
            typography: "body2",
            fontWeight: 600,
            textDecoration: checked ? "line-through" : "none",
          }}
        >
          {step.title}
        </Box>
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
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  return (
    <Card data-tour="getting-started">
      <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
        <Box sx={{ px: 2.5, py: 1.5 }}>
          <Box sx={{ typography: "body2", fontWeight: 600 }}>Get started</Box>
          <Box sx={{ typography: "caption", color: "text.secondary" }}>
            A few first steps to get value out of AgentScore quickly.
          </Box>
        </Box>
        <Box sx={{ px: 2.5, pb: 1 }}>
          {steps.map((step) => (
            <StepRow
              key={step.id}
              step={step}
              checked={checked[step.id] ?? false}
              onToggle={() => setChecked((prev) => ({ ...prev, [step.id]: !prev[step.id] }))}
            />
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}
