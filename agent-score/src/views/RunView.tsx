import { useState, useMemo } from "react";
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
import Chip from "@mui/material/Chip";
import FormControlLabel from "@mui/material/FormControlLabel";
import Table from "@mui/material/Table";
import Tag from "@tricentis/aura/components/Tag.js";
import ChipSubtle from "@tricentis/aura/components/ChipSubtle.js";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Divider from "@mui/material/Divider";
import Tooltip from "@mui/material/Tooltip";
import type { View, Session } from "../types";
import { getProject, getRun, runPassRate, sessionCompositeScore, sessionGrade } from "../data/mock";
import { projectVerdictBands, sessionVerdict, scoreToken } from "../data/verdict";
import VerdictChip from "../components/VerdictChip";
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

const DIM_FILTERS = ["Correctness", "Efficiency", "Relevance", "Safety", "Consistency", "Tool Use"] as const;
type DimFilter = (typeof DIM_FILTERS)[number];

function getDimScore(s: Session, dim: DimFilter): number | null {
  if (dim === "Correctness") return s.scores.benchmarkPerformance.score;
  if (dim === "Efficiency") return s.scores.valueEfficiency?.score ?? null;
  if (dim === "Relevance") return s.scores.uxSignal.score;
  if (dim === "Safety") return s.scores.harmony?.score ?? null;
  if (dim === "Consistency") return s.scores.stability?.score ?? null;
  if (dim === "Tool Use") return s.scores.agency?.score ?? null;
  return null;
}

export default function RunView({ projectId, runId, navigate }: Props) {
  const [exportOpen, setExportOpen] = useState(false);
  const [exportSelected, setExportSelected] = useState<Set<string>>(new Set());
  const [exported, setExported] = useState(false);
  const [dimFilter, setDimFilter] = useState<DimFilter | null>(null);

  const project = getProject(projectId);
  const run = getRun(projectId, runId);
  if (!run || !project) return <Box sx={{ p: 3 }}><Typography>Run not found.</Typography></Box>;

  const bands = projectVerdictBands(project);
  const passRate = runPassRate(run.sessions);
  const avgComposite = run.sessions.length
    ? Math.round(run.sessions.reduce((sum, s) => sum + sessionCompositeScore(s), 0) / run.sessions.length)
    : 0;

  const n = run.sessions.length;
  const p = passRate / 100;
  const ci95 = n > 1 ? Math.ceil(1.96 * Math.sqrt((p * (1 - p)) / n) * 100) : 0;

  const filteredSessions = useMemo(() => {
    if (!dimFilter) return run.sessions;
    return run.sessions.filter((s) => {
      const score = getDimScore(s, dimFilter);
      return score !== null && score < 55;
    });
  }, [run.sessions, dimFilter]);

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
        <Button size="small" onClick={() => navigate({ name: "agents" })} sx={{ color: "text.disabled" }}>
          Agents
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
            <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 700,
                  color: passRate >= 75 ? "success.main" : passRate >= 50 ? "warning.main" : "error.main",
                }}
              >
                {passRate}%
              </Typography>
              {ci95 > 0 && (
                <Tooltip
                  title={`Based on ${n} session${n === 1 ? "" : "s"}, we're 95% confident the true pass rate is between ${Math.max(0, passRate - ci95)}% and ${Math.min(100, passRate + ci95)}%. More sessions narrow this range.`}
                  arrow
                  placement="top"
                >
                  <Typography variant="caption" sx={{ color: "text.disabled", cursor: "help" }}>
                    ± {ci95}%
                  </Typography>
                </Tooltip>
              )}
            </Box>
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
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5, flexWrap: "wrap", gap: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Sessions
          {dimFilter && (
            <Typography component="span" variant="caption" sx={{ color: "text.secondary", ml: 1 }}>
              — {filteredSessions.length} failing {dimFilter}
            </Typography>
          )}
        </Typography>
        <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", alignItems: "center" }}>
          <Typography variant="caption" sx={{ color: "text.disabled" }}>Filter by failed dimension:</Typography>
          {DIM_FILTERS.map((d) => {
            const failCount = run.sessions.filter((s) => {
              const score = getDimScore(s, d);
              return score !== null && score < 55;
            }).length;
            if (failCount === 0) return null;
            return (
              <Chip
                key={d}
                label={`${d} (${failCount})`}
                size="small"
                variant={dimFilter === d ? "filled" : "outlined"}
                color={dimFilter === d ? "error" : "default"}
                onClick={() => setDimFilter(dimFilter === d ? null : d)}
                sx={{ fontSize: "0.65rem", cursor: "pointer" }}
              />
            );
          })}
          {dimFilter && (
            <Chip
              label="Clear"
              size="small"
              variant="outlined"
              onClick={() => setDimFilter(null)}
              sx={{ fontSize: "0.65rem", cursor: "pointer", color: "text.secondary" }}
            />
          )}
        </Box>
      </Box>
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
            {filteredSessions.map((session) => (
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
                  <Typography variant="caption" sx={{ fontWeight: 600, color: scoreToken(session.scores.benchmarkPerformance.score) }}>
                    {session.scores.benchmarkPerformance.score}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: session.scores.valueEfficiency ? scoreToken(session.scores.valueEfficiency.score) : "text.disabled" }}>
                    {session.scores.valueEfficiency?.score ?? "—"}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: scoreToken(session.scores.uxSignal.score) }}>
                    {session.scores.uxSignal.score}
                  </Typography>
                </TableCell>
                <TableCell>
                  <VerdictChip band={sessionVerdict(session, bands).band} />
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
                    <VerdictChip band={sessionVerdict(s, bands).band} />
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
