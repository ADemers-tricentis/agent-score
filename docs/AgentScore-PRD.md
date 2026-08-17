# Product Requirements Document - Agent Score

**Know if your AI agent is ready to ship - is it better than before, and was the change worth it?**

---

## Document Summary

| Field | Details |
| --- | --- |
| **Title** | AgentScore |
| **Author** | Andrew Demers (Lead PM, AI Chat) |
| **Status** | Draft |
| **Created** | 2026-05-21 |
| **Last Updated** | 2026-06-22 |
| **Jira Initiative** | [ TBD ] |
| **Jira Epic** | [ TBD ] |
| **Target Release** | Phase 1 (ATA-only); Phase 2 (ATC + external) Q4 2026 onward |
| **Short Summary** | AgentScore tells a domain practitioner - not an AI expert - whether the agent doing their work is ready to ship, whether it improved, and whether a change was worth it. It treats the hardest part of agent evaluation - knowing what to measure - as a first-class capability: observation-based and spec-based measurement discovery generate evaluation designs (with nightmare scenarios by default) rather than scoring only the data that happens to exist. AgentScore ingests telemetry via OTel and produces a composite score across six quality dimensions, a PASS/PARTIAL/FAIL verdict, and an evidence-backed attribution chain when a session fails. |

---

## Overview

AgentScore is the evaluation and scoring platform for AI agents in the Tricentis product suite. It ingests OpenTelemetry traces emitted by agents, scores each session across multiple quality dimensions, and produces a composite grade (A-F / 0-100) with a PASS / PARTIAL / FAIL verdict. Teams use AgentScore to monitor agent quality over time, gate deployments, and understand which dimensions need improvement.

AgentScore is a product layer on top of the EvalClaw evaluation engine. This document covers the product requirements for the AgentScore UI and supporting platform services.

---

## Problem Statement

AI agents are deployed into production workflows at Tricentis (ATA, ATC, CURA, AI Workspace, APT, Coding Assistant) but there is no consistent, systematic way to measure whether they are working correctly. Teams rely on anecdotal feedback and ad hoc testing. Without structured evaluation:

- Regressions go undetected until users report them.
- There is no objective basis for shipping or blocking a model/agent upgrade.
- Root cause analysis is manual and slow when agents fail.
- Different teams apply inconsistent quality standards across agent types.

AgentScore solves this by providing a standard evaluation pipeline, shared scoring vocabulary, and integration points with Tricentis CI/CD.

---

## Goals

- Provide a single platform to evaluate, score, and monitor all Tricentis AI agents.
- Make evaluation accessible without requiring agents to integrate a proprietary SDK - standard OTel instrumentation is sufficient.
- Produce consistent, explainable scores that can be used as deployment gates.
- Support both automated scoring (trace-driven) and human-guided evaluation design.
- Surface actionable attribution when an agent fails.

## Non-Goals

- AgentScore does not replace LLM observability tooling (latency dashboards, token cost dashboards). It focuses on quality, not infrastructure health.
- AgentScore does not manage agent infrastructure or deployments directly.
- AgentScore does not provide real-time streaming scores with sub-second latency (scoring pipeline target: P95 < 30s per session).
- Phase 1 does not include multi-tenant support or external customer access.

---

## Personas

| Persona | Phase | Description | Primary use |
| --- | --- | --- | --- |
| **Domain Practitioner (agent user)** | Primary - Phase 1 + 2 | A professional who has adopted or configured an AI agent to assist with work in their domain - testing, finance, legal review, content, support, or any other. They have deep domain expertise and know what good output looks like in their field. They do not have an AI background. The testing practitioner is the first instance of this persona. | Understand whether the agent is helping, what it is getting wrong, and whether it can be trusted for a specific task. |
| **Team Lead / Manager** | Primary - Phase 1 + 2 | Owns outcomes for a team running one or more AI agents across their workflows. Needs a cross-agent view in terms they can report upward - not AI metrics, but outcome quality and trend direction. Makes the decision on whether the team should depend on an agent for a given task. | Monitor agent quality across the team, track improvement over time, make deployment decisions. |
| **AI Ops Engineer (ATA)** | Secondary - Phase 1 | The technically fluent practitioner who builds and maintains agents in the autonomous-service context. Needs per-session feedback, attribution on failures, and a precise signal to inform prompt or model changes. Closest to the original PRD's primary persona - still important, but not the primary growth surface. | Per-session scoring, failure attribution, dimension-level diagnosis to guide prompt and model changes. |
| **Inline Reviewer (qTest / Tosca)** | Primary - Phase 2 | A practitioner reviewing AI-generated outputs inside a Tricentis product. Needs an inline verdict that tells them whether to trust what the agent produced before they act on it - without leaving their workflow. Testing is the first instance of this persona; the pattern generalizes to any review workflow where an agent produces outputs a human must approve. | Inline verdict (grade + top failing dimension) surfaced inside the host product at the moment of review. |

---

## Objectives and Constraints

### Objectives

| # | Objective | How we measure it |
| --- | --- | --- |
| O1 | Give domain practitioners - not AI experts - a trustworthy, legible signal on agent quality | Domain Practitioner can interpret their agent's grade and top failing dimension without AI background; validated via user research |
| O2 | Reduce time from "something went wrong" to "here is what went wrong and why" | Attribution panel surfaces root cause, confidence, and evidence chain on every non-PASS session |
| O3 | Make evaluation design a product capability, not custom engineering work per agent | ASSERT pipeline converts a plain-language spec to a calibrated eval set in < 60 seconds; Observation path requires zero upfront configuration |
| O4 | Establish consistent quality standards across all Tricentis AI agents | All agents use a versioned ScoringProfile; profile adoption rate >= 85% by Phase 2 |
| O5 | Provide deployment gates that fit existing CI/CD workflows | GitHub Actions / Azure DevOps / Jenkins integrations block on FAIL; gate adoption >= 8 pipelines by Phase 2 |
| O6 | Surface agent quality inside the tools practitioners already use | Inline verdict in qTest AI Chat and Tosca Cloud review panel; zero workflow interruption for Inline Reviewer persona |

### Constraints

| # | Constraint | Rationale |
| --- | --- | --- |
| C1 | Must work with standard OTel instrumentation - no proprietary SDK required | SDK requirement blocks adoption; most agents are already OTel-instrumented or use frameworks that support it natively |
| C2 | Scoring must never block the agent's execution path | Guard check must complete in < 50ms P95; all LLM scoring is async and cannot introduce latency into the agent loop |
| C3 | Phase 1 scope is internal Tricentis agents only (ATA context first) | Multi-tenant and external customer access requires additional security and billing infrastructure deferred to Phase 3 |
| C4 | Results must be legible to domain practitioners without AI expertise | Score labels, verdict language, and attribution must map to domain outcomes - not model internals or evaluation theory |
| C5 | LLM judge cost must stay within per-session budget | P95 target < $1.50 at Phase 1 launch, < $1.00 by Phase 2; conditional Attribution dispatch (Q5) is the primary cost lever |
| C6 | Must integrate with Tosca, qTest, and AI Workspace via existing review flows | No new UI surfaces inside host products - verdict is surfaced inline where the practitioner is already working |
| C7 | ScoringProfile changes must not silently invalidate historical comparisons | All profile changes create a new immutable version; projects adopt a specific version; regrading is offered on version change |

---

## Key Concepts

### Scoring Dimensions

Sessions are scored across six core dimensions and up to five extended dimensions.

**Core dimensions (always present):**

| Code name | Display name | Description |
| --- | --- | --- |
| `benchmarkPerformance` | Correctness | Did the agent complete the task correctly? Measured via library metrics, LLM judge, or hybrid. |
| `valueEfficiency` | Efficiency | Did the agent complete the task within resource budget (tokens, steps, latency)? |
| `uxSignal` | Relevance | Was the output useful and appropriate for the user context? |
| `harmony` | Safety | Did the agent behave safely - no injection compliance, no hallucination, no out-of-scope actions? |
| `stability` | Consistency | Does the agent produce consistent outputs across equivalent inputs? |
| `agency` | Tool Use | Did the agent use tools correctly and efficiently? |

**Extended dimensions (optional per profile):**

`groundedness`, `instructionFollowing`, `transparency`, `robustness`, `communication`

Each `DimensionScore` carries: `score` (0-100 integer), optional `passed` flag, `sigs` signal array, and optional `rawDeltaPct` for efficiency comparison to baseline.

### Composite Score and Grade

The composite score is a weighted average of all enabled dimension scores, normalized to 0-100. The grade is derived from the composite:

| Score | Grade |
| --- | --- |
| 90-100 | A |
| 80-89 | B |
| 70-79 | C |
| 60-69 | D |
| 0-59 | F |

### Verdict

Each session receives one of three verdicts: **PASS**, **PARTIAL**, or **FAIL**.

The verdict is determined by:
1. The worst-dimension gate: if any enabled dimension scores below 55, the session cannot PASS.
2. The composite score verdict bands configured in the agent's scoring profile.
3. Safety Override: a `SafetyOverride` signal with `severity: "Critical"` forces **FAIL**; `severity: "High"` forces **PARTIAL**, regardless of the composite score.

### Scoring Profiles

A `ScoringProfile` is a versioned bundle of evaluation configuration for a given agent type. It contains:
- `ProfileVersion` objects (immutable once published; changes create a new version)
- `ProfileEntry` objects: individual evals with `evalKind` (library_metric | llm_judge | hybrid | decision_tree), dimension assignment, threshold, and weight
- `dimensionWeights`: relative weights for dimension scoring
- `verdictBands`: composite score thresholds for Ship / Ship with notes / Review / Block

Projects "adopt" a profile version. When a new version is published, historical runs can be regraded.

**Default verdict bands:**

| Band | Threshold |
| --- | --- |
| Ship | >= 85 |
| Ship with notes | >= 70 |
| Review | >= 55 |
| Block | < 40 |

### LLM Judge Dispatch

AgentScore dispatches LLM judges on every scored session using the following model:

- **Always dispatched (3 judges):** Correctness, Quality, Security
- **Conditional (1 judge):** Attribution - only dispatched when session verdict is non-PASS

This model controls LLM inference cost by skipping attribution analysis for healthy sessions.

### Pass^k (Multi-Run Reliability)

Pass^k measures the probability that an agent will pass on at least one attempt out of k. It is displayed on the project overview as the reliability signal: RELIABLE / NEEDS_WORK / UNSTABLE.

### Preliminary Score

A score is flagged as "preliminary" when the agent has fewer than 3 completed runs **or** fewer than 30 sessions in total. Preliminary scores are displayed with a warning badge. Statistical confidence intervals (CI95) are shown on run pass rates.

### Runtime Guard

The Runtime Guard is a pre-tool-use decision layer that intercepts agent tool calls before they execute. It applies three rules:

| Rule | Trigger | Decision |
| --- | --- | --- |
| R1 | Exact repeat of a previously executed tool call with identical arguments | BLOCK |
| R2 | Same tool called again after it previously returned an error | WARN |
| R3 | Agent has executed 3+ consecutive inspect/read-only calls without a write action | WARN |

The Guard operates at < 50ms P95 latency. Guard decisions (ALLOW / WARN / BLOCK) are logged with fingerprint, project, session, tool name, and reason.

Sessions with Guard triggers are always evaluated at 100% sampling rate regardless of the agent's configured trace sampling rate.

### Attribution

When a session verdict is non-PASS, the Attribution judge produces:
- `rootCause`: categorized root cause (e.g. `tool_misuse`, `hallucination`, `instruction_following`)
- `confidence`: 0-100 confidence in the attribution
- `agentFault`: boolean - was this attributable to agent behavior vs. environment
- `chain`: ordered `AttributionChainStep` array showing how the failure propagated, with culprit highlighting
- `recs`: recommended remediation steps

### EvalDesign

EvalDesign captures how evaluations were designed for a project before a scoring profile is adopted. Two design paths:

- **Observation-Based:** AgentScore watches traces from the agent and derives measurement recommendations from real behavior patterns.
- **Spec-Based (ASSERT pipeline):** The user provides a spec (guided 3-question form or expert YAML/JSON/Markdown). ASSERT processes it through 4 stages: Systematization, Taxonomization, Test-Set Generation, Scoring Setup. Output includes a behavior taxonomy (permissible/impermissible behaviors) and `EvalQuestion` cards with rank, behavior class, risk level, task definition, judge criteria, candidate measure, and spec citation.

EvalDesign status progression: `no_design` -> `observation_ready` -> `confirmed`

### Calibration Set

A calibration set is a curated collection of test scenarios used to validate profile configuration. Three scenario categories:

| Category | Purpose |
| --- | --- |
| Nightmare | Adversarial inputs designed to cause failures; stress-test safety and robustness |
| Reality | Representative production-like scenarios |
| Dream | Ideal inputs where a well-functioning agent should clearly pass |

A profile is considered under-calibrated if it has no Nightmare scenarios.

### Fingerprint Matching

AgentScore can automatically match an unprovisioned project to a scoring profile by analyzing the pattern of tool calls and span types in its traces. Match output: `fingerprintConfidence` (0-100%), `fingerprintSessionCount`, `fingerprintMatchedAt`. Fingerprint-matched profiles are highlighted in the project settings.

---

## Requirements

### R1 - Fleet View (Agent Dashboard)

**As an AI Engineer, I want to see all registered agents at a glance so I can quickly identify which agents need attention.**

#### Acceptance Criteria

- Displays a card grid of all registered agents.
- Each card shows: agent name, service, agent type tag, grade chip (A-F), composite score /100, latest run verdict badge, reliability chip (RELIABLE / NEEDS_WORK / UNSTABLE), ATC beta tag (if applicable), pass percentage, session count, three dimension score bars (Correctness, Efficiency, Relevance), run count, and date of last run.
- An "Add Agent" button navigates to the agent onboarding flow.
- Cards are clickable and navigate to the Project (agent detail) view.

---

### R2 - Project View (Agent Detail)

**As an AI Engineer, I want a detailed view of an individual agent's scoring history, profile adoption status, and activity so I can understand its current health.**

#### Acceptance Criteria

**Header:**
- Shows agent name, service, agent type tag, composite score, grade chip, and preliminary score badge (when fewer than 30 sessions have been scored).
- Shows +/- confidence delta vs. previous run (e.g. "+4 pts vs. last run").
- Shows run count, total session count, reliability chip, and pass^k value.
- "Settings" button navigates to the Agent Settings view.
- "Score now" button triggers an on-demand scoring run via a 4-stage animation (Preparing traces -> Running evaluations -> Applying profile -> Finalizing scores).
- "Compare runs" button navigates to the Run Comparison view for the two most recent runs.
- Read-only "auto-scores daily" notice with estimated throughput (e.g. "~180/hr evaluated at 75%").

**Scoring Profile card:**
- Shows the adopted profile name, version, eval count, dimensions covered, and fingerprint match info (confidence %, session count, matched-at date) when applicable.
- Profile card has green border when a profile is actively adopted.
- If no profile is adopted and an EvalDesign exists, shows the EvalDesign card with current design status.

**Runs table:**
- Lists runs with label, date, session count, pass rate, and latest verdict.
- Filterable by time range: 7 days, 30 days, all time.
- Shows a "regrade notice" alert when historical runs were scored with a different profile version.
- Shows in-progress run state with animated indicator when scoring is running.

**Activity log:**
- Timeline of events sorted newest-first.
- Event types: `profile_adopted`, `run_completed`, `milestone_reached`, `decision_override`, `profile_version_changed`, `regrade_completed`.

---

### R3 - Run View

**As an AI Engineer, I want to drill into an individual evaluation run to see per-session results and export calibration cases.**

#### Acceptance Criteria

**Run header:**
- Shows run label, pass rate with +/-CI95 confidence interval, session counts by verdict (PASS / PARTIAL / FAIL), and average composite score + grade.

**Compare button:**
- "Compare with [run name]" button navigates to the Run Comparison view for this run vs. the most recent other run.

**Export as calibration case:**
- "Export as calibration case" button opens a dialog.
- Dialog shows all sessions as checkboxes; non-PASS sessions are pre-selected.
- Shows destination path: `~/.AgentScore/projects/{service}/calibration-cases/{runId}/`.
- Export button is disabled if zero sessions are selected.
- On export, shows a confirmation chip.

**Sessions table:**
- Columns: Scenario, Time, Duration, Score (grade + composite), BP score, VE score, UX score, Verdict.
- Safety tag shown inline in the Scenario column when a SafetyOverride is present.
- Filterable by failing dimension: shows dimension filter chips only for dimensions that have at least one failing session in this run (score < 55). "Clear" chip resets filter.

---

### R4 - Session View

**As an AI Engineer, I want to see the full evaluation detail for a single session, including dimension scores, attribution, and the ship decision.**

#### Acceptance Criteria

**Alerts (shown at top when present):**
- ATC beta notice when session is tagged as ATC beta.
- Worst-dimension gate warning when session is non-PASS, listing which dimensions scored below 55.
- Safety Override alert: Critical severity shown as a red FAIL-forcing alert; High severity shown as a warning PARTIAL-forcing alert.

**Score card:**
- ScoreMeter (circular progress indicator), grade chip, verdict badge, ship recommendation (from verdict bands), baseline comparison delta, scenario name, timestamp, duration.
- All enabled dimension score bars with values.

**Attribution panel (shown on non-PASS sessions):**
- Root cause chip (categorized), confidence percentage, agent fault boolean flag.
- Evidence chain: ordered steps with culprit step highlighted.
- Recommendations list.

**Ship Decision panel:**
- Allows recording a Ship / Hold / Reject decision with free-text rationale and author name.
- "Overrides verdict" toggle available.
- Existing decision is editable.

**Right panel:**
- Report in two tabs: Markdown and JSON.
- Shows file path for where report is saved (e.g. `reports/{projectId}/{runId}/{sessionId}.md`).

---

### R5 - Agent Settings View

**As an AI Engineer, I want to configure an agent's scoring profile, LLM judge, eval toggles, verdict bands, and trace sampling rate.**

#### Acceptance Criteria

**Scoring Profile section:**
- Radio list of all available profiles showing: name, version chip, agent type tag, eval count, dimension count.
- Currently adopted profile is highlighted with an "Active" chip.

**LLM Judge section:**
- Radio list of all configured judges showing: name, provider chip, model (monospace), status (Live / Error).

**Evaluation Metrics section:**
- Shows all evals from the selected profile, grouped by dimension.
- Each eval shows: name, eval kind chip, weight, threshold, question text (truncated to 100 chars).
- Individual evals can be toggled on/off via Switch.
- Counter shows "X of Y enabled."

**Verdict Bands section:**
- Four sliders for Ship / Ship with notes / Review / Block thresholds (0-100).
- Each slider labeled with threshold label and current value.

**Trace Sampling section:**
- Slider from 1% to 100%.
- Current percentage shown as large monospace value.
- Warning color when sampling rate is below 50%.
- Info alert: "Smart override: Sessions with errors, timeouts, or Runtime Guard triggers are always evaluated at 100% regardless of this setting."

**Save button** persists all changes to the project.

---

### R6 - Scoring Profiles Library

**As an AI Engineer, I want to manage reusable scoring profiles that can be adopted by multiple agents.**

#### Acceptance Criteria

**Profiles list:**
- Table showing: name, slug (monospace), agent type tag, version, enabled eval count (with total if some are disabled), dimensions covered, status, created date, and a "Clone" action.
- "New profile" button navigates to the Add Profile flow.
- Clicking a row navigates to the Profile Detail view.

**Add Profile flow (3 steps: Identity, Configure, Review):**

Step 1 - Identity:
- Name field (required), description field (optional).
- Auto-generates slug from name (shown in monospace).
- Agent type selector as a card grid. Types: ATA (Automated Test Agent), ATC (Automated Test Creation), CURA (Root Cause Analysis), AI Workspace, CODING (Coding Assistant), APT (AI Performance Testing).
- "Build template" button triggers a 4-stage loading animation before advancing.

Step 2 - Configure:
- Eval entries grouped by dimension, each in a collapsible DimensionSection.
- Each dimension section shows: dimension name, weight field, enabled count, collapse toggle.
- Each eval entry shows: enable Switch, name, risk level chip, behavior class chip, question text, threshold field, weight field, expand toggle for task definition and judge criteria.
- "Enable all" / "Disable all" quick actions.
- Verdict bands configuration (four numeric inputs for Ship / Ship with notes / Review / Block).

Step 3 - Review:
- Summary of profile identity (name, slug, description, agent type).
- Summary of version 1: eval count, dimensions, verdict band values.
- "Publish profile" button creates the profile and navigates to Profile Detail.

**Profile templates by agent type:** Each type has a pre-populated set of evals across Correctness, Safety, Efficiency, Relevance, Consistency/Tool Use dimensions with appropriate thresholds, weights, behavior classes, and risk levels.

---

### R7 - Add Agent (Onboarding) Flow

**As an AI Engineer, I want an onboarding flow that takes me from zero to a scored agent with minimal friction.**

Two onboarding paths:

#### Path A - New Agent (OTel-first, 3 steps)

Step 1 - Connect via OTel:
- Displays an API key (format `as_live_...`).
- OTLP/HTTP ingestion endpoint: `https://ingest.agentscore.io/otel/v1/traces`.
- Shows required environment variables: `OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_EXPORTER_OTLP_HEADERS` (with API key), `OTEL_SERVICE_NAME`.
- Python code snippet showing OpenTelemetry setup.
- List of compatible frameworks (LangChain, LangGraph, OpenAI Agents SDK, Anthropic SDK, AutoGen, CrewAI, custom loops).
- "Waiting for traces" state with a "Next" button to advance.

Step 2 - Waiting for first traces:
- Ingest pipeline animation showing 5 stages: Trace received -> Parked -> Agent recognized -> Re-homed -> Ready.
- Each stage animates in sequence with status dots.

Step 3 - Configure and launch:
- Eval suggestions derived from the received traces with confidence percentages.
- "Describe mode" fallback if suggestions are insufficient, with guided/expert toggle.
- Profile picker.
- Judge selection with auto-recommendation by agent type.
- Calibration test case entry.
- Verdict band sliders.
- Trace sampling slider.

#### Path B - Existing Agent (Spec-first, 6 steps)

Step 1 - Agent basics: name, agent type, service name.

Step 2 - Describe the agent: Guided mode (3 plain-language questions) or Expert mode (YAML / JSON / Markdown spec toggle).

Step 3 - Profile selection and generation: 5-stage pipeline animation (Analyzing spec -> Deriving dimensions -> Selecting evals -> Applying weights -> Building profile).

Step 4 - Judge selection: auto-selected judge based on agent type, with override option. Shows judge provider, model, status.

Step 5 - Test cases: entry of calibration scenarios (Nightmare / Reality / Dream categories).

Step 6 - Launch: 6-stage launch animation. On completion, navigates to the new project's Project View.

---

### R8 - Evaluation Design View

**As an AI Engineer, I want to design evaluations for an agent using either observations from its live traces or a structured spec.**

#### Acceptance Criteria

**Path selection:**
- Two toggleable paths: "Watch and learn" (Observation-Based) and "Describe it" (Spec-Based). Both can be selected simultaneously.

**Observation tab:**
- `no_design` state: shows a "watching" indicator list of what AgentScore is monitoring.
- `observation_ready` state: shows a `MeasurementRecommendation` card with suggested dimensions, calibration seed from real failures, and a "Confirm" button to advance to confirmed.
- `confirmed` state: shows active dimensions summary.

**Spec tab:**
- Guided mode: 3-field form (agent description, primary tasks, known failure modes).
- Expert mode: category scoping, risk area chips, YAML / JSON / Markdown textarea toggle.
- "Generate evals" button triggers the ASSERT 4-stage pipeline animation: Systematization -> Taxonomization -> Test-Set Generation -> Scoring Setup.
- Results show behavior taxonomy (permissible behaviors list, impermissible behaviors list).
- `EvalQuestion` cards showing: rank, showcase category, behavior class, risk level, task definition, judge criteria, candidate measure, spec citation, directionality.

**Calibration Set tab:**
- Three sections: Nightmare, Reality, Dream.
- Scenario cards within each section.
- Warning banner if no Nightmare scenarios are defined.

**Confirmed design banner:**
- Shown when `status === "confirmed"`.
- Displays a dimension table and calibration set coverage summary.

---

### R9 - Run Comparison View

**As an AI Engineer, I want to compare two evaluation runs side by side to understand whether a change made things better or worse.**

#### Acceptance Criteria

**Summary table:**
- Columns: label, date, sessions, pass rate, avg composite + grade, delta (A minus B).
- Significance interpretation: delta >= 10 pts labeled "Likely significant"; 5-9 pts "May be noise"; < 5 pts "Within noise"; fewer than 3 matched sessions "Too few sessions."
- Note: "Significance: deltas >= 10 pts likely significant; < 5 pts likely within noise. Increase session count to narrow confidence intervals."

**Scenario breakdown:**
- Per-scenario cards showing side-by-side verdict, grade, composite score, and delta label (e.g. "A +5" or "tied").
- Dimension bars shown for each side with delta values.
- "View A" / "View B" links navigate to the individual session views.
- Scenarios present in one run but not the other show "Not run" on the absent side.

---

### R10 - Guard Log View

**As an AI Engineer, I want to review all Runtime Guard decisions to identify patterns of blocked or warned tool calls.**

#### Acceptance Criteria

**Summary chips at top:**
- Total decisions, Allow count, Warn count, Block count.

**Filterable table:**
- Column filters: Project, Decision (Allow / Warn / Block), Rule (R1 / R2 / R3).
- Columns: Time, Project, Tool (monospace), Fingerprint, Rule chip, Decision chip, Reason text.

**Rule reference cards:**
- R1: Exact-repeat block - "Blocked: identical tool call was already executed this session."
- R2: Error-repeat warn - "Warning: this tool returned an error on the previous call."
- R3: Inspect-streak warn - "Warning: 3+ consecutive read-only tool calls without a write."

---

### R11 - Metrics View (OTel Catalog)

**As a Platform Admin, I want to see the OTLP metrics published by AgentScore to understand system health and scoring throughput.**

#### Acceptance Criteria

Displays the following metric definitions in a catalog format with name, type (counter/gauge/histogram), labels, and sample values:

| Metric | Type | Description |
| --- | --- | --- |
| `evalclaw.eval.outcome` | Counter | PASS / PARTIAL / FAIL session counts |
| `evalclaw.eval.metric_score` | Gauge | Per-dimension averages |
| `evalclaw.eval.root_cause` | Counter | Attribution distribution on non-PASS sessions |
| `evalclaw.session.duration` | Histogram | avg / min / max session duration |
| `gen_ai.client.token.usage` | Histogram | Token usage; median ~$0.62, P95 ~$1.12, target < $1.00 |
| `evalclaw.evaluator.llm_calls` | Counter | 3 calls per PASS session; 4 calls per non-PASS session |
| `evalclaw.guard.decisions` | Counter | Allow / warn / block with SLA < 50ms P95 |

---

### R12 - LLM Judges View

**As a Platform Admin, I want to manage the LLM judges available for scoring.**

#### Acceptance Criteria

- Table of all configured judges: name, provider (Anthropic / AWS Bedrock / OpenAI-compatible), model (monospace), status (Live / Error), created date.
- "Add judge" button.
- Dispatch model diagram showing the 4-judge model: Correctness (always), Quality (always), Security (always), Attribution (conditional on non-PASS).

---

### R13 - Integrations View

**As a Platform Admin, I want to configure connections between AgentScore and the rest of the Tricentis platform and CI/CD tooling.**

#### Tricentis integrations:

| Integration | Status | Description |
| --- | --- | --- |
| Tosca Test API | Connected | Submit Tosca sessions for scoring; verdict written back to the Tosca session record. |
| Tosca Cloud Review Panel | Beta | Surfaces AgentScore verdict inline in the Tosca Cloud review panel. |
| AI Workspace Live Monitoring | Active | Stream live session events from AI Workspace agents; score in real time. |
| AI Workspace Version Scoring | Active | Auto-run AgentScore on each AI Workspace model upgrade; compare grades across versions. |
| qTest AI Chat Inline Verdict | Beta | Embeds verdict in the qTest AI Chat interface. |
| Deterministic Oracles | Not configured | Per-agent zero-latency assertion checks that run before LLM judges. |

#### CI/CD integrations:

| Integration | Status | Description |
| --- | --- | --- |
| GitHub Actions | Connected | PR check; blocks merges on FAIL verdict; posts grade as PR comment. |
| Azure DevOps | Not connected | Pipeline step with verdict gate on deployment stage. |
| Jenkins | Not connected | Post-build step; marks build unstable on PARTIAL, failed on FAIL. |
| Cross-Cloud Routing | Phase 3 | Route scoring traffic across AWS CloudWatch, Azure Foundry, GCP Vertex AI. |

#### SDK and API:

- **Python SDK** (`pip install agentscore`): wraps any Python agent with AgentScore in two lines. Compatible with LangGraph, OpenAI Agents SDK, custom loops.
- **TypeScript SDK** (`npm install @tricentis/agentscore`): native client for Node.js agents. First-class support for Vercel AI SDK and Anthropic SDK tool loops.
- **MCP Server**: exposes `evaluate_session` and `guard_tool_call` as MCP tools at `localhost:7432/mcp`.
- **HTTP API**: REST endpoints for all AgentScore functionality:
  - `POST /guard/pre-tool-use` - Guard check (< 50ms P95)
  - `POST /guard/post-tool-use` - Record outcome
  - `POST /sessions/:id/score` - Re-evaluate session
  - `GET /internal/health/is-alive` - Liveness

---

### R14 - API Key Management (Tenant Self-Service)

**As an AI Engineer, I want to view, create, rename, disable, rotate, and revoke my tenant's API keys from inside the AgentScore app, so I can onboard a new agent or recover from a leaked key without filing a support request.**

Today the only surface for this is the superadmin-only backend route (`/admin/tenants/{tenant_id}/api_keys` - see Tenant API Keys reference) and the one-time key reveal during onboarding (R7, Path A Step 1). This story adds a tenant-facing UI for the same capability, most naturally as a new "API Keys" panel inside the Integrations View (R13).

#### Acceptance Criteria

**Key list:**
- Table of the tenant's API keys: name, key hint (e.g. `as_live_...a1b2`), status (Active / Disabled), created date, last-used date.
- Empty state explains the one-key-per-tenant model and prompts creating the first key.

**Create key:**
- "New API key" action opens a modal for a required name.
- On create, the full secret is displayed once in a copyable monospace field with a persistent warning that it cannot be retrieved again.
- New key is appended to the list showing only its hint.

**Rename / enable-disable:**
- Inline rename.
- Disable toggle immediately blocks ingestion on that key without deleting it; can be re-enabled.

**Rotate:**
- "Rotate" action with a confirm step warning that the old secret stops working immediately.
- New secret is shown once, using the same reveal-once pattern as create.

**Revoke:**
- "Revoke" (hard delete) requires typing the key name to confirm, since any agent still using it will fail ingestion immediately.

**Permissions:**
- Available to any tenant member, matching the app's existing permission model - not gated behind superadmin. This story is the tenant-scoped equivalent of the existing superadmin-only backend endpoints; whether it calls those routes directly (with tenant-scoped auth) or a new tenant-facing route is a backend design decision, not part of this story.

---

## Data Model (Key Types)

### Session

```typescript
Session {
  id: string
  ts: string          // ISO timestamp
  dur: number         // duration in ms
  scenario: string
  verdict: "PASS" | "PARTIAL" | "FAIL"
  baseline?: number   // baseline composite for delta display
  safetyOverride?: SafetyOverride
  scores: {
    benchmarkPerformance: DimensionScore  // required
    valueEfficiency: DimensionScore       // required
    uxSignal: DimensionScore             // required
    harmony?: DimensionScore
    stability?: DimensionScore
    agency?: DimensionScore
    groundedness?: DimensionScore
    instructionFollowing?: DimensionScore
    transparency?: DimensionScore
    robustness?: DimensionScore
    communication?: DimensionScore
  }
  attr?: Attribution
  shipDecision?: ShipDecision
  atcBeta?: boolean
}
```

### Run

```typescript
Run {
  id: string
  label: string
  date: string
  sessions: Session[]
  regradedWithProfileVersion?: string
  inProgress?: boolean
}
```

### Project

```typescript
Project {
  id: string
  name: string
  service: string
  type: "ATA" | "ATC" | "CURA" | "AI_WORKSPACE" | "CODING" | "APT"
  phase: number
  reliability: "RELIABLE" | "NEEDS_WORK" | "UNSTABLE"
  runs: Run[]
  adoptedProfileId?: string
  llmJudgeId?: string
  traceSampleRate?: number
  fingerprintMatchedAt?: string
  fingerprintConfidence?: number
  fingerprintSessionCount?: number
  events?: ActivityEvent[]
}
```

### ScoringProfile / ProfileVersion / ProfileEntry

```typescript
ScoringProfile {
  id, slug, name, description, agentType, status, versions[], createdAt
}

ProfileVersion {
  id, version, dimensionWeights, verdictBands, entries[], createdAt
}

ProfileEntry {
  id, evalSlug, evalName
  evalKind: "library_metric" | "llm_judge" | "hybrid" | "decision_tree"
  dimension: ShowcaseCategory
  threshold: number   // 0.0-1.0
  weight: number      // multiplier
  enabled: boolean
  question, taskDefinition, judgeCriteria
  behaviorClass: "permissible" | "impermissible"
  riskLevel: "high" | "medium" | "low"
  directionality: "higher_is_better" | "lower_is_better"
}
```

### Attribution

```typescript
Attribution {
  rootCause: RootCause
  confidence: number       // 0-100
  agentFault: boolean
  chain: AttributionChainStep[]
  recs: string[]
}
```

### ShipDecision

```typescript
ShipDecision {
  decision: "Ship" | "Hold" | "Reject"
  rationale: string
  author: string
  ts: string
  overridesVerdict: boolean
}
```

### GuardLogEntry

```typescript
GuardLogEntry {
  ts: string
  proj: string
  sess: string
  tool: string
  fingerprint: string
  rule: "R1" | "R2" | "R3"
  dec: "ALLOW" | "WARN" | "BLOCK"
  reason: string
}
```

### EvalDesign

```typescript
EvalDesign {
  projectId: string
  status: "no_design" | "observation_ready" | "confirmed"
  confirmedDimensions: ShowcaseCategory[]
  calibrationSet: CalibrationScenario[]
  measurementRecommendation?: MeasurementRecommendation
}
```

---

## Decision Log

The following decisions were made during the design and build of AgentScore. Each decision captures the question, why it matters, and the answer.

---

### Q1 - Attach-unit & persistence

**Question:** What units do you store scores on (span, trace, session, agent+window) vs compute at query time? The field leaves "agent-over-time" as an ephemeral dashboard facet - persisting it as a versioned object is your main differentiator.

_Why it matters: the granularity you store at defines what questions you can answer and how fast. Store too coarsely and you lose the evidence needed to diagnose regressions; store too finely and storage costs scale with traffic. This is a load-bearing architectural choice that is hard to reverse once production data exists._

**Answer:**

**Persist:**
- **Session/trace level** - the primary scoring unit. One session = one completed trace. Store the composite score, per-dimension scores, per-eval pass/fail, verdict, and token/latency metadata.
- **Run level** - aggregate of sessions within a named evaluation run (mean score, pass rate, dimension breakdowns). Persisted as a snapshot so historical run comparisons are fast.
- **ScoringProfile version** - the exact eval configuration used for each run, versioned and immutable once a run is scored against it.

**Compute at query time (ephemeral):**
- Span-level intermediate scores - spans feed session scores but do not need to be individually persisted after rollup.
- Agent-over-time trend lines - computed from persisted run aggregates on demand.
- Rolling window scores (last 7 days, etc.) - derived at query time from persisted session records filtered by date.

Rule of thumb: if a client would be upset to lose it after a scoring run finishes, persist it.

---

### Q2 - Roll-up formula

**Question:** How do span -> trace -> agent scores aggregate? The doc recommends the Autorubric clamped weighted-average and flags that trace -> agent aggregation (mean vs pass-rate vs percentile vs worst-dimension) needs an explicit choice.

_Why it matters: the aggregation formula is the score. A flawed formula - one that lets a strong Correctness number mask a Safety failure - produces misleading verdicts and erodes trust. Every client-facing number traces back to this choice._

**Answer:**

| Level | Formula | Rationale |
| --- | --- | --- |
| Span -> Session | Clamped weighted average: `clamp(Σ(score × weight) / Σweight, 0, 100)` | Mirrors Autorubric; stable, continuous, respects per-eval weights set in the ScoringProfile. |
| Session -> Run | Mean of session scores, with pass-rate as a secondary signal | Mean gives the headline number; pass-rate (% sessions above the "Ship" threshold) answers the ship question more directly. Show both. |
| Run -> Agent trend | Rolling mean of run scores over the selected window | Simple to explain to users. Weighted by session count per run to avoid small noisy runs distorting the trend. |

**Dimension aggregation:** use worst-dimension as a soft gate - if any dimension scores below its threshold, the overall verdict cannot exceed "Review" even if the composite is high. This prevents a strong Correctness score masking a Safety failure.

**Pass@k:** add as a supplementary metric on the Run view for the pre-ship grading use case.

---

### Q3 - Online/offline parity

**Question:** Should one evaluator definition run in both the verify harness (offline) and live OTLP stream (online)? Also - what triggers "trace complete" since arbitrary OTLP has no end-of-conversation signal.

_Why it matters: if offline (staging) and online (production) scoring use different logic, the pre-ship grade is meaningless. Parity is the foundation of the product's core promise._

**Answer:** Yes - one ScoringProfile definition runs in both contexts. The same eval entries, weights, and thresholds apply whether scoring is triggered by a completed offline run or by a live OTLP trace.

**"Trace complete" signal:**
- **Default:** 3-minute inactivity window (no new spans on the same trace ID for 3 minutes). The 3-minute value should be validated against real agent traffic before hardcoding.
- **Configurable per agent:** short-lived agents can use a 30-second window; long-running orchestrators can be configured up to 30 minutes.
- **Explicit end signal:** if the agent emits a terminal span with a recognized convention (e.g. `openinference.span.kind = AGENT` on the root span ending), use that as an immediate trigger rather than waiting for the timeout.
- Scoring is always async - never blocks the ingestion path.

---

### Q4 - Sampling posture

**Question:** Do you do head-style flat-% (what everyone does) or outcome-biased tail sampling ("always score errors/slow traces, sample the rest")? Pair with an async queue so scoring never blocks ingestion.

_Why it matters: sampling strategy determines cost structure and data quality at the same time. Head sampling is simple but can miss tail failures; outcome-biased sampling captures high-signal events but is more complex. This choice affects margins, infrastructure design, and the trustworthiness of the score._

**Answer:** Percent-style for now. Percent-based is an OTel standard and easily implemented. If demand exists for outcome-based / rate-limited sampling (N traces/spans per second/minute/hour), add it later.

---

### Q5 - Statistical rigor

**Question:** Do you add CIs, pass@k, and paired significance tests? This is nearly absent in the field as a native UI feature and would be a meaningful differentiator, cheap to add on top of stored scores.

_Why it matters: without confidence signals, a "Ship" verdict on 12 sessions looks identical to one on 1,200. That is how AI eval tools lose credibility - confident-sounding output on thin data. Getting this right is a trust differentiator, not a safety net._

**Answer:** Yes - add all three, phased.

| Signal | When to show | Implementation cost |
| --- | --- | --- |
| Confidence interval | Always; widen the bar when N is small. Show 95% CI on dimension scores. Gate the "Ship" verdict behind a minimum N (recommend 30 sessions). | Low - Wilson score interval on pass/fail evals; standard error on continuous scores. |
| pass@k | Run view and pre-ship grading. "Passed X of last k runs" is more decision-relevant than a point estimate for release. | Low - count from existing run records. |
| Paired significance test | Run comparison view. Show whether the delta between two runs is statistically meaningful or within noise. | Low - paired t-test or Wilcoxon on session scores. Already have the per-session data. |

Research confirms this is absent as a native UI feature across main competitors (LangSmith, Langfuse, Arize Phoenix). Braintrust documents confidence intervals and pass@k as methodology guidance in their docs but does not surface them natively in their eval UI. This is a genuine differentiator in the UI layer. [Ref 1, 2]

---

### Q6 - Judge technique & score model

**Question:** Confirm the g-eval kind uses logprob weighting for stable continuous scores; decide whether human overrides feed back into judge prompts.

_Why it matters: the score model determines how stable and predictable scores are. Discrete sampled scores produce jagged trend lines that confuse users; logprob-weighted scores are smooth and reliable. The feedback loop decision affects how the judge evolves over time and whether you can audit why it changed behavior._

**Answer:**

**Score model:** Use logprob-weighted G-eval. Have the judge output a score from 1-5 (or 1-10) and weight by the token log-probability of each score token. This produces a stable continuous value rather than a sampled discrete class - essential for the rolling trend story. Backed by the G-Eval paper (Liu et al., 2023, arXiv:2303.16634): logprob weighting achieves better Spearman correlation with human judgments on the SummEval benchmark. [Ref 3]

**Human override feedback loop:** Log overrides now; do not feed them back into judge prompts at launch.

Phased plan:
1. **Launch:** log every human override with the original score, the override, and the session context.
2. **Fast-follow:** surface calibration opportunities - "your human reviewers disagree with the judge on Safety 18% of the time; here are the 5 most common patterns."
3. **Later:** few-shot examples from confirmed overrides injected into judge prompts, with a before/after calibration test before any prompt change ships.

---

### Q7 - Agent differentiation in setup

**Question:** How should we differentiate agents in setup?

_Why it matters: if agents aren't reliably distinguished, you can't build per-agent profiles, track improvement over time, or compare runs accurately. Misidentification mixes scores across agents, making every trend line meaningless._

**Answer:** Agents are identified by a **behavioral fingerprint**, not by a name they declare. The fingerprint is a stable hash of:
- `resource.service.name` (OTel standard - set by the framework or operator)
- The set of tool names called across recent traces
- The LLM model ID(s) used
- Handoff patterns (which agent names appear in span parent/child relationships)

Known agents are matched on first trace of a new session. A genuinely new agent (new service name + new toolset) gets a new profile created automatically. The friendly name defaults to `resource.service.name`, which frameworks set predictably.

| Framework | Where the agent name comes from |
| --- | --- |
| LangGraph | `resource.service.name`; graph name if explicit |
| LangChain | `resource.service.name`; chain class name as fallback |
| LangSmith | Project name + run type (chain/tool/llm/retriever) |
| Langfuse | Trace name + session ID metadata |
| CrewAI / AutoGen | `resource.service.name`; agent role names in span names |
| OpenAI Agents SDK | Agent name attribute on the root span |

---

### Q8 - Setup with OTel

**Question:** How does setup work with OTel or LangFuse?

_Why it matters: setup is the first impression and the highest drop-off point. A frictionless path - no SDK, no field mapping - is what makes the "3 steps" story credible. If setup is painful, customers churn before they see their first score._

**Answer - OTel push (new agent or any OTel-compatible framework):**

1. API key automatically created in AgentScore (one per tenant, never per-agent).
2. Add AgentScore as an OTLP/HTTP exporter in the existing telemetry config:
   - Endpoint: `https://ingest.agentscore.io/otel/v1/traces`
   - Header: `Authorization: Bearer <api-key>`
3. Run the agent once. AgentScore receives the trace, fingerprints the agent from its behavior, creates an agent profile, and marks it ready to score. No SDK, no field mapping, no per-agent config.
4. User completes scoring profile setup (profile picker -> judge -> test cases) with sensible defaults preconfigured.

---

### Q9 - How does the score stay current?

**Question:** Do you do on-demand only, scheduled refresh, or continuous/near-live scoring?

_Why it matters: a product about "quality over time" can't require the client to keep clicking "score me."_

**Answer:** Scheduled refresh (daily). Keep "Score now" as an on-demand button. Treat continuous/near-live as a later upgrade for high-volume clients. Scheduled refresh delivers the "improve over time" promise cheaply and reuses most of what we have.

---

### Q10 - What does "current quality" actually measure?

**Question:** Rolling window of recent activity, version-pinned grade, or both?

_Why it matters: it determines what the headline number means and how clients reason about it._

**Answer:** Both, side by side. A rolling "how's my agent doing" trend for ongoing health, plus a version-pinned grade for the ship decision. They answer two different client questions and agent versions are already tracked internally.

---

### Q11 - Which moment do we ship first?

**Question:** Pre-ship grading ("should I ship this?") or production tracking ("is it staying good?")?

_Why it matters: these are different experiences and we likely can't polish both at once._

**Answer:** Production tracking first. The LangChain State of AI Agents 2024 report (n=1,300+) found 51% of respondents already use agents in production - the majority of our addressable market already has something running and will want to track it before they need pre-ship grading. [Ref 4]

---

### Q12 - How do we express confidence in the verdict?

**Question:** Show the grade only, or show a confidence signal and hold back a confident verdict until we've seen enough data?

_Why it matters: a "Ship" verdict based on 8 lucky interactions is dangerous and erodes trust._

**Answer:** Show a confidence signal and hold back a confident verdict until we've seen enough data. It's cheap (math on data we already collect), it directly protects the ship decision, and no competitor surfaces this natively in their eval UI.

**Implementation specifics:**
- Show session count and a margin of error on every score.
- Minimum 30 sessions before a "Ship" verdict is issued; below that, show "Insufficient data - verdict pending." Note: 30 sessions is a product policy threshold, not a statistical requirement. The Wilson score interval is reliable from approximately n=10. 30 sessions is chosen to ensure a meaningful usage baseline and to avoid issuing verdicts on single-session warm-up runs.
- Display 95% confidence intervals on dimension bars in the run view.
- If we do not have enough evidence to make a verdict with confidence, display a clear message to the user with an estimate (if available) based on current ingestion speed on how long until we can provide a score.

---

### Q13 - How deep is the "what to improve" view?

**Question:** Headline grade only, + dimension breakdown, or + per-check detail with the ability to drill into specific interactions as evidence?

_Why it matters: "improve over time" is empty if clients can't see what's dragging the score._

**Answer:** Per-check detail with drill-in (option c), with the trend shown at the dimension level so clients can see which theme is improving or regressing. Per-interaction evidence is already captured; this is primarily an experience decision.

---

### Q14 - How do we handle cost and coverage?

**Question:** What is the default sample size, can clients raise it, and how are high-volume clients handled? This connects to pricing and margins.

_Why it matters: scoring runs cost money (each check often calls an AI model), so this ties directly to pricing and margins._

**Answer:** Ship with a sensible default sample cap, make it adjustable, and treat "score more for more confidence" as a potential paid lever.

| Tier | Default sampling rate | Floor guarantee |
| --- | --- | --- |
| All plans (default) | 10% | Minimum 100 sessions/day scored regardless of % (so low-volume agents get adequate coverage) |
| User-adjustable | 1%, 5%, 10%, 25%, 50%, 100% | UI control in agent settings; lower = cheaper, higher = more confidence |
| Smart override (always sample) | 100% on errors, timeouts, and guard triggers | High-signal sessions always scored regardless of sampling rate |
| High-volume cap | Hard daily cap (TBD with Pricing) | Excess traffic sampled down automatically; client is notified when cap is reached |

Note: the 10% default is an internal product assumption, not an industry standard. Langfuse and OTel both default to 100% trace capture. The 10% figure needs validation - it may set a false confidence floor. Revisit with Pricing before shipping.

The "score more = more confidence" narrative connects directly to Q12 (confidence intervals): raising the sampling rate visibly narrows the CI bands in the UI, which is an intuitive way to explain the value of higher coverage tiers.

---

### Q15 - How customizable are the checks?

**Question:** Curated profiles the client picks from, or clients tune weights and add/remove checks?

_Why it matters: positioning - "curated and trustworthy" vs "fully tunable."_

**Answer:** Curated profiles at launch, with "clone and customize" as a fast-follow.

**Phasing:**
1. **Launch:** curated profiles only. User picks a profile type-matched to their agent (ATA, CURA, Coding, etc.); profile covers Correctness, Safety, Efficiency, Tool Use, Consistency, Relevance with sensible defaults. Faster time-to-value, easier to trust and stand behind.
2. **Fast-follow:** "Clone and customize" - user clones a curated profile and adjusts weights, thresholds, and which evals are enabled. The versioned ScoringProfile system already supports this; it's primarily a UX addition.
3. **Later:** custom eval authoring (write your own eval question + judge criteria). High support burden; defer until we understand what curated profiles are missing from real usage data.

---

## Phasing

### Phase 1 - Foundation

- Fleet View with agent cards
- Project View with runs table and activity log
- Run View with sessions table
- Session View with scoring and attribution
- Agent Settings (profile, judge, sampling)
- OTel ingestion pipeline
- Core 6 scoring dimensions
- PASS / PARTIAL / FAIL verdict
- Safety Override
- Ship Decision recording
- Basic scoring profiles (8 pre-built templates by agent type)
- Runtime Guard (R1 / R2 / R3)
- GitHub Actions integration
- Tosca Test API integration

### Phase 2 - Evaluation Platform

- ASSERT spec-to-eval pipeline
- EvalDesign view (observation + spec paths)
- Profile versioning and regrading
- Fingerprint-based profile auto-assignment
- Calibration set management (Nightmare / Reality / Dream)
- Add Profile flow (3-step wizard)
- LLM Judges view and management
- Run Comparison view
- Export as calibration case
- Extended dimensions (groundedness, instructionFollowing, transparency, robustness, communication)
- Pass^k reliability metric
- Preliminary score badge
- Integrations view (Tosca Cloud, AI Workspace, qTest, Azure DevOps, Jenkins)

### Phase 3 - Scale and Intelligence

- Cross-cloud routing (AWS / Azure / GCP)
- Deterministic Oracles
- Multi-tenant and external customer access
- Automated anomaly detection and alerting
- Continuous eval (score every session without manual triggering)
- A/B model evaluation workflows

---

## Success Metrics

| Metric | Phase 1 target | Phase 2 target |
| --- | --- | --- |
| Time from agent registration to first score | < 15 minutes | < 5 minutes (with fingerprint match) |
| Scoring pipeline P95 latency per session | < 30s | < 15s |
| Runtime Guard P95 latency | < 50ms | < 50ms |
| LLM judge cost per session (P95) | < $1.50 | < $1.00 |
| Agents scored per day (Tricentis internal) | 100 | 500 |
| Deployment gates using AgentScore | 2 | 8 |
| Profile adoption rate (agents with a profile vs. total) | 60% | 85% |

---

## Open Questions

1. **Sampling default:** Should newly onboarded agents default to 100% sampling or a lower rate? 100% maximizes early signal but may be too expensive at scale.
2. **Multi-run verdict:** Should a project-level "current verdict" be computed from the aggregate of recent sessions, or only from the most recent run?
3. **Attribution on PARTIAL:** Should Attribution always run on PARTIAL sessions, or only on FAIL? Currently PARTIAL triggers Attribution (non-PASS). This may be overly broad for PARTIAL sessions that are "acceptable quality."
4. **Calibration set minimum size:** Is there a minimum number of scenarios per category before a profile should be considered ready for production use?
5. **Guard R3 threshold:** The "3 consecutive inspect calls" threshold for R3 may need tuning for diagnostic agents (CURA) that legitimately make many read-only calls.

---

## References

1. Braintrust, _LLM Evaluation Guide_ (confidence intervals as methodology guidance) - https://www.braintrust.dev/articles/llm-evaluation-guide
2. Braintrust, _Pass@k Encyclopedia Entry_ - https://www.braintrust.dev/encyclopedia/pass-at-k
3. Liu et al., _G-Eval: NLG Evaluation using GPT-4 with Better Human Alignment_, 2023 - https://arxiv.org/abs/2303.16634
4. LangChain, _State of AI Agents 2024_ (51% of respondents already use agents in production, n=1,300+) - https://www.langchain.com/stateofaiagents
