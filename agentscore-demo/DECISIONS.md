# Demo Usability Decision Log

Tracks changes made to `agentscore-demo` specifically to improve usability for non-technical users: what changed, who it's for, and why. Does not track feature/build-out work (cloning screens, wiring fixture data, matching production feature parity) unless the change itself was made for a usability reason.

Every entry is checked against the live source in `agentscore-demo/src` before being logged - not just commit messages, which can describe a change that was intended but never actually landed.

---

## 2026-09-16 - Renamed "Agents" nav item/page to "My Agents"

**Change:** Renamed the "Agents" label to "My Agents" in the sidebar nav (`MinimalShell.tsx`), the list page header (`AgentsSearchPage.tsx`), the agent-detail breadcrumb (`agent-shell.tsx`), and the still-unwired `sidebar-nav.ts` (kept in sync to avoid drift). Left the tenant-scoped "Agents" tab (`tenant-shell.tsx`) and stat card (`TenantOverviewPage.tsx`) unchanged - those refer to a specific tenant's agents, not the global list, and "My Agents" wouldn't fit that context. This diverges from production, which still labels this "Agents" (verified in `agent-score/frontend/src/shared/components/sidebar-nav.ts`).

**Who it's for:** Non-technical admins navigating the demo - "My Agents" reads as more personally relevant/less abstract than "Agents" for a first-time viewer.

**Why:** Requested directly by the user (2026-09-16). Also resolves part of the "Agent" naming collision flagged in the initial usability audit - distinguishing the user-facing agent list from the more technical "Agent Registry" section.

---

## 2026-09-16 - "Get started" checklist + sample agent for the blank/new-login state

**Change:** Added a `GettingStartedChecklist` card to the Home dashboard (`DashboardPage.tsx`), shown only when the "Blank / new login" demo toggle is on, sitting above the (already zeroed) KPI row rather than replacing it. Steps link straight to My Agents, the Evals Catalog, and Users (Users only for the Admin role, matching the existing staff/admin nav gating). Also added a pre-loaded, fully-scored "Sample Support Agent" (`agent-sample`, tenant `tenant-sample`, `agents/fake-data.ts`) with matching Profile (`scoring/profile-fixtures.ts`) and Runs/Score (`scoring/fake-runs.ts`) fixtures, tagged `is_sample: true` and badged "Sample" in the agent table (`activity-cells.tsx` → `SampleBadge`). `listAgentsFlat`/`listAgentGroups` gained an `onlySample` filter, wired from `AgentsSearchPage`'s `blank` state (via `AgentGroupSection`'s `GroupedFilters` too, for Grouped view) so a blank-state viewer's My Agents list shows only the sample agent (plus anything they create from there) instead of the full 8-agent roster.

**Who it's for:** A first-time/brand-new-tenant viewer of the demo - someone who just logged in and would otherwise see an all-zero dashboard and a fully populated 8-agent roster that isn't theirs.

**Why:** Requested directly by the user (2026-09-16) as a way to reduce first-login friction: give new users something to click into immediately (the sample agent) and a short, role-aware list of next actions (the checklist), instead of a wall of zeros with no guidance.

**Tradeoff accepted:** The sample agent's tenant (`tenant-sample` / "Sample Workspace") is a real entry in `FAKE_TENANTS`, so it also shows up as an extra row on the always-on Tenants and LLM Catalog pages regardless of the blank toggle - not gated, since those pages don't thread a "sample" concept at all. Left as-is rather than expanding scope to filter it out everywhere; it reads fine as one more harmless tenant row in the populated demo view.

---

## 2026-09-16 - Simplified the Users page: dropped "Add user", "Kind", and "superadmin"

**Change:** Removed the standalone "Add user" button/action from `UsersPage.tsx` (the `/users/new` route and `UserCreatePage.tsx` stay - they're still reachable from the Access Requests queue's Approve action, which is the only way a user now gets created). Removed the "Kind" (staff/customer) column from the users table and the "Kind" field/badge from `UserEditPage.tsx`'s detail header and General section; `UserCreatePage.tsx` no longer asks for it either, and just creates every account as `kind: "staff"` (matching what Access Requests approval always produced anyway). Dropped the kind-based restriction that disabled the Admin role option for customer-kind users, since kind is no longer a visible concept for the viewer to reason about. Renamed the "superadmin" role label to "Admin" everywhere it's displayed (chips, radio cards, filters, counts) - the underlying field/type names (`is_superadmin`, `UserRole = "superadmin" | "member"`) are unchanged, since those also drive real nav-gating logic in `destination-tiers.ts` that's out of scope here.

**Who it's for:** Admins managing users in the demo - fewer concepts to explain (no "Kind" distinction, one role vocabulary) and one less no-op entry point ("Add user" duplicated what Access Requests already does).

**Why:** Requested directly by the user (2026-09-16). Role-changing (member ↔ admin, via the existing role radio cards on `UserEditPage`) already worked for any admin viewing another user's row before this change - the Users nav item itself is admin-only, so anyone who can reach the page already has the ability.

---

## 2026-09-16 - Added a native "Docs" section

**Change:** Added a "Docs" nav item (always visible, any role - no production back-office equivalent to gate it against) linking to a new `/docs/$slug` route (`src/back-office/docs/DocsPage.tsx`). Section/page structure (4 sections, 10 pages, titles + one-line blurbs) mirrors the real customer-facing docs site 1:1 (`agent-score-marketing/docs-src/src/nav.ts`, copied into `src/back-office/docs/nav.ts`) so the demo's docs nav reads as the real product. Every page body is a placeholder ("This page is a placeholder — content coming soon.") - not wired to the real docs content.

**Who it's for:** Whoever is running the demo - lets them show that customer docs exist and are reachable from the product, without yet needing the real doc content to be accurate or finished.

**Why:** Requested directly by the user (2026-09-16): "add the customer facing docs to the demo... don't worry about content, we can fix it later." Confirmed via a follow-up question that a native section built in the demo's own shell (not an iframe embed or an external link) was the wanted approach.

---

## 2026-09-16 - Restyled the agent Score tab away from an "engineering report" look

**Change:** On the agent detail Score tab (`/tenants/$tenantId/agents/$agentId?sub=run`) and the run-detail page it drills into:
- `per-point-grid.tsx`: replaced four stacked MUI `Table`s (one per dimension, each repeating "Evaluation | Result | Average | Target" headers) with a single rounded card per dimension, a tinted header showing "N of N passing," and pill-shaped status badges ("Meets threshold" / "Needs attention") in place of bare icon+text table cells.
- `ScorecardTab.tsx`: the four bare run-count numbers (interactions scored, checks contributed, etc.) now sit in soft tinted stat tiles instead of floating unstyled in a row; card corners softened from 4px to 8px radius to match.
- `score-uncertainty.tsx`: the confidence bar is now pill-shaped, and dropped the redundant middle "Score 90.0" label (the composite is already shown big above it) - just the lower/upper bounds remain, in muted gray.
- `RunsTab.tsx`: run-history table copy de-jargoned - "population" → "Standard run" (or hidden when it's the default), "N traces" → "N interactions" to match the plain-language wording used above; run-ID hash de-emphasized to secondary gray.
- Made row-level clickability legible: every clickable eval row and per-interaction trace row gets a trailing chevron (rotates 90° when expanded); trace IDs in the drill-through panel render in link-blue with an underline-on-hover, since a gray-text-plus-hover-tint treatment alone wasn't obviously clickable.
- Fixed the drill-through panel (`ScoringRunResultPage.tsx`'s `PerPointScorecard`/`DrillThroughPanel`) to expand inline directly under the clicked eval row (via new `PerPointGrid` props `expandedSlug`/`renderExpanded`), instead of always rendering at the bottom of the whole Evaluation breakdown regardless of which category was clicked.

**Who it's for:** Anyone viewing a scorecard who isn't the engineer who built the scoring pipeline - the prior layout (repeated table headers, "checks could not be evidenced," "population"/"traces" jargon, a drill-through panel that popped up disconnected from what was clicked) read as a QA/CI report rather than a product screen.

**Why:** Requested directly by the user (2026-09-16): "make this page look less engineery." Iterated in three rounds based on live feedback: (1) initial restyle of tables/stats/confidence bar/runs table, (2) added visible affordance (chevron) once the user noted row-clickability wasn't obvious, (3) moved the drill-through panel inline and strengthened the trace-row hover treatment to full link styling after the chevron alone still wasn't clear enough. Left the "checks contributed" / "could not be evidenced" / "interactions retired" stat-tile wording as-is - inline code comments flag that phrasing as intentionally precise about interaction-vs-evaluation count grains, so it wasn't changed without being asked.

---

## 2026-09-17 - Plain-language tooltips on the scoring run result page

**Change:** Rewrote the tooltip copy on `ScoringRunResultPage.tsx` (the per-run result detail page) to drop technical/pipeline vocabulary: "Verdict zone" (dropped "score band"/"configured thresholds"), "Score stability" ("fresh sample of interactions" → "tested this agent again"), the "evaluation results scored" / "evaluations" / "results lacked evidence" stat tiles (dropped "interaction-and-evaluation pairs," "distinct evaluation checks," "the evaluator needed"), the "reused"/"newly scored" chips (dropped "underlying trace," "judge," "traces"), and "Baseline comparison" (dropped "run" in favor of "score"). No layout, data, or component structure changed - only the `tooltip`/`title` strings passed to `TermLabel` and the reuse-chip `Tooltip`.

**Who it's for:** A non-technical viewer of a scoring run result - someone who needs to understand what a stat or badge means without knowing pipeline terms like "trace," "judge," or "evidence ref."

**Why:** Requested directly by the user (2026-09-17): "can we make the tooltips on this page more plain language? A non-technical user should be able to easily understand this."

---

## 2026-09-17 - Plain-language tooltips on the Score tab

**Change:** Added `TermLabel` tooltips to the agent detail Score tab (`ScorecardTab.tsx`): "How stable is this score?", the four stat tiles ("interactions scored," "checks contributed," "checks could not be evidenced," "interactions retired"), the "reused"/"newly scored" chips, the "Evaluation breakdown" header, and the "N need attention" chip - all using the same plain-language phrasing already used on the run-result page. Extracted the `TermLabel` helper (previously local to `ScoringRunResultPage.tsx`) into `shared/components/term-label.tsx` so both pages share one implementation.

**Who it's for:** A non-technical viewer of the Score tab - the same audience as the 2026-09-17 run-result-page tooltip pass, extended to the tab they land on first.

**Why:** Requested directly by the user (2026-09-17): "can we add tooltips here as well? non-technical focus," referencing the Score tab screenshot.

---

## 2026-09-17 - Plain-language jargon pass on the Evals Catalog / Profile Builder

**Change:** Reused the `TermLabel` tooltip helper (`shared/components/term-label.tsx`) across the Evals Catalog. In `ProfileBuilderPage.tsx`: added tooltips to the "Verdict bands" section title, the "Block (rec)" band label, and the "Threshold"/"Weight"/"Dimension" table column headers; reworded the disabled dropdown's placeholder from "No weighted match" to "No matching dimension" and added a proactive tooltip on the "Dimension" header explaining the constraint (only dimensions with a weight set below are selectable) instead of only surfacing it after the fact; added a plain-language framing sentence above the existing mechanics-focused subtitle ("A profile defines how this agent gets scored..."). In `eval-card.tsx`: added a `KIND_TOOLTIPS` map and wrapped the "G-Eval"/"Hybrid" kind badges (on the collapsed eval card and the detail panel header) in `TermLabel`; left "Library" unwrapped since it's self-explanatory.

**Who it's for:** A non-technical admin trying to set up scoring via Evals Catalog > Profiles > New profile - flagged in the initial usability audit as "the single most technical screen in the app... with no plain-language path at all."

**Why:** Requested directly by the user (2026-09-17), following up on the initial usability audit's Evals Catalog findings. Scoped to the specific jargon terms and disabled-state confusion the audit called out (G-Eval, Hybrid, verdict bands, block_rec, the disabled dropdown) rather than restructuring the builder into a wizard - that was flagged as a bigger, separate follow-up.

---

## 2026-09-17 - Added a generic "Documentation Assistant Baseline" example profile

**Change:** Added a new profile to `profile-catalog-fixtures.ts` (`docs-assistant-baseline`) modeling a RAG-based Q&A agent that answers from a knowledge base - weighted toward Factual Accuracy (threshold 0.85, weight 3) and Answer Relevancy (0.75, weight 2), with Harmlessness (0.85, weight 2), Prompt Alignment (0.70, weight 1), and Conciseness (0.60, weight 1) rounding it out. Uses only evals/dimensions already present in the fixtures; default verdict bands.

**Who it's for:** Anyone watching the demo, not just Tricentis's own test-suite audience - the existing example profiles ("ATA Regression Baseline," "Code Review Assistant") assume internal/engineering context, while a documentation/support Q&A bot is a pattern any company evaluating AgentScore would recognize.

**Why:** Requested directly by the user (2026-09-17): "give me a good example that would be applicable to anyone (not just Tricentis users)."

---

## 2026-09-17 - Plain-language reasoning on the agent Profile tab's "Why this profile" panel

**Change:** In `ProfileFitTab.tsx` (agent Profile tab, `FitProvenancePanel`/`DiscriminationSection`): the "Method" chip now shows "AI-assisted match"/"Rule-based match" instead of raw `llm`/`heuristic`, with a `TermLabel` tooltip explaining each; "Trigger" is now run through the existing `readableName()` humanizer (previously shown raw/unhumanized, unlike the fit-history row below it) and has a tooltip explaining what a trigger is; "Selection confidence" gets a tooltip, and its caption dropped the internal term "profile fitter" for "Confidence score from the automatic profile-matching system"; "Evidence diversity" gets a tooltip explaining what the bare number means; "Profile quality across agents" now shows a one-line plain-language summary (e.g. "This profile's checks can reliably tell a good agent run from a bad one") above the existing AUC/statistics sentence, for all six discrimination verdicts.

**Who it's for:** A non-technical viewer of an agent's Profile tab trying to understand why a given profile was auto-selected - flagged in the initial usability audit as raw-ML-jargon territory ("binding source," "discrimination verdict," "AUC," "drift nudge").

**Why:** Requested directly by the user (2026-09-17): "lets give plain language reasoning as to why a profile was chosen," pointing at a screenshot of this exact panel.

---

## 2026-09-17 - Plain-language copy pass on Tenants and Agents

**Change:** In `AgentsSearchPage.tsx` and `AgentSettingsPage.tsx`: reworded "Each agent is one ingest identity bound to its tenant" and the raw `provisioning → active` state-machine notation (Provisioning section description, new-agent dialog) into plain sentences ("New agents briefly show as Connecting, then switch to Active..."). In `TenantsPage.tsx` and `TenantCreatePage.tsx`: reworded "One tenant per customer × environment" into "One tenant per customer, per environment (like production or staging)." Across `AgentSettingsPage.tsx`, `TenantsPage.tsx`, and `TenantSettingsPage.tsx`: renamed the danger-zone actions **Soft-delete → Delete** and **Hard-purge → Permanently delete** in row labels, buttons, dialog titles/copy, disabled-reason tooltips, and success toasts. Kept "Deactivate" as-is and did not reuse it for Soft-delete, since Agents already has a separate non-destructive Deactivate action distinct from delete - the audit's suggested "Soft-delete → Deactivate" mapping would have collided with it here. Left Users and LLM Catalog untouched (same jargon pattern exists there but wasn't part of the agreed scope for this pass).

**Who it's for:** A non-technical admin browsing Tenants or Agents - flagged in the initial usability audit ("ingest identity bound to its tenant" and "provisioning → active" leak backend vocabulary; "Soft-delete/Hard-purge" are engineering terms where plain customer language would work fine).

**Why:** Requested directly by the user (2026-09-17), following up on the initial usability audit's high-leverage fix list (jargon renames, items 1-3) as the agreed next step after the Evals Catalog/Profile jargon pass.

---

## 2026-09-17 - Plain-language descriptions on every top-level page, framed as one customer's own view

**Change:** Added a `description` prop to the shared `EntityShell` component (`entity-shell.tsx`) - same visual style as `PageHeader`'s existing `description`, rendered below the title/badges row - since Users, Evals Catalog, and Agent Registry are built on `EntityShell` rather than `PageHeader` and had no equivalent slot. Then gave every top-level page a one-line, plain-language description: added new ones to **Users** ("People in your organization who can sign in here...") and **Evals Catalog** ("The checks and scoring recipes used to grade your agents' answers."), which previously had none; fixed jargon in the existing **LLM Catalog** description ("inferences" -> "AI models," "superadmins" -> "your organization's admins") and **Agent Registry**'s existing blurb (moved out of the tiny-caption `meta` slot into the new `description` slot, dropped "task slots"/"fleet" for "Internal catalog of agent software builds and versions... Staff-only"); and reworded **Home**, **My Agents**, **Tenants** (list + create), and **Reports** away from staff/multi-customer phrasing ("every tenant," "across every customer," "cross-tenant") to first-person-customer phrasing ("your tenants," "your agents"), per the user's correction that this demo represents one customer's own view, who may have multiple tenants and agents but is not viewing across other customers. Left **Docs** unchanged - it has no landing page (redirects straight to a default article) and each article already carries its own plain-language title + blurb.

**Who it's for:** A non-technical customer admin exploring any section of the app for the first time - continuing the initial usability audit's "plain-language layer on first use of jargon" recommendation, extended from individual tooltips to the page-level description every section already has room for.

**Why:** Requested directly by the user (2026-09-17): "lets add plain language descriptions for each page," followed by a correction mid-review that the copy needed to read as one customer's own view (their tenants, their agents) rather than a staff/cross-customer view.

---

## 2026-09-17 - Renamed the LLM Catalog's primary action from "New inference" to "New Provider"

**Change:** The user changed the LLM Catalog page's primary action button label from "New inference" to "New Provider" directly in `LLMCatalogPage.tsx` (`data-testid="new-inference-button"` kept as-is). Not yet propagated: `LLMInferenceCreatePage.tsx` (the page that button navigates to) still says "New inference" in its breadcrumb, "Add inference" in its `<h1>`, and "Registers a named LLM inference in the global catalogue" in its subtitle - flagging this as a follow-up rather than changing it unprompted.

**Who it's for:** Continues the same LLM Catalog jargon cleanup as the page-description fix above - "inference" as a product noun for a model connection was one of the audit's specific call-outs.

**Why:** User-made edit; logged per the project's decision-log convention.

---

## Template for new entries

```
## YYYY-MM-DD - <short title>

**Change:** what was changed, in concrete terms (files/components/behavior).

**Who it's for:** the audience or user this serves (e.g. non-technical demo viewers, sales presenters, a specific persona from the audit).

**Why:** the rationale - what usability problem it solves or which audit finding it responds to.
```
