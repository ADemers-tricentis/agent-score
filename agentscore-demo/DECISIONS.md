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

## Template for new entries

```
## YYYY-MM-DD - <short title>

**Change:** what was changed, in concrete terms (files/components/behavior).

**Who it's for:** the audience or user this serves (e.g. non-technical demo viewers, sales presenters, a specific persona from the audit).

**Why:** the rationale - what usability problem it solves or which audit finding it responds to.
```
