# AgentScore MCP Server

## Problem Statement

Setting up AgentScore today requires finding an ingest URL and key, picking the right OpenTelemetry instrumentor for the agent's stack, wiring a bootstrap file into the entrypoint, and verifying the span tree locally before anything is scored. That is out of reach for a non-technical user - someone who owns or cares about an agent's quality but doesn't write its instrumentation code, doesn't know what a span is, and can't evaluate a dependency diff. The only automated path today, a Claude Code skill, still assumes an engineer is driving: it shows a plan of packages and file diffs and waits for a technical approval.

There's also no feedback loop once setup is done. A scored agent produces a score and per-dimension breakdown in the AgentScore UI, but turning "this dimension is low" into "change this" is still a manual, technical translation step - one a non-technical user can't make on their own.

## Goals & Success Metrics

**Goals**
1. A non-technical user can get their agent onboarded to AgentScore - stack detected, instrumentation installed, bootstrap wired, spans verified - by asking for it in plain language through whatever AI assistant they already use, with no OTel knowledge and no diff to approve.
2. That same user can ask "how's my agent doing / what should I fix" and get back concrete, plain-language suggestions tied to their actual scoring run, without opening the AgentScore UI or translating dimension scores into code changes themselves.

**Success metrics**

| Metric | Measurement |
| --- | --- |
| Setup completion without help | % of MCP-driven setups a non-technical user completes to a passing `verify_setup` without escalating to a technical teammate or AgentScore support |
| Time to first scored trace | Median time from first `apply_setup` call to the "n of 20 traces" threshold being reached |
| Suggestion comprehension | % of `get_scoring_suggestions` responses the user acts on without asking a technical teammate to translate them first (proxy: a follow-up re-verification call within 7 days) |

## Target Users

| Persona | Description | Priority |
| --- | --- | --- |
| Non-technical AgentScore user | A PM, solutions engineer, customer-success contact, or other business stakeholder who owns or is accountable for an agent's quality, but doesn't write code or know OpenTelemetry. Interacts entirely in natural language through whichever AI assistant they already use. | Primary |

This replaces the Claude Code skill (`agentscore-setup`) as the supported onboarding path going forward. The skill assumed a technical operator; this does not, and is not scoped around preserving or coexisting with it.

## Requirements

### Must Have (P0)

- `detect_agent` - detects language, framework, LLM SDK, entrypoint, and whether the repo is already set up. No jargon in the response; the client renders it in plain language.
- `plan_setup` - returns the instrumentation plan (what will be installed and changed, in terms a non-technical user can approve - "I'll add tracing to your agent so it can be scored," not a package/diff list) before anything is written. No writes happen before this is confirmed.
- `apply_setup` - installs the instrumentor, writes the bootstrap file, and wires the entrypoint. Idempotent: re-running it when `detect_agent` reports `already_set_up` changes nothing.
- `verify_setup` - checks the span tree and transport (root span, prompt text, tool spans, identity signal, accepted operation name) and reports pass/fail in plain language with a concrete next step on failure, not a check name a non-technical user can't act on.
- `get_scoring_suggestions` - given an agent identifier, returns current score, which dimensions are low, why, and concrete suggested changes, in language a non-technical user can act on or hand to someone who can.
- The ingest key is never accepted as a tool parameter and never appears in any tool output. The user stores it only through their AI assistant's own secret-storage mechanism (settings UI, keychain, or env var), never by typing it into chat or passing it as a tool argument. Server-side validation rejects any tool input matching the `tk_` key prefix.

### Should Have (P1)

- `check_status` - reports whether an agent is "Setting up," "Learning your agent" (n of 20 traces), or actively scored, without the user opening the AgentScore UI.
- Structured error responses mapped to AgentScore's status-code table (401/403/429/503), translated into plain-language causes and next steps rather than a raw HTTP error.

### Nice to Have (P2)

- Subscribable MCP resource for scoring-suggestion updates (push instead of poll), for clients that support resource subscriptions.
- Non-Python/Node language support beyond an env-var-only fallback.

## Scope

### In Scope
- An MCP server exposing the five P0 tools above, designed so every response can be rendered in plain language by the calling AI assistant.
- Read-only calls to the AgentScore API for score/dimension data behind `get_scoring_suggestions` and `check_status`.
- Retiring the Claude Code skill's role as the supported onboarding path; this server becomes the one path going forward, for technical and non-technical users alike.

### Out of Scope
- Redesigning the AgentScore scoring engine or UI.
- Preserving or extending the Claude Code skill - it is being replaced, not maintained alongside this.
- Push/webhook delivery of suggestions (see Future Considerations).
- Language coverage beyond Python/Node first-class support (an env-var-only fallback still applies for other languages).

### Future Considerations
- Push-based suggestion delivery once scoring crosses the trace threshold.
- Expanded language coverage (Go, Java, .NET).
- A guided or assisted path for installing/configuring the MCP server itself, if that setup step proves to be a barrier (see Open Questions).

## Technical Approach (high-level)

- Setup tools need filesystem access to the user's agent repo and must preserve the "never touches anything outside the repo" and "key never passes through the assistant" guarantees, which points toward a local/stdio MCP server rather than a remote/hosted one.
- The detect/instrument/verify logic may reuse the proven approach from the retiring Claude Code skill's scripts as an implementation starting point, but the server has no runtime dependency on the skill and must work standalone.
- **Two setup paths, not one.** `detect_agent` has to tell these apart and `plan_setup` has to describe each honestly, since they're very different experiences for a non-technical user:
  - **Already instrumented.** The agent already exports OpenTelemetry (or OpenInference/Traceloop/Langfuse/Logfire) spans somewhere. `apply_setup` only needs to add AgentScore as an additional exporter target pointed at the existing pipeline - no new instrumentor, usually no code the user has to reason about beyond confirming "point my existing traces at AgentScore too." This is the easy case and should resolve in one `plan_setup` → `apply_setup` → `verify_setup` pass.
  - **Not instrumented.** No telemetry exists yet. `apply_setup` has to install an instrumentor matched to the agent's LLM SDK, add a bootstrap file, and wire it into the entrypoint before anything can be verified - real code is being added to the user's repo, not just a new export target. This is the case the non-technical persona most needs help with, and where `verify_setup` failures (missing root span, no prompt text, wrong operation name) are most likely, so responses need the clearest plain-language explanation of what went wrong and why, since the user has no telemetry background to fall back on.
  - If `verify_setup` fails in the not-instrumented case and the cause isn't obvious from the plain-language explanation, the fallback is surfacing a specific next step the user can hand to a technical teammate, not raw check output.
- `get_scoring_suggestions` and `check_status` read the ingest key from the user's local environment to authenticate against the AgentScore API - the key is read locally to make the API call, never passed through the MCP protocol as a literal value or returned in a tool response.
- Every tool response is structured so the calling assistant can render it conversationally (no file diffs, package names, or span terminology surfaced as the primary content) - the non-technical persona can't act on those directly.

## Dependencies

- **Score and dimension breakdown (exists).** `GET /tenants/{tenant_id}/agents/{agent_id}/score` (`customer/scoring.py:475`) returns `CustomerScoreSummary`, including `dimensions`, `excluded_dimensions`, and `evals_by_dimension` (per-eval scores grouped by dimension). Supporting routes: `GET .../score/history` (`customer/scoring.py:629`) for score over time, and `GET .../score/evals/{eval_slug}/interactions` (`customer/scoring.py:992`) to drill into one eval. This covers the "current score and which dimensions are low" half of `get_scoring_suggestions` and all of `check_status`'s data needs, with no new platform work.
- **Suggested fixes (admin-only, partial match).** No route is named for scoring suggestions. The closest is the improvement advisor, all in `admin/scoring.py`: `POST .../agents/{agent_id}/improvement-advisor` (line 3291) triggers a job and returns 202; `POST .../scoring/runs/{run_id}/improvement-advisor` (line 3350) does the same for a specific run; `GET .../improvement-advisor/runs` (line 3412) lists results. There is no customer-facing advisor route. The "concrete suggested changes" half of `get_scoring_suggestions` therefore depends on either exposing the advisor to customers or deriving suggestions client-side from the dimension breakdown. See Open Questions.
- MCP SDK/runtime choice (official MCP Python or TypeScript SDK).

## Risks & Mitigations

| Risk | Mitigation |
| --- | --- |
| Fuzzier trust boundary between "user" and "MCP client" could leak the ingest key if a client logs tool-call arguments | Hard rule: no tool accepts or returns a value matching the `tk_` prefix; enforce server-side, not just by convention |
| A non-technical user has no way to install/configure an MCP server themselves - that's itself a technical step (editing client config, setting env vars) | Needs an explicit install story (bundled with a client that pre-configures it, or a one-time setup a technical teammate/IT does once); flagged as an open question below |
| Local/stdio-only server limits which AI assistant clients can run the setup tools at all | Document the minimum client capability (local filesystem tool access) needed; scoring-suggestion tools can still work with remote-only clients |
| A non-technical user may not know where to find or create an ingest key in the AgentScore UI | `plan_setup` must give plain-language, jargon-free instructions pointing directly at the Integrations page |

## Open Questions

- The dimension breakdown is already exposed to customers (see Dependencies). The improvement advisor, the only source of suggested fixes, is admin-only and asynchronous (POST returns 202, results fetched later). Do we (a) ask the platform team for a customer-facing advisor route, or (b) have `get_scoring_suggestions` build suggestions from the dimension breakdown and failing evals, with the assistant doing the plain-language translation? Option (a) means a parallel platform dependency and a polling flow; option (b) ships sooner but gives less specific suggestions.
- Do the customer score routes (`/tenants/{tenant_id}/agents/{agent_id}/score`) accept the ingest key for auth, or do they require a user/tenant token? The PRD currently assumes the locally held ingest key authenticates `get_scoring_suggestions` and `check_status`. If it doesn't, that assumption and the key-handling design in Technical Approach need revisiting. Also confirm how the MCP server resolves `tenant_id` and `agent_id` from the user's local setup.
- How does a non-technical user actually get this MCP server connected to their AI assistant in the first place? Who performs that one-time setup step if not the user themselves?
- Should `get_scoring_suggestions` require the ~20-trace threshold strictly, or return lower-confidence suggestions earlier with a confidence flag?

## Timeline & Milestones

TBD - no dates committed yet; depends on resolving the API-dependency and MCP-install open questions above.
