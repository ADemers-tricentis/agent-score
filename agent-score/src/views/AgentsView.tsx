import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import ButtonBase from "@mui/material/ButtonBase";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import SvgIcon from "@mui/material/SvgIcon";

function AddIcon() {
  return <SvgIcon><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></SvgIcon>;
}
import Chip from "@mui/material/Chip";
import Tag from "@tricentis/aura/components/Tag.js";
import type { View } from "../types";
import { PROJECTS, projectDimensionAverages } from "../data/mock";
import { agentVerdict, criticalSafety, RUN_STATE_META } from "../data/verdict";
import VerdictChip from "../components/VerdictChip";
import TypeTag from "../components/TypeTag";
import ScoreBar from "../components/ScoreBar";
import GradeChip from "../components/GradeChip";

interface Props {
  navigate: (v: View) => void;
}

export default function AgentsView({ navigate }: Props) {
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
            Agents
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {PROJECTS.length} projects · {PROJECTS.filter((p) => p.phase === 1).length} Phase 1 · {PROJECTS.filter((p) => p.phase === 2).length} Phase 2
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate({ name: "add-agent" })}
        >
          Add Agent
        </Button>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: 2,
        }}
      >
        {PROJECTS.map((project) => {
          const verdict = agentVerdict(project);
          const critical = criticalSafety(project);
          const isScored = verdict.state === "scored";
          const reasonColor = verdict.band === "block" ? "error.main" : verdict.band === "review" ? "warning.main" : verdict.band === "ship" ? "success.main" : "text.secondary";
          const allSessions = project.runs.flatMap((r) => r.sessions);
          const totalSessions = allSessions.length;
          const isAtcBeta = project.type === "ATC";

          // Token spend: parse p95_tail_cost from valueEfficiency sigs
          const sessionCosts = allSessions
            .map((s) => {
              const sig = (s.scores.valueEfficiency?.sigs ?? []).find((x) => x.startsWith("p95_tail_cost:"));
              if (!sig) return null;
              const val = parseFloat(sig.replace(/^p95_tail_cost:\s*\$/, ""));
              return isNaN(val) ? null : val;
            })
            .filter((v): v is number => v !== null);
          const avgCost = sessionCosts.length > 0
            ? sessionCosts.reduce((a, b) => a + b, 0) / sessionCosts.length
            : null;

          // Dimension averages for the latest run - same source projectCompositeScore is derived from,
          // so these bars always recombine to the composite shown above them.
          const avgDim = project.runs[0]?.sessions.length ? projectDimensionAverages(project) : null;

          return (
            <ButtonBase
              key={project.id}
              onClick={() => navigate({ name: "agent-detail", projectId: project.id })}
              sx={{ display: "block", textAlign: "left", borderRadius: 2, width: "100%" }}
            >
              <Paper
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: critical ? "error.main" : verdict.state === "error" ? "error.light" : "divider",
                  "&:hover": {
                    borderColor: critical ? "error.dark" : "primary.main",
                    bgcolor: "action.hover",
                  },
                  transition: "all 0.15s",
                  cursor: "pointer",
                }}
              >
                {/* Safety banner */}
                {critical && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5, px: 1, py: 0.75, borderRadius: 1, bgcolor: "error.light", color: "error.contrastText" }}>
                    <SvgIcon sx={{ fontSize: "0.95rem", color: "error.main", flexShrink: 0 }}>
                      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-1 6h2v2h-2V7zm0 4h2v4h-2v-4z" />
                    </SvgIcon>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: "error.dark", flex: 1, minWidth: 0 }}>
                      Safety issue detected
                    </Typography>
                    <Chip label={critical.signal.replace(/_/g, " ")} size="small" color="error" sx={{ height: 18, fontSize: "0.6rem", fontWeight: 700 }} />
                  </Box>
                )}

                {/* Header */}
                <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 1.5 }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.25 }}>
                      {project.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.disabled", fontFamily: "monospace" }}>
                      {project.service}
                    </Typography>
                  </Box>
                  <TypeTag type={project.type} />
                </Box>

                <Divider sx={{ mb: 1.5 }} />

                {/* Stats row */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5, flexWrap: "wrap" }}>
                  {isScored ? (
                    <>
                      <GradeChip grade={verdict.grade!} size="small" />
                      <Typography variant="caption" sx={{ fontWeight: 700, fontFamily: "monospace" }}>
                        {verdict.score}/100
                      </Typography>
                      <VerdictChip band={verdict.band!} />
                    </>
                  ) : (
                    <Chip
                      label={RUN_STATE_META[verdict.state].label}
                      size="small"
                      color={RUN_STATE_META[verdict.state].muiColor}
                      variant="outlined"
                      sx={{ height: 22, fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.02em" }}
                    />
                  )}
                  {isAtcBeta && (
                    <Tag
                      label="ATC beta"
                      sx={{ height: 20, fontSize: "0.63rem", fontWeight: 700, bgcolor: "primary.dark", "& .MuiChip-label": { color: "primary.light" } }}
                    />
                  )}
                  <Typography variant="caption" sx={{ color: "text.secondary", ml: "auto" }}>
                    {totalSessions} sessions
                    {avgCost != null && ` · $${avgCost.toFixed(2)}/session`}
                  </Typography>
                </Box>

                {/* Why-line */}
                <Typography variant="caption" sx={{ color: reasonColor, fontWeight: 600, display: "block", mb: 1.5 }}>
                  {verdict.reason}
                </Typography>

                {/* Dimension bars */}
                {avgDim ? (
                  <Box sx={{ opacity: isScored ? 1 : 0.45 }}>
                    <ScoreBar label="Correctness" dimension={avgDim.correctness} compact />
                    <ScoreBar label="Efficiency" dimension={avgDim.efficiency} compact />
                    <ScoreBar label="Relevance" dimension={avgDim.relevance} compact />
                    <ScoreBar label="Safety" dimension={avgDim.safety} compact />
                    <ScoreBar label="Consistency" dimension={avgDim.consistency} compact />
                    <ScoreBar label="Tool Use" dimension={avgDim.toolUse} compact />
                  </Box>
                ) : (
                  <Box sx={{ py: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography variant="caption" sx={{ color: "text.disabled" }}>
                      Scoring unlocks at 20 traces · {totalSessions} collected
                    </Typography>
                  </Box>
                )}

                {/* Run count */}
                <Typography variant="caption" sx={{ color: "text.disabled", mt: 0.5, display: "block" }}>
                  {project.runs.length} run{project.runs.length !== 1 ? "s" : ""} · latest {project.runs[0]?.date}
                </Typography>
              </Paper>
            </ButtonBase>
          );
        })}
      </Box>
    </Box>
  );
}
