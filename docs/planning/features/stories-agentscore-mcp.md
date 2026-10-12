# Stories: AgentScore Auto Setup and Self-Improvement Loop

Source: `docs/planning/features/prd-agentscore-mcp.md`. P2 items (resource subscriptions, interactive MCP app) are excluded as instructed.

## Decomposition and enabler notes

- **`get_scoring_suggestions` is too large for one story.** It is split into score and dimension data, suggestion derivation, benchmark protection, and framing validation.
- **`verify_setup` depends on a platform capability that may not exist** (reading received span structure per agent). A spike plus an ingestion-side lookup story are added.
- **Enabler stories not in the PRD:** hosting and deployment, OAuth feasibility spike, customer-route token spike, security review, client capability matrix and user guide, audit store for self-updates.
- **Open questions that block stories** (each is called out in the story it affects): customer advisor route vs derived suggestions, whether score routes accept a user token, Tricentis identity OAuth 2.1 and DCR support, hosting ownership, span-structure API.

---

## Epic 1: Hosted MCP server foundation

**Ask:** Stand up a hosted, authenticated, tenant-isolated MCP endpoint that any remote-MCP assistant can connect to with a URL and a sign-in. Every later tool depends on this, and the security properties (no key leakage, tenant isolation) must be right from the first deploy.

**Acceptance Criteria:**

1. A user adds one HTTPS URL as a custom connector in their AI assistant, signs in, and sees the server's tools, with nothing installed locally.
2. The signed-in token resolves the tenant, and no tool accepts a tenant ID or credential as a parameter.
3. Tenant isolation, per-user rate limiting, and audit logging are active on the endpoint.
4. The ingest key (`tk_` prefix) cannot enter or leave the server through any tool.

**Priority:** P0
**Dependencies:** none

### OAuth and customer-route feasibility spike

Problem to solve: The hosted design assumes Tricentis identity supports OAuth 2.1 with PKCE and dynamic client registration, and that the customer score routes accept a user token. If either is false, the architecture changes, so this has to be answered first.

AC:

1. A written answer states whether Tricentis identity supports authorization code with PKCE and dynamic client registration for third-party MCP clients.
2. The answer states which Tosca Cloud account types (trial, licensed) can authorize.
3. The answer states whether `GET /tenants/{tenant_id}/agents/{agent_id}/score` and the other customer routes accept a user or tenant token the MCP server can obtain.
4. If either answer is no, the doc names the owner and a proposed workaround (for example a separate authorization layer, or server-side key custody and why it conflicts with the key-never-leaves-the-user rule).
5. The PRD open questions are updated with the findings.

**Priority:** P0
**Estimate:** M
**Dependencies:** none

### Hosting, deployment, and ownership

Problem to solve: A public MCP endpoint needs a domain, TLS, a deployment target, secrets management, and a team that owns on-call, none of which is decided today.

AC:

1. A platform or SRE owner is named for hosting and on-call.
2. The server is deployed to a public HTTPS endpoint with a domain, valid TLS, and secrets managed outside the repo.
3. The deployment pipeline promotes through at least one non-production environment before production.
4. A health check and basic request logging are in place.

**Priority:** P0
**Estimate:** L
**Dependencies:** none

### Remote MCP server skeleton on Streamable HTTP

Problem to solve: Users must connect by URL with no local install, which needs an MCP server speaking Streamable HTTP, not stdio.

AC:

1. The server is built on the chosen official MCP SDK and serves over Streamable HTTP.
2. A test assistant can connect to the deployed URL and list tools.
3. A placeholder health tool returns a plain-language response end to end.
4. The SDK and runtime choice is recorded in the repo.

**Priority:** P0
**Estimate:** M
**Dependencies:** Hosting, deployment, and ownership

### OAuth sign-in and tenant resolution

Problem to solve: Tools must act as the signed-in user in their own tenant without ever taking a tenant ID or credential as input, otherwise tenant scoping can be spoofed.

AC:

1. A new connection triggers OAuth 2.1 authorization code with PKCE and dynamic client registration against Tricentis identity.
2. The access token resolves to exactly one tenant, and every tool call derives tenant scope from the token only.
3. No tool schema contains a tenant ID or credential parameter.
4. An expired or revoked token returns a plain-language "sign in again" response, not a raw error.
5. A user without access to any tenant gets a clear message and no tool data.

**Priority:** P0
**Estimate:** L
**Dependencies:** OAuth and customer-route feasibility spike, Remote MCP server skeleton on Streamable HTTP

### Ingest key guard

Problem to solve: A connected client may log tool-call arguments, so any `tk_` key that reaches the server could leak, and the key must reach the agent only through the user's own secret storage.

AC:

1. Any tool input matching the `tk_` prefix is rejected with a plain-language explanation of where to put the key instead.
2. Rejected values are dropped before logging, and a test confirms they never appear in server logs.
3. A response filter blocks any tool output matching the `tk_` prefix.
4. No tool defines a key parameter.
5. Automated tests cover input, output, and log paths.

**Priority:** P0
**Estimate:** M
**Dependencies:** Remote MCP server skeleton on Streamable HTTP

### Tenant isolation, rate limiting, and audit logging

Problem to solve: A public endpoint is a new attack surface, and cross-tenant exposure or abuse would be a serious incident.

AC:

1. A test with two tenants confirms one tenant's token can never read the other's agents, scores, or traces.
2. Per-user rate limits apply, and exceeding them returns a plain-language retry message.
3. Input size caps are enforced on all tool parameters.
4. Every tool call is audit logged with user, tenant, tool, timestamp, and outcome, without logging parameter values that could hold secrets.
5. Tool outputs contain only plain-language results, with no instructions beyond them.

**Priority:** P0
**Estimate:** L
**Dependencies:** OAuth sign-in and tenant resolution

### Security review before launch

Problem to solve: The PRD requires a security review of a new public endpoint, and the review path is unconfirmed.

AC:

1. The review path and owner are confirmed with the SRE and security teams.
2. A review covering token handling, cross-tenant exposure, prompt injection through tool inputs and returned text, and abuse is completed.
3. All high-severity findings are fixed before any external user is invited.

**Priority:** P0
**Estimate:** M
**Dependencies:** Tenant isolation, rate limiting, and audit logging, Ingest key guard

---

## Epic 2: Plain-language agent setup

**Ask:** Let a semi-technical user get their agent instrumented and verified by asking their own coding agent, with AgentScore supplying the telemetry contract and checking the result. This is the onboarding half of the PRD and the first user-visible value.

**Acceptance Criteria:**

1. A user whose agent already exports telemetry completes setup in one plan, spec, verify pass.
2. A user whose agent has no telemetry gets a language-independent contract their coding agent can implement, and a plain-language verdict on the result.
3. Verification reads traces AgentScore actually received, so the user only runs their agent once.
4. No setup response surfaces package names, diffs, or span jargon as primary content.

**Priority:** P0
**Dependencies:** Epic 1

### Fingerprint schema and `detect_agent`

Problem to solve: The server cannot read the user's repo, so it needs a small structured fingerprint from the calling assistant to tell whether the agent already exports telemetry and is set up for AgentScore.

AC:

1. The fingerprint schema (dependency manifest entries, candidate entrypoint filenames, existing telemetry config) is documented and small.
2. `detect_agent` returns whether the agent exports telemetry and where, and whether it is already set up for AgentScore.
3. It does not report language or framework and does not need them.
4. When the fingerprint is insufficient, the response names exactly which file the assistant should look at.
5. The server never receives source code beyond the fingerprint.
6. Responses contain no jargon and are phrased for the assistant to relay.

**Priority:** P0
**Estimate:** M
**Dependencies:** Remote MCP server skeleton on Streamable HTTP

### `plan_setup` plain-language plan

Problem to solve: A semi-technical user cannot approve a package or diff list, so they need a plain statement of what will happen before anything is written.

AC:

1. `plan_setup` returns a plain-language summary such as "I'll add tracing to your agent so it can be scored" for both setup paths (already instrumented, not instrumented).
2. For the already-instrumented path, the plan says AgentScore is added as an additional export target alongside existing telemetry.
3. For the not-instrumented path, the plan says new code will be added to the repo and the user's coding agent will propose the specifics.
4. The response includes jargon-free steps to the Integrations page and the user's own secret store for the ingest key.
5. The response states that no writes happen until the user confirms.

**Priority:** P0
**Estimate:** M
**Dependencies:** Fingerprint schema and `detect_agent`

### Telemetry contract and `get_instrumentation_spec`

Problem to solve: The coding agent needs to know exactly what OpenTelemetry output AgentScore requires without the server dictating code, so setup works in any language or framework.

AC:

1. The response lists the ingest endpoint, how the key is supplied (env var or secret manager, never chat), the required span structure and attributes (root span, prompt text, tool spans, identity signal, accepted operation name), and the export protocol.
2. It contains no code, dependency names, or file diffs.
3. When `detect_agent` reports already set up, the response returns no required changes (idempotent).
4. When the agent already exports telemetry, the response states that AgentScore should be an additional target.
5. The server never writes to the user's machine.

**Priority:** P0
**Estimate:** M
**Dependencies:** Fingerprint schema and `detect_agent`

### Span-structure lookup spike and ingestion-side API

Problem to solve: `verify_setup` must read the span tree AgentScore actually received for an agent, and it is unknown whether the platform already exposes that.

AC:

1. A spike confirms whether an existing platform API returns received span structure per agent, scoped to a tenant.
2. If none exists, a read-only endpoint is built that returns root span, prompt text presence, tool spans, identity signal, and operation name for an agent's recent traces.
3. The endpoint accepts the user token used by the MCP server.
4. Tenant scoping is enforced and tested.

**Priority:** P0
**Estimate:** L
**Dependencies:** OAuth and customer-route feasibility spike

### `verify_setup` plain-language verification

Problem to solve: A semi-technical user cannot interpret check names, so verification needs to say what is wrong and what to do next.

AC:

1. `verify_setup` checks received traces for root span, prompt text, tool spans, identity signal, and accepted operation name.
2. It reports pass or fail in plain language with a concrete next step on each failure, not a check name.
3. The user runs their agent once and no local span inspection is needed.
4. When no traces have arrived yet, the response says so and explains how to trigger one.
5. When a failure cause is not obvious, the response gives a specific next step the user can hand to a technical teammate, not raw check output.
6. Existing verification logic from the Claude Code skill may be reused as a starting point, with no runtime dependency on the skill.

**Priority:** P0
**Estimate:** L
**Dependencies:** Span-structure lookup spike and ingestion-side API, Telemetry contract and `get_instrumentation_spec`

### Client capability matrix and one-page user guide

Problem to solve: Some assistants lack local file tools and some orgs restrict custom connectors, so users need to know what works where and how to add the connector.

AC:

1. A matrix documents which tools work with file-capable clients (full flow) and chat-only clients (suggestions and status, plus handing telemetry requirements to a teammate).
2. A one-page plain-language guide covers pasting the URL, signing in, and the one-prompt onboarding experience.
3. The guide explains that org admins can pre-approve the connector once for everyone.
4. The guide is reviewed by a semi-technical reader who has not seen the product.

**Priority:** P0
**Estimate:** S
**Dependencies:** Remote MCP server skeleton on Streamable HTTP

### Replace the Claude Code skill as the supported onboarding path

Problem to solve: Two supported onboarding paths would split docs and support, and the PRD states the skill is being replaced, not maintained alongside.

AC:

1. Customer-facing docs and the beta welcome email point to the hosted MCP server as the onboarding path.
2. The skill is marked deprecated with a pointer to the MCP guide.
3. No new features are added to the skill.
4. This story ships only after the setup tools pass an end-to-end test on both setup paths.

**Priority:** P0
**Estimate:** S
**Dependencies:** `verify_setup` plain-language verification, Client capability matrix and one-page user guide

---

## Epic 3: Scoring suggestions

**Ask:** Let a user ask how their agent is doing and what to fix, and get a short, prioritized, plain-language answer tied to their real scoring run. The suggestions must not leak the benchmark, because the calling agent will act on them.

**Acceptance Criteria:**

1. A signed-in user gets the current score, which dimensions are low, and why, without opening the AgentScore UI.
2. Suggestions are a short prioritized set of incremental changes, not an exhaustive problem list.
3. Responses describe classes of errors and evidence, never eval inputs, expected outputs, or graders.
4. The suggestion framing has been tested against real calling agents before launch.

**Priority:** P0
**Dependencies:** Epic 1

### Suggestion source decision

Problem to solve: The only source of suggested fixes is the admin-only, asynchronous improvement advisor, so the team must choose between exposing it to customers or deriving suggestions from the dimension breakdown.

AC:

1. The team decides between (a) a customer-facing advisor route and (b) deriving suggestions from the dimension breakdown and failing evals.
2. The decision records the tradeoff: (a) adds a platform dependency and a polling flow, (b) ships sooner with less specific suggestions.
3. The decision names the owner of any platform work and the PRD open question is closed.
4. Whether to require the ~20-trace threshold strictly, or return lower-confidence suggestions with a confidence flag, is decided in the same review.

**Priority:** P0
**Estimate:** S
**Dependencies:** none

### Score and dimension data retrieval

Problem to solve: The "how is my agent doing" half of the tool needs current score and per-dimension data, and the routes already exist but must be reachable with the user token and scoped to an agent the user can access.

AC:

1. The server reads `GET /tenants/{tenant_id}/agents/{agent_id}/score` using the user's token, scoped to the token's tenant.
2. Score history and per-eval interaction drilldown are available to the suggestion logic.
3. Agent selection works from the user's agent list or a picker response when the agent is ambiguous, and never from a tenant parameter.
4. A user cannot read an agent they cannot access.
5. Below the trace threshold, the response says the agent is still being learned and gives progress.

**Priority:** P0
**Estimate:** M
**Dependencies:** OAuth sign-in and tenant resolution, OAuth and customer-route feasibility spike

### Customer-facing improvement advisor route

Problem to solve: If the team chooses option (a), suggestions need a customer-accessible route to the existing advisor, which today is admin-only.

AC:

1. A customer route triggers an advisor run for an agent or a specific scoring run and returns a job reference.
2. A customer route returns advisor results, scoped to the user's tenant.
3. The MCP tool handles the asynchronous flow by polling or telling the user results are pending.
4. Admin-only fields not meant for customers are excluded.
5. This story is dropped if option (b) is chosen.

**Priority:** P0
**Estimate:** L
**Dependencies:** Suggestion source decision

### Suggestion derivation and prioritization

Problem to solve: The wording and length of recommendations drive what the calling agent does, and a long problem list invites a full prompt rewrite instead of an incremental fix.

AC:

1. Each suggestion is a structured item with a plain-language description, a change category, a risk class (low, medium, high), and an evidence reference.
2. The response contains a short prioritized set, framed so the first item is a single next fix.
3. The response names the current score and which dimensions are low and why, in language a semi-technical user can act on or hand to someone.
4. Suggestions are built from the chosen source (advisor results or the dimension breakdown).
5. Low-confidence suggestions carry a confidence flag.

**Priority:** P0
**Estimate:** L
**Dependencies:** Suggestion source decision, Score and dimension data retrieval

### Benchmark protection

Problem to solve: If feedback returns eval inputs, expected outputs, or graders, a calling agent can overfit to the benchmark and the score stops meaning anything.

AC:

1. Responses return error classes with evidence summaries, for example "retrieval returns near-duplicate documents with different meanings".
2. No response contains eval inputs, expected outputs, grader logic, or content that reconstructs them.
3. A review checklist and automated test fixtures confirm this on a sample of real runs.
4. The agent is told what kinds of failures to test and fix, and the benchmark stays server-side.

**Priority:** P0
**Estimate:** M
**Dependencies:** Suggestion derivation and prioritization

### Recommendation framing validation

Problem to solve: Framing is a risk the PRD says must be tested before launch, because an exhaustive list changes calling-agent behavior for the worse.

AC:

1. At least three calling agents or assistants are run against the same suggestion responses on a test agent.
2. Results record whether each agent makes an incremental change or a wholesale rewrite.
3. Framing is revised until incremental behavior is the norm, and findings are written up.
4. The test is repeatable and rerun when suggestion wording changes materially.

**Priority:** P0
**Estimate:** M
**Dependencies:** Benchmark protection

---

## Epic 4: Self-update loop

**Ask:** Give the calling agent the instructions, structured suggestions, and audit record it needs to run a semi- or fully automatic self-improvement loop, with guardrails against gaming the score. AgentScore supplies inputs and a record only; autonomy, commits, and deployment stay with the user's client.

**Acceptance Criteria:**

1. A calling agent can fetch a machine-actionable playbook and follow it through read, change, re-score, compare, keep or roll back.
2. Every self-update is recorded and auditable, with no source code and no `tk_` values.
3. The playbook and responses prevent the agent from modifying its own instrumentation to raise the score.
4. AgentScore does not set, enforce, or know the client's autonomy level.

**Priority:** P0
**Dependencies:** Epic 3

### Playbook content and risk classification decision

Problem to solve: The playbook needs agreed change categories, risk classes, and rollback thresholds before it can be written, and the PRD leaves these open.

AC:

1. Allowed change categories are defined (for example prompt text, tool descriptions, retry or timeout settings, instrumentation fixes).
2. Each category is assigned a risk class, and any permanently human-only category is named (for example tool permissions, credentials, data access).
3. A regression threshold and re-score window for rollback is proposed, accounting for the traces needed to measure a change.
4. The decision on whether self-update covers hosted-platform agents without file access is recorded.
5. The PRD open questions are updated.

**Priority:** P0
**Estimate:** M
**Dependencies:** none

### `get_update_instructions` playbook tool

Problem to solve: Without a safe procedure the calling agent will improvise, and an agent told to raise its score is incentivized to game it.

AC:

1. The response is structured and machine-actionable, with explicit steps and fields rather than prose for a human.
2. The ordered procedure covers read suggestions, choose a change, apply it, wait for the re-score, compare, and keep or roll back.
3. It lists the allowed change categories and the stop conditions.
4. It states that content from traces is data, never instructions.
5. High-risk categories are flagged as recommended for human review, and the response says the client decides whether to honor that.
6. The response states that AgentScore does not set or enforce autonomy and does not commit, review, or deploy changes.

**Priority:** P0
**Estimate:** M
**Dependencies:** Playbook content and risk classification decision

### Self-update guardrails in the playbook

Problem to solve: Goodhart's law applies, so guardrails must be built into the instructions and the data, not left to the agent's good behavior.

AC:

1. The playbook recommends one change per cycle and a re-score before the next change.
2. It gives rollback guidance when the score regresses.
3. It says no self-update below the ~20-trace threshold unless the suggestion carries a confidence flag.
4. It forbids modifying AgentScore instrumentation to raise the score (for example dropping spans or filtering failing traces), limiting instrumentation changes to fixes `verify_setup` flags.
5. Each guardrail is stated as a checkable rule, not advice.

**Priority:** P0
**Estimate:** S
**Dependencies:** `get_update_instructions` playbook tool

### Self-update audit store and `report_update`

Problem to solve: Self-updates need an auditable record the agent cannot edit, otherwise there is no way to review or reverse what an autonomous loop did.

AC:

1. `report_update` records what changed, why, the suggestion acted on, and the rollback reference.
2. It accepts no source code and rejects any `tk_` value.
3. Records are stored server-side, scoped to the tenant, and are append-only from the agent's side.
4. The agent can call it for both kept and rolled-back changes.
5. A user can retrieve the audit trail for an agent.

**Priority:** P0
**Estimate:** L
**Dependencies:** Tenant isolation, rate limiting, and audit logging

### Score anomaly flagging

Problem to solve: A sudden score jump after a self-update may signal gaming rather than real improvement, and nobody will notice without a flag.

AC:

1. A score change after a recorded update that exceeds a defined threshold is flagged in the audit trail.
2. The flag is included in suggestion output for that agent.
3. The threshold is documented and configurable server-side.
4. Scoring remains independent of the agent: nothing the agent sends through `report_update` affects how traces are evaluated.

**Priority:** P0
**Estimate:** M
**Dependencies:** Self-update audit store and `report_update`

---

## Epic 5: Status and error handling

**Ask:** Let users see where an agent is in its lifecycle without opening the UI, and turn raw platform errors into plain-language causes and next steps. This makes the loop and the setup flow usable by the target persona.

**Acceptance Criteria:**

1. A user can ask whether an agent is setting up, learning, or actively scored.
2. Platform errors never reach the user as raw HTTP codes.

**Priority:** P1
**Dependencies:** Epic 1, Epic 3

### `check_status` lifecycle tool

Problem to solve: Users cannot tell whether silence means broken, waiting, or fine, and the calling agent needs a re-score signal in the self-update loop.

AC:

1. `check_status` reports "Setting up", "Learning your agent" with n of 20 traces, or actively scored.
2. The response is plain language and usable by the calling agent to know when a re-score has completed.
3. Data comes from the customer score routes using the user's token, not the ingest key.
4. An agent the user cannot access returns a not-found style response.

**Priority:** P1
**Estimate:** M
**Dependencies:** Score and dimension data retrieval

### Plain-language error mapping

Problem to solve: A raw 401, 403, 429, or 503 means nothing to a semi-technical user and stalls the flow.

AC:

1. Errors map to AgentScore's status-code table and return a plain-language cause and a next step.
2. 401 prompts sign-in, 429 gives a retry hint, 503 says the service is temporarily unavailable.
3. All tools use the same mapping through one shared handler.
4. Error responses never include internal details, tokens, or `tk_` values.

**Priority:** P1
**Estimate:** S
**Dependencies:** Remote MCP server skeleton on Streamable HTTP

---

## Suggested sprint ordering

| Sprint | Work | Why |
| --- | --- | --- |
| 1 | OAuth and customer-route feasibility spike, Hosting and ownership, Suggestion source decision, Playbook content and risk classification decision, Span-structure lookup spike (start) | The four open questions that can reshape the architecture. Everything else is blocked or at risk until answered. |
| 2 | Remote MCP server skeleton, OAuth sign-in and tenant resolution, Ingest key guard, Fingerprint schema and `detect_agent` | Foundation plus the first tool. Key guard lands before any tool handles real data. |
| 3 | Tenant isolation, rate limiting, and audit logging, `plan_setup`, Telemetry contract and `get_instrumentation_spec`, Span-structure ingestion-side API, Score and dimension data retrieval | Setup tools and the scoring data path in parallel. |
| 4 | `verify_setup`, Client capability matrix and user guide, Suggestion derivation and prioritization, Customer-facing advisor route (if option a) | Completes setup end to end and the core of suggestions. |
| 5 | Benchmark protection, Recommendation framing validation, `check_status`, Plain-language error mapping, Security review | Hardening before any external user. Security review starts here and runs in parallel. |
| 6 | `get_update_instructions`, Self-update guardrails, Self-update audit store and `report_update`, Score anomaly flagging | The self-update loop, which needs stable suggestions and status first. |
| 7 | Replace the Claude Code skill as the supported path, security review fixes, end-to-end test on both setup paths | Cutover only after the end-to-end test passes. |

Sprints are suggestions, not commitments; the PRD has no committed dates. Sprints 2 through 4 are the earliest point a semi-technical user can onboard, matching the PRD's "onboarding and two-way communication first" ordering. If the advisor route (option a) is chosen, it is the main schedule risk because it needs platform team capacity.
