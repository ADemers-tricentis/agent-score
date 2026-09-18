# Demo Usability Decision Log

Tracks changes made to `agentscore-frontend` specifically to improve usability for non-technical users: what changed, who it's for, and why. Does not track feature/build-out work (cloning screens, wiring fixture data, matching production feature parity) unless the change itself was made for a usability reason.

Every entry is checked against the live source in `agentscore-frontend/src` before being logged - not just commit messages, which can describe a change that was intended but never actually landed.

---

## 2026-09-16 - Renamed "Agents" nav item/page to "My Agents"

**Change:** Renamed the "Agents" label to "My Agents" in the sidebar nav (`MinimalShell.tsx`), the list page header (`AgentsSearchPage.tsx`), the agent-detail breadcrumb (`agent-shell.tsx`), and the still-unwired `sidebar-nav.ts` (kept in sync to avoid drift). Left the tenant-scoped "Agents" tab (`tenant-shell.tsx`) and stat card (`TenantOverviewPage.tsx`) unchanged - those refer to a specific tenant's agents, not the global list, and "My Agents" wouldn't fit that context. This diverges from production, which still labels this "Agents" (verified in `agent-score/frontend/src/shared/components/sidebar-nav.ts`).

**Who it's for:** Non-technical admins navigating the demo - "My Agents" reads as more personally relevant/less abstract than "Agents" for a first-time viewer.

**Why:** Resolves part of the "Agent" naming collision flagged in the initial usability audit - distinguishing the user-facing agent list from the more technical "Agent Registry" section.

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

**Change:** Reused the `TermLabel` tooltip helper (`shared/components/term-label.tsx`) across the Evals Catalog. In `ProfileBuilderPage.tsx`: added tooltips to the "Verdict bands" section title, the "Block (rec)" band label, and the "Threshold"/"Weight"/"Dimension" table column headers; reworded the disabled dropdown's placeholder from "No weighted match" to "No matching dimension" and added a proactive tooltip on the "Dimension" header explaining the constraint (only dimensions with a weight set below are selectable) instead of only surfacing it after the fact; added a plain-language framing sentence above the existing mechanics-focused subtitle ("A profile defines how this agent gets scored..."). In `eval-card.tsx`: added a `KIND_TOOLTIPS` map and wrapped the "G-Eval"/"Hybrid" kind badges (on the collapsed eval card and the detail panel header) in `TermLabel`; left "Library" unwrapped since it's self-explanatory (revisited below - it got its own tooltip too).

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

## 2026-09-17 - Inline "create tenant" from the Create Agent dialog

**Change:** The New Agent dialog's Tenant combobox (`AgentsSearchPage.tsx`) now has a "+ Create new tenant…" option pinned above the tenant list. Picking it opens a small nested dialog (Name + Kind, via the existing `RadioCards`) instead of the full `TenantCreatePage`; on submit it calls the same `tenantsApi.createTenant` the Tenants section uses, mirrors the result into the `FAKE_TENANTS` array the combobox itself reads from (so it appears immediately, without a refetch), and auto-selects the new tenant back in the Create Agent dialog. This is feature/build-out work, not a usability rename - logged here per direct request rather than because it fits this doc's usual scope.

**Who it's for:** Anyone creating an agent for a tenant that doesn't exist yet - previously required abandoning the Create Agent dialog, going to Tenants > New tenant, then starting over.

**Why:** Requested directly by the user (2026-09-17), from a screenshot of the tenant picker dropdown.

---

## 2026-09-17 - Added an admin-only Integrations page for API keys

**Change:** New top-level `/integrations` page (`IntegrationsPage.tsx`), nav-gated to the Admin role only (added `integrations` to `destination-tiers.ts` as a superadmin tier, alongside Tenants/Users). Shows an empty state ("No tenant to hold a key" + a "Create a tenant" link) when no external tenant exists yet; otherwise a tenant picker (skipped when there's only one external tenant) plus the existing shared `ApiKeysPanel` - the same add/rotate/revoke UI already used on the back-office tenant Integrations tab, reused here over the same `tenant-fixtures.ts` adapter, capped at 20 keys like the real customer-side surface. This is feature/build-out work (the shared `ApiKeysPanel` component's own doc comment already names this as an intended consumer that just hadn't been built in this demo clone), logged here per direct request rather than because it fits this doc's usual scope.

**Who it's for:** An admin managing which API keys can send trace data into AgentScore, without needing to go through a specific tenant's detail page to find the Integrations tab.

**Why:** Requested directly by the user (2026-09-17), from a screenshot of the intended blank state.

---

## 2026-09-17 - Finished the "inference" -> "Provider" rename; extended the plain-language pass to Users and LLM Catalog

**Change:** Finished propagating the "New inference" -> "New Provider" rename (flagged as a follow-up in the entry above) into `LLMInferenceCreatePage.tsx`: breadcrumb, `<h1>`, subtitle, section descriptions, the connection-test copy, and the submit button now all say "Provider" instead of "inference," matching the button that links to this page. Then extended the same cleanup into `LLMCatalogPage.tsx` (toasts, search placeholder/aria-label, the count in the toolbar, the empty state, and the delete-confirmation dialog body, which also dropped "Soft-deletes"/"soft-deleted" and "benchmark/metric" for plain wording) and into `UsersPage.tsx`, mirroring the Tenants/Agents pass logged above: **Soft-delete -> Delete** (row action, dialog title, submit button) and **Revoke sessions -> Sign out everywhere** (row action, success toast), plus a plain-language rewrite of the delete/restore dialog bodies. Internal type, variable, and function names (`LLMInferenceOut`, `deleteInference`, `softDeleteTarget`, etc.) are unchanged - only user-visible copy moved.

**Who it's for:** A non-technical admin managing providers or users - the same audience as the Tenants/Agents pass, closing the "same jargon pattern exists there but wasn't part of the agreed scope" gap it left open.

**Why:** Requested directly by the user (2026-09-17): fix the flagged inference/Provider naming mismatch, and extend the Soft-delete/Hard-purge-style plain-language cleanup to Users and LLM Catalog.

---

## 2026-09-17 - Extended blank-state onboarding to more pages; added a cross-page "Take a tour" walkthrough

**Change:** Two additions, both requested directly. (1) A new shared `OnboardingCallout` component (`shared/components/onboarding-callout.tsx`, modeled on `MilestoneBanner` but with non-persisted dismissal) now shows on My Agents, Evals Catalog, and Tenants while `useDemoMode().blank` is on - the same blank-mode pattern that previously only existed on Home's "Get started" checklist. Also branched the existing DataTable empty-state copy on `blank` for Agents and Tenants so it doesn't misdescribe a new-tenant view. (2) A new manual, presenter-triggered product tour (`shared/tour/`: `tour-steps.ts`, `tour-context.tsx`, `TourOverlay.tsx`, `use-tour-rect.ts`) that spotlights an element via `data-tour="..."` attributes and navigates across routes (Home sidebar -> Get started checklist [blank mode only] -> My Agents -> Evals Catalog -> done), built from MUI primitives only (Popper + a boxShadow spotlight), no new dependency. `TourProvider` mounts inside the router (`router.tsx`'s `protectedLayoutRoute`, wrapping `MinimalShell`), not alongside `DemoModeProvider` in `main.tsx`, since it needs `useNavigate`. Triggered by a "Take a tour" button in Home's `PageHeader` actions. State isn't persisted - a reload ends it. One notable engine detail: when a spotlighted target covers most of the viewport (e.g. the Evals Catalog's full scrollable content pane), no `flip` placement has room on any side, so the overlay falls back to a centered card instead of an off-screen Popper.

**Who it's for:** A presenter walking a prospect through the product for the first time - the tour narrates itself across pages instead of requiring the presenter to explain every click, and the onboarding callouts keep the "you're in a sample/blank state" framing consistent everywhere the checklist sends a viewer, not just on Home.

**Why:** Requested directly by the user (2026-09-17): extend the existing blank-state pattern past Home, and add a lightweight guided tour.

---

## 2026-09-17 - Plain-language + validation pass on the agent Scoring schedule panel

**Change:** In `ScheduleSection.tsx` (agent Settings page, "Refresh schedule" panel): (1) "Autonomous scoring" -> "Automatic scoring," with its description rewritten in plain language ("When on, this agent is scored on its own on a schedule. Turn off to only score it when you click Score now.") in place of the jargon "first-run discovery"/"cadence scoring" wording; (2) "Cadence (minutes)" -> "Check frequency (minutes)" and "Lookback (days)" -> "History window (days)," both now carrying a `TermLabel` info-icon tooltip (the same shared component used for jargon call-outs elsewhere in the app); (3) the two schedule fields now disable, with an explanatory caption, whenever automatic scoring is off, since they don't do anything in that state; (4) added real client-side validation - out-of-range values (cadence < 60, lookback outside 1-90) now show a red error state and message and disable Save, instead of only having non-enforcing helper text. Also updated the matching `FormSection` description on `AgentSettingsPage.tsx` to the same plain-language wording.

**Who it's for:** A non-technical admin configuring an agent's scoring schedule - fewer unexplained technical terms, and the UI now visibly reflects which controls are actually live instead of leaving disabled-in-effect fields looking editable.

**Why:** Requested directly by the user (2026-09-17), from a screenshot of the panel ("we can probably make this better, right?"), with the explicit goal of getting non-technical people onboarding as quickly as possible.

---

## 2026-09-17 - Added the missing tooltip for the "Library" eval kind badge

**Change:** Added a `library` entry to `KIND_TOOLTIPS` in `eval-card.tsx` ("A ready-made metric from AgentScore's built-in library, scored against a preset rubric."), so the "Library" kind badge on both the collapsed eval card and the detail panel header now carries a `TermLabel` tooltip like the existing "G-Eval" and "Hybrid" badges do. Previously `library` had no entry and was left unwrapped on the assumption it was self-explanatory.

**Who it's for:** A non-technical viewer of the Evals Catalog - "Library," "G-Eval," and "Hybrid" all now explain themselves consistently instead of two out of three badges having a tooltip and one not.

**Why:** Requested directly by the user (2026-09-17): "we also need to add a tooltip description for library evals."

---

## 2026-09-17 - Better example data for the agent Profile tab's "Why this profile" panel

**Change:** In `profile-fixtures.ts`, changed `agent-3`'s ("invoice-reconciler") fit decision (`fit-3a`) from a heuristic match with no confidence score and a single candidate to an AI-assisted match with a real confidence score (83%) and three ranked candidates (General Automation Baseline · v4 chosen at 0.83, Customer Support Triage · v2 at 0.54, Code Review Assistant · v1 at 0.31), each with a plain-language reason. No component code changed - the "Why this profile" panel already supported multiple ranked candidates and an AI-assisted confidence score; this fixture just wasn't using either.

**Who it's for:** Anyone viewing this panel as a demo - the previous example showed "Not recorded" confidence and only one candidate, which undersold what the feature actually does (rank multiple candidate profiles with a real confidence score).

**Why:** Requested directly by the user (2026-09-17): "can we have a better example for why this profile," pointing at a screenshot of the weak `agent-3` example.

---

## 2026-09-17 - Ingest reminder on the Create Agent dialog, branched on tenant kind

**Change:** In `NewAgentDialog` (`AgentsSearchPage.tsx`), added a block below the existing "Kind" indicator that reads the same tenant-derived `kind` already used to fix the agent's kind: for an **external** tenant, shows the OTLP traces endpoint (`https://agent-score-ingest.product.tricentis.com/internal/otel/v1/traces`) in a `CodeBlock` with a one-click Copy button, plus a line pointing to the tenant's API key under Integrations; for an **internal** tenant, shows a plain caption that traces are ingested automatically, no exporter needed. Added the `TRACE_INGEST_URL` constant (matches the real endpoint documented in `agent-score-skill/skills/agent-score/references/env-vars.md`). No message shown until a tenant is picked, consistent with the existing "Determined by the tenant" placeholder.

**Who it's for:** Whoever is creating an agent for an external tenant - they need the ingest URL to configure their OTEL exporter, and previously had to go find it elsewhere (or already know it). Internal-tenant creators get reassurance instead of a URL they don't need.

**Why:** Requested directly by the user (2026-09-17): "when we are adding a new agent, if the user is using an external tenant, lets remind them the url to send traces to and make it so they can copy it. if it is internal, lets show a message that there agents will be automatically ingested."

---

## 2026-09-17 - Moved tenant Integrations from its own tab into Settings

**Change:** Removed the standalone "Integrations" tab from the tenant detail shell (`tenant-shell.tsx`) - it only ever rendered for external tenants - and folded its content (the `ApiKeysPanel`, unchanged) into a new "Integrations" `FormSection` on `TenantSettingsPage.tsx`, shown only when `tenant.kind === "external"`. Deleted `TenantIntegrationsPage.tsx` and its route (`/tenants/$tenantId/integrations`) from `router.tsx`; the now-unused `tenantKind` prop was removed from `TenantShellProps` and its one call site (`TenantDetailLayout.tsx`). Updated stale doc comments in `ApiKeysPanel.tsx`, `api-keys-adapter.ts`, and the top-level `IntegrationsPage.tsx` that referenced the deleted file/tab, and the "Authenticate with the tenant's API key" hint in the Create Agent dialog (logged above) now points to the tenant's Settings tab instead of Integrations. This is a deliberate divergence from production - `agent-score/frontend` still has Integrations as its own tab; this is a demo-only usability choice, not a claim about what the real app does.

**Who it's for:** An admin managing a tenant - one fewer tab to check, and Integrations sits next to the other tenant-configuration sections (General, Provisioning, Danger zone) instead of being the only kind-gated tab in the strip.

**Why:** Requested directly by the user (2026-09-17), after asking "do you think that makes sense?" - I'd initially pushed back (production parity, key-management discoverability), user decided to move it anyway: "yeah move it. update any references."

---

## 2026-09-17 - Removed the top-level Integrations page and sidebar item

**Change:** Deleted `back-office/integrations/IntegrationsPage.tsx` and its route (`/integrations`) from `router.tsx`, and removed the "Integrations" entry (and its now-unused `IconMaterialSymbolsKey` import) from `MinimalShell.tsx`'s sidebar `NAV_ITEMS`. Left the `integrations` entry in `destination-tiers.ts`'s `DESTINATION_GATES` alone - `MinimalShell`'s nav list was already a deliberate subset of that table (it excludes several unbuilt sections by the same pattern), so no other file needed a change. Updated `ApiKeysPanel.tsx`'s doc comment, which previously described the panel as shared by two mount points - now just the one (tenant Settings).

**Who it's for:** An admin who now manages API keys per-tenant (from that tenant's Settings tab) - this removes the redundant cross-tenant picker page and sidebar entry now that the same panel lives on every external tenant's own Settings tab.

**Why:** Requested directly by the user (2026-09-17), immediately after the tab-to-Settings move above: "no i want integrations in the tenant detail page. remove it from the sidebar" - correcting an initial assumption that the top-level admin page should stay alongside the per-tenant section.

---

## 2026-09-18 - Removed Agent Registry from the sidebar; added a collapsible "Advanced" nav group

**Change:** Removed the "Agent Registry" entry from `MinimalShell.tsx`'s `NAV_ITEMS` (the route/page itself is untouched - just no longer linked from the sidebar). Moved Evals Catalog, LLM Catalog, and Reports out of the main nav list into a new collapsible "Advanced" group (collapsed by default, toggled via a MUI `Collapse` + arrow icon, gated by the same `canAccess`/staff-visibility rules the items already had), positioned after the "Docs" link so it's the last item in the sidebar.

**Who it's for:** A user setting up their own environment for the first time - fewer top-level nav items competing for attention, and Agent Registry (a staff-only build catalog) isn't yet meant to be user-facing.

**Why:** Requested directly by the user (2026-09-18): "remove the agent registry from the sidebar - users don't need access to that yet," followed by a decision to group the three secondary items under a collapsible "Advanced" section rather than a separate mode toggle, then to move that group to the end of the nav.

---

## 2026-09-18 - Simplified tenant creation and settings for a single-tenant self-serve customer

**Change:** On `TenantCreatePage.tsx`: removed the "Kind" (External/Internal) choice - every tenant a customer creates is now hardcoded `kind: "external"` - and removed the Region field entirely. Reworded the remaining copy to drop internal-only framing: the `<customer>-<env>` naming convention, the "back-office" reference, and the metadata placeholder example that leaked a Tricentis CSM email (`csm: "lior@tricentis.com"`), replaced with a generic customer-relevant example. Removed the "region" concept end-to-end rather than leaving it half-visible: the `TenantProfile` type, seed data, and list filters/facets in `tenant-fixtures.ts`; the table column and filter chip on `TenantsPage.tsx`; the header meta line on `TenantDetailLayout.tsx`; and the Overview-tab display on `TenantOverviewPage.tsx`. On `TenantSettingsPage.tsx`: removed the "Kind" field from General (kept in the separate read-only "Provisioning" block); removed the "Grouping attributes" section altogether once Region was gone and Environment was its only remaining (already-locked, uneditable) field - Environment now displays as a plain read-only value in Provisioning instead, alongside Kind/Created/Updated; and gated the "Danger zone" (Delete/Restore/Permanently delete) to render only for external tenants, since internal tenants shouldn't be deletable from here.

**Who it's for:** A customer setting up their own AgentScore environment - someone who will only ever have one tenant and has no reason to reason about Tricentis-internal tenant kinds, infrastructure regions, or CSM/contract metadata.

**Why:** Requested directly by the user (2026-09-18), starting from a screenshot of the New tenant form: "this is for a user setting up their own environment. I imagine they won't have a need for multiple tricentis tenants... how can we make this better?" Extended over several follow-ups to Region (list column and form field), to Kind on the Settings page, to gating tenant deletion to external tenants only, and finally to dropping the now-single-field Grouping attributes section once its only remaining field was already read-only: "since users can't change it, maybe we remove this as a settings option and instead just display the value in the provisioning section."

---

## 2026-09-18 - Extended tenant-deletion gating to the Tenants list row actions

**Change:** The list-page kebab menu on `TenantsPage.tsx` (`RowActions`) now only renders Delete / Restore / Permanently delete when `tenant.kind === "external"` - previously only the tenant Settings-page Danger zone had this restriction (logged above), leaving internal tenants deletable from the list view even though their own Settings page hid the option. Internal tenants' menu now shows only "Open."

**Who it's for:** Same audience as the Settings-page restriction above - keeps internal tenants non-deletable everywhere in the UI, not just from their own Settings page.

**Why:** Flagged as a leftover inconsistency immediately after the Settings-page change above; user confirmed (2026-09-18): "yes fix that."

---

## Template for new entries

```
## YYYY-MM-DD - <short title>

**Change:** what was changed, in concrete terms (files/components/behavior).

**Who it's for:** the audience or user this serves (e.g. non-technical demo viewers, sales presenters, a specific persona from the audit).

**Why:** the rationale - what usability problem it solves or which audit finding it responds to.
```
