import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import ButtonBase from "@mui/material/ButtonBase";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import ChipStatus from "@tricentis/aura/components/ChipStatus.js";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import ChipSubtle from "@tricentis/aura/components/ChipSubtle.js";
import Alert from "@mui/material/Alert";
import type { View } from "../types";
import { getProject, runPassRate, getEvalDesign, computePassK, projectCompositeScore, sessionGrade } from "../data/mock";
import VerdictBadge from "../components/VerdictBadge";
import TypeTag from "../components/TypeTag";
import GradeChip from "../components/GradeChip";

interface Props {
  projectId: string;
  navigate: (v: View) => void;
}

export default function ProjectView({ projectId, navigate }: Props) {
  const project = getProject(projectId);
  const evalDesign = getEvalDesign(projectId);
  if (!project) return <Box sx={{ p: 3 }}><Typography>Project not found.</Typography></Box>;

  const passK = computePassK(project);
  const composite = projectCompositeScore(project);
  const grade = sessionGrade(composite);
  const canCompare = project.runs.length >= 2;

  const evalStatusLabel = evalDesign?.status === "confirmed"
    ? "Confirmed"
    : evalDesign?.status === "observation_ready"
    ? "Recommendation Ready"
    : "No Design";

  const evalStatusColor = evalDesign?.status === "confirmed"
    ? "success"
    : evalDesign?.status === "observation_ready"
    ? "warning"
    : undefined;

  return (
    <Box sx={{ p: 3, maxWidth: 960 }}>
      {/* Back */}
      <Button size="small" onClick={() => navigate({ name: "fleet" })} sx={{ mb: 2, color: "text.secondary" }}>
        ← Fleet
      </Button>

      {/* ATC beta notice */}
      {project.type === "ATC" && (
        <Alert severity="info" sx={{ mb: 2, fontSize: "0.8rem" }}>
          <strong>ATC Beta:</strong> ATC sessions are surfaced as informational signals in Phase 2. Verdicts and scores help calibrate evaluation design but are not CI gates.
        </Alert>
      )}

      {/* Project header */}
      <Paper sx={{ p: 2.5, mb: 3, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 1 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.25 }}>
              {project.name}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.disabled", fontFamily: "monospace" }}>
              {project.service}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <TypeTag type={project.type} />
          </Box>
        </Box>
        <Divider sx={{ my: 1.5 }} />
        <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap", alignItems: "flex-start" }}>
          <Box>
            <Typography variant="caption" sx={{ color: "text.disabled", display: "block" }}>Score</Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 0.25 }}>
              <GradeChip grade={grade} size="small" />
              <Typography variant="subtitle2" sx={{ fontWeight: 700, fontFamily: "monospace" }}>
                {composite}/100
              </Typography>
            </Box>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: "text.disabled", display: "block" }}>Runs</Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{project.runs.length}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: "text.disabled", display: "block" }}>Sessions</Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {project.runs.flatMap((r) => r.sessions).length}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: "text.disabled", display: "block" }}>Reliability</Typography>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                color:
                  project.reliability === "RELIABLE"
                    ? "success.main"
                    : project.reliability === "NEEDS_WORK"
                    ? "warning.main"
                    : "error.main",
              }}
            >
              {project.reliability.replace("_", " ")}
            </Typography>
          </Box>
          {passK >= 0 && (
            <Box>
              <Typography variant="caption" sx={{ color: "text.disabled", display: "block" }}>Pass^k (multi-run)</Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 0.25 }}>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 700, color: passK >= 75 ? "success.main" : passK >= 50 ? "warning.main" : "error.main" }}
                >
                  {passK}%
                </Typography>
                <ChipSubtle label="consistent" color="default" sx={{ fontSize: "0.6rem", height: 18 }} />
              </Box>
            </Box>
          )}
          {canCompare && (
            <Box sx={{ ml: "auto", alignSelf: "center" }}>
              <Button
                size="small"
                variant="outlined"
                color="inherit"
                sx={{ color: "text.secondary" }}
                onClick={() =>
                  navigate({
                    name: "compare-runs",
                    projectId,
                    runIdA: project.runs[0].id,
                    runIdB: project.runs[1].id,
                  })
                }
              >
                Compare runs
              </Button>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Evaluation Design card */}
      <Paper
        sx={{
          p: 2,
          mb: 3,
          border: "1px solid",
          borderColor: evalDesign?.status === "confirmed"
            ? "success.dark"
            : evalDesign?.status === "observation_ready"
            ? "warning.dark"
            : "divider",
          borderRadius: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Evaluation Design
            </Typography>
            <ChipStatus
              status={
                evalDesign?.status === "confirmed"
                  ? "Passed"
                  : evalDesign?.status === "observation_ready"
                  ? "Pending"
                  : "Draft"
              }
            />
          </Box>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {evalDesign?.status === "confirmed"
              ? `${evalDesign.confirmedDimensions.length} dimensions confirmed · ${evalDesign.calibrationSet.length} calibration scenarios`
              : evalDesign?.status === "observation_ready"
              ? `Observation-based recommendation ready — ${evalDesign.measurementRecommendation?.shadowSessionCount} shadow sessions analyzed`
              : "No evaluation design yet. Define what to measure before scoring begins."}
          </Typography>
        </Box>
        <Button
          variant={evalDesign?.status === "confirmed" ? "outlined" : "contained"}
          color={evalDesign?.status === "confirmed" ? "inherit" : "primary"}
          size="small"
          onClick={() => navigate({ name: "eval-design", projectId })}
          sx={evalDesign?.status === "confirmed" ? { color: "text.secondary" } : {}}
        >
          {evalDesign?.status === "confirmed" ? "View design" : evalDesign?.status === "observation_ready" ? "Review recommendation" : "Set up evaluation design"}
        </Button>
      </Paper>

      {/* Runs */}
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
        Runs
      </Typography>
      <Paper sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>Run</TableCell>
              <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>Sessions</TableCell>
              <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>Pass Rate</TableCell>
              <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>Latest Verdict</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {project.runs.map((run) => {
              const passRate = runPassRate(run.sessions);
              const latestVerdict = run.sessions[0]?.verdict ?? "FAIL";
              return (
                <TableRow
                  key={run.id}
                  component={ButtonBase}
                  onClick={() => navigate({ name: "run", projectId, runId: run.id })}
                  sx={{
                    display: "table-row",
                    cursor: "pointer",
                    "&:hover": { bgcolor: "action.hover" },
                    "&:last-child td": { borderBottom: 0 },
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {run.label}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      {run.date}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{run.sessions.length}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        color: passRate >= 75 ? "success.main" : passRate >= 50 ? "warning.main" : "error.main",
                      }}
                    >
                      {passRate}%
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <VerdictBadge verdict={latestVerdict} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
