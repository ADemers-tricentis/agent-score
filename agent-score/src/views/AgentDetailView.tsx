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
import Chip from "@mui/material/Chip";
import Tooltip from "@mui/material/Tooltip";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Divider from "@mui/material/Divider";
import type { View } from "../types";
import { getProject, runPassRate, addMockTracesToProject } from "../data/mock";
import { agentVerdict, sessionVerdict, projectVerdictBands, scoreToken, RUN_STATE_META } from "../data/verdict";
import { SAFETY_SIGNAL_LABEL } from "../data/dimensions";
import VerdictChip from "../components/VerdictChip";
import GradeChip from "../components/GradeChip";

interface Props {
  projectId: string;
  navigate: (v: View) => void;
}

const TREND_ICON = "M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z";
const GAUGE_ICON = "M20.38 8.57l-1.23 1.85a8 8 0 0 1-.22 7.58H5.07A8 8 0 0 1 15.58 6.85l1.85-1.23A10 10 0 0 0 3.35 19a2 2 0 0 0 1.72 1h13.85a2 2 0 0 0 1.74-1 10 10 0 0 0 .6-10.44zm-9.79 6.84a2 2 0 0 0 2.83 0l5.66-8.49-8.49 5.66a2 2 0 0 0 0 2.83z";
const WARN_ICON = "M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z";

const OVERVIEW_ICON = "M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z";
const TRACES_ICON = "M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z";
const LABELING_ICON = "M17.63 5.84C17.27 5.33 16.67 5 16 5L5 5.01C3.9 5.01 3 5.9 3 7v10c0 1.1.9 1.99 2 1.99L16 19c.67 0 1.27-.33 1.63-.84L22 12l-4.37-6.16z";
const SETTINGS_ICON = "M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94L14.4 2.81c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41L9.25 5.35C8.66 5.59 8.12 5.92 7.63 6.29L5.24 5.33c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.63-.07.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.03-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z";

const TABS = [
  { value: "overview",  label: "Overview",  icon: OVERVIEW_ICON },
  { value: "traces",    label: "Traces",    icon: TRACES_ICON   },
  { value: "scoring",   label: "Scoring",   icon: GAUGE_ICON    },
  { value: "labeling",  label: "Labeling",  icon: LABELING_ICON },
  { value: "settings",  label: "Settings",  icon: SETTINGS_ICON },
] as const;

export default function AgentDetailView({ projectId, navigate }: Props) {
  const [refreshKey, setRefreshKey] = useState(0);
  void refreshKey;

  const project = getProject(projectId);

  if (!project) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Agent not found.</Typography>
      </Box>
    );
  }

  const svcName = (project.service ?? project.name).toLowerCase().replace(/\s+/g, "-");

  function handleSimulateTraces() {
    addMockTracesToProject(projectId);
    setRefreshKey((k) => k + 1);
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

  const createdDate = (() => {
    const d = runs[runs.length - 1]?.date ?? project.events?.[0]?.ts;
    if (!d) return null;
    return new Date(d).toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric", timeZone: "UTC" });
  })();

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

  function handleTabChange(_: React.SyntheticEvent, tab: string) {
    if (tab === "overview") return;
    if (tab === "settings") {
      navigate({ name: "agent-settings", projectId });
      return;
    }
    navigate({ name: "project", projectId, initialTab: tab });
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Agent header */}
      <Box sx={{ px: 3, pt: 2.5, pb: 0, bgcolor: "background.paper" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
          <Box sx={{ width: 32, height: 32, borderRadius: 1, border: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <SvgIcon sx={{ fontSize: "1rem", color: "text.secondary" }}>
              <path d="M20 9V7c0-1.1-.9-2-2-2h-3c0-1.66-1.34-3-3-3S9 3.34 9 5H6c-1.1 0-2 .9-2 2v2c-1.66 0-3 1.34-3 3s1.34 3 3 3v4c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-4c1.66 0 3-1.34 3-3s-1.34-3-3-3zm-2 10H6V7h12v12zm-9-6c-.83 0-1.5-.67-1.5-1.5S8.17 10 9 10s1.5.67 1.5 1.5S9.83 13 9 13zm6 0c-.83 0-1.5-.67-1.5-1.5S14.17 10 15 10s1.5.67 1.5 1.5S15.83 13 15 13zm-5 3h4v-2h-4v2z" />
            </SvgIcon>
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>{project.name}</Typography>
          <Chip label="external" size="small" variant="outlined" sx={{ height: 20, fontSize: "0.7rem" }} />
          {verdict.band ? (
            <VerdictChip band={verdict.band} />
          ) : (
            <Chip
              label={RUN_STATE_META[verdict.state].label}
              size="small"
              color={RUN_STATE_META[verdict.state].muiColor}
              variant="outlined"
              sx={{ height: 22, fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.02em" }}
            />
          )}
        </Box>
        <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 1.5, pl: 6 }}>
          {project.type}{createdDate ? ` · Created ${createdDate}` : ""} · {verdict.reason}
        </Typography>

        {/* Tabs */}
        <Tabs
          value="overview"
          onChange={handleTabChange}
          sx={{ minHeight: 36, "& .MuiTab-root": { minHeight: 36, fontSize: "0.85rem", textTransform: "none", py: 0 } }}
        >
          {TABS.map(({ value, label, icon }) => (
            <Tab
              key={value}
              value={value}
              label={label}
              icon={<SvgIcon sx={{ fontSize: "0.95rem !important" }}><path d={icon} /></SvgIcon>}
              iconPosition="start"
            />
          ))}
        </Tabs>
        <Divider />
      </Box>

      {/* Overview content */}
      <Box sx={{ flex: 1, overflow: "auto", p: 3, display: "flex", flexDirection: "column", gap: 3 }}>
        {/* Safety override banner */}
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

        {/* Trace collection banner */}
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

        {/* Stats grid */}
        <Box sx={{ display: "grid", gridTemplateColumns: "260px 1fr 1fr", gridTemplateRows: "auto auto", gap: 2 }}>
          {/* Composite Score - spans 2 rows */}
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

          {/* Traces (24H) */}
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

          {/* P95 Latency */}
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

          {/* Token Spend (24H) */}
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

          {/* Errors */}
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

        {/* Recent traces */}
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 1.5 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Recent traces</Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>Last 5 spans ingested for this agent</Typography>
            </Box>
            <Button
              size="small"
              variant="text"
              onClick={() => navigate({ name: "project", projectId, initialTab: "traces" })}
              sx={{ color: "primary.main", fontSize: "0.75rem" }}
            >
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
                    onClick={() => navigate({ name: "project", projectId, initialTab: "traces", initialTraceId: s.id })}
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

        {/* Recent scoring runs */}
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 1.5 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Recent scoring runs</Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>Latest 3 runs for this agent</Typography>
            </Box>
            <Button
              size="small"
              variant="text"
              onClick={() => navigate({ name: "project", projectId, initialTab: "scoring" })}
              sx={{ color: "primary.main", fontSize: "0.75rem" }}
            >
              View all →
            </Button>
          </Box>
          {runs.length === 0 ? (
            <Box sx={{ py: 3, display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
              <SvgIcon sx={{ color: "text.disabled", fontSize: "2rem" }}>
                <path d={GAUGE_ICON} />
              </SvgIcon>
              <Typography variant="body2" sx={{ fontWeight: 600, color: "text.secondary" }}>No scoring runs yet</Typography>
              <Typography variant="caption" sx={{ color: "text.disabled" }}>Trigger a scoring run from the Scoring tab.</Typography>
            </Box>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>Run</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "text.secondary", width: 120 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "text.secondary", width: 90 }}>Pass rate</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "text.secondary", width: 110 }}>Verdict</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {runs.slice(0, 3).map((run) => {
                  const pr = runPassRate(run.sessions);
                  const scored = run.status === "scored";
                  return (
                    <TableRow
                      key={run.id}
                      hover={scored}
                      onClick={() => scored && navigate({ name: "run", projectId, runId: run.id })}
                      sx={{ cursor: scored ? "pointer" : "default", "&:last-child td": { borderBottom: 0 } }}
                    >
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{run.label}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                          {new Date(run.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {!scored ? (
                          <Typography variant="body2" sx={{ color: "text.disabled" }}>-</Typography>
                        ) : (
                          <Typography variant="body2" sx={{ fontWeight: 600, color: scoreToken(pr) }}>
                            {pr}%
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
    </Box>
  );
}
