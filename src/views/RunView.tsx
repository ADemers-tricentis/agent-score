import { useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Table from "@mui/material/Table";
import Tag from "@tricentis/aura/components/Tag.js";
import ChipSubtle from "@tricentis/aura/components/ChipSubtle.js";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Divider from "@mui/material/Divider";
import type { View } from "../types";
import { getProject, getRun, runPassRate, sessionCompositeScore, sessionGrade } from "../data/mock";
import VerdictBadge from "../components/VerdictBadge";
import GradeChip from "../components/GradeChip";

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
  const [exportOpen, setExportOpen] = useState(false);
  const [exportSelected, setExportSelected] = useState<Set<string>>(new Set());
  const [exported, setExported] = useState(false);

  const project = getProject(projectId);
  const run = getRun(projectId, runId);
  if (!run || !project) return <Box sx={{ p: 3 }}><Typography>Run not found.</Typography></Box>;

  const passRate = runPassRate(run.sessions);
  const avgComposite = run.sessions.length
    ? Math.round(run.sessions.reduce((sum, s) => sum + sessionCompositeScore(s), 0) / run.sessions.length)
    : 0;

  const otherRuns = project.runs.filter((r) => r.id !== runId);

  function openExport() {
    setExportSelected(new Set(run!.sessions.filter((s) => s.verdict === "FAIL" || s.verdict === "PARTIAL").map((s) => s.id)));
    setExported(false);
    setExportOpen(true);
  }

  function toggleExportSession(id: string) {
    setExportSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleExport() {
    setExported(true);
    setTimeout(() => setExportOpen(false), 1500);
  }

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
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 0.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {run.label}
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            {otherRuns.length > 0 && (
              <Button
                size="small"
                variant="outlined"
                color="inherit"
                sx={{ color: "text.secondary" }}
                onClick={() =>
                  navigate({
                    name: "compare-runs",
                    projectId,
                    runIdA: runId,
                    runIdB: otherRuns[0].id,
                  })
                }
              >
                Compare with {otherRuns[0].label}
              </Button>
            )}
            <Button size="small" variant="outlined" color="primary" onClick={openExport}>
              Export as calibration case
            </Button>
          </Box>
        </Box>
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
          <Box>
            <Typography variant="caption" sx={{ color: "text.disabled", display: "block" }}>Avg Score</Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 0.25 }}>
              <GradeChip grade={sessionGrade(avgComposite)} size="small" />
              <Typography variant="subtitle2" sx={{ fontWeight: 700, fontFamily: "monospace" }}>
                {avgComposite}/100
              </Typography>
            </Box>
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
              <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>Score</TableCell>
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
                      <Tag
                        label="Safety"
                        sx={{ height: 18, fontSize: "0.6rem", fontWeight: 700, bgcolor: "error.main", "& .MuiChip-label": { color: "white" } }}
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
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    {(() => {
                      const comp = sessionCompositeScore(session);
                      return (
                        <>
                          <GradeChip grade={sessionGrade(comp)} size="small" />
                          <Typography variant="caption" sx={{ fontWeight: 700, fontFamily: "monospace" }}>
                            {comp}
                          </Typography>
                        </>
                      );
                    })()}
                  </Box>
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

      {/* Export calibration case dialog */}
      <Dialog open={exportOpen} onClose={() => setExportOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Export as Calibration Case</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
            Select sessions to include in the calibration case. Non-PASS sessions are pre-selected as they typically yield the most useful calibration scenarios.
          </Typography>
          <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", mb: 1 }}>
            Sessions
          </Typography>
          {run.sessions.map((s) => (
            <Box key={s.id} sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={exportSelected.has(s.id)}
                    onChange={() => toggleExportSession(s.id)}
                  />
                }
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography variant="body2">{s.scenario}</Typography>
                    <VerdictBadge verdict={s.verdict} />
                  </Box>
                }
                sx={{ m: 0 }}
              />
            </Box>
          ))}
          <Divider sx={{ my: 2 }} />
          <Typography variant="caption" sx={{ color: "text.disabled", display: "block" }}>
            Destination: ~/.AgentScore/projects/{project.service}/calibration-cases/{run.id}/
          </Typography>
          {exported && (
            <ChipSubtle label="Exported!" color="success" sx={{ mt: 1 }} />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportOpen(false)} color="inherit" sx={{ color: "text.secondary" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleExport}
            disabled={exportSelected.size === 0 || exported}
          >
            {exported ? "Exported" : `Export ${exportSelected.size} session${exportSelected.size !== 1 ? "s" : ""}`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function scoreColor(score: number): string {
  if (score >= 75) return "#22c55e";
  if (score >= 55) return "#f59e0b";
  return "#ef4444";
}
