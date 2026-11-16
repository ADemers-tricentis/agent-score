**AgentScore Roadmap - Jira Alignment**

Date: 11-11-2026. Status: draft, read-only check. Nothing was written to Jira in this phase.

Roadmap: [2026-11-11-agentscore-beta-roadmap.md](../roadmap/2026-11-11-agentscore-beta-roadmap.md)

**Scope:** project AI, Team = Testing AI (`cf[10001] = 78b767ff-8d79-459d-b8e6-4021bd68a014`), pulled 11-11-2026. 43 epics (29 in Done or Won't Do) and 66 open stories, tasks and bugs. Done and Won't Do epics are skipped unless they show a roadmap feature already shipped. Story-to-epic grouping comes from the `parent` field (evidence view), not from key order.

**Counts:** 11 aligned (9 epics, 2 groups with no epic), 9 out of scope, 10 likely missing.

**Jira change made before this phase, at the user's request:** the Team field on [AI-17189](https://tricentis.atlassian.net/browse/AI-17189) was empty, so the quality gate brief did not appear on board 8084. It is now set to Testing AI.

# Aligned

| Epic | Summary | Status | Theme | Roadmap feature | Notes |
|---|---|---|---|---|---|
| [AI-15150](https://tricentis.atlassian.net/browse/AI-15150) | Status and error handling | Backlog | Improved onboarding; App usability | Guided first session (AI-17229, AI-17230, AI-16010, AI-16011); App usability (AI-15176, AI-15177) | **Guess on the split.** The two new onboarding stories are parented here, but the epic name is about status and errors. AI-16010 (keep the score until the next successful run) and AI-16011 (look past 24 hours when fewer than 20 traces) support reaching a first score. AI-15176 (check_status tool) and AI-15177 (plain-language error mapping) read as App usability. |
| [AI-15828](https://tricentis.atlassian.net/browse/AI-15828) | Stimulation test runner | Backlog | Stimulation testing | Steps 8, 10, 17: profiling prompt (AI-15844), run API, adapters, run tagging, MCP tools (AI-15845 to AI-15849), CLI (AI-15850) | The runner stories predate the 11-11 decision that the user's coding agent runs the suite. See Likely missing. |
| [AI-15829](https://tricentis.atlassian.net/browse/AI-15829) | Stimulation scenarios and scoring | Backlog | Stimulation testing | Steps 9, 11: categories spike, scenario schema, gates library, trace-seeded bank, category selection (AI-15851 to AI-15855); gate enforcement and run report, improvements (AI-15856, AI-15857); Safety gate on simulation results (AI-15853, AI-15856) | Gate enforcement (AI-15856) is the likely home of the CLI go / no-go on simulation results only. Check its acceptance criteria say so. |
| [AI-10597](https://tricentis.atlassian.net/browse/AI-10597) | AgentScore Improvements | Not returned (epic is outside the Testing AI filter) | App usability | Progress bars (AI-15178 to AI-15181, AI-15870); plain-language descriptions (AI-15268) | The epic itself does not carry the Testing AI team, so it does not appear on the board's epic list. Its other children are Done infrastructure work (AI-10604 to AI-10607). |
| [AI-15832](https://tricentis.atlassian.net/browse/AI-15832) | Session scoring | Backlog | Session grouping | Session grouping (AI-15867, AI-15868, AI-15869) | Full coverage: session model, grading, view. |
| [AI-11882](https://tricentis.atlassian.net/browse/AI-11882) | Beta Legal & Compliance Engineering | Backlog | Trace data protection | PII and sensitive-data redaction from traces (AI-11914) | AI-16911 (Done) and AI-16915 (To Do) redact PII in Better Stack telemetry, not in stored traces. Treated as operational, see Out of scope. |
| [AI-11881](https://tricentis.atlassian.net/browse/AI-11881) | AI Workspace Integration | Backlog | AIWS integration | Score and ship decision next to the AIWS agent (AI-11912) | AI-11910 and AI-12670 are open and still not in the feature list. AI-11911 is Done. Unchanged from 11-04. |
| [AI-15833](https://tricentis.atlassian.net/browse/AI-15833) | Improvement value | Backlog | Quantitative cost function | Measurable improvements by category; quantitative cost function | Epic only, no stories. See Likely missing. |
| [AI-15834](https://tricentis.atlassian.net/browse/AI-15834) | Tenant-wide agent report | Backlog | Tenant-wide agent reporting | Report generation for all agents in a tenant | Epic only, no stories. See Likely missing. |
| No epic: [AI-17189](https://tricentis.atlassian.net/browse/AI-17189) | Quality gate brief | To Do | Quality gate | All four Quality gate features | One brief-level story, no parent epic. See Likely missing. |
| No epic: [AI-16547](https://tricentis.atlassian.net/browse/AI-16547), [AI-16564](https://tricentis.atlassian.net/browse/AI-16564), [AI-16563](https://tricentis.atlassian.net/browse/AI-16563) | Internal agent trace tasks | Done, Done, To Do | Internal Tricentis agents | Score every internal Tricentis agent | **Guess.** SMITH traces into agent-score and performance-agent span attributes are Done. AI-16563 (stop minting agents named after LangGraph nodes) is open and affects how internal agents appear. Rollout itself has no ticket, which matches "no product work expected". |

**Shipped, already marked done on the roadmap:** [AI-11884](https://tricentis.atlassian.net/browse/AI-11884) plain-language evaluations in the scoring UI (Done), [AI-15147](https://tricentis.atlassian.net/browse/AI-15147) plain-language agent setup (Done), [AI-15146](https://tricentis.atlassian.net/browse/AI-15146) hosted MCP server foundation (Done).

# Out of scope

Open epics, and open work with no epic, that map to no roadmap feature.

| Epic | Summary | Status | Why it is not on the roadmap | Recommendation |
|---|---|---|---|---|
| [AI-11875](https://tricentis.atlassian.net/browse/AI-11875) | Beta Commercial Model Instrumentation | In Progress | Metering and billing instrumentation, a commercial track, not a user-facing feature. | Keep, off the product roadmap. |
| [AI-12370](https://tricentis.atlassian.net/browse/AI-12370) | Commercialization / Monetization Integration | In Progress | Commercial track (AI-12387, AI-12388). AI-13841 integrates the on-prem licensing service. | Keep. **The roadmap should probably add on-prem readiness**: today's sync named it as engineer prep work, and 4 of 13 demos required it (weekly deck, 11-06). |
| [AI-15148](https://tricentis.atlassian.net/browse/AI-15148) | Scoring suggestions | To Do | Six To Do stories for an improvement advisor (AI-15165 to AI-15170). The 11-04 roadmap marked the self-improvement loop done, and AI-17229 now owns plain-language advice in the first session. | **Review.** Descope if the advice shipped under other keys. Keep under Improved onboarding if not. Mapping is a guess. |
| [AI-15149](https://tricentis.atlassian.net/browse/AI-15149) | Self-update loop | Backlog | Playbook, guardrails, audit and anomaly stories (AI-15171 to AI-15175) for a loop the roadmap marks done. Version detection, re-score on new version and version comparison (AI-15861 to AI-15863) overlap the quality gate's drop-from-previous-revision condition. | Descope the loop stories that shipped. Fold version comparison into the quality gate decomposition, or defer it. |
| [AI-15827](https://tricentis.atlassian.net/browse/AI-15827) | Dynamic scoring at onboarding | Backlog | Nine stories (AI-15835 to AI-15843) for automatic profile and eval selection, which the roadmap marks done. | Descope. Defer AI-15843 (price preview before the first graded run) until pricing is set. |
| [AI-15831](https://tricentis.atlassian.net/browse/AI-15831) | Scorecard editing | In Progress | Active work (AI-16559, AI-16647 Done; AI-15866 open) with no roadmap theme. | Keep. **The roadmap should probably list it**, likely under App usability, since it is in progress. |
| [AI-12375](https://tricentis.atlassian.net/browse/AI-12375) | [Flagged] Split AgentScore Monorepo into Per-Service Repos | Won't Do | Engineering work. AI-12411 is still In Progress under a Won't Do epic. | Keep off the roadmap. Flag the open story under a closed epic to engineering. |
| [AI-15137](https://tricentis.atlassian.net/browse/AI-15137) | Automatic tenant provisioning | Done | Marked done on the roadmap, but AI-15270 (Tosca Cloud login for all tenants) is Ready to Deploy and AI-15142 (AIWS tenant reconciliation) is Backlog. | Keep. Finish the AI-15270 deploy. AI-15142 is already called out under AIWS integration. |
| No epic: [AI-16915](https://tricentis.atlassian.net/browse/AI-16915) | OTel collector: switch Better Stack redaction hash from md5 to hmac-sha256 | To Do | Operational telemetry hygiene, not stored-trace redaction. | Keep, off the roadmap. |

# Likely missing

| # | Theme (horizon) | Roadmap feature | Coverage | Why we think it is missing, and what is uncovered |
|---|---|---|---|---|
| 1 | Quality gate (Now) | All four features | Partial | [AI-17189](https://tricentis.atlassian.net/browse/AI-17189) is an approved brief with 24 acceptance criteria in one story, no epic, and no stories. The brief says the next step is a file-level spec. Uncovered as buildable work: the condition model and gate evaluation, flags with acknowledge and override, tenant-level conditions and templates, history and the read surfaces (customer app API, MCP, AI Workspace internal API), and starting a revision from the customer app. |
| 2 | Improved onboarding (Now) | Guided first session | Partial | [AI-17229](https://tricentis.atlassian.net/browse/AI-17229) covers the web path: Connect on first login, auto-update after connection, naming, waiting screen, progress, scoring at about 20 traces, the Improve button and plain-language advice. [AI-17230](https://tricentis.atlassian.net/browse/AI-17230) covers the MCP thread. Uncovered: one verdict vocabulary across screens, a gap the 11-04 roadmap listed. |
| 3 | Workflow management (Now) | Workflow-level grouping | None | No epic or story groups a multi-agent flow into one workflow. AI-11911 (Done) lets AIWS users choose workflows to score, which is a different feature. |
| 4 | Stimulation testing (Next) | Test suite through the MCP, run by the user's coding agent (step 10) | Partial | **Guess.** The runner stories assume AgentScore drives the agent: run API (AI-15845), HTTP and chat adapter (AI-15846), MCP target adapter (AI-15847). The 11-11 sync decided the user's coding agent pulls the suite through the MCP and runs it. AI-15849 (Stimulation MCP tools) likely covers exposing the suite. Uncovered: guidance that tells the coding agent how to run the suite and send traces back (an MCP resource like `onboard-your-agent`), tests linked to their results per agent across re-runs, and generating adversarial tests from an existing eval such as PII. Review the adapter stories against the new decision; do not edit them from here. |
| 5 | App usability (Next) | Plain-language failure summary | None | AI-15268 covers eval and dimension descriptions. AI-15177 covers error messages. AI-17229 covers the improvement advice. None gives a one-line reason per failed trace or eval in the UI. |
| 6 | JEV / decision model (Next) | Hybrid JEV and judge | None | No epic or story. What JEV expands to is still an open question on the roadmap, so a spike may come first. |
| 7 | Tricentis identity (Next) | Trident sign-in | None | No epic or story. AI-12369 (Done) is the Okta / Tosca Cloud SSO work this replaces. Readiness is probably Q1 2027. |
| 8 | AIWS integration (Later) | "New evidence available. Rescore?" prompt, scoring status, score change indicator | None | Unchanged from 11-04: no story for any of the three. |
| 9 | Quantitative cost function (Later) | Measurable improvements by category; quantitative cost function | Partial | Epic [AI-15833](https://tricentis.atlassian.net/browse/AI-15833) exists with no stories. |
| 10 | Tenant-wide agent reporting (Later) | Report generation for all agents in a tenant | Partial | Epic [AI-15834](https://tricentis.atlassian.net/browse/AI-15834) exists with no stories. |

# Draft epics and stories

To be written in Phase 4.
