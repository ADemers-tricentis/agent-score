import { Fragment, useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import SvgIcon from "@mui/material/SvgIcon";
import type { RestingAgentSummary } from "../../types";
import type { View } from "../../view";
import AgentTypeTag from "../../components/shared/AgentTypeTag";

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <SvgIcon sx={{ fontSize: "1.1rem", color: "text.disabled", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>
      <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
    </SvgIcon>
  );
}

/**
 * Collapsed-by-default summary of every agent with nothing in the inbox,
 * split between "shipping cleanly" and "still onboarding" (below the
 * trace threshold) — informational only, no actions. See
 * plans/2026-08-03-agentscore-app-home-inbox.md.
 */
export default function RestingAgentsSection({ agents, navigate }: { agents: RestingAgentSummary[]; navigate: (v: View) => void }) {
  const [expanded, setExpanded] = useState(false);
  if (agents.length === 0) return null;

  return (
    <Paper sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
      <Box
        onClick={() => setExpanded((e) => !e)}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          px: 2,
          py: 1.5,
          cursor: "pointer",
          "&:hover": { bgcolor: "action.hover" },
        }}
      >
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            Everything else looks fine
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {agents.length} agent{agents.length > 1 ? "s" : ""} · nothing to review
          </Typography>
        </Box>
        <ChevronIcon open={expanded} />
      </Box>

      {expanded && (
        <Box>
          <Divider />
          {agents.map((agent, idx) => (
            <Fragment key={agent.agentId}>
              {idx > 0 && <Divider />}
              <Box
                onClick={() => navigate({ name: "agent-overview", agentId: agent.agentId })}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  px: 2,
                  py: 1.25,
                  cursor: "pointer",
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {agent.agentName}
                </Typography>
                <AgentTypeTag type={agent.agentType} />
                <Box sx={{ flex: 1 }} />
                <Typography variant="caption" sx={{ color: agent.status === "ship" ? "success.main" : "text.disabled" }}>
                  {agent.status === "ship" ? "Shipping cleanly" : `Still gathering traces (${agent.captured}/${agent.threshold})`}
                </Typography>
              </Box>
            </Fragment>
          ))}
        </Box>
      )}
    </Paper>
  );
}
