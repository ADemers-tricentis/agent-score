# AgentScore MCP Server

## Problem Statement

Setting up AgentScore today requires finding an ingest URL and key, picking the right OpenTelemetry instrumentor for the agent's stack, wiring a bootstrap file into the entrypoint, and verifying the span tree locally before anything is scored. That is out of reach for a non-technical user - someone who owns or cares about an agent's quality but doesn't write its instrumentation code, doesn't know what a span is, and can't evaluate a dependency diff. The only automated path today, a Claude Code skill, still assumes an engineer is driving: it shows a plan of packages and file diffs and waits for a technical approval.

There's also no feedback loop once setup is done. A scored agent produces a score and per-dimension breakdown in the AgentScore UI, but turning "this dimension is low" into "change this" is still a manual, technical translation step - one a non-technical user can't make on their own.

## Goals & Success Metrics

**Goals**
1. A non-technical user can get their agent onboarded to AgentScore - stack detected, instrumentation installed, bootstrap wired, spans verified - by asking for it in plain language through whatever AI assistant they already use, with no OTel knowledge and no diff to approve.
2. Connecting to AgentScore requires nothing to be installed locally. The MCP server is hosted at an HTTPS URL; the user adds it to their AI assistant as a remote connector and signs in.
3. That same user can ask "how's my agent doing / what should I fix" and get back concrete, plain-language suggestions tied to their actual scoring run, without opening the AgentScore UI or translating dimension scores into code changes themselves.

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

- Hosted as a remote MCP server over HTTPS (Streamable HTTP transport). The user connects by adding the server URL as a custom/remote connector in their AI assistant. No package, binary, or local process to install.
- Sign-in via OAuth 2.1 (authorization code + PKCE, dynamic client registration) against Tricentis identity. The token resolves the user's tenant, so no tool takes a tenant ID or credential as a parameter.
- `detect_agent` - takes a small structured fingerprint that the calling assistant collects with its own file tools (dependency manifest entries, candidate entrypoint filenames, any existing telemetry config) and returns language, framework, LLM SDK, entrypoint, and whether the repo is already set up. The server never receives source code beyond that fingerprint. No jargon in the response; the client renders it in plain language.
- `plan_setup` - returns the instrumentation plan (what will be added and changed, in terms a non-technical user can approve - "I'll add tracing to your agent so it can be scored," not a package/diff list) before anything is written. No writes happen before the user confirms.
- `apply_setup` - returns the exact changes (instrumentor dependency, bootstrap file contents, entrypoint edit) for the calling assistant to write into the repo with its own file tools after the user confirms. The server itself never writes to the user's machine. Idempotent: when `detect_agent` reports `already_set_up`, it returns no changes.
- `verify_setup` - checks the traces AgentScore has actually received from the agent (root span, prompt text, tool spans, identity signal, accepted operation name) and reports pass/fail in plain language with a concrete next step on failure, not a check name a non-technical user can't act on. The user runs their agent once; no local span inspection is needed.
- `get_scoring_suggestions` - for an agent the signed-in user can access, returns current score, which dimensions are low, why, and concrete suggested changes, in language a non-technical user can act on or hand to someone who can.
- The ingest key is never accepted as a tool parameter and never appears in any tool output or server log. Server-side validation rejects any tool input matching the `tk_` key prefix and drops it before logging. The key reaches the agent's runtime only through the user's own secret-storage path (env var or secret manager), never through chat.
- Per-tenant isolation, per-user rate limiting, and audit logging of tool calls on the hosted endpoint.

### Should Have (P1)

- `check_status` - reports whether an agent is "Setting up," "Learning your agent" (n of 20 traces), or actively scored, without the user opening the AgentScore UI.
- Structured error responses mapped to AgentScore's status-code table (401/403/429/503), translated into plain-language causes and next steps rather than a raw HTTP error.

### Nice to Have (P2)

- Subscribable MCP resource for scoring-suggestion updates (push instead of poll), for clients that support resource subscriptions.
- Non-Python/Node language support beyond an env-var-only fallback.

## Scope

### In Scope
- A hosted, HTTPS-accessible MCP server exposing the five P0 tools above, designed so every response can be rendered in plain language by the calling AI assistant.
- OAuth sign-in and tenant resolution for the hosted endpoint.
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
- Listing the hosted server in assistant connector directories so users can add it without pasting a URL.
- Server-side ingest key provisioning (mint a key on the user's behalf and hand it off via a one-time link, never via tool output), if key handling proves to be the remaining setup barrier (see Open Questions).

## Technical Approach (high-level)

- **Hosted remote server, not local/stdio.** The server runs on AgentScore infrastructure behind HTTPS (Streamable HTTP), so users install nothing. Because a remote server cannot touch the user's filesystem, file access moves to the calling assistant: the server returns the plan and the exact file changes, and the assistant reads the repo and writes the changes with its own file tools after the user confirms. This keeps the "nothing outside the repo is touched" guarantee (the server touches nothing at all) and shrinks what the server sees to a small fingerprint instead of source code.
- **Client capability determines the experience.** Assistants with local file tools (Claude Code, IDE assistants) can run the full flow. Chat-only assistants without file access (for example a web chat client) can still run `get_scoring_suggestions` and `check_status`, and for setup can produce the change list to hand to a technical teammate or to paste in. Document this matrix.
- The detect/instrument/verify logic may reuse the proven approach from the retiring Claude Code skill's scripts as an implementation starting point, but the server has no runtime dependency on the skill and must work standalone.
- **Two setup paths, not one.** `detect_agent` has to tell these apart and `plan_setup` has to describe each honestly, since they're very different experiences for a non-technical user:
  - **Already instrumented.** The agent already exports OpenTelemetry (or OpenInference/Traceloop/Langfuse/Logfire) spans somewhere. `apply_setup` only needs to add AgentScore as an additional exporter target pointed at the existing pipeline - no new instrumentor, usually no code the user has to reason about beyond confirming "point my existing traces at AgentScore too." This is the easy case and should resolve in one `plan_setup` → `apply_setup` → `verify_setup` pass.
  - **Not instrumented.** No telemetry exists yet. `apply_setup` has to install an instrumentor matched to the agent's LLM SDK, add a bootstrap file, and wire it into the entrypoint before anything can be verified - real code is being added to the user's repo, not just a new export target. This is the case the non-technical persona most needs help with, and where `verify_setup` failures (missing root span, no prompt text, wrong operation name) are most likely, so responses need the clearest plain-language explanation of what went wrong and why, since the user has no telemetry background to fall back on.
  - If `verify_setup` fails in the not-instrumented case and the cause isn't obvious from the plain-language explanation, the fallback is surfacing a specific next step the user can hand to a technical teammate, not raw check output.
- **Auth for read tools.** `get_scoring_suggestions` and `check_status` authenticate with the user's OAuth token, not the ingest key. The server calls the customer score routes on the user's behalf, scoped to the token's tenant. The ingest key is a write-path credential for the agent's runtime exporter only and is not used by the MCP server for reads. This depends on the customer routes accepting a user/tenant token (see Open Questions).
- Every tool response is structured so the calling assistant can render it conversationally (no file diffs, package names, or span terminology surfaced as the primary content) - the non-technical persona can't act on those directly.

## Dependencies

- **Score and dimension breakdown (exists).** `GET /tenants/{tenant_id}/agents/{agent_id}/score` (`customer/scoring.py:475`) returns `CustomerScoreSummary`, including `dimensions`, `excluded_dimensions`, and `evals_by_dimension` (per-eval scores grouped by dimension). Supporting routes: `GET .../score/history` (`customer/scoring.py:629`) for score over time, and `GET .../score/evals/{eval_slug}/interactions` (`customer/scoring.py:992`) to drill into one eval. This covers the "current score and which dimensions are low" half of `get_scoring_suggestions` and all of `check_status`'s data needs, with no new platform work.
- **Suggested fixes (admin-only, partial match).** No route is named for scoring suggestions. The closest is the improvement advisor, all in `admin/scoring.py`: `POST .../agents/{agent_id}/improvement-advisor` (line 3291) triggers a job and returns 202; `POST .../scoring/runs/{run_id}/improvement-advisor` (line 3350) does the same for a specific run; `GET .../improvement-advisor/runs` (line 3412) lists results. There is no customer-facing advisor route. The "concrete suggested changes" half of `get_scoring_suggestions` therefore depends on either exposing the advisor to customers or deriving suggestions client-side from the dimension breakdown. See Open Questions.
- MCP SDK/runtime choice (official MCP Python or TypeScript SDK) with Streamable HTTP transport support.
- Hosting: a public HTTPS endpoint (domain, TLS, deployment target, secrets management) owned by the platform/SRE team, plus an OAuth authorization server (existing Tricentis identity if it supports OAuth 2.1 with PKCE and dynamic client registration, otherwise a gap).
- Ingestion-side lookup for `verify_setup`: a way to query the received span tree for a given agent from the platform API.

## Risks & Mitigations

| Risk | Mitigation |
| --- | --- |
| Fuzzier trust boundary between "user" and "MCP client" could leak the ingest key if a client logs tool-call arguments | Hard rule: no tool accepts or returns a value matching the `tk_` prefix; enforce server-side, not just by convention |
| Adding a remote connector is still a step in the assistant's settings, and some orgs restrict custom connectors | Reduced to "paste a URL and sign in" with no local install; publish a one-page plain-language guide, and pursue directory listing (see Future Considerations). Org admins can pre-approve the connector once for everyone |
| A public hosted endpoint is a new attack surface: cross-tenant data exposure, token theft, abuse, and prompt injection via tool inputs or returned text | Tenant scoping derived from the OAuth token only (never from tool params), least-privilege read-only scopes, per-user rate limits, input size caps, audit logs, security review before launch; tool output contains no instructions beyond plain-language results |
| The server no longer sees the repo, so `detect_agent` accuracy depends on the assistant sending a good fingerprint | Keep the fingerprint schema small and explicit, return "need more info" requests naming exactly which file to look at, and validate in `verify_setup` against real received traces |
| The hosted server holds no key, but the agent runtime still needs one, and the user must get it there without pasting it into chat | `plan_setup` gives plain-language steps to the Integrations page and the user's own secret store; evaluate server-side provisioning as a follow-up |
| Assistants without local file tools can't apply setup changes | Document the minimum client capability (local filesystem tool access) for the setup flow; suggestion and status tools work with any client that supports remote MCP |
| A non-technical user may not know where to find or create an ingest key in the AgentScore UI | `plan_setup` must give plain-language, jargon-free instructions pointing directly at the Integrations page |

## Open Questions

- The dimension breakdown is already exposed to customers (see Dependencies). The improvement advisor, the only source of suggested fixes, is admin-only and asynchronous (POST returns 202, results fetched later). Do we (a) ask the platform team for a customer-facing advisor route, or (b) have `get_scoring_suggestions` build suggestions from the dimension breakdown and failing evals, with the assistant doing the plain-language translation? Option (a) means a parallel platform dependency and a polling flow; option (b) ships sooner but gives less specific suggestions.
- Do the customer score routes (`/tenants/{tenant_id}/agents/{agent_id}/score`) accept an OAuth user/tenant token that the hosted MCP server can obtain, or do they require a different credential? The PRD now assumes a user token. If the routes only accept the ingest key, the hosted design needs server-side key custody, which conflicts with the key-never-leaves-the-user rule. Also confirm how the server resolves `agent_id` (from the fingerprint, an agent picker tool, or the user's agent list).
- Does Tricentis identity support OAuth 2.1 with PKCE and dynamic client registration for third-party MCP clients, and which Tosca Cloud account types (trial vs. licensed) can authorize? If not, who builds the authorization layer?
- Which team owns hosting and on-call for a public MCP endpoint, and what is the security review path? The SRE constraints already flagged for Beta apply here.
- Does `verify_setup` have a platform API to read received span structure per agent, or does it need new ingestion-side work?
- Should `get_scoring_suggestions` require the ~20-trace threshold strictly, or return lower-confidence suggestions earlier with a confidence flag?

## Timeline & Milestones

TBD - no dates committed yet; depends on resolving the API-dependency, OAuth, and hosting-ownership open questions above.
