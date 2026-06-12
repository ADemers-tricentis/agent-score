import { useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
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
    bg: "#2e0a0a",
    border: "#5c1a1a",
    desc: "Adversarial inputs, edge conditions, failure modes",
  },
  reality: {
    label: "Reality",
    color: "primary" as const,
    bg: "#0d1a2e",
    border: "#1a3a5c",
    desc: "Scenarios where the agent is expected to succeed reliably",
  },
  dream: {
    label: "Dream",
    color: "success" as const,
    bg: "#0a1f0a",
    border: "#1a3d1a",
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
        <Typography variant="body2" sx={{ color: "text.secondary", maxWidth: 620 }}>
          Define what to measure before you score. A benchmark that only tests what you expect to pass
          will produce a PASS verdict on an agent that isn't ready.
        </Typography>
      </Box>

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
                  <Chip label="Ready" color="warning" size="small" sx={{ height: 18, fontSize: "0.6rem", fontWeight: 700 }} />
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

        <Box sx={{ p: 3 }}>
          {activeTab === 0 && (
            <ObservationTab
              projectId={projectId}
              design={design}
              status={status}
            />
          )}
          {activeTab === 1 && (
            <SpecTab projectId={projectId} status={status} />
          )}
          {activeTab === 2 && (
            <CalibrationSetTab design={design} status={status} />
          )}
        </Box>
      </Paper>
    </Box>
  );
}

// ── Design status chip ────────────────────────────────────────────────────────

function DesignStatusChip({ status }: { status: string }) {
  if (status === "confirmed") return <Chip label="Confirmed" color="success" size="small" sx={{ fontWeight: 700 }} />;
  if (status === "observation_ready") return <Chip label="Recommendation Ready" color="warning" size="small" sx={{ fontWeight: 700 }} />;
  return <Chip label="No Design" size="small" sx={{ fontWeight: 600, color: "text.disabled" }} />;
}

// ── Confirmed design banner ───────────────────────────────────────────────────

function ConfirmedDesignBanner({ design }: { design: ReturnType<typeof getEvalDesign> }) {
  if (!design) return null;
  const nm = design.calibrationSet.filter((s) => s.category === "nightmare").length;
  const re = design.calibrationSet.filter((s) => s.category === "reality").length;
  const dr = design.calibrationSet.filter((s) => s.category === "dream").length;

  return (
    <Paper
      sx={{
        p: 2,
        mb: 2.5,
        border: "1px solid",
        borderColor: "success.dark",
        borderRadius: 2,
        bgcolor: "#0a1f0a",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 3, flexWrap: "wrap" }}>
        <Box>
          <Typography variant="caption" sx={{ color: "text.disabled", display: "block", mb: 0.5 }}>
            Scoring dimensions
          </Typography>
          <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
            {design.confirmedDimensions.map((d) => (
              <Chip
                key={d.name}
                label={`${d.name} (≥${d.suggestedThreshold})`}
                size="small"
                color="success"
                variant="outlined"
                sx={{ fontSize: "0.68rem", fontWeight: 600 }}
              />
            ))}
          </Box>
        </Box>
        <Box>
          <Typography variant="caption" sx={{ color: "text.disabled", display: "block", mb: 0.5 }}>
            Calibration set
          </Typography>
          <Box sx={{ display: "flex", gap: 1.5 }}>
            <Typography variant="caption" sx={{ color: "error.light", fontWeight: 700 }}>
              {nm} nightmares
            </Typography>
            <Typography variant="caption" sx={{ color: "primary.light", fontWeight: 700 }}>
              {re} reality
            </Typography>
            <Typography variant="caption" sx={{ color: "success.light", fontWeight: 700 }}>
              {dr} dreams
            </Typography>
          </Box>
        </Box>
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
  return (
    <Chip
      label={complete ? "Complete" : "Incomplete"}
      color={complete ? "success" : "warning"}
      size="small"
      sx={{ height: 18, fontSize: "0.6rem", fontWeight: 700 }}
    />
  );
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
    return (
      <Box>
        <Alert severity="success">
          This design is confirmed. Dimensions and calibration set are active. You can update the
          calibration set in the Calibration Set tab.
        </Alert>
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

const PLACEHOLDER_SPEC = `The CURA Diagnostic Agent helps QA engineers identify root causes of failing or flaky tests in CI pipelines.

It receives test execution logs, environment metadata, and a dependency graph. It should:
- Distinguish between flaky tests (intermittent failures) and genuinely broken tests (consistent failures)
- Identify whether the failure is in the test itself, the system under test, or the environment
- Pinpoint the specific component, service, or configuration change responsible
- Produce a structured diagnosis report with confidence level and recommended fix

Primary concerns: accuracy on ambiguous cases, avoiding false positives that blame healthy components, and staying within latency budget for CI-blocking use.`;

function SpecTab({ status }: { projectId: string; status: string }) {
  const [specText, setSpecText] = useState(status === "no_design" ? PLACEHOLDER_SPEC : "");
  const [generated, setGenerated] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [questions, setQuestions] = useState<EvalQuestion[]>([]);
  const [confirmed, setConfirmed] = useState(false);

  function handleGenerate() {
    if (!specText.trim()) return;
    setGenerating(true);
    // Simulate a brief generation delay
    setTimeout(() => {
      setQuestions(SPEC_GENERATED_QUESTIONS.map((q) => ({ ...q, selected: q.riskLevel === "high" })));
      setGenerating(false);
      setGenerated(true);
    }, 1400);
  }

  const selectedCount = questions.filter((q) => q.selected).length;

  return (
    <Box>
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
        Paste a description of what this agent is supposed to do — its purpose, use cases, and your
        primary concerns. A formal spec is not required. AgentScore will return a prioritized list of
        evaluation questions, each with a task definition, required data, candidate measure, and
        directionality.
      </Typography>

      {!generated ? (
        <>
          <TextField
            multiline
            minRows={8}
            maxRows={14}
            fullWidth
            variant="outlined"
            placeholder="Describe what the agent does, what good output looks like, and what you're most worried about…"
            value={specText}
            onChange={(e) => setSpecText(e.target.value)}
            sx={{ mb: 2, fontFamily: "inherit" }}
          />
          {generating && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 0.75 }}>
                Generating evaluation questions…
              </Typography>
              <LinearProgress />
            </Box>
          )}
          <Button
            variant="contained"
            disabled={!specText.trim() || generating}
            onClick={handleGenerate}
          >
            Generate evaluation questions
          </Button>
        </>
      ) : (
        <>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {questions.length} evaluation questions generated
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                High-risk questions are pre-selected. Choose which to pursue.
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
                Generate evaluation designs for {selectedCount} question{selectedCount !== 1 ? "s" : ""}
              </Button>
            </Box>
          ) : (
            <Alert severity="success">
              Evaluation designs generated for {selectedCount} question{selectedCount !== 1 ? "s" : ""}.
              The calibration set has been seeded — review and confirm it in the Calibration Set tab.
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
        <Alert severity="info" sx={{ mb: 2 }}>
          No calibration set yet. Use the Observation-Based or Spec-Based tab to generate one.
        </Alert>
        <NightmareWarning hasNightmares={false} />
      </Box>
    );
  }

  const nightmares = design.calibrationSet.filter((s) => s.category === "nightmare");
  const reality = design.calibrationSet.filter((s) => s.category === "reality");
  const dreams = design.calibrationSet.filter((s) => s.category === "dream");
  const hasNightmares = nightmares.length > 0;

  return (
    <Box>
      {!hasNightmares && <NightmareWarning hasNightmares={false} />}

      {/* Coverage summary */}
      <Box sx={{ display: "flex", gap: 1.5, mb: 3, flexWrap: "wrap" }}>
        {(["nightmare", "reality", "dream"] as const).map((cat) => {
          const count = design.calibrationSet.filter((s) => s.category === cat).length;
          const cfg = CAT_CONFIG[cat];
          return (
            <Paper
              key={cat}
              sx={{
                px: 2,
                py: 1,
                border: `1px solid ${cfg.border}`,
                bgcolor: cfg.bg,
                borderRadius: 1.5,
                minWidth: 110,
              }}
            >
              <Typography variant="caption" sx={{ color: "text.disabled", display: "block" }}>
                {cfg.label}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2, color: `${cfg.color}.main` }}>
                {count}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.disabled", fontSize: "0.6rem" }}>
                {cfg.desc}
              </Typography>
            </Paper>
          );
        })}
      </Box>

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
        <Chip
          label={title}
          color={cfg.color}
          size="small"
          sx={{ fontWeight: 700, fontSize: "0.7rem" }}
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

function SuggestedDimensionCard({ dim }: { dim: SuggestedDimension }) {
  const sourceLabel: Record<string, string> = {
    observed_failure: "sourced from failures",
    observed_behavior: "sourced from behavior",
    spec_derived: "spec-derived",
  };

  return (
    <Paper
      sx={{
        p: 2,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1.5,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.75 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {dim.name}
            </Typography>
            <Chip
              label={DIRECTIONALITY_LABEL[dim.directionality]}
              size="small"
              sx={{
                height: 18,
                fontSize: "0.6rem",
                fontWeight: 600,
                bgcolor: "action.selected",
                color: "text.secondary",
              }}
            />
            <Chip
              label={sourceLabel[dim.source]}
              size="small"
              variant="outlined"
              sx={{ height: 18, fontSize: "0.6rem", fontWeight: 600, color: "text.disabled" }}
            />
          </Box>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {dim.rationale}
          </Typography>
        </Box>
        <Box sx={{ textAlign: "right", flexShrink: 0 }}>
          <Typography variant="caption" sx={{ color: "text.disabled", display: "block" }}>
            Suggested threshold
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "success.main", lineHeight: 1.2 }}>
            {dim.suggestedThreshold}
          </Typography>
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
            <Chip
              label={cfg.label}
              color={cfg.color}
              size="small"
              sx={{ height: 18, fontSize: "0.6rem", fontWeight: 700 }}
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
              <Chip
                label={question.showcaseCategory}
                size="small"
                sx={{ height: 18, fontSize: "0.6rem", fontWeight: 600, bgcolor: "action.selected" }}
              />
              <Chip
                label={`${question.riskLevel} risk`}
                color={RISK_COLOR[question.riskLevel]}
                size="small"
                sx={{ height: 18, fontSize: "0.6rem", fontWeight: 600 }}
              />
              <Chip
                label={DIRECTIONALITY_LABEL[question.directionality]}
                size="small"
                variant="outlined"
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
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 2,
          }}
        >
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
              Required data
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {question.requiredData}
            </Typography>
          </Box>
          <Box sx={{ gridColumn: "1 / -1" }}>
            <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", mb: 0.5 }}>
              Candidate measure
            </Typography>
            <Typography variant="caption" sx={{ fontFamily: "monospace", color: "primary.light" }}>
              {question.candidateMeasure}
            </Typography>
          </Box>
        </Box>
      )}
    </Paper>
  );
}

function NightmareWarning({ hasNightmares }: { hasNightmares: boolean }) {
  if (hasNightmares) return null;
  return (
    <Alert severity="warning" sx={{ mb: 2 }}>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        No nightmare scenarios in this calibration set
      </Typography>
      <Typography variant="body2">
        A PASS verdict on a Reality-only calibration set does not mean the agent is production-ready — it
        means it did what was expected in the cases that were tested. Add adversarial inputs, edge
        conditions, and failure modes before using this design to gate a deploy.
      </Typography>
    </Alert>
  );
}
