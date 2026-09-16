import { useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import LinearProgress from "@mui/material/LinearProgress";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import SvgIcon from "@mui/material/SvgIcon";
import Tooltip from "@mui/material/Tooltip";
import type { View, Project, Run } from "../../types";
import { runPassRate, addMockTracesToProject, addRunToProject, sessionsCompositeScore, sessionGrade, useMockData } from "../../data/mock";
import { agentVerdict, sessionVerdict, projectVerdictBands, scoreToken, RUN_STATE_META } from "../../data/verdict";
import { SAFETY_SIGNAL_LABEL } from "../../data/dimensions";
import VerdictChip from "../../components/VerdictChip";
import GradeChip from "../../components/GradeChip";
import { SCORE_STAGES } from "./shared";

interface Props {
  project: Project;
  navigate: (v: View) => void;
}

const TREND_ICON = "M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z";
const GAUGE_ICON = "M20.38 8.57l-1.23 1.85a8 8 0 0 1-.22 7.58H5.07A8 8 0 0 1 15.58 6.85l1.85-1.23A10 10 0 0 0 3.35 19a2 2 0 0 0 1.72 1h13.85a2 2 0 0 0 1.74-1 10 10 0 0 0 .6-10.44zm-9.79 6.84a2 2 0 0 0 2.83 0l5.66-8.49-8.49 5.66a2 2 0 0 0 0 2.83z";
const WARN_ICON = "M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z";

export default function ScoreTab({ project: projectProp, navigate }: Props) {
  useMockData();
  const [isScoringNow, setIsScoringNow] = useState(false);
  const [scoringStage, setScoringStage] = useState(0);

  const project = projectProp;
  const projectId = project.id;
  const svcName = (project.service ?? project.name).toLowerCase().replace(/\s+/g, "-");

  function handleSimulateTraces() {
    addMockTracesToProject(projectId);
  }

  function handleScoreNow() {
    setIsScoringNow(true);
    setScoringStage(0);
    SCORE_STAGES.forEach((_, i) => {
      setTimeout(() => {
        setScoringStage(i);
        if (i === SCORE_STAGES.length - 1) {
          setTimeout(() => {
            const lastRun = project.runs[0];
            const now = new Date();
            const clamp = (v: number) => Math.max(20, Math.min(100, Math.round(v)));
            const newRun: Run = {
              id: `r-od-${Date.now()}`,
              label: `On-demand run · ${now.toLocaleDateString()}`,
              date: now.toISOString().slice(0, 10),
              status: "scored",
              sessions: (lastRun?.sessions ?? []).map((s, idx) => ({
                ...s,
                id: `s-od-${idx}-${Date.now()}`,
                ts: now.toISOString(),
                scores: {
                  ...s.scores,
                  benchmarkPerformance: { ...s.scores.benchmarkPerformance, score: clamp(s.scores.benchmarkPerformance.score + Math.round((Math.random() - 0.45) * 10)) },
                  uxSignal: { ...s.scores.uxSignal, score: clamp(s.scores.uxSignal.score + Math.round((Math.random() - 0.45) * 8)) },
                  ...(s.scores.valueEfficiency ? { valueEfficiency: { ...s.scores.valueEfficiency, score: clamp(s.scores.valueEfficiency.score + Math.round((Math.random() - 0.45) * 8)) } } : {}),
                },
              })),
            };
            addRunToProject(projectId, newRun);
            setIsScoringNow(false);
          }, 600);
        }
      }, i * 700);
    });
  }

  const runs = project.runs ?? [];
  const allSessions = runs.flatMap((r) => r.sessions);
  const totalSessions = allSessions.length;
  const tracesNeeded = 20;
  const hasEnoughTraces = totalSessions >= tracesNeeded;
  const latestRun = runs[0];
  const latestSessions = latestRun?.sessions ?? [];
  const verdict = agentVerdict(project);
  const bands = projectVerdictBands(project);
  const composite = verdict.score ?? 0;
  const grade = verdict.grade ?? "F";
  const criticalSession = latestRun?.sessions.find((s) => s.safetyOverride?.severity === "Critical");
  const circumference = 2 * Math.PI * 40;
  const breakdownSession = latestSessions.find((s) => s.scores.benchmarkPerformance.sigs.length > 0) ?? latestSessions[0] ?? null;

  const p95DurMs = (() => {
    const durations = allSessions.map((s) => s.dur).sort((a, b) => a - b);
    if (!durations.length) return null;
    return durations[Math.floor(durations.length * 0.95)] ?? durations[durations.length - 1];
  })();

  const latestRunCosts = latestSessions
    .map((s) => {
      const sig = (s.scores.valueEfficiency?.sigs ?? []).find((x) => x.startsWith("p95_tail_cost:"));
      if (!sig) return null;
      const val = parseFloat(sig.replace(/^p95_tail_cost:\s*\$/, ""));
      return isNaN(val) ? null : val;
    })
    .filter((v): v is number => v !== null);
  const totalTokenSpend = latestRunCosts.length > 0 ? latestRunCosts.reduce((a, b) => a + b, 0) : null;
  const failCount = allSessions.filter((s) => s.verdict === "FAIL").length;

  const scoredRuns = runs.filter((r) => r.status === "scored");

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {criticalSession?.safetyOverride && (
        <Alert
          severity="error"
          sx={{ borderRadius: 1.5 }}
          action={
            <Button
              size="small"
              color="error"
              variant="outlined"
              onClick={() => navigate({ name: "session", projectId, runId: latestRun!.id, sessionId: criticalSession.id })}
              sx={{ whiteSpace: "nowrap", fontSize: "0.72rem" }}
            >
              View failing session →
            </Button>
          }
        >
          <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.25 }}>
            Safety override · {SAFETY_SIGNAL_LABEL[criticalSession.safetyOverride.signal] ?? criticalSession.safetyOverride.signal}
          </Typography>
          <Typography variant="caption">{criticalSession.safetyOverride.detail}</Typography>
        </Alert>
      )}

      {!hasEnoughTraces && (
        <Alert
          severity="info"
          sx={{ borderRadius: 1.5 }}
          action={
            <Button size="small" color="info" variant="outlined" onClick={handleSimulateTraces} sx={{ whiteSpace: "nowrap", fontSize: "0.72rem" }}>
              Simulate 20 traces
            </Button>
          }
        >
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.25 }}>Keep sending traces</Typography>
          <Typography variant="caption">
            Scoring unlocks automatically at {tracesNeeded} traces. You have {totalSessions} so far - keep running your agent and we'll take care of the rest.
          </Typography>
        </Alert>
      )}

      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
        <Button variant="contained" onClick={handleScoreNow} disabled={isScoringNow || !hasEnoughTraces}>
          {isScoringNow ? SCORE_STAGES[scoringStage] : "Score now"}
        </Button>
        <Typography variant="caption" sx={{ color: "text.disabled" }}>
          {hasEnoughTraces ? "Auto-scores daily · Next: 02:00 UTC" : `Needs ${tracesNeeded - totalSessions} more traces before scoring`}
        </Typography>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: "260px 1fr 1fr", gridTemplateRows: "auto auto", gap: 2 }}>
        <Paper
          variant="outlined"
          onClick={() => hasEnoughTraces && breakdownSession && navigate({ name: "score-breakdown", projectId, runId: latestRun!.id, sessionId: breakdownSession.id })}
          sx={{
            p: 2.5, borderRadius: 1.5, gridRow: "1 / 3", gridColumn: "1 / 2", display: "flex", flexDirection: "column",
            cursor: hasEnoughTraces && breakdownSession ? "pointer" : "default",
            borderColor: verdict.safety?.severity === "Critical" ? "error.main" : "divider",
            transition: "border-color 0.15s",
            "&:hover": hasEnoughTraces && breakdownSession ? { borderColor: verdict.safety?.severity === "Critical" ? "error.dark" : "primary.main" } : {},
          }}
        >
          <Typography variant="overline" sx={{ color: "text.disabled", letterSpacing: 0.8, fontSize: "0.65rem" }}>Composite Score</Typography>
          {hasEnoughTraces ? (
            <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 1 }}>
              Based on all scored sessions
            </Typography>
          ) : (
            <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 1 }}>
              No completed run yet
            </Typography>
          )}
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, justifyContent: "center", py: 1 }}>
            {hasEnoughTraces ? (
              <Box sx={{ position: "relative", display: "inline-flex", mb: 1 }}>
                <svg width="100" height="100" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="var(--mui-palette-divider)" strokeWidth="5" />
                  <circle cx="50" cy="50" r="40" fill="none"
                    stroke={`var(--mui-palette-${verdict.band ? { ship: "success", review: "warning", block: "error" }[verdict.band] : "warning"}-main)`}
                    strokeWidth="5" strokeLinecap="round"
                    strokeDasharray={`${(composite / 100) * circumference} ${circumference}`}
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <Box sx={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <GradeChip grade={grade} size="small" />
                  <Typography variant="caption" sx={{ fontWeight: 700, mt: 0.25, fontFamily: "monospace" }}>{composite}/100</Typography>
                </Box>
              </Box>
            ) : (
              <>
                <Box sx={{ position: "relative", width: 100, height: 100 }}>
                  <svg width="100" height="100" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="var(--mui-palette-divider)" strokeWidth="4" strokeDasharray="6 4" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="var(--mui-palette-primary-main)" strokeWidth="4" strokeLinecap="round"
                      strokeDasharray={`${(totalSessions / tracesNeeded) * circumference} ${circumference}`}
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <Box sx={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0.25 }}>
                    <SvgIcon sx={{ fontSize: "1rem", color: "text.disabled" }}>
                      <path d={GAUGE_ICON} />
                    </SvgIcon>
                    <Typography variant="caption" sx={{ fontWeight: 700, fontSize: "0.72rem", lineHeight: 1 }}>{totalSessions} / {tracesNeeded}</Typography>
                  </Box>
                </Box>
                <Box sx={{ width: "80%", mt: 1.5 }}>
                  <LinearProgress variant="determinate" value={(totalSessions / tracesNeeded) * 100} sx={{ borderRadius: 1, height: 4 }} />
                </Box>
              </>
            )}
          </Box>
          <Typography variant="caption" sx={{ color: "text.secondary", display: "block", textAlign: "center", mt: 1 }}>
            {hasEnoughTraces ? `${totalSessions} traces collected` : `Scoring unlocks at ${tracesNeeded} traces`}
          </Typography>
          {hasEnoughTraces && (
            <Typography variant="caption" sx={{ color: scoreToken(composite), fontWeight: 600, display: "block", textAlign: "center", mt: 0.25 }}>
              {verdict.reason}
            </Typography>
          )}
        </Paper>

        <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 0.5 }}>
            <Typography variant="overline" sx={{ color: "text.disabled", letterSpacing: 0.8, fontSize: "0.65rem" }}>Traces (24H)</Typography>
            <SvgIcon sx={{ fontSize: "0.9rem", color: "text.disabled", mt: 0.25 }}>
              <path d={TREND_ICON} />
            </SvgIcon>
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 700, my: 0.5 }}>{latestSessions.length}</Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {latestSessions.length > 0 ? `From ${latestRun?.label}` : "Live ingestion active"}
          </Typography>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5 }}>
          <Tooltip title="How long the slowest 5% of runs took to finish - a better gauge of user-facing pain than the average." arrow placement="top">
            <Typography variant="overline" sx={{ color: "text.disabled", letterSpacing: 0.8, fontSize: "0.65rem", display: "block", mb: 0.5, width: "fit-content", cursor: "help" }}>P95 Latency</Typography>
          </Tooltip>
          {hasEnoughTraces && p95DurMs != null ? (
            <>
              <Typography variant="h5" sx={{ fontWeight: 700, my: 0.5 }}>
                {p95DurMs >= 60000 ? `${(p95DurMs / 60000).toFixed(1)}m` : `${(p95DurMs / 1000).toFixed(1)}s`}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>Across all sessions</Typography>
            </>
          ) : (
            <>
              <Typography variant="h5" sx={{ fontWeight: 700, my: 0.5, color: "text.disabled" }}>-</Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {hasEnoughTraces ? "Across all sessions" : "Unlocks at 20 traces"}
              </Typography>
            </>
          )}
        </Paper>

        <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5 }}>
          <Typography variant="overline" sx={{ color: "text.disabled", letterSpacing: 0.8, fontSize: "0.65rem", display: "block", mb: 0.5 }}>Token Spend (24H)</Typography>
          {totalTokenSpend != null ? (
            <>
              <Typography variant="h5" sx={{ fontWeight: 700, my: 0.5 }}>${totalTokenSpend.toFixed(2)}</Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {latestRunCosts.length} session{latestRunCosts.length !== 1 ? "s" : ""} · ${(totalTokenSpend / latestRunCosts.length).toFixed(2)} avg
              </Typography>
            </>
          ) : (
            <>
              <Typography variant="h5" sx={{ fontWeight: 700, my: 0.5, color: "text.disabled" }}>-</Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>Unlocks at 20 traces</Typography>
            </>
          )}
        </Paper>

        <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 0.5 }}>
            <Typography variant="overline" sx={{ color: "text.disabled", letterSpacing: 0.8, fontSize: "0.65rem" }}>Errors</Typography>
            <SvgIcon sx={{ fontSize: "0.9rem", color: hasEnoughTraces && failCount > 0 ? "warning.main" : "text.disabled", mt: 0.25 }}>
              <path d={WARN_ICON} />
            </SvgIcon>
          </Box>
          {hasEnoughTraces ? (
            <>
              <Typography variant="h5" sx={{ fontWeight: 700, my: 0.5, color: failCount > 0 ? "error.main" : "text.primary" }}>{failCount}</Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>FAIL sessions across all runs</Typography>
            </>
          ) : (
            <>
              <Typography variant="h5" sx={{ fontWeight: 700, my: 0.5, color: "text.disabled" }}>-</Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>Unlocks at 20 traces</Typography>
            </>
          )}
        </Paper>
      </Box>

      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 1.5 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Recent traces</Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>Last 5 spans ingested for this agent</Typography>
          </Box>
          <Button size="small" variant="text" onClick={() => navigate({ name: "agent", projectId, tab: "traces" })} sx={{ color: "primary.main", fontSize: "0.75rem" }}>
            View all →
          </Button>
        </Box>
        {latestSessions.length === 0 ? (
          <Box sx={{ py: 3, display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
            <SvgIcon sx={{ color: "text.disabled", fontSize: "2rem" }}>
              <path d={TREND_ICON} />
            </SvgIcon>
            <Typography variant="body2" sx={{ fontWeight: 600, color: "text.secondary" }}>No traces yet</Typography>
            <Typography variant="caption" sx={{ color: "text.disabled" }}>No traces have been ingested for this agent yet.</Typography>
          </Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>Trace</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.secondary", width: 140 }}>Time</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.secondary", width: 100 }}>Verdict</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {latestSessions.slice(0, 5).map((s) => (
                <TableRow
                  key={s.id}
                  hover
                  onClick={() => navigate({ name: "agent", projectId, tab: "traces", initialTraceId: s.id })}
                  sx={{ cursor: "pointer", "&:last-child td": { borderBottom: 0 } }}
                >
                  <TableCell>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
                      <Typography variant="caption" sx={{ fontFamily: "monospace", fontWeight: 600, color: "primary.main" }}>
                        invoke_agent {svcName}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.72rem" }}>{s.scenario}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      {new Date(s.ts).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </Typography>
                  </TableCell>
                  <TableCell><VerdictChip band={sessionVerdict(s, bands).band} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 1.5 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Scoring history</Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>Every scoring run for this agent, newest first</Typography>
          </Box>
          {runs.length >= 2 && (
            <Button
              size="small"
              variant="outlined"
              color="inherit"
              sx={{ color: "text.secondary" }}
              onClick={() => navigate({ name: "compare-runs", projectId, runIdA: runs[0].id, runIdB: runs[1].id })}
            >
              Compare runs
            </Button>
          )}
        </Box>
        {runs.length === 0 ? (
          <Box sx={{ py: 3, display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
            <SvgIcon sx={{ color: "text.disabled", fontSize: "2rem" }}>
              <path d={GAUGE_ICON} />
            </SvgIcon>
            <Typography variant="body2" sx={{ fontWeight: 600, color: "text.secondary" }}>No scoring runs yet</Typography>
            <Typography variant="caption" sx={{ color: "text.disabled" }}>Score now to see results here.</Typography>
          </Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>Run</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.secondary", width: 110 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.secondary", width: 90 }}>Pass rate</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.secondary", width: 80 }}>Grade</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.secondary", width: 90 }}>Score change</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.secondary", width: 110 }}>Verdict</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {runs.slice(0, 8).map((run) => {
                const pr = runPassRate(run.sessions);
                const scored = run.status === "scored";
                const runScore = scored ? sessionsCompositeScore(run.sessions) : null;
                const priorScoredRun = scoredRuns.find((r) => scoredRuns.indexOf(r) > scoredRuns.indexOf(run));
                const delta = scored && priorScoredRun ? runScore! - sessionsCompositeScore(priorScoredRun.sessions) : null;
                return (
                  <TableRow
                    key={run.id}
                    hover={scored}
                    onClick={() => scored && navigate({ name: "agent-run", projectId, runId: run.id })}
                    sx={{ cursor: scored ? "pointer" : "default", "&:last-child td": { borderBottom: 0 } }}
                  >
                    <TableCell><Typography variant="body2" sx={{ fontWeight: 500 }}>{run.label}</Typography></TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        {new Date(run.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {!scored ? <Typography variant="body2" sx={{ color: "text.disabled" }}>-</Typography> : (
                        <Typography variant="body2" sx={{ fontWeight: 600, color: scoreToken(pr) }}>{pr}%</Typography>
                      )}
                    </TableCell>
                    <TableCell>{scored ? <GradeChip grade={sessionGrade(runScore!)} size="small" /> : <Typography variant="body2" sx={{ color: "text.disabled" }}>-</Typography>}</TableCell>
                    <TableCell>
                      {delta == null ? <Typography variant="body2" sx={{ color: "text.disabled" }}>-</Typography> : (
                        <Typography variant="body2" sx={{ fontWeight: 600, color: delta >= 0 ? "success.main" : "error.main" }}>
                          {delta >= 0 ? "+" : ""}{delta.toFixed(0)}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {!scored || !run.sessions[0]
                        ? <Typography variant="body2" sx={{ color: "text.disabled" }}>{RUN_STATE_META[run.status].label}</Typography>
                        : <VerdictChip band={sessionVerdict(run.sessions[0], bands).band} />}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Paper>
    </Box>
  );
}
