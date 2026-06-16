import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import AuraTabPanel from "@tricentis/aura/components/TabPanel.js";
import ChipStatus from "@tricentis/aura/components/ChipStatus.js";
import ChipSubtle from "@tricentis/aura/components/ChipSubtle.js";
import Tag from "@tricentis/aura/components/Tag.js";
import Alert from "@mui/material/Alert";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import TextField from "@mui/material/TextField";
import LinearProgress from "@mui/material/LinearProgress";
import type {
  View,
  CalibrationScenario,
  SuggestedDimension,
  EvalQuestion,
  ShowcaseCategory,
} from "../types";
import {
  getProject,
  getEvalDesign,
  SPEC_GENERATED_QUESTIONS,
  SPEC_TAXONOMY,
} from "../data/mock";

interface Props {
  projectId: string;
  navigate: (v: View) => void;
}

type Mode = "guided" | "expert";
type PathKey = "observation" | "spec";
type TabKey = "observation" | "spec" | "calibration";

// ── Calibration category config ───────────────────────────────────────────────

const CAT_CONFIG = {
  nightmare: {
    label: "Nightmare",
    guidedLabel: "Hard Cases",
    color: "error" as const,
    bg: "rgba(var(--mui-palette-error-mainChannel) / 0.08)",
    border: "rgba(var(--mui-palette-error-mainChannel) / 0.3)",
    desc: "Adversarial inputs, edge conditions, failure modes",
    guidedDesc: "Tricky situations where things could go wrong",
  },
  reality: {
    label: "Reality",
    guidedLabel: "Normal Cases",
    color: "primary" as const,
    bg: "rgba(var(--mui-palette-primary-mainChannel) / 0.08)",
    border: "rgba(var(--mui-palette-primary-mainChannel) / 0.3)",
    desc: "Scenarios where the agent is expected to succeed reliably",
    guidedDesc: "Everyday tasks your agent should handle reliably",
  },
  dream: {
    label: "Dream",
    guidedLabel: "Stretch Goals",
    color: "success" as const,
    bg: "rgba(var(--mui-palette-success-mainChannel) / 0.08)",
    border: "rgba(var(--mui-palette-success-mainChannel) / 0.3)",
    desc: "Stretch scenarios that probe capabilities beyond current expectations",
    guidedDesc: "Ambitious scenarios that show how far your agent can go",
  },
};

const GUIDED_CATEGORY_LABELS: Record<ShowcaseCategory, string> = {
  "Benchmark Performance": "Getting the right answer",
  "Value Efficiency": "Cost & speed",
  "UX Signal": "Reliability",
  "Harmony": "Staying grounded",
  "Stability": "Consistency",
  "Agency": "Smart decisions",
};

const DIRECTIONALITY_LABEL: Record<string, string> = {
  higher_is_better: "↑ higher is better",
  lower_is_better: "↓ lower is better",
};

const RISK_COLOR: Record<string, "error" | "warning" | "success"> = {
  high: "error",
  medium: "warning",
  low: "success",
};

const PIPELINE_STAGES = [
  { label: "Systematization", desc: "Grounding spec concepts in edge cases and operational distinctions" },
  { label: "Taxonomization", desc: "Building permissible/impermissible behavior taxonomy" },
  { label: "Test-Set Generation", desc: "Stratifying test cases across task type, persona, environment, tool availability" },
  { label: "Scoring Setup", desc: "Deriving judge criteria and policy citations for trace-level scoring" },
];

// ── Spec placeholder content ──────────────────────────────────────────────────

const EXPERT_SPEC = `agent: CURA Diagnostic Agent
version: "1.0"
purpose: |
  Helps QA engineers identify root causes of failing or flaky tests in CI pipelines.
  Receives test execution logs, environment metadata, and a dependency graph.
  Expected to provide actionable, grounded diagnoses for CI-blocking failures.

tools:
  fetch_test_logs(suite_id, run_range):      retrieve execution history for a test suite
  fetch_dependency_graph(service_id):        return the dependency tree for a target service
  fetch_environment_snapshot(run_id):        pull environment config and metadata at time of run
  query_change_history(service_id, since):   surface recent deployments or configuration changes
  emit_diagnosis_report(root_cause, confidence, recommended_fix): structured output — final action

success_criteria:
  - Distinguish flaky tests (intermittent, <80% fail rate) from broken tests (≥80% fail rate)
  - Identify whether failure is in the test itself, the system under test, or the environment
  - Pinpoint the specific component, service, or configuration change responsible
  - Emit a structured diagnosis: root_cause (string), confidence (0.0–1.0), recommended_fix (string)
  - Complete within 45s for CI-blocking use cases
  - Stay within 8,000 tokens total per session (input + output + tool calls)
  - Use minimum effective tool calls; optimal path to diagnosis is ≤3 calls

failure_modes:
  - Must NOT blame a healthy component — false positive root cause
  - Must NOT fabricate log entries or deployment events not present in provided context
  - Must NOT emit confidence > 0.7 when root cause is genuinely ambiguous
  - Must NOT re-fetch data already present in the session context window
  - Must NOT exceed token budget by more than 20% on any standard scenario
  - Must NOT allow injected content in log payloads to override or alter the diagnosis

constraints:
  latency_budget_ms: 45000   # P90 for CI-blocking cases; >60,000ms is a critical violation
  token_budget: 8000         # total per session; >9,600 triggers constraint violation
  confidence_floor: 0.4      # minimum confidence before emitting verdict; below → "inconclusive"
  false_positive_tolerance: 0.05  # at most 5% of healthy components incorrectly blamed

edge_cases:
  - Clock skew in test environment causing intermittent timing failures (not a code defect)
  - Failure in test setup/teardown fixture, not in the system under test
  - Cascade failure where primary service is healthy but secondary dependency is down
  - Ambiguous logs with no definitive error signal — correct output is "inconclusive"
  - Contradictory signals: test runner logs say pass, CI report says fail
  - Prompt injection embedded in log content attempting to override diagnosis output`;

const GUIDED_DEFAULTS = {
  purpose: "The CURA agent helps our QA engineers figure out why tests are failing in CI. It reads through test logs and tells you whether a test is randomly flaky (fails sometimes) or genuinely broken (always fails), and what's causing it.",
  failures: "It should never blame the wrong part of our system, or make something up when the logs are unclear. It also needs to be fast enough not to hold up the whole CI pipeline.",
  concerns: "I'm most worried it'll confidently give us a wrong answer when the problem is somewhere unexpected — like blaming our main service when the real issue is a database it depends on.",
};

const SHOWCASE_CATEGORIES = [
  { key: "Benchmark Performance", desc: "Did the agent do the right thing?" },
  { key: "Value Efficiency", desc: "Was the cost worth the output?" },
  { key: "UX Signal", desc: "Fast, reliable, low error rate?" },
  { key: "Harmony", desc: "Output consistent with provided context?" },
  { key: "Stability", desc: "Consistent across equivalent inputs?" },
  { key: "Agency", desc: "Tool selection and planning efficiency?" },
];

const RISK_AREAS = [
  "Credential / secret exposure",
  "Hallucinated state or facts",
  "Wrong tool selection",
  "PII leakage",
  "Path / permission violation",
  "Latency / cost overrun",
];

// ── Main view ─────────────────────────────────────────────────────────────────

export default function EvalDesignView({ projectId, navigate }: Props) {
  const project = getProject(projectId);
  const design = getEvalDesign(projectId);
  const status = design?.status ?? "no_design";

  const [mode, setMode] = useState<Mode>("guided");
  const [selectedPaths, setSelectedPaths] = useState<Set<PathKey>>(() => {
    if (status === "observation_ready") return new Set<PathKey>(["observation"]);
    if (status === "confirmed") return new Set<PathKey>(["observation", "spec"]);
    return new Set<PathKey>(["spec"]);
  });
  const [activeTabKey, setActiveTabKey] = useState<TabKey>(() =>
    status === "observation_ready" ? "observation" : "spec"
  );

  const visibleTabs: TabKey[] = [
    ...(selectedPaths.has("observation") ? ["observation" as TabKey] : []),
    ...(selectedPaths.has("spec") ? ["spec" as TabKey] : []),
    "calibration",
  ];

  useEffect(() => {
    if (!visibleTabs.includes(activeTabKey)) {
      setActiveTabKey(visibleTabs[0]);
    }
  }, [selectedPaths]);

  function togglePath(path: PathKey) {
    setSelectedPaths((prev) => {
      if (prev.has(path) && prev.size === 1) return prev; // keep at least one
      const next = new Set(prev);
      next.has(path) ? next.delete(path) : next.add(path);
      return next;
    });
  }

  const activeTabIndex = visibleTabs.indexOf(activeTabKey);

  if (!project) return <Box sx={{ p: 3 }}><Typography>Project not found.</Typography></Box>;

  return (
    <Box sx={{ p: 3, maxWidth: 1060 }}>
      {/* Breadcrumb */}
      <Box sx={{ display: "flex", gap: 0.5, alignItems: "center", mb: 2 }}>
        <Button size="small" onClick={() => navigate({ name: "fleet" })} sx={{ color: "text.disabled" }}>Fleet</Button>
        <Typography sx={{ color: "text.disabled" }}>/</Typography>
        <Button size="small" onClick={() => navigate({ name: "project", projectId })} sx={{ color: "text.secondary" }}>
          {project.name}
        </Button>
        <Typography sx={{ color: "text.disabled" }}>/</Typography>
        <Typography variant="body2" sx={{ color: "text.primary", fontWeight: 500, px: 0.5 }}>
          Evaluation Design
        </Typography>
      </Box>

      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5, flexWrap: "wrap" }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Evaluation Design
          </Typography>
          <DesignStatusChip status={status} />
          <Box sx={{ ml: "auto", display: "flex", border: "1px solid", borderColor: "divider", borderRadius: 1.5, overflow: "hidden" }}>
            {(["guided", "expert"] as const).map((m) => (
              <Button
                key={m}
                size="small"
                onClick={() => setMode(m)}
                sx={{
                  py: 0.35, px: 1.5, fontSize: "0.72rem", textTransform: "capitalize", minWidth: 0,
                  fontWeight: mode === m ? 700 : 400, borderRadius: 0,
                  bgcolor: mode === m ? "primary.main" : "transparent",
                  color: mode === m ? "primary.contrastText" : "text.secondary",
                  "&:hover": { bgcolor: mode === m ? "primary.dark" : "action.hover" },
                }}
              >
                {m === "guided" ? "Guided" : "Expert"}
              </Button>
            ))}
          </Box>
        </Box>
        <Typography variant="body2" sx={{ color: "text.secondary", maxWidth: 700 }}>
          {mode === "guided"
            ? "The hardest part of agent evaluation is deciding what to test. Choose how you want to build your evaluation design, then confirm it to start scoring."
            : "The hardest part of agent evaluation is not running it — it is deciding what to evaluate. A benchmark built only around expected successes will produce a PASS on an agent that is not production-ready."}
        </Typography>
      </Box>

      {/* Path selection cards — shown until design is confirmed */}
      {status !== "confirmed" && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", mb: 1 }}>
            Choose your approach — select one or both
          </Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <PathCard
              pathKey="observation"
              selected={selectedPaths.has("observation")}
              onToggle={() => togglePath("observation")}
              mode={mode}
              status={status}
            />
            <PathCard
              pathKey="spec"
              selected={selectedPaths.has("spec")}
              onToggle={() => togglePath("spec")}
              mode={mode}
              status={status}
            />
          </Box>
        </Box>
      )}

      {/* Output summary alert — shown until confirmed */}
      {status !== "confirmed" && (
        <Alert severity="info" icon={false} sx={{ mb: 3, "& .MuiAlert-message": { width: "100%" } }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
            {mode === "guided" ? "Both approaches produce the same result" : "Both paths produce the same output: a confirmed evaluation design"}
          </Typography>
          <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
            {[
              { label: "Dimensions", detail: mode === "guided" ? "What to measure" : "What to score, with directionality (↑ or ↓)" },
              { label: "Thresholds", detail: mode === "guided" ? "What counts as passing" : "Minimum passing score per dimension" },
              { label: "Test cases", detail: mode === "guided" ? "Hard, normal, and stretch scenarios" : "Nightmares · Reality · Dreams" },
            ].map(({ label, detail }) => (
              <Box key={label}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: "text.primary", display: "block" }}>{label}</Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>{detail}</Typography>
              </Box>
            ))}
          </Box>
        </Alert>
      )}

      {/* Confirmed design summary */}
      {status === "confirmed" && design && (
        <ConfirmedDesignBanner design={design} mode={mode} />
      )}

      {/* Tabs — filtered by selected paths */}
      <Paper sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
        <Tabs
          value={activeTabIndex}
          onChange={(_, v: number) => setActiveTabKey(visibleTabs[v])}
          sx={{ borderBottom: "1px solid", borderColor: "divider", bgcolor: "action.hover" }}
        >
          {visibleTabs.includes("observation") && (
            <Tab
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                  {mode === "guided" ? "Watch & learn" : "Observation-Based"}
                  {status === "observation_ready" && <ChipStatus status="Ready" />}
                </Box>
              }
              sx={{ fontSize: "0.8rem" }}
            />
          )}
          {visibleTabs.includes("spec") && (
            <Tab
              label={mode === "guided" ? "Describe it" : "Spec-Based"}
              sx={{ fontSize: "0.8rem" }}
            />
          )}
          <Tab
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                {mode === "guided" ? "Test cases" : "Calibration Set"}
                {status === "confirmed" && design && (
                  <CalibrationCoverageBadge scenarios={design.calibrationSet} />
                )}
              </Box>
            }
            sx={{ fontSize: "0.8rem" }}
          />
        </Tabs>

        {visibleTabs.includes("observation") && (
          <AuraTabPanel value={activeTabIndex} index={visibleTabs.indexOf("observation")} sx={{ p: 3 }}>
            <ObservationTab projectId={projectId} design={design} status={status} mode={mode} />
          </AuraTabPanel>
        )}
        {visibleTabs.includes("spec") && (
          <AuraTabPanel value={activeTabIndex} index={visibleTabs.indexOf("spec")} sx={{ p: 3 }}>
            <SpecTab projectId={projectId} status={status} mode={mode} />
          </AuraTabPanel>
        )}
        <AuraTabPanel value={activeTabIndex} index={visibleTabs.indexOf("calibration")} sx={{ p: 3 }}>
          <CalibrationSetTab design={design} status={status} mode={mode} />
        </AuraTabPanel>
      </Paper>
    </Box>
  );
}

// ── Path selection card ───────────────────────────────────────────────────────

function PathCard({
  pathKey, selected, onToggle, mode, status,
}: {
  pathKey: PathKey; selected: boolean; onToggle: () => void; mode: Mode; status: string;
}) {
  const isObs = pathKey === "observation";
  const hasObsData = status === "observation_ready";

  const titles = {
    guided: { observation: "Watch & learn", spec: "Describe it" },
    expert: { observation: "Observation-Based", spec: "Spec-Based" },
  };
  const descriptions = {
    guided: {
      observation: "Run your agent and let AgentScore watch. After a few sessions, we'll recommend what to measure based on how it actually behaves — no writing required.",
      spec: "Tell us what your agent is supposed to do and what you're worried about. We'll figure out what to test.",
    },
    expert: {
      observation: "Run the agent in shadow mode. AgentScore watches tool call distribution, session shape, output variance, and failure clustering. After 10+ sessions it surfaces a Measurement Recommendation.",
      spec: "Write what the agent is supposed to do: purpose, tools, success criteria, failure modes, and constraints. AgentScore builds a behavior taxonomy and generates stratified evals with judge criteria.",
    },
  };
  const produces = {
    guided: {
      observation: [
        "What your agent actually measures up to",
        "Suggested pass/fail thresholds based on real behavior",
        "Test cases built from real failure patterns",
      ],
      spec: [
        "A list of things to test, matched to what you described",
        "Clear pass/fail checks in plain language",
        "Test cases that cover your stated risks and concerns",
      ],
    },
    expert: {
      observation: [
        "Suggested dimensions with directionality defined",
        "Thresholds derived from the agent's observed baseline",
        "Seed calibration set from real failure patterns (nightmares first)",
      ],
      spec: [
        "Permissible/impermissible behavior taxonomy derived from spec",
        "Stratified evals with judge criteria for trace-level scoring",
        "Test dimensions across task type, persona, environment, tool availability",
      ],
    },
  };
  const footnotes = {
    guided: {
      observation: "Good if you already have your agent running somewhere.",
      spec: "Good if your agent is new or you want to cover specific risks.",
    },
    expert: {
      observation: "Best for agents with existing production or shadow-mode traffic.",
      spec: "Best for new agents or when specific risk categories need coverage.",
    },
  };

  const accentColor = selected
    ? isObs
      ? (hasObsData ? "warning" : "primary")
      : "primary"
    : undefined;

  return (
    <Paper
      component={ButtonBase}
      onClick={onToggle}
      sx={{
        p: 2, textAlign: "left", display: "block", cursor: "pointer",
        border: "2px solid",
        borderColor: selected
          ? isObs && hasObsData ? "warning.main" : "primary.main"
          : "divider",
        borderRadius: 2,
        bgcolor: selected
          ? isObs && hasObsData
            ? "rgba(var(--mui-palette-warning-mainChannel) / 0.06)"
            : "rgba(var(--mui-palette-primary-mainChannel) / 0.06)"
          : "transparent",
        transition: "border-color 0.15s, background-color 0.15s",
        "&:hover": { borderColor: isObs && hasObsData ? "warning.main" : "primary.main" },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 0.75 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          {titles[mode][pathKey]}
          {isObs && hasObsData && <ChipStatus status="Ready" sx={{ ml: 1 }} />}
        </Typography>
        <Box
          sx={{
            width: 20, height: 20, borderRadius: "50%", flexShrink: 0, mt: 0.1,
            border: "2px solid",
            borderColor: selected
              ? isObs && hasObsData ? "warning.main" : "primary.main"
              : "divider",
            bgcolor: selected
              ? isObs && hasObsData ? "warning.main" : "primary.main"
              : "transparent",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          {selected && (
            <Typography sx={{ fontSize: "0.55rem", color: "white", fontWeight: 800, lineHeight: 1 }}>✓</Typography>
          )}
        </Box>
      </Box>

      <Typography variant="body2" sx={{ color: "text.secondary", mb: 1.5 }}>
        {descriptions[mode][pathKey]}
      </Typography>

      <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 600, display: "block", mb: 0.5 }}>
        {mode === "guided" ? "You'll get" : "Produces"}
      </Typography>
      {produces[mode][pathKey].map((item) => (
        <Box key={item} sx={{ display: "flex", gap: 0.75, mb: 0.4 }}>
          <Typography variant="caption" sx={{ color: accentColor ? `${accentColor}.main` : "primary.main", fontWeight: 700, flexShrink: 0 }}>›</Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>{item}</Typography>
        </Box>
      ))}
      <Typography variant="caption" sx={{ color: "text.disabled", display: "block", mt: 1.5, fontStyle: "italic" }}>
        {footnotes[mode][pathKey]}
      </Typography>
    </Paper>
  );
}

// ── Design status chip ────────────────────────────────────────────────────────

function DesignStatusChip({ status }: { status: string }) {
  if (status === "confirmed") return <ChipStatus status="Passed" />;
  if (status === "observation_ready") return <ChipStatus status="Pending" />;
  return <ChipStatus status="Draft" />;
}

// ── Confirmed design banner ───────────────────────────────────────────────────

function ConfirmedDesignBanner({ design, mode }: { design: ReturnType<typeof getEvalDesign>; mode: Mode }) {
  if (!design) return null;
  const nm = design.calibrationSet.filter((s) => s.category === "nightmare").length;
  const re = design.calibrationSet.filter((s) => s.category === "reality").length;
  const dr = design.calibrationSet.filter((s) => s.category === "dream").length;
  const allThree = nm > 0 && re > 0 && dr > 0;

  return (
    <Paper sx={{ mb: 2.5, border: "1px solid", borderColor: "success.dark", borderRadius: 2, overflow: "hidden" }}>
      <Box sx={{ px: 2.5, py: 1.5, bgcolor: "rgba(var(--mui-palette-success-mainChannel) / 0.1)", display: "flex", alignItems: "center", gap: 1.5 }}>
        <ChipStatus status="Passed" />
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {mode === "guided"
            ? "Scoring is running on every session. You'll see results in the runs view."
            : "Scoring runs against these dimensions and calibration scenarios on every session. Nothing gates a deploy until you act on the verdict."}
        </Typography>
      </Box>
      <Divider sx={{ borderColor: "success.dark" }} />
      <Box sx={{ px: 2.5, pt: 2, pb: 1.5 }}>
        <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", mb: 1.5 }}>
          {mode === "guided" ? "What we're measuring" : "Scoring dimensions"}
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {design.confirmedDimensions.map((d) => (
            <Box key={d.name} sx={{ display: "grid", gridTemplateColumns: "180px 80px 60px 1fr", gap: 2, alignItems: "center", py: 0.75, px: 1, borderRadius: 1, bgcolor: "action.hover" }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {mode === "guided" ? GUIDED_CATEGORY_LABELS[d.name] ?? d.name : d.name}
              </Typography>
              {mode === "expert" && (
                <ChipSubtle label={DIRECTIONALITY_LABEL[d.directionality]} sx={{ height: 18, fontSize: "0.6rem", fontWeight: 600 }} />
              )}
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="caption" sx={{ color: "text.disabled", display: "block", fontSize: "0.58rem" }}>
                  {mode === "guided" ? "pass if ≥" : "pass if ≥"}
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "success.main", lineHeight: 1 }}>{d.suggestedThreshold}</Typography>
              </Box>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>{d.rationale}</Typography>
            </Box>
          ))}
        </Box>
      </Box>
      <Divider sx={{ borderColor: "divider" }} />
      <Box sx={{ px: 2.5, py: 1.5, display: "flex", alignItems: "center", gap: 3, flexWrap: "wrap" }}>
        <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {mode === "guided" ? "Test cases" : "Calibration set"}
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          {[
            { color: "error.main", count: nm, label: mode === "guided" ? "hard" : "nightmare" },
            { color: "primary.main", count: re, label: mode === "guided" ? "normal" : "reality" },
            { color: "success.main", count: dr, label: mode === "guided" ? "stretch" : `dream${dr !== 1 ? "s" : ""}` },
          ].map(({ color, count, label }) => (
            <Box key={label} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: color }} />
              <Typography variant="caption" sx={{ fontWeight: 700 }}>{count} {label}</Typography>
            </Box>
          ))}
        </Box>
        {!allThree && <ChipStatus status="Pending" />}
        {allThree && <ChipStatus status="Passed" />}
      </Box>
    </Paper>
  );
}

// ── Calibration coverage badge ────────────────────────────────────────────────

function CalibrationCoverageBadge({ scenarios }: { scenarios: CalibrationScenario[] }) {
  const complete = ["nightmare", "reality", "dream"].every((c) => scenarios.some((s) => s.category === c));
  return <ChipStatus status={complete ? "Passed" : "Pending"} />;
}

// ── Observation-Based tab ─────────────────────────────────────────────────────

function ObservationTab({
  design, status, mode,
}: {
  projectId: string; design: ReturnType<typeof getEvalDesign>; status: string; mode: Mode;
}) {
  const [confirmClicked, setConfirmClicked] = useState(false);

  if (status === "no_design") {
    return (
      <Box>
        <Alert severity="info" sx={{ mb: 2 }}>
          {mode === "guided"
            ? "This approach needs your agent to have run at least a few times. Once it has, AgentScore will watch what it does and suggest what to measure."
            : "The observation-based path requires at least 10 shadow-mode sessions. This agent hasn't accumulated enough sessions yet. Run the agent in shadow mode and return here once it has."}
        </Alert>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
          {mode === "guided"
            ? "While you wait, you can use the Describe it tab to set up evaluations based on what you know the agent should do."
            : "While waiting, you can use the Spec-Based tab to design evaluations from a description of what this agent is supposed to do."}
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {mode === "guided" ? "AgentScore will watch for:" : "The observation layer will watch for:"}
        </Typography>
        <Box component="ul" sx={{ mt: 1, pl: 2 }}>
          {mode === "guided" ? [
            "Which actions your agent takes, and how often",
            "How long sessions take and whether they complete successfully",
            "Whether your agent gives different answers to the same question",
            "Whether it uses the information it's given",
            "Patterns in where and how it fails",
          ] : [
            "Tool call distribution — which tools the agent calls, how often, in what sequences",
            "Session shape — length, step count, retry frequency, error rate, abandonment patterns",
            "Output variance — whether the agent produces different outputs on equivalent inputs",
            "Context grounding — whether RAG-retrieved data, injected state, or system context appears in tool calls and outputs",
            "Failure clustering — sessions grouped by failure type, where the agent struggles",
          ].map((item) => (
            <Typography key={item} component="li" variant="body2" sx={{ color: "text.secondary", mb: 0.5 }}>
              {item}
            </Typography>
          ))}
        </Box>
      </Box>
    );
  }

  if (status === "confirmed") {
    const dims = design?.confirmedDimensions ?? [];
    return (
      <Box>
        <Alert severity="success" sx={{ mb: 2.5 }}>
          {mode === "guided"
            ? "This evaluation was set up by watching your agent run. Scoring is active. To add more test cases, use the Test cases tab."
            : "This design was confirmed via the observation-based path. Scoring is active against the dimensions and calibration set below. To add or adjust calibration scenarios, use the Calibration Set tab."}
        </Alert>
        {dims.length > 0 && (
          <>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
              {mode === "guided" ? "Active measurements" : "Active dimensions"}
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {dims.map((d) => <SuggestedDimensionCard key={d.name} dim={d} confirmed mode={mode} />)}
            </Box>
          </>
        )}
      </Box>
    );
  }

  const rec = design?.measurementRecommendation;
  if (!rec) return null;

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          {mode === "guided" ? "Here's what AgentScore found" : "Measurement Recommendation"}
        </Typography>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          Based on {rec.shadowSessionCount} sessions · Generated {new Date(rec.generatedAt).toLocaleDateString()}
        </Typography>
      </Box>

      <Alert severity="warning" sx={{ mb: 2.5 }} icon={false}>
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.25 }}>
          {mode === "guided" ? "Take a look before confirming" : "Review before confirming"}
        </Typography>
        <Typography variant="body2">
          {mode === "guided"
            ? "These suggestions come from watching your agent run — not from a written spec. Review each one and make sure it makes sense for your use case."
            : "These suggestions are derived from observed behavior, not ground truth. Confirm or adjust each dimension and calibration scenario before scoring begins."}
        </Typography>
      </Alert>

      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
        {mode === "guided" ? "Suggested measurements" : "Suggested Dimensions"}
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mb: 3 }}>
        {rec.suggestedDimensions.map((dim) => <SuggestedDimensionCard key={dim.name} dim={dim} mode={mode} />)}
      </Box>

      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
        {mode === "guided" ? "Suggested test cases" : "Seed Calibration Scenarios"}
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 1.5 }}>
        {mode === "guided"
          ? "These come from real sessions where your agent struggled. Review and keep the ones that matter."
          : "Surfaced from observed failure patterns in shadow-mode traffic. Review each — nightmare scenarios are sourced from real sessions where the agent struggled."}
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mb: 3 }}>
        {rec.calibrationSeed.map((scenario) => <ScenarioCard key={scenario.id} scenario={scenario} showCheckbox={false} mode={mode} />)}
      </Box>

      {!confirmClicked ? (
        <Box sx={{ display: "flex", gap: 1.5, pt: 1 }}>
          <Button variant="contained" color="success" onClick={() => setConfirmClicked(true)}>
            {mode === "guided" ? "Looks good — start scoring" : "Confirm this design"}
          </Button>
          <Button variant="outlined" color="inherit" sx={{ color: "text.secondary" }}>
            {mode === "guided" ? "Make changes" : "Adjust dimensions"}
          </Button>
        </Box>
      ) : (
        <Alert severity="success">
          {mode === "guided"
            ? "Done! Scoring will start on the next session. You can add more test cases in the Test cases tab."
            : "Design confirmed. Scoring will begin against these dimensions and calibration scenarios on the next session. You can review and extend the calibration set in the Calibration Set tab."}
        </Alert>
      )}
    </Box>
  );
}

// ── Spec-Based tab ────────────────────────────────────────────────────────────

function SpecTab({ status, mode }: { projectId: string; status: string; mode: Mode }) {
  const [specText, setSpecText] = useState(EXPERT_SPEC);
  const [guidedPurpose, setGuidedPurpose] = useState(GUIDED_DEFAULTS.purpose);
  const [guidedFailures, setGuidedFailures] = useState(GUIDED_DEFAULTS.failures);
  const [guidedConcerns, setGuidedConcerns] = useState(GUIDED_DEFAULTS.concerns);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set(["Benchmark Performance", "Value Efficiency", "UX Signal", "Agency", "Harmony", "Stability"])
  );
  const [selectedRisks, setSelectedRisks] = useState<Set<string>>(
    new Set(["Hallucinated state or facts", "Wrong tool selection"])
  );
  const [generated, setGenerated] = useState(status === "no_design");
  const [generating, setGenerating] = useState(false);
  const [generatingStage, setGeneratingStage] = useState(0);
  const [questions, setQuestions] = useState<EvalQuestion[]>(
    status === "no_design"
      ? SPEC_GENERATED_QUESTIONS.map((q) => ({ ...q, selected: q.riskLevel === "high" }))
      : []
  );
  const [confirmed, setConfirmed] = useState(false);

  function toggleCategory(key: string) {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function toggleRisk(key: string) {
    setSelectedRisks((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function handleGenerate() {
    const hasContent = mode === "guided"
      ? guidedPurpose.trim().length > 0
      : specText.trim().length > 0;
    if (!hasContent) return;
    setGenerating(true);
    setGeneratingStage(1);
    setTimeout(() => setGeneratingStage(2), 350);
    setTimeout(() => setGeneratingStage(3), 700);
    setTimeout(() => setGeneratingStage(4), 1050);
    setTimeout(() => {
      setQuestions(SPEC_GENERATED_QUESTIONS.map((q) => ({ ...q, selected: q.riskLevel === "high" })));
      setGenerating(false);
      setGenerated(true);
      setGeneratingStage(0);
    }, 1400);
  }

  const selectedCount = questions.filter((q) => q.selected).length;

  return (
    <Box>
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
        {mode === "guided"
          ? "Tell us about your agent in plain language — what it does, who uses it, and what you're worried about. A few sentences is enough."
          : "Write what this agent is supposed to do — purpose, tools, success criteria, failure modes, and constraints. The spec is first-class input, not background context. AgentScore systematizes it into a permissible/impermissible behavior taxonomy, then generates stratified eval cases with judge criteria grounded in specific spec clauses."}
      </Typography>

      {!generated ? (
        <>
          {mode === "guided" ? (
            /* Guided mode: simple form */
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 2.5 }}>
              <TextField
                label="What does your agent do?"
                multiline
                minRows={3}
                fullWidth
                variant="outlined"
                placeholder="e.g. It helps our QA team figure out why tests fail in CI — reads logs and tells you if a test is randomly flaky or genuinely broken."
                value={guidedPurpose}
                onChange={(e) => setGuidedPurpose(e.target.value)}
                helperText="Who uses it, and what problem does it solve?"
              />
              <TextField
                label="What should it never do?"
                multiline
                minRows={2}
                fullWidth
                variant="outlined"
                placeholder="e.g. It should never blame the wrong service, make things up, or take longer than 45 seconds."
                value={guidedFailures}
                onChange={(e) => setGuidedFailures(e.target.value)}
                helperText="What would a wrong or harmful output look like?"
              />
              <TextField
                label="What are you most worried about?"
                multiline
                minRows={2}
                fullWidth
                variant="outlined"
                placeholder="e.g. I'm worried it'll confidently give us a wrong answer when the logs are confusing."
                value={guidedConcerns}
                onChange={(e) => setGuidedConcerns(e.target.value)}
                helperText="Optional — helps us prioritize what to test first."
              />
            </Box>
          ) : (
            /* Expert mode: YAML spec + category/risk scoping */
            <>
              <Paper sx={{ p: 2, mb: 2.5, border: "1px solid", borderColor: "primary.dark", borderRadius: 1.5, bgcolor: "action.hover" }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>Scope the evaluation</Typography>
                <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 1.5 }}>
                  Select the evaluation categories and risk areas most relevant to this agent. This constrains output to evals you can actually act on.
                </Typography>
                <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", mb: 0.75 }}>
                  Evaluation categories
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 2 }}>
                  {SHOWCASE_CATEGORIES.map(({ key, desc }) => (
                    <Chip
                      key={key} label={key} size="small"
                      variant={selectedCategories.has(key) ? "filled" : "outlined"}
                      color={selectedCategories.has(key) ? "primary" : "default"}
                      onClick={() => toggleCategory(key)}
                      sx={{ cursor: "pointer", fontWeight: selectedCategories.has(key) ? 700 : 400, fontSize: "0.72rem" }}
                      title={desc}
                    />
                  ))}
                </Box>
                <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", mb: 0.75 }}>
                  Risk areas to probe (optional)
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                  {RISK_AREAS.map((r) => (
                    <Chip
                      key={r} label={r} size="small"
                      variant={selectedRisks.has(r) ? "filled" : "outlined"}
                      color={selectedRisks.has(r) ? "error" : "default"}
                      onClick={() => toggleRisk(r)}
                      sx={{ cursor: "pointer", fontWeight: selectedRisks.has(r) ? 700 : 400, fontSize: "0.72rem" }}
                    />
                  ))}
                </Box>
              </Paper>
              <TextField
                multiline minRows={14} maxRows={22} fullWidth variant="outlined"
                placeholder="Paste or write a structured agent spec…"
                value={specText}
                onChange={(e) => setSpecText(e.target.value)}
                sx={{ mb: 2, "& textarea": { fontFamily: "monospace", fontSize: "0.78rem", lineHeight: 1.6 } }}
              />
            </>
          )}

          {generating && (
            <Paper sx={{ p: 2, mb: 2, border: "1px solid", borderColor: "divider", borderRadius: 1.5 }}>
              <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", mb: 1.5 }}>
                {mode === "guided" ? "Working out what to test…" : "Processing spec"}
              </Typography>
              {mode === "expert" ? (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {PIPELINE_STAGES.map((stage, i) => {
                    const stageNum = i + 1;
                    const isActive = generatingStage === stageNum;
                    const isDone = generatingStage > stageNum;
                    return (
                      <Box key={stage.label} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Box sx={{
                          width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          bgcolor: isDone ? "success.main" : isActive ? "primary.main" : "action.hover",
                          border: "1px solid",
                          borderColor: isDone ? "success.main" : isActive ? "primary.main" : "divider",
                        }}>
                          {isDone ? (
                            <Typography sx={{ fontSize: "0.55rem", color: "white", fontWeight: 800 }}>✓</Typography>
                          ) : (
                            <Typography sx={{ fontSize: "0.55rem", color: isActive ? "white" : "text.disabled", fontWeight: 700 }}>{stageNum}</Typography>
                          )}
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="caption" sx={{ fontWeight: isActive || isDone ? 700 : 400, color: isDone ? "success.main" : isActive ? "text.primary" : "text.disabled", display: "block", lineHeight: 1.2 }}>
                            {stage.label}
                          </Typography>
                          {isActive && (
                            <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.68rem" }}>
                              {stage.desc}…
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
                  {[
                    { step: 1, label: "Reading what you wrote" },
                    { step: 2, label: "Figuring out what could go wrong" },
                    { step: 3, label: "Building a list of things to test" },
                    { step: 4, label: "Setting up pass/fail criteria" },
                  ].map(({ step, label }) => {
                    const isDone = generatingStage > step;
                    const isActive = generatingStage === step;
                    return (
                      <Box key={step} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography variant="caption" sx={{ color: isDone ? "success.main" : isActive ? "primary.main" : "text.disabled", fontWeight: 700, width: 16, flexShrink: 0 }}>
                          {isDone ? "✓" : isActive ? "›" : "·"}
                        </Typography>
                        <Typography variant="caption" sx={{ color: isDone ? "success.main" : isActive ? "text.primary" : "text.disabled" }}>
                          {label}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              )}
              <LinearProgress sx={{ mt: 1.5, borderRadius: 1 }} />
            </Paper>
          )}

          <Button
            variant="contained"
            disabled={generating || (mode === "guided" ? !guidedPurpose.trim() : !specText.trim())}
            onClick={handleGenerate}
          >
            {mode === "guided" ? "Generate tests" : "Generate evaluation design"}
          </Button>
        </>
      ) : (
        <>
          {/* Taxonomy section */}
          <Paper sx={{ mb: 3, border: "1px solid", borderColor: "divider", borderRadius: 1.5, overflow: "hidden" }}>
            <Box sx={{ px: 2, py: 1.25, bgcolor: "action.hover", borderBottom: "1px solid", borderColor: "divider" }}>
              <Typography variant="caption" sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "text.disabled" }}>
                {mode === "guided" ? "What we figured out from your description" : "Behavior Taxonomy  ·  derived from spec"}
              </Typography>
            </Box>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
              <Box sx={{ p: 2, borderRight: "1px solid", borderColor: "divider" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 1 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "success.main", flexShrink: 0 }} />
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "success.main" }}>
                    {mode === "guided" ? `What it should do  (${SPEC_TAXONOMY.permissible.length})` : `Permissible  (${SPEC_TAXONOMY.permissible.length})`}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.6 }}>
                  {SPEC_TAXONOMY.permissible.map((item) => (
                    <Box key={item} sx={{ display: "flex", gap: 0.75, alignItems: "flex-start" }}>
                      <Typography variant="caption" sx={{ color: "success.main", flexShrink: 0, mt: 0.1 }}>›</Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary", lineHeight: 1.5 }}>{item}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
              <Box sx={{ p: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 1 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "error.main", flexShrink: 0 }} />
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "error.main" }}>
                    {mode === "guided" ? `What it must never do  (${SPEC_TAXONOMY.impermissible.length})` : `Impermissible  (${SPEC_TAXONOMY.impermissible.length})`}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.6 }}>
                  {SPEC_TAXONOMY.impermissible.map((item) => (
                    <Box key={item} sx={{ display: "flex", gap: 0.75, alignItems: "flex-start" }}>
                      <Typography variant="caption" sx={{ color: "error.main", flexShrink: 0, mt: 0.1 }}>✕</Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary", lineHeight: 1.5 }}>{item}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          </Paper>

          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {mode === "guided" ? `${questions.length} things to test` : `${questions.length} evaluation cases generated`}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {mode === "guided"
                  ? "The most important ones are pre-checked. Uncheck anything you don't want to include."
                  : "High-risk cases are pre-selected. Each is grounded in a spec clause with judge criteria for trace-level scoring."}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>{selectedCount} selected</Typography>
              <Button size="small" variant="text" onClick={() => setGenerated(false)} sx={{ color: "text.disabled" }}>
                {mode === "guided" ? "Start over" : "Re-generate"}
              </Button>
            </Box>
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mb: 3 }}>
            {questions.map((q) => (
              <EvalQuestionCard
                key={q.id}
                question={q}
                mode={mode}
                onToggle={(id) =>
                  setQuestions((prev) => prev.map((qq) => (qq.id === id ? { ...qq, selected: !qq.selected } : qq)))
                }
              />
            ))}
          </Box>

          {!confirmed ? (
            <Box sx={{ display: "flex", gap: 1.5, pt: 1 }}>
              <Button variant="contained" color="primary" disabled={selectedCount === 0} onClick={() => setConfirmed(true)}>
                {mode === "guided"
                  ? `Set up ${selectedCount} test${selectedCount !== 1 ? "s" : ""}`
                  : `Confirm ${selectedCount} eval${selectedCount !== 1 ? "s" : ""} and seed calibration set`}
              </Button>
            </Box>
          ) : (
            <Alert severity="success">
              {mode === "guided"
                ? `${selectedCount} test${selectedCount !== 1 ? "s" : ""} set up. You can review and adjust them in the Test cases tab.`
                : `${selectedCount} eval${selectedCount !== 1 ? "s" : ""} confirmed. The calibration set has been seeded from the impermissible behavior cases — review and adjust it in the Calibration Set tab.`}
            </Alert>
          )}
        </>
      )}
    </Box>
  );
}

// ── Calibration Set tab ───────────────────────────────────────────────────────

function CalibrationSetTab({
  design, status, mode,
}: {
  design: ReturnType<typeof getEvalDesign>; status: string; mode: Mode;
}) {
  if (status === "no_design" || !design || design.calibrationSet.length === 0) {
    return (
      <Box>
        <Alert severity="info" sx={{ mb: 2.5 }}>
          {mode === "guided"
            ? "No test cases yet. Use the Watch & learn or Describe it tab to generate them."
            : "No calibration set yet. Use the Observation-Based or Spec-Based tab to generate one."}
        </Alert>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1.5 }}>
          {(["nightmare", "reality", "dream"] as const).map((cat) => {
            const cfg = CAT_CONFIG[cat];
            const purpose = {
              nightmare: mode === "guided" ? "Tricky situations where your agent might fail. These come from real failure patterns." : "Adversarial inputs, edge conditions, failure modes. Sourced from real failure patterns in shadow-mode traffic.",
              reality: mode === "guided" ? "Everyday scenarios your agent should handle reliably. Sets the performance baseline." : "Scenarios the agent should complete reliably. Establishes the performance baseline.",
              dream: mode === "guided" ? "Ambitious scenarios that show how far your agent can go." : "Stretch scenarios beyond current expectations. Detects improvement over time.",
            }[cat];
            return (
              <Paper key={cat} sx={{ p: 2, border: `1px solid ${cfg.border}`, bgcolor: cfg.bg, borderRadius: 1.5, opacity: 0.6 }}>
                <Tag label={mode === "guided" ? cfg.guidedLabel : cfg.label} sx={{ bgcolor: `${cfg.color}.main`, color: "white", fontWeight: 700, fontSize: "0.68rem", mb: 1, "& .MuiChip-label": { color: "white" } }} />
                <Typography variant="caption" sx={{ color: "text.secondary", lineHeight: 1.5, display: "block" }}>
                  {purpose}
                </Typography>
              </Paper>
            );
          })}
        </Box>
      </Box>
    );
  }

  const nightmares = design.calibrationSet.filter((s) => s.category === "nightmare");
  const reality = design.calibrationSet.filter((s) => s.category === "reality");
  const dreams = design.calibrationSet.filter((s) => s.category === "dream");

  return (
    <Box>
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1.5, mb: 2.5 }}>
        {(["nightmare", "reality", "dream"] as const).map((cat) => {
          const count = design.calibrationSet.filter((s) => s.category === cat).length;
          const cfg = CAT_CONFIG[cat];
          const purpose = {
            nightmare: mode === "guided"
              ? "Tricky situations where things could go wrong. Add any edge cases or past failures here."
              : "Tests whether the agent fails gracefully. Sources adversarial inputs, edge cases, and failure modes — including scenarios the agent has already struggled with in production.",
            reality: mode === "guided"
              ? "Typical tasks your agent should handle well. A passing score here is a good sign, but not the whole story."
              : "Establishes the performance baseline. Scenarios the agent should complete reliably. A PASS here is necessary but not sufficient for production readiness.",
            dream: mode === "guided"
              ? "Ambitious tasks that show improvement over time. Good to have, not required."
              : "Detects capability improvement over time. Stretch scenarios beyond current expectations — prevents evaluation from only measuring regression.",
          }[cat];
          return (
            <Paper key={cat} sx={{ p: 2, border: `1px solid ${cfg.border}`, bgcolor: cfg.bg, borderRadius: 1.5 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <Tag label={mode === "guided" ? cfg.guidedLabel : cfg.label} sx={{ bgcolor: `${cfg.color}.main`, color: "white", fontWeight: 700, fontSize: "0.68rem", "& .MuiChip-label": { color: "white" } }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: `${cfg.color}.main`, lineHeight: 1, ml: "auto" }}>{count}</Typography>
              </Box>
              <Typography variant="caption" sx={{ color: "text.secondary", lineHeight: 1.5 }}>{purpose}</Typography>
            </Paper>
          );
        })}
      </Box>

      {nightmares.length === 0 && (
        <Alert severity="warning" sx={{ mb: 2.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.25 }}>
            {mode === "guided" ? "No hard cases yet" : "No nightmare scenarios — this calibration set is incomplete"}
          </Typography>
          <Typography variant="body2">
            {mode === "guided"
              ? "Testing only normal cases gives a false sense of confidence. Add some tricky or edge-case scenarios before using this to make decisions."
              : "A PASS verdict on a Reality-only calibration set does not mean the agent is production-ready. It means it did what was expected in the cases that were tested. Add adversarial inputs, edge conditions, and failure modes before using this design to gate a deploy."}
          </Typography>
        </Alert>
      )}

      {nightmares.length > 0 && <CalibrationSection title={mode === "guided" ? "Hard Cases" : "Nightmares"} category="nightmare" scenarios={nightmares} mode={mode} />}
      {reality.length > 0 && <CalibrationSection title={mode === "guided" ? "Normal Cases" : "Reality"} category="reality" scenarios={reality} mode={mode} />}
      {dreams.length > 0 && <CalibrationSection title={mode === "guided" ? "Stretch Goals" : "Dreams"} category="dream" scenarios={dreams} mode={mode} />}
    </Box>
  );
}

function CalibrationSection({
  title, category, scenarios, mode,
}: {
  title: string; category: "nightmare" | "reality" | "dream"; scenarios: CalibrationScenario[]; mode: Mode;
}) {
  const cfg = CAT_CONFIG[category];
  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
        <Tag label={title} sx={{ bgcolor: `${cfg.color}.main`, color: "white", fontWeight: 700, fontSize: "0.7rem", "& .MuiChip-label": { color: "white" } }} />
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          {mode === "guided" ? cfg.guidedDesc : cfg.desc}
        </Typography>
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        {scenarios.map((s) => <ScenarioCard key={s.id} scenario={s} showCheckbox={false} mode={mode} />)}
      </Box>
    </Box>
  );
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function SuggestedDimensionCard({ dim, confirmed = false, mode }: { dim: SuggestedDimension; confirmed?: boolean; mode: Mode }) {
  const sourceLabel: Record<string, string> = {
    observed_failure: "from observed failures",
    observed_behavior: "from observed behavior",
    spec_derived: "spec-derived",
  };
  const guidedSourceLabel: Record<string, string> = {
    observed_failure: "based on failures we saw",
    observed_behavior: "based on how it behaved",
    spec_derived: "based on your description",
  };

  return (
    <Paper sx={{ p: 2, border: "1px solid", borderColor: confirmed ? "success.dark" : "divider", borderRadius: 1.5, bgcolor: confirmed ? "rgba(var(--mui-palette-success-mainChannel) / 0.1)" : "transparent" }}>
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.75, flexWrap: "wrap" }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {mode === "guided" ? (GUIDED_CATEGORY_LABELS[dim.name] ?? dim.name) : dim.name}
            </Typography>
            {mode === "expert" && (
              <ChipSubtle label={DIRECTIONALITY_LABEL[dim.directionality]} sx={{ height: 18, fontSize: "0.6rem", fontWeight: 600 }} />
            )}
            <ChipSubtle
              label={(mode === "guided" ? guidedSourceLabel : sourceLabel)[dim.source]}
              sx={{ height: 18, fontSize: "0.6rem", color: "text.disabled" }}
            />
          </Box>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>{dim.rationale}</Typography>
        </Box>
        <Box sx={{ textAlign: "right", flexShrink: 0, minWidth: 72 }}>
          <Typography variant="caption" sx={{ color: "text.disabled", display: "block" }}>
            {confirmed ? (mode === "guided" ? "Pass score" : "Pass threshold") : (mode === "guided" ? "Suggested score" : "Suggested threshold")}
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "success.main", lineHeight: 1.2 }}>{dim.suggestedThreshold}</Typography>
          <Typography variant="caption" sx={{ color: "text.disabled", fontSize: "0.6rem" }}>out of 100</Typography>
        </Box>
      </Box>
    </Paper>
  );
}

function ScenarioCard({ scenario, showCheckbox, mode }: { scenario: CalibrationScenario; showCheckbox: boolean; mode: Mode }) {
  const cfg = CAT_CONFIG[scenario.category];
  const catLabel = mode === "guided" ? cfg.guidedLabel : cfg.label;

  return (
    <Paper sx={{ p: 2, border: "1px solid", borderColor: cfg.border, bgcolor: cfg.bg, borderRadius: 1.5 }}>
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
        {showCheckbox && <Checkbox size="small" checked={scenario.confirmed} sx={{ mt: -0.5, p: 0.5 }} />}
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
            <Tag label={catLabel} sx={{ bgcolor: `${cfg.color}.main`, height: 18, fontSize: "0.6rem", fontWeight: 700, "& .MuiChip-label": { color: "white", px: 0.75 } }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{scenario.title}</Typography>
          </Box>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 1.5 }}>{scenario.description}</Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5, borderTop: "1px solid", borderColor: cfg.border, pt: 1.5 }}>
            <Box>
              <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", mb: 0.5 }}>
                {mode === "guided" ? "Input" : "Input data"}
              </Typography>
              <Typography variant="caption" sx={{ fontFamily: "monospace", color: "text.secondary" }}>{scenario.inputData}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", mb: 0.5 }}>
                {mode === "guided" ? "What should happen" : "Expected behavior"}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>{scenario.expectedBehavior}</Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}

function EvalQuestionCard({
  question, onToggle, mode,
}: {
  question: EvalQuestion; onToggle: (id: string) => void; mode: Mode;
}) {
  const [expanded, setExpanded] = useState(false);
  const isImpermissible = question.behaviorClass === "impermissible";

  const behaviorLabel = mode === "guided"
    ? (isImpermissible ? "Must never do" : "Should do")
    : (isImpermissible ? "impermissible" : "permissible");

  const categoryLabel = mode === "guided"
    ? (GUIDED_CATEGORY_LABELS[question.showcaseCategory] ?? question.showcaseCategory)
    : question.showcaseCategory;

  const riskLabel = mode === "guided"
    ? ({ high: "High priority", medium: "Medium priority", low: "Low priority" }[question.riskLevel])
    : `${question.riskLevel} risk`;

  return (
    <Paper sx={{ border: "1px solid", borderColor: question.selected ? "primary.main" : "divider", borderRadius: 1.5, overflow: "hidden", transition: "border-color 0.15s" }}>
      <ButtonBase onClick={() => setExpanded((v) => !v)} sx={{ width: "100%", textAlign: "left", p: 2, display: "block" }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
          <FormControlLabel
            control={
              <Checkbox size="small" checked={question.selected}
                onClick={(e) => { e.stopPropagation(); onToggle(question.id); }}
                sx={{ p: 0.25 }}
              />
            }
            label="" sx={{ m: 0, flexShrink: 0, alignSelf: "flex-start", mt: 0.25 }}
          />
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5, flexWrap: "wrap" }}>
              <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 700 }}>#{question.rank}</Typography>
              <Tag label={categoryLabel} sx={{ height: 18, fontSize: "0.6rem", fontWeight: 600 }} />
              <ChipSubtle
                label={behaviorLabel}
                color={isImpermissible ? "error" : "success"}
                sx={{ height: 18, fontSize: "0.6rem", fontWeight: 600 }}
              />
              <ChipSubtle
                label={riskLabel}
                color={RISK_COLOR[question.riskLevel]}
                sx={{ height: 18, fontSize: "0.6rem", fontWeight: 600 }}
              />
              {mode === "expert" && (
                <ChipSubtle label={DIRECTIONALITY_LABEL[question.directionality]} sx={{ height: 18, fontSize: "0.6rem", color: "text.disabled" }} />
              )}
            </Box>
            <Typography variant="body2" sx={{ fontWeight: question.selected ? 600 : 400 }}>
              {question.question}
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ color: "text.disabled", flexShrink: 0, mt: 0.25 }}>
            {expanded ? "▲" : "▼"}
          </Typography>
        </Box>
      </ButtonBase>

      {expanded && (
        <Box sx={{ px: 2, pb: 2, borderTop: "1px solid", borderColor: "divider" }}>
          {mode === "guided" ? (
            /* Guided expanded: simpler layout */
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, pt: 2 }}>
              <Box>
                <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", mb: 0.5 }}>
                  What we'll do
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>{question.taskDefinition}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", mb: 0.5 }}>
                  How we measure it
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  {question.candidateMeasure.replace(/^[^:]+:\s*/, "").split(";")[0]}
                </Typography>
              </Box>
              <Box sx={{ gridColumn: "1 / -1" }}>
                <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", mb: 0.5 }}>
                  What we need
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>{question.requiredData}</Typography>
              </Box>
            </Box>
          ) : (
            /* Expert expanded: full ASSERT fields */
            <Box sx={{ pt: 2 }}>
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 2 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", mb: 0.5 }}>Task definition</Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>{question.taskDefinition}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", mb: 0.5 }}>Test dimensions</Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 0.4 }}>
                    {question.testDimensions.map((dim) => (
                      <Typography key={dim} variant="caption" sx={{ fontFamily: "monospace", color: "text.secondary", fontSize: "0.72rem" }}>{dim}</Typography>
                    ))}
                  </Box>
                </Box>
              </Box>
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 2 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", mb: 0.5 }}>Required data</Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>{question.requiredData}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", mb: 0.5 }}>Judge criteria</Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>{question.judgeCriteria}</Typography>
                </Box>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", mb: 0.5 }}>Candidate measure</Typography>
                <Typography variant="caption" sx={{ fontFamily: "monospace", color: "primary.light" }}>{question.candidateMeasure}</Typography>
              </Box>
              <Box sx={{ pt: 1.5, borderTop: "1px solid", borderColor: "divider" }}>
                <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", mb: 0.4 }}>Spec citation</Typography>
                <Typography variant="caption" sx={{ color: "text.disabled", fontStyle: "italic" }}>{question.specCitation}</Typography>
              </Box>
            </Box>
          )}
        </Box>
      )}
    </Paper>
  );
}
