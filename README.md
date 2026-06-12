# AgentScore

**Know if your AI agent is ready to ship.**

> **PRD:** [AgentScore PRD (Draft)](https://tricentis.atlassian.net/wiki/x/xAAIyQ) — Confluence

AgentScore evaluates AI agent sessions with parallel judges (Benchmark Performance, Value Efficiency, UX Signal) plus a conditional Attribution judge on failure. Every session produces an evidence-backed PASS / PARTIAL / FAIL verdict and, on failure, a structured root-cause attribution.

> Phase 1 scope: ATA (`autonomous-service`) only. Phase 2 extends to ATC, AI Workspace, CURA, and external agents.

---

## Setup

### Prerequisites

- Node.js ≥ 20
- pnpm ≥ 10
- The `aura-ui` design system repo cloned at `../Tricentis/aura-ui` relative to this directory (the React prototype resolves `@tricentis/aura` from that path via a Vite alias)

```bash
pnpm install
node_modules/.bin/vite          # dev server at http://localhost:5173
```

> **Note:** `pnpm dev` triggers a pre-run install check that may block on esbuild's build script approval in pnpm v11. Run `pnpm approve-builds` once to unblock it, or use `node_modules/.bin/vite` directly.

---

## Prototype views

The React prototype (`src/`) covers the full product surface across seven views:

- **Fleet** — project tiles with pass rate, primary verdict, reliability label, and type tag
- **Project** — runs table with pass rate and latest verdict per run; Evaluation Design entry point
- **Run** — sessions table with per-dimension scores and verdict
- **Session** — composite score meter, Benchmark Performance / Value Efficiency / UX Signal dimension bars, safety override alert, Attribution panel, Markdown and JSON report tabs
- **Evaluation Design** — per-project view with three tabs:
  - *Observation-Based* — Measurement Recommendation surfaced from shadow-mode sessions (suggested dimensions, thresholds, seed calibration set from real failure patterns)
  - *Spec-Based* — paste an agent description, generate a ranked list of evaluation questions, select and confirm
  - *Calibration Set* — Nightmares / Reality / Dreams browser with completeness warning when nightmare scenarios are absent
- **Guard Log** — filterable decision stream with R1/R2/R3 rule annotations and allow/warn/block breakdown
- **Metrics** — all 7 OTLP metrics from the catalog with live counts from mock data

---

## Evaluation pipeline

Three concurrent judges over the canonical session trace:

| Dimension | Signals |
|---|---|
| **Benchmark Performance** | `task_success`, `completion_rate`, `prompt_compliance` |
| **Value Efficiency** | `value_cost_ratio`, `p95_tail_cost` |
| **UX Signal** | `latency_score`, `error_rate_score`, `abandonment_score` |

On any non-PASS session, a conditional **Attribution** judge runs and outputs: `rootCause` (FailureTypeEnum), `confidence`, `agentFault`, evidence `chain`, `recommendations`.

**FailureTypeEnum:** `credential_exposure` · `hallucinated_state` · `tool_selection_error` · `pii_exposure`

---

## Runtime guard

Synchronous `POST /guard/pre-tool-use` decision returned in <50ms P95.

| Rule | Behavior |
|---|---|
| R1 | Exact-repeat detected → **block** |
| R2 | Same fingerprint with prior error → **warn** |
| R3 | Inspect streak (same tool ≥3× in last 5 steps) → **warn** |

Fire-and-forget outcome recording: `POST /guard/post-tool-use`

---

## HTTP endpoints

| Endpoint | Description |
|---|---|
| `POST /guard/pre-tool-use` | Synchronous loop-detection decision, <50ms P95 |
| `POST /guard/post-tool-use` | Fire-and-forget outcome recording |
| `POST /sessions/:id/score` | Re-evaluate a finalized session |
| `GET /internal/health/is-alive` | Liveness |

---

## Artifacts

Each session writes to `~/.AgentScore/projects/<service>/sessions/<session-id>/`:

```
raw-otlp/*.ndjson
canonical-v2.json
session-index.json
guard-log.ndjson
<session-id>-<ts>.json
<session-id>-<ts>.md
```

S3 best-effort mirror with `tracePath` redacted. Failure logs to stderr only; never blocks finalization.

---

## OTLP metrics

| Metric | Type | Description |
|---|---|---|
| `AgentScore.eval.outcome` | counter | Session count by verdict (attrs: `verdict`, `project`) |
| `AgentScore.eval.metric_score` | gauge | Per-dimension score 0..1, N/A when not applicable (attrs: `dimension`, `project`) |
| `AgentScore.eval.root_cause` | counter | Attribution distribution, non-PASS only (attrs: `root_cause`, `agent_fault`, `project`) |
| `AgentScore.session.duration` | histogram | Session wall-clock latency (ms); primary input to UX Signal |
| `gen_ai.client.token.usage` | histogram | Token consumption per task; primary input to Value Efficiency (attrs: `gen_ai.token.type`, `AgentScore.role`, `project`) |
| `AgentScore.evaluator.llm_calls` | counter | LLM judge calls per session (attr: `project`) — 3–4 depending on verdict |
| `AgentScore.guard.decisions` | counter | Runtime guard decision stream (attrs: `decision`, `project`) |

Pre-built SigNoz dashboard: `scripts/signoz-dashboard.json`

---

## Phase 2 (planned Q4 2026)

- Reliability as a fourth scoring dimension (`pass^k` across Runs)
- 0–100 composite score and A–F grade
- ATC integration + qTest inline verdict card
- Tosca Cloud review panel
- PR check integration (GitHub Actions, Azure DevOps, Jenkins)
- Python / TypeScript SDK for LangGraph and OpenAI Agents SDK
- MCP server exposing `evaluate_session` and `guard_tool_call`
