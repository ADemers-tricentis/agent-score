import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import ButtonBase from "@mui/material/ButtonBase";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import type { View } from "../types";
import { PROJECTS, projectPassRate, projectLatestVerdict } from "../data/mock";
import VerdictBadge from "../components/VerdictBadge";
import TypeTag from "../components/TypeTag";
import ScoreBar from "../components/ScoreBar";

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
                  <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    <TypeTag type={project.type} />
                    <Chip
                      label={`Phase ${project.phase}`}
                      size="small"
                      sx={{ height: 20, fontSize: "0.65rem", fontWeight: 600, color: "text.disabled" }}
                    />
                  </Box>
                </Box>

                <Divider sx={{ mb: 1.5 }} />

                {/* Stats row */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5, flexWrap: "wrap" }}>
                  <VerdictBadge verdict={verdict} />
                  <Chip
                    label={rel.label}
                    color={rel.color}
                    size="small"
                    variant="outlined"
                    sx={{ height: 20, fontSize: "0.65rem", fontWeight: 600 }}
                  />
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
