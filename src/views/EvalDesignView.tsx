import { useState } from "react";
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

// ── Calibration category config ───────────────────────────────────────────────

const CAT_CONFIG = {
  nightmare: {
    label: "Nightmare",
    color: "error" as const,
    bg: "rgba(var(--mui-palette-error-mainChannel) / 0.08)",
    border: "rgba(var(--mui-palette-error-mainChannel) / 0.3)",
    desc: "Adversarial inputs, edge conditions, failure modes",
  },
  reality: {
    label: "Reality",
    color: "primary" as const,
    bg: "rgba(var(--mui-palette-primary-mainChannel) / 0.08)",
    border: "rgba(var(--mui-palette-primary-mainChannel) / 0.3)",
    desc: "Scenarios where the agent is expected to succeed reliably",
  },
  dream: {
    label: "Dream",
    color: "success" as const,
    bg: "rgba(var(--mui-palette-success-mainChannel) / 0.08)",
    border: "rgba(var(--mui-palette-success-mainChannel) / 0.3)",
    desc: "Stretch scenarios that probe capabilities beyond current expectations",
  },
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

// ── Main view ─────────────────────────────────────────────────────────────────

export default function EvalDesignView({ projectId, navigate }: Props) {
  const project = getProject(projectId);
  const design = getEvalDesign(projectId);
  const [activeTab, setActiveTab] = useState(0);

  if (!project) return <Box sx={{ p: 3 }}><Typography>Project not found.</Typography></Box>;

  const status = design?.status ?? "no_design";

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
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Evaluation Design
          </Typography>
          <DesignStatusChip status={status} />
        </Box>
        <Typography variant="body2" sx={{ color: "text.secondary", maxWidth: 700 }}>
          The hardest part of agent evaluation is not running it — it is deciding what to evaluate.
          A benchmark built only around expected successes will produce a PASS on an agent that is not
          production-ready. AgentScore provides two paths to a structured evaluation design: start from
          observed behavior, or start from a description of what the agent is supposed to do. Both
          produce the same output.
        </Typography>
      </Box>

      {/* Two-path explainer — shown until a design is confirmed */}
      {status !== "confirmed" && (
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 3 }}>
          <Paper
            sx={{
              p: 2,
              border: "1px solid",
              borderColor: status === "observation_ready" ? "warning.dark" : "divider",
              borderRadius: 2,
              bgcolor: status === "observation_ready" ? "rgba(var(--mui-palette-warning-mainChannel) / 0.08)" : "transparent",
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
              Observation-Based
              {status === "observation_ready" && (
                <ChipStatus status="Ready" sx={{ ml: 1 }} />
              )}
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 1.5 }}>
              Run the agent in shadow mode. AgentScore watches tool call distribution, session shape,
              output variance, context grounding, and failure clustering. After 10+ sessions it
              surfaces a Measurement Recommendation derived entirely from observed behavior.
            </Typography>
            <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 600, display: "block", mb: 0.5 }}>
              Produces
            </Typography>
            {[
              "Suggested dimensions to score, with directionality defined",
              "Thresholds derived from the agent's observed baseline — not generic defaults",
              "Seed calibration set seeded from real failure patterns (nightmares first)",
            ].map((item) => (
              <Box key={item} sx={{ display: "flex", gap: 0.75, mb: 0.4 }}>
                <Typography variant="caption" sx={{ color: "warning.main", fontWeight: 700, flexShrink: 0 }}>›</Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>{item}</Typography>
              </Box>
            ))}
            <Typography variant="caption" sx={{ color: "text.disabled", display: "block", mt: 1.5, fontStyle: "italic" }}>
              Best for agents with existing production or shadow-mode traffic.
            </Typography>
          </Paper>

          <Paper
            sx={{
              p: 2,
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
              Spec-Based
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 1.5 }}>
              Write what the agent is supposed to do: purpose, tools, success criteria, failure modes,
              and constraints. The spec is first-class input — not background context. AgentScore builds
              a permissible/impermissible behavior taxonomy from it, then generates stratified evals with
              judge criteria and policy citations.
            </Typography>
            <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 600, display: "block", mb: 0.5 }}>
              Produces
            </Typography>
            {[
              "Permissible/impermissible behavior taxonomy derived from spec",
              "Stratified evals with judge criteria for trace-level scoring",
              "Test dimensions across task type, persona, environment, and tool availability",
            ].map((item) => (
              <Box key={item} sx={{ display: "flex", gap: 0.75, mb: 0.4 }}>
                <Typography variant="caption" sx={{ color: "primary.main", fontWeight: 700, flexShrink: 0 }}>›</Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>{item}</Typography>
              </Box>
            ))}
            <Typography variant="caption" sx={{ color: "text.disabled", display: "block", mt: 1.5, fontStyle: "italic" }}>
              Best for new agents or when specific risk categories need coverage.
            </Typography>
          </Paper>
        </Box>
      )}

      {/* Output definition — shown until confirmed */}
      {status !== "confirmed" && (
        <Alert severity="info" icon={false} sx={{ mb: 3, "& .MuiAlert-message": { width: "100%" } }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
            Both paths produce the same output: a confirmed evaluation design
          </Typography>
          <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
            {[
              { label: "Dimensions", detail: "What to score, with directionality (↑ or ↓)" },
              { label: "Thresholds", detail: "Minimum passing score per dimension" },
              { label: "Calibration set", detail: "Nightmares · Reality · Dreams" },
            ].map(({ label, detail }) => (
              <Box key={label}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: "text.primary", display: "block" }}>{label}</Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>{detail}</Typography>
              </Box>
            ))}
          </Box>
        </Alert>
      )}

      {/* Confirmed design summary — shown when confirmed */}
      {status === "confirmed" && design && (
        <ConfirmedDesignBanner design={design} />
      )}

      {/* Tabs: Observation | Spec-Based | Calibration Set */}
      <Paper sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
        <Tabs
          value={activeTab}
          onChange={(_, v: number) => setActiveTab(v)}
          sx={{ borderBottom: "1px solid", borderColor: "divider", bgcolor: "action.hover" }}
        >
          <Tab
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                Observation-Based
                {status === "observation_ready" && (
                  <ChipStatus status="Ready" />
                )}
              </Box>
            }
            sx={{ fontSize: "0.8rem" }}
          />
          <Tab label="Spec-Based" sx={{ fontSize: "0.8rem" }} />
          <Tab
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                Calibration Set
                {status === "confirmed" && design && (
                  <CalibrationCoverageBadge scenarios={design.calibrationSet} />
                )}
              </Box>
            }
            sx={{ fontSize: "0.8rem" }}
          />
        </Tabs>

        <AuraTabPanel value={activeTab} index={0} sx={{ p: 3 }}>
          <ObservationTab projectId={projectId} design={design} status={status} />
        </AuraTabPanel>
        <AuraTabPanel value={activeTab} index={1} sx={{ p: 3 }}>
          <SpecTab projectId={projectId} status={status} />
        </AuraTabPanel>
        <AuraTabPanel value={activeTab} index={2} sx={{ p: 3 }}>
          <CalibrationSetTab design={design} status={status} />
        </AuraTabPanel>
      </Paper>
    </Box>
  );
}

// ── Design status chip ────────────────────────────────────────────────────────

function DesignStatusChip({ status }: { status: string }) {
  if (status === "confirmed") return <ChipStatus status="Passed" />;
  if (status === "observation_ready") return <ChipStatus status="Pending" />;
  return <ChipStatus status="Draft" />;
}

// ── Confirmed design banner ───────────────────────────────────────────────────

function ConfirmedDesignBanner({ design }: { design: ReturnType<typeof getEvalDesign> }) {
  if (!design) return null;
  const nm = design.calibrationSet.filter((s) => s.category === "nightmare").length;
  const re = design.calibrationSet.filter((s) => s.category === "reality").length;
  const dr = design.calibrationSet.filter((s) => s.category === "dream").length;
  const allThree = nm > 0 && re > 0 && dr > 0;

  return (
    <Paper
      sx={{
        mb: 2.5,
        border: "1px solid",
        borderColor: "success.dark",
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      {/* Banner header */}
      <Box sx={{ px: 2.5, py: 1.5, bgcolor: "rgba(var(--mui-palette-success-mainChannel) / 0.1)", display: "flex", alignItems: "center", gap: 1.5 }}>
        <ChipStatus status="Passed" />
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Scoring runs against these dimensions and calibration scenarios on every session.
          Nothing gates a deploy until you act on the verdict.
        </Typography>
      </Box>

      <Divider sx={{ borderColor: "success.dark" }} />

      {/* Dimensions table */}
      <Box sx={{ px: 2.5, pt: 2, pb: 1.5 }}>
        <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", mb: 1.5 }}>
          Scoring dimensions
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {design.confirmedDimensions.map((d) => (
            <Box
              key={d.name}
              sx={{
                display: "grid",
                gridTemplateColumns: "180px 80px 60px 1fr",
                gap: 2,
                alignItems: "center",
                py: 0.75,
                px: 1,
                borderRadius: 1,
                bgcolor: "action.hover",
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 700 }}>{d.name}</Typography>
              <ChipSubtle
                label={DIRECTIONALITY_LABEL[d.directionality]}
                sx={{ height: 18, fontSize: "0.6rem", fontWeight: 600 }}
              />
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="caption" sx={{ color: "text.disabled", display: "block", fontSize: "0.58rem" }}>pass if ≥</Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "success.main", lineHeight: 1 }}>{d.suggestedThreshold}</Typography>
              </Box>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>{d.rationale}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      <Divider sx={{ borderColor: "divider" }} />

      {/* Calibration summary */}
      <Box sx={{ px: 2.5, py: 1.5, display: "flex", alignItems: "center", gap: 3, flexWrap: "wrap" }}>
        <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Calibration set
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "error.main" }} />
            <Typography variant="caption" sx={{ fontWeight: 700 }}>{nm} nightmare{nm !== 1 ? "s" : ""}</Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "primary.main" }} />
            <Typography variant="caption" sx={{ fontWeight: 700 }}>{re} reality</Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "success.main" }} />
            <Typography variant="caption" sx={{ fontWeight: 700 }}>{dr} dream{dr !== 1 ? "s" : ""}</Typography>
          </Box>
        </Box>
        {!allThree && <ChipStatus status="Pending" />}
        {allThree && <ChipStatus status="Passed" />}
      </Box>
    </Paper>
  );
}

// ── Calibration coverage badge ────────────────────────────────────────────────

function CalibrationCoverageBadge({ scenarios }: { scenarios: CalibrationScenario[] }) {
  const hasNightmares = scenarios.some((s) => s.category === "nightmare");
  const hasReality = scenarios.some((s) => s.category === "reality");
  const hasDreams = scenarios.some((s) => s.category === "dream");
  const complete = hasNightmares && hasReality && hasDreams;
  return <ChipStatus status={complete ? "Passed" : "Pending"} />;
}

// ── Observation-Based tab ─────────────────────────────────────────────────────

function ObservationTab({
  design,
  status,
}: {
  projectId: string;
  design: ReturnType<typeof getEvalDesign>;
  status: string;
}) {
  const [confirmClicked, setConfirmClicked] = useState(false);

  if (status === "no_design") {
    return (
      <Box>
        <Alert severity="info" sx={{ mb: 2 }}>
          The observation-based path requires at least 10 shadow-mode sessions. This agent hasn't
          accumulated enough sessions yet. Run the agent in shadow mode and return here once it has.
        </Alert>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
          While waiting, you can use the{" "}
          <Typography component="span" variant="body2" sx={{ color: "primary.main", fontWeight: 600 }}>
            Spec-Based
          </Typography>{" "}
          tab to design evaluations from a description of what this agent is supposed to do.
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          The observation layer will watch for:
        </Typography>
        <Box component="ul" sx={{ mt: 1, pl: 2 }}>
          {[
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
          This design was confirmed via the observation-based path. Scoring is active against the
          dimensions and calibration set below. To add or adjust calibration scenarios, use the{" "}
          <strong>Calibration Set</strong> tab.
        </Alert>
        {dims.length > 0 && (
          <>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
              Active dimensions
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {dims.map((d) => (
                <SuggestedDimensionCard key={d.name} dim={d} confirmed />
              ))}
            </Box>
          </>
        )}
      </Box>
    );
  }

  // observation_ready — show the recommendation
  const rec = design?.measurementRecommendation;
  if (!rec) return null;

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          Measurement Recommendation
        </Typography>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          Based on {rec.shadowSessionCount} shadow-mode sessions · Generated {new Date(rec.generatedAt).toLocaleDateString()}
        </Typography>
      </Box>

      <Alert severity="warning" sx={{ mb: 2.5 }} icon={false}>
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.25 }}>
          Review before confirming
        </Typography>
        <Typography variant="body2">
          These suggestions are derived from observed behavior, not ground truth. Confirm or adjust
          each dimension and calibration scenario before scoring begins.
        </Typography>
      </Alert>

      {/* Suggested dimensions */}
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
        Suggested Dimensions
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mb: 3 }}>
        {rec.suggestedDimensions.map((dim) => (
          <SuggestedDimensionCard key={dim.name} dim={dim} />
        ))}
      </Box>

      {/* Seed calibration scenarios */}
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
        Seed Calibration Scenarios
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 1.5 }}>
        Surfaced from observed failure patterns in shadow-mode traffic. Review each — nightmare
        scenarios are sourced from real sessions where the agent struggled.
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mb: 3 }}>
        {rec.calibrationSeed.map((scenario) => (
          <ScenarioCard key={scenario.id} scenario={scenario} showCheckbox={false} />
        ))}
      </Box>

      {/* Confirm action */}
      {!confirmClicked ? (
        <Box sx={{ display: "flex", gap: 1.5, pt: 1 }}>
          <Button
            variant="contained"
            color="success"
            onClick={() => setConfirmClicked(true)}
          >
            Confirm this design
          </Button>
          <Button variant="outlined" color="inherit" sx={{ color: "text.secondary" }}>
            Adjust dimensions
          </Button>
        </Box>
      ) : (
        <Alert severity="success">
          Design confirmed. Scoring will begin against these dimensions and calibration scenarios on
          the next session. You can review and extend the calibration set in the Calibration Set tab.
        </Alert>
      )}
    </Box>
  );
}

// ── Spec-Based tab ────────────────────────────────────────────────────────────

const PLACEHOLDER_SPEC = `agent: CURA Diagnostic Agent
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

const PIPELINE_STAGES = [
  {
    label: "Systematization",
    desc: "Grounding spec concepts in edge cases and operational distinctions",
  },
  {
    label: "Taxonomization",
    desc: "Building permissible/impermissible behavior taxonomy",
  },
  {
    label: "Test-Set Generation",
    desc: "Stratifying test cases across task type, persona, environment, tool availability",
  },
  {
    label: "Scoring Setup",
    desc: "Deriving judge criteria and policy citations for trace-level scoring",
  },
];

function SpecTab({ status }: { projectId: string; status: string }) {
  const [specText, setSpecText] = useState(PLACEHOLDER_SPEC);
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
    if (!specText.trim() || selectedCategories.size === 0) return;
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
        Write what this agent is supposed to do — purpose, tools, success criteria, failure modes, and
        constraints. The spec is first-class input, not background context. AgentScore systematizes it
        into a permissible/impermissible behavior taxonomy, then generates stratified eval cases with
        judge criteria grounded in specific spec clauses.
      </Typography>

      {!generated ? (
        <>
          <Paper sx={{ p: 2, mb: 2.5, border: "1px solid", borderColor: "primary.dark", borderRadius: 1.5, bgcolor: "action.hover" }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
              Scope the evaluation
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 1.5 }}>
              Select the evaluation categories and risk areas most relevant to this agent. This
              constrains output to evals you can actually act on — not an exhaustive list.
            </Typography>

            <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", mb: 0.75 }}>
              Evaluation categories
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 2 }}>
              {SHOWCASE_CATEGORIES.map(({ key, desc }) => (
                <Chip
                  key={key}
                  label={key}
                  size="small"
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
                  key={r}
                  label={r}
                  size="small"
                  variant={selectedRisks.has(r) ? "filled" : "outlined"}
                  color={selectedRisks.has(r) ? "error" : "default"}
                  onClick={() => toggleRisk(r)}
                  sx={{ cursor: "pointer", fontWeight: selectedRisks.has(r) ? 700 : 400, fontSize: "0.72rem" }}
                />
              ))}
            </Box>
          </Paper>

          <TextField
            multiline
            minRows={14}
            maxRows={22}
            fullWidth
            variant="outlined"
            placeholder="Paste or write a structured agent spec…"
            value={specText}
            onChange={(e) => setSpecText(e.target.value)}
            sx={{ mb: 2, "& textarea": { fontFamily: "monospace", fontSize: "0.78rem", lineHeight: 1.6 } }}
          />

          {generating && (
            <Paper sx={{ p: 2, mb: 2, border: "1px solid", borderColor: "divider", borderRadius: 1.5 }}>
              <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", mb: 1.5 }}>
                Processing spec
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {PIPELINE_STAGES.map((stage, i) => {
                  const stageNum = i + 1;
                  const isActive = generatingStage === stageNum;
                  const isDone = generatingStage > stageNum;
                  return (
                    <Box key={stage.label} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          bgcolor: isDone
                            ? "success.main"
                            : isActive
                            ? "primary.main"
                            : "action.hover",
                          border: "1px solid",
                          borderColor: isDone
                            ? "success.main"
                            : isActive
                            ? "primary.main"
                            : "divider",
                        }}
                      >
                        {isDone ? (
                          <Typography sx={{ fontSize: "0.55rem", color: "white", fontWeight: 800 }}>✓</Typography>
                        ) : (
                          <Typography sx={{ fontSize: "0.55rem", color: isActive ? "white" : "text.disabled", fontWeight: 700 }}>
                            {stageNum}
                          </Typography>
                        )}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: isActive || isDone ? 700 : 400,
                            color: isDone ? "success.main" : isActive ? "text.primary" : "text.disabled",
                            display: "block",
                            lineHeight: 1.2,
                          }}
                        >
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
              <LinearProgress sx={{ mt: 1.5, borderRadius: 1 }} />
            </Paper>
          )}

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Button
              variant="contained"
              disabled={!specText.trim() || generating || selectedCategories.size === 0}
              onClick={handleGenerate}
            >
              Generate evaluation design
            </Button>
            {selectedCategories.size === 0 && (
              <Typography variant="caption" sx={{ color: "warning.main" }}>
                Select at least one category above.
              </Typography>
            )}
          </Box>
        </>
      ) : (
        <>
          {/* Behavior taxonomy — derived from spec */}
          <Paper sx={{ mb: 3, border: "1px solid", borderColor: "divider", borderRadius: 1.5, overflow: "hidden" }}>
            <Box sx={{ px: 2, py: 1.25, bgcolor: "action.hover", borderBottom: "1px solid", borderColor: "divider" }}>
              <Typography variant="caption" sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "text.disabled" }}>
                Behavior Taxonomy  ·  derived from spec
              </Typography>
            </Box>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
              <Box sx={{ p: 2, borderRight: "1px solid", borderColor: "divider" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 1 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "success.main", flexShrink: 0 }} />
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "success.main" }}>
                    Permissible  ({SPEC_TAXONOMY.permissible.length})
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
                    Impermissible  ({SPEC_TAXONOMY.impermissible.length})
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
                {questions.length} evaluation cases generated
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                High-risk cases are pre-selected. Each is grounded in a spec clause with judge criteria for trace-level scoring.
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {selectedCount} selected
              </Typography>
              <Button size="small" variant="text" onClick={() => setGenerated(false)} sx={{ color: "text.disabled" }}>
                Re-generate
              </Button>
            </Box>
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mb: 3 }}>
            {questions.map((q) => (
              <EvalQuestionCard
                key={q.id}
                question={q}
                onToggle={(id) =>
                  setQuestions((prev) =>
                    prev.map((qq) => (qq.id === id ? { ...qq, selected: !qq.selected } : qq))
                  )
                }
              />
            ))}
          </Box>

          {!confirmed ? (
            <Box sx={{ display: "flex", gap: 1.5, pt: 1 }}>
              <Button
                variant="contained"
                color="primary"
                disabled={selectedCount === 0}
                onClick={() => setConfirmed(true)}
              >
                Confirm {selectedCount} eval{selectedCount !== 1 ? "s" : ""} and seed calibration set
              </Button>
            </Box>
          ) : (
            <Alert severity="success">
              {selectedCount} eval{selectedCount !== 1 ? "s" : ""} confirmed. The calibration set has
              been seeded from the impermissible behavior cases — review and adjust it in the
              Calibration Set tab.
            </Alert>
          )}
        </>
      )}
    </Box>
  );
}

// ── Calibration Set tab ───────────────────────────────────────────────────────

function CalibrationSetTab({
  design,
  status,
}: {
  design: ReturnType<typeof getEvalDesign>;
  status: string;
}) {
  if (status === "no_design" || !design || design.calibrationSet.length === 0) {
    return (
      <Box>
        <Alert severity="info" sx={{ mb: 2.5 }}>
          No calibration set yet. Use the <strong>Observation-Based</strong> or{" "}
          <strong>Spec-Based</strong> tab to generate one.
        </Alert>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1.5 }}>
          {(["nightmare", "reality", "dream"] as const).map((cat) => {
            const cfg = CAT_CONFIG[cat];
            const purpose = {
              nightmare: "Adversarial inputs, edge conditions, failure modes. Sourced from real failure patterns in shadow-mode traffic.",
              reality: "Scenarios the agent should complete reliably. Establishes the performance baseline.",
              dream: "Stretch scenarios beyond current expectations. Detects improvement over time.",
            }[cat];
            return (
              <Paper key={cat} sx={{ p: 2, border: `1px solid ${cfg.border}`, bgcolor: cfg.bg, borderRadius: 1.5, opacity: 0.6 }}>
                <Tag label={cfg.label} sx={{ bgcolor: `${cfg.color}.main`, color: "white", fontWeight: 700, fontSize: "0.68rem", mb: 1, "& .MuiChip-label": { color: "white" } }} />
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
  const hasNightmares = nightmares.length > 0;

  return (
    <Box>
      {/* Category taxonomy explainer */}
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1.5, mb: 2.5 }}>
        {(["nightmare", "reality", "dream"] as const).map((cat) => {
          const count = design.calibrationSet.filter((s) => s.category === cat).length;
          const cfg = CAT_CONFIG[cat];
          const purpose = {
            nightmare: "Tests whether the agent fails gracefully. Sources adversarial inputs, edge cases, and failure modes — including scenarios the agent has already struggled with in production.",
            reality: "Establishes the performance baseline. Scenarios the agent should complete reliably. A PASS here is necessary but not sufficient for production readiness.",
            dream: "Detects capability improvement over time. Stretch scenarios beyond current expectations — prevents evaluation from only measuring regression.",
          }[cat];
          return (
            <Paper
              key={cat}
              sx={{
                p: 2,
                border: `1px solid ${cfg.border}`,
                bgcolor: cfg.bg,
                borderRadius: 1.5,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <Tag label={cfg.label} sx={{ bgcolor: `${cfg.color}.main`, color: "white", fontWeight: 700, fontSize: "0.68rem", "& .MuiChip-label": { color: "white" } }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: `${cfg.color}.main`, lineHeight: 1, ml: "auto" }}>
                  {count}
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: "text.secondary", lineHeight: 1.5 }}>
                {purpose}
              </Typography>
            </Paper>
          );
        })}
      </Box>

      {/* PASS-on-Reality-only warning */}
      {!hasNightmares && (
        <Alert severity="warning" sx={{ mb: 2.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.25 }}>
            No nightmare scenarios — this calibration set is incomplete
          </Typography>
          <Typography variant="body2">
            A PASS verdict on a Reality-only calibration set does not mean the agent is production-ready.
            It means it did what was expected in the cases that were tested. Add adversarial inputs, edge
            conditions, and failure modes before using this design to gate a deploy.
          </Typography>
        </Alert>
      )}

      {/* Category sections */}
      {nightmares.length > 0 && (
        <CalibrationSection title="Nightmares" category="nightmare" scenarios={nightmares} />
      )}
      {reality.length > 0 && (
        <CalibrationSection title="Reality" category="reality" scenarios={reality} />
      )}
      {dreams.length > 0 && (
        <CalibrationSection title="Dreams" category="dream" scenarios={dreams} />
      )}
    </Box>
  );
}

function CalibrationSection({
  title,
  category,
  scenarios,
}: {
  title: string;
  category: "nightmare" | "reality" | "dream";
  scenarios: CalibrationScenario[];
}) {
  const cfg = CAT_CONFIG[category];
  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
        <Tag
          label={title}
          sx={{ bgcolor: `${cfg.color}.main`, color: "white", fontWeight: 700, fontSize: "0.7rem", "& .MuiChip-label": { color: "white" } }}
        />
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          {cfg.desc}
        </Typography>
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        {scenarios.map((s) => (
          <ScenarioCard key={s.id} scenario={s} showCheckbox={false} />
        ))}
      </Box>
    </Box>
  );
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function SuggestedDimensionCard({ dim, confirmed = false }: { dim: SuggestedDimension; confirmed?: boolean }) {
  const sourceLabel: Record<string, string> = {
    observed_failure: "from observed failures",
    observed_behavior: "from observed behavior",
    spec_derived: "spec-derived",
  };

  return (
    <Paper
      sx={{
        p: 2,
        border: "1px solid",
        borderColor: confirmed ? "success.dark" : "divider",
        borderRadius: 1.5,
        bgcolor: confirmed ? "rgba(var(--mui-palette-success-mainChannel) / 0.1)" : "transparent",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.75, flexWrap: "wrap" }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {dim.name}
            </Typography>
            <ChipSubtle
              label={DIRECTIONALITY_LABEL[dim.directionality]}
              sx={{ height: 18, fontSize: "0.6rem", fontWeight: 600 }}
            />
            <ChipSubtle
              label={sourceLabel[dim.source]}
              sx={{ height: 18, fontSize: "0.6rem", color: "text.disabled" }}
            />
          </Box>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {dim.rationale}
          </Typography>
        </Box>
        <Box sx={{ textAlign: "right", flexShrink: 0, minWidth: 72 }}>
          <Typography variant="caption" sx={{ color: "text.disabled", display: "block" }}>
            {confirmed ? "Pass threshold" : "Suggested threshold"}
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "success.main", lineHeight: 1.2 }}>
            {dim.suggestedThreshold}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.disabled", fontSize: "0.6rem" }}>out of 100</Typography>
        </Box>
      </Box>
    </Paper>
  );
}

function ScenarioCard({
  scenario,
  showCheckbox,
}: {
  scenario: CalibrationScenario;
  showCheckbox: boolean;
}) {
  const cfg = CAT_CONFIG[scenario.category];

  return (
    <Paper
      sx={{
        p: 2,
        border: "1px solid",
        borderColor: cfg.border,
        bgcolor: cfg.bg,
        borderRadius: 1.5,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
        {showCheckbox && (
          <Checkbox size="small" checked={scenario.confirmed} sx={{ mt: -0.5, p: 0.5 }} />
        )}
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
            <Tag
              label={cfg.label}
              sx={{ bgcolor: `${cfg.color}.main`, height: 18, fontSize: "0.6rem", fontWeight: 700, "& .MuiChip-label": { color: "white", px: 0.75 } }}
            />
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {scenario.title}
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 1.5 }}>
            {scenario.description}
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 1.5,
              borderTop: "1px solid",
              borderColor: cfg.border,
              pt: 1.5,
            }}
          >
            <Box>
              <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", mb: 0.5 }}>
                Input data
              </Typography>
              <Typography variant="caption" sx={{ fontFamily: "monospace", color: "text.secondary" }}>
                {scenario.inputData}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", mb: 0.5 }}>
                Expected behavior
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {scenario.expectedBehavior}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}

function EvalQuestionCard({
  question,
  onToggle,
}: {
  question: EvalQuestion;
  onToggle: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isImpermissible = question.behaviorClass === "impermissible";

  return (
    <Paper
      sx={{
        border: "1px solid",
        borderColor: question.selected ? "primary.main" : "divider",
        borderRadius: 1.5,
        overflow: "hidden",
        transition: "border-color 0.15s",
      }}
    >
      <ButtonBase
        onClick={() => setExpanded((v) => !v)}
        sx={{ width: "100%", textAlign: "left", p: 2, display: "block" }}
      >
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={question.selected}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle(question.id);
                }}
                sx={{ p: 0.25 }}
              />
            }
            label=""
            sx={{ m: 0, flexShrink: 0, alignSelf: "flex-start", mt: 0.25 }}
          />
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5, flexWrap: "wrap" }}>
              <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 700 }}>
                #{question.rank}
              </Typography>
              <Tag
                label={question.showcaseCategory}
                sx={{ height: 18, fontSize: "0.6rem", fontWeight: 600 }}
              />
              <ChipSubtle
                label={isImpermissible ? "impermissible" : "permissible"}
                color={isImpermissible ? "error" : "success"}
                sx={{ height: 18, fontSize: "0.6rem", fontWeight: 600 }}
              />
              <ChipSubtle
                label={`${question.riskLevel} risk`}
                color={RISK_COLOR[question.riskLevel]}
                sx={{ height: 18, fontSize: "0.6rem", fontWeight: 600 }}
              />
              <ChipSubtle
                label={DIRECTIONALITY_LABEL[question.directionality]}
                sx={{ height: 18, fontSize: "0.6rem", color: "text.disabled" }}
              />
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
        <Box
          sx={{
            px: 2,
            pb: 2,
            borderTop: "1px solid",
            borderColor: "divider",
          }}
        >
          {/* Row 1: Task definition + Test dimensions */}
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, pt: 2, mb: 2 }}>
            <Box>
              <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", mb: 0.5 }}>
                Task definition
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {question.taskDefinition}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", mb: 0.5 }}>
                Test dimensions
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.4 }}>
                {question.testDimensions.map((dim) => (
                  <Typography key={dim} variant="caption" sx={{ fontFamily: "monospace", color: "text.secondary", fontSize: "0.72rem" }}>
                    {dim}
                  </Typography>
                ))}
              </Box>
            </Box>
          </Box>

          {/* Row 2: Required data + Judge criteria */}
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 2 }}>
            <Box>
              <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", mb: 0.5 }}>
                Required data
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {question.requiredData}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", mb: 0.5 }}>
                Judge criteria
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {question.judgeCriteria}
              </Typography>
            </Box>
          </Box>

          {/* Row 3: Candidate measure */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", mb: 0.5 }}>
              Candidate measure
            </Typography>
            <Typography variant="caption" sx={{ fontFamily: "monospace", color: "primary.light" }}>
              {question.candidateMeasure}
            </Typography>
          </Box>

          {/* Row 4: Spec citation */}
          <Box
            sx={{
              pt: 1.5,
              borderTop: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", mb: 0.4 }}>
              Spec citation
            </Typography>
            <Typography variant="caption" sx={{ color: "text.disabled", fontStyle: "italic" }}>
              {question.specCitation}
            </Typography>
          </Box>
        </Box>
      )}
    </Paper>
  );
}

