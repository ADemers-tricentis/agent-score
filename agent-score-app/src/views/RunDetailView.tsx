import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import type { View } from "../view";
import type { Grade, ScoringRunDetail, SessionVerdict } from "../types";
import { getScoringRun } from "../data/mock";
import { useAgent } from "../data/useAgents";
import GradeChip from "../components/shared/GradeChip";
import { CompositeVerdictChip, SessionVerdictChip } from "../components/shared/VerdictChip";
import StatCard from "../components/shared/StatCard";
import ExportCalibrationDialog from "./run-detail/ExportCalibrationDialog";

function formatDate(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function formatDuration(ms: number): string {
  if (ms >= 60_000) return `${Math.floor(ms / 60_000)}m ${Math.round((ms % 60_000) / 1000)}s`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function gradeForScore(score: number): Grade {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

/** Run detail: session-level breakdown for a single scoring run (Milestone 2). */
export default function RunDetailView({
  agentId,
  runId,
  navigate,
}: {
  agentId: string;
  runId: string;
  navigate: (v: View) => void;
}) {
  const agent = useAgent(agentId);
  const [run, setRun] = useState<ScoringRunDetail | null | undefined>(undefined);
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setRun(undefined);
    getScoringRun(agentId, runId).then((r) => {
      if (!cancelled) setRun(r);
    });
    return () => {
      cancelled = true;
    };
  }, [agentId, runId]);

  function handleBack() {
    navigate({ name: "agent-overview", agentId, tab: "scoring" });
  }

  if (run === undefined) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Loading run...
        </Typography>
      </Box>
    );
  }

  if (run === null) {
    return (
      <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2 }}>
        <Typography>Run not found.</Typography>
        <Button variant="outlined" size="small" onClick={handleBack} sx={{ alignSelf: "flex-start" }}>
          ← Back to Agent
        </Button>
      </Box>
    );
  }

  const tally = run.sessions.reduce(
    (acc, s) => {
      acc[s.verdict] = (acc[s.verdict] ?? 0) + 1;
      return acc;
    },
    { PASS: 0, PARTIAL: 0, FAIL: 0 } as Record<SessionVerdict, number>,
  );
  const avgComposite = run.sessions.length
    ? Math.round(run.sessions.reduce((sum, s) => sum + s.compositeScore, 0) / run.sessions.length)
    : null;
  const avgGrade = avgComposite != null ? gradeForScore(avgComposite) : null;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box>
        <Button size="small" onClick={handleBack} sx={{ mb: 1.5, textTransform: "none", pl: 0 }}>
          ← Back to {agent?.name ?? "Agent"}
        </Button>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {run.label}
          </Typography>
          {run.verdict && !run.inProgress && <CompositeVerdictChip verdict={run.verdict} size="medium" />}
        </Box>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          {formatDate(run.completedAt ?? run.startedAt)}
        </Typography>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 2 }}>
        <StatCard label="Passed" value={tally.PASS} />
        <StatCard label="Pending" value={tally.PARTIAL} />
        <StatCard label="Failed" value={tally.FAIL} />
        <StatCard
          label="Avg Score"
          value={avgComposite ?? "-"}
          sub={avgGrade && <GradeChip grade={avgGrade} size="small" />}
        />
        <StatCard label="Pass Rate" value={`${run.passRate}%`} />
      </Box>

      <Paper sx={{ p: 2.5, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Sessions
          </Typography>
          <Button variant="outlined" size="small" onClick={() => setExportOpen(true)}>
            Export as calibration case
          </Button>
        </Box>

        {run.sessions.length === 0 ? (
          <Box sx={{ py: 3, textAlign: "center" }}>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              No sessions in this run.
            </Typography>
          </Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>Scenario</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.secondary", width: 100 }}>Time</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.secondary", width: 90 }}>Duration</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.secondary", width: 120 }}>Score</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.secondary", width: 100 }}>Verdict</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {run.sessions.map((session) => (
                <TableRow
                  key={session.id}
                  hover
                  onClick={() => navigate({ name: "session-detail", agentId, runId, sessionId: session.id })}
                  sx={{ cursor: "pointer", "&:last-child td": { borderBottom: 0 } }}
                >
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {session.scenario}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      {formatTime(session.ts)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      {formatDuration(session.durationMs)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <GradeChip grade={session.grade} size="small" />
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        {session.compositeScore}/100
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <SessionVerdictChip verdict={session.verdict} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      <ExportCalibrationDialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        agentId={agentId}
        runId={runId}
        sessions={run.sessions}
      />
    </Box>
  );
}
