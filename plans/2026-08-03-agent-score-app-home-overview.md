# AgentScore domain-practitioner UI — Milestone 1: Home + Agent Overview

## Goal

Stand up a new, simplified frontend for AgentScore aimed at the **Domain Practitioner**
persona (a QA/legal/finance expert with no AI background) — as opposed to the existing
`agent-score/` prototype, which is an AI-engineer-facing "back office" (Fleet/Project/Run/
Session terminology, mock data modeled on an older internal PRD).

This milestone builds two screens only: the **Home dashboard** and the **Agent Overview**
tab. Everything else (onboarding, Traces/Scoring/Labeling/Settings tab content, Describe-
agent, run comparison, live backend) is explicitly deferred — see "Out of scope" below.

## Source of truth

- **Product spec**: Confluence PRD "PRD - AgentScore" (space `~71202081f3d00466214c728a250abf55f9bcf3`,
  page id `3466952809`, tiny link `aYClzg`). Re-fetch with
  `mcp__claude_ai_Atlassian__getConfluencePage` (`cloudId: "tricentis.atlassian.net"`,
  `pageId: "aYClzg"`, `contentFormat: "markdown"`) — it's long, don't rely on memory of it.
  Relevant requirements for this milestone: REQ-054 through REQ-058 (Home dashboard),
  REQ-065 through REQ-068 (Agent Overview), REQ-072 (plain-language dimension labels),
  REQ-003/REQ-004 (dimension set), REQ-002/REQ-011 (grade/verdict bands), REQ-006/REQ-007
  (20-trace lock / 30-session preliminary label).
- **Real backend shape**: `docs/Agent Score — API Reference (Frontend).md` — FastAPI
  Platform Service, cookie-session auth, routes under
  `/admin/tenants/{tenant_id}/agents/{agent_id}/...`. This defines the *only* response
  shapes given verbatim in the docs (`AgentProfile`, `TenantProfile`, readiness
  `{captured, threshold, ready}`). Everything else (trace list/detail, scoring run detail,
  trend) is described by route + purpose only, not a JSON schema — this plan defines
  reasonable mock shapes for those (see "Data model" below) that a future real API client
  can be reconciled against.
- **Reference-only, do not copy verbatim**: `agent-score/src/` — old prototype. Its build
  tooling setup (vite alias-to-sibling-repo trick, tsconfig paths, theme.ts) is proven and
  should be mirrored exactly. Its Project/Run/Session data model and AI-engineer-facing
  copy should NOT be mirrored — this app uses Agent/Trace/ScoringRun terminology and
  plain-language copy throughout.
- **Design system**: `@tricentis/aura` at `/Users/a.demers/dev/Tricentis/aura-ui`. The
  component catalog is small (NavRail, Tag, ChipStatus/ChipSubtle/ChipGroup, Tooltip,
  Page/Toolbar/DefaultContentLayout, Drawer*, icons) — there is no built-in stat-card,
  gauge, or chart component. Compose those from MUI primitives (`Box`, `Paper`,
  `Typography`, `LinearProgress`, raw `<svg>`) styled with the Aura theme, exactly like
  `agent-score/src/components/{ScoreMeter,ScoreBar,GradeChip}.tsx` already do — that's
  proven prior art in this codebase, follow the same technique.

## Out of scope (do not build this milestone)

- Onboarding / Add Agent wizard (REQ-042 and R7 in the old doc).
- Traces, Scoring, Labeling, Settings tab **content** on the Agent detail page (REQ-066
  requires the tab bar to exist and navigate, but only Overview needs a real view — the
  other four tabs can render a simple "Coming soon" placeholder).
- "Describe agent" flow (REQ-069/070/071).
- Run comparison, Guard Log, Metrics, LLM Judges, Profiles, Integrations views.
- Any real HTTP/auth — everything is served from an in-memory mock data module this
  milestone. Structure it so swapping in real `fetch` calls later is localized (see
  "Data layer" below).
- A full "Agents" fleet list view — home's agents-needing-attention table plus direct
  navigation to Agent Overview is the only agent-list surface this milestone.

## Tech stack & scaffolding

New sibling folder: `agent-score-app/` (sibling to `agent-score/`, `docs/`, etc., at repo
root). Mirror `agent-score/`'s proven setup exactly, since it's a known-working
configuration for consuming `@tricentis/aura` from the sibling `aura-ui` checkout without
needing real npm registry auth:

1. `package.json` — same dependency versions as `agent-score/package.json`:
   `react`/`react-dom` `^19.2.7`, `@mui/material` `^7.3.11`, `@emotion/react`/
   `@emotion/styled` `^11.14.x`, `@tricentis/aura` `^4.3.3`, devDeps `vite` `^6.3.5`,
   `@vitejs/plugin-react` `^4.3.4`, `typescript` `^5.7.3`, `vite-plugin-singlefile`
   `^2.3.3`, `@types/react*`. Package name `agent-score-app`, `private: true`,
   `type: module`, scripts `dev`/`build`/`preview` = `vite` / `vite build` / `vite preview`.
2. `pnpm-workspace.yaml` — copy `agent-score/pnpm-workspace.yaml` verbatim
   (`allowBuilds: {esbuild: false}`, `onlyBuiltDependencies: [esbuild]`).
3. `.npmrc` — copy `agent-score/.npmrc` verbatim (Tricentis registry scope config).
4. `vite.config.ts` — copy `agent-score/vite.config.ts`'s alias/dedupe trick verbatim:
   resolves `@tricentis/aura/*` and `@tricentis/mui-icons/*` to the sibling `aura-ui`
   checkout (`path.resolve(__dirname, "../../aura-ui")` — verify this relative path from
   `agent-score-app/`, it must land on `/Users/a.demers/dev/Tricentis/aura-ui`) instead of
   `node_modules`, and dedupes react/mui/emotion to avoid the dual-React-context bug.
5. `tsconfig.json` — copy `agent-score/tsconfig.json` verbatim (same `paths` mapping,
   `moduleResolution: bundler`, strict mode).
6. `index.html` — same Inter font preconnect/stylesheet tags, title "AgentScore", mount
   div `#root`, script `src="/src/main.tsx"`.
7. `src/main.tsx` — same shape: `ThemeProvider` (Aura theme) + `CssBaseline`, mount
   `<App />` in `StrictMode`.
8. `src/theme.ts` — copy `agent-score/src/theme.ts` verbatim (`extendTheme` +
   `themeOptions` from `@tricentis/aura/constants/themeOptions.js`, dark default).
9. After scaffolding, run `pnpm install` inside `agent-score-app/` and confirm `pnpm dev`
   boots and renders without MUI theme errors before writing any views.

Routing: no router library. Mirror the existing app's `View` discriminated-union +
`useState` pattern in `App.tsx` (see `agent-score/src/App.tsx`), scoped to only the views
this milestone needs:

```ts
type View =
  | { name: "home" }
  | { name: "agent-overview"; agentId: string };
```

## Data layer

Create `src/types.ts` and `src/data/mock.ts` (+ a small `src/data/client.ts` if it helps
separate "shape of a real API call" from "how mock data answers it" — see below).

### Types (`src/types.ts`)

Ground these in the **real** API's terminology (Agent/Trace/ScoringRun), not the old
prototype's Project/Run/Session:

```ts
export type AgentKind = "external" | "internal";
export type ProvisioningStatus = "pending" | "active" | "failed";
export type AgentType = "ATA" | "ATC" | "CURA" | "AI_WORKSPACE" | "CODING" | "APT";

// Mirrors the documented AgentProfile shape from the API reference, plus
// display-only fields this UI needs that a real client would fetch/derive
// separately (composite score, dimension scores, trace count, etc.) — keep
// those clearly separated so a future real client swap is obvious.
export interface Agent {
  agent_id: string;
  tenant_id: string;
  name: string;
  kind: AgentKind;
  agentType: AgentType;
  langfuse_project_id: string | null;
  provisioning_status: ProvisioningStatus;
  created_at: string; // ISO
  updated_at: string;

  // Derived/display fields (would come from scoring + trace endpoints in a real client)
  traceCount: number;             // total ingested traces, all-time
  traceCount24h: number;
  p95LatencyMs24h: number | null;
  tokenSpend24hUsd: number | null;
  errorCount24h: number;
  compositeScore: number | null;  // null until readiness.ready
  grade: "A" | "B" | "C" | "D" | "F" | null;
  verdict: "Ship" | "Review" | "Block" | null;
  dimensionScores: Partial<Record<DimensionKey, DimensionScore>>;
  reliability: "RELIABLE" | "NEEDS_WORK" | "UNSTABLE" | null;
  isLive: boolean; // live status dot in header
  hasCriticalSafetyIssue: boolean;
  hasHighSafetyIssue: boolean;
}

export type DimensionKey =
  | "benchmarkPerformance" | "valueEfficiency" | "uxSignal" // core
  | "harmony" | "stability" | "agency"                       // extended, commonly enabled
  | "groundedness" | "instructionFollowing" | "transparency" | "robustness" | "communication";

export interface DimensionScore {
  score: number;       // 0-100
  passed?: boolean;
  sigs: string[];       // raw signal strings, e.g. "task_success: 0.92"
  rawDeltaPct?: number;
}

export interface Readiness {
  captured: number;   // sessions captured so far
  threshold: number;  // 20, per REQ-006
  ready: boolean;
}

export interface Trace {
  id: string;
  ts: string;      // ISO
  name: string;     // scenario/span name
  durationMs: number;
  tokenCostUsd: number | null;
  status: "ok" | "error";
  verdict?: "PASS" | "PARTIAL" | "FAIL";
}

export interface ScoringRun {
  id: string;
  label: string;
  mode: "production" | "sandbox";
  startedAt: string;
  completedAt: string | null; // null while in progress
  sessionCount: number;
  passRate: number; // 0-100
  compositeScore: number | null;
  grade: "A" | "B" | "C" | "D" | "F" | null;
  verdict: "Ship" | "Review" | "Block" | null;
  inProgress: boolean;
}
```

### Plain-language dimension labels (REQ-072)

Create `src/data/dimensionLabels.ts` reusing the proven pattern from
`agent-score/src/components/ScoreBar.tsx` (`DIMENSION_QUESTION`, `SIG_LABEL`) and
`agent-score/src/data/dimensions.ts` (`DIMENSION_ORDER`, `DIMENSION_KEY_MAP`) — port the
same content, keyed by the new `DimensionKey` type. Every place a dimension is shown in
the primary UI shows the plain-language display name and question (e.g. "Correctness —
Did the agent complete the task correctly?"); the internal eval slug/sig values are
**only** revealed in a hover tooltip, never inline. This is the single mechanism REQ-072
depends on — implement it once, reuse everywhere.

### Mock client (`src/data/mock.ts`)

Export **async, promise-returning** functions with the signatures a real API client would
have, so the eventual swap to real `fetch` calls touches only this file:

```ts
export async function listAgents(): Promise<Agent[]>;
export async function getAgent(agentId: string): Promise<Agent | null>;
export async function getAgentReadiness(agentId: string): Promise<Readiness>;
export async function listAgentTraces(agentId: string, opts?: { limit?: number }): Promise<Trace[]>;
export async function listAgentScoringRuns(agentId: string, opts?: { limit?: number }): Promise<ScoringRun[]>;

// Demo-only affordance for REQ-068's "Simulate traces" action — mutates the
// in-memory store so the UI can show unlock progression live. A real client
// would not have this; keep it isolated so it's obvious to delete later.
export function simulateTraces(agentId: string, count: number): void;
```

Back these with a small in-memory `let AGENTS: Agent[] = [...]` seed (6-8 agents spanning
the six `AgentType`s, at least: one below the 20-trace threshold, one between 20-30
sessions [preliminary], one fully scored and Shipping, one with a Block verdict, one with
a critical safety override). `simulateTraces` should mutate the seed array's
`traceCount`/`traceCount24h` (and flip `Readiness.ready` once past 20) — components must
re-render on this, so lift the mutation through a small store (React `useSyncExternalStore`
over a module-level subject, or simplest: lift `AGENTS` into `App`-level React state and
pass a `refresh()` callback down — pick whichever keeps the mock module free of React
imports; either is fine, prefer the simpler one).

### Home dashboard aggregate

REQ-054/057/058 want cross-agent aggregates (KPI cards, verdict distribution, 7-day
trend, recent runs across all agents). Compute these client-side from `listAgents()` +
per-agent `listAgentScoringRuns()`, the same way `agent-score/src/views/HomeView.tsx`
already does with its own model — that's proven prior art for the aggregation logic, just
rebind it to the new types/terminology. A real client would likely have a dedicated
dashboard endpoint; note that as a comment where the aggregation lives, but don't build it
speculatively.

## View & component breakdown

```
src/
  types.ts
  data/
    mock.ts
    dimensionLabels.ts
  theme.ts
  App.tsx
  main.tsx
  components/
    layout/
      Layout.tsx          — topbar + NavRail sidebar (Home, agent switcher only this milestone)
    shared/
      GradeChip.tsx        — A-F grade chip (port from agent-score, restyle if needed)
      VerdictChip.tsx       — Ship/Review/Block or PASS/PARTIAL/FAIL chip
      DimensionScoreBar.tsx — plain-language label + LinearProgress + tooltip (uses dimensionLabels.ts)
      ScoreRing.tsx          — circular composite-score meter; supports a "locked" mode
                               (shows trace-progress e.g. "12/20 traces" instead of a score)
      StatCard.tsx            — small KPI tile; supports a "locked" mode showing "—" +
                                 "Unlocks at 20 traces" per REQ-065/068
      Sparkline.tsx / TrendChart.tsx — small inline SVG charts (port technique from
                                        agent-score/src/views/HomeView.tsx)
  views/
    HomeView.tsx
    AgentOverviewView.tsx
    home/
      KpiCards.tsx
      AttentionTable.tsx        — expandable rows, dimension bars, safety-issue banner
      VerdictDistribution.tsx    — percentage bars + 7-day trend
      RecentScoringRunsTable.tsx  — shared with AgentOverviewView (agent-scoped variant)
    agent-overview/
      AgentHeader.tsx        — name, type, created date, kind chip, live status dot (REQ-067)
      AgentTabBar.tsx          — Overview/Traces/Scoring/Labeling/Settings; non-Overview
                                  tabs navigate to a shared "ComingSoonPanel"
      KeepSendingTracesBanner.tsx — shown below 20 traces, includes "Simulate traces" button
      RecentTracesTable.tsx        — last 5 traces
```

### HomeView (REQ-054, 055, 056, 057, 058)

- KPI row: active agent count; traces ingested last 7 days; scoring runs completed last 7
  days with Ship/Review/Block breakdown; agents-needing-attention count (composite <
  Ship threshold, default 85 — REQ-055).
- Agents-needing-attention table: expandable rows showing per-dimension bars (via
  `DimensionScoreBar`) and any active safety issue, without navigating away (REQ-056) —
  port the interaction pattern from `agent-score/src/views/HomeView.tsx`'s
  `expandedId`/`Fragment` rows.
- Verdict distribution: percentage bars for Ship/Review/Block + 7-day trend chart
  (REQ-057).
- Recent scoring runs table across all agents (REQ-058), clicking a row navigates to that
  agent's Overview (`{ name: "agent-overview", agentId }`).
- Clicking an agent row (attention table or elsewhere) navigates to `agent-overview`.

### AgentOverviewView (REQ-065, 066, 067, 068)

- `AgentHeader`: name, agent type tag, creation date, kind chip (external/internal), live
  status dot — persists across tabs (render it in this view's layout so it's structurally
  ready to persist once other tabs exist).
- `AgentTabBar`: Overview (active), Traces/Scoring/Labeling/Settings render
  `ComingSoonPanel` when clicked — do not build a router for this, a simple local
  `activeTab` state is enough since only one tab has real content.
- Below 20 traces (`!readiness.ready`): `KeepSendingTracesBanner` showing
  `${captured}/${threshold} traces` and a "Simulate traces" action that calls
  `simulateTraces(agentId, N)` and refreshes local state; `ScoreRing` renders in its
  locked/progress mode; all four `StatCard`s render locked ("—" / "Unlocks at 20
  traces").
- At/above 20 traces: `ScoreRing` shows the real composite score (grade-colored); stat
  cards show Traces (24h), P95 Latency, Token Spend (24h), Errors.
- `RecentTracesTable`: last 5 traces.
- `RecentScoringRunsTable`: last 3 runs (reuse the Home variant, agent-scoped).

## Implementation steps (suggested order)

1. Scaffold `agent-score-app/` per "Tech stack & scaffolding" above; verify `pnpm install`
   + `pnpm dev` renders an empty themed page.
2. Write `src/types.ts`.
3. Write `src/data/dimensionLabels.ts` (port from `agent-score`).
4. Write `src/data/mock.ts` with seed data covering the score-progression states listed
   above, and the async function signatures listed above.
5. Build `components/shared/*` (GradeChip, VerdictChip, DimensionScoreBar, ScoreRing incl.
   locked mode, StatCard incl. locked mode, Sparkline/TrendChart).
6. Build `components/layout/Layout.tsx` (trimmed NavRail: Home + current-agent indicator
   only — no Guard Log/Metrics/Judges/Profiles/Integrations nav items this milestone).
7. Build `views/HomeView.tsx` and its `home/*` sub-components.
8. Build `views/AgentOverviewView.tsx` and its `agent-overview/*` sub-components,
   including the `ComingSoonPanel` for non-Overview tabs.
9. Wire `App.tsx` routing between the two views + `main.tsx`.
10. Manually verify in the browser: home renders aggregate KPIs/attention table/trend
    correctly for the seeded agents; clicking through reaches Agent Overview; the
    below-20-traces agent shows locked stat cards + banner; clicking "Simulate traces"
    unlocks the ring/stat cards live; dimension labels show plain language with technical
    sigs only in tooltips; light/dark mode both look correct (Aura theme toggle).

## Open follow-ups (not this milestone)

- Wire a real `fetch`-based client behind the same function signatures in
  `src/data/mock.ts`, once the backend is reachable locally with a seeded tenant/agent and
  login credentials.
- Traces/Scoring/Labeling/Settings tab content, onboarding wizard, Describe-agent flow,
  run comparison, Guard Log, Metrics, LLM Judges, Profiles, Integrations — each is its own
  follow-on milestone plan.
