# AgentScore

**Know if your AI agent is ready to ship.**

> **PRD:** [AgentScore PRD (Draft)](https://tricentis.atlassian.net/wiki/x/xAAIyQ) — Confluence

AI agents fail in ways unit tests can't catch: they hallucinate context, select the wrong tool, repeat themselves in loops, or expose credentials they were never meant to touch. AgentScore gives every agent session an evidence-backed verdict — PASS, PARTIAL, or FAIL — with a composite 0–100 score, an A–F grade, a Ship / Review / Don't Ship recommendation, and on failure, a root-cause attribution that points to the exact tool call that went wrong.

---

## The problem

Testing AI agents with deterministic assertions misses the failure modes that matter. An agent can pass every assertion and still:

- Hallucinate a fact not present in the provided context (Harmony failure)
- Reach the right answer using 3× more tool calls than necessary (Agency failure)
- Produce different answers to semantically equivalent questions in the same sprint (Stability failure)
- Pass locally but regress when the same scenario is run again in CI (Reliability failure)
- Include raw credentials in its output (Safety override → forced FAIL)

AgentScore catches these by running parallel LLM judges over the canonical session trace, not the final output.

---

## How it works

Each session is evaluated across up to six dimensions by parallel judges:

| Dimension | What it measures |
|---|---|
| **Benchmark Performance** | Did the agent complete the task correctly? (`task_success`, `completion_rate`, `prompt_compliance`) |
| **Value Efficiency** | Did it stay within cost budget? (`value_cost_ratio`, `p95_tail_cost`) |
| **UX Signal** | Was it fast and reliable enough for the end user? (`latency_score`, `error_rate_score`, `abandonment_score`) |
| **Harmony** | Did the output stay grounded in the context it was given? (`context_grounding`, `spec_adherence`, `hallucination_rate`) |
| **Stability** | Does it produce consistent answers across semantically equivalent inputs? (`cross_variant_consistency`, `noise_robustness`) |
| **Agency** | Did it choose tools efficiently and recover from failures? (`tool_selection_accuracy`, `planning_efficiency`) |

Scores combine into a **composite 0–100** with an **A–F grade**. Any non-PASS session triggers a conditional Attribution judge that outputs a structured root cause, confidence level, evidence chain, and actionable recommendations.

### Safety override

If a safety signal fires (credential exposure, PII leak, prompt injection, path violation), the verdict is overridden regardless of dimension scores — Critical signals force FAIL, High signals force PARTIAL.

### Reliability (pass^k)

Reliability is computed across Runs, not within a single Run. It measures what fraction of scenarios pass consistently every time they're run — catching agents that look fine in isolation but regress under repetition.

### Runtime guard

Before each tool call, a synchronous guard check (<50ms P95) detects:
- **R1** — exact repeat with identical arguments → block
- **R2** — same fingerprint that previously returned an error → warn
- **R3** — inspect-family tool called ≥3× consecutively without an action step → warn

---

## Prototype

```bash
pnpm install
pnpm dev
```

Requires the `aura-ui` design system repo cloned at `../Tricentis/aura-ui`. Built with React, Vite, and the Aura design system. Supports light and dark mode — toggle in the topbar.

### Views

- **Fleet** — all projects with A–F grade, composite 0–100 score, verdict, reliability, and ATC beta label
- **Project** — run history, pass^k (multi-run consistency), Compare Runs button, Evaluation Design status
- **Run** — session table with composite scores; Export as calibration case; Compare with prior run
- **Session** — full score breakdown (3–6 dimension bars), Attribution panel, Shipping Decision log, Markdown/JSON report export
- **Compare Runs** — side-by-side run diff with per-scenario score deltas across all dimensions
- **Evaluation Design** — three paths: Observation-Based (from shadow sessions), Spec-Based (generate from agent description), Calibration Set (Nightmares / Reality / Dreams)
- **Integrations** — Tosca Test API, Tosca Cloud review panel, AI Workspace live monitoring, AI Workspace version scoring, qTest AI Chat inline verdict card, GitHub Actions / Azure DevOps / Jenkins CI checks, Python SDK, TypeScript SDK, MCP server
- **Guard Log** — live decision stream with R1/R2/R3 annotations
- **Metrics** — OTLP metric catalog with live session counts
- **LLM Judges** — judge configuration (provider, model, role)

---

## Calibration taxonomy

Every project's evaluation design is anchored by three scenario types:

| Category | Purpose |
|---|---|
| **Nightmares** | Adversarial cases sourced from real failure patterns — the agent must handle these before shipping |
| **Reality** | Baseline happy-path scenarios representative of production traffic |
| **Dreams** | Stretch goals that define what excellent looks like |

A calibration set without Nightmare scenarios is flagged as incomplete — agents that haven't been tested against their known failure modes shouldn't ship.

---

## Shipping decisions

Teams record a formal shipping decision on any session that diverges from the auto-verdict:

- **Ship** — proceeding despite PARTIAL (with rationale)
- **Hold** — blocking despite PASS (e.g., adjacent risk, incomplete calibration)
- **Reject** — permanent rejection with documented reasoning

Decision log entries are stored with the session record and surfaced in the JSON/Markdown report.

---

## Phase 2 integrations

AgentScore surfaces inside the tools teams already use:

- **qTest AI Chat** — inline verdict card with grade and top failing dimension
- **Tosca Cloud** — verdict in the review panel without leaving Tosca
- **AI Workspace** — live session streaming + automatic version scoring (grade-gated model upgrades)
- **GitHub Actions / Azure DevOps / Jenkins** — PR checks that block merge on FAIL
- **MCP server** — `evaluate_session` and `guard_tool_call` as MCP tools for any compatible agent framework
- **Python / TypeScript SDKs** — two-line wrapper for LangGraph, OpenAI Agents SDK, and custom loops
