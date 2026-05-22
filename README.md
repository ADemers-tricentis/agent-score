# AgentScore

**Know if your AI agent is ready to ship.**

AgentScore evaluates AI agent sessions with parallel LLM judges (Security, Correctness, Quality) plus a conditional Attribution judge on failure. Every session produces an evidence-backed PASS / PARTIAL / FAIL verdict and, on failure, a structured root-cause attribution.

> Phase 1 scope: ATA (`autonomous-service`) only. Phase 2 extends to ATC, AI Workspace, CURA, and external agents.

---

## Prototype

`prototype.html` is a self-contained interactive prototype covering the full product surface:

- **Fleet view** — project tiles with pass rate, primary verdict, reliability label, and type tag
- **Project / Run / Session hierarchy** — Fleet > Project > Run > Session
- **Session score card** — Security, Correctness, Quality judge scores; PASS/PARTIAL/FAIL verdict; Ship/Review/Don't Ship indicator; composite score (Phase 2 preview)
- **Attribution panel** — root cause (FailureTypeEnum), confidence, evidence chain, recommendations (non-PASS sessions only)
- **Guard log** — `POST /guard/pre-tool-use` decisions with R1/R2/R3 rule annotations
- **Metrics dashboard** — all 7 OTLP metrics from the catalog
- **Session reports** — Markdown and JSON tabs with full artifact path

Open `prototype.html` directly in a browser. State persists in `localStorage`.

---

## Evaluation pipeline

Three concurrent LLM judges over the canonical session trace:

| Judge | Signals |
|---|---|
| **Security** | `prompt_injection_detected`, `credential_exposure`, `pii_leak`, `path_violation` |
| **Correctness** | `task_success`, `prompt_compliance`, `tool_success_rate` |
| **Quality** | `trajectory_efficiency`, `faithfulness`, `relevance`, `recovery_diversity` |

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
| `AgentScore.eval.metric_score` | gauge | Per-signal score 0..1, NaN when N/A (attrs: `metric`, `category`, `passed`, `severity`, `project`) |
| `AgentScore.eval.root_cause` | counter | Attribution distribution, non-PASS only (attrs: `root_cause`, `agent_fault`, `project`) |
| `AgentScore.session.duration` | histogram | Session wall-clock latency (ms) |
| `gen_ai.client.token.usage` | histogram | Token consumption, OTel GenAI semconv (attrs: `gen_ai.token.type`, `AgentScore.role`, `project`) |
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
