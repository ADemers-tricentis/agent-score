import { useState, useMemo, useCallback } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import LinearProgress from "@mui/material/LinearProgress";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import SvgIcon from "@mui/material/SvgIcon";
import ChipStatus from "@tricentis/aura/components/ChipStatus.js";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import ChipSubtle from "@tricentis/aura/components/ChipSubtle.js";
import Alert from "@mui/material/Alert";
import TextField from "@mui/material/TextField";
import type { View, Run, Session, Project, ActivityEventKind } from "../types";
import Chip from "@mui/material/Chip";
import Collapse from "@mui/material/Collapse";
import { getProject, runPassRate, getEvalDesign, computePassK, projectCompositeScore, sessionGrade, getAdoptedProfile, isScorePreliminary, addRunToProject, addMockTracesToProject, LLM_JUDGES, PROFILES, updateProject } from "../data/mock";
import VerdictBadge from "../components/VerdictBadge";
import TypeTag from "../components/TypeTag";
import GradeChip from "../components/GradeChip";
import ScorecardPanel from "../components/ScorecardPanel";
import ScoringProfilePanel from "../components/ScoringProfilePanel";

// ── Span explorer helpers ────────────────────────────────────────────────────

interface MockSpan {
  id: string;
  parentId?: string;
  name: string;
  kind: "agent" | "llm" | "tool";
  model?: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  offsetMs: number;
  durationMs: number;
  input: string;
  output: string;
}

const TOOL_NAMES_BY_TYPE: Record<string, string[]> = {
  ATA: ["run_test_suite", "get_test_results", "generate_test_case", "compare_baselines"],
  ATC: ["fetch_coverage_report", "generate_test_cases", "validate_assertions", "get_existing_tests"],
  CURA: ["query_metrics", "emit_diagnosis_report", "get_alert_history", "correlate_events"],
  AI_WORKSPACE: ["search_knowledge_base", "fetch_document", "summarize_content", "draft_text"],
  CODING: ["fetch_diff", "check_style_rules", "post_review_comment", "get_pr_context"],
  APT: ["query_traces", "aggregate_metrics", "trigger_baseline", "get_slo_status"],
};

const LLM_MODELS = ["claude-sonnet-4-6", "claude-haiku-4-5", "claude-opus-4-8"];

function di(seed: string, range: number, salt: number): number {
  let h = salt * 2654435769;
  for (const c of seed) h = (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0;
  return h % range;
}

function generateSpans(session: Session, project: Project): MockSpan[] {
  const s = session.id;
  const model = LLM_MODELS[di(s, LLM_MODELS.length, 1)];
  const tools = TOOL_NAMES_BY_TYPE[project.type] ?? TOOL_NAMES_BY_TYPE.ATA;
  const toolCount = 1 + di(s, 3, 2);
  const rootDur = session.dur;
  const svcName = (project.service ?? project.name).toLowerCase().replace(/\s+/g, "-");
  const ok = session.verdict !== "FAIL";

  const rootIn = 24 + di(s, 60, 3);
  const rootOut = 12 + di(s, 80, 4);

  const spans: MockSpan[] = [{
    id: `${s}-root`,
    name: `invoke_agent ${svcName}`,
    kind: "agent",
    model,
    inputTokens: rootIn + rootOut,
    outputTokens: rootOut,
    costUsd: rootIn * 0.000003 + rootOut * 0.000015,
    offsetMs: 0,
    durationMs: rootDur,
    input: `"${session.scenario}"`,
    output: ok
      ? `"Evaluation complete. Score: ${session.scores.benchmarkPerformance.score}/100."`
      : `"Evaluation failed. Critical threshold not reached."`,
  }];

  let offset = Math.round(rootDur * 0.04);

  const llm1In = 18 + di(s, 50, 6); const llm1Out = 25 + di(s, 100, 7);
  const llm1Dur = Math.round(rootDur * (0.18 + di(s, 15, 5) / 100));
  const planTexts: Record<string, string> = {
    ATA: "I'll run the test suite, collect results, and evaluate against thresholds.",
    ATC: "I'll analyze coverage gaps and generate targeted test cases.",
    CURA: "I'll query metrics, correlate alerts, and build a root cause hypothesis.",
    CODING: "I'll fetch the diff, apply style rules, and flag issues.",
    APT: "I'll pull trace data, compare with baseline, and flag regressions.",
    AI_WORKSPACE: "I'll gather context, analyze the request, and draft a response.",
  };
  spans.push({
    id: `${s}-llm-0`, parentId: `${s}-root`,
    name: `chat.completions ${model}`, kind: "llm", model,
    inputTokens: llm1In, outputTokens: llm1Out,
    costUsd: llm1In * 0.000003 + llm1Out * 0.000015,
    offsetMs: offset, durationMs: llm1Dur,
    input: `"${session.scenario}"`,
    output: `"${planTexts[project.type] ?? "I'll process this step by step."}"`,
  });
  offset += llm1Dur + Math.round(rootDur * 0.01);

  for (let i = 0; i < toolCount; i++) {
    const toolName = tools[(di(s, tools.length, 8 + i) + i) % tools.length];
    const toolDur = Math.round(rootDur * (0.08 + di(s, 12, 9 + i) / 100));
    const toolInputs: Record<string, string> = {
      run_test_suite: `{ "suite": "regression", "timeout": 60, "filter": "${session.scenario.split("–")[1]?.trim() ?? session.scenario}" }`,
      get_test_results: `{ "run_id": "run-${s.slice(-6)}", "format": "summary" }`,
      generate_test_case: `{ "target": "${session.scenario.split("–")[1]?.trim() ?? session.scenario}", "type": "edge_case" }`,
      fetch_diff: `{ "pr_number": ${1400 + di(s, 200, 15)}, "include_context": true }`,
      check_style_rules: `{ "files": ["src/checkout/payment.ts"], "rules": ["no-unused-vars"] }`,
      query_metrics: `{ "metric": "cpu_usage", "window": "1h", "agg": "p99" }`,
      emit_diagnosis_report: `{ "incident_id": "INC-${s.slice(-4).toUpperCase()}", "severity": "P2" }`,
      query_traces: `{ "service": "${svcName}", "window": "30m", "filter": "latency > 200ms" }`,
      aggregate_metrics: `{ "metric": "request_duration_p99", "group_by": "endpoint" }`,
    };
    const toolOutputs: Record<string, string> = {
      run_test_suite: ok ? `{ "status": "completed", "passed": 12, "failed": 0, "skipped": 1 }` : `{ "status": "error", "passed": 8, "failed": 4 }`,
      get_test_results: `{ "status": "${ok ? "pass" : "fail"}", "score": ${session.scores.benchmarkPerformance.score} }`,
      fetch_diff: `{ "files_changed": ${2 + di(s, 8, 16)}, "additions": 47, "deletions": 12 }`,
      check_style_rules: `{ "violations": ${ok ? 0 : 3}, "warnings": 1 }`,
      query_metrics: ok ? `{ "p99_ms": 145, "p95_ms": 98, "mean_ms": 62 }` : `{ "p99_ms": 412, "p95_ms": 287, "alert": true }`,
      emit_diagnosis_report: `{ "report_id": "diag-${s.slice(-4)}", "status": "${ok ? "resolved" : "investigating"}" }`,
      query_traces: `{ "count": 48, "p99_ms": ${ok ? 182 : 431}, "errors": ${ok ? 1 : 7} }`,
      aggregate_metrics: `{ "p99_ms": ${ok ? 167 : 389}, "slowest": "/api/checkout/confirm" }`,
    };
    spans.push({
      id: `${s}-tool-${i}`, parentId: `${s}-root`,
      name: `tool.${toolName}`, kind: "tool",
      inputTokens: 0, outputTokens: 0, costUsd: 0,
      offsetMs: offset, durationMs: toolDur,
      input: toolInputs[toolName] ?? `{ "input": "${session.scenario}" }`,
      output: toolOutputs[toolName] ?? (ok ? `{ "status": "ok" }` : `{ "status": "error" }`),
    });
    offset += toolDur + Math.round(rootDur * 0.015);
  }

  const llm2In = 30 + di(s, 80, 11); const llm2Out = 40 + di(s, 120, 12);
  const llm2Dur = Math.round(rootDur * (0.15 + di(s, 10, 10) / 100));
  spans.push({
    id: `${s}-llm-1`, parentId: `${s}-root`,
    name: `chat.completions ${model}`, kind: "llm", model,
    inputTokens: llm2In, outputTokens: llm2Out,
    costUsd: llm2In * 0.000003 + llm2Out * 0.000015,
    offsetMs: Math.min(offset, rootDur - llm2Dur - 50), durationMs: llm2Dur,
    input: `"Synthesize tool results and produce final evaluation report."`,
    output: ok
      ? `"All evaluation steps completed. Results validated against scoring profile."`
      : `"Evaluation incomplete. One or more critical checks failed."`,
  });

  return spans;
}

// ── End span helpers ─────────────────────────────────────────────────────────

const SCORE_STAGES = [
  "Fetching recent traces…",
  "Running eval suite…",
  "Aggregating dimension scores…",
  "Finalizing run report…",
];

const EVENT_KIND_CONFIG: Record<ActivityEventKind, { label: string; color: string }> = {
  profile_adopted:        { label: "Profile matched",    color: "primary.main" },
  run_completed:          { label: "Run completed",      color: "success.main" },
  milestone_reached:      { label: "Milestone",          color: "warning.main" },
  decision_override:      { label: "Override",           color: "error.main" },
  profile_version_changed:{ label: "Profile updated",    color: "info.main" },
  regrade_completed:      { label: "Regraded",           color: "text.secondary" },
};

type ProjectTab = "overview" | "traces" | "scoring" | "labeling" | "settings";

interface Props {
  projectId: string;
  initialTab?: string;
  initialTraceId?: string;
  navigate: (v: View) => void;
}

export default function ProjectView({ projectId, initialTab, initialTraceId, navigate }: Props) {
  const project = getProject(projectId);
  const evalDesign = getEvalDesign(projectId);
  const adoptedProfileResult = project?.adoptedProfileId ? getAdoptedProfile(projectId) : null;
  const adoptedProfile = adoptedProfileResult?.profile ?? null;
  const adoptedProfileVersion = adoptedProfileResult?.version ?? null;

  const [isScoringNow, setIsScoringNow] = useState(false);
  const [scoringStage, setScoringStage] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [scoreWindow, setScoreWindow] = useState<"7d" | "30d" | "all">("all");
  const [activeTab, setActiveTab] = useState<ProjectTab>((initialTab as ProjectTab) ?? "overview");
  const [scoringSubTab, setScoringSubTab] = useState<"runs" | "per-version" | "activity" | "schedule">("runs");
  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(initialTraceId ?? null);
  const [selectedSpanId, setSelectedSpanId] = useState<string | null>(null);
  const [metaOpen, setMetaOpen] = useState(false);

  // Describe agent state
  const [describeOpen, setDescribeOpen] = useState(false);
  const [describeMode, setDescribeMode] = useState<"guided" | "expert">("guided");
  const [describePurpose, setDescribePurpose] = useState("");
  const [describeFailures, setDescribeFailures] = useState("");
  const [describeConcerns, setDescribeConcerns] = useState("");
  const [describeSpec, setDescribeSpec] = useState("");
  const [describePhase, setDescribePhase] = useState<"form" | "analyzing" | "result">("form");
  const [describeAnalysisStep, setDescribeAnalysisStep] = useState(0);

  const defaultJudgeId = project?.type === "CODING" || project?.type === "ATC" ? "j3" : project?.type === "APT" ? "j2" : "j1";
  const [selectedJudgeId, setSelectedJudgeId] = useState(project?.llmJudgeId ?? defaultJudgeId);

  if (!project) return <Box sx={{ p: 3 }}><Typography>Project not found.</Typography></Box>;

  const svcName = (project.service ?? project.name).toLowerCase().replace(/\s+/g, "-");

  void refreshKey;

  function handleScoreNow() {
    setIsScoringNow(true);
    setScoringStage(0);
    SCORE_STAGES.forEach((_, i) => {
      setTimeout(() => {
        setScoringStage(i);
        if (i === SCORE_STAGES.length - 1) {
          setTimeout(() => {
            const lastRun = project!.runs[0];
            const now = new Date();
            const clamp = (v: number) => Math.max(20, Math.min(100, Math.round(v)));
            const newRun: Run = {
              id: `r-od-${Date.now()}`,
              label: `On-demand run · ${now.toLocaleDateString()}`,
              date: now.toISOString().slice(0, 10),
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
            setRefreshKey((k) => k + 1);
          }, 600);
        }
      }, i * 700);
    });
  }

  function handleSimulateTraces() {
    addMockTracesToProject(projectId);
    setRefreshKey((k) => k + 1);
  }

  const DESCRIBE_STAGES = [
    "Parsing agent spec…",
    "Matching against profile library…",
    "Comparing with current evals…",
    "Generating recommendations…",
  ];

  const handleDescribeAnalyze = useCallback(() => {
    setDescribePhase("analyzing");
    setDescribeAnalysisStep(0);
    DESCRIBE_STAGES.forEach((_, i) => {
      setTimeout(() => {
        setDescribeAnalysisStep(i);
        if (i === DESCRIBE_STAGES.length - 1) {
          setTimeout(() => setDescribePhase("result"), 700);
        }
      }, i * 900);
    });
  }, []);

  const runs = project?.runs ?? [];
  const filteredRuns = useMemo(() => {
    if (scoreWindow === "all") return runs;
    const mostRecent = runs[0]?.date ? new Date(runs[0].date) : new Date();
    const cutoff = new Date(mostRecent);
    cutoff.setDate(cutoff.getDate() - (scoreWindow === "7d" ? 7 : 30));
    return runs.filter((r) => new Date(r.date) >= cutoff);
  }, [runs, scoreWindow]);

  const allSessions = runs.flatMap((r) => r.sessions);
  const passK = computePassK(project);
  const composite = projectCompositeScore(project);
  const grade = sessionGrade(composite);
  const canCompare = project.runs.length >= 2;
  const isPreliminary = isScorePreliminary(project);
  const confidenceDelta = Math.round(composite * 0.05);
  const totalSessions = allSessions.length;
  const tracesNeeded = 20;
  const hasEnoughTraces = totalSessions >= tracesNeeded;
  const circumference = 2 * Math.PI * 40;

  // Derived stats for overview cards
  const latestRun = runs[0];
  const latestSessions = latestRun?.sessions ?? [];
  const failCount = allSessions.filter((s) => s.verdict === "FAIL").length;
  const p95DurMs = (() => {
    const durations = allSessions.map((s) => s.dur).sort((a, b) => a - b);
    if (!durations.length) return null;
    return durations[Math.floor(durations.length * 0.95)] ?? durations[durations.length - 1];
  })();

  function parseSessionCost(s: Session): number | null {
    const sig = (s.scores.valueEfficiency?.sigs ?? []).find((x) => x.startsWith("p95_tail_cost:"));
    if (!sig) return null;
    const val = parseFloat(sig.replace(/^p95_tail_cost:\s*\$/, ""));
    return isNaN(val) ? null : val;
  }

  const latestRunCosts = latestSessions.map(parseSessionCost).filter((v): v is number => v !== null);
  const totalTokenSpend = latestRunCosts.length > 0 ? latestRunCosts.reduce((a, b) => a + b, 0) : null;

  // Session used for dimension breakdown (first session of latest run with populated sigs)
  const breakdownSession = latestSessions.find((s) => s.scores.benchmarkPerformance.sigs.length > 0) ?? latestSessions[0] ?? null;

  // ── Tab: Overview ────────────────────────────────────────────────────────────

  function renderOverview() {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {/* Scoring animation */}
        {isScoringNow && (
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 1.5, borderColor: "primary.main" }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>Scoring in progress…</Typography>
            <LinearProgress sx={{ borderRadius: 1, height: 6, mb: 2 }} />
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
              {SCORE_STAGES.map((label, i) => (
                <Box key={label} sx={{ display: "flex", alignItems: "center", gap: 1.5, opacity: i <= scoringStage ? 1 : 0.3, transition: "opacity 0.3s" }}>
                  <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: i < scoringStage ? "success.main" : i === scoringStage ? "primary.main" : "divider", flexShrink: 0, transition: "background-color 0.3s" }} />
                  <Typography variant="caption" sx={{ color: i <= scoringStage ? "text.primary" : "text.disabled" }}>{label}</Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        )}

        {/* Stats grid */}
        <Box sx={{ display: "grid", gridTemplateColumns: "260px 1fr 1fr", gridTemplateRows: "auto auto", gap: 2 }}>
          {/* Composite Score */}
          <Paper
            variant="outlined"
            onClick={() => hasEnoughTraces && breakdownSession && navigate({ name: "score-breakdown", projectId, runId: latestRun!.id, sessionId: breakdownSession.id })}
            sx={{
              p: 2.5, borderRadius: 1.5, gridRow: "1 / 3", gridColumn: "1 / 2", display: "flex", flexDirection: "column",
              cursor: hasEnoughTraces && breakdownSession ? "pointer" : "default",
              transition: "border-color 0.15s",
              "&:hover": hasEnoughTraces && breakdownSession ? { borderColor: "primary.main" } : {},
            }}
          >
            <Typography variant="overline" sx={{ color: "text.disabled", letterSpacing: 0.8, fontSize: "0.65rem" }}>Composite Score</Typography>
            {hasEnoughTraces ? (
              <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 1 }}>
                {isPreliminary ? "Preliminary - keep running evals" : "Based on all scored sessions"}
              </Typography>
            ) : (
              <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 1 }}>No completed run yet</Typography>
            )}
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, justifyContent: "center", py: 1 }}>
              {hasEnoughTraces ? (
                <>
                  <Box sx={{ position: "relative", display: "inline-flex", mb: 1 }}>
                    <svg width="100" height="100" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="var(--mui-palette-divider)" strokeWidth="5" />
                      <circle cx="50" cy="50" r="40" fill="none"
                        stroke={composite >= 80 ? "var(--mui-palette-success-main)" : composite >= 60 ? "var(--mui-palette-warning-main)" : "var(--mui-palette-error-main)"}
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
                  {isPreliminary && (
                    <Tooltip title="Score is based on fewer than 30 sessions or 3 runs." arrow>
                      <Chip label="Preliminary" size="small" color="warning" sx={{ height: 18, fontSize: "0.62rem", cursor: "help" }} />
                    </Tooltip>
                  )}
                  <Typography variant="caption" sx={{ color: confidenceDelta > 0 ? "text.secondary" : "text.disabled", mt: 0.5 }}>
                    ± {confidenceDelta} pts confidence
                  </Typography>
                </>
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
                        <path d="M20.38 8.57l-1.23 1.85a8 8 0 0 1-.22 7.58H5.07A8 8 0 0 1 15.58 6.85l1.85-1.23A10 10 0 0 0 3.35 19a2 2 0 0 0 1.72 1h13.85a2 2 0 0 0 1.74-1 10 10 0 0 0 .6-10.44zm-9.79 6.84a2 2 0 0 0 2.83 0l5.66-8.49-8.49 5.66a2 2 0 0 0 0 2.83z" />
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
            {!hasEnoughTraces && (
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, mt: 1 }}>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  Scoring unlocks at {tracesNeeded} traces
                </Typography>
                <Button size="small" variant="outlined" color="inherit"
                  sx={{ fontSize: "0.68rem", color: "text.disabled", borderColor: "divider", py: 0.25 }}
                  onClick={() => { addMockTracesToProject(projectId); setRefreshKey((k) => k + 1); }}>
                  Simulate 20 traces
                </Button>
              </Box>
            )}
            {hasEnoughTraces && passK >= 0 && (
              <Box sx={{ mt: 1.5, pt: 1.5, borderTop: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Typography variant="caption" sx={{ color: "text.disabled" }}>Pass^k</Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: passK >= 75 ? "success.main" : passK >= 50 ? "warning.main" : "error.main" }}>
                  {passK}%
                </Typography>
              </Box>
            )}
          </Paper>

          {/* Traces (24H) */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 0.5 }}>
              <Typography variant="overline" sx={{ color: "text.disabled", letterSpacing: 0.8, fontSize: "0.65rem" }}>Traces (24H)</Typography>
              <SvgIcon sx={{ fontSize: "0.9rem", color: "text.disabled", mt: 0.25 }}>
                <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z" />
              </SvgIcon>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, my: 0.5 }}>{latestSessions.length}</Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {latestRun ? `From ${latestRun.label}` : "Live count from OTel"}
            </Typography>
          </Paper>

          {/* P95 Latency */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5 }}>
            <Typography variant="overline" sx={{ color: "text.disabled", letterSpacing: 0.8, fontSize: "0.65rem", display: "block", mb: 0.5 }}>P95 Latency</Typography>
            {hasEnoughTraces && p95DurMs != null ? (
              <>
                <Typography variant="h5" sx={{ fontWeight: 700, my: 0.5 }}>
                  {p95DurMs >= 60000 ? `${(p95DurMs / 60000).toFixed(1)}m` : `${(p95DurMs / 1000).toFixed(1)}s`}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>Phase B aggregation</Typography>
              </>
            ) : (
              <>
                <Typography variant="h5" sx={{ fontWeight: 700, my: 0.5, color: "text.disabled" }}>-</Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  {hasEnoughTraces ? "Phase B aggregation" : "Unlocks at 20 traces"}
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
                <Typography variant="caption" sx={{ color: "text.secondary" }}>No cost data in latest run</Typography>
              </>
            )}
          </Paper>

          {/* Errors */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 0.5 }}>
              <Typography variant="overline" sx={{ color: "text.disabled", letterSpacing: 0.8, fontSize: "0.65rem" }}>Errors</Typography>
              {failCount > 0 && (
                <SvgIcon sx={{ fontSize: "0.9rem", color: "warning.main", mt: 0.25 }}>
                  <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                </SvgIcon>
              )}
            </Box>
            {hasEnoughTraces ? (
              <>
                <Typography variant="h5" sx={{ fontWeight: 700, my: 0.5, color: failCount > 0 ? "error.main" : "text.primary" }}>{failCount}</Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>FAIL sessions across all runs</Typography>
              </>
            ) : (
              <>
                <Typography variant="h5" sx={{ fontWeight: 700, my: 0.5, color: "text.disabled" }}>-</Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>Phase B aggregation</Typography>
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
            <Button size="small" variant="text" onClick={() => setActiveTab("traces")} sx={{ color: "primary.main", fontSize: "0.75rem" }}>
              View all
            </Button>
          </Box>
          {latestSessions.length === 0 ? (
            <Box sx={{ py: 3, display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
              <SvgIcon sx={{ color: "text.disabled", fontSize: "2rem" }}>
                <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z" />
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
                  <TableRow key={s.id} hover onClick={() => { setActiveTab("traces"); setSelectedTraceId(s.id); setSelectedSpanId(null); }} sx={{ cursor: "pointer", "&:last-child td": { borderBottom: 0 } }}>
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
                    <TableCell><VerdictBadge verdict={s.verdict} /></TableCell>
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
            <Button size="small" variant="text" onClick={() => setActiveTab("traces")} sx={{ color: "primary.main", fontSize: "0.75rem" }}>
              View all
            </Button>
          </Box>
          {runs.length === 0 ? (
            <Box sx={{ py: 3, display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
              <SvgIcon sx={{ color: "text.disabled", fontSize: "2rem" }}>
                <path d="M20.38 8.57l-1.23 1.85a8 8 0 0 1-.22 7.58H5.07A8 8 0 0 1 15.58 6.85l1.85-1.23A10 10 0 0 0 3.35 19a2 2 0 0 0 1.72 1h13.85a2 2 0 0 0 1.74-1 10 10 0 0 0 .6-10.44zm-9.79 6.84a2 2 0 0 0 2.83 0l5.66-8.49-8.49 5.66a2 2 0 0 0 0 2.83z" />
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
                  const lv = run.sessions[0]?.verdict ?? "FAIL";
                  return (
                    <TableRow key={run.id} hover={!run.inProgress} onClick={() => !run.inProgress && navigate({ name: "run", projectId, runId: run.id })} sx={{ cursor: run.inProgress ? "default" : "pointer", "&:last-child td": { borderBottom: 0 } }}>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>{run.label}</Typography>
                          {run.inProgress && <Chip label="In progress" size="small" color="primary" sx={{ height: 18, fontSize: "0.62rem" }} />}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                          {new Date(run.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {run.inProgress ? (
                          <Typography variant="body2" sx={{ color: "text.disabled" }}>-</Typography>
                        ) : (
                          <Typography variant="body2" sx={{ fontWeight: 600, color: pr >= 75 ? "success.main" : pr >= 50 ? "warning.main" : "error.main" }}>{pr}%</Typography>
                        )}
                      </TableCell>
                      <TableCell>{run.inProgress ? <Typography variant="body2" sx={{ color: "text.disabled" }}>-</Typography> : <VerdictBadge verdict={lv} />}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Paper>

        {/* Monitoring note */}
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5, display: "flex", alignItems: "flex-start", gap: 1.5, borderColor: "primary.light", bgcolor: "rgba(var(--mui-palette-primary-mainChannel) / 0.04)" }}>
          <SvgIcon sx={{ fontSize: "1.1rem", color: "primary.main", mt: 0.15, flexShrink: 0 }}>
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
          </SvgIcon>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.25 }}>AgentScore is monitoring this agent</Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Scores and insights improve over time as more traces are collected. Keep running evals to increase confidence and catch regressions early.
            </Typography>
          </Box>
        </Paper>
      </Box>
    );
  }

  // ── Tab: Traces ──────────────────────────────────────────────────────────────

  function renderTraces() {
    // If a trace is selected, show the span explorer
    if (selectedTraceId) {
      const selectedSession = allSessions.find((s) => s.id === selectedTraceId);
      if (!selectedSession) return null;
      const spans = generateSpans(selectedSession, project!);
      const activeSpanId = selectedSpanId ?? spans[0]?.id;
      const activeSpan = spans.find((sp) => sp.id === activeSpanId) ?? spans[0];
      const rootDur = selectedSession.dur;
      const totalTokens = spans.reduce((acc, sp) => acc + sp.inputTokens + sp.outputTokens, 0);
      const totalCost = spans.reduce((acc, sp) => acc + sp.costUsd, 0);
      const svcName = (project!.service ?? project!.name).toLowerCase().replace(/\s+/g, "-");

      const kindColor = (kind: MockSpan["kind"]) =>
        kind === "agent" ? "#1a1a1a" : kind === "llm" ? "#0070f3" : "#7c3aed";
      const kindBg = (kind: MockSpan["kind"]) =>
        kind === "agent" ? "#f0f0f0" : kind === "llm" ? "#e8f0fe" : "#f3e8ff";

      return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {/* Trace header */}
          <Box sx={{ mb: 2 }}>
            <Button size="small" startIcon={
              <SvgIcon sx={{ fontSize: "0.9rem !important" }}><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" /></SvgIcon>
            } onClick={() => { setSelectedTraceId(null); setSelectedSpanId(null); }}
              sx={{ color: "text.secondary", mb: 1.5, pl: 0, fontSize: "0.8rem" }}>
              Traces
            </Button>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
              invoke_agent {svcName}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 1.5 }}>
              {new Date(selectedSession.ts).toLocaleString("en-US", { month: "numeric", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
              {[
                { icon: "M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z", label: rootDur >= 1000 ? `${(rootDur / 1000).toFixed(2)}s` : `${rootDur}ms` },
                { icon: "M11.5 2C6.81 2 3 5.81 3 10.5S6.81 19 11.5 19h.5v3c4.86-2.34 8-7 8-11.5C20 5.81 16.19 2 11.5 2zm1 14.5h-2v-2h2v2zm0-4h-2c0-3.25 3-3 3-5 0-1.1-.9-2-2-2s-2 .9-2 2h-2c0-2.21 1.79-4 4-4s4 1.79 4 4c0 2.5-3 2.75-3 5z", label: `# ${totalTokens} tokens` },
                { icon: "M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z", label: `$ ${totalCost < 0.001 ? `$${(totalCost * 1000).toFixed(4)}m` : `$${totalCost.toFixed(5)}`}` },
                { icon: "M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z", label: `${spans.length} span${spans.length !== 1 ? "s" : ""}` },
              ].map(({ icon, label }) => (
                <Box key={label} sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                  <SvgIcon sx={{ fontSize: "0.9rem", color: "text.disabled" }}><path d={icon} /></SvgIcon>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontFamily: "monospace" }}>{label}</Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Span explorer */}
          <Box sx={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 2, alignItems: "start" }}>
            {/* Left: Spans tree */}
            <Paper variant="outlined" sx={{ borderRadius: 1.5, overflow: "hidden" }}>
              <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid", borderColor: "divider" }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Spans</Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  {spans.length} span{spans.length !== 1 ? "s" : ""} · {spans.findIndex((sp) => sp.id === activeSpanId) + 1} selected
                </Typography>
              </Box>
              <Box>
                {spans.map((span) => {
                  const isRoot = !span.parentId;
                  const barLeft = rootDur > 0 ? (span.offsetMs / rootDur) * 100 : 0;
                  const barWidth = rootDur > 0 ? Math.max(2, (span.durationMs / rootDur) * 100) : 4;
                  const isActive = span.id === activeSpanId;
                  return (
                    <Box key={span.id} onClick={() => setSelectedSpanId(span.id)}
                      sx={{ px: 2, py: 1.25, cursor: "pointer", display: "flex", flexDirection: "column", gap: 0.5,
                        bgcolor: isActive ? "action.selected" : "transparent",
                        borderLeft: isActive ? "2px solid" : "2px solid transparent",
                        borderColor: isActive ? "primary.main" : "transparent",
                        "&:hover": { bgcolor: isActive ? "action.selected" : "action.hover" },
                        "&:not(:last-child)": { borderBottom: "1px solid", borderBottomColor: "divider" } }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, pl: isRoot ? 0 : 2 }}>
                        {!isRoot && <Box sx={{ width: 8, height: 1, bgcolor: "divider", flexShrink: 0, mt: 0.25 }} />}
                        <Typography variant="caption" sx={{ fontFamily: "monospace", fontWeight: isRoot ? 700 : 500, fontSize: "0.72rem",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, minWidth: 0 }}>
                          {span.name}
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, pl: isRoot ? 0 : 2, flexWrap: "wrap" }}>
                        <Box sx={{ px: 0.75, py: 0.1, borderRadius: 0.5, bgcolor: kindBg(span.kind), display: "inline-block" }}>
                          <Typography variant="caption" sx={{ fontSize: "0.62rem", fontWeight: 700, color: kindColor(span.kind) }}>
                            {span.kind}
                          </Typography>
                        </Box>
                        {span.model && span.kind !== "agent" && (
                          <Box sx={{ px: 0.75, py: 0.1, borderRadius: 0.5, bgcolor: "action.hover", display: "inline-block" }}>
                            <Typography variant="caption" sx={{ fontSize: "0.62rem", fontFamily: "monospace" }}>{span.model}</Typography>
                          </Box>
                        )}
                        {(span.inputTokens + span.outputTokens) > 0 && (
                          <Typography variant="caption" sx={{ fontSize: "0.62rem", color: "text.secondary", fontFamily: "monospace" }}>
                            {span.inputTokens + span.outputTokens} tok
                          </Typography>
                        )}
                      </Box>
                      {/* Timing bar */}
                      <Box sx={{ height: 6, bgcolor: "action.hover", borderRadius: 0.5, position: "relative", overflow: "hidden", pl: isRoot ? 0 : 2, mx: isRoot ? 0 : 0 }}>
                        <Box sx={{ position: "absolute", top: 0, bottom: 0,
                          left: `${barLeft}%`, width: `${barWidth}%`,
                          bgcolor: kindColor(span.kind), borderRadius: 0.5 }} />
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Paper>

            {/* Right: Span detail */}
            {activeSpan && (() => {
              const durLabel = activeSpan.durationMs >= 1000 ? `${(activeSpan.durationMs / 1000).toFixed(2)}s` : `${activeSpan.durationMs}ms`;
              const endMs = activeSpan.offsetMs + activeSpan.durationMs;
              const endLabel = endMs >= 1000 ? `${(endMs / 1000).toFixed(2)}s` : `${endMs}ms`;
              const tok = activeSpan.inputTokens + activeSpan.outputTokens;
              const svcNameInner = (project!.service ?? project!.name).toLowerCase().replace(/\s+/g, "-");
              void svcNameInner;
              return (
                <Paper variant="outlined" sx={{ borderRadius: 1.5, overflow: "hidden" }}>
                  {/* Span header */}
                  <Box sx={{ px: 2.5, py: 2, borderBottom: "1px solid", borderColor: "divider" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.75, flexWrap: "wrap" }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, fontFamily: "monospace", fontSize: "0.9rem" }}>
                        {activeSpan.name}
                      </Typography>
                      <Box sx={{ px: 0.75, py: 0.1, borderRadius: 0.5, bgcolor: kindBg(activeSpan.kind) }}>
                        <Typography variant="caption" sx={{ fontSize: "0.7rem", fontWeight: 700, color: kindColor(activeSpan.kind) }}>
                          {activeSpan.kind}
                        </Typography>
                      </Box>
                      {activeSpan.model && (
                        <Box sx={{ px: 0.75, py: 0.1, borderRadius: 0.5, bgcolor: "action.hover" }}>
                          <Typography variant="caption" sx={{ fontSize: "0.7rem", fontFamily: "monospace" }}>{activeSpan.model}</Typography>
                        </Box>
                      )}
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                      {[
                        { icon: "M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z", label: durLabel },
                        ...(tok > 0 ? [{ icon: "M11.5 2C6.81 2 3 5.81 3 10.5S6.81 19 11.5 19h.5v3c4.86-2.34 8-7 8-11.5C20 5.81 16.19 2 11.5 2zm1 14.5h-2v-2h2v2zm0-4h-2c0-3.25 3-3 3-5 0-1.1-.9-2-2-2s-2 .9-2 2h-2c0-2.21 1.79-4 4-4s4 1.79 4 4c0 2.5-3 2.75-3 5z", label: `${activeSpan.inputTokens} → ${activeSpan.outputTokens}` }] : []),
                        ...(activeSpan.costUsd > 0 ? [{ icon: "M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z", label: `$${activeSpan.costUsd.toFixed(5)}` }] : []),
                      ].map(({ icon, label }) => (
                        <Box key={label} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <SvgIcon sx={{ fontSize: "0.85rem", color: "text.disabled" }}><path d={icon} /></SvgIcon>
                          <Typography variant="caption" sx={{ fontFamily: "monospace", color: "text.secondary" }}>{label}</Typography>
                        </Box>
                      ))}
                    </Box>
                    <Typography variant="caption" sx={{ color: "text.disabled", display: "block", mt: 0.5 }}>
                      offset {activeSpan.offsetMs}ms · ended {endLabel}
                    </Typography>
                  </Box>

                  {/* Input */}
                  <Box sx={{ px: 2.5, py: 2, borderBottom: "1px solid", borderColor: "divider" }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.8, fontSize: "0.65rem" }}>
                        Input{activeSpan.inputTokens > 0 ? ` · ${activeSpan.inputTokens} tokens` : ""}
                      </Typography>
                    </Box>
                    <Box sx={{ bgcolor: "action.hover", borderRadius: 1, p: 1.5, fontFamily: "monospace", fontSize: "0.8rem",
                      border: "1px solid", borderColor: "divider", minHeight: 48 }}>
                      <Typography component="pre" sx={{ m: 0, fontFamily: "monospace", fontSize: "0.8rem",
                        color: "success.main", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                        {activeSpan.input}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Output */}
                  <Box sx={{ px: 2.5, py: 2, borderBottom: "1px solid", borderColor: "divider" }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.8, fontSize: "0.65rem" }}>
                        Output{activeSpan.outputTokens > 0 ? ` · ${activeSpan.outputTokens} tokens` : ""}
                      </Typography>
                    </Box>
                    <Box sx={{ bgcolor: "action.hover", borderRadius: 1, p: 1.5,
                      border: "1px solid", borderColor: "divider", minHeight: 48 }}>
                      <Typography component="pre" sx={{ m: 0, fontFamily: "monospace", fontSize: "0.8rem",
                        color: "success.main", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                        {activeSpan.output}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Metadata collapsible */}
                  <Box sx={{ px: 2.5, py: 1.5 }}>
                    <Box onClick={() => setMetaOpen((v) => !v)}
                      sx={{ display: "flex", alignItems: "center", gap: 0.75, cursor: "pointer", userSelect: "none" }}>
                      <SvgIcon sx={{ fontSize: "0.9rem", color: "text.secondary", transform: metaOpen ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}>
                        <path d="M10 17l5-5-5-5v10z" />
                      </SvgIcon>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.8, fontSize: "0.65rem" }}>
                        Metadata
                      </Typography>
                    </Box>
                    <Collapse in={metaOpen}>
                      <Box sx={{ mt: 1.5, bgcolor: "action.hover", borderRadius: 1, p: 1.5, border: "1px solid", borderColor: "divider" }}>
                        <Typography component="pre" sx={{ m: 0, fontFamily: "monospace", fontSize: "0.75rem", color: "text.secondary",
                          whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                          {JSON.stringify({
                            span_id: activeSpan.id.slice(-12),
                            parent_id: activeSpan.parentId?.slice(-12) ?? null,
                            service_name: project!.service ?? project!.name,
                            agent_score_project: projectId,
                            otel_version: "1.27.0",
                            instrumentation_scope: "agentscore-sdk",
                          }, null, 2)}
                        </Typography>
                      </Box>
                    </Collapse>
                  </Box>
                </Paper>
              );
            })()}
          </Box>
        </Box>
      );
    }

    // Trace list view
    const allTraceSessions = runs.flatMap((r) => r.sessions.map((s) => ({ ...s, runLabel: r.label })));
    const svcName = (project!.service ?? project!.name).toLowerCase().replace(/\s+/g, "-");

    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {project!.runs.some((r) => r.regradedWithProfileVersion) && (() => {
          const rv = project!.runs.find((r) => r.regradedWithProfileVersion)?.regradedWithProfileVersion;
          const re = project!.events?.find((e) => e.kind === "profile_version_changed");
          return (
            <Alert severity="info" sx={{ borderRadius: 1.5 }}>
              Profile updated to v{rv}{re ? ` on ${new Date(re.ts).toLocaleDateString()}` : ""}. Earlier runs were re-evaluated against the new version so results stay comparable.
            </Alert>
          );
        })()}

        <Paper variant="outlined" sx={{ borderRadius: 1.5, overflow: "hidden" }}>
          <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Traces</Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>{allTraceSessions.length} total</Typography>
            </Box>
            {canCompare && (
              <Button size="small" variant="outlined" color="inherit" sx={{ color: "text.secondary", fontSize: "0.75rem" }}
                onClick={() => navigate({ name: "compare-runs", projectId, runIdA: project!.runs[0].id, runIdB: project!.runs[1].id })}>
                Compare runs
              </Button>
            )}
          </Box>
          {allTraceSessions.length === 0 ? (
            <Box sx={{ py: 5, display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: "text.secondary" }}>No traces yet</Typography>
              <Typography variant="caption" sx={{ color: "text.disabled" }}>No OTel traces have been ingested for this agent.</Typography>
            </Box>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>Trace</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "text.secondary", width: 160 }}>Timestamp</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "text.secondary", width: 90 }}>Duration</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "text.secondary", width: 80 }}>Spans</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "text.secondary", width: 90 }}>Verdict</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {allTraceSessions.map((s) => {
                  const spanCount = 2 + di(s.id, 4, 20);
                  const dur = s.dur >= 1000 ? `${(s.dur / 1000).toFixed(2)}s` : `${s.dur}ms`;
                  return (
                    <TableRow key={s.id} hover onClick={() => { setSelectedTraceId(s.id); setSelectedSpanId(null); }}
                      sx={{ cursor: "pointer", "&:last-child td": { borderBottom: 0 } }}>
                      <TableCell>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
                          <Typography variant="caption" sx={{ fontFamily: "monospace", fontWeight: 600, color: "primary.main" }}>
                            invoke_agent {svcName}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.72rem" }}>{s.scenario}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ color: "text.secondary", fontFamily: "monospace" }}>
                          {new Date(s.ts).toLocaleString("en-US", { month: "numeric", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ fontFamily: "monospace", color: "text.secondary" }}>{dur}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>{spanCount}</Typography>
                      </TableCell>
                      <TableCell><VerdictBadge verdict={s.verdict} /></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Paper>

        {/* Activity log */}
        {project!.events && project!.events.length > 0 && (
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Activity</Typography>
            <Box sx={{ position: "relative" }}>
              <Box sx={{ position: "absolute", left: 6, top: 12, bottom: 12, width: "1px", bgcolor: "divider" }} />
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {[...project!.events!].sort((a, b) => b.ts.localeCompare(a.ts)).map((ev) => {
                  const kindCfg = EVENT_KIND_CONFIG[ev.kind] ?? { label: ev.kind, color: "text.secondary" };
                  return (
                    <Box key={ev.id} sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                      <Box sx={{ width: 13, height: 13, borderRadius: "50%", bgcolor: kindCfg.color, flexShrink: 0, mt: 0.4, zIndex: 1 }} />
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{ev.title}</Typography>
                          <Chip label={kindCfg.label} size="small" variant="outlined" sx={{ height: 16, fontSize: "0.6rem" }} />
                          {ev.author && ev.author !== "system" && <Typography variant="caption" sx={{ color: "text.disabled" }}>{ev.author}</Typography>}
                        </Box>
                        <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 0.25 }}>{ev.detail}</Typography>
                        <Typography variant="caption" sx={{ color: "text.disabled", display: "block", mt: 0.25 }}>{new Date(ev.ts).toLocaleString()}</Typography>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          </Box>
        )}
      </Box>
    );
  }

  // ── Tab: Scoring ─────────────────────────────────────────────────────────────

  function renderScoring() {
    const rate = project!.traceSampleRate ?? 100;
    const baseRate = 180 + (project!.id.charCodeAt(project!.id.length - 1) % 10) * 30;
    const evaluated = Math.round(baseRate * rate / 100);
    const selectedJudge = LLM_JUDGES.find((j) => j.id === selectedJudgeId) ?? LLM_JUDGES[0];
    void selectedJudge;

    const judgeReason = project!.type === "CODING" || project!.type === "ATC"
      ? "Your agent performs code-level reasoning. Claude Opus 4.8 provides the highest evaluation accuracy for complex output assessment."
      : project!.type === "APT"
      ? "Your agent is evaluated on performance metrics. Claude Haiku 4.5 provides fast, low-latency judging optimized for throughput."
      : "Claude Sonnet 4.6 provides a strong balance of accuracy and cost for general-purpose agent evaluation.";

    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {/* Actions */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
          <Button variant="contained" onClick={handleScoreNow} disabled={isScoringNow || !hasEnoughTraces}>
            {isScoringNow ? "Scoring…" : "Score now"}
          </Button>
          <Button
            variant="outlined"
            color="inherit"
            sx={{ color: describeOpen ? "primary.main" : "text.secondary", borderColor: describeOpen ? "primary.main" : undefined }}
            onClick={() => { setDescribeOpen((o) => !o); setDescribePhase("form"); }}
          >
            Describe agent
          </Button>
          {canCompare && (
            <Button variant="outlined" color="inherit" sx={{ color: "text.secondary" }}
              onClick={() => navigate({ name: "compare-runs", projectId, runIdA: project!.runs[0].id, runIdB: project!.runs[1].id })}>
              Compare runs
            </Button>
          )}
          {!hasEnoughTraces && (
            <Button variant="outlined" color="inherit" size="small" sx={{ color: "text.secondary", fontSize: "0.8rem" }} onClick={handleSimulateTraces}>
              Simulate 20 traces
            </Button>
          )}
          <Typography variant="caption" sx={{ color: "text.disabled", ml: 0.5 }}>
            {hasEnoughTraces ? "Auto-scores daily · Next: 02:00 UTC" : `Needs ${tracesNeeded - totalSessions} more traces before scoring`}
          </Typography>
        </Box>

        {/* Describe agent panel */}
        <Collapse in={describeOpen}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 1.5, borderColor: "primary.light" }}>
            {describePhase === "form" && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Describe your agent</Typography>
                  <ToggleButtonGroup
                    size="small"
                    exclusive
                    value={describeMode}
                    onChange={(_, v) => v && setDescribeMode(v)}
                    sx={{ "& .MuiToggleButton-root": { fontSize: "0.72rem", py: 0.5, px: 1.25, textTransform: "none" } }}
                  >
                    <ToggleButton value="guided">Guided</ToggleButton>
                    <ToggleButton value="expert">Expert</ToggleButton>
                  </ToggleButtonGroup>
                </Box>

                {describeMode === "guided" ? (
                  <>
                    <TextField
                      label="What does this agent do?"
                      placeholder="e.g. Automates payment regression tests by replaying transactions and asserting expected outcomes"
                      multiline rows={2} fullWidth size="small"
                      value={describePurpose} onChange={(e) => setDescribePurpose(e.target.value)}
                    />
                    <TextField
                      label="What should it never do?"
                      placeholder="e.g. Modify production data, skip mandatory assertions, or expose credential values in logs"
                      multiline rows={2} fullWidth size="small"
                      value={describeFailures} onChange={(e) => setDescribeFailures(e.target.value)}
                    />
                    <TextField
                      label="What are you most concerned about?"
                      placeholder="e.g. False positives that block valid deployments, or hallucinated pass results"
                      multiline rows={2} fullWidth size="small"
                      value={describeConcerns} onChange={(e) => setDescribeConcerns(e.target.value)}
                    />
                  </>
                ) : (
                  <TextField
                    label="Agent spec (YAML, JSON, or Markdown)"
                    placeholder={`name: payment-regression-agent\ntype: ATA\npurpose: >\n  Replay payment workflow transactions and assert expected outcomes.\nnever_do:\n  - Modify production data\n  - Skip mandatory assertions\nconcerns:\n  - false_positives`}
                    multiline rows={8} fullWidth size="small"
                    value={describeSpec} onChange={(e) => setDescribeSpec(e.target.value)}
                    inputProps={{ style: { fontFamily: "monospace", fontSize: "0.78rem" } }}
                  />
                )}

                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    variant="contained"
                    size="small"
                    disabled={describeMode === "guided" ? !describePurpose.trim() : !describeSpec.trim()}
                    onClick={handleDescribeAnalyze}
                  >
                    Analyze
                  </Button>
                  <Button variant="text" size="small" color="inherit" sx={{ color: "text.secondary" }} onClick={() => setDescribeOpen(false)}>
                    Cancel
                  </Button>
                </Box>
              </Box>
            )}

            {describePhase === "analyzing" && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, py: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Analyzing your agent…</Typography>
                {DESCRIBE_STAGES.map((stage, i) => (
                  <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    {i < describeAnalysisStep ? (
                      <Box sx={{ width: 16, height: 16, borderRadius: "50%", bgcolor: "success.main", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <SvgIcon sx={{ fontSize: "0.7rem", color: "#fff" }}><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></SvgIcon>
                      </Box>
                    ) : i === describeAnalysisStep ? (
                      <Box sx={{ width: 16, height: 16, flexShrink: 0 }}><LinearProgress sx={{ borderRadius: 4, height: 4, mt: 0.75 }} /></Box>
                    ) : (
                      <Box sx={{ width: 16, height: 16, borderRadius: "50%", border: "1.5px solid", borderColor: "divider", flexShrink: 0 }} />
                    )}
                    <Typography variant="caption" sx={{ color: i <= describeAnalysisStep ? "text.primary" : "text.disabled" }}>{stage}</Typography>
                  </Box>
                ))}
              </Box>
            )}

            {describePhase === "result" && (() => {
              const matchedProfile = PROFILES.find((p) => p.agentType === project!.type) ?? PROFILES[0];
              const matchedVersion = matchedProfile.versions[matchedProfile.versions.length - 1];
              const confidence = 87 + (project!.id.charCodeAt(project!.id.length - 1) % 10);

              if (!hasEnoughTraces) {
                return (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <SvgIcon sx={{ color: "success.main", fontSize: "1.1rem" }}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></SvgIcon>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Best matching profile found</Typography>
                    </Box>
                    <Alert severity="info" sx={{ py: 0.5 }}>
                      Not enough traces yet to analyze your current evals. AgentScore selected the best profile from the library based on your agent description.
                    </Alert>
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5 }}>
                      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 1 }}>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{matchedProfile.name}</Typography>
                          <Typography variant="caption" sx={{ color: "text.secondary" }}>{matchedProfile.description}</Typography>
                        </Box>
                        <Chip label={`${confidence}% match`} size="small" color="success" variant="outlined" sx={{ height: 20, fontSize: "0.65rem", ml: 1, flexShrink: 0 }} />
                      </Box>
                      <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, display: "block", mb: 0.75 }}>Evals that will be applied</Typography>
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                        {matchedVersion.entries.filter((e) => e.enabled).map((entry) => (
                          <Box key={entry.id} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "primary.main", flexShrink: 0 }} />
                            <Typography variant="caption">{entry.evalName}</Typography>
                            <Chip label={entry.dimension} size="small" variant="outlined" sx={{ height: 16, fontSize: "0.6rem", ml: "auto" }} />
                          </Box>
                        ))}
                      </Box>
                    </Paper>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => {
                          updateProject({ ...project!, adoptedProfileId: matchedProfile.id });
                          setDescribeOpen(false);
                          setDescribePhase("form");
                          setRefreshKey((k) => k + 1);
                        }}
                      >
                        Apply profile
                      </Button>
                      <Button variant="text" size="small" color="inherit" sx={{ color: "text.secondary" }} onClick={() => setDescribePhase("form")}>
                        Back
                      </Button>
                    </Box>
                  </Box>
                );
              }

              // Has enough traces - show diff
              const currentEntries = adoptedProfileVersion?.entries ?? [];
              const proposedEntries = matchedVersion.entries;
              const toAdd = proposedEntries.filter((p) => !currentEntries.some((c) => c.evalSlug === p.evalSlug));
              const toRemove = currentEntries.filter((c) => !proposedEntries.some((p) => p.evalSlug === c.evalSlug));
              const toAdjust = proposedEntries.filter((p) => {
                const cur = currentEntries.find((c) => c.evalSlug === p.evalSlug);
                return cur && Math.abs(cur.weight - p.weight) > 0.1;
              });

              return (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <SvgIcon sx={{ color: "primary.main", fontSize: "1.1rem" }}><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z" /></SvgIcon>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Proposed eval adjustments</Typography>
                    <Chip label={`based on ${matchedProfile.name}`} size="small" variant="outlined" sx={{ height: 18, fontSize: "0.62rem" }} />
                  </Box>
                  {toAdd.length === 0 && toRemove.length === 0 && toAdjust.length === 0 ? (
                    <Alert severity="success" sx={{ py: 0.5 }}>Your current evals already match the recommended profile. No changes needed.</Alert>
                  ) : (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
                      {toAdd.map((entry) => (
                        <Box key={entry.id} sx={{ display: "flex", alignItems: "center", gap: 1, p: 1, borderRadius: 1, bgcolor: "rgba(var(--mui-palette-success-mainChannel) / 0.08)", border: "1px solid", borderColor: "success.light" }}>
                          <Typography variant="caption" sx={{ color: "success.dark", fontWeight: 700, width: 48, flexShrink: 0 }}>+ ADD</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>{entry.evalName}</Typography>
                          <Chip label={entry.dimension} size="small" color="success" variant="outlined" sx={{ height: 16, fontSize: "0.6rem", ml: "auto" }} />
                        </Box>
                      ))}
                      {toRemove.map((entry) => (
                        <Box key={entry.id} sx={{ display: "flex", alignItems: "center", gap: 1, p: 1, borderRadius: 1, bgcolor: "rgba(var(--mui-palette-error-mainChannel) / 0.06)", border: "1px solid", borderColor: "error.light" }}>
                          <Typography variant="caption" sx={{ color: "error.dark", fontWeight: 700, width: 48, flexShrink: 0 }}>- REM</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>{entry.evalName}</Typography>
                          <Chip label={entry.dimension} size="small" color="error" variant="outlined" sx={{ height: 16, fontSize: "0.6rem", ml: "auto" }} />
                        </Box>
                      ))}
                      {toAdjust.map((entry) => {
                        const cur = currentEntries.find((c) => c.evalSlug === entry.evalSlug)!;
                        return (
                          <Box key={entry.id} sx={{ display: "flex", alignItems: "center", gap: 1, p: 1, borderRadius: 1, bgcolor: "rgba(var(--mui-palette-warning-mainChannel) / 0.08)", border: "1px solid", borderColor: "warning.light" }}>
                            <Typography variant="caption" sx={{ color: "warning.dark", fontWeight: 700, width: 48, flexShrink: 0 }}>~ ADJ</Typography>
                            <Typography variant="caption" sx={{ fontWeight: 600 }}>{entry.evalName}</Typography>
                            <Typography variant="caption" sx={{ color: "text.secondary", ml: "auto" }}>weight {cur.weight} → {entry.weight}</Typography>
                          </Box>
                        );
                      })}
                    </Box>
                  )}
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                      variant="contained"
                      size="small"
                      disabled={toAdd.length === 0 && toRemove.length === 0 && toAdjust.length === 0}
                      onClick={() => {
                        updateProject({ ...project!, adoptedProfileId: matchedProfile.id });
                        setDescribeOpen(false);
                        setDescribePhase("form");
                        setRefreshKey((k) => k + 1);
                      }}
                    >
                      Apply changes
                    </Button>
                    <Button variant="text" size="small" color="inherit" sx={{ color: "text.secondary" }} onClick={() => setDescribePhase("form")}>
                      Back
                    </Button>
                  </Box>
                </Box>
              );
            })()}
          </Paper>
        </Collapse>

        {/* Sub-tabs */}
        <Box sx={{ borderBottom: "1px solid", borderColor: "divider" }}>
          <Tabs value={scoringSubTab} onChange={(_, v) => setScoringSubTab(v)} sx={{ minHeight: 36 }}>
            {(["runs", "per-version", "activity", "schedule"] as const).map((t) => (
              <Tab key={t} label={t === "per-version" ? "Per version" : t.charAt(0).toUpperCase() + t.slice(1)} value={t} sx={{ minHeight: 36, fontSize: "0.82rem", textTransform: "none" }} />
            ))}
          </Tabs>
        </Box>

        {scoringSubTab === "runs" && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {/* 1. Scorecard + Scoring profile */}
        {adoptedProfile && adoptedProfileVersion ? (
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, alignItems: "start" }}>
            <ScorecardPanel
              run={latestRun}
              profileVersion={adoptedProfileVersion}
              composite={composite}
              grade={grade}
              isPreliminary={isPreliminary}
              confidenceDelta={confidenceDelta}
              isScoringNow={isScoringNow}
              hasEnoughTraces={hasEnoughTraces}
              tracesNeeded={tracesNeeded}
              totalSessions={totalSessions}
            />
            <ScoringProfilePanel profile={adoptedProfile} version={adoptedProfileVersion} navigate={navigate} />
          </Box>
        ) : (
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 1.5, borderColor: evalDesign?.status === "confirmed" ? "success.dark" : evalDesign?.status === "observation_ready" ? "warning.dark" : "divider" }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Evals</Typography>
                  <ChipStatus status={evalDesign?.status === "confirmed" ? "Passed" : evalDesign?.status === "observation_ready" ? "Pending" : "Draft"} />
                </Box>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  {evalDesign?.status === "confirmed"
                    ? `${evalDesign.confirmedDimensions.length} dimensions confirmed · ${evalDesign.calibrationSet.length} calibration scenarios`
                    : evalDesign?.status === "observation_ready"
                    ? `Observation-based recommendation ready - ${evalDesign.measurementRecommendation?.shadowSessionCount} shadow sessions analyzed`
                    : "No evals configured. Set up evaluation design to define what to measure."}
                </Typography>
              </Box>
              <Button variant={evalDesign?.status === "confirmed" ? "outlined" : "contained"} color={evalDesign?.status === "confirmed" ? "inherit" : "primary"} size="small"
                onClick={() => navigate({ name: "eval-design", projectId })} sx={evalDesign?.status === "confirmed" ? { color: "text.secondary" } : {}}>
                {evalDesign?.status === "confirmed" ? "View design" : evalDesign?.status === "observation_ready" ? "Review recommendation" : "Set up evals"}
              </Button>
            </Box>
          </Paper>
        )}

        {/* 2. LLM Judge */}
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>LLM Judge</Typography>
            <Chip label="Auto-selected" size="small" color="primary" variant="outlined" sx={{ height: 20, fontSize: "0.62rem" }} />
          </Box>
          <Paper variant="outlined" sx={{ p: 1.75, borderRadius: 1.5, mb: 1.5, bgcolor: "rgba(var(--mui-palette-primary-mainChannel) / 0.03)", borderColor: "primary.light" }}>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>{judgeReason}</Typography>
          </Paper>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {LLM_JUDGES.map((judge) => {
              const isSelected = selectedJudgeId === judge.id;
              return (
                <Paper key={judge.id} variant="outlined" onClick={() => setSelectedJudgeId(judge.id)}
                  sx={{ p: 1.75, borderRadius: 1.5, cursor: "pointer", borderColor: isSelected ? "primary.main" : "divider",
                    bgcolor: isSelected ? "rgba(var(--mui-palette-primary-mainChannel) / 0.05)" : "transparent",
                    "&:hover": { borderColor: "primary.light" }, transition: "all 0.15s" }}>
                  <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2 }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.25 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{judge.name}</Typography>
                        <Chip label={judge.provider} size="small" variant="outlined" sx={{ height: 18, fontSize: "0.62rem" }} />
                        {isSelected && <Chip label="Selected" size="small" color="primary" sx={{ height: 18, fontSize: "0.62rem" }} />}
                        {judge.id === defaultJudgeId && !isSelected && <Chip label="Recommended" size="small" variant="outlined" color="primary" sx={{ height: 18, fontSize: "0.62rem" }} />}
                      </Box>
                      <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>{judge.description}</Typography>
                      <Typography variant="caption" sx={{ color: "text.disabled", fontFamily: "monospace" }}>{judge.model}</Typography>
                    </Box>
                  </Box>
                </Paper>
              );
            })}
          </Box>
          <Button variant="text" size="small" sx={{ mt: 1, color: "text.secondary", fontSize: "0.78rem" }} onClick={() => navigate({ name: "add-judge" })}>
            + Configure a new judge
          </Button>
        </Box>

          </Box>
        )}

        {scoringSubTab === "per-version" && (
          hasEnoughTraces && runs.length > 0 ? (
            <Box>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>Version / Run</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: "text.secondary", width: 120 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: "text.secondary", width: 80 }}>Sessions</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: "text.secondary", width: 90 }}>Pass rate</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: "text.secondary", width: 80 }}>Grade</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: "text.secondary", width: 110 }}>Verdict</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {runs.filter((r) => !r.inProgress).map((run) => {
                    const pr = runPassRate(run.sessions);
                    const runScore = run.sessions.length > 0
                      ? Math.round(run.sessions.reduce((acc, s) => {
                          const bp = s.scores.benchmarkPerformance.score;
                          const ve = s.scores.valueEfficiency?.score ?? bp;
                          const ux = s.scores.uxSignal.score;
                          return acc + (bp + ve + ux) / 3;
                        }, 0) / run.sessions.length)
                      : 0;
                    const runGrade = sessionGrade(runScore);
                    const lv = run.sessions[0]?.verdict ?? "FAIL";
                    return (
                      <TableRow key={run.id} hover onClick={() => navigate({ name: "run", projectId, runId: run.id })} sx={{ cursor: "pointer", "&:last-child td": { borderBottom: 0 } }}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: "monospace" }}>{run.label}</Typography>
                          {run.regradedWithProfileVersion && (
                            <Typography variant="caption" sx={{ color: "text.disabled" }}>Regraded with profile v{run.regradedWithProfileVersion}</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" sx={{ color: "text.secondary" }}>
                            {new Date(run.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}
                          </Typography>
                        </TableCell>
                        <TableCell><Typography variant="body2">{run.sessions.length}</Typography></TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: pr >= 75 ? "success.main" : pr >= 50 ? "warning.main" : "error.main" }}>{pr}%</Typography>
                        </TableCell>
                        <TableCell><GradeChip grade={runGrade} size="small" /></TableCell>
                        <TableCell><VerdictBadge verdict={lv} /></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>
          ) : (
            <Box sx={{ py: 6, display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5 }}>
              <SvgIcon sx={{ fontSize: "2.5rem", color: "text.disabled" }}>
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
              </SvgIcon>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "text.secondary" }}>No graded versions yet</Typography>
              <Typography variant="body2" sx={{ color: "text.disabled", textAlign: "center", maxWidth: 360 }}>
                Complete a run on a revision to see its grade here.
              </Typography>
            </Box>
          )
        )}

        {scoringSubTab === "activity" && (() => {
          const events = [...(project!.events ?? [])].sort((a, b) => b.ts.localeCompare(a.ts));
          const kindIcon: Record<string, string> = {
            run_completed: "M20.38 8.57l-1.23 1.85a8 8 0 0 1-.22 7.58H5.07A8 8 0 0 1 15.58 6.85l1.85-1.23A10 10 0 0 0 3.35 19a2 2 0 0 0 1.72 1h13.85a2 2 0 0 0 1.74-1 10 10 0 0 0 .6-10.44zm-9.79 6.84a2 2 0 0 0 2.83 0l5.66-8.49-8.49 5.66a2 2 0 0 0 0 2.83z",
            profile_adopted: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z",
            profile_version_changed: "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z",
            milestone_reached: "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l7.59-7.59L21 8l-9 9z",
            decision_override: "M12 1l3.22 6.53 7.21 1.05-5.22 5.09 1.23 7.18L12 17.77l-6.44 3.38 1.23-7.18L1.57 8.58l7.21-1.05z",
            regrade_completed: "M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z",
          };
          return events.length > 0 ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {events.map((ev, i) => (
                <Box key={ev.id} sx={{ display: "flex", gap: 2, pb: i < events.length - 1 ? 2.5 : 0 }}>
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                    <Box sx={{ width: 32, height: 32, borderRadius: "50%", bgcolor: "action.hover", border: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <SvgIcon sx={{ fontSize: "0.9rem", color: "text.secondary" }}>
                        <path d={kindIcon[ev.kind] ?? kindIcon.run_completed} />
                      </SvgIcon>
                    </Box>
                    {i < events.length - 1 && <Box sx={{ width: 1, flex: 1, bgcolor: "divider", mt: 0.5 }} />}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0, pt: 0.5 }}>
                    <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, flexWrap: "wrap", mb: 0.25 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{ev.title}</Typography>
                      <Typography variant="caption" sx={{ color: "text.disabled" }}>
                        {new Date(ev.ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}
                        {ev.author && ev.author !== "system" ? ` · ${ev.author}` : ""}
                      </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>{ev.detail}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          ) : (
            <Box sx={{ py: 6, display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5 }}>
              <SvgIcon sx={{ fontSize: "2.5rem", color: "text.disabled" }}>
                <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z" />
              </SvgIcon>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "text.secondary" }}>No activity yet</Typography>
              <Typography variant="body2" sx={{ color: "text.disabled", textAlign: "center", maxWidth: 360 }}>
                Scoring run activity and changelog will appear here.
              </Typography>
            </Box>
          );
        })()}

        {scoringSubTab === "schedule" && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 1.5 }}>
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                {[
                  { label: "FREQUENCY", value: "Daily" },
                  { label: "NEXT RUN", value: "02:00 UTC" },
                  { label: "LAST RUN", value: latestRun ? new Date(latestRun.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }) : "Never" },
                  { label: "RUNS COMPLETED", value: runs.filter((r) => !r.inProgress).length.toString() },
                ].map(({ label, value }) => (
                  <Box key={label}>
                    <Typography variant="overline" sx={{ color: "text.disabled", fontSize: "0.6rem", letterSpacing: 0.8 }}>{label}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: "monospace" }}>{value}</Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
            {hasEnoughTraces && (
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5, borderColor: "primary.light", bgcolor: "rgba(var(--mui-palette-primary-mainChannel) / 0.04)" }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.25 }}>Auto-scoring is active</Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  AgentScore scores this agent daily and after each new run is detected. Custom schedules and on-push triggers are coming in Phase 2.
                </Typography>
              </Paper>
            )}
            {!hasEnoughTraces && (
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5, borderColor: "warning.light" }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.25 }}>Waiting for traces</Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  Auto-scoring activates once {tracesNeeded} traces are collected. {totalSessions} of {tracesNeeded} received so far.
                </Typography>
              </Paper>
            )}
          </Box>
        )}
      </Box>
    );
  }

  // ── Tab: Labeling ────────────────────────────────────────────────────────────

  function renderLabeling() {
    return (
      <Box sx={{ py: 6, display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5 }}>
        <SvgIcon sx={{ fontSize: "2.5rem", color: "text.disabled" }}>
          <path d="M17.63 5.84C17.27 5.33 16.67 5 16 5L5 5.01C3.9 5.01 3 5.9 3 7v10c0 1.1.9 1.99 2 1.99L16 19c.67 0 1.27-.33 1.63-.84L22 12l-4.37-6.16z" />
        </SvgIcon>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "text.secondary" }}>Labeling</Typography>
        <Typography variant="body2" sx={{ color: "text.disabled", textAlign: "center", maxWidth: 360 }}>
          Human labeling of agent outputs is coming in Phase 2. You'll be able to review sessions, apply quality labels, and build ground-truth datasets here.
        </Typography>
      </Box>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <Box sx={{ p: 3, maxWidth: 960 }}>
      {/* Breadcrumb */}
      <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 1.5 }}>
        <Box component="span" sx={{ cursor: "pointer", "&:hover": { textDecoration: "underline" } }} onClick={() => navigate({ name: "agents" })}>
          Agents
        </Box>
        {" / "}{project.name}
      </Typography>

      {/* ATC beta notice */}
      {project.type === "ATC" && (
        <Alert severity="info" sx={{ mb: 2, fontSize: "0.8rem" }}>
          <strong>ATC Beta:</strong> ATC sessions are surfaced as informational signals in Phase 2. Verdicts and scores help calibrate evaluation design but are not CI gates.
        </Alert>
      )}

      {/* Agent header */}
      <Box sx={{ mb: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
          <Box sx={{ width: 28, height: 28, borderRadius: 1, border: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <SvgIcon sx={{ fontSize: "0.9rem", color: "text.secondary" }}>
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l7.59-7.59L21 8l-9 9z" />
            </SvgIcon>
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{project.name}</Typography>
          <Chip label="external" size="small" variant="outlined" sx={{ height: 20, fontSize: "0.7rem" }} />
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: "success.main" }} />
            <Typography variant="caption" sx={{ color: "success.dark", fontWeight: 600 }}>active</Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0 }}>
          <TypeTag type={project.type} />
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {project.service}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, ml: "auto" }}>
            <Button size="small" variant="outlined" color="inherit" onClick={() => navigate({ name: "agent-settings", projectId })} sx={{ color: "text.secondary" }}>
              Settings
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: "1px solid", borderColor: "divider", mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ minHeight: 40 }}>
          <Tab label="Overview" value="overview" sx={{ minHeight: 40, fontSize: "0.85rem", textTransform: "none" }} />
          <Tab label="Traces" value="traces" sx={{ minHeight: 40, fontSize: "0.85rem", textTransform: "none" }} />
          <Tab label="Scoring" value="scoring" sx={{ minHeight: 40, fontSize: "0.85rem", textTransform: "none" }} />
          <Tab label="Labeling" value="labeling" sx={{ minHeight: 40, fontSize: "0.85rem", textTransform: "none" }} />
          <Tab label="Settings" value="settings" sx={{ minHeight: 40, fontSize: "0.85rem", textTransform: "none" }} onClick={() => navigate({ name: "agent-settings", projectId })} />
        </Tabs>
      </Box>

      {/* Tab content */}
      {activeTab === "overview" && renderOverview()}
      {activeTab === "traces" && renderTraces()}
      {activeTab === "scoring" && renderScoring()}
      {activeTab === "labeling" && renderLabeling()}
    </Box>
  );
}
