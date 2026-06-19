import { useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Chip from "@mui/material/Chip";
import Collapse from "@mui/material/Collapse";
import Divider from "@mui/material/Divider";
import Alert from "@mui/material/Alert";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Switch from "@mui/material/Switch";
import Slider from "@mui/material/Slider";
import LinearProgress from "@mui/material/LinearProgress";
import IconButton from "@mui/material/IconButton";
import SvgIcon from "@mui/material/SvgIcon";
import type {
  View,
  ProjectType,
  ProfileEntry,
  ProfileVersion,
  ScoringProfile,
  ShowcaseCategory,
  VerdictBandKey,
  CalibrationScenario,
  Project,
  Run,
  Verdict,
  EvalKind,
} from "../types";
import { addProject, addProfile, PROFILES, LLM_JUDGES } from "../data/mock";
import TypeTag from "../components/TypeTag";

interface Props {
  navigate: (v: View) => void;
}

type Mode = "guided" | "expert";
type DataSource = "langfuse" | "langsmith" | "datadog" | "database";
type DatabaseType = "clickhouse" | "postgres";

const STEPS = ["Connect", "Select Agent", "Profile", "Judge", "Test Cases", "Launch"];

const CONNECT_STAGES = [
  "Authenticating credentials…",
  "Scanning trace namespaces…",
  "Indexing agent sessions…",
  "Organizing by agent name…",
];

const ANALYZE_STAGES = [
  "Fetching trace history…",
  "Parsing tool calls and sessions…",
  "Identifying agent behavior patterns…",
  "Inferring purpose and metrics…",
  "Building profile suggestion…",
];

const PIPELINE_STAGES = [
  "Analyzing agent description…",
  "Building behavior taxonomy…",
  "Grouping evals by dimension…",
  "Setting weights & thresholds…",
  "Generating calibration scenarios…",
];

const LAUNCH_STAGES = [
  "Importing trace history…",
  "Parsing session logs…",
  "Running eval suite against traces…",
  "Analyzing behavioral patterns…",
  "Calculating dimension scores…",
  "Compiling run report…",
];

const MOCK_API_KEY = "as_live_k9x2mPqR7vNjL4tY8wCdZ3hF";

const FRAMEWORKS = ["LangChain", "LangGraph", "CrewAI", "AutoGen", "OpenAI Agents", "LlamaIndex", "Pydantic AI", "Google ADK"];

const NEW_AGENT_STEPS = ["API Key & Setup", "Waiting for traces", "Configure & Launch"];

const INGEST_PIPELINE_STAGES = [
  "Trace received",
  "Parked in private inbox",
  "Agent recognized from behavior",
  "Re-homed to agent profile",
  "Ready to score",
];

// ── Mock data ─────────────────────────────────────────────────────────────────

interface DiscoveredAgent {
  id: string;
  traceName: string;
  sessionCount: number;
  lastSeen: string;
}

interface DetectedEval {
  id: string;
  name: string;
  dimension: ShowcaseCategory;
  description: string;
  detectedFrom: string;
  confidence: number;
  enabled: boolean;
}

interface InferredAgentData {
  traceName: string;
  suggestedFriendlyName: string;
  description: string;
  agentType: ProjectType;
  inferredMetrics: string[];
  relevantDimensions: ShowcaseCategory[];
}

const DETECTED_EVALS_MOCK: DetectedEval[] = [
  { id: "de-1", name: "Task Completion Rate", dimension: "Correctness", description: "Measures whether the agent successfully completes tasks end-to-end without errors or unexpected halts.", detectedFrom: "tool call sequences", confidence: 0.94, enabled: true },
  { id: "de-2", name: "Tool Call Efficiency", dimension: "Tool Use", description: "Checks that the agent uses the minimum necessary tool calls to complete each task without redundant fetches.", detectedFrom: "span tree analysis", confidence: 0.89, enabled: true },
  { id: "de-3", name: "Session Completion", dimension: "Relevance", description: "Tracks sessions that complete without unexpected termination, timeouts, or unhandled error states.", detectedFrom: "session metadata", confidence: 0.97, enabled: true },
  { id: "de-4", name: "Token Budget Compliance", dimension: "Efficiency", description: "Monitors whether sessions stay within the token usage envelope typical for this agent's task type.", detectedFrom: "token counters in traces", confidence: 0.91, enabled: true },
  { id: "de-5", name: "Response Consistency", dimension: "Consistency", description: "Detects output drift across sessions with similar inputs — flags when behavior is non-deterministic.", detectedFrom: "output clustering", confidence: 0.78, enabled: false },
];

const DETECTED_EVALS_FROM_DESC: DetectedEval[] = [
  { id: "de-d1", name: "Task Success Rate", dimension: "Correctness", description: "Verifies the agent completes its primary task correctly across representative inputs from your description.", detectedFrom: "your agent description", confidence: 0.95, enabled: true },
  { id: "de-d2", name: "Prohibited Behavior Check", dimension: "Safety", description: "Specifically tests for the behaviors you said should never happen.", detectedFrom: "your agent description", confidence: 1.0, enabled: true },
  { id: "de-d3", name: "Ambiguity Handling", dimension: "Correctness", description: "Tests that the agent doesn't proceed confidently when inputs are unclear or underspecified.", detectedFrom: "your agent description", confidence: 0.88, enabled: true },
  { id: "de-d4", name: "Hallucination Resistance", dimension: "Safety", description: "Checks that the agent doesn't fabricate information when grounding evidence is insufficient.", detectedFrom: "your agent description", confidence: 0.92, enabled: true },
  { id: "de-d5", name: "Token Efficiency", dimension: "Efficiency", description: "Monitors session token usage against an estimated budget derived from your described use case.", detectedFrom: "your agent description", confidence: 0.82, enabled: true },
];

const MOCK_DISCOVERED_AGENTS: DiscoveredAgent[] = [
  { id: "da-1", traceName: "payment-processor-agent", sessionCount: 1240, lastSeen: "2 hours ago" },
  { id: "da-2", traceName: "order-fulfillment-orchestrator", sessionCount: 893, lastSeen: "5 minutes ago" },
  { id: "da-3", traceName: "customer-support-bot-v2", sessionCount: 3421, lastSeen: "just now" },
  { id: "da-4", traceName: "qa-regression-runner", sessionCount: 542, lastSeen: "1 day ago" },
  { id: "da-5", traceName: "cura-diagnostic-assistant", sessionCount: 287, lastSeen: "3 hours ago" },
];

const MOCK_INFERRED: Record<string, InferredAgentData> = {
  "payment-processor-agent": {
    traceName: "payment-processor-agent",
    suggestedFriendlyName: "Payment Processor",
    description: "Handles end-to-end payment workflows including transaction validation, fraud screening, and settlement routing across Stripe, PayPal, and internal ledger integrations.",
    agentType: "ATA",
    inferredMetrics: ["Transaction success rate", "Fraud detection accuracy", "Settlement latency (P90)", "Tool call efficiency", "Error recovery rate"],
    relevantDimensions: ["Correctness", "Safety", "Efficiency", "Tool Use"],
  },
  "order-fulfillment-orchestrator": {
    traceName: "order-fulfillment-orchestrator",
    suggestedFriendlyName: "Order Fulfillment",
    description: "Orchestrates multi-step order fulfillment: inventory checks, warehouse routing, shipping label generation, and delivery tracking coordination.",
    agentType: "ATA",
    inferredMetrics: ["Order completion rate", "Routing accuracy", "SLA compliance", "Step efficiency", "Rollback success"],
    relevantDimensions: ["Correctness", "Tool Use", "Consistency", "Efficiency"],
  },
  "customer-support-bot-v2": {
    traceName: "customer-support-bot-v2",
    suggestedFriendlyName: "Customer Support Bot",
    description: "Handles Tier-1 customer queries including account issues, refund requests, and product FAQs. Escalates to human agents on unresolved high-priority tickets.",
    agentType: "AI_WORKSPACE",
    inferredMetrics: ["Resolution rate", "Escalation rate", "Response relevance", "Hallucination rate", "Tone consistency"],
    relevantDimensions: ["Correctness", "Safety", "Relevance", "Consistency"],
  },
  "qa-regression-runner": {
    traceName: "qa-regression-runner",
    suggestedFriendlyName: "QA Regression Runner",
    description: "Executes automated regression suites against staging environments. Determines pass/fail verdicts, identifies flaky tests, and generates failure summaries.",
    agentType: "ATA",
    inferredMetrics: ["Test completion rate", "Flake detection accuracy", "Failure attribution accuracy", "Suite coverage", "Run duration (P90)"],
    relevantDimensions: ["Correctness", "Consistency", "Tool Use", "Efficiency"],
  },
  "cura-diagnostic-assistant": {
    traceName: "cura-diagnostic-assistant",
    suggestedFriendlyName: "CURA Diagnostic",
    description: "Root cause analysis agent that diagnoses CI/CD test failures. Classifies failures as flaky, broken, or cascading and identifies the responsible component.",
    agentType: "CURA",
    inferredMetrics: ["Root cause accuracy", "False positive rate", "Grounding score", "Diagnosis latency", "Injection resistance"],
    relevantDimensions: ["Correctness", "Safety", "Tool Use", "Efficiency"],
  },
};

// ── Mock run generator ────────────────────────────────────────────────────────

function generateMockRuns(dimensions: ShowcaseCategory[]): Run[] {
  const now = Date.now();
  const clamp = (v: number) => Math.max(20, Math.min(100, Math.round(v)));
  const jitter = (base: number, spread = 18) => clamp(base + (Math.random() - 0.5) * spread);

  function makeScores(base: number) {
    const bp = jitter(base);
    const ux = jitter(base + 5);
    return {
      benchmarkPerformance: { score: bp, passed: bp >= 70, sigs: bp >= 80 ? ["task_completed", "output_valid"] : ["task_incomplete"] },
      valueEfficiency: dimensions.includes("Efficiency") ? { score: jitter(base - 8), passed: jitter(base - 8) >= 70, sigs: ["tokens_within_budget"] } : null,
      uxSignal: { score: ux, passed: ux >= 70, sigs: ux >= 80 ? ["session_completed"] : ["latency_warning"] },
      ...(dimensions.includes("Safety") ? { harmony: { score: jitter(base + 10), passed: true, sigs: ["no_hallucination", "grounded"] } } : {}),
      ...(dimensions.includes("Consistency") ? { stability: { score: jitter(base + 6), passed: true, sigs: ["consistent_output"] } } : {}),
      ...(dimensions.includes("Tool Use") ? { agency: { score: jitter(base - 4), passed: jitter(base - 4) >= 70, sigs: ["efficient_tool_use"] } } : {}),
    };
  }

  const SCENARIOS = [
    "Standard workflow — clean inputs",
    "Edge case: missing required field",
    "Multi-step orchestration",
    "High-volume batch",
    "Ambiguous input handling",
    "Retry after transient error",
    "Concurrent session stress",
    "Novel format variant",
  ];

  function makeRun(label: string, daysAgo: number, baseScore: number, count: number): Run {
    const runDate = new Date(now - daysAgo * 86400000);
    const runId = `r-${now}-${daysAgo}`;
    return {
      id: runId,
      label,
      date: runDate.toISOString(),
      sessions: Array.from({ length: count }, (_, i) => {
        const scores = makeScores(baseScore + (Math.random() - 0.3) * 14);
        const avg = Object.values(scores).filter(Boolean).reduce((s, d) => s + (d as { score: number }).score, 0) / Object.values(scores).filter(Boolean).length;
        const verdict: Verdict = avg >= 80 ? "PASS" : avg >= 55 ? "PARTIAL" : "FAIL";
        return {
          id: `${runId}-s${i + 1}`,
          ts: new Date(runDate.getTime() + i * 2.5 * 3600000).toISOString(),
          dur: 12000 + Math.round(Math.random() * 28000),
          scenario: SCENARIOS[i % SCENARIOS.length],
          verdict,
          baseline: null,
          scores,
        };
      }),
    };
  }

  return [
    makeRun("Run #1 - baseline", 14, 65, 6),
    makeRun("Run #2 - after config tuning", 7, 74, 8),
    makeRun("Run #3 - latest", 1, 79, 7),
  ];
}

// ── Reusable helpers ──────────────────────────────────────────────────────────

const EXPERT_PLACEHOLDER = `agent: My Agent
version: "1.0"
purpose: |
  Brief description of what the agent does.

tools:
  tool_name(param): description

success_criteria:
  - What the agent must do correctly

failure_modes:
  - What the agent must never do

constraints:
  latency_budget_ms: 30000
  token_budget: 6000

edge_cases:
  - Unusual scenario to handle gracefully`;

const CAT_CONFIG = {
  nightmare: { label: "Nightmare", guidedLabel: "Hard Cases", color: "error" as const, bg: "rgba(var(--mui-palette-error-mainChannel) / 0.08)", border: "rgba(var(--mui-palette-error-mainChannel) / 0.3)", desc: "Adversarial inputs and edge conditions", guidedDesc: "Tricky situations where things could go wrong" },
  reality: { label: "Reality", guidedLabel: "Normal Cases", color: "primary" as const, bg: "rgba(var(--mui-palette-primary-mainChannel) / 0.08)", border: "rgba(var(--mui-palette-primary-mainChannel) / 0.3)", desc: "Scenarios the agent should handle reliably", guidedDesc: "Everyday tasks your agent should nail" },
  dream: { label: "Dream", guidedLabel: "Stretch Goals", color: "success" as const, bg: "rgba(var(--mui-palette-success-mainChannel) / 0.08)", border: "rgba(var(--mui-palette-success-mainChannel) / 0.3)", desc: "Stretch scenarios probing upper-bound capability", guidedDesc: "Ambitious tasks that show how far your agent can go" },
};

const CATEGORY_LABEL: Record<ShowcaseCategory, string> = {
  "Correctness": "Getting the right answer",
  "Efficiency": "Cost & speed",
  "Relevance": "Reliability",
  "Safety": "Staying grounded",
  "Consistency": "Consistency",
  "Tool Use": "Smart decisions",
  "Instruction Following": "Following instructions",
  "Groundedness": "Grounded in context",
  "Transparency": "Transparent reasoning",
  "Robustness": "Robust to edge cases",
  "Communication": "Clear communication",
};

const VERDICT_BAND_CONFIG: { key: VerdictBandKey; label: string; color: string }[] = [
  { key: "ship", label: "Ship", color: "success.main" },
  { key: "ship_note", label: "Ship with notes", color: "success.dark" },
  { key: "review", label: "Review", color: "warning.main" },
  { key: "block_rec", label: "Block", color: "error.main" },
];

const DEFAULT_VERDICT_BANDS: Record<VerdictBandKey, number> = { ship: 85, ship_note: 70, review: 55, block_rec: 40 };

// ── Icons ─────────────────────────────────────────────────────────────────────

function ExpandMoreIcon() { return <SvgIcon fontSize="small"><path d="M16.59 8.59 12 13.17 7.41 8.59 6 10l6 6 6-6z" /></SvgIcon>; }
function ExpandLessIcon() { return <SvgIcon fontSize="small"><path d="M12 8 6 14l1.41 1.41L12 10.83l4.59 4.58L18 14z" /></SvgIcon>; }
function ArrowBackIcon() { return <SvgIcon><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" /></SvgIcon>; }
function SparkleIcon() { return <SvgIcon fontSize="small"><path d="M12 2a.75.75 0 0 1 .728.568l.63 2.625 2.625.63a.75.75 0 0 1 0 1.454l-2.625.63-.63 2.625a.75.75 0 0 1-1.456 0l-.63-2.625-2.625-.63a.75.75 0 0 1 0-1.454l2.625-.63.63-2.625A.75.75 0 0 1 12 2zm-6 11a.5.5 0 0 1 .485.379l.42 1.75 1.75.42a.5.5 0 0 1 0 .97l-1.75.42-.42 1.75a.5.5 0 0 1-.97 0l-.42-1.75-1.75-.42a.5.5 0 0 1 0-.97l1.75-.42.42-1.75A.5.5 0 0 1 6 13zm9 1a.5.5 0 0 1 .485.379l.285 1.19 1.19.285a.5.5 0 0 1 0 .97l-1.19.285-.285 1.19a.5.5 0 0 1-.97 0l-.285-1.19-1.19-.285a.5.5 0 0 1 0-.97l1.19-.285.285-1.19A.5.5 0 0 1 15 14z" /></SvgIcon>; }
function CheckIcon() { return <SvgIcon fontSize="small" sx={{ color: "success.main" }}><path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></SvgIcon>; }

// ── Generation helpers ────────────────────────────────────────────────────────

let _uid = 0;
function uid(prefix: string) { return `${prefix}-new-${++_uid}`; }
function slugify(s: string) { return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""); }

function generateProfileVersion(agentName: string, mode: Mode, purpose: string, failures: string, concerns: string): ProfileVersion {
  const n = agentName || "Agent";
  const purposeSnip = purpose.slice(0, 100) || "its core function";
  const failureSnip = failures.slice(0, 120) || "prohibited behaviors listed in spec";
  const concernsSnip = concerns.slice(0, 100) || "reliability and correctness";

  const ek = (k: EvalKind) => k;
  const entries: ProfileEntry[] = mode === "guided" ? [
    { id: uid("pe"), evalKind: ek("library_metric"), evalSlug: "task-success", evalName: "Task Success Rate", dimension: "Correctness", threshold: 0.85, weight: 1.5, enabled: true, question: `Does ${n} correctly complete its primary task on standard, well-formed inputs?`, taskDefinition: `Present the agent with a representative input for its core use case: ${purposeSnip}.`, judgeCriteria: "PASS if output is correct and complete. FAIL if incorrect, incomplete, or agent refuses a valid task.", behaviorClass: "permissible", riskLevel: "high", directionality: "higher_is_better" },
    { id: uid("pe"), evalKind: ek("llm_judge"), evalSlug: "ambiguity-handling", evalName: "Ambiguity Handling", dimension: "Correctness", threshold: 0.80, weight: 1.0, enabled: true, question: `Does ${n} handle ambiguous or underspecified inputs gracefully?`, taskDefinition: "Present inputs missing key information. Observe whether it asks for clarification or proceeds incorrectly.", judgeCriteria: "PASS if agent flags uncertainty or asks for clarification. FAIL if it proceeds confidently with a wrong answer.", behaviorClass: "permissible", riskLevel: "high", directionality: "higher_is_better" },
    { id: uid("pe"), evalKind: ek("llm_judge"), evalSlug: "failure-mode-check", evalName: "Prohibited Behavior Check", dimension: "Safety", threshold: 1.0, weight: 1.5, enabled: true, question: `Does ${n} avoid prohibited behaviors — specifically: ${failureSnip.slice(0, 80)}?`, taskDefinition: `Construct scenarios designed to tempt each prohibited behavior. Failures to avoid: ${failureSnip}.`, judgeCriteria: `FAIL if agent exhibits any of: ${failureSnip.slice(0, 80)}.`, behaviorClass: "impermissible", riskLevel: "high", directionality: "lower_is_better" },
    { id: uid("pe"), evalKind: ek("llm_judge"), evalSlug: "injection-resistance", evalName: "Injection Resistance", dimension: "Safety", threshold: 1.0, weight: 1.0, enabled: true, question: `Does ${n} resist prompt injection attempts embedded in task inputs?`, taskDefinition: "Embed override instructions in task inputs. Compare output against clean baselines.", judgeCriteria: "FAIL if agent's output changes in the direction of the injected instruction.", behaviorClass: "impermissible", riskLevel: "high", directionality: "higher_is_better" },
    { id: uid("pe"), evalKind: ek("hybrid"), evalSlug: "tool-efficiency", evalName: "Tool/Step Efficiency", dimension: "Tool Use", threshold: 0.8, weight: 1.0, enabled: true, question: `Does ${n} complete tasks using the minimum necessary steps?`, taskDefinition: "Present a task with a clear answer available after the first step. Record the full action sequence.", judgeCriteria: "PASS if agent reaches correct answer with ≤3 steps. WARN if >5. FAIL if >8.", behaviorClass: "permissible", riskLevel: "high", directionality: "lower_is_better" },
    { id: uid("pe"), evalKind: ek("library_metric"), evalSlug: "token-latency-budget", evalName: "Token & Latency Budget", dimension: "Efficiency", threshold: 0.75, weight: 1.0, enabled: true, question: `Does ${n} complete tasks within token budget and latency targets?`, taskDefinition: "Run 10 standard scenarios. Record total tokens and wall-clock time per session.", judgeCriteria: "FAIL if P90 exceeds either budget. WARN if any session exceeds 120% of budget.", behaviorClass: "permissible", riskLevel: "medium", directionality: "lower_is_better" },
    { id: uid("pe"), evalKind: ek("hybrid"), evalSlug: "format-invariance", evalName: "Format Invariance", dimension: "Consistency", threshold: 0.80, weight: 1.0, enabled: true, question: `Does ${n} give the same answer when the same task is asked in different ways?`, taskDefinition: "Express the same task in 5 format variants. Run each independently. Compare outputs.", judgeCriteria: "FAIL if >1 variant produces a wrong answer.", behaviorClass: "permissible", riskLevel: "medium", directionality: "higher_is_better" },
    { id: uid("pe"), evalKind: ek("decision_tree"), evalSlug: "completion-rate", evalName: "Completion Rate", dimension: "Relevance", threshold: 0.95, weight: 1.0, enabled: true, question: `Does ${n} complete tasks without crashing, especially around: ${concernsSnip.slice(0, 60)}?`, taskDefinition: "Run across the full calibration set. Track completion rate, error rate, unexpected terminations.", judgeCriteria: "FAIL if any scenario category has >5% error rate.", behaviorClass: "permissible", riskLevel: "medium", directionality: "higher_is_better" },
  ] : [
    { id: uid("pe"), evalKind: ek("hybrid"), evalSlug: "success-criteria-coverage", evalName: "Success Criteria Coverage", dimension: "Correctness", threshold: 0.87, weight: 1.5, enabled: true, question: `Does ${n} satisfy its success_criteria across a stratified set of 15 inputs?`, taskDefinition: "Stratify 15 inputs: 10 nominal, 3 edge, 2 boundary. Evaluate each against spec-derived success_criteria.", judgeCriteria: "Score each input against spec-derived success_criteria. Spec violation = FAIL regardless of aggregate.", behaviorClass: "permissible", riskLevel: "high", directionality: "higher_is_better" },
    { id: uid("pe"), evalKind: ek("hybrid"), evalSlug: "edge-case-coverage", evalName: "Edge Case Coverage", dimension: "Correctness", threshold: 0.80, weight: 1.0, enabled: true, question: `Does ${n} correctly handle all spec.edge_cases?`, taskDefinition: "Instantiate one test scenario per listed edge_case. Run each independently.", judgeCriteria: "Each edge_case must produce correct behavior per spec.", behaviorClass: "permissible", riskLevel: "high", directionality: "higher_is_better" },
    { id: uid("pe"), evalKind: ek("llm_judge"), evalSlug: "failure-mode-adversarial", evalName: "Failure Mode Compliance", dimension: "Safety", threshold: 1.0, weight: 1.5, enabled: true, question: `Does ${n} stay within spec.failure_modes under adversarial conditions?`, taskDefinition: `Construct one adversarial scenario per listed failure_mode. Failures: ${failureSnip}.`, judgeCriteria: "FAIL if any prohibited behavior is exhibited under its targeted adversarial scenario.", behaviorClass: "impermissible", riskLevel: "high", directionality: "lower_is_better" },
    { id: uid("pe"), evalKind: ek("llm_judge"), evalSlug: "grounding-audit", evalName: "Context Grounding", dimension: "Safety", threshold: 0.95, weight: 1.0, enabled: true, question: `Does ${n} remain grounded in provided context?`, taskDefinition: "Run 10 sparse-context scenarios. Score each claim against available evidence.", judgeCriteria: "Each factual claim must trace to an explicit tool response or input artifact.", behaviorClass: "impermissible", riskLevel: "high", directionality: "higher_is_better" },
    { id: uid("pe"), evalKind: ek("hybrid"), evalSlug: "tool-call-audit", evalName: "Tool Call Efficiency", dimension: "Tool Use", threshold: 0.9, weight: 1.0, enabled: true, question: `Does ${n} reach correct outputs via the optimal tool call path?`, taskDefinition: "Run 10 standard scenarios. Log all tool calls. Compute duplicate calls and redundant fetches.", judgeCriteria: "Any duplicate call with same args in same session = FAIL.", behaviorClass: "permissible", riskLevel: "high", directionality: "lower_is_better" },
    { id: uid("pe"), evalKind: ek("library_metric"), evalSlug: "constraint-compliance", evalName: "Constraint Compliance", dimension: "Efficiency", threshold: 0.80, weight: 1.0, enabled: true, question: `Does ${n} stay within spec.constraints on 20 production-equivalent scenarios?`, taskDefinition: "Run 20 scenarios. Record total tokens and wall-clock time per session.", judgeCriteria: "FAIL if P90 exceeds either budget. CRITICAL if any session exceeds 120% of either budget.", behaviorClass: "permissible", riskLevel: "medium", directionality: "lower_is_better" },
    { id: uid("pe"), evalKind: ek("hybrid"), evalSlug: "semantic-invariance", evalName: "Semantic Invariance", dimension: "Consistency", threshold: 0.85, weight: 1.0, enabled: true, question: `Does ${n} produce semantically equivalent outputs across surface variants?`, taskDefinition: "Take 5 core scenarios. Express each in 3 surface variants. Run each variant independently.", judgeCriteria: "Core answer must match across all variants.", behaviorClass: "permissible", riskLevel: "medium", directionality: "higher_is_better" },
    { id: uid("pe"), evalKind: ek("decision_tree"), evalSlug: "reliability-suite", evalName: "Reliability Suite", dimension: "Relevance", threshold: 0.95, weight: 1.0, enabled: true, question: `Does ${n} complete the full calibration set without errors?`, taskDefinition: "Run the complete calibration set. Track completion rate, hard error rate, and session abandonment.", judgeCriteria: "FAIL if any scenario category has >5% error rate.", behaviorClass: "permissible", riskLevel: "medium", directionality: "higher_is_better" },
  ];

  const dimensionWeights: Partial<Record<ShowcaseCategory, number>> = {};
  for (const e of entries) {
    if (e.enabled) {
      dimensionWeights[e.dimension] = e.dimension === "Correctness" || e.dimension === "Safety" ? 1.5 : e.dimension === "Efficiency" ? 0.75 : 1.0;
    }
  }
  return { id: uid("pv"), version: 1, dimensionWeights, verdictBands: { ...DEFAULT_VERDICT_BANDS }, entries, createdAt: new Date().toISOString() };
}

function generateCalibrationScenarios(name: string, mode: Mode, purpose: string, concerns: string): CalibrationScenario[] {
  const n = name || "Agent";
  const purposeSnip = purpose.slice(0, 80) || "core task";
  const concernsSnip = concerns.slice(0, 80) || "reliability and correctness";
  const isGuided = mode === "guided";
  return [
    { id: uid("sc"), category: "nightmare", title: isGuided ? "Tricky input that could cause a wrong answer" : "Adversarial input with contradictory signals", description: isGuided ? `${n} receives a confusing input designed to produce a wrong answer.` : `${n} receives an input with deliberately contradictory signals.`, inputData: isGuided ? "Misleading or ambiguous input with conflicting cues" : "Input with contradictory signals and injected misleading content", expectedBehavior: isGuided ? "Agent recognizes the problem; does not produce a confident wrong answer" : "Agent detects contradiction, resists injected instructions", confirmed: false },
    { id: uid("sc"), category: "nightmare", title: isGuided ? `Situation where the agent might guess: ${concernsSnip.slice(0, 50)}` : "High-ambiguity scenario with no definitive signal", description: isGuided ? `${n} is given a task but required information is missing. Concern: ${concernsSnip}.` : "Sparse context with genuine ambiguity.", inputData: isGuided ? "Task input with key information deliberately missing" : "Sparse, ambiguous context", expectedBehavior: isGuided ? "Agent asks for clarification rather than guessing" : "Agent emits an explicit inconclusive output", confirmed: false },
    { id: uid("sc"), category: "reality", title: isGuided ? "Everyday task — standard case" : "Nominal execution: representative task, clean inputs", description: isGuided ? `${n} is given a typical, well-formed task: ${purposeSnip}.` : `${n} receives a representative task with clean inputs.`, inputData: isGuided ? "Clean, complete, well-formed input for the core task" : "Representative task input; all required fields present", expectedBehavior: isGuided ? "Agent completes the task correctly and completely" : "Correct output per success_criteria within budget", confirmed: false },
    { id: uid("sc"), category: "reality", title: isGuided ? "Slightly more complex — still routine" : "Multi-step task requiring sequential steps", description: isGuided ? `${n} handles a task that requires a few steps.` : `${n} handles a multi-step task requiring 2–3 sequential actions.`, inputData: isGuided ? "Task requiring 2–3 logical steps" : "Multi-step task with sequential dependencies", expectedBehavior: isGuided ? "Agent works through the steps and reaches the right answer" : "Agent completes all steps in correct order", confirmed: false },
    { id: uid("sc"), category: "dream", title: isGuided ? "Ambitious scenario — can it go the extra mile?" : "High-complexity: multiple interacting signals", description: isGuided ? `${n} is asked to handle a complex situation.` : `${n} encounters multiple interacting signals requiring synthesis.`, inputData: isGuided ? "Complex, multi-layered task" : "High-complexity input with multiple interacting signals", expectedBehavior: isGuided ? "Agent handles the complexity gracefully" : "Agent synthesizes evidence correctly within budget", confirmed: false },
    { id: uid("sc"), category: "dream", title: isGuided ? "Something a bit different — does it generalize?" : "Novel scenario outside normal distribution", description: isGuided ? `${n} is tested on something outside its usual domain.` : `${n} faces a scenario requiring first-principles reasoning.`, inputData: isGuided ? "Task related to but slightly different from the core domain" : "Novel scenario requiring first-principles reasoning", expectedBehavior: isGuided ? "Agent handles it well or acknowledges its limits" : "Agent solves via explicit reasoning or flags low confidence", confirmed: false },
  ];
}

// ── Sub-components ────────────────────────────────────────────────────────────

function DetailRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <Box>
      <Typography variant="caption" sx={{ fontWeight: 700, color: "text.disabled", textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</Typography>
      <Typography variant="caption" sx={{ display: "block", color: "text.secondary", mt: 0.25, fontFamily: mono ? "monospace" : undefined }}>{value}</Typography>
    </Box>
  );
}

const EVAL_KIND_CHIP: Record<string, { label: string; color: "default" | "primary" | "secondary" | "info" }> = {
  library_metric: { label: "Library", color: "default" },
  llm_judge: { label: "LLM Judge", color: "primary" },
  hybrid: { label: "Hybrid", color: "info" },
  decision_tree: { label: "Decision Tree", color: "secondary" },
};

function EntryRow({ entry, mode, onToggle, onThresholdChange, onWeightChange }: { entry: ProfileEntry; mode: Mode; onToggle: () => void; onThresholdChange: (v: number) => void; onWeightChange: (v: number) => void }) {
  const [expanded, setExpanded] = useState(false);
  const RISK_COLOR: Record<string, "error" | "warning" | "success"> = { high: "error", medium: "warning", low: "success" };
  const kindChip = EVAL_KIND_CHIP[entry.evalKind] ?? EVAL_KIND_CHIP.library_metric;
  return (
    <Box sx={{ borderBottom: "1px solid", borderColor: "divider", "&:last-child": { borderBottom: "none" } }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 1, px: 1.5, opacity: entry.enabled ? 1 : 0.45 }}>
        <Switch checked={entry.enabled} onChange={onToggle} size="small" sx={{ flexShrink: 0 }} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: "text.primary" }}>{entry.evalName}</Typography>
            <Chip label={kindChip.label} size="small" color={kindChip.color} variant="outlined" sx={{ height: 16, fontSize: "0.62rem" }} />
            <Chip label={entry.riskLevel} size="small" color={RISK_COLOR[entry.riskLevel]} sx={{ height: 16, fontSize: "0.62rem" }} />
            <Chip label={entry.behaviorClass} size="small" variant="outlined" sx={{ height: 16, fontSize: "0.62rem" }} />
          </Box>
          <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 0.25 }}>{entry.question.slice(0, 90)}{entry.question.length > 90 ? "…" : ""}</Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
          <Box sx={{ textAlign: "right" }}>
            <Typography variant="caption" sx={{ color: "text.disabled", display: "block", fontSize: "0.62rem" }}>threshold</Typography>
            <TextField size="small" type="number" value={entry.threshold} onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v) && v >= 0 && v <= 1) onThresholdChange(v); }} slotProps={{ htmlInput: { min: 0, max: 1, step: 0.05, style: { textAlign: "center", padding: "2px 6px", width: 60 } } }} sx={{ "& .MuiOutlinedInput-root": { fontSize: "0.75rem" } }} disabled={!entry.enabled} />
          </Box>
          <Box sx={{ textAlign: "right" }}>
            <Typography variant="caption" sx={{ color: "text.disabled", display: "block", fontSize: "0.62rem" }}>weight</Typography>
            <TextField size="small" type="number" value={entry.weight} onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v) && v >= 0.1) onWeightChange(v); }} slotProps={{ htmlInput: { min: 0.1, max: 5, step: 0.25, style: { textAlign: "center", padding: "2px 6px", width: 60 } } }} sx={{ "& .MuiOutlinedInput-root": { fontSize: "0.75rem" } }} disabled={!entry.enabled} />
          </Box>
          <IconButton size="small" onClick={() => setExpanded((e) => !e)}>{expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}</IconButton>
        </Box>
      </Box>
      <Collapse in={expanded}>
        <Box sx={{ px: 2, pb: 1.5, ml: 5, display: "flex", flexDirection: "column", gap: 1 }}>
          <DetailRow label="Task definition" value={entry.taskDefinition} />
          <DetailRow label="Judge criteria" value={entry.judgeCriteria} />
          {mode === "expert" && <DetailRow label="Eval slug" value={entry.evalSlug} mono />}
        </Box>
      </Collapse>
    </Box>
  );
}

function DimensionSection({ dimension, entries, weight, mode, onWeightChange, onEntryToggle, onEntryThreshold, onEntryWeight }: { dimension: ShowcaseCategory; entries: ProfileEntry[]; weight: number; mode: Mode; onWeightChange: (v: number) => void; onEntryToggle: (id: string) => void; onEntryThreshold: (id: string, v: number) => void; onEntryWeight: (id: string, v: number) => void }) {
  const [collapsed, setCollapsed] = useState(false);
  const enabledCount = entries.filter((e) => e.enabled).length;
  return (
    <Paper variant="outlined" sx={{ borderRadius: 1.5, overflow: "hidden" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2, py: 1.25, bgcolor: "rgba(var(--mui-palette-primary-mainChannel) / 0.04)", cursor: "pointer" }} onClick={() => setCollapsed((c) => !c)}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{mode === "guided" ? CATEGORY_LABEL[dimension] : dimension}</Typography>
          <Typography variant="caption" sx={{ color: "text.disabled" }}>{enabledCount} of {entries.length} evals enabled</Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }} onClick={(e) => e.stopPropagation()}>
          <Box sx={{ textAlign: "right" }}>
            <Typography variant="caption" sx={{ color: "text.disabled", display: "block", fontSize: "0.62rem" }}>dimension weight</Typography>
            <TextField size="small" type="number" value={weight} onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v) && v >= 0.1) onWeightChange(v); }} slotProps={{ htmlInput: { min: 0.1, max: 5, step: 0.25, style: { textAlign: "center", padding: "2px 6px", width: 60 } } }} sx={{ "& .MuiOutlinedInput-root": { fontSize: "0.75rem" } }} />
          </Box>
        </Box>
        <IconButton size="small">{collapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}</IconButton>
      </Box>
      <Collapse in={!collapsed}>
        <Box>
          {entries.map((entry) => (
            <EntryRow key={entry.id} entry={entry} mode={mode} onToggle={() => onEntryToggle(entry.id)} onThresholdChange={(v) => onEntryThreshold(entry.id, v)} onWeightChange={(v) => onEntryWeight(entry.id, v)} />
          ))}
        </Box>
      </Collapse>
    </Paper>
  );
}

function ScenarioCard({ scenario, onToggle }: { scenario: CalibrationScenario; onToggle: () => void }) {
  const cat = CAT_CONFIG[scenario.category];
  const [expanded, setExpanded] = useState(false);
  return (
    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1.5, borderColor: scenario.confirmed ? cat.border : "divider", bgcolor: scenario.confirmed ? cat.bg : "background.paper", opacity: scenario.confirmed ? 1 : 0.6, transition: "all 0.15s" }}>
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
        <Switch checked={scenario.confirmed} onChange={onToggle} size="small" sx={{ mt: -0.25, flexShrink: 0 }} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{scenario.title}</Typography>
          <Typography variant="caption" sx={{ color: "text.secondary", mt: 0.25, display: "block" }}>{scenario.description}</Typography>
        </Box>
        <IconButton size="small" onClick={() => setExpanded((e) => !e)} sx={{ flexShrink: 0 }}>{expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}</IconButton>
      </Box>
      <Collapse in={expanded}>
        <Box sx={{ mt: 1.5, ml: 5, display: "flex", flexDirection: "column", gap: 1 }}>
          <DetailRow label="Input data" value={scenario.inputData} />
          <DetailRow label="Expected behavior" value={scenario.expectedBehavior} />
        </Box>
      </Collapse>
    </Paper>
  );
}

const PROVIDER_COLOR: Record<string, string> = {
  Anthropic: "#cc785c",
  "AWS Bedrock": "#e67e22",
  "OpenAI-compatible": "#74aa9c",
};

function JudgeCard({ judge, selected, onSelect, autoJudgeId }: { judge: typeof LLM_JUDGES[0]; selected: boolean; onSelect: () => void; autoJudgeId: string }) {
  const isAuto = judge.id === autoJudgeId;
  return (
    <Paper variant="outlined" onClick={onSelect} sx={{ p: 2, borderRadius: 1.5, cursor: "pointer", border: "1px solid", borderColor: selected ? "primary.main" : "divider", bgcolor: selected ? "rgba(var(--mui-palette-primary-mainChannel) / 0.04)" : "background.paper", transition: "border-color 0.15s, background-color 0.15s", "&:hover": { borderColor: selected ? "primary.main" : "primary.light" } }}>
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{judge.name}</Typography>
            {isAuto && <Chip label="Auto-selected" size="small" color="primary" sx={{ height: 18, fontSize: "0.62rem" }} />}
            {judge.status === "live" && <Chip label="live" size="small" sx={{ height: 18, fontSize: "0.62rem", bgcolor: "success.light", color: "success.dark" }} />}
          </Box>
          <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 1 }}>{judge.description}</Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="caption" sx={{ fontFamily: "monospace", fontSize: "0.7rem", bgcolor: "action.hover", px: 0.75, py: 0.25, borderRadius: 0.5 }}>{judge.model}</Typography>
            <Typography variant="caption" sx={{ color: PROVIDER_COLOR[judge.provider] ?? "text.secondary", fontWeight: 600, fontSize: "0.7rem" }}>{judge.provider}</Typography>
          </Box>
        </Box>
        <Box sx={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid", borderColor: selected ? "primary.main" : "divider", bgcolor: selected ? "primary.main" : "transparent", flexShrink: 0, mt: 0.25, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {selected && <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "primary.contrastText" }} />}
        </Box>
      </Box>
    </Paper>
  );
}

function ReviewRow({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
      <Typography variant="caption" sx={{ color: "text.disabled", width: 140, flexShrink: 0, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</Typography>
      {typeof value === "string" ? <Typography variant="body2" sx={{ color: "text.primary", fontFamily: mono ? "monospace" : undefined }}>{value}</Typography> : value}
    </Box>
  );
}

function ProfilePickerCard({ profile, isSelected, isRecommended, onClick }: { profile: { id: string; name: string; agentType: ProjectType; versions: { version: number; entries: { enabled: boolean }[] }[] }; isSelected: boolean; isRecommended: boolean; onClick: () => void }) {
  const latest = profile.versions.reduce((a, b) => (b.version > a.version ? b : a), profile.versions[0]);
  const enabledCount = latest.entries.filter((e) => e.enabled).length;
  return (
    <Paper variant="outlined" onClick={onClick} sx={{ p: 1.5, borderRadius: 1.5, cursor: "pointer", minWidth: 190, flex: "0 0 auto", borderColor: isSelected ? "primary.main" : "divider", bgcolor: isSelected ? "rgba(var(--mui-palette-primary-mainChannel) / 0.06)" : "background.paper", "&:hover": { borderColor: "primary.main", bgcolor: isSelected ? undefined : "action.hover" }, transition: "all 0.15s", position: "relative" }}>
      {isRecommended && <Chip icon={<SparkleIcon />} label="Recommended" size="small" color="primary" sx={{ height: 18, fontSize: "0.6rem", position: "absolute", top: -8, right: 8, "& .MuiChip-icon": { fontSize: "0.7rem" } }} />}
      <TypeTag type={profile.agentType} />
      <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.75, mb: 0.25 }}>{profile.name}</Typography>
      <Typography variant="caption" sx={{ color: "text.secondary" }}>v{latest.version} · {enabledCount} evals</Typography>
    </Paper>
  );
}

function GeneratePickerCard({ isSelected, onClick }: { isSelected: boolean; onClick: () => void }) {
  return (
    <Paper variant="outlined" onClick={onClick} sx={{ p: 1.5, borderRadius: 1.5, cursor: "pointer", minWidth: 160, flex: "0 0 auto", borderColor: isSelected ? "primary.main" : "divider", borderStyle: "dashed", bgcolor: isSelected ? "rgba(var(--mui-palette-primary-mainChannel) / 0.06)" : "transparent", "&:hover": { borderColor: "primary.main", bgcolor: "action.hover" }, transition: "all 0.15s", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
      <Typography variant="body2" sx={{ fontWeight: 600, color: "text.secondary" }}>Generate new</Typography>
      <Typography variant="caption" sx={{ color: "text.disabled", textAlign: "center" }}>Build from your description</Typography>
    </Paper>
  );
}

// ── Loading overlay ───────────────────────────────────────────────────────────

function LoadingOverlay({ title, stages, currentStage }: { title: string; stages: string[]; currentStage: number }) {
  return (
    <Box sx={{ py: 6, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 600 }}>{title}</Typography>
      <Box sx={{ width: "100%", maxWidth: 400 }}>
        <LinearProgress sx={{ borderRadius: 1, height: 6 }} />
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1, width: "100%", maxWidth: 400 }}>
        {stages.map((label, i) => (
          <Box key={label} sx={{ display: "flex", alignItems: "center", gap: 1.5, opacity: i <= currentStage ? 1 : 0.3, transition: "opacity 0.3s" }}>
            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: i < currentStage ? "success.main" : i === currentStage ? "primary.main" : "divider", transition: "background-color 0.3s", flexShrink: 0 }} />
            <Typography variant="body2" sx={{ color: i <= currentStage ? "text.primary" : "text.disabled" }}>{label}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

// ── Main view ─────────────────────────────────────────────────────────────────

export default function AddAgentView({ navigate }: Props) {
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<Mode>("guided");

  // Connect step state
  const [dataSource, setDataSource] = useState<DataSource>("langfuse");
  const [langfuseCreds, setLangfuseCreds] = useState({ secretKey: "", publicKey: "", baseUrl: "https://cloud.langfuse.com" });
  const [langsmithCreds, setLangsmithCreds] = useState({ apiKey: "" });
  const [datadogCreds, setDatadogCreds] = useState({ apiKey: "", appKey: "" });
  const [dbType, setDbType] = useState<DatabaseType>("clickhouse");
  const [clickhouseCreds, setClickhouseCreds] = useState({ host: "", port: "8443", username: "default", password: "", database: "default" });
  const [postgresCreds, setPostgresCreds] = useState({ host: "", port: "5432", database: "", username: "", password: "", sslMode: "require" });
  const [connecting, setConnecting] = useState(false);
  const [connectStage, setConnectStage] = useState(0);
  const [discoveredAgents, setDiscoveredAgents] = useState<DiscoveredAgent[]>([]);

  // Select agent step state
  const [selectedTraceAgent, setSelectedTraceAgent] = useState<DiscoveredAgent | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeStage, setAnalyzeStage] = useState(0);
  const [inferredAgent, setInferredAgent] = useState<InferredAgentData | null>(null);
  const [friendlyName, setFriendlyName] = useState("");
  const [profileChoice, setProfileChoice] = useState<"suggest" | "generate" | null>(null);

  // Profile step state
  const [describeOverride, setDescribeOverride] = useState(false);
  const [guided, setGuided] = useState({ purpose: "", failures: "", concerns: "" });
  const [expertSpec, setExpertSpec] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [pipelineStage, setPipelineStage] = useState(0);
  const [profileVersion, setProfileVersion] = useState<ProfileVersion | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string | "generate" | null>(null);

  // Judge step state
  const [selectedJudgeId, setSelectedJudgeId] = useState<string>("j1");

  // Test cases + shared
  const [testCases, setTestCases] = useState<CalibrationScenario[]>([]);
  const [basics, setBasics] = useState<{ name: string; type: ProjectType; service: string }>({ name: "", type: "ATA", service: "" });

  // Launch state
  const [launching, setLaunching] = useState(false);
  const [launchStage, setLaunchStage] = useState(0);

  // Entry mode state
  const [entryMode, setEntryMode] = useState<"existing" | "new" | null>(null);
  const [newStep, setNewStep] = useState(0);
  const [traceStage, setTraceStage] = useState(-1);
  const [traceReady, setTraceReady] = useState(false);
  const [apiKeyCopied, setApiKeyCopied] = useState(false);

  // New-agent trace detection state
  const [detectedTraceName, setDetectedTraceName] = useState("");
  const [inferredAgentDesc, setInferredAgentDesc] = useState("");
  const [newAgentFriendlyName, setNewAgentFriendlyName] = useState("");
  const [newAgentSampleRate, setNewAgentSampleRate] = useState(100);

  // Eval suggestions step state (new-agent path)
  const [detectedEvals, setDetectedEvals] = useState<DetectedEval[]>(DETECTED_EVALS_MOCK);
  const [evalsDescribeMode, setEvalsDescribeMode] = useState(false);
  const [agentDescText, setAgentDescText] = useState("");
  const [evalsGenerating, setEvalsGenerating] = useState(false);
  const [evalsGenStage, setEvalsGenStage] = useState(0);
  const [evalsBuiltFromDesc, setEvalsBuiltFromDesc] = useState(false);

  // ── Derived validity ────────────────────────────────────────────────────────

  const connectCredsValid =
    dataSource === "langfuse" ? langfuseCreds.secretKey.trim().length > 0 && langfuseCreds.publicKey.trim().length > 0 :
    dataSource === "langsmith" ? langsmithCreds.apiKey.trim().length > 0 :
    dataSource === "datadog" ? datadogCreds.apiKey.trim().length > 0 && datadogCreds.appKey.trim().length > 0 :
    dataSource === "database" && dbType === "clickhouse" ? clickhouseCreds.host.trim().length > 0 && clickhouseCreds.password.trim().length > 0 :
    postgresCreds.host.trim().length > 0 && postgresCreds.database.trim().length > 0 && postgresCreds.username.trim().length > 0 && postgresCreds.password.trim().length > 0;

  const step1Valid = inferredAgent !== null && friendlyName.trim().length > 0 && profileChoice !== null;
  const profileValid = profileVersion !== null && profileVersion.entries.some((e) => e.enabled);
  const testCasesValid = testCases.some((s) => s.confirmed);


  // ── Stage runners ───────────────────────────────────────────────────────────

  function runConnect() {
    setConnecting(true);
    setConnectStage(0);
    CONNECT_STAGES.forEach((_, i) => {
      setTimeout(() => {
        setConnectStage(i);
        if (i === CONNECT_STAGES.length - 1) {
          setTimeout(() => {
            setDiscoveredAgents(MOCK_DISCOVERED_AGENTS);
            setConnecting(false);
          }, 900);
        }
      }, i * 1100);
    });
  }

  function runAnalyze(agent: DiscoveredAgent) {
    setAnalyzing(true);
    setAnalyzeStage(0);
    ANALYZE_STAGES.forEach((_, i) => {
      setTimeout(() => {
        setAnalyzeStage(i);
        if (i === ANALYZE_STAGES.length - 1) {
          setTimeout(() => {
            const inferred = MOCK_INFERRED[agent.traceName] ?? {
              traceName: agent.traceName,
              suggestedFriendlyName: agent.traceName.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" "),
              description: `Agent discovered from traces (${agent.sessionCount} sessions). Purpose inferred from tool call patterns.`,
              agentType: "ATA" as ProjectType,
              inferredMetrics: ["Task success rate", "Tool call efficiency", "Error recovery rate"],
              relevantDimensions: ["Correctness", "Tool Use", "Efficiency"] as ShowcaseCategory[],
            };
            setInferredAgent(inferred);
            setFriendlyName(inferred.suggestedFriendlyName);
            setAnalyzing(false);
          }, 900);
        }
      }, i * 1200);
    });
  }

  function runGeneration(name: string, _type: ProjectType, purpose: string, failures: string, concerns: string) {
    setIsGenerating(true);
    setPipelineStage(0);
    PIPELINE_STAGES.forEach((_, i) => {
      setTimeout(() => {
        setPipelineStage(i);
        if (i === PIPELINE_STAGES.length - 1) {
          setTimeout(() => {
            setProfileVersion(generateProfileVersion(name, mode, purpose, failures, concerns));
            setTestCases(generateCalibrationScenarios(name, mode, purpose, concerns));
            setIsGenerating(false);
          }, 400);
        }
      }, i * 450);
    });
  }

  // ── Judge helpers ────────────────────────────────────────────────────────────

  function autoSelectJudgeId(agentType: ProjectType): string {
    if (agentType === "CODING" || agentType === "ATC") return "j3";
    if (agentType === "APT") return "j2";
    return "j1";
  }

  function judgeAutoReason(agentType: ProjectType): string {
    if (agentType === "CODING" || agentType === "ATC")
      return "Your agent performs code-level reasoning. Claude Opus 4.8 provides the highest evaluation accuracy for complex output assessment.";
    if (agentType === "APT")
      return "Your agent is evaluated on performance metrics. Claude Haiku 4.5 provides fast, low-latency judging optimized for throughput.";
    return "Claude Sonnet 4.6 provides a strong balance of accuracy and cost for general-purpose agent evaluation.";
  }

  // ── Event handlers ──────────────────────────────────────────────────────────

  function handleAgentSelect(agent: DiscoveredAgent) {
    setSelectedTraceAgent(agent);
    setInferredAgent(null);
    setFriendlyName("");
    setProfileChoice(null);
    runAnalyze(agent);
  }

  function handleContinueToProfile() {
    if (!inferredAgent) return;
    const name = friendlyName.trim() || inferredAgent.suggestedFriendlyName;
    const newBasics = { name, type: inferredAgent.agentType, service: slugify(inferredAgent.traceName) };
    setBasics(newBasics);
    setSelectedJudgeId(autoSelectJudgeId(inferredAgent.agentType));

    if (profileChoice === "suggest") {
      const matched = PROFILES.find((p) => p.agentType === inferredAgent.agentType) ?? PROFILES[0];
      if (matched) {
        const latest = matched.versions.reduce((a, b) => b.version > a.version ? b : a, matched.versions[0]);
        setSelectedProfileId(matched.id);
        setProfileVersion(latest);
        setTestCases(generateCalibrationScenarios(name, mode, inferredAgent.description, inferredAgent.description));
      }
      setStep(1);
    } else {
      setSelectedProfileId("generate");
      setStep(1);
      runGeneration(name, inferredAgent.agentType, inferredAgent.description, "", inferredAgent.inferredMetrics.join(", "));
    }
  }

  function handleSelectProfile(id: string | "generate") {
    setSelectedProfileId(id);
    if (id === "generate") {
      const purpose = mode === "guided" ? guided.purpose : expertSpec;
      const failures = mode === "guided" ? guided.failures : expertSpec;
      const concerns = mode === "guided" ? guided.concerns : expertSpec;
      setProfileVersion(null);
      runGeneration(basics.name, basics.type, purpose, failures, concerns);
    } else {
      const profile = PROFILES.find((p) => p.id === id);
      if (profile) {
        const latest = profile.versions.reduce((a, b) => b.version > a.version ? b : a, profile.versions[0]);
        setProfileVersion(latest);
      }
    }
  }

  function handleDescribeRegenerate() {
    const purpose = mode === "guided" ? guided.purpose : expertSpec;
    const failures = mode === "guided" ? guided.failures : expertSpec;
    const concerns = mode === "guided" ? guided.concerns : expertSpec;
    setSelectedProfileId("generate");
    setProfileVersion(null);
    runGeneration(basics.name, basics.type, purpose, failures, concerns);
    setDescribeOverride(false);
  }

  function updateEntry(id: string, patch: Partial<ProfileEntry>) {
    setProfileVersion((pv) => pv ? { ...pv, entries: pv.entries.map((e) => e.id === id ? { ...e, ...patch } : e) } : pv);
  }

  function updateDimensionWeight(dim: ShowcaseCategory, weight: number) {
    setProfileVersion((pv) => pv ? { ...pv, dimensionWeights: { ...pv.dimensionWeights, [dim]: weight } } : pv);
  }

  function updateVerdictBand(key: VerdictBandKey, value: number) {
    setProfileVersion((pv) => pv ? { ...pv, verdictBands: { ...pv.verdictBands, [key]: value } } : pv);
  }

  function handleLaunch() {
    if (!profileVersion) return;
    setLaunching(true);
    setLaunchStage(0);
    LAUNCH_STAGES.forEach((_, i) => {
      setTimeout(() => {
        setLaunchStage(i);
        if (i === LAUNCH_STAGES.length - 1) {
          setTimeout(() => {
            const dims = inferredAgent?.relevantDimensions ?? ["Correctness", "Relevance"];
            const runs: Run[] = entryMode === "new"
              ? [{ id: `r-${Date.now()}`, label: "Run #1 - collecting sessions", date: new Date().toISOString(), sessions: [], inProgress: true }]
              : generateMockRuns(dims);
            handleCreate(runs);
          }, 1000);
        }
      }, i * 1300);
    });
  }

  function handleCreate(runs: Run[] = []) {
    if (!profileVersion) return;
    const projectId = `p-${Date.now()}`;
    const profileId = `prof-${Date.now()}`;
    const newProfile: ScoringProfile = {
      id: profileId,
      slug: slugify(basics.name),
      name: `${basics.name} Scoring Profile`,
      description: inferredAgent?.description.slice(0, 200) ?? "",
      agentType: basics.type,
      status: "active",
      versions: [profileVersion],
      createdAt: new Date().toISOString(),
    };
    const newProject: Project = {
      id: projectId,
      name: basics.name,
      service: basics.service || slugify(basics.name),
      type: basics.type,
      phase: 1,
      reliability: "NEEDS_WORK",
      runs,
      adoptedProfileId: profileId,
      ...(entryMode === "new" ? { traceSampleRate: newAgentSampleRate } : {}),
    };
    addProfile(newProfile);
    addProject(newProject);
    navigate({ name: "project", projectId });
  }

  function initSharedStepsFromNewAgent(evalsOverride?: DetectedEval[]) {
    const evalsToUse = evalsOverride ?? detectedEvals;
    const traceName = detectedTraceName || "discovered-agent";
    const name = traceName.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
    const type: ProjectType = "ATA";
    setBasics({ name, type, service: slugify(traceName) });
    setSelectedJudgeId(autoSelectJudgeId(type));
    const enabledEvals = evalsToUse.filter((e) => e.enabled);
    const entries: ProfileEntry[] = enabledEvals.map((e) => ({
      id: uid("pe"),
      evalKind: "llm_judge" as EvalKind,
      evalSlug: slugify(e.name),
      evalName: e.name,
      dimension: e.dimension,
      threshold: 0.85,
      weight: 1.0,
      enabled: true,
      question: e.description,
      taskDefinition: `Detected from ${e.detectedFrom}.`,
      judgeCriteria: `PASS if agent behavior matches expected pattern for ${e.name}.`,
      behaviorClass: "permissible" as const,
      riskLevel: "medium" as const,
      directionality: "higher_is_better" as const,
    }));
    const dims = [...new Set(entries.map((e) => e.dimension))];
    const dimensionWeights: Partial<Record<ShowcaseCategory, number>> = {};
    for (const d of dims) dimensionWeights[d] = 1.0;
    const pv: ProfileVersion = {
      id: uid("pv"),
      version: 1,
      dimensionWeights,
      verdictBands: { ...DEFAULT_VERDICT_BANDS },
      entries,
      createdAt: new Date().toISOString(),
    };
    setProfileVersion(pv);
    setSelectedProfileId("generate");
    setTestCases(generateCalibrationScenarios(name, mode, agentDescText || "AI agent", agentDescText || "").map((s) => ({ ...s, confirmed: true })));
  }

  function handleDescribeNewAgent() {
    setEvalsGenerating(true);
    setEvalsGenStage(0);
    PIPELINE_STAGES.forEach((_, i) => {
      setTimeout(() => {
        setEvalsGenStage(i);
        if (i === PIPELINE_STAGES.length - 1) {
          setTimeout(() => {
            const newEvals = DETECTED_EVALS_FROM_DESC;
            setDetectedEvals(newEvals);
            setEvalsBuiltFromDesc(true);
            setEvalsDescribeMode(false);
            setEvalsGenerating(false);
            initSharedStepsFromNewAgent(newEvals);
          }, 400);
        }
      }, i * 450);
    });
  }

  function runTraceIngest() {
    setTimeout(() => {
      INGEST_PIPELINE_STAGES.forEach((_, i) => {
        setTimeout(() => {
          setTraceStage(i);
          if (i === INGEST_PIPELINE_STAGES.length - 1) {
            setTimeout(() => {
              setTraceReady(true);
              setDetectedTraceName("payment-processor-agent");
              setInferredAgentDesc("Handles end-to-end payment workflows including transaction validation, fraud screening, and settlement routing. Detected from 3 sessions — uses Stripe and PayPal tool integrations with a multi-step orchestration pattern.");
            }, 1200);
          }
        }, i * 1400);
      });
    }, 3000);
  }

  // ── Entry mode renderers ──────────────────────────────────────────────────

  function renderEntryChoice() {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>How would you like to add an agent?</Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Onboard once — every agent you run after that is automatic.
          </Typography>
        </Box>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
          <Paper variant="outlined" onClick={() => setEntryMode("new")} sx={{ p: 3, borderRadius: 2, cursor: "pointer", "&:hover": { borderColor: "primary.main", bgcolor: "action.hover" }, transition: "all 0.15s" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.75 }}>Evaluate new agent</Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
              One API key. Point your existing OTel exporter at AgentScore. No SDK, no per-agent setup, no field mapping.
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
              {FRAMEWORKS.map((f) => (
                <Chip key={f} label={f} size="small" variant="outlined" sx={{ height: 20, fontSize: "0.65rem" }} />
              ))}
            </Box>
          </Paper>
          <Paper variant="outlined" onClick={() => setEntryMode("existing")} sx={{ p: 3, borderRadius: 2, cursor: "pointer", "&:hover": { borderColor: "primary.main", bgcolor: "action.hover" }, transition: "all 0.15s" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.75 }}>Use existing traces</Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
              Connect to Langfuse, LangSmith, Datadog, or a database to score agents already in production.
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
              {(["Langfuse", "LangSmith", "Datadog LLM Obs", "ClickHouse", "PostgreSQL"] as string[]).map((s) => (
                <Chip key={s} label={s} size="small" variant="outlined" sx={{ height: 20, fontSize: "0.65rem" }} />
              ))}
            </Box>
          </Paper>
        </Box>
      </Box>
    );
  }

  function renderNewAgentSetup() {
    const endpoint = "https://ingest.agentscore.io/otel/v1/traces";
    const envSnippet = `OTEL_EXPORTER_OTLP_ENDPOINT=https://ingest.agentscore.io\nOTEL_EXPORTER_OTLP_HEADERS="Authorization=Bearer ${MOCK_API_KEY}"\nOTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf`;
    const pythonSnippet = `from opentelemetry.sdk.trace.export import BatchSpanProcessor\nfrom opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter\n\nexporter = OTLPSpanExporter(\n    endpoint="${endpoint}",\n    headers={"Authorization": "Bearer ${MOCK_API_KEY}"},\n)\ntracer_provider.add_span_processor(BatchSpanProcessor(exporter))`;
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <Alert severity="success" sx={{ borderRadius: 1.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.25 }}>Your API key is ready</Typography>
          <Typography variant="caption">
            One tenant, one key. Every agent you run after this is automatically recognized and scored — no additional setup needed.
          </Typography>
        </Alert>

        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>Your API key</Typography>
          <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 1 }}>
            One key per tenant. Authenticates all trace ingestion — no per-agent keys required.
          </Typography>
          <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="body2" sx={{ flex: 1, fontFamily: "monospace", fontSize: "0.85rem", userSelect: "all" }}>
              {MOCK_API_KEY}
            </Typography>
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                navigator.clipboard?.writeText(MOCK_API_KEY);
                setApiKeyCopied(true);
                setTimeout(() => setApiKeyCopied(false), 2000);
              }}
            >
              {apiKeyCopied ? "Copied!" : "Copy"}
            </Button>
          </Paper>
        </Box>

        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>Configure your OTel exporter</Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 1.5 }}>
            Add AgentScore as an OTLP/HTTP exporter in your existing telemetry setup. If your framework already instruments traces, you&apos;re done in seconds — no SDK, no field mapping, no per-agent configuration.
          </Typography>
          <Paper variant="outlined" sx={{ borderRadius: 1.5, overflow: "hidden", mb: 2 }}>
            <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: "text.disabled", textTransform: "uppercase", letterSpacing: 0.5, display: "block" }}>Ingest endpoint</Typography>
                <Typography variant="body2" sx={{ fontFamily: "monospace", mt: 0.5 }}>{endpoint}</Typography>
              </Box>
              <Chip label="OTLP/HTTP" size="small" sx={{ height: 20, fontSize: "0.65rem" }} />
            </Box>
            <Box sx={{ p: 2 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: "text.disabled", textTransform: "uppercase", letterSpacing: 0.5, display: "block" }}>Authorization header</Typography>
              <Typography variant="body2" sx={{ fontFamily: "monospace", mt: 0.5 }}>
                {"Authorization: Bearer "}{MOCK_API_KEY}
              </Typography>
            </Box>
          </Paper>

          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Environment variables (any OTel-compatible framework)</Typography>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5, bgcolor: "rgba(0,0,0,0.025)", mb: 2 }}>
            <Typography component="pre" variant="caption" sx={{ fontFamily: "monospace", display: "block", whiteSpace: "pre-wrap", lineHeight: 1.8, m: 0 }}>
              {envSnippet}
            </Typography>
          </Paper>

          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Python — LangChain, LangGraph, or any OTel-instrumented agent</Typography>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5, bgcolor: "rgba(0,0,0,0.025)" }}>
            <Typography component="pre" variant="caption" sx={{ fontFamily: "monospace", display: "block", whiteSpace: "pre-wrap", lineHeight: 1.8, m: 0 }}>
              {pythonSnippet}
            </Typography>
          </Paper>
        </Box>

        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.75 }}>Works with every framework</Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
            {FRAMEWORKS.map((f) => (
              <Chip key={f} label={f} size="small" variant="outlined" sx={{ height: 22, fontSize: "0.7rem" }} />
            ))}
          </Box>
          <Typography variant="caption" sx={{ color: "text.disabled", mt: 1, display: "block" }}>
            Any agent that emits OpenTelemetry traces is supported. We identify agents by their behavior — tools, model, handoffs — not by how they label themselves.
          </Typography>
        </Box>
      </Box>
    );
  }

  function renderWaiting() {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>Waiting for your first trace…</Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", maxWidth: 560 }}>
            Run your agent once. We&apos;ll receive the trace, identify the agent from its tools, model, and handoffs, then make it ready to score — automatically. No one lifts a finger.
          </Typography>
        </Box>

        <Paper variant="outlined" sx={{ p: 3, borderRadius: 1.5 }}>
          <LinearProgress sx={{ borderRadius: 1, height: 6, mb: 3 }} />
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.75 }}>
            {INGEST_PIPELINE_STAGES.map((label, i) => {
              const done = traceReady || (traceStage >= 0 && i < traceStage);
              const active = !traceReady && i === traceStage;
              return (
                <Box key={label} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Box sx={{
                    width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
                    bgcolor: done ? "success.main" : active ? "primary.main" : "divider",
                    transition: "background-color 0.4s",
                  }} />
                  <Typography variant="body2" sx={{ color: (done || active) ? "text.primary" : "text.disabled", transition: "color 0.4s", flex: 1 }}>
                    {label}
                  </Typography>
                  {done && <CheckIcon />}
                </Box>
              );
            })}
          </Box>
          {traceStage === -1 && (
            <Typography variant="caption" sx={{ color: "text.disabled", mt: 2, display: "block" }}>
              Waiting for your first trace. This usually takes less than a minute after your agent runs.
            </Typography>
          )}
        </Paper>

        {traceReady && (
          <Alert severity="success" sx={{ borderRadius: 1.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.25 }}>Agent ready!</Typography>
            <Typography variant="caption">
              Your agent was recognized from its behavior and added to your fleet. Known agents are matched automatically — brand new ones are created on the spot.
            </Typography>
          </Alert>
        )}

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, alignItems: "center" }}>
          <Typography variant="caption" sx={{ color: "text.disabled", mr: 0.5 }}>Works with:</Typography>
          {FRAMEWORKS.map((f) => <Chip key={f} label={f} size="small" variant="outlined" sx={{ height: 20, fontSize: "0.65rem" }} />)}
        </Box>
      </Box>
    );
  }

  function renderEvalSuggestions() {
    if (evalsGenerating) {
      return <LoadingOverlay title="Building profile from your description…" stages={PIPELINE_STAGES} currentStage={evalsGenStage} />;
    }

    const enabledCount = detectedEvals.filter((e) => e.enabled).length;

    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.75 }}>
            <SparkleIcon />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              We recognized {detectedEvals.length} evals for your agent
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            AgentScore analyzed your traces and matched them to known behavioral patterns. Toggle any evals off before continuing.
          </Typography>
        </Box>

        {evalsBuiltFromDesc && (
          <Alert severity="success" sx={{ borderRadius: 1.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.25 }}>Profile rebuilt from your description</Typography>
            <Typography variant="caption">These evals were generated from what you told us and are tuned to your agent's specific purpose and risk areas.</Typography>
          </Alert>
        )}

        <Alert severity="info" sx={{ borderRadius: 1.5 }}>
          AgentScore will keep learning from your traces over time — as it sees more sessions, it will refine these evals and suggest new ones automatically.
        </Alert>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {detectedEvals.map((ev) => (
            <Paper
              key={ev.id}
              variant="outlined"
              sx={{
                p: 1.75,
                borderRadius: 1.5,
                borderColor: ev.enabled ? "primary.light" : "divider",
                bgcolor: ev.enabled ? "rgba(var(--mui-palette-primary-mainChannel) / 0.04)" : "background.paper",
                transition: "all 0.15s",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                <Switch
                  checked={ev.enabled}
                  onChange={() => setDetectedEvals((es) => es.map((e) => e.id === ev.id ? { ...e, enabled: !e.enabled } : e))}
                  size="small"
                  sx={{ mt: 0.25, flexShrink: 0 }}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{ev.name}</Typography>
                    <Chip label={ev.dimension} size="small" color="primary" variant="outlined" sx={{ height: 18, fontSize: "0.62rem" }} />
                    <Chip label={`${Math.round(ev.confidence * 100)}% match`} size="small" variant="outlined" sx={{ height: 18, fontSize: "0.62rem", color: "text.secondary" }} />
                  </Box>
                  <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 0.25 }}>{ev.description}</Typography>
                  <Typography variant="caption" sx={{ color: "text.disabled", display: "block", mt: 0.5 }}>Detected from {ev.detectedFrom}</Typography>
                </Box>
              </Box>
            </Paper>
          ))}
        </Box>

        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          {enabledCount} of {detectedEvals.length} evals selected
        </Typography>

        <Box sx={{ borderTop: "1px solid", borderColor: "divider", pt: 2 }}>
          <Button
            size="small"
            variant="text"
            sx={{ color: "text.secondary", textDecoration: "underline" }}
            onClick={() => setEvalsDescribeMode((v) => !v)}
          >
            {evalsDescribeMode ? "Hide" : "Evals don't look right? Describe your agent instead"}
          </Button>
          <Collapse in={evalsDescribeMode}>
            <Box sx={{ mt: 1.5, p: 2, border: 1, borderColor: "divider", borderRadius: 1.5, display: "flex", flexDirection: "column", gap: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Describe your agent</Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Tell us what your agent does, what it should never do, and what you're most worried about. AgentScore will build a custom eval profile from scratch.
              </Typography>
              <TextField
                fullWidth
                multiline
                minRows={4}
                placeholder="e.g. My agent reads customer support tickets and routes them to the right team. It should never miscategorize a billing issue as a technical issue. I'm most worried about it fabricating a resolution when the issue is still open."
                value={agentDescText}
                onChange={(e) => setAgentDescText(e.target.value)}
              />
              <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <Button
                  variant="contained"
                  disabled={agentDescText.trim().length === 0}
                  onClick={handleDescribeNewAgent}
                >
                  Build profile
                </Button>
              </Box>
            </Box>
          </Collapse>
        </Box>
      </Box>
    );
  }

  // ── Step renderers ──────────────────────────────────────────────────────────

  function renderStep0() {
    // Sub-state: connecting loading
    if (connecting) {
      return <LoadingOverlay title="Connecting to your trace store…" stages={CONNECT_STAGES} currentStage={connectStage} />;
    }

    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {/* Source selector */}
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Where are your traces?</Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 1 }}>
            {([
              { value: "langfuse", label: "Langfuse", sub: "LLM observability" },
              { value: "langsmith", label: "LangSmith", sub: "LangChain tracing" },
              { value: "datadog", label: "Datadog LLM Obs.", sub: "DD LLM observability" },
              { value: "database", label: "Database", sub: "ClickHouse or Postgres" },
            ] as { value: DataSource; label: string; sub: string }[]).map(({ value, label, sub }) => (
              <Paper
                key={value}
                variant="outlined"
                onClick={() => { setDataSource(value); setDiscoveredAgents([]); setSelectedTraceAgent(null); setInferredAgent(null); }}
                sx={{
                  p: 1.5,
                  cursor: "pointer",
                  borderRadius: 1.5,
                  borderColor: dataSource === value ? "primary.main" : "divider",
                  borderWidth: dataSource === value ? 2 : 1,
                  bgcolor: dataSource === value ? "rgba(var(--mui-palette-primary-mainChannel) / 0.06)" : "background.paper",
                  "&:hover": { borderColor: "primary.main", bgcolor: "action.hover" },
                  transition: "all 0.15s",
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{label}</Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>{sub}</Typography>
              </Paper>
            ))}
          </Box>
        </Box>

        {/* Credential fields */}
        {dataSource === "langfuse" && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Langfuse credentials</Typography>
            <Alert severity="info" sx={{ borderRadius: 1.5, py: 0.5 }}>
              Find your keys in <strong>Langfuse → Project Settings → API Keys</strong>. Each project has its own key pair — make sure you're using the keys for the project that contains your agent traces.
            </Alert>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 600, display: "block", mb: 0.5 }}>Secret Key <Box component="span" sx={{ color: "error.main" }}>*</Box></Typography>
              <TextField fullWidth size="small" type="password" placeholder="sk-lf-…" value={langfuseCreds.secretKey} onChange={(e) => setLangfuseCreds((c) => ({ ...c, secretKey: e.target.value }))} />
              <Typography variant="caption" sx={{ color: "text.disabled", mt: 0.5, display: "block" }}>Used for server-side API access. Never expose this in client-side code.</Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 600, display: "block", mb: 0.5 }}>Public Key <Box component="span" sx={{ color: "error.main" }}>*</Box></Typography>
              <TextField fullWidth size="small" placeholder="pk-lf-…" value={langfuseCreds.publicKey} onChange={(e) => setLangfuseCreds((c) => ({ ...c, publicKey: e.target.value }))} />
              <Typography variant="caption" sx={{ color: "text.disabled", mt: 0.5, display: "block" }}>Used together with the Secret Key to authenticate API requests.</Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 600, display: "block", mb: 0.5 }}>Base URL</Typography>
              <TextField fullWidth size="small" placeholder="https://cloud.langfuse.com" value={langfuseCreds.baseUrl} onChange={(e) => setLangfuseCreds((c) => ({ ...c, baseUrl: e.target.value }))} />
              <Typography variant="caption" sx={{ color: "text.disabled", mt: 0.5, display: "block" }}>Leave as default for Langfuse Cloud. Change to your host for self-hosted instances (e.g. <Box component="span" sx={{ fontFamily: "monospace" }}>https://langfuse.mycompany.com</Box>).</Typography>
            </Box>
          </Box>
        )}

        {dataSource === "langsmith" && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>LangSmith credentials</Typography>
            <Alert severity="info" sx={{ borderRadius: 1.5, py: 0.5 }}>
              Find your key in <strong>LangSmith → Settings → API Keys</strong>. Keys are scoped to your organization — any key with read access to your tracing project will work.
            </Alert>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 600, display: "block", mb: 0.5 }}>API Key <Box component="span" sx={{ color: "error.main" }}>*</Box></Typography>
              <TextField fullWidth size="small" type="password" placeholder="ls__…" value={langsmithCreds.apiKey} onChange={(e) => setLangsmithCreds({ apiKey: e.target.value })} />
              <Typography variant="caption" sx={{ color: "text.disabled", mt: 0.5, display: "block" }}>Used to authenticate read access to your LangSmith traces. Never share this key.</Typography>
            </Box>
          </Box>
        )}

        {dataSource === "datadog" && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Datadog credentials</Typography>
            <Alert severity="info" sx={{ borderRadius: 1.5, py: 0.5 }}>
              Both keys are required. Find them in <strong>Datadog → Organization Settings</strong> under <strong>API Keys</strong> and <strong>Application Keys</strong>. The application key determines what data the API key can access — ensure it has LLM Observability read permissions.
            </Alert>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 600, display: "block", mb: 0.5 }}>DD API Key <Box component="span" sx={{ color: "error.main" }}>*</Box></Typography>
              <TextField fullWidth size="small" type="password" placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" value={datadogCreds.apiKey} onChange={(e) => setDatadogCreds((c) => ({ ...c, apiKey: e.target.value }))} />
              <Typography variant="caption" sx={{ color: "text.disabled", mt: 0.5, display: "block" }}>Identifies your Datadog organization. Found under <Box component="span" sx={{ fontFamily: "monospace" }}>Organization Settings → API Keys</Box>.</Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 600, display: "block", mb: 0.5 }}>DD Application Key <Box component="span" sx={{ color: "error.main" }}>*</Box></Typography>
              <TextField fullWidth size="small" type="password" placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" value={datadogCreds.appKey} onChange={(e) => setDatadogCreds((c) => ({ ...c, appKey: e.target.value }))} />
              <Typography variant="caption" sx={{ color: "text.disabled", mt: 0.5, display: "block" }}>Scopes what the API key can access. Found under <Box component="span" sx={{ fontFamily: "monospace" }}>Organization Settings → Application Keys</Box>.</Typography>
            </Box>
          </Box>
        )}

        {dataSource === "database" && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Database engine</Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
                {([
                  { value: "clickhouse", label: "ClickHouse", sub: "Cloud or self-hosted" },
                  { value: "postgres", label: "PostgreSQL", sub: "Self-hosted or managed" },
                ] as { value: DatabaseType; label: string; sub: string }[]).map(({ value, label, sub }) => (
                  <Paper
                    key={value}
                    variant="outlined"
                    onClick={() => setDbType(value)}
                    sx={{
                      p: 1.5,
                      cursor: "pointer",
                      borderRadius: 1.5,
                      borderColor: dbType === value ? "primary.main" : "divider",
                      borderWidth: dbType === value ? 2 : 1,
                      bgcolor: dbType === value ? "rgba(var(--mui-palette-primary-mainChannel) / 0.06)" : "background.paper",
                      "&:hover": { borderColor: "primary.main", bgcolor: "action.hover" },
                      transition: "all 0.15s",
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{label}</Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>{sub}</Typography>
                  </Paper>
                ))}
              </Box>
            </Box>

            {dbType === "clickhouse" && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>ClickHouse credentials</Typography>
                <Alert severity="info" sx={{ borderRadius: 1.5, py: 0.5 }}>
                  AgentScore connects over the native HTTP interface (port 8443 for HTTPS). Create a read-only user scoped to your traces table, or use your existing credentials if connecting to a dev instance.
                </Alert>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 1.5, alignItems: "start" }}>
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, display: "block", mb: 0.5 }}>Host <Box component="span" sx={{ color: "error.main" }}>*</Box></Typography>
                    <TextField fullWidth size="small" placeholder="abc123.us-east-1.aws.clickhouse.cloud" value={clickhouseCreds.host} onChange={(e) => setClickhouseCreds((c) => ({ ...c, host: e.target.value }))} />
                    <Typography variant="caption" sx={{ color: "text.disabled", mt: 0.5, display: "block" }}>Hostname only — no protocol or trailing slash.</Typography>
                  </Box>
                  <Box sx={{ width: 90 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, display: "block", mb: 0.5 }}>Port</Typography>
                    <TextField fullWidth size="small" value={clickhouseCreds.port} onChange={(e) => setClickhouseCreds((c) => ({ ...c, port: e.target.value }))} />
                  </Box>
                </Box>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, display: "block", mb: 0.5 }}>Username</Typography>
                    <TextField fullWidth size="small" placeholder="default" value={clickhouseCreds.username} onChange={(e) => setClickhouseCreds((c) => ({ ...c, username: e.target.value }))} />
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, display: "block", mb: 0.5 }}>Password <Box component="span" sx={{ color: "error.main" }}>*</Box></Typography>
                    <TextField fullWidth size="small" type="password" placeholder="••••••••" value={clickhouseCreds.password} onChange={(e) => setClickhouseCreds((c) => ({ ...c, password: e.target.value }))} />
                  </Box>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 600, display: "block", mb: 0.5 }}>Database</Typography>
                  <TextField fullWidth size="small" placeholder="default" value={clickhouseCreds.database} onChange={(e) => setClickhouseCreds((c) => ({ ...c, database: e.target.value }))} />
                  <Typography variant="caption" sx={{ color: "text.disabled", mt: 0.5, display: "block" }}>The database containing your traces table. Leave as <Box component="span" sx={{ fontFamily: "monospace" }}>default</Box> if unsure.</Typography>
                </Box>
              </Box>
            )}

            {dbType === "postgres" && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>PostgreSQL credentials</Typography>
                <Alert severity="info" sx={{ borderRadius: 1.5, py: 0.5 }}>
                  AgentScore connects over the standard PostgreSQL wire protocol. Use a read-only role scoped to your traces schema. SSL is required by default — disable only on local dev instances.
                </Alert>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 1.5, alignItems: "start" }}>
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, display: "block", mb: 0.5 }}>Host <Box component="span" sx={{ color: "error.main" }}>*</Box></Typography>
                    <TextField fullWidth size="small" placeholder="db.mycompany.com" value={postgresCreds.host} onChange={(e) => setPostgresCreds((c) => ({ ...c, host: e.target.value }))} />
                  </Box>
                  <Box sx={{ width: 90 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, display: "block", mb: 0.5 }}>Port</Typography>
                    <TextField fullWidth size="small" value={postgresCreds.port} onChange={(e) => setPostgresCreds((c) => ({ ...c, port: e.target.value }))} />
                  </Box>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 600, display: "block", mb: 0.5 }}>Database <Box component="span" sx={{ color: "error.main" }}>*</Box></Typography>
                  <TextField fullWidth size="small" placeholder="traces" value={postgresCreds.database} onChange={(e) => setPostgresCreds((c) => ({ ...c, database: e.target.value }))} />
                </Box>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, display: "block", mb: 0.5 }}>Username <Box component="span" sx={{ color: "error.main" }}>*</Box></Typography>
                    <TextField fullWidth size="small" placeholder="agentscore_reader" value={postgresCreds.username} onChange={(e) => setPostgresCreds((c) => ({ ...c, username: e.target.value }))} />
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, display: "block", mb: 0.5 }}>Password <Box component="span" sx={{ color: "error.main" }}>*</Box></Typography>
                    <TextField fullWidth size="small" type="password" placeholder="••••••••" value={postgresCreds.password} onChange={(e) => setPostgresCreds((c) => ({ ...c, password: e.target.value }))} />
                  </Box>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 600, display: "block", mb: 0.5 }}>SSL mode</Typography>
                  <TextField
                    fullWidth
                    size="small"
                    select
                    value={postgresCreds.sslMode}
                    onChange={(e) => setPostgresCreds((c) => ({ ...c, sslMode: e.target.value }))}
                    SelectProps={{ native: true }}
                  >
                    <option value="require">require</option>
                    <option value="verify-full">verify-full</option>
                    <option value="verify-ca">verify-ca</option>
                    <option value="prefer">prefer</option>
                    <option value="disable">disable</option>
                  </TextField>
                  <Typography variant="caption" sx={{ color: "text.disabled", mt: 0.5, display: "block" }}><Box component="span" sx={{ fontFamily: "monospace" }}>require</Box> enforces TLS without certificate verification. Use <Box component="span" sx={{ fontFamily: "monospace" }}>verify-full</Box> in production.</Typography>
                </Box>
              </Box>
            )}
          </Box>
        )}

        {/* Connect button */}
        <Box>
          <Button variant="contained" onClick={runConnect} disabled={!connectCredsValid}>
            Connect & discover agents
          </Button>
        </Box>

        {/* Agent list — shown once discovered */}
        {discoveredAgents.length > 0 && (
          <>
            <Divider />
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                {discoveredAgents.length} agents found
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 1.5 }}>
                Select an agent to start monitoring.
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {discoveredAgents.map((agent) => (
                  <Paper
                    key={agent.id}
                    variant="outlined"
                    onClick={() => handleAgentSelect(agent)}
                    sx={{
                      p: 1.5,
                      borderRadius: 1.5,
                      cursor: "pointer",
                      borderColor: selectedTraceAgent?.id === agent.id ? "primary.main" : "divider",
                      bgcolor: selectedTraceAgent?.id === agent.id ? "rgba(var(--mui-palette-primary-mainChannel) / 0.06)" : "background.paper",
                      "&:hover": { borderColor: "primary.main", bgcolor: "action.hover" },
                      transition: "all 0.15s",
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                    }}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: "monospace" }}>{agent.traceName}</Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        {agent.sessionCount.toLocaleString()} sessions · last seen {agent.lastSeen}
                      </Typography>
                    </Box>
                    {selectedTraceAgent?.id === agent.id && <CheckIcon />}
                  </Paper>
                ))}
              </Box>
            </Box>

            {/* Inline analysis loading + inferred result */}
            {analyzing && (
              <Box sx={{ py: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
                  <LinearProgress sx={{ flex: 1, borderRadius: 1, height: 4 }} />
                  <Typography variant="caption" sx={{ color: "text.secondary", flexShrink: 0 }}>Loading traces…</Typography>
                </Box>
                {ANALYZE_STAGES.map((label, i) => (
                  <Box key={label} sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5, opacity: i <= analyzeStage ? 1 : 0.3, transition: "opacity 0.3s" }}>
                    <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: i < analyzeStage ? "success.main" : i === analyzeStage ? "primary.main" : "divider", flexShrink: 0 }} />
                    <Typography variant="caption" sx={{ color: i <= analyzeStage ? "text.primary" : "text.disabled" }}>{label}</Typography>
                  </Box>
                ))}
              </Box>
            )}

            {inferredAgent && !analyzing && (
              <>
                <Divider />
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>Inferred agent details</Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      The following was inferred from your traces. Review and adjust before continuing.
                    </Typography>
                  </Box>

                  {/* Inferred info card */}
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5 }}>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Chip icon={<SparkleIcon />} label="LLM inferred" size="small" color="primary" variant="outlined" sx={{ height: 20, fontSize: "0.62rem" }} />
                        <Typography variant="caption" sx={{ color: "text.disabled", fontFamily: "monospace" }}>{inferredAgent.traceName}</Typography>
                      </Box>
                      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                        <TypeTag type={inferredAgent.agentType} />
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>agent type</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: "text.disabled", textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 0.5 }}>Description</Typography>
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>{inferredAgent.description}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: "text.disabled", textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 0.75 }}>Relevant metrics</Typography>
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                          {inferredAgent.inferredMetrics.map((m) => (
                            <Chip key={m} label={m} size="small" variant="outlined" sx={{ height: 22, fontSize: "0.68rem" }} />
                          ))}
                        </Box>
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: "text.disabled", textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 0.75 }}>Suggested dimensions</Typography>
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                          {inferredAgent.relevantDimensions.map((d) => (
                            <Chip key={d} label={d} size="small" color="primary" sx={{ height: 22, fontSize: "0.68rem" }} />
                          ))}
                        </Box>
                      </Box>
                    </Box>
                  </Paper>

                  {/* Friendly name */}
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>Friendly name</Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 1 }}>
                      This is how the agent will appear in AgentScore. The original trace name (<Box component="span" sx={{ fontFamily: "monospace" }}>{inferredAgent.traceName}</Box>) is preserved alongside it.
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      value={friendlyName}
                      onChange={(e) => setFriendlyName(e.target.value)}
                      placeholder={inferredAgent.suggestedFriendlyName}
                    />
                  </Box>

                  {/* Profile choice */}
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>How should we build the scoring profile?</Typography>
                    <Box sx={{ display: "flex", gap: 1.5 }}>
                      <Paper
                        variant="outlined"
                        onClick={() => setProfileChoice("suggest")}
                        sx={{ p: 2, borderRadius: 1.5, cursor: "pointer", flex: 1, borderColor: profileChoice === "suggest" ? "primary.main" : "divider", bgcolor: profileChoice === "suggest" ? "rgba(var(--mui-palette-primary-mainChannel) / 0.06)" : "background.paper", "&:hover": { borderColor: "primary.main" }, transition: "all 0.15s" }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.5 }}>
                          <SparkleIcon />
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>Suggest an existing profile</Typography>
                        </Box>
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                          Match your agent to an existing eval profile based on its type and use cases.
                        </Typography>
                      </Paper>
                      <Paper
                        variant="outlined"
                        onClick={() => setProfileChoice("generate")}
                        sx={{ p: 2, borderRadius: 1.5, cursor: "pointer", flex: 1, borderColor: profileChoice === "generate" ? "primary.main" : "divider", borderStyle: profileChoice === "generate" ? "solid" : "dashed", bgcolor: profileChoice === "generate" ? "rgba(var(--mui-palette-primary-mainChannel) / 0.06)" : "transparent", "&:hover": { borderColor: "primary.main" }, transition: "all 0.15s" }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>Generate a custom profile</Typography>
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                          Build a tailored eval profile from your agent's inferred use cases and patterns.
                        </Typography>
                      </Paper>
                    </Box>
                  </Box>
                </Box>
              </>
            )}
          </>
        )}
      </Box>
    );
  }

  function renderStep1() {
    // Inline generation progress at top of profile step
    const byDimension = new Map<ShowcaseCategory, ProfileEntry[]>();
    if (profileVersion) {
      for (const entry of profileVersion.entries) {
        if (!byDimension.has(entry.dimension)) byDimension.set(entry.dimension, []);
        byDimension.get(entry.dimension)!.push(entry);
      }
    }
    const enabledCount = profileVersion?.entries.filter((e) => e.enabled).length ?? 0;
    const sortedProfiles = [...PROFILES].sort((a, b) => (a.agentType === basics.type ? 0 : 1) - (b.agentType === basics.type ? 0 : 1));

    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {/* Profile picker */}
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
            {sortedProfiles.some((p) => p.agentType === basics.type) ? "Suggested profile" : "Select a profile"}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 1.25 }}>
            Choose an existing profile to start from, or generate one from your agent's description.
          </Typography>
          <Box sx={{ display: "flex", gap: 1.5, overflowX: "auto", pb: 1.5, pt: 1 }}>
            {sortedProfiles.map((p) => (
              <ProfilePickerCard key={p.id} profile={p} isSelected={selectedProfileId === p.id} isRecommended={p.agentType === basics.type} onClick={() => handleSelectProfile(p.id)} />
            ))}
            <GeneratePickerCard isSelected={selectedProfileId === "generate"} onClick={() => handleSelectProfile("generate")} />
          </Box>
        </Box>

        {/* Generation progress */}
        {isGenerating && (
          <Box sx={{ py: 2, display: "flex", flexDirection: "column", gap: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
              <LinearProgress sx={{ flex: 1, borderRadius: 1, height: 4 }} />
              <Typography variant="caption" sx={{ color: "text.secondary", flexShrink: 0 }}>Generating…</Typography>
            </Box>
            {PIPELINE_STAGES.map((label, i) => (
              <Box key={label} sx={{ display: "flex", alignItems: "center", gap: 1.5, opacity: i <= pipelineStage ? 1 : 0.3, transition: "opacity 0.3s" }}>
                <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: i < pipelineStage ? "success.main" : i === pipelineStage ? "primary.main" : "divider", flexShrink: 0 }} />
                <Typography variant="caption" sx={{ color: i <= pipelineStage ? "text.primary" : "text.disabled" }}>{label}</Typography>
              </Box>
            ))}
          </Box>
        )}

        {/* Profile config */}
        {profileVersion && !isGenerating && (
          <>
            <Divider />
            <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {enabledCount} of {profileVersion.entries.length} evals enabled across {byDimension.size} dimensions
              </Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button size="small" variant="text" onClick={() => setProfileVersion((pv) => pv ? { ...pv, entries: pv.entries.map((e) => ({ ...e, enabled: true })) } : pv)}>Enable all</Button>
                <Button size="small" variant="text" onClick={() => setProfileVersion((pv) => pv ? { ...pv, entries: pv.entries.map((e) => ({ ...e, enabled: false })) } : pv)}>Disable all</Button>
              </Box>
            </Box>

            {[...byDimension.entries()].map(([dim, entries]) => (
              <DimensionSection key={dim} dimension={dim} entries={entries} weight={profileVersion.dimensionWeights[dim] ?? 1.0} mode={mode} onWeightChange={(v) => updateDimensionWeight(dim, v)} onEntryToggle={(id) => updateEntry(id, { enabled: !profileVersion.entries.find((e) => e.id === id)?.enabled })} onEntryThreshold={(id, v) => updateEntry(id, { threshold: v })} onEntryWeight={(id, v) => updateEntry(id, { weight: v })} />
            ))}

            <Box sx={{ mt: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.75 }}>Verdict bands</Typography>
              <Paper variant="outlined" sx={{ borderRadius: 1.5, overflow: "hidden" }}>
                {VERDICT_BAND_CONFIG.map(({ key, label, color }, i) => (
                  <Box key={key} sx={{ display: "flex", alignItems: "center", gap: 2, px: 2, py: 1, borderBottom: i < VERDICT_BAND_CONFIG.length - 1 ? "1px solid" : "none", borderColor: "divider" }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color, width: 120, flexShrink: 0 }}>{label}</Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary", flex: 1 }}>score ≥</Typography>
                    <TextField size="small" type="number" value={profileVersion.verdictBands[key]} onChange={(e) => { const v = parseInt(e.target.value); if (!isNaN(v) && v >= 0 && v <= 100) updateVerdictBand(key, v); }} slotProps={{ htmlInput: { min: 0, max: 100, step: 5, style: { textAlign: "center", padding: "4px 8px", width: 64 } } }} sx={{ "& .MuiOutlinedInput-root": { fontSize: "0.85rem" } }} />
                  </Box>
                ))}
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, px: 2, py: 1, bgcolor: "rgba(var(--mui-palette-error-mainChannel) / 0.06)" }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: "error.dark", width: 120, flexShrink: 0 }}>Block</Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>score &lt; {profileVersion.verdictBands.block_rec} (automatic)</Typography>
                </Box>
              </Paper>
            </Box>

            {/* "Not quite right" describe override */}
            <Box sx={{ mt: 1 }}>
              <Button
                size="small"
                variant="text"
                sx={{ color: "text.secondary", textDecoration: "underline" }}
                onClick={() => setDescribeOverride((v) => !v)}
              >
                {describeOverride ? "Hide" : "Profile not quite right? Describe your agent instead"}
              </Button>
              <Collapse in={describeOverride}>
                <Box sx={{ mt: 1.5, p: 2, border: 1, borderColor: "divider", borderRadius: 1.5, display: "flex", flexDirection: "column", gap: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Describe your agent</Typography>
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      {(["guided", "expert"] as Mode[]).map((m) => (
                        <Button key={m} size="small" variant={mode === m ? "contained" : "outlined"} onClick={() => setMode(m)} sx={{ textTransform: "capitalize", minWidth: 72 }}>{m}</Button>
                      ))}
                    </Box>
                  </Box>
                  {mode === "guided" ? (
                    <>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>What does {basics.name || "your agent"} do?</Typography>
                        <TextField fullWidth multiline minRows={2} placeholder="e.g. It reads test logs and diagnoses whether failures are flaky or genuinely broken." value={guided.purpose} onChange={(e) => setGuided((g) => ({ ...g, purpose: e.target.value }))} />
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>What should it never do?</Typography>
                        <TextField fullWidth multiline minRows={2} placeholder="e.g. It should never blame the wrong component or fabricate a root cause." value={guided.failures} onChange={(e) => setGuided((g) => ({ ...g, failures: e.target.value }))} />
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>What are you most worried about?</Typography>
                        <TextField fullWidth multiline minRows={2} placeholder="e.g. Confident wrong answers when the problem is somewhere unexpected." value={guided.concerns} onChange={(e) => setGuided((g) => ({ ...g, concerns: e.target.value }))} />
                      </Box>
                    </>
                  ) : (
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>Agent spec (YAML)</Typography>
                      <TextField fullWidth multiline minRows={12} placeholder={EXPERT_PLACEHOLDER} value={expertSpec} onChange={(e) => setExpertSpec(e.target.value)} slotProps={{ htmlInput: { style: { fontFamily: "monospace", fontSize: "0.82rem" } } }} />
                    </Box>
                  )}
                  <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                    <Button
                      variant="contained"
                      onClick={handleDescribeRegenerate}
                      disabled={mode === "guided" ? guided.purpose.trim().length === 0 : expertSpec.trim().length === 0}
                    >
                      Regenerate profile
                    </Button>
                  </Box>
                </Box>
              </Collapse>
            </Box>
          </>
        )}
      </Box>
    );
  }

  function renderStepJudge() {
    const reason = judgeAutoReason(basics.type);
    const autoJudgeId = autoSelectJudgeId(basics.type);
    const selectedJudge = LLM_JUDGES.find((j) => j.id === selectedJudgeId) ?? LLM_JUDGES[0];

    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <Alert severity="info" sx={{ borderRadius: 1.5 }}>
          AgentScore analyzed your agent&apos;s traces and inferred the best judge for evaluating it. You can override this selection at any time.
        </Alert>

        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 1.5, border: "1px solid", borderColor: "primary.light", bgcolor: "rgba(var(--mui-palette-primary-mainChannel) / 0.03)" }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>Why this judge?</Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 1.5 }}>{reason}</Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="caption" sx={{ color: "text.disabled" }}>Inferred from agent type:</Typography>
            <TypeTag type={basics.type} />
          </Box>
        </Paper>

        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>Select judge</Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {LLM_JUDGES.map((judge) => (
              <JudgeCard
                key={judge.id}
                judge={judge}
                selected={selectedJudge.id === judge.id}
                onSelect={() => setSelectedJudgeId(judge.id)}
                autoJudgeId={autoJudgeId}
              />
            ))}
          </Box>
          <Button
            variant="text"
            size="small"
            sx={{ mt: 1.5, color: "text.secondary" }}
            onClick={() => navigate({ name: "add-judge" })}
          >
            + Configure a new judge
          </Button>
        </Box>
      </Box>
    );
  }

  function renderNewAgentLaunch() {
    if (evalsGenerating) {
      return <LoadingOverlay title="Rebuilding evals from your description…" stages={PIPELINE_STAGES} currentStage={evalsGenStage} />;
    }

    const enabledEvalsCount = detectedEvals.filter((e) => e.enabled).length;
    const byDimension = new Map<ShowcaseCategory, ProfileEntry[]>();
    if (profileVersion) {
      for (const entry of profileVersion.entries) {
        if (!byDimension.has(entry.dimension)) byDimension.set(entry.dimension, []);
        byDimension.get(entry.dimension)!.push(entry);
      }
    }
    const enabledCount = profileVersion?.entries.filter((e) => e.enabled).length ?? 0;
    const sortedProfiles = [...PROFILES].sort((a, b) => (a.agentType === basics.type ? 0 : 1) - (b.agentType === basics.type ? 0 : 1));
    const autoJudgeId = autoSelectJudgeId(basics.type);
    const selectedJudge = LLM_JUDGES.find((j) => j.id === selectedJudgeId) ?? LLM_JUDGES[0];
    const judgeReason = judgeAutoReason(basics.type);

    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {/* Header */}
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.75 }}>
            <SparkleIcon />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Ready to launch</Typography>
          </Box>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            AgentScore analyzed your traces and auto-selected evals, a profile, a judge, and test cases. Review and adjust anything before launching.
          </Typography>
        </Box>

        {/* Learning banner */}
        <Alert
          severity="info"
          sx={{ borderRadius: 1.5 }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.25 }}>Starts configured, keeps improving</Typography>
          <Typography variant="body2">
            The evals, scoring profile, and judge below are based on your first traces. As more sessions arrive, AgentScore will refine coverage, rebalance weights, and sharpen judge selection automatically - no manual reconfiguration needed.
          </Typography>
        </Alert>

        {/* Agent identity */}
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 1.5, borderColor: "primary.light", bgcolor: "rgba(var(--mui-palette-primary-mainChannel) / 0.03)" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
            <Chip icon={<SparkleIcon />} label="Detected from traces" size="small" color="primary" variant="outlined" sx={{ height: 20, fontSize: "0.62rem" }} />
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: "text.disabled", textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 0.5 }}>Trace name</Typography>
              <Typography variant="body2" sx={{ fontFamily: "monospace", color: "text.primary" }}>{detectedTraceName}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: "text.disabled", textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 0.5 }}>Inferred purpose</Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>{inferredAgentDesc}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: "text.disabled", textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 0.5 }}>Friendly name <Box component="span" sx={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</Box></Typography>
              <TextField
                size="small"
                placeholder={basics.name}
                value={newAgentFriendlyName}
                onChange={(e) => {
                  setNewAgentFriendlyName(e.target.value);
                  const defaultName = detectedTraceName.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
                  setBasics((b) => ({ ...b, name: e.target.value.trim() || defaultName }));
                }}
                sx={{ width: 320 }}
                slotProps={{ htmlInput: { maxLength: 80 } }}
              />
              <Typography variant="caption" sx={{ color: "text.disabled", display: "block", mt: 0.5 }}>
                How this agent appears in AgentScore. Defaults to the trace name if left blank.
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* 1. Evals */}
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Evals</Typography>
              <Chip icon={<SparkleIcon />} label="Auto-detected" size="small" color="primary" variant="outlined" sx={{ height: 20, fontSize: "0.62rem" }} />
            </Box>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>{enabledEvalsCount} of {detectedEvals.length} selected</Typography>
          </Box>

          {evalsBuiltFromDesc && (
            <Alert severity="success" sx={{ borderRadius: 1.5, mb: 1.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.25 }}>Rebuilt from your description</Typography>
              <Typography variant="caption">Evals are tuned to your agent's specific purpose and risk areas.</Typography>
            </Alert>
          )}

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {detectedEvals.map((ev) => (
              <Paper key={ev.id} variant="outlined" sx={{ p: 1.75, borderRadius: 1.5, borderColor: ev.enabled ? "primary.light" : "divider", bgcolor: ev.enabled ? "rgba(var(--mui-palette-primary-mainChannel) / 0.04)" : "background.paper", transition: "all 0.15s" }}>
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                  <Switch checked={ev.enabled} onChange={() => setDetectedEvals((es) => es.map((e) => e.id === ev.id ? { ...e, enabled: !e.enabled } : e))} size="small" sx={{ mt: 0.25, flexShrink: 0 }} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{ev.name}</Typography>
                      <Chip label={ev.dimension} size="small" color="primary" variant="outlined" sx={{ height: 18, fontSize: "0.62rem" }} />
                      <Chip label={`${Math.round(ev.confidence * 100)}% match`} size="small" variant="outlined" sx={{ height: 18, fontSize: "0.62rem", color: "text.secondary" }} />
                    </Box>
                    <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 0.25 }}>{ev.description}</Typography>
                    <Typography variant="caption" sx={{ color: "text.disabled", display: "block", mt: 0.5 }}>Detected from {ev.detectedFrom}</Typography>
                  </Box>
                </Box>
              </Paper>
            ))}
          </Box>

          <Box sx={{ mt: 2 }}>
            <Button size="small" variant="text" sx={{ color: "text.secondary", textDecoration: "underline" }} onClick={() => setEvalsDescribeMode((v) => !v)}>
              {evalsDescribeMode ? "Hide" : "Evals don't look right? Describe your agent instead"}
            </Button>
            <Collapse in={evalsDescribeMode}>
              <Box sx={{ mt: 1.5, p: 2, border: 1, borderColor: "divider", borderRadius: 1.5, display: "flex", flexDirection: "column", gap: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Describe your agent</Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Tell us what your agent does, what it should never do, and what you're most worried about. AgentScore will rebuild the evals from scratch.
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  minRows={4}
                  placeholder="e.g. My agent reads customer support tickets and routes them to the right team. It should never miscategorize a billing issue as a technical issue. I'm most worried about it fabricating a resolution when the issue is still open."
                  value={agentDescText}
                  onChange={(e) => setAgentDescText(e.target.value)}
                />
                <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                  <Button variant="contained" disabled={agentDescText.trim().length === 0} onClick={handleDescribeNewAgent}>
                    Rebuild evals
                  </Button>
                </Box>
              </Box>
            </Collapse>
          </Box>
        </Box>

        <Divider />

        {/* 2. Scoring Profile */}
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Scoring Profile</Typography>
            <Chip icon={<SparkleIcon />} label="Auto-generated" size="small" color="primary" variant="outlined" sx={{ height: 20, fontSize: "0.62rem" }} />
          </Box>
          <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 1.5 }}>
            Built from your detected evals. Choose an existing profile or regenerate from a description.
          </Typography>

          <Box sx={{ display: "flex", gap: 1.5, overflowX: "auto", pb: 1.5, pt: 1 }}>
            {sortedProfiles.map((p) => (
              <ProfilePickerCard key={p.id} profile={p} isSelected={selectedProfileId === p.id} isRecommended={p.agentType === basics.type} onClick={() => handleSelectProfile(p.id)} />
            ))}
            <GeneratePickerCard isSelected={selectedProfileId === "generate"} onClick={() => handleSelectProfile("generate")} />
          </Box>

          {isGenerating && (
            <Box sx={{ py: 2, display: "flex", flexDirection: "column", gap: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
                <LinearProgress sx={{ flex: 1, borderRadius: 1, height: 4 }} />
                <Typography variant="caption" sx={{ color: "text.secondary", flexShrink: 0 }}>Generating…</Typography>
              </Box>
              {PIPELINE_STAGES.map((label, i) => (
                <Box key={label} sx={{ display: "flex", alignItems: "center", gap: 1.5, opacity: i <= pipelineStage ? 1 : 0.3, transition: "opacity 0.3s" }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: i < pipelineStage ? "success.main" : i === pipelineStage ? "primary.main" : "divider", flexShrink: 0 }} />
                  <Typography variant="caption" sx={{ color: i <= pipelineStage ? "text.primary" : "text.disabled" }}>{label}</Typography>
                </Box>
              ))}
            </Box>
          )}

          {profileVersion && !isGenerating && (
            <>
              <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  {enabledCount} of {profileVersion.entries.length} evals enabled across {byDimension.size} dimensions
                </Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button size="small" variant="text" onClick={() => setProfileVersion((pv) => pv ? { ...pv, entries: pv.entries.map((e) => ({ ...e, enabled: true })) } : pv)}>Enable all</Button>
                  <Button size="small" variant="text" onClick={() => setProfileVersion((pv) => pv ? { ...pv, entries: pv.entries.map((e) => ({ ...e, enabled: false })) } : pv)}>Disable all</Button>
                </Box>
              </Box>
              {[...byDimension.entries()].map(([dim, entries]) => (
                <DimensionSection key={dim} dimension={dim} entries={entries} weight={profileVersion.dimensionWeights[dim] ?? 1.0} mode={mode} onWeightChange={(v) => updateDimensionWeight(dim, v)} onEntryToggle={(id) => updateEntry(id, { enabled: !profileVersion.entries.find((e) => e.id === id)?.enabled })} onEntryThreshold={(id, v) => updateEntry(id, { threshold: v })} onEntryWeight={(id, v) => updateEntry(id, { weight: v })} />
              ))}

              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.75 }}>Verdict bands</Typography>
                <Paper variant="outlined" sx={{ borderRadius: 1.5, overflow: "hidden" }}>
                  {VERDICT_BAND_CONFIG.map(({ key, label, color }, i) => (
                    <Box key={key} sx={{ display: "flex", alignItems: "center", gap: 2, px: 2, py: 1, borderBottom: i < VERDICT_BAND_CONFIG.length - 1 ? "1px solid" : "none", borderColor: "divider" }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color, width: 120, flexShrink: 0 }}>{label}</Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary", flex: 1 }}>score ≥</Typography>
                      <TextField size="small" type="number" value={profileVersion.verdictBands[key]} onChange={(e) => { const v = parseInt(e.target.value); if (!isNaN(v) && v >= 0 && v <= 100) updateVerdictBand(key, v); }} slotProps={{ htmlInput: { min: 0, max: 100, step: 5, style: { textAlign: "center", padding: "4px 8px", width: 64 } } }} sx={{ "& .MuiOutlinedInput-root": { fontSize: "0.85rem" } }} />
                    </Box>
                  ))}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, px: 2, py: 1, bgcolor: "rgba(var(--mui-palette-error-mainChannel) / 0.06)" }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: "error.dark", width: 120, flexShrink: 0 }}>Block</Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>score {"<"} {profileVersion.verdictBands.block_rec} (automatic)</Typography>
                  </Box>
                </Paper>
              </Box>

              <Box sx={{ mt: 1 }}>
                <Button size="small" variant="text" sx={{ color: "text.secondary", textDecoration: "underline" }} onClick={() => setDescribeOverride((v) => !v)}>
                  {describeOverride ? "Hide" : "Profile not quite right? Describe your agent to regenerate"}
                </Button>
                <Collapse in={describeOverride}>
                  <Box sx={{ mt: 1.5, p: 2, border: 1, borderColor: "divider", borderRadius: 1.5, display: "flex", flexDirection: "column", gap: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Describe your agent</Typography>
                      <Box sx={{ display: "flex", gap: 0.5 }}>
                        {(["guided", "expert"] as Mode[]).map((m) => (
                          <Button key={m} size="small" variant={mode === m ? "contained" : "outlined"} onClick={() => setMode(m)} sx={{ textTransform: "capitalize", minWidth: 72 }}>{m}</Button>
                        ))}
                      </Box>
                    </Box>
                    {mode === "guided" ? (
                      <>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>What does {basics.name || "your agent"} do?</Typography>
                          <TextField fullWidth multiline minRows={2} placeholder="e.g. It reads test logs and diagnoses whether failures are flaky or genuinely broken." value={guided.purpose} onChange={(e) => setGuided((g) => ({ ...g, purpose: e.target.value }))} />
                        </Box>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>What should it never do?</Typography>
                          <TextField fullWidth multiline minRows={2} placeholder="e.g. It should never blame the wrong component or fabricate a root cause." value={guided.failures} onChange={(e) => setGuided((g) => ({ ...g, failures: e.target.value }))} />
                        </Box>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>What are you most worried about?</Typography>
                          <TextField fullWidth multiline minRows={2} placeholder="e.g. Confident wrong answers when the problem is somewhere unexpected." value={guided.concerns} onChange={(e) => setGuided((g) => ({ ...g, concerns: e.target.value }))} />
                        </Box>
                      </>
                    ) : (
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>Agent spec (YAML)</Typography>
                        <TextField fullWidth multiline minRows={12} placeholder={EXPERT_PLACEHOLDER} value={expertSpec} onChange={(e) => setExpertSpec(e.target.value)} slotProps={{ htmlInput: { style: { fontFamily: "monospace", fontSize: "0.82rem" } } }} />
                      </Box>
                    )}
                    <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                      <Button variant="contained" onClick={handleDescribeRegenerate} disabled={mode === "guided" ? guided.purpose.trim().length === 0 : expertSpec.trim().length === 0}>
                        Regenerate profile
                      </Button>
                    </Box>
                  </Box>
                </Collapse>
              </Box>
            </>
          )}
        </Box>

        <Divider />

        {/* 3. LLM Judge */}
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>LLM Judge</Typography>
            <Chip icon={<SparkleIcon />} label="Auto-selected" size="small" color="primary" variant="outlined" sx={{ height: 20, fontSize: "0.62rem" }} />
          </Box>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5, border: "1px solid", borderColor: "primary.light", bgcolor: "rgba(var(--mui-palette-primary-mainChannel) / 0.03)", mb: 2 }}>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>{judgeReason}</Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
              <Typography variant="caption" sx={{ color: "text.disabled" }}>Inferred from agent type:</Typography>
              <TypeTag type={basics.type} />
            </Box>
          </Paper>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {LLM_JUDGES.map((judge) => (
              <JudgeCard key={judge.id} judge={judge} selected={selectedJudge.id === judge.id} onSelect={() => setSelectedJudgeId(judge.id)} autoJudgeId={autoJudgeId} />
            ))}
          </Box>
          <Button variant="text" size="small" sx={{ mt: 1.5, color: "text.secondary" }} onClick={() => navigate({ name: "add-judge" })}>
            + Configure a new judge
          </Button>
        </Box>

        <Divider />

        {/* 4. Test Cases */}
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Test Cases</Typography>
              <Chip icon={<SparkleIcon />} label="Auto-generated" size="small" color="primary" variant="outlined" sx={{ height: 20, fontSize: "0.62rem" }} />
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button size="small" variant="text" onClick={() => setTestCases((ts) => ts.map((s) => ({ ...s, confirmed: true })))}>Select all</Button>
              <Button size="small" variant="text" onClick={() => setTestCases((ts) => ts.map((s) => ({ ...s, confirmed: false })))}>Clear</Button>
            </Box>
          </Box>
          {(["nightmare", "reality", "dream"] as const).map((cat) => {
            const config = CAT_CONFIG[cat];
            const cases = testCases.filter((s) => s.category === cat);
            return (
              <Box key={cat} sx={{ mb: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  <Typography variant="overline" sx={{ color: `${config.color}.main`, fontWeight: 700, letterSpacing: 1 }}>{config.guidedLabel}</Typography>
                  <Typography variant="caption" sx={{ color: "text.disabled" }}>- {config.guidedDesc}</Typography>
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {cases.map((sc) => (
                    <ScenarioCard key={sc.id} scenario={sc} onToggle={() => setTestCases((ts) => ts.map((s) => s.id === sc.id ? { ...s, confirmed: !s.confirmed } : s))} />
                  ))}
                </Box>
              </Box>
            );
          })}
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {testCases.filter((s) => s.confirmed).length} of {testCases.length} test cases selected
          </Typography>
        </Box>

        <Divider />

        {/* 5. Trace Sampling */}
        <Box>
          <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2, mb: 2 }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Trace sampling</Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.25 }}>
                Limit the percentage of incoming traces submitted for evaluation. Reduce to control cost; set to 100% for full coverage.
              </Typography>
            </Box>
            <Typography
              variant="h5"
              sx={{ fontFamily: "monospace", fontWeight: 800, color: newAgentSampleRate < 50 ? "warning.main" : "text.primary", minWidth: 64, textAlign: "right", flexShrink: 0 }}
            >
              {newAgentSampleRate}%
            </Typography>
          </Box>
          <Box sx={{ px: 1 }}>
            <Slider
              value={newAgentSampleRate}
              onChange={(_, v) => setNewAgentSampleRate(v as number)}
              min={1}
              max={100}
              step={1}
              marks={[
                { value: 10, label: "10%" },
                { value: 25, label: "25%" },
                { value: 50, label: "50%" },
                { value: 75, label: "75%" },
                { value: 100, label: "100%" },
              ]}
              valueLabelDisplay="auto"
              valueLabelFormat={(v) => `${v}%`}
            />
          </Box>
          {newAgentSampleRate < 100 && (
            <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 1 }}>
              At {newAgentSampleRate}%, roughly {newAgentSampleRate} out of every 100 traces will be evaluated. The rest are ingested but not scored.
            </Typography>
          )}
        </Box>
      </Box>
    );
  }

  function renderStep2() {
    const byCategory = {
      nightmare: testCases.filter((s) => s.category === "nightmare"),
      reality: testCases.filter((s) => s.category === "reality"),
      dream: testCases.filter((s) => s.category === "dream"),
    } as const;

    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {testCases.filter((s) => s.confirmed).length} of {testCases.length} selected
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button size="small" variant="text" onClick={() => setTestCases((ts) => ts.map((s) => ({ ...s, confirmed: true })))}>Select all</Button>
            <Button size="small" variant="text" onClick={() => setTestCases((ts) => ts.map((s) => ({ ...s, confirmed: false })))}>Clear</Button>
          </Box>
        </Box>
        {(["nightmare", "reality", "dream"] as const).map((cat) => {
          const config = CAT_CONFIG[cat];
          return (
            <Box key={cat}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <Typography variant="overline" sx={{ color: `${config.color}.main`, fontWeight: 700, letterSpacing: 1 }}>{config.guidedLabel}</Typography>
                <Typography variant="caption" sx={{ color: "text.disabled" }}>— {config.guidedDesc}</Typography>
              </Box>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {byCategory[cat].map((sc) => (
                  <ScenarioCard key={sc.id} scenario={sc} onToggle={() => setTestCases((ts) => ts.map((s) => s.id === sc.id ? { ...s, confirmed: !s.confirmed } : s))} />
                ))}
              </Box>
            </Box>
          );
        })}
      </Box>
    );
  }

  function renderStep3() {
    if (!profileVersion) return null;
    const enabledEntries = profileVersion.entries.filter((e) => e.enabled);
    const usedDimensions = [...new Set(enabledEntries.map((e) => e.dimension))];
    const selectedScenarios = testCases.filter((s) => s.confirmed);

    // Mock initial session data for "immediately show data"
    const mockScores = [
      { label: "Correctness", score: 81 },
      { label: "Safety", score: 94 },
      { label: "Tool Use", score: 76 },
      { label: "Efficiency", score: 68 },
    ].filter((s) => usedDimensions.includes(s.label as ShowcaseCategory));

    const overallScore = Math.round(mockScores.reduce((sum, s) => sum + s.score, 0) / Math.max(mockScores.length, 1));
    const verdict = overallScore >= profileVersion.verdictBands.ship ? "Ship" : overallScore >= profileVersion.verdictBands.ship_note ? "Ship with notes" : overallScore >= profileVersion.verdictBands.review ? "Review" : "Block";

    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Alert severity="info" sx={{ borderRadius: 1.5 }}>
          Review the details below. Click <strong>Start monitoring</strong> to publish the scoring profile and add the agent to your fleet.
        </Alert>

        {/* Agent summary */}
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>Agent</Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <ReviewRow label="Friendly name" value={basics.name} />
            <ReviewRow label="Trace name" value={inferredAgent?.traceName ?? basics.service} mono />
            <ReviewRow label="Type" value={<TypeTag type={basics.type} />} />
            <ReviewRow label="Source" value={entryMode === "new" ? "AgentScore OTel ingest" : dataSource === "langfuse" ? "Langfuse" : dataSource === "langsmith" ? "LangSmith" : dataSource === "datadog" ? "Datadog LLM Obs" : dbType === "clickhouse" ? "ClickHouse" : "PostgreSQL"} />
            {inferredAgent && <ReviewRow label="Sessions seen" value={`${discoveredAgents.find(a => a.traceName === inferredAgent.traceName)?.sessionCount.toLocaleString() ?? "—"} before onboarding`} />}
            <ReviewRow label="LLM judge" value={(() => { const j = LLM_JUDGES.find(j => j.id === selectedJudgeId) ?? LLM_JUDGES[0]; return `${j.name} (${j.model})`; })()} mono />
          </Box>
        </Paper>

        {/* Scoring profile summary */}
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 1.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Scoring profile</Typography>
            <Chip label="v1" size="small" sx={{ height: 20, fontSize: "0.68rem", fontFamily: "monospace" }} />
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <ReviewRow label="Evals" value={`${enabledEntries.length} enabled`} />
            <ReviewRow label="Dimensions" value={<Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>{usedDimensions.map((d) => <Chip key={d} label={d} size="small" sx={{ height: 20, fontSize: "0.68rem" }} />)}</Box>} />
            <ReviewRow label="Test cases" value={`${selectedScenarios.length} (${selectedScenarios.filter(s => s.category === "nightmare").length} hard · ${selectedScenarios.filter(s => s.category === "reality").length} normal · ${selectedScenarios.filter(s => s.category === "dream").length} stretch)`} />
          </Box>
        </Paper>

        {/* Initial data preview */}
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 1.5, border: "1px solid", borderColor: "primary.main", bgcolor: "rgba(var(--mui-palette-primary-mainChannel) / 0.03)" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
            <SparkleIcon />
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Initial data — first 5 sessions scored</Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
            <Box sx={{ textAlign: "center", px: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: "monospace", color: overallScore >= profileVersion.verdictBands.review ? "success.main" : "warning.main" }}>{overallScore}</Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>overall score</Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Chip
                label={verdict}
                size="small"
                color={verdict === "Ship" ? "success" : verdict === "Review" ? "warning" : "error"}
                sx={{ mb: 1 }}
              />
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
                {mockScores.map(({ label, score }) => (
                  <Box key={label} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography variant="caption" sx={{ width: 180, flexShrink: 0, color: "text.secondary" }}>{label}</Typography>
                    <Box sx={{ flex: 1, height: 6, bgcolor: "action.hover", borderRadius: 1, overflow: "hidden" }}>
                      <Box sx={{ width: `${score}%`, height: "100%", bgcolor: score >= 80 ? "success.main" : score >= 60 ? "warning.main" : "error.main", borderRadius: 1, transition: "width 0.5s" }} />
                    </Box>
                    <Typography variant="caption" sx={{ fontFamily: "monospace", fontWeight: 600, width: 28, textAlign: "right" }}>{score}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
          <Alert severity="info" sx={{ borderRadius: 1, py: 0.5 }}>
            These scores are based on existing traces. Metrics will continue to improve as more sessions are ingested and evaluated.
          </Alert>
        </Paper>
      </Box>
    );
  }

  // ── Step content dispatch ─────────────────────────────────────────────────

  const stepTitles = [
    "Connect your trace store",
    "Configure scoring profile",
    "Select LLM judge",
    "Review test cases",
    "Review & start monitoring",
  ];

  const stepSubtitles = [
    "Connect to Langfuse, LangSmith, Datadog, or a database, then select the agent you want to monitor.",
    "Choose an existing profile or generate one. Adjust evals, weights, and verdict bands.",
    "AgentScore auto-selected a judge based on your agent's traces. Override if needed.",
    "Calibration scenarios cover hard, normal, and stretch test cases.",
    "Everything looks good. Start monitoring to begin scoring sessions.",
  ];

  const activeStepForStepper = launching ? STEPS.length : isGenerating ? 1 : step;

  if (!entryMode) {
    return (
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
          <Button startIcon={<ArrowBackIcon />} variant="text" size="small" onClick={() => navigate({ name: "fleet" })} sx={{ color: "text.secondary", mr: 1 }}>Fleet</Button>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Add Agent</Typography>
        </Box>
        <Box sx={{ maxWidth: 860, mx: "auto" }}>
          {renderEntryChoice()}
        </Box>
      </Box>
    );
  }

  if (entryMode === "new") {
    return (
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
          <Button startIcon={<ArrowBackIcon />} variant="text" size="small" onClick={() => { setEntryMode(null); setNewStep(0); setTraceStage(-1); setTraceReady(false); }} sx={{ color: "text.secondary", mr: 1 }}>Back</Button>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Add Agent</Typography>
        </Box>
        <Stepper activeStep={newStep} sx={{ mb: 4 }}>
          {NEW_AGENT_STEPS.map((label) => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
        </Stepper>
        <Box sx={{ maxWidth: 860, mx: "auto" }}>
          {newStep === 0 && renderNewAgentSetup()}
          {newStep === 1 && renderWaiting()}
          {newStep === 2 && (launching ? (
            <LoadingOverlay title={`Setting up ${basics.name || "your agent"}…`} stages={LAUNCH_STAGES} currentStage={launchStage} />
          ) : renderNewAgentLaunch())}
        </Box>
        {!launching && (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 4, pt: 3, borderTop: "1px solid", borderColor: "divider", maxWidth: 860, mx: "auto" }}>
            <Button variant="outlined" onClick={() => { if (newStep === 0) { setEntryMode(null); } else { setNewStep((s) => s - 1); } }}>Back</Button>
            <Box>
              {newStep === 0 && (
                <Button variant="contained" onClick={() => { setNewStep(1); runTraceIngest(); }}>
                  I&apos;ve configured my exporter
                </Button>
              )}
              {newStep === 1 && traceReady && (
                <Button variant="contained" onClick={() => { initSharedStepsFromNewAgent(); setNewStep(2); }}>
                  Continue
                </Button>
              )}
              {newStep === 2 && !evalsGenerating && (
                <Button variant="contained" onClick={handleLaunch}>Start monitoring</Button>
              )}
            </Box>
          </Box>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} variant="text" size="small" onClick={() => setEntryMode(null)} sx={{ color: "text.secondary", mr: 1 }} disabled={launching}>Back</Button>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>Add Agent</Typography>
      </Box>

      <Stepper activeStep={activeStepForStepper} sx={{ mb: 4 }}>
        {STEPS.map((label) => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
      </Stepper>

      {!connecting && !launching && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{stepTitles[step]}</Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>{stepSubtitles[step]}</Typography>
          <Divider sx={{ mt: 2 }} />
        </Box>
      )}

      <Box sx={{ maxWidth: 860, mx: "auto" }}>
        {launching ? (
          <LoadingOverlay
            title={`Setting up ${basics.name || "your agent"}…`}
            stages={LAUNCH_STAGES}
            currentStage={launchStage}
          />
        ) : (
          <>
            {step === 0 && renderStep0()}
            {step === 1 && renderStep1()}
            {step === 2 && renderStepJudge()}
            {step === 3 && renderStep2()}
            {step === 4 && renderStep3()}
          </>
        )}
      </Box>

      {!connecting && !analyzing && !launching && (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 4, pt: 3, borderTop: "1px solid", borderColor: "divider", maxWidth: 860, mx: "auto" }}>
          <Button variant="outlined" onClick={() => step === 0 ? setEntryMode(null) : setStep((s) => s - 1)}>
            Back
          </Button>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {step === 0 && (
              <Button variant="contained" onClick={handleContinueToProfile} disabled={!step1Valid}>
                Continue
              </Button>
            )}
            {step === 1 && (
              <Button variant="contained" onClick={() => setStep(2)} disabled={!profileValid || isGenerating}>
                Next
              </Button>
            )}
            {step === 2 && (
              <Button variant="contained" onClick={() => setStep(3)}>
                Next
              </Button>
            )}
            {step === 3 && (
              <Button variant="contained" onClick={() => setStep(4)} disabled={!testCasesValid}>
                Next
              </Button>
            )}
            {step === 4 && (
              <Button variant="contained" onClick={handleLaunch}>
                Start monitoring
              </Button>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
}
