# AgentScore Auto Setup and Self-Improvement Loop

## Problem Statement

Setting up AgentScore today requires finding an ingest URL and key, picking the right OpenTelemetry instrumentor for the agent's stack, wiring a bootstrap file into the entrypoint, and verifying the span tree locally before anything is scored. That is out of reach for a semi-technical user - someone who owns or cares about an agent's quality but doesn't write its instrumentation code, doesn't know what a span is, and can't evaluate a dependency diff. The only automated path today, a Claude Code skill, still assumes an engineer is driving: it shows a plan of packages and file diffs and waits for a technical approval.

There's also no feedback loop once setup is done. A scored agent produces a score and per-dimension breakdown in the AgentScore UI, but turning "this dimension is low" into "change this" is still a manual, technical translation step - one a semi-technical user can't make on their own.

Even if suggestions are delivered in plain language, a human is still the courier: they read the suggestion, hand it to someone (or something) that can change the agent, and then check whether it worked. The calling AI agent is already capable of making those changes and re-checking the score. What it lacks is a safe, machine-actionable procedure for doing so.

## Goals & Success Metrics

**Goals**
1. A semi-technical user can get their agent onboarded to AgentScore - telemetry requirements understood, instrumentation done by their own coding agent, spans verified - by asking for it in plain language through whatever AI assistant they already use, with no OTel knowledge and no diff to approve. AgentScore specifies what OpenTelemetry output it needs; the user's coding agent, which knows how the agent is built and run, works out how to produce it.
2. Connecting to AgentScore requires nothing to be installed locally. The MCP server is hosted at an HTTPS URL; the user adds it to their AI assistant as a remote connector and signs in.
3. That same user can ask "how's my agent doing / what should I fix" and get back concrete, plain-language suggestions tied to their actual scoring run, without opening the AgentScore UI or translating dimension scores into code changes themselves.
4. The calling agent is given the inputs it needs to run a semi- or fully automatic self-improvement loop: its own scoring results, structured suggestions with evidence, and a machine-actionable procedure for re-verifying the outcome and recording it. How much autonomy the loop has, and how changes are committed, reviewed, and deployed, is owned by the user and their coding agent. AgentScore supplies inputs and a record; it is not an agent delivery platform and does not manage the user's SDLC or autonomy level.

**Success metrics**

| Metric | Measurement |
| --- | --- |
| Setup completion without help | % of MCP-driven setups a semi-technical user completes to a passing `verify_setup` without escalating to a technical teammate or AgentScore support |
| Time to first scored trace | Median time from first `get_instrumentation_spec` call to the "n of 20 traces" threshold being reached |
| Suggestion comprehension | % of `get_scoring_suggestions` responses the user acts on without asking a technical teammate to translate them first (proxy: a follow-up re-verification call within 7 days) |
| Closed-loop completion | % of suggestions acted on by a calling agent that are followed by a re-score and a `report_update` call |
| Self-update net effect | Median score delta per applied self-update, and % of self-updates rolled back because the re-score regressed |

## Target Users

| Persona | Description | Priority |
| --- | --- | --- |
| Semi-technical AgentScore user | A PM, solutions engineer, customer-success contact, or other business stakeholder who owns or is accountable for an agent's quality, who knows the product-development vocabulary but doesn't write code or know OpenTelemetry. Increasingly builds agents directly in an AI assistant such as Claude, with no way to tell whether they work. Fully non-technical business users are not the target yet; they tend to stall well before an agent exists (for example at initializing a Git repository). Interacts entirely in natural language through whichever AI assistant they already use. | Primary |

This replaces the Claude Code skill (`agentscore-setup`) as the supported onboarding path going forward. The skill assumed a technical operator; this does not, and is not scoped around preserving or coexisting with it.

## Requirements

### Must Have (P0)

- Hosted as a remote MCP server over HTTPS (Streamable HTTP transport). The user connects by adding the server URL as a custom/remote connector in their AI assistant. No package, binary, or local process to install.
- Sign-in via OAuth 2.1 (authorization code + PKCE, dynamic client registration) against Tricentis identity. The token resolves the user's tenant, so no tool takes a tenant ID or credential as a parameter.
- `detect_agent` - takes a small structured fingerprint that the calling assistant collects with its own file tools (dependency manifest entries, candidate entrypoint filenames, any existing telemetry config) and returns whether the agent already exports telemetry and where, and whether it is already set up for AgentScore. The server never receives source code beyond that fingerprint. No jargon in the response; the client renders it in plain language. The server does not need to know the agent's language or framework in order to specify what it needs.
- `plan_setup` - returns a plain-language summary of what getting scored will involve (in terms a semi-technical user can approve - "I'll add tracing to your agent so it can be scored," not a package/diff list) before anything is written. The coding agent's own plan and edits remain its responsibility. No writes happen before the user confirms.
- `get_instrumentation_spec` - returns the telemetry contract AgentScore needs, independent of language and framework: the ingest endpoint, how the key is supplied (env var or secret manager, never chat), the required span structure and attributes (root span, prompt text, tool spans, identity signal, accepted operation name), and the export protocol. It does not return code, dependency names, or file diffs. The user's coding agent decides how to produce that output in the agent's own stack and writes it with its own file tools after the user confirms. The server itself never writes to the user's machine. Idempotent: when `detect_agent` reports `already_set_up`, it returns no required changes.
- `verify_setup` - checks the traces AgentScore has actually received from the agent (root span, prompt text, tool spans, identity signal, accepted operation name) and reports pass/fail in plain language with a concrete next step on failure, not a check name a semi-technical user can't act on. The user runs their agent once; no local span inspection is needed.
- `get_scoring_suggestions` - for an agent the signed-in user can access, returns current score, which dimensions are low, why, and concrete suggested changes, in language a semi-technical user can act on or hand to someone who can. Suggestions are judicious and incremental: a short, prioritized set of changes, not an exhaustive list of every problem, because the wording of a recommendation drives what the calling agent does (a long list of problems invites a full prompt rewrite). Recommendation framing is tested explicitly before launch. Results describe classes of errors and the evidence for them, never the expected answers or the eval contents, so the calling agent cannot overfit to the benchmark.
- `get_update_instructions` - returns a structured self-update playbook for the calling agent: the ordered procedure (read suggestions, choose a change, apply it, wait for the re-score, compare, keep or roll back), the change categories the agent may make (for example prompt text, tool descriptions, retry/timeout settings, instrumentation fixes), and the stop conditions. Instructions are machine-actionable (explicit steps and fields), not prose written for a human. Each suggestion from `get_scoring_suggestions` carries a change category, a risk class (low, medium, high), and the evidence it is based on, so the calling agent and its owner can decide for themselves what to act on without asking. AgentScore does not set or enforce an autonomy level, and does not commit, review, or deploy changes; the user's coding agent and their own workflow own that (the AI Workspace is the one exception, as it is an agent delivery platform).
- Self-update guidance built into the playbook (the client decides how strictly to follow it): one change per cycle so the score delta is attributable; a re-score before the next change; rollback guidance when the score regresses; and no self-update below the ~20-trace threshold unless the suggestion carries a confidence flag. The agent must not modify its own AgentScore instrumentation to raise the score (for example, dropping spans or filtering failing traces); instrumentation changes are limited to fixes that `verify_setup` flags.
- Benchmark protection: scoring feedback returned to the calling agent withholds enough to prevent benchmark hacking. Responses return error classes (for example "retrieval returns near-duplicate documents with different meanings"), not eval inputs, expected outputs, or graders. The agent is told what kinds of failures to test and fix, and AgentScore keeps the benchmark itself.
- `report_update` - the agent records what it changed, why, the suggestion it acted on, and the rollback reference, so every self-update is auditable. Contains no source code and no `tk_` values.
- The ingest key is never accepted as a tool parameter and never appears in any tool output or server log. Server-side validation rejects any tool input matching the `tk_` key prefix and drops it before logging. The key reaches the agent's runtime only through the user's own secret-storage path (env var or secret manager), never through chat.
- Per-tenant isolation, per-user rate limiting, and audit logging of tool calls on the hosted endpoint.

### Should Have (P1)

- `check_status` - reports whether an agent is "Setting up," "Learning your agent" (n of 20 traces), or actively scored, without the user opening the AgentScore UI.
- Structured error responses mapped to AgentScore's status-code table (401/403/429/503), translated into plain-language causes and next steps rather than a raw HTTP error.

### Nice to Have (P2)

- Subscribable MCP resource for scoring-suggestion updates (push instead of poll), for clients that support resource subscriptions.
- An MCP app with an interactive UI in the assistant, showing setup progress and status (for example a progress diagram through detect, plan, instrument, verify, and the "n of 20 traces" count), for clients that support it.

## Scope

### In Scope
- A hosted, HTTPS-accessible MCP server exposing the P0 tools above (including the self-update tools), designed so every response can be rendered in plain language by the calling AI assistant.
- OAuth sign-in and tenant resolution for the hosted endpoint.
- Read-only calls to the AgentScore API for score/dimension data behind `get_scoring_suggestions` and `check_status`.
- Retiring the Claude Code skill's role as the supported onboarding path; this server becomes the one path going forward, for technical and non-technical users alike.

### Out of Scope
- Redesigning the AgentScore scoring engine or UI.
- Preserving or extending the Claude Code skill - it is being replaced, not maintained alongside this.
- Push/webhook delivery of suggestions (see Future Considerations).
- Writing instrumentation code for the user's agent, or supporting specific languages and frameworks. AgentScore specifies the telemetry it needs; the user's coding agent implements it.
- Committing, reviewing, or deploying changes to the user's agent, and managing the user's autonomy level or SDLC. AgentScore supplies inputs for a semi- or fully automatic loop but is not an agent delivery platform (AI Workspace excepted).

### Future Considerations
- Push-based suggestion delivery once scoring crosses the trace threshold.
- Listing the hosted server in assistant connector directories so users can add it without pasting a URL.
- Server-side ingest key provisioning (mint a key on the user's behalf and hand it off via a one-time link, never via tool output), if key handling proves to be the remaining setup barrier (see Open Questions).

## Technical Approach (high-level)

- **Hosted remote server, not local/stdio.** The server runs on AgentScore infrastructure behind HTTPS (Streamable HTTP), so users install nothing. Because a remote server cannot touch the user's filesystem, file access moves to the calling assistant: the server returns the plan and the telemetry contract, and the user's coding agent, which knows how the agent is configured and run, decides how to meet it and writes the changes with its own file tools after the user confirms. This keeps the "nothing outside the repo is touched" guarantee (the server touches nothing at all) and shrinks what the server sees to a small fingerprint instead of source code.
- **Why MCP and not only a skill.** Setup alone (mainly handing over an endpoint and key safely) does not justify an MCP over a skill, and the existing skill proves the setup flow works. The repeated improvement loop does justify it: fetching scores and recommendations again and again from the calling agent needs a live, authenticated, two-way interface. The delivery mechanism is open; the requirement is ease of use, and MCP is favored because of the improvement loop.
- **Target onboarding experience.** The user pastes one prompt and the hosted MCP endpoint into their coding agent, and the agent handles detection, instrumentation, and verification itself (the WorkOS onboarding model, identity set up in about 8 minutes). The same experience is wanted for internal Tricentis teams onboarding their agents. Order of work: this onboarding and two-way communication problem first.
- **Client capability determines the experience.** Assistants with local file tools (Claude Code, IDE assistants) can run the full flow. Chat-only assistants without file access (for example a web chat client) can still run `get_scoring_suggestions` and `check_status`, and for setup can produce the telemetry requirements to hand to a technical teammate or their coding agent. Document this matrix.
- **Framework-agnostic by design.** The server specifies required OTel output, not how to produce it, so it does not need to care about the agent's implementation language or framework. The verification logic may reuse the proven approach from the retiring Claude Code skill's scripts as a starting point, but the server has no runtime dependency on the skill and must work standalone.
- **Two setup paths, not one.** `detect_agent` has to tell these apart and `plan_setup` has to describe each honestly, since they're very different experiences for a semi-technical user:
  - **Already instrumented.** The agent already exports OpenTelemetry (or OpenInference/Traceloop/Langfuse/Logfire) spans somewhere. `get_instrumentation_spec` only needs to say that AgentScore should be an additional export target alongside the existing pipeline - no new instrumentation, usually nothing the user has to reason about beyond confirming "point my existing traces at AgentScore too." This is the easy case and should resolve in one `plan_setup` → `get_instrumentation_spec` → `verify_setup` pass.
  - **Not instrumented.** No telemetry exists yet. The spec describes the full output required, and the user's coding agent has to choose and install whatever instrumentation fits the agent's stack and wire it in before anything can be verified - real code is being added to the user's repo, not just a new export target. This is the case the semi-technical persona most needs help with, and where `verify_setup` failures (missing root span, no prompt text, wrong operation name) are most likely, so responses need the clearest plain-language explanation of what went wrong and why, since the user has no telemetry background to fall back on.
  - If `verify_setup` fails in the not-instrumented case and the cause isn't obvious from the plain-language explanation, the fallback is surfacing a specific next step the user can hand to a technical teammate, not raw check output.
- **Auth for read tools.** `get_scoring_suggestions` and `check_status` authenticate with the user's OAuth token, not the ingest key. The server calls the customer score routes on the user's behalf, scoped to the token's tenant. The ingest key is a write-path credential for the agent's runtime exporter only and is not used by the MCP server for reads. This depends on the customer routes accepting a user/tenant token (see Open Questions).
- **Self-update loop: AgentScore provides inputs, the client owns the rest.** The server never changes the agent; it gives the calling agent what it needs to improve itself and holds the record. The loop is: `get_scoring_suggestions` (what to change, with category, risk class, and evidence) then `get_update_instructions` (the procedure) then the agent edits its own prompts/config/code with its own tools then the agent runs and waits for the re-score (`check_status`) then compares the score and dimension deltas then keeps the change or rolls it back, and calls `report_update` either way. Whether a human approves each step, only risky ones, or none, and how changes are committed and deployed, is decided in the user's own client and workflow. The same inputs support a semi-automatic or fully automatic loop without AgentScore knowing which one is in use.
- **Why the guardrails are in the instructions and the data, not only the prompt.** An agent told to "raise its score" is incentivized to game it. So the playbook restricts what may be changed, recommends attributable single-change cycles, ties every action to a suggestion and its evidence, and keeps the audit trail server-side where the agent can't edit it. Scoring stays independent of the agent being scored: the server never lets the agent influence how its own traces are evaluated.
- Every tool response is structured so the calling assistant can render it conversationally (no file diffs, package names, or span terminology surfaced as the primary content) - the semi-technical persona can't act on those directly.

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
| A calling agent running a fully automatic loop makes a harmful change (regresses quality, breaks behavior, changes something outside what the user intended) | Autonomy and deployment are owned by the user's client, not AgentScore; we reduce the blast radius with server-defined risk classes and allowed change categories, a playbook recommending single-change cycles with re-score and rollback on regression, and a full audit trail via `report_update`. Messaging must be clear that AgentScore is not responsible for the client's autonomy settings |
| Goodhart's law: the agent optimizes the score rather than real quality (gaming evals, trimming traces, overfitting to eval prompts) | Instrumentation is off limits except `verify_setup` fixes; suggestions cite evidence from real interactions; evals and scoring remain server-side and independent of the agent; flag anomalous score jumps in the audit trail and in suggestion output |
| Recommendation wording drives the calling agent's behavior: an exhaustive problem list invites a full prompt rewrite instead of an incremental fix | Return a short prioritized set of changes, one per cycle, framed as a single next fix; test recommendation framing against real calling agents before launch |
| Prompt injection via suggestion text or trace content steers the agent into unsafe self-edits | Suggestions are structured fields (category, risk, evidence reference), not free-form instructions; the playbook states that content from traces is data, never instructions; high-risk categories are flagged in the playbook as needing human review, though the client decides whether to honor that |
| A semi-technical user may not know where to find or create an ingest key in the AgentScore UI | `plan_setup` must give plain-language, jargon-free instructions pointing directly at the Integrations page |

## Open Questions

- The dimension breakdown is already exposed to customers (see Dependencies). The improvement advisor, the only source of suggested fixes, is admin-only and asynchronous (POST returns 202, results fetched later). Do we (a) ask the platform team for a customer-facing advisor route, or (b) have `get_scoring_suggestions` build suggestions from the dimension breakdown and failing evals, with the assistant doing the plain-language translation? Option (a) means a parallel platform dependency and a polling flow; option (b) ships sooner but gives less specific suggestions.
- Do the customer score routes (`/tenants/{tenant_id}/agents/{agent_id}/score`) accept an OAuth user/tenant token that the hosted MCP server can obtain, or do they require a different credential? The PRD now assumes a user token. If the routes only accept the ingest key, the hosted design needs server-side key custody, which conflicts with the key-never-leaves-the-user rule. Also confirm how the server resolves `agent_id` (from the fingerprint, an agent picker tool, or the user's agent list).
- Does Tricentis identity support OAuth 2.1 with PKCE and dynamic client registration for third-party MCP clients, and which Tosca Cloud account types (trial vs. licensed) can authorize? If not, who builds the authorization layer?
- Which team owns hosting and on-call for a public MCP endpoint, and what is the security review path? The SRE constraints already flagged for Beta apply here.
- Does `verify_setup` have a platform API to read received span structure per agent, or does it need new ingestion-side work?
- Should `get_scoring_suggestions` require the ~20-trace threshold strictly, or return lower-confidence suggestions earlier with a confidence flag?
- Which change categories are low, medium, and high risk, and is any category permanently human-only (for example anything touching tool permissions, credentials, or data access)?
- What is the regression threshold and re-score window that triggers rollback, given scoring needs enough new traces to be meaningful after a change? A change may need many traces before its effect is measurable, which limits cycle speed.
- Is the self-update scope limited to what the calling agent can edit in the user's repo, or does it also cover agents the user runs in hosted platforms where the assistant has no file access?

## Timeline & Milestones

TBD - no dates committed yet; depends on resolving the API-dependency, OAuth, and hosting-ownership open questions above.
