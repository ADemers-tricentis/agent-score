# AgentScore Roadmap - Jira Alignment

Date: 2026-10-22
Roadmap: [2026-10-20-agentscore-beta-roadmap.md](../roadmap/2026-10-20-agentscore-beta-roadmap.md)
Previous alignment: [2026-10-14-agentscore-beta-roadmap-jira.md](2026-10-14-agentscore-beta-roadmap-jira.md)
Status: Alignment refreshed. Drafts for all likely-missing items pending approval.

Source: Testing AI team issues in project AI (board 8084), read on 2026-10-22. Read-only. Nothing was changed in Jira.

## What changed since 10-14

- **Statuses:** every linked issue still has the status shown in the roadmap. Only four team issues were created or updated since 10-14: AI-15005 (Done), AI-15270 (Ready to Deploy), AI-15552 (In Review), and AI-15712 (new).
- **New issue:** [AI-15712](https://tricentis.atlassian.net/browse/AI-15712) (To Do, Task, no epic): map all internal agents to the tais tenant. See Out of scope.
- **Step 7 no longer matches its epic.** The roadmap reworded step 7 from "First-score output" to "Automatic profile and eval selection." Epic AI-15148 (Scoring suggestions) covers suggested improvements, not choosing or creating a profile and evals. Moved from Aligned to Likely missing.
- **Features checked for the first time:** per-agent scorecard, session grouping, quantitative cost function, and tenant-wide reporting. Only the scorecard has related issues.

## Jira alignment

### Aligned

| Roadmap feature | Jira | Notes |
|---|---|---|
| Tosca Cloud sign-in with login-or-create tenant | AI-15137 epic (To Do), AI-15270 (Ready to Deploy), AI-15139 (To Do); AI-12369 (Done) | Unchanged. Open bug AI-15269 (To Do, Wolters Kluwer cannot log in) belongs here. |
| Automatic tenant provisioning | AI-15137: AI-15138, AI-15139, AI-15143 (To Do), AI-15142 (Backlog) | Unchanged. |
| Join existing tenants | AI-15140 (To Do) | Unchanged. |
| Zero-config agent connection via MCP | AI-15146, AI-15147 (To Do), AI-15150 (Backlog) | Unchanged. AI-15552 (In Review, LiteLLM spans never reach AgentScore) is a related bug in trace flow. |
| Improvement feedback to the agent | AI-15149 (To Do): AI-15171 to AI-15175 | Unchanged. |
| Progress bars | AI-10597: AI-15178 to AI-15181 (To Do) | Unchanged. |
| Plain-language dimensions and evals | AI-15268 (To Do); AI-11884 (Done) | Unchanged. |
| PII and sensitive-data redaction | AI-11914 (To Do) under AI-11882 (In Progress) | Unchanged. |
| Score and ship decision next to the AIWS agent | AI-11912 (Backlog) under AI-11881 (In Progress) | Unchanged. Still confirm ship_decision is in scope. |
| Per-agent scorecard (Next) | AI-11887, AI-11885 (Backlog), under Done epic AI-11871 | **Guess** from summaries. AI-11887 fits "inferred from traces," AI-11885 fits "conversation with the owner." |

### Out of scope (no roadmap feature)

| Issue | Status | Recommendation |
|---|---|---|
| AI-15712 Map all internal agents to tais tenant | To Do | **Keep.** The new north star counts internal users, and this puts internal agents in AgentScore. No roadmap feature names it. Closest fit is Simplify onboarding, but that mapping is a guess. |
| AI-11875 Beta Commercial Model Instrumentation | In Progress | Keep, add a theme (graduation criterion 2). Unchanged from 10-14. |
| AI-12370 Commercialization / Monetization Integration | In Progress | Keep, same theme. Unchanged. |
| AI-13913 Gainsight Instrumentation | To Do | Keep (active-users criterion). Unchanged. |
| AI-12375 Monorepo split | In Progress | Defer from the roadmap. Engineering enabler. Unchanged. |
| AI-14331 OTel metrics; AI-15005 (Done) | In Progress, Done | Engineering hygiene. Leave off. |

### Likely missing

| # | Roadmap feature | Why I believe it is missing |
|---|---|---|
| 1 | **Automatic profile and eval selection** (step 7, Now) | New wording. AI-15148 covers suggestions only. AI-11885 is related but conversational, not automatic. Nothing covers auto-selection, auto-creation, or the explanation. **Open:** does AI-15148 move to another feature (suggested improvements no longer appear in the Now flow), or stay as a separate deliverable? |
| 2 | **Stimulation testing** (steps 8 to 11) | Still no open epic. Unchanged. |
| 3 | **Unified agent view** | Still no issue. Unchanged. |
| 4 | **In-app Getting Started guide** | Partial (AI-15163 is a document). Unchanged. |
| 5 | **Re-score and iterate loop** | Unchanged. |
| 6 | **Per-agent scorecard: user-set dimensions and weights** | AI-11885 and AI-11887 cover two of the three drafting paths. Nothing covers user-set weights. Both stories sit under a Done epic. |
| 7 | **Session grouping** (Next) | No issue. |
| 8 | **Measurable improvements and quantitative cost function** (Later) | No issue. AI-11896 is billing, not user value. |
| 9 | **Tenant-wide agent reporting** (Later, step 15) | No issue. |
| 10 | **Progress bars for remaining actions; AIWS rescore prompt, scoring status, score change indicator** | Unchanged from 10-14. |

### Board hygiene

- **AI-11871 is still Done with Backlog stories** AI-11885, AI-11886, AI-11887. Two of them now map to the Next scorecard, so they need a live epic before work starts.
- **AI-10597** (AgentScore Improvements) did not come back in the open Testing AI query, so it is Done or not tagged to the team, while its stories AI-15178 to AI-15181 and AI-15268 are open.
- **Story-to-epic grouping for AI-15146 to AI-15177 is still inferred from key order.** Not re-checked this run.

## Draft epics and stories

Status: draft, not created in Jira. Sources: roadmap step 7, [dynamic-scoring-vs-agentscore.md](../../docs/documentation/dynamic-scoring-vs-agentscore.md), [dynamic-scoring-feedback.md](../../docs/documentation/dynamic-scoring-feedback.md).

**Reuse check:** no live epic fits. AI-15148 (Scoring suggestions) covers improvement suggestions, not scoring setup. AI-11885 and AI-11887 (Backlog) overlap stories 3 and 4 below, but their epic AI-11871 is Done. Drafting a new epic, and leaving those two for you to close or re-parent by hand.

## Dynamic scoring at onboarding

Theme: Simplify onboarding (Dynamic scoring). Horizon: Now. Flow step 7.

**Ask:** Once an agent's first traces arrive, AgentScore drafts a scorecard written for that agent, instead of force-fitting it into one of the 8 fixed profiles, and explains in plain language why each axis is there. The target persona cannot pick a profile or design evals, and the fixed catalog is why our own test-case agent scored as a chatbot.

**Acceptance Criteria:**

1. Every newly connected agent gets a provisional scorecard after its first traces, with no profile or eval choice by the user.
2. Each axis on the scorecard shows a plain-language reason it was included.
3. The owner can confirm the scorecard before the first graded run.
4. If a scorecard cannot be drafted, the agent falls back to a fixed profile, and the user is told which one and why.
5. Fixed profiles keep working for existing agents during beta.

**Priority:** P0
**Dependencies:** Zero-config agent connection via MCP (AI-15146, AI-15147) for traces and the owner conversation. The dynamic scoring concept is sequenced after the trace-store migration away from Langfuse. See open questions.

**Size flag:** 9 items, likely more than 2 sprints. If so, split at story 6: stories 1 to 5 deliver the draft, 6 to 9 deliver confirmation, fallback, and the first graded run.

### Scorecard source decision (spike)

Problem to solve: the concept doc says axes come from an owner interview, never from observed output, while the roadmap allows inference from traces. We need one rule before building the draft.

AC:

1. A written decision on what traces may influence (interview questions only, or axes too).
2. A decision on what happens when the owner does not answer the interview.
3. A decision on whether step 7 shares the profiling prompt with stimulation testing (step 8).

**Priority:** P0
**Estimate:** S
**Dependencies:** none

### Versioned scorecard model

Problem to solve: a score only means something relative to a fixed definition of "good," so every grade must point to the exact scorecard version it used.

AC:

1. A scorecard stores its axes, rubric per axis, and weights, and is immutable once saved.
2. Any change creates a new version, and earlier grades stay on their version.
3. A scorecard is marked provisional or confirmed.
4. Tables enforce tenant isolation in CI, like every other table.

**Priority:** P0
**Estimate:** L
**Dependencies:** Scorecard source decision

### Agent discovery from first traces

Problem to solve: the draft needs to know what kind of agent it is scoring (task pattern, tools, conversation or batch) before it can ask the right questions.

AC:

1. After the first traces, AgentScore produces a short plain-language description of the agent.
2. The description lists the signals it came from (tools called, turn pattern, span structure).
3. Low or unrepresentative traffic, such as developer smoke tests, is flagged as such.

**Priority:** P0
**Estimate:** M
**Dependencies:** Scorecard source decision. Related: AI-11887.

### Owner interview

Problem to solve: the owner is the only source of what "good" means for their agent, and a generic interview produces a weak draft.

AC:

1. AgentScore asks a short set of questions about success criteria and failure modes, tailored to the discovered agent shape.
2. The questions can be answered in the app or through the user's agent over the MCP connection.
3. Answers are saved with the scorecard version they produced.

**Priority:** P0
**Estimate:** M
**Dependencies:** Agent discovery from first traces. Related: AI-11885.

### Automatic scorecard draft

Problem to solve: users who cannot design evals still need a scorecard that fits their agent without building one by hand.

AC:

1. A provisional scorecard is generated from the interview answers and the agent description.
2. The draft uses the fewest axes that separate the failure modes the owner described, with a soft cap on axis count.
3. Each axis has a rubric written in the owner's terms.
4. The draft is saved as a provisional version.

**Priority:** P0
**Estimate:** L
**Dependencies:** Versioned scorecard model, Owner interview

### Axis explanations

Problem to solve: the roadmap requires a clear explanation of why each part of the scorecard exists, or users will not trust a score they did not design.

AC:

1. Each axis shows one or two plain-language sentences on why it was included.
2. Each explanation points to the interview answer or trace signal behind it.
3. Provisional scorecards say plainly that they may change once real traffic arrives.

**Priority:** P0
**Estimate:** M
**Dependencies:** Automatic scorecard draft

### Scorecard confirmation

Problem to solve: the owner makes the final ship call, so they need to approve the scorecard before it grades anything.

AC:

1. The owner can accept the draft, or remove axes, before the first graded run.
2. Removing an axis creates a new version.
3. Adding axes and changing weights are out of scope here and stay with the Next per-agent scorecard.

**Priority:** P0
**Estimate:** M
**Dependencies:** Axis explanations

### Fixed-profile fallback

Problem to solve: if a draft fails or the owner opts out, the agent still needs a score, and today's fitter can loop on zero-evidence results.

AC:

1. When no scorecard can be drafted, the agent is scored on the closest fixed profile.
2. The user sees which profile was used and why.
3. A zero-evidence result does not trigger a re-fit loop.
4. Existing agents on fixed profiles keep scoring unchanged during beta.

**Priority:** P0
**Estimate:** M
**Dependencies:** Versioned scorecard model

### Price preview before the first graded run

Problem to solve: under dynamic scoring, grading is a paid, opt-in action, and every axis adds cost to every graded session.

AC:

1. Before the first graded run, the owner sees an estimated cost based on the scorecard's axis count.
2. The run starts only after the owner confirms.
3. A per-agent daily spend cap stops grading when reached.

**Priority:** P1
**Estimate:** M
**Dependencies:** Scorecard confirmation

### Suggested sprint ordering

1. Scorecard source decision, Versioned scorecard model, Agent discovery from first traces.
2. Owner interview, Automatic scorecard draft, Fixed-profile fallback.
3. Axis explanations, Scorecard confirmation, Price preview before the first graded run.

### Open questions for these drafts

- **Roadmap wording (resolved 10-22).** The step 7 text, best-fit profile and evals with automatic creation and an explanation, is the description of dynamic scoring. The roadmap stays as written.
- **Fixed profiles at cutover.** The concept doc deletes the profile and fitter system at cutover. The roadmap keeps fixed profiles during beta. These drafts follow the roadmap.
- **Trace-store dependency.** Can this start before the Langfuse migration lands? The feedback doc asks the same question.
- **Free first run.** Should the first graded run on a provisional scorecard be free or discounted?
- **Evidence-cited deductions and judge calibration** are part of dynamic scoring but come after step 7, so they are not drafted here.

---

## Remaining gaps

Status: draft, not created in Jira. Priority follows the horizon: Now is P0, Next is P1, Later is P2. P2 items are drafted because you asked for all gaps.

Sources: the roadmap, [stimulation-market-and-approach.md](../../docs/research/Stimulation%20Testing/stimulation-market-and-approach.md), [user-needs-and-competitor-landscape.md](../../docs/research/Stimulation%20Testing/user-needs-and-competitor-landscape.md), [ai-risk-cost-function-research.md](../../docs/research/ai-risk-cost-function-research.md), and the dynamic scoring docs above.

**Reuse summary:**

| Gap | Parent |
|---|---|
| Stimulation testing (steps 8 to 11) | Two new epics |
| Unified agent view, in-app Getting Started guide | New epic |
| Re-score and iterate loop | Existing **AI-15149** Self-update loop |
| Scorecard editing (user-set axes and weights) | New epic |
| Session grouping | New epic |
| Progress bars for remaining actions | Existing **AI-10597** AgentScore Improvements, if it is still open (see Board hygiene) |
| Measurable improvements and cost function | New epic |
| Tenant-wide agent reporting | New epic |
| AIWS rescore prompt, scoring status, score change indicator | Existing **AI-11881** AI Workspace Integration |

# Now

## Stimulation test runner

Theme: Stimulation testing. Horizon: Now. Flow steps 8 and 10.

**Ask:** Give AgentScore a way to drive test conversations against a user's agent and capture the resulting traces, so users can test before shipping instead of waiting for organic traffic. Simulation testing is the top High ask across Meta (x2), L'Oreal, Tritusa, Eaton, and PG&E.

**Acceptance Criteria:**

1. A user can start a stimulation run against an agent over an HTTP or chat API, and over MCP.
2. Every request in a run is tagged so its traces are tied to the run and kept out of production dashboards.
3. Agents with no telemetry can still be tested, with the transcript submitted as a trace.
4. The user's agent can start a run and fetch results through MCP tools.

**Priority:** P0
**Dependencies:** Zero-config agent connection via MCP (AI-15146, AI-15147) for the MCP front door.

### Agent profiling prompt

Problem to solve: test selection needs to know what kind of agent it is testing, its success criteria, and its failure modes, and the persona cannot write that up by hand.

AC:

1. The user's agent can run a profiling prompt over MCP that returns agent type, success criteria, and common failure modes.
2. The profile is saved against the agent and shown to the user in plain language.
3. The profile can be rerun when the agent changes.

**Priority:** P0
**Estimate:** M
**Dependencies:** Scorecard source decision spike (step 7 epic), which decides whether step 7 and step 8 share this prompt.

### Stimulation run API

Problem to solve: every front door (MCP, CLI, and later UI) needs one source of truth for creating a run and fetching its results.

AC:

1. A run can be created with a target, a scenario set, and limits on turns and budget, and returns a run id.
2. Run status and results can be fetched by run id.
3. Runs are tenant-isolated.

**Priority:** P0
**Estimate:** L
**Dependencies:** none

### HTTP and chat target adapter

Problem to solve: most deployed chat agents are reachable over an HTTP or chat API, so this is the cheapest adapter that covers the most agents.

AC:

1. The runner can drive an agent over HTTP, including OpenAI-compatible and streaming (SSE) endpoints.
2. A simulated user plays each scenario for a set number of turns or until the goal ends.
3. The adapter interface is small (send input, get reply, optional reset), so other adapters can plug in.

**Priority:** P0
**Estimate:** L
**Dependencies:** Stimulation run API

### MCP target adapter

Problem to solve: agents exposed as MCP servers, and agent-to-agent setups, are AgentScore's core lane and a stated gap for competitors.

AC:

1. The runner can drive an agent that is exposed as an MCP server.
2. It uses the same adapter interface as the HTTP adapter.

**Priority:** P0
**Estimate:** M
**Dependencies:** HTTP and chat target adapter

### Run tagging and trace collection

Problem to solve: stimulation traffic has to be graded like any other trace but must not pollute production dashboards.

AC:

1. Every request carries a run id and scenario id in a header and in OTel baggage.
2. Traces from tagged requests are linked to their run and excluded from production views.
3. If the agent emits no traces, the runner submits the transcript as a trace.

**Priority:** P0
**Estimate:** M
**Dependencies:** Stimulation run API

### Stimulation MCP tools

Problem to solve: the user's coding agent should be able to test the agent it just changed without leaving the MCP connection.

AC:

1. MCP tools start a run and fetch its results (for example `run_stimulation` and `get_stimulation_results`).
2. Results return error classes and gate violations, not raw answers.
3. The tools are added to the AgentScore MCP PRD.

**Priority:** P0
**Estimate:** S
**Dependencies:** Stimulation run API, Hosted MCP server foundation (AI-15146)

### Stimulation CLI

Problem to solve: agents on localhost or behind a firewall cannot be reached by a hosted runner, and CI pipelines need a command to call.

AC:

1. A CLI command starts a run against a target URL with a named scenario pack.
2. The same engine can run locally in a container.

**Priority:** P1
**Estimate:** M
**Dependencies:** Stimulation run API

## Stimulation scenarios and scoring

Theme: Stimulation testing. Horizon: Now. Flow steps 9 and 11.

**Ask:** Give each agent the test categories and scenarios that fit it, score the results with the existing engine, and turn failures into improvements. Gates (0% tolerance scenarios such as a minor asking for an insurance quote) are where users have the least domain knowledge and where Tritusa's compliance ask lands.

**Acceptance Criteria:**

1. Scenarios share one schema across categories, with gates flagged and tagged to the rule they test.
2. Each agent gets scenarios from the categories that fit its profile.
3. Any gate violation fails the run regardless of the score.
4. Each run produces a report and a set of improvements.

**Priority:** P0
**Dependencies:** Stimulation test runner

### First-cohort categories and trace consent (spike)

Problem to solve: the research lists ten categories and open questions on which come first and whether production traces can seed scenarios under current consent terms.

AC:

1. A decision on which categories ship first, checked against Meta, PG&E, and Tritusa.
2. A decision from legal on whether production traces may seed scenarios, and what consent language is needed.
3. A named reviewer for gates scenarios before the customer coalition exists.

**Priority:** P0
**Estimate:** S
**Dependencies:** none

### Scenario schema

Problem to solve: selection, running, and grading all need the same definition of a scenario.

AC:

1. A scenario stores category, persona, goal, opening input, success criteria, gate flag, rule or source tag, and target types.
2. Scenarios are versioned, so a run records exactly which scenarios it used.

**Priority:** P0
**Estimate:** S
**Dependencies:** none

### Gates library v1

Problem to solve: users do not have the domain knowledge to write compliance and safety negative tests themselves.

AC:

1. About 20 to 30 gate scenarios cover the first-cohort categories, such as GDPR, EU AI Act, HIPAA, PII, and minors.
2. Each gate is tagged to the rule it tests and has 0% tolerance.
3. Each gate has been reviewed by the named reviewer.

**Priority:** P0
**Estimate:** L
**Dependencies:** First-cohort categories and trace consent, Scenario schema

### Trace-seeded scenario bank

Problem to solve: benchmarks grounded in real production usage are the part competitors cannot copy, because they need our trace data.

AC:

1. Scenario seeds (user goal, context, failure class) are generated from an agent's existing traces.
2. Sampling is weighted toward routine flows and known failure categories.
3. Seeding only uses traces covered by the consent decision.

**Priority:** P0
**Estimate:** L
**Dependencies:** First-cohort categories and trace consent, Scenario schema

### Category-based scenario selection

Problem to solve: running every scenario against every agent wastes cost and buries the results that matter.

AC:

1. Given an agent profile, AgentScore selects the categories and scenarios that fit it.
2. The user sees which categories were chosen and why.
3. The user can remove a category before the run starts.

**Priority:** P0
**Estimate:** M
**Dependencies:** Agent profiling prompt, Scenario schema

### Gate enforcement and run report

Problem to solve: a high average score must never hide a compliance violation, and the user needs one summary of the run.

AC:

1. Traces from the run are graded by existing scoring.
2. Any gate violation fails the run regardless of the score.
3. The run report lists pass or fail per scenario, gate violations first, with error classes and links to traces.

**Priority:** P0
**Estimate:** M
**Dependencies:** Run tagging and trace collection, Gates library v1

### Improvements from stimulation results

Problem to solve: a failed test is only useful if the user knows what to change.

AC:

1. Each failed scenario produces at least one improvement in plain language.
2. Improvements are grouped by category and link to the failing traces.
3. Improvements use the same format the Self-update loop (AI-15149) feeds back to the agent.

**Priority:** P0
**Estimate:** M
**Dependencies:** Gate enforcement and run report. Related: AI-15148 (Scoring suggestions), which may supply the suggestion engine.

## Onboarding experience

Theme: Simplify onboarding. Horizon: Now. Flow steps 3 and 4.

**Ask:** After sign-in, show every agent the user has in one place and walk them through connecting the first one, so a non-technical user never wonders what to do next.

**Acceptance Criteria:**

1. A signed-in user sees all of their agents, internal and external, on one screen.
2. A user with no connected agents sees an in-app guide with the MCP connection steps.
3. The guide shows when the connection works.

**Priority:** P0
**Dependencies:** Zero-config agent connection via MCP (AI-15146, AI-15147). Related: AI-15712 (map internal agents to the tais tenant).

### Unified agent list

Problem to solve: users with agents in several places have no single view, and internal agents are not mapped to a tenant yet. This may already exist in the app, so the first AC is a check.

AC:

1. Confirm whether the current agent list already meets this. If it does, mark the feature shipped and close this story.
2. All of a user's agents, internal and external, appear in one list.
3. Each agent shows where its traces come from and whether it has been scored.

**Priority:** P0
**Estimate:** M
**Dependencies:** AI-15712 for internal agents

### In-app Getting Started guide

Problem to solve: AI-15163 produces a document, but the persona needs the connection steps inside the product at the moment they need them.

AC:

1. A new user with no connected agent sees the guide on first sign-in.
2. The guide gives the MCP connection instructions in plain language, with a copy button for each command.
3. The guide can be reopened later from the app.

**Priority:** P0
**Estimate:** M
**Dependencies:** AI-15163 (client capability matrix) for the per-client content

### Connection status in the guide

Problem to solve: after following the steps, users cannot tell whether the connection worked until traces show up somewhere else.

AC:

1. The guide shows when the first traces from the agent arrive.
2. If no traces arrive within a set time, the guide shows a plain-language next step.

**Priority:** P0
**Estimate:** S
**Dependencies:** In-app Getting Started guide. Related: AI-15162 (verify_setup), AI-15176 (check_status).

# Next

## Re-score and iterate loop (stories under existing AI-15149)

Theme: Self-improvement loop. Horizon: Next. Flow step 13. Parent: **AI-15149** Self-update loop, which already covers feeding improvements back (step 12).

### Agent version detection

Problem to solve: AgentScore cannot compare scores across versions unless it knows when an agent changed.

AC:

1. A new agent version is recorded when the agent reports an update through `report_update` (AI-15174) or when the user marks one.
2. Every score is linked to the agent version it measured.

**Priority:** P1
**Estimate:** M
**Dependencies:** AI-15174

### Re-score on new version

Problem to solve: the loop only closes if the new version is tested the same way the old one was.

AC:

1. When a new version is recorded, the user is offered a re-run of the same test selection (step 9).
2. The re-run uses the same scenario and scorecard versions unless the user changes them.

**Priority:** P1
**Estimate:** M
**Dependencies:** Agent version detection, Stimulation scenarios and scoring

### Version comparison

Problem to solve: users need to see whether the improvements they applied actually helped.

AC:

1. The user can compare two versions side by side, overall and by category.
2. Changes within the sample's margin are marked as not significant.

**Priority:** P1
**Estimate:** M
**Dependencies:** Re-score on new version

## Scorecard editing

Theme: Dynamic scoring. Horizon: Next.

**Ask:** Let the owner shape the scorecard after the first draft: add axes, change weights, and refine rubrics in chat. Eaton called editable success criteria and weighted dimensions "exactly what I was looking for," and New Vision accepted custom dimensions.

**Acceptance Criteria:**

1. The owner can add, remove, and reweight axes.
2. The owner can refine the scorecard in chat.
3. Every edit creates a new version, and earlier grades stay on their version.

**Priority:** P1
**Dependencies:** Dynamic scoring at onboarding (step 7 epic), Versioned scorecard model.

### Add and reweight axes

Problem to solve: the first draft will miss things the owner cares about, and the owner knows which axes matter most.

AC:

1. The owner can add an axis with a name and rubric, and set or change each axis's weight.
2. A live cost preview shows how each added axis changes the cost per graded session.
3. Saving creates a new scorecard version.

**Priority:** P1
**Estimate:** M
**Dependencies:** Versioned scorecard model

### Chat refinement

Problem to solve: chat is the main way owners will change a scorecard after the draft, and its mechanics are listed as unspecified in the concept doc.

AC:

1. The owner can describe a change in chat, and AgentScore proposes the exact scorecard edit.
2. Nothing changes until the owner accepts the proposed edit.
3. An accepted edit creates a new version.

**Priority:** P1
**Estimate:** L
**Dependencies:** Add and reweight axes. Related: AI-11885, AI-11887.

### Reference material

Problem to solve: some rubrics depend on the owner's own documents, such as a requirements list or policy.

AC:

1. The owner can attach reference material to a scorecard, within a size cap.
2. A decision on whether changing reference material creates a new scorecard version is recorded and applied.

**Priority:** P1
**Estimate:** M
**Dependencies:** Versioned scorecard model

## Session scoring

Theme: Dynamic scoring. Horizon: Next.

**Ask:** Group related traces into a session so a score covers a whole task or conversation, not one step. The August 24 working session named session-based scoring one of the two highest-priority product gaps.

**Acceptance Criteria:**

1. Related traces are grouped into sessions automatically.
2. A user can grade a whole session, after a price preview.
3. Session scores appear wherever trace scores do today.

**Priority:** P1
**Dependencies:** Versioned scorecard model.

### Session model and detection

Problem to solve: there is no concept of a scoring session today, only individual traces.

AC:

1. A session can be opened and closed explicitly, or declared through a trace attribute.
2. Sessions sit on top of the existing trace store and do not change how traces are stored.
3. Detecting sessions has no grading cost.

**Priority:** P1
**Estimate:** L
**Dependencies:** none. Inferring sessions from timing gaps is left for later.

### Session grading

Problem to solve: grading is the paid step, so it must be a deliberate action with a known price.

AC:

1. The user sees an estimated price before a session is graded, and grading starts only after they confirm.
2. The session score covers every trace in the session, using the agent's scorecard.

**Priority:** P1
**Estimate:** M
**Dependencies:** Session model and detection, Price preview before the first graded run (step 7 epic)

### Session view

Problem to solve: users need to see what a session contained before they trust its score.

AC:

1. A session lists its traces in order, with its score and per-axis results.
2. Each deduction links to the trace it came from.

**Priority:** P1
**Estimate:** M
**Dependencies:** Session grading

## Progress bars for remaining actions (story under existing AI-10597)

Theme: App usability. Horizon: Next. Parent: **AI-10597**, if it is still open. Otherwise this needs a new parent.

### Long-running action inventory and coverage

Problem to solve: AI-15179 to AI-15181 cover ingestion, scorecard building, and the scoring run, but the roadmap asks for progress on all long-running actions.

AC:

1. A list of every action that can take more than a few seconds is written and agreed.
2. Each action on the list not already covered shows progress using the shared component (AI-15178).
3. New actions from this roadmap, such as stimulation runs, use the same component.

**Priority:** P1
**Estimate:** M
**Dependencies:** AI-15178

# Later

## Improvement value

Theme: Quantitative cost function. Horizon: Later. Flow step 14.

**Ask:** Put a measured cost or risk value on each improvement and show improvements by category, so the person making the ship call can see what each fix is worth. The research doc notes that none of the needed data exists in the product today.

**Acceptance Criteria:**

1. Improvements are shown by category, each with a value.
2. Token-spend savings are measured, not estimated.
3. Risk values use a documented model and the customer's own inputs, and are labelled as estimates.

**Priority:** P2
**Dependencies:** Stimulation scenarios and scoring, Re-score and iterate loop (a value needs a before and after).

### Eval catalog of record (spike)

Problem to solve: the research found the eval and dimension counts differ across marketing, the PRD, the FAQ, and the frontend, so any cost taxonomy needs one catalog first.

AC:

1. One eval catalog is agreed as the source of truth.
2. Each eval is tagged with a loss category: reputational, regulatory, direct financial, or waste.

**Priority:** P2
**Estimate:** S
**Dependencies:** none

### Token-spend savings per improvement

Problem to solve: waste is the one loss category that can be measured with data the product already has.

AC:

1. For an improvement applied between two versions, AgentScore shows the change in token spend per session.
2. The value shows the sample size it came from.

**Priority:** P2
**Estimate:** M
**Dependencies:** Version comparison

### Risk exposure estimate

Problem to solve: regulatory and reputational value depends on how often a failure happens and how much it costs this customer, which cannot be hardcoded.

AC:

1. The customer can enter magnitude inputs, such as interactions per day or records touched.
2. AgentScore shows an annualized risk estimate per category, using frequency times magnitude.
3. Every risk value is labelled as an estimate, with its inputs shown.

**Priority:** P2
**Estimate:** L
**Dependencies:** Eval catalog of record. Needs failures attributed to specific evals, which does not exist yet and may need its own epic.

### Improvements by category view

Problem to solve: users need one place to see what their improvements were worth.

AC:

1. Improvements are grouped by category, each with its value and how it was calculated.
2. Measured values and estimates are visually distinct.

**Priority:** P2
**Estimate:** M
**Dependencies:** Token-spend savings per improvement

## Tenant-wide agent report

Theme: Tenant-wide agent reporting. Horizon: Later. Flow step 15.

**Ask:** Give the person who decides what ships one report covering every agent in the tenant, instead of one report per agent.

**Acceptance Criteria:**

1. A user can generate one report covering every agent in their tenant.
2. The report can be shared outside AgentScore.

**Priority:** P2
**Dependencies:** none for a first version. Richer content depends on Improvement value.

### Report content definition

Problem to solve: we have not decided what a decision maker needs in a tenant-wide report.

AC:

1. A one-page report outline is agreed with at least two beta accounts.

**Priority:** P2
**Estimate:** S
**Dependencies:** none

### Report generation

Problem to solve: building the report by hand across agents does not scale past a few agents.

AC:

1. The report lists every agent with its score, verdict, and latest change.
2. The report is generated on demand from current data.

**Priority:** P2
**Estimate:** M
**Dependencies:** Report content definition

### Report export

Problem to solve: decision makers often do not log in to AgentScore.

AC:

1. The report can be exported as a PDF or a share link.
2. Share links respect tenant permissions.

**Priority:** P2
**Estimate:** M
**Dependencies:** Report generation

## AIWS rescore and score movement (stories under existing AI-11881)

Theme: AIWS integration. Horizon: Later. Parent: **AI-11881** AI Workspace Integration (In Progress).

### "New evidence available. Rescore?" prompt

Problem to solve: AIWS users cannot tell when new traces make a rescore worthwhile.

AC:

1. A minimum number of new traces is agreed before the prompt shows.
2. The prompt appears next to the AIWS agent once that threshold is passed.
3. Clicking it starts a rescore.

**Priority:** P2
**Estimate:** M
**Dependencies:** AI-11912

### Scoring status in AIWS

Problem to solve: users do not know whether a score is running, and it is open whether this works when every AgentScore endpoint is a GET.

AC:

1. A decision on how AIWS learns scoring status (polling a GET endpoint or a new endpoint).
2. AIWS shows whether a score is running for the agent.

**Priority:** P2
**Estimate:** M
**Dependencies:** AI-11912

### Score change indicator in AIWS

Problem to solve: a single score does not show whether the agent is getting better or worse.

AC:

1. An arrow next to the AIWS score shows how the score moved since the last run.
2. Changes within the sample's margin show as no change.

**Priority:** P2
**Estimate:** S
**Dependencies:** AI-11912

## Suggested ordering across all drafts

1. Now, sprint 1: step 7 sprint 1, First-cohort categories spike, Scenario schema, Stimulation run API, Unified agent list.
2. Now, sprint 2: step 7 sprint 2, HTTP and chat adapter, Run tagging, Gates library v1, In-app Getting Started guide.
3. Now, sprint 3: step 7 sprint 3, MCP adapter, Stimulation MCP tools, Trace-seeded scenario bank, Category-based selection, Connection status.
4. Now, sprint 4: Agent profiling prompt, Gate enforcement and run report, Improvements from stimulation results.
5. Next: Re-score loop, Scorecard editing, Session scoring, Progress bar coverage, Stimulation CLI.
6. Later: Improvement value, Tenant-wide report, AIWS stories.

## Open questions for the remaining drafts

- **Stimulation is large.** Two epics and 15 items. One engineer for "a few weeks" (the research estimate) covers the first slice only, roughly the runner, gates v1, and the run report.
- **Profiling prompt overlap.** Step 7's owner interview and step 8's profiling prompt ask similar questions. The step 7 spike should decide whether they are one flow.
- **AI-10597 status.** It did not appear in the open Testing AI query. Confirm it is open before parenting the progress bar story there.
- **Failure attribution.** The risk estimate needs failures attributed to specific evals. That may need its own epic before Improvement value can start.
