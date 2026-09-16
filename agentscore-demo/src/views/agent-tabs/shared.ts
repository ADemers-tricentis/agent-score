import type { ActivityEventKind, Project, Session } from "../../types";

// ── Span explorer helpers (moved from the old ProjectView) ──────────────────

export interface MockSpan {
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

export function di(seed: string, range: number, salt: number): number {
  let h = salt * 2654435769;
  for (const c of seed) h = (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0;
  return h % range;
}

export function generateSpans(session: Session, project: Project): MockSpan[] {
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

export const SCORE_STAGES = [
  "Fetching recent traces…",
  "Running eval suite…",
  "Aggregating dimension scores…",
  "Finalizing run report…",
];

export const EVENT_KIND_CONFIG: Record<ActivityEventKind, { label: string; color: string }> = {
  profile_adopted: { label: "Profile matched", color: "primary.main" },
  run_completed: { label: "Run completed", color: "success.main" },
  milestone_reached: { label: "Milestone", color: "warning.main" },
  decision_override: { label: "Override", color: "error.main" },
  profile_version_changed: { label: "Profile updated", color: "info.main" },
  regrade_completed: { label: "Regraded", color: "text.secondary" },
};

export const EVENT_KIND_ICON: Record<ActivityEventKind, string> = {
  run_completed: "M20.38 8.57l-1.23 1.85a8 8 0 0 1-.22 7.58H5.07A8 8 0 0 1 15.58 6.85l1.85-1.23A10 10 0 0 0 3.35 19a2 2 0 0 0 1.72 1h13.85a2 2 0 0 0 1.74-1 10 10 0 0 0 .6-10.44zm-9.79 6.84a2 2 0 0 0 2.83 0l5.66-8.49-8.49 5.66a2 2 0 0 0 0 2.83z",
  profile_adopted: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z",
  profile_version_changed: "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z",
  milestone_reached: "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l7.59-7.59L21 8l-9 9z",
  decision_override: "M12 1l3.22 6.53 7.21 1.05-5.22 5.09 1.23 7.18L12 17.77l-6.44 3.38 1.23-7.18L1.57 8.58l7.21-1.05z",
  regrade_completed: "M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z",
};
