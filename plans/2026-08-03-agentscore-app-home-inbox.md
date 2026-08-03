# AgentScore domain-practitioner UI — Home redesign: triage inbox

## Goal

Replace `agent-score-app`'s Home dashboard (KPI cards + "agents needing
attention" table + verdict distribution + recent-runs table, all of which link
out to a separate Agent Overview page to actually see *why* something failed)
with a single triage inbox: one feed of every thing across every agent that
needs a human decision, expandable in place, with the action taken right
there — no navigation required for the common case.

Explicit permission from the user: this does not need to match any existing
screen or flow in `agent-score-app` or `agent-score` (the AI-engineer
back-office prototype). Full freedom on IA for Home. Per-agent pages
(`AgentOverviewView` and its five tabs, `RunDetailView`, `SessionDetailView`)
are **out of scope** for this pass — they remain reachable as a secondary
"browse by agent" path (via the existing sidebar Agent switcher and via an
"Open agent →" link from each inbox row), but are not being redesigned here.

## Why (context for whoever executes this)

The app's whole premise (see `agent-score-app/README.md`) is abstracting
AI-engineer complexity into plain language for a domain practitioner (tester,
legal reviewer — no AI/ML background). Live walkthrough of the current app
surfaced two problems, and the user asked for a bigger rethink of Home
specifically: today, seeing *why* one agent needs attention takes Home →
Agent Overview → Scoring tab → Run Detail → Session Detail (3 navigations),
and Home itself is a dashboard of aggregate numbers rather than a queue of
actionable decisions. The user picked, from three sketched directions, the
one that flips this: Home becomes the inbox; agent pages become secondary.

## Source of truth

Existing code in `agent-score-app/src/`:
- `types.ts` — `Session`, `LabelingCandidate`, `Golden`, `SafetyOverride`,
  `Attribution`, `ShipDecision`, `Agent`, `Readiness`, `ScoringRun`,
  `ScoringRunDetail`.
- `data/mock.ts` — `listAgents`, `getAgentReadiness`, `listAgentScoringRuns`,
  `getScoringRun`, `listLabelingQueue`, `submitLabel`, `recordShipDecision`,
  `READINESS_THRESHOLD` (20).
- `views/home/AttentionTable.tsx`, `KpiCards.tsx`, `VerdictDistribution.tsx`,
  `RecentScoringRunsTable.tsx` — being replaced/trimmed, read these first so
  the replacement doesn't regress anything worth keeping (see "What happens
  to the existing Home components" below).
- `views/session-detail/ShipDecisionPanel.tsx`, `AttributionPanel.tsx` —
  reused directly (session item) rather than rebuilt.
- `views/agent-overview/labeling/LabelingCandidateCard.tsx` — reused directly
  (labeling item) rather than rebuilt. Takes `{ candidate, onConfirm,
  onOverride }`, no `agentId` prop — the wrapper closes over `agentId`.
- `components/shared/{GradeChip,VerdictChip,AgentTypeTag}.tsx` — reuse for
  chips/tags in the new rows.

## What counts as an inbox item

An item is something that needs a **decision**, not just a number that's low:

1. **Session item** — a session on an agent's *latest* scoring run with
   `verdict !== "PASS"` or a `safetyOverride` present. Action: record/edit a
   `ShipDecision` (reuse `ShipDecisionPanel` as-is).
2. **Labeling item** — an entry in `listLabelingQueue(agentId)`. Action:
   confirm or override (reuse `LabelingCandidateCard` as-is).

**Not** an inbox item: an agent still below the 20-trace onboarding
threshold (`Readiness.ready === false`). There's no decision to make there,
just "keep waiting" — it's informational. Keep these out of the action feed
entirely; they show up only in the collapsed resting section below (see
below), so the practitioner never mistakes "still onboarding" for "needs your
input."

An agent whose composite score is merely below the Ship threshold, but which
today has no non-PASS/safety-override session (e.g. every individual session
passed but pass-rate math or margin pushed it under threshold) contributes
*no* item under this model — there's nothing concrete to act on. This is a
narrowing versus today's `AttentionTable` (which flags on composite score
alone) — flagged as an open call below.

## Data layer additions (`src/types.ts` + `src/data/mock.ts`)

```ts
// types.ts additions

export type InboxSeverity = "critical" | "warning";

export interface InboxSessionItem {
  kind: "session";
  agentId: string;
  runId: string;
  runLabel: string;
  session: Session;
}

export interface InboxLabelingItem {
  kind: "labeling";
  agentId: string;
  candidate: LabelingCandidate;
}

export type InboxItem = InboxSessionItem | InboxLabelingItem;

export interface AgentInboxGroup {
  agentId: string;
  agentName: string;
  agentType: AgentType;
  severity: InboxSeverity;
  /** Plain-language summary of the single worst item, e.g. "Exposed a credential in output". */
  topReason: string;
  items: InboxItem[];
}

export interface RestingAgentSummary {
  agentId: string;
  agentName: string;
  agentType: AgentType;
  status: "ship" | "onboarding";
  /** Only present when status === "onboarding". */
  captured?: number;
  threshold?: number;
}
```

```ts
// mock.ts additions

/**
 * One group per agent that has at least one inbox item. Severity priority
 * (worst wins for both the group's severity and its topReason): a Critical
 * safetyOverride > a High safetyOverride > a non-PASS session without an
 * override > a labeling candidate. Sort groups critical-first, then by most
 * recent item timestamp.
 */
export async function listInboxGroups(): Promise<AgentInboxGroup[]>

/**
 * Every agent with zero inbox items, split by whether they're ready
 * (nothing to review — shipping cleanly) or still below the trace threshold
 * (nothing to review yet).
 */
export async function listRestingAgents(): Promise<RestingAgentSummary[]>
```

Implementation notes for `listInboxGroups`/`listRestingAgents`:
- Fan out with `Promise.all` over `listAgents()`, then per agent:
  `getAgentReadiness`, `listAgentScoringRuns(agentId, { limit: 1 })` to find
  the latest run, `getScoringRun(agentId, latestRun.id)` for its `sessions`,
  and `listLabelingQueue(agentId)`.
- An agent not yet `ready` (per `Readiness`) is skipped from
  `listInboxGroups` entirely regardless of what its (likely sparse/seed) data
  looks like, and instead appears in `listRestingAgents` with
  `status: "onboarding"`.
- No new seed data should be required — Milestone 2's existing seeds already
  cover PASS/PARTIAL/FAIL sessions, safety overrides, and labeling queue
  entries per agent. If any of the six seeded agents end up with zero groups
  and zero interesting resting state, adjust seed data minimally (e.g. ensure
  at least 2-3 agents produce inbox groups, at least one of them `critical`)
  rather than reshaping the aggregation logic around thin data.

## Components (`src/views/home/`)

Replace `AttentionTable.tsx`, `VerdictDistribution.tsx`,
`RecentScoringRunsTable.tsx` and their usage in `HomeView.tsx`. Keep
`KpiCards.tsx` but trim it (see below). New files:

### `InboxSection.tsx`
Top-level container. Fetches `listInboxGroups()` + `listRestingAgents()`
once (mirror `HomeView`'s existing fetch-on-agents-change pattern). Renders:
- A list of `InboxAgentRow`, one per `AgentInboxGroup`, critical severity
  visually distinct from warning (color-coded dot/left-border, matching the
  red/yellow used in the approved sketch).
- Empty state ("Nothing needs your attention right now.") when
  `listInboxGroups()` returns `[]`.
- A `RestingAgentsSection` below, collapsed by default.

### `InboxAgentRow.tsx`
Collapsed: severity indicator, agent name, `AgentTypeTag`, `topReason` (or,
when `items.length > 1`, `"${items.length} items flagged"` instead of a
single reason — the sketch's "2 items flagged" case), a `Review ▾`
chevron control.

Expanded (click anywhere on the row, same interaction as today's
`AttentionTable`): renders each `InboxItem` inline —
- `kind === "session"` → a compact card: `ScoreRing` or just `GradeChip` +
  score, the session's `scenario` name, a `safetyOverride` alert if present
  (reuse the alert styling from `SessionDetailView`), the root-cause line
  from `AttributionPanel` (either reuse `AttributionPanel` directly, or — if
  it reads as too dense for an inbox row — a trimmed version showing just
  `rootCause` + `confidence`; use your judgment on which reads better inline,
  full chain + recommendations feel like a lot for a collapsed-by-default
  row), then `ShipDecisionPanel` reused as-is with its existing props.
- `kind === "labeling"` → `LabelingCandidateCard` reused as-is, with
  `onConfirm`/`onOverride` closing over `item.agentId` to call
  `submitLabel`/refetch.
- A trailing "Open agent →" link (same pattern as today's `AttentionTable`)
  navigating to `{ name: "agent-overview", agentId }` for full context.

After any action (ship decision saved, label submitted), refetch
`listInboxGroups()` so the row updates or disappears live — same "watch it
change with no reload" pattern the app already uses for `simulateTraces`.

### `RestingAgentsSection.tsx`
Collapsed by default, header shows a one-line count (e.g. "4 agents ·
nothing to review"). Expanded: a plain compact list, one line per
`RestingAgentSummary` — `status: "ship"` rows just show the agent name/type
and a small "Shipping cleanly" note; `status: "onboarding"` rows show
"Still gathering traces (`captured`/`threshold`)". No actions here, it's
purely informational — clicking a row still navigates to that agent's
overview if someone wants to look.

## What happens to the existing Home components

- `AttentionTable.tsx` — deleted, replaced by `InboxSection`/`InboxAgentRow`.
- `VerdictDistribution.tsx` — **dropped**, not folded in anywhere. It's an
  aggregate trend chart, which is exactly the "dashboard" framing this
  redesign is moving away from — there's no decision it drives. Flagged
  below as the one cut you may want to push back on.
- `RecentScoringRunsTable.tsx` — **dropped**. A full cross-agent run history
  already exists per-agent (Scoring tab's "Scoring run history" table); this
  was the only place it existed *aggregated* across agents, so this is a
  real loss of an at-a-glance "what ran recently" view — also flagged below.
- `KpiCards.tsx` — **kept but trimmed to one line**, not four tiles. Drop
  the "NEEDS ATTENTION" tile (redundant with the inbox itself) and consider
  collapsing the remaining three (Active Agents / Traces 7d / Scoring Runs
  7d) into a single small text line under the Home header rather than a grid
  of `Paper` cards — the inbox is now the visual hero of the page, a KPI
  grid competing for attention above it undercuts that. Exact wording your
  call; something like: *"6 agents · 86 traces and 14 scoring runs in the
  last 7 days."*

## Routing (`src/view.ts`, `src/App.tsx`)

No changes needed. `View` already has `"home"` and `"agent-overview"`; the
inbox resolves everything inline and only navigates out via the existing
"Open agent →" pattern, which already exists in `AttentionTable` today.

## Open decisions flagged for the user (don't guess silently — confirm before/while building)

1. **Dropping `VerdictDistribution` and `RecentScoringRunsTable` entirely.**
   These are being cut, not relocated. If either aggregate view (verdict
   trend, cross-agent recent activity) turns out to matter for the keynote
   demo narrative, say so before this is built and it can move into the
   collapsed resting section or a small secondary panel instead of being
   deleted.
2. **Narrowing "needs attention" from "composite score below threshold" to
   "has a concrete non-PASS/safety-override session or labeling item."**
   This is more correct for an *inbox* (nothing to act on otherwise) but is a
   behavior change from today's `AttentionTable`, which flags purely on
   score. Confirm this narrower definition is what's wanted.
3. **How dense the expanded session item should be** (full `AttributionPanel`
   vs. a trimmed root-cause-only version) — noted inline above as an
   executor judgment call, but flag your choice back for a quick look before
   considering this done.

## Suggested execution order

1. Data layer: add the types + `listInboxGroups`/`listRestingAgents` to
   `mock.ts`, sanity-check against seed data (adjust seeds minimally only if
   needed per the note above).
2. `InboxAgentRow` + `RestingAgentsSection` (can build in parallel — they
   don't depend on each other, both depend only on step 1's types).
3. `InboxSection` wiring both together + `HomeView.tsx` update (remove old
   imports/usage, add trimmed `KpiCards` line + `InboxSection`).
4. Browser verification: confirm at least one critical-severity row, one
   multi-item row, one labeling-only row, and the resting section's both
   sub-states (ship + onboarding) all render and their actions work
   (confirm/override persists, ship decision persists, rows update/disappear
   live without reload). Check light and dark mode.
