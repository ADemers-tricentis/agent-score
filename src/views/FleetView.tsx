import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import ButtonBase from "@mui/material/ButtonBase";
import Divider from "@mui/material/Divider";
import Tag from "@tricentis/aura/components/Tag.js";
import ChipSubtle from "@tricentis/aura/components/ChipSubtle.js";
import type { View } from "../types";
import { PROJECTS, projectPassRate, projectLatestVerdict, projectCompositeScore, sessionGrade } from "../data/mock";
import VerdictBadge from "../components/VerdictBadge";
import TypeTag from "../components/TypeTag";
import ScoreBar from "../components/ScoreBar";
import GradeChip from "../components/GradeChip";

interface Props {
  navigate: (v: View) => void;
}

function reliabilityConfig(r: string) {
  if (r === "RELIABLE") return { label: "Reliable", color: "success" as const };
  if (r === "NEEDS_WORK") return { label: "Needs Work", color: "warning" as const };
  return { label: "Unstable", color: "error" as const };
}

export default function FleetView({ navigate }: Props) {
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
          Fleet
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {PROJECTS.length} projects · {PROJECTS.filter((p) => p.phase === 1).length} Phase 1 · {PROJECTS.filter((p) => p.phase === 2).length} Phase 2
        </Typography>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: 2,
        }}
      >
        {PROJECTS.map((project) => {
          const passRate = projectPassRate(project);
          const verdict = projectLatestVerdict(project);
          const rel = reliabilityConfig(project.reliability);
          const totalSessions = project.runs.flatMap((r) => r.sessions).length;
          const latestSession = project.runs[0]?.sessions[0];
          const composite = projectCompositeScore(project);
          const grade = sessionGrade(composite);
          const isAtcBeta = project.type === "ATC";

          return (
            <ButtonBase
              key={project.id}
              onClick={() => navigate({ name: "project", projectId: project.id })}
              sx={{ display: "block", textAlign: "left", borderRadius: 2, width: "100%" }}
            >
              <Paper
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  "&:hover": {
                    borderColor: "primary.main",
                    bgcolor: "action.hover",
                  },
                  transition: "all 0.15s",
                  cursor: "pointer",
                }}
              >
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
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5, flexWrap: "wrap" }}>
                  <GradeChip grade={grade} size="small" />
                  <Typography variant="caption" sx={{ fontWeight: 700, fontFamily: "monospace" }}>
                    {composite}/100
                  </Typography>
                  <VerdictBadge verdict={verdict} />
                  <ChipSubtle
                    label={rel.label}
                    color={rel.color}
                    sx={{ height: 20, fontSize: "0.65rem", fontWeight: 600 }}
                  />
                  {isAtcBeta && (
                    <Tag
                      label="ATC beta"
                      sx={{ height: 20, fontSize: "0.63rem", fontWeight: 700, bgcolor: "primary.dark", "& .MuiChip-label": { color: "primary.light" } }}
                    />
                  )}
                  <Typography variant="caption" sx={{ color: "text.secondary", ml: "auto" }}>
                    {passRate}% pass · {totalSessions} sessions
                  </Typography>
                </Box>

                {/* Dimension bars */}
                {latestSession && (
                  <Box>
                    <ScoreBar
                      label="Benchmark Performance"
                      dimension={latestSession.scores.benchmarkPerformance}
                      compact
                    />
                    <ScoreBar
                      label="Value Efficiency"
                      dimension={latestSession.scores.valueEfficiency}
                      compact
                    />
                    <ScoreBar
                      label="UX Signal"
                      dimension={latestSession.scores.uxSignal}
                      compact
                    />
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
