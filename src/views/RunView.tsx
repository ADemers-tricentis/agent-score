import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Chip from "@mui/material/Chip";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import type { View } from "../types";
import { getProject, getRun, runPassRate } from "../data/mock";
import VerdictBadge from "../components/VerdictBadge";

interface Props {
  projectId: string;
  runId: string;
  navigate: (v: View) => void;
}

function fmtDur(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

function fmtTs(ts: string): string {
  return new Date(ts).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function RunView({ projectId, runId, navigate }: Props) {
  const project = getProject(projectId);
  const run = getRun(projectId, runId);
  if (!run || !project) return <Box sx={{ p: 3 }}><Typography>Run not found.</Typography></Box>;

  const passRate = runPassRate(run.sessions);

  return (
    <Box sx={{ p: 3, maxWidth: 960 }}>
      <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
        <Button size="small" onClick={() => navigate({ name: "fleet" })} sx={{ color: "text.disabled" }}>
          Fleet
        </Button>
        <Typography sx={{ color: "text.disabled", alignSelf: "center" }}>/</Typography>
        <Button size="small" onClick={() => navigate({ name: "project", projectId })} sx={{ color: "text.secondary" }}>
          {project.name}
        </Button>
      </Box>

      {/* Run header */}
      <Paper sx={{ p: 2.5, mb: 3, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
          {run.label}
        </Typography>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          {run.date} · {run.sessions.length} sessions
        </Typography>
        <Box sx={{ display: "flex", gap: 3, mt: 1.5 }}>
          <Box>
            <Typography variant="caption" sx={{ color: "text.disabled", display: "block" }}>Pass Rate</Typography>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                color: passRate >= 75 ? "success.main" : passRate >= 50 ? "warning.main" : "error.main",
              }}
            >
              {passRate}%
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: "text.disabled", display: "block" }}>Sessions</Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{run.sessions.length}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: "text.disabled", display: "block" }}>PASS</Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "success.main" }}>
              {run.sessions.filter((s) => s.verdict === "PASS").length}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: "text.disabled", display: "block" }}>PARTIAL</Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "warning.main" }}>
              {run.sessions.filter((s) => s.verdict === "PARTIAL").length}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: "text.disabled", display: "block" }}>FAIL</Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "error.main" }}>
              {run.sessions.filter((s) => s.verdict === "FAIL").length}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Sessions table */}
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
        Sessions
      </Typography>
      <Paper sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>Scenario</TableCell>
              <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>Time</TableCell>
              <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>Duration</TableCell>
              <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>BP</TableCell>
              <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>VE</TableCell>
              <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>UX</TableCell>
              <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>Verdict</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {run.sessions.map((session) => (
              <TableRow
                key={session.id}
                component={ButtonBase}
                onClick={() => navigate({ name: "session", projectId, runId, sessionId: session.id })}
                sx={{
                  display: "table-row",
                  cursor: "pointer",
                  "&:hover": { bgcolor: "action.hover" },
                  "&:last-child td": { borderBottom: 0 },
                }}
              >
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {session.scenario}
                    </Typography>
                    {session.safetyOverride && (
                      <Chip
                        label="Safety"
                        size="small"
                        color="error"
                        sx={{ height: 18, fontSize: "0.6rem", fontWeight: 700 }}
                      />
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    {fmtTs(session.ts)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    {fmtDur(session.dur)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: scoreColor(session.scores.benchmarkPerformance.score) }}>
                    {session.scores.benchmarkPerformance.score}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: session.scores.valueEfficiency ? scoreColor(session.scores.valueEfficiency.score) : "text.disabled" }}>
                    {session.scores.valueEfficiency?.score ?? "—"}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: scoreColor(session.scores.uxSignal.score) }}>
                    {session.scores.uxSignal.score}
                  </Typography>
                </TableCell>
                <TableCell>
                  <VerdictBadge verdict={session.verdict} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}

function scoreColor(score: number): string {
  if (score >= 75) return "#22c55e";
  if (score >= 55) return "#f59e0b";
  return "#ef4444";
}
