import { Fragment, useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import SvgIcon from "@mui/material/SvgIcon";
import type { SxProps, Theme } from "@mui/material/styles";
import type { Agent } from "../../types";
import type { View } from "../../view";
import GradeChip from "../../components/shared/GradeChip";
import { CompositeVerdictChip } from "../../components/shared/VerdictChip";
import AgentTypeTag from "../../components/shared/AgentTypeTag";
import DimensionScoreBar from "../../components/shared/DimensionScoreBar";
import { DIMENSION_ORDER } from "../../data/dimensionLabels";

// Ship threshold (REQ-055/056): agents below this composite score, but
// already scored (compositeScore !== null), are surfaced here. Agents with
// compositeScore === null are not yet scored/locked and are excluded rather
// than treated as needing attention.
const SHIP_THRESHOLD = 85;

const ROW_COLUMNS = "28px 2fr 90px 90px 100px";

function WarningIcon({ sx }: { sx?: SxProps<Theme> }) {
  return (
    <SvgIcon sx={sx}>
      <path d="M12 2 1 21h22L12 2zm0 4.5 7.5 13h-15L12 6.5zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z" />
    </SvgIcon>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <SvgIcon sx={{ fontSize: "1.1rem", color: "text.disabled", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>
      <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
    </SvgIcon>
  );
}

/** Agents-needing-attention table for the Home dashboard (REQ-055, REQ-056). */
export default function AttentionTable({ agents, navigate }: { agents: Agent[]; navigate: (v: View) => void }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const attention = agents
    .filter((a) => a.compositeScore !== null && a.compositeScore < SHIP_THRESHOLD)
    .sort((a, b) => (a.compositeScore ?? 0) - (b.compositeScore ?? 0));

  return (
    <Paper sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
      <Box sx={{ px: 2, pt: 2, pb: 1.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Agents needing attention
        </Typography>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          Composite score below the Ship threshold ({SHIP_THRESHOLD})
        </Typography>
      </Box>

      {attention.length === 0 ? (
        <Box sx={{ px: 2, pb: 2.5, pt: 1 }}>
          <Typography variant="body2" sx={{ color: "text.disabled" }}>
            All scored agents are shipping.
          </Typography>
        </Box>
      ) : (
        <Box>
          <Box sx={{ display: "grid", gridTemplateColumns: ROW_COLUMNS, px: 2, pb: 0.5, gap: 1 }}>
            {["", "Agent", "Score", "Verdict", "Type"].map((h) => (
              <Typography key={h} variant="caption" sx={{ color: "text.disabled", fontWeight: 700, fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: 0.5 }}>
                {h}
              </Typography>
            ))}
          </Box>
          <Divider />
          {attention.map((agent, idx) => {
            const isExpanded = expandedId === agent.agent_id;
            const hasSafetyIssue = agent.hasCriticalSafetyIssue || agent.hasHighSafetyIssue;
            return (
              <Fragment key={agent.agent_id}>
                <Box
                  onClick={() => navigate({ name: "agent-overview", agentId: agent.agent_id })}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: ROW_COLUMNS,
                    px: 2,
                    py: 1.25,
                    gap: 1,
                    alignItems: "center",
                    cursor: "pointer",
                    borderTop: idx > 0 ? "1px solid" : "none",
                    borderColor: "divider",
                    "&:hover": { bgcolor: "action.hover" },
                    bgcolor: isExpanded ? "action.selected" : undefined,
                  }}
                >
                  <ButtonBase
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedId(isExpanded ? null : agent.agent_id);
                    }}
                    sx={{ borderRadius: "50%", p: 0.5, display: "flex", width: "fit-content" }}
                    aria-label={isExpanded ? "Collapse dimension detail" : "Expand dimension detail"}
                  >
                    <ChevronIcon open={isExpanded} />
                  </ButtonBase>
                  <Box sx={{ minWidth: 0 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {agent.name}
                      </Typography>
                      {hasSafetyIssue && (
                        <WarningIcon sx={{ fontSize: "0.85rem", color: agent.hasCriticalSafetyIssue ? "error.main" : "warning.main", flexShrink: 0 }} />
                      )}
                    </Box>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                    <GradeChip grade={agent.grade} size="small" />
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {agent.compositeScore}
                    </Typography>
                  </Box>
                  <Box>{agent.verdict && <CompositeVerdictChip verdict={agent.verdict} />}</Box>
                  <Box>
                    <AgentTypeTag type={agent.agentType} />
                  </Box>
                </Box>
                {isExpanded && (
                  <Box sx={{ px: 2, pt: 1.5, pb: 2, borderTop: "1px solid", borderColor: "divider", bgcolor: "action.hover" }}>
                    {hasSafetyIssue && agent.safetyDetail && (
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 1,
                          mb: 1.5,
                          px: 1.25,
                          py: 0.75,
                          borderRadius: 1,
                          border: "1px solid",
                          borderColor: agent.hasCriticalSafetyIssue ? "error.light" : "warning.light",
                          bgcolor: agent.hasCriticalSafetyIssue
                            ? "rgba(var(--mui-palette-error-mainChannel) / 0.08)"
                            : "rgba(var(--mui-palette-warning-mainChannel) / 0.08)",
                        }}
                      >
                        <WarningIcon sx={{ fontSize: "0.95rem", color: agent.hasCriticalSafetyIssue ? "error.main" : "warning.main", flexShrink: 0, mt: "1px" }} />
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: agent.hasCriticalSafetyIssue ? "error.dark" : "warning.dark", display: "block" }}>
                            {agent.hasCriticalSafetyIssue ? "Critical safety issue" : "High safety issue"}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                            {agent.safetyDetail}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 3, mb: 1.5 }}>
                      {DIMENSION_ORDER.filter((d) => agent.dimensionScores[d]).map((d) => (
                        <DimensionScoreBar key={d} dimension={d} data={agent.dimensionScores[d]} compact />
                      ))}
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                      <Button
                        size="small"
                        variant="text"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate({ name: "agent-overview", agentId: agent.agent_id });
                        }}
                        sx={{ color: "primary.main", fontSize: "0.72rem" }}
                      >
                        Open agent →
                      </Button>
                    </Box>
                  </Box>
                )}
              </Fragment>
            );
          })}
        </Box>
      )}
    </Paper>
  );
}
