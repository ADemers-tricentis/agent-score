# AgentScore Roadmap - Jira Alignment and Draft Stories

Date: 2026-10-14
Roadmap: [2026-10-14-agentscore-beta-roadmap.md](../roadmap/2026-10-14-agentscore-beta-roadmap.md)
Status: Alignment complete. Story drafts pending.

Source: Testing AI team issues in project AI (board 8084), read on 2026-10-14. Read-only. Nothing was changed in Jira.

## Jira alignment

### Aligned

| Roadmap feature | Jira | Notes |
|---|---|---|
| Tosca Cloud sign-in with login-or-create tenant | AI-15137 epic, AI-15270 (Ready to Deploy, Highest), AI-15139; AI-12369 Okta SSO (Done) | Covered. Open bug AI-15269 (Wolters Kluwer cannot log in) belongs to this feature. |
| Automatic tenant provisioning | AI-15137 epic: AI-15138, AI-15139, AI-15142, AI-15143 | Covered. |
| Join existing tenants | AI-15140 | Covered. |
| Zero-config agent connection via MCP | AI-15146 Hosted MCP server foundation (AI-15151 to 15157), AI-15147 Plain-language agent setup (AI-15158 to 15164), AI-15150 Status and error handling (AI-15176, 15177) | Covered in depth. |
| First-score output (suggested improvements) | AI-15148 Scoring suggestions (AI-15165 to 15170) | Covered. |
| Improvement feedback to the agent | AI-15149 Self-update loop (AI-15171 to 15175: playbook, guardrails, audit, anomaly flagging) | Covers step 12. |
| Progress bars for all actions | AI-10597 AgentScore Improvements: AI-15178, 15179, 15180, 15181 | Covers ingestion, scorecard building, scoring run. See "Likely missing" for "all actions". |
| Plain-language descriptions of dimensions and evals | AI-10597: AI-15268; AI-11884 (Done) | Covered. |
| PII and sensitive-data redaction | AI-11882 Beta Legal and Compliance: AI-11914 (To Do, Medium) | Covered, but see the placement question below. |
| Score and ship decision next to the AIWS agent | AI-11881 (In Progress): AI-11912 | Partial. Confirm ship_decision is in scope. AI-11910, 11911, 12669, 12670 are in the epic but not in the roadmap list. |

### Out of scope (no roadmap feature)

These are open epics with no matching roadmap feature. None are product features in the roadmap notes, so the roadmap may be incomplete rather than the epics wrong.

| Epic | Status | Recommendation |
|---|---|---|
| AI-11875 Beta Commercial Model Instrumentation (credits per run, weekly usage dashboard, per-tenant feature flag) | In Progress | **Keep, and add a theme.** The commercial model is Labs graduation criterion 2, so it is likely roadmap-worthy. |
| AI-12370 Commercialization / Monetization Integration (AI-12387, 12388, 13841) | In Progress | Keep. Same theme as above. |
| AI-13913 Gainsight Instrumentation (AI-13910 In Progress, AI-13909) | To Do | Keep. Supports the active-users graduation criterion. |
| AI-11882 Beta Legal and Compliance (except AI-11914) | In Progress | Keep. Beta enabler. |
| AI-12375 Split AgentScore Monorepo into Per-Service Repos, flagged (AI-12411) | In Progress | Defer from the roadmap. Engineering enabler, not a user feature. |
| AI-15005 (scoring judge prompt-cache markers), AI-14331 (OTel metrics from AgentScore components) | To Do, In Progress | Not epics, no parent. Treat as engineering hygiene and leave off the roadmap. |

### Likely missing

| # | Roadmap feature | Why I believe it is missing |
|---|---|---|
| 1 | **Stimulation testing** (profiling prompt, category-based test selection, automated runs, scoring and improvement generation) | No open epic. Related past work is closed: AI-12231 Discovery and Owner Interview and AI-12232 Dynamic Scoring (both Won't Do), and AI-11885 Conversational eval/profile building (Backlog under the Done epic AI-11871). Highest confidence. |
| 2 | **Unified agent view** | No epic or story found. It may already exist in the app, in which case it is shipped and should be marked so. |
| 3 | **In-app Getting Started guide** | Only AI-15163 (client capability matrix and a one-page user guide) is related, and it reads as a document, not an in-app guide. Partial. |
| 4 | **Re-score and iterate loop** (version-aware re-scoring and comparison) | AI-15149 covers feeding improvements back, but nothing covers scoring the new version and repeating the cycle. |
| 5 | **Measurable improvements with cost function** | Nothing covers per-improvement cost or risk value. AI-11896 tracks credits per run, which is Tricentis billing, not the user-facing value. |
| 6 | **Progress bars for the remaining actions** | Only ingestion, scorecard building, and scoring run are covered. "All actions" needs a list. |
| 7 | **AIWS "New evidence available. Rescore?" prompt** | No story. Needs the minimum-new-traces rule decided first. |
| 8 | **AIWS scoring status** | No story. Feasibility is open because all endpoints are GETs. |
| 9 | **AIWS score change indicator** | No story. |

### Board hygiene (not roadmap, but surfaced by this review)

- **AI-11871 is Done but has three Backlog stories:** AI-11885, AI-11886, AI-11887. AI-11886 (skill-based agent setup) looks superseded by AI-15164, which replaces the Claude Code skill with the MCP path.
- **Story-to-epic grouping for AI-15146 to AI-15177 is inferred from key order,** because Jira did not return the parent field for those stories. Spot-check before drafting new stories under them.
- **AI-11914 (PII redaction) sits under a beta epic** while the roadmap places it in Later.

## Draft epics and stories

*Pending (Phase 4).*
