# AgentScore

**Know if your AI agent is ready to ship.**

AgentScore is a Tricentis internal-alpha product that scores AI agents the way a test suite scores code. Agents are instrumented with OpenTelemetry; AgentScore ingests the resulting traces and runs parallel LLM judges across a set of quality dimensions (correctness, efficiency, relevance, safety, consistency, tool use, and more). Each scoring run returns a composite 0–100 score, an A–F grade, and a plain Ship / Review / Block verdict — and when a run falls short, a root-cause attribution pass points to the exact trace and tool call responsible.

This repository is a workspace of independent sub-projects, not a single deployable app. Each folder below has its own README, dependencies, and (where applicable) its own git history before being folded in here.

## Folders

### `agent-score/`
The product prototype: a React + Vite + MUI frontend (using `@tricentis/aura`) that renders the AgentScore back office — agents, scoring runs, dimension breakdowns, scoring profiles, LLM judges, Runtime Guard logs, and more. This is the main UI referenced throughout the other folders. See `agent-score/README.md` for the product concept and scoring model in detail.

### `agent-score-app/`
A newer, simplified React + Vite + `@tricentis/aura` frontend aimed at the Domain Practitioner persona (a tester or other domain expert with no AI background), as opposed to `agent-score/`'s AI-engineer-facing back office. Currently covers the Home dashboard and Agent Overview tab on mock data. See `agent-score-app/README.md` to run it and `plans/2026-08-03-agent-score-app-home-overview.md` for scope.

### `agent-score-marketing/`
A single-page static marketing site (`index.html`, no build step) introducing AgentScore to internal Tricentis teams: problem statement, how it works, capabilities, quality dimensions, use-case scenarios, FAQ, and a "Request access" form (Formspree-backed).

### `agent-score-skill/`
A Claude Code skill (`/agent-score`) that instruments a project with OpenTelemetry and points the exporter at AgentScore's ingest endpoint. Detects the project's language/framework, installs the needed OTEL packages, and walks the user through setting an AgentScore API key.

### `agent-score-video/`
A Remotion project used to render AgentScore's marketing/explainer videos, including TTS-generated voiceover (`scripts/generate_vo.py`, `public/vo*.wav`) and rendered output (`out/`).

### `test-agent/`
A small Python agent (Anthropic SDK, `claude-haiku-4-5`) with a mock tool set (`tools.py`) and a library of realistic ATA-style test scenarios (`scenarios.py`). Used to generate representative OpenTelemetry traces (saved to `traces/`) for exercising and demoing AgentScore against a real agent.

### `docs/`
Product documentation: the PRD, product plan, sales pitch outline, FAQ, an annotated roadmap, competitive teardown (Decagon), billing-model research, a frontend API reference, example agent specs (Jira/ATC formats), an interview script, and a slide deck (`docs/deck/`).

### `.github/`
CI workflow (`workflows/notify-demers-demos.yml`) that, on changes to `agent-score/` or `agent-score-marketing/` on `main`, dispatches a sync event to the `Tricentis-PM-Tools/demers-demos` repo, which mirrors these folders via an auto-merged PR.

## Status

Phase 1 (internal pilot) is live for internal Tricentis teams. Phase 2 (closed external beta) is planned for Q4 2026. Lead PM: Andrew Demers (a.demers@tricentis.com).
