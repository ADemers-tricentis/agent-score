import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import type { View, Session, VerdictBandKey } from "../types";
import { getProject, getRun, sessionCompositeScore, sessionGrade } from "../data/mock";
import { projectVerdictBands, sessionVerdict, scoreHex } from "../data/verdict";
import VerdictChip from "../components/VerdictChip";
import GradeChip from "../components/GradeChip";

interface Props {
  projectId: string;
  runIdA: string;
  runIdB: string;
  navigate: (v: View) => void;
}

function delta(a: number | undefined, b: number | undefined): { val: number; label: string; color: string } | null {
  if (a == null || b == null) return null;
  const d = a - b;
  return {
    val: d,
    label: d > 0 ? `+${d}` : `${d}`,
    color: d > 0 ? "#4ade80" : d < 0 ? "#f87171" : "#94a3b8",
  };
}

function DimCompare({
  label,
  scoreA,
  scoreB,
}: {
  label: string;
  scoreA: number | undefined;
  scoreB: number | undefined;
}) {
  if (scoreA == null && scoreB == null) return null;
  const d = delta(scoreA, scoreB);
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 0.75 }}>
      <Typography variant="caption" sx={{ width: 140, color: "text.secondary", flexShrink: 0 }}>
        {label}
      </Typography>
      <Box sx={{ flex: 1, display: "flex", alignItems: "center", gap: 0.5 }}>
        <Box sx={{ flex: scoreA ?? 0, height: 6, borderRadius: 1, bgcolor: scoreHex(scoreA ?? 0), minWidth: 2, maxWidth: (scoreA ?? 0) * 2 }} />
        <Typography variant="caption" sx={{ fontWeight: 700, fontFamily: "monospace", width: 28, textAlign: "right", color: scoreHex(scoreA ?? 0) }}>
          {scoreA ?? "—"}
        </Typography>
      </Box>
      <Box sx={{ width: 40, textAlign: "center", flexShrink: 0 }}>
        {d && (
          <Typography variant="caption" sx={{ fontWeight: 700, color: d.color, fontFamily: "monospace" }}>
            {d.label}
          </Typography>
        )}
      </Box>
      <Box sx={{ flex: 1, display: "flex", alignItems: "center", gap: 0.5, flexDirection: "row-reverse" }}>
        <Box sx={{ flex: scoreB ?? 0, height: 6, borderRadius: 1, bgcolor: scoreHex(scoreB ?? 0), minWidth: 2, maxWidth: (scoreB ?? 0) * 2 }} />
        <Typography variant="caption" sx={{ fontWeight: 700, fontFamily: "monospace", width: 28, textAlign: "left", color: scoreHex(scoreB ?? 0) }}>
          {scoreB ?? "—"}
        </Typography>
      </Box>
    </Box>
  );
}

function ScenarioMatch({
  scenario,
  sessionA,
  sessionB,
  navigate,
  projectId,
  runIdA,
  runIdB,
  bands,
}: {
  scenario: string;
  sessionA?: Session;
  sessionB?: Session;
  navigate: (v: View) => void;
  projectId: string;
  runIdA: string;
  runIdB: string;
  bands: Record<VerdictBandKey, number>;
}) {
  const compA = sessionA ? sessionCompositeScore(sessionA) : undefined;
  const compB = sessionB ? sessionCompositeScore(sessionB) : undefined;

  return (
    <Paper sx={{ mb: 2, border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
      <Box sx={{ px: 2.5, py: 1.5, bgcolor: "action.hover", display: "flex", alignItems: "center", gap: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, flex: 1 }}>
          {scenario}
        </Typography>
        {sessionA && (
          <Button
            size="small"
            onClick={() => navigate({ name: "session", projectId, runId: runIdA, sessionId: sessionA.id })}
            sx={{ fontSize: "0.7rem" }}
          >
            View A
          </Button>
        )}
        {sessionB && (
          <Button
            size="small"
            onClick={() => navigate({ name: "session", projectId, runId: runIdB, sessionId: sessionB.id })}
            sx={{ fontSize: "0.7rem" }}
          >
            View B
          </Button>
        )}
      </Box>
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: "flex", gap: 3, mb: 2 }}>
          {/* Run A verdict */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {sessionA ? (
              <>
                <VerdictChip band={sessionVerdict(sessionA, bands).band} />
                <GradeChip grade={sessionGrade(compA!)} size="small" />
                <Typography variant="caption" sx={{ fontFamily: "monospace", fontWeight: 700 }}>
                  {compA}/100
                </Typography>
              </>
            ) : (
              <Typography variant="caption" sx={{ color: "text.disabled" }}>Not run</Typography>
            )}
          </Box>

          <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {compA != null && compB != null && (
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  fontFamily: "monospace",
                  color: compA > compB ? "#4ade80" : compA < compB ? "#f87171" : "#94a3b8",
                  fontSize: "0.85rem",
                }}
              >
                {compA > compB ? `A +${compA - compB}` : compA < compB ? `B +${compB - compA}` : "tied"}
              </Typography>
            )}
          </Box>

          {/* Run B verdict */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexDirection: "row-reverse" }}>
            {sessionB ? (
              <>
                <VerdictChip band={sessionVerdict(sessionB, bands).band} />
                <GradeChip grade={sessionGrade(compB!)} size="small" />
                <Typography variant="caption" sx={{ fontFamily: "monospace", fontWeight: 700 }}>
                  {compB}/100
                </Typography>
              </>
            ) : (
              <Typography variant="caption" sx={{ color: "text.disabled" }}>Not run</Typography>
            )}
          </Box>
        </Box>

        <Divider sx={{ mb: 1.5 }} />

        <DimCompare
          label="Correctness"
          scoreA={sessionA?.scores.benchmarkPerformance.score}
          scoreB={sessionB?.scores.benchmarkPerformance.score}
        />
        <DimCompare
          label="Efficiency"
          scoreA={sessionA?.scores.valueEfficiency?.score}
          scoreB={sessionB?.scores.valueEfficiency?.score}
        />
        <DimCompare
          label="Relevance"
          scoreA={sessionA?.scores.uxSignal.score}
          scoreB={sessionB?.scores.uxSignal.score}
        />
        <DimCompare
          label="Safety"
          scoreA={sessionA?.scores.harmony?.score}
          scoreB={sessionB?.scores.harmony?.score}
        />
        <DimCompare
          label="Consistency"
          scoreA={sessionA?.scores.stability?.score}
          scoreB={sessionB?.scores.stability?.score}
        />
        <DimCompare
          label="Tool Use"
          scoreA={sessionA?.scores.agency?.score}
          scoreB={sessionB?.scores.agency?.score}
        />
      </Box>
    </Paper>
  );
}

export default function CompareRunsView({ projectId, runIdA, runIdB, navigate }: Props) {
  const project = getProject(projectId);
  const runA = getRun(projectId, runIdA);
  const runB = getRun(projectId, runIdB);

  if (!project || !runA || !runB) {
    return <Box sx={{ p: 3 }}><Typography>Run data not found.</Typography></Box>;
  }

  const bands = projectVerdictBands(project);

  const passRateA = runA.sessions.filter((s) => s.verdict === "PASS").length / runA.sessions.length * 100;
  const passRateB = runB.sessions.filter((s) => s.verdict === "PASS").length / runB.sessions.length * 100;

  const avgA = runA.sessions.length
    ? Math.round(runA.sessions.reduce((sum, s) => sum + sessionCompositeScore(s), 0) / runA.sessions.length)
    : 0;
  const avgB = runB.sessions.length
    ? Math.round(runB.sessions.reduce((sum, s) => sum + sessionCompositeScore(s), 0) / runB.sessions.length)
    : 0;

  const allScenarios = Array.from(
    new Set([
      ...runA.sessions.map((s) => s.scenario),
      ...runB.sessions.map((s) => s.scenario),
    ])
  );

  return (
    <Box sx={{ p: 3, maxWidth: 1100 }}>
      {/* Breadcrumb */}
      <Box sx={{ display: "flex", gap: 0.5, alignItems: "center", mb: 2 }}>
        <Button size="small" onClick={() => navigate({ name: "agents" })} sx={{ color: "text.disabled" }}>Agents</Button>
        <Typography sx={{ color: "text.disabled" }}>/</Typography>
        <Button size="small" onClick={() => navigate({ name: "project", projectId })} sx={{ color: "text.disabled" }}>
          {project.name}
        </Button>
        <Typography sx={{ color: "text.disabled" }}>/</Typography>
        <Typography variant="body2" sx={{ color: "text.primary", fontWeight: 500, px: 0.5 }}>
          Compare Runs
        </Typography>
      </Box>

      {/* Summary header */}
      <Paper sx={{ p: 2.5, mb: 3, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          Run Comparison
        </Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: "text.disabled", fontWeight: 600 }}></TableCell>
              <TableCell sx={{ color: "text.secondary", fontWeight: 700 }}>Run A — {runA.label}</TableCell>
              <TableCell sx={{ color: "text.secondary", fontWeight: 700 }}>Run B — {runB.label}</TableCell>
              <TableCell sx={{ color: "text.disabled", fontWeight: 600 }}>Delta (A − B)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell sx={{ color: "text.disabled" }}>Date</TableCell>
              <TableCell>{runA.date}</TableCell>
              <TableCell>{runB.date}</TableCell>
              <TableCell>—</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ color: "text.disabled" }}>Sessions</TableCell>
              <TableCell>{runA.sessions.length}</TableCell>
              <TableCell>{runB.sessions.length}</TableCell>
              <TableCell>—</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ color: "text.disabled" }}>Pass rate</TableCell>
              <TableCell>
                <Typography sx={{ fontWeight: 700, color: passRateA >= 75 ? "success.main" : "warning.main", fontSize: "0.875rem" }}>
                  {Math.round(passRateA)}%
                </Typography>
              </TableCell>
              <TableCell>
                <Typography sx={{ fontWeight: 700, color: passRateB >= 75 ? "success.main" : "warning.main", fontSize: "0.875rem" }}>
                  {Math.round(passRateB)}%
                </Typography>
              </TableCell>
              <TableCell>
                <Typography sx={{ fontWeight: 700, fontFamily: "monospace", fontSize: "0.875rem", color: passRateA - passRateB > 0 ? "success.main" : passRateA - passRateB < 0 ? "error.main" : "text.secondary" }}>
                  {passRateA - passRateB > 0 ? "+" : ""}{Math.round(passRateA - passRateB)}pp
                </Typography>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ color: "text.disabled" }}>Avg composite</TableCell>
              <TableCell>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <GradeChip grade={sessionGrade(avgA)} size="small" />
                  <Typography sx={{ fontWeight: 700, fontFamily: "monospace", fontSize: "0.875rem" }}>{avgA}/100</Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <GradeChip grade={sessionGrade(avgB)} size="small" />
                  <Typography sx={{ fontWeight: 700, fontFamily: "monospace", fontSize: "0.875rem" }}>{avgB}/100</Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Typography sx={{ fontWeight: 700, fontFamily: "monospace", fontSize: "0.875rem", color: avgA - avgB > 0 ? "success.main" : avgA - avgB < 0 ? "error.main" : "text.secondary" }}>
                  {avgA - avgB > 0 ? "+" : ""}{avgA - avgB} pts
                </Typography>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ color: "text.disabled" }}>Significance</TableCell>
              <TableCell colSpan={2}>
                <Typography variant="caption" sx={{ color: "text.disabled" }}>
                  Paired comparison · {Math.min(runA.sessions.length, runB.sessions.length)} matched sessions
                </Typography>
              </TableCell>
              <TableCell>
                {(() => {
                  const d = Math.abs(avgA - avgB);
                  const n = Math.min(runA.sessions.length, runB.sessions.length);
                  if (n < 3) return <Chip label="Too few sessions" size="small" variant="outlined" sx={{ fontSize: "0.62rem", color: "text.disabled" }} />;
                  if (d >= 10) return <Chip label="Likely significant" size="small" color="success" sx={{ fontSize: "0.62rem" }} />;
                  if (d >= 5) return <Chip label="May be noise" size="small" color="warning" sx={{ fontSize: "0.62rem" }} />;
                  return <Chip label="Within noise" size="small" variant="outlined" sx={{ fontSize: "0.62rem", color: "text.secondary" }} />;
                })()}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <Typography variant="caption" sx={{ color: "text.disabled", display: "block", px: 2, py: 1 }}>
          Significance: deltas ≥10 pts likely significant; &lt;5 pts likely within noise. Increase session count to narrow confidence intervals.
        </Typography>
      </Paper>

      {/* Per-scenario comparison */}
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
        Scenario Breakdown
      </Typography>
      {allScenarios.map((scenario) => {
        const sA = runA.sessions.find((s) => s.scenario === scenario);
        const sB = runB.sessions.find((s) => s.scenario === scenario);
        return (
          <ScenarioMatch
            key={scenario}
            scenario={scenario}
            sessionA={sA}
            sessionB={sB}
            navigate={navigate}
            projectId={projectId}
            runIdA={runIdA}
            runIdB={runIdB}
            bands={bands}
          />
        );
      })}
    </Box>
  );
}
