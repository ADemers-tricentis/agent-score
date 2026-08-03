# AgentScore domain-practitioner UI — Milestone 2: full agent journey

## Goal

Extend `agent-score-app/` (Home + Agent Overview already shipped in Milestone 1) into a
full, demoable domain-practitioner journey: onboard an agent, watch its traces, understand
its score and *why* it failed, act on that (ship decision, labeling), and adjust its
settings. Scope stays within the domain-practitioner persona — no Guard Log, LLM Judges
catalog, Profiles library, Integrations, or Metrics admin views (those are `agent-score/`'s
AI-engineer surface, explicitly out of scope per user decision). Run comparison
(REQ-052/053) is deferred as a fast-follow after this milestone.

**Tight deadline — build in priority order, not all-or-nothing:**

1. **Phase A (core, build first):** Scoring tab (profile/judge summary + Describe-agent +
   run history) → Run Detail → Session Detail (score breakdown, attribution, ship
   decision). This is the actual product value proposition — "is my agent good, and why" —
   and should be demoable on its own before anything else lands.
2. **Phase B (core):** Traces tab + per-trace span explorer. Second most important —
   backs up the score with raw evidence.
3. **Phase C (secondary):** Add Agent onboarding wizard.
4. **Phase D (secondary):** Labeling tab.
5. **Phase E (secondary):** Settings tab.

Check in after Phase A+B land — that's the demoable core. Phases C-E round it out but the
app should already tell a complete story without them (existing seeded agents cover the
entry point; onboarding is "how a new agent gets there," not required to see an existing
one's story).

## Source of truth

Same as Milestone 1 (see `plans/2026-08-03-agent-score-app-home-overview.md`): Confluence
PRD "PRD - AgentScore" (pageId `aYClzg`), `docs/Agent Score — API Reference (Frontend).md`
for real backend route shapes, `agent-score/` as visual/interaction reference only (never
imported from). New REQs in play this milestone: REQ-022 (span explorer), REQ-028/032/036
(profile + judge summary, plain-language), REQ-069/070/071 (Describe agent), REQ-049/050/051
(attribution, ship decision, export as calibration), REQ-042/018/043 (onboarding), and the
Labeling/goldens + Settings routes from the API reference (`.../scoring/labeling/queue`,
`.../scoring/labeling`, `.../scoring/goldens`, `.../scoring/schedule`, REQ-016/020/046/047/048).

## Data layer additions (`src/types.ts` + `src/data/mock.ts`)

Do this first, myself, before any parallel view work — every phase below depends on it.
New types, additive to what Milestone 1 already defined (don't rename/remove existing
fields):

```ts
export interface ScoringProfileSummary {
  name: string;
  version: number;
  evalCount: number;
  dimensions: DimensionKey[];
  verdictBands: { ship: number; shipWithNotes: number; review: number; block: number };
}

export interface JudgeInfo {
  name: string;
  provider: "Anthropic" | "AWS Bedrock" | "OpenAI-compatible";
  model: string;
  rationale: string; // plain-language: why this judge was auto-selected for this agent type
}

export interface AttributionChainStep {
  step: string;      // plain-language step description
  detail: string;
  isCulprit: boolean;
}

export interface Attribution {
  rootCause: string;   // plain-language category, e.g. "Picked the wrong tool"
  confidence: number;  // 0-100
  agentFault: boolean;
  chain: AttributionChainStep[];
  recommendations: string[];
}

export interface ShipDecision {
  decision: "Ship" | "Hold" | "Reject";
  rationale: string;
  author: string;
  ts: string;
  overridesVerdict: boolean;
}

export interface Session {
  id: string;
  scenario: string;
  ts: string;
  durationMs: number;
  verdict: SessionVerdict;
  compositeScore: number;
  grade: Grade;
  dimensionScores: Partial<Record<DimensionKey, DimensionScore>>;
  safetyOverride?: { severity: "Critical" | "High"; signal: string; detail: string };
  attribution?: Attribution; // present when verdict !== "PASS"
  shipDecision?: ShipDecision;
}

export interface ScoringRunDetail extends ScoringRun {
  sessions: Session[];
}

export interface SpanNode {
  id: string;
  kind: "agent" | "llm" | "tool";
  name: string;
  startOffsetMs: number;
  durationMs: number;
  tokens?: number;
  costUsd?: number;
  input?: string;
  output?: string;
  children: SpanNode[];
}

export interface TraceDetail extends Trace {
  spans: SpanNode[];
}

export interface LabelingCandidate {
  id: string;
  traceId: string;
  traceName: string;
  ts: string;
  reason: string; // why it's in the queue, e.g. "Low-confidence Pending verdict"
  suggestedVerdict: SessionVerdict;
}

export interface Golden {
  id: string;
  traceName: string;
  confirmedAt: string;
  decision: "confirm" | "override";
  note?: string;
}

export interface AgentSettingsData {
  verdictBands: { ship: number; review: number; block: number };
  traceSamplingRatePct: number;
  provisioningStatus: ProvisioningStatus;
  langfuseProjectId: string | null;
  createdByEmail: string;
  workspaceId: string;
}

export interface FingerprintMatch {
  profileName: string;
  confidence: number;
  sessionCount: number;
}

export interface DescribeAgentResult {
  matchedProfileName: string;
  confidence: number;
  evalsToAdd: string[];
  evalsToRemove: string[];
  weightAdjustments: { name: string; from: number; to: number }[];
  noChangesNeeded: boolean;
}
```

New mock client functions in `src/data/mock.ts` (same async-signature convention as
Milestone 1):

```ts
export async function getAgentProfile(agentId): Promise<ScoringProfileSummary>
export async function getAgentJudge(agentId): Promise<JudgeInfo>
export async function getScoringRun(agentId, runId): Promise<ScoringRunDetail | null>
export async function getSession(agentId, runId, sessionId): Promise<Session | null>
export async function recordShipDecision(agentId, runId, sessionId, decision): Promise<void>
export async function describeAgent(agentId, input: {mode:"guided"|"expert"; guided?:{whatItDoes,neverDo,mainConcern}; expertSpec?:string}): Promise<DescribeAgentResult>
export async function applyDescribeAgentResult(agentId, result): Promise<void>

export async function getTraceDetail(agentId, traceId): Promise<TraceDetail | null>

export async function listLabelingQueue(agentId): Promise<LabelingCandidate[]>
export async function submitLabel(agentId, candidateId, decision: "confirm"|"override", note?): Promise<void>
export async function listGoldens(agentId): Promise<Golden[]>

export async function getAgentSettings(agentId): Promise<AgentSettingsData>
export async function updateAgentSettings(agentId, patch: Partial<AgentSettingsData>): Promise<void>
export async function archiveAgent(agentId): Promise<void>
export async function removeAgent(agentId): Promise<void>

export function createAgent(input: {name: string; agentType: AgentType; kind: AgentKind}): Agent
export async function getFingerprintMatch(agentId): Promise<FingerprintMatch | null>
```

Seed at least one `ScoringRunDetail` with a full `sessions[]` array per existing agent that
already has scoring runs (reuse/extend the Milestone 1 seed), covering PASS, PARTIAL, and
FAIL sessions with attribution populated on the non-PASS ones, and at least one session with
a `safetyOverride`. Seed `SpanNode` trees (2-4 levels deep, mixing agent/llm/tool kinds) for
a handful of traces per agent — doesn't need to be exhaustive, just enough to render a
realistic-looking span waterfall.

## Routing changes (`src/view.ts`)

```ts
export type AgentTab = "overview" | "traces" | "scoring" | "labeling" | "settings";

export type View =
  | { name: "home" }
  | { name: "add-agent" }
  | { name: "agent-overview"; agentId: string; tab?: AgentTab }
  | { name: "run-detail"; agentId: string; runId: string }
  | { name: "session-detail"; agentId: string; runId: string; sessionId: string };
```

`AgentOverviewView` should read `tab` from the view (defaulting to `"overview"`) as its
initial active-tab state, so other views can deep-link into a specific tab (e.g. a future
"Open Scoring" link). Trace detail (the span explorer) is a Drawer/Dialog opened from
within the Traces tab, not a separate `View` — REQ-022 just says "accessible from the
Traces tab," no dedicated route needed.

## Phase A — Scoring tab, Run Detail, Session Detail (build first)

### Scoring tab (`views/agent-overview/scoring/ScoringTab.tsx`)
- Profile summary card: name, version, eval count, dimensions covered, verdict bands —
  via `getAgentProfile`. Plain language, no raw eval slugs (REQ-072 still applies).
- Judge line: judge name/provider/model + one-line plain-language rationale (REQ-036) via
  `getAgentJudge`.
- "Describe agent" action (REQ-069/070/071): button opens an inline panel with a
  Guided/Expert toggle. Guided = 3 plain-language fields (what it does / what it should
  never do / main concern). Expert = single textarea (YAML/JSON/Markdown, no need to
  actually parse it — mock). Submit shows a brief animated multi-stage pipeline (a simple
  sequential checklist with a spinner-then-checkmark per stage is enough, no need for
  anything fancy), then calls `describeAgent` and renders the result: if
  `noChangesNeeded`, a confirmation; otherwise a diff (evals to add in green, remove in
  red, weight adjustments in amber) with an "Apply changes" button calling
  `applyDescribeAgentResult`.
- Scoring runs table: full history (not capped at 3 like Home/Overview's recent-runs
  table), via `listAgentScoringRuns` (no `limit`). Row click navigates to
  `{name: "run-detail", agentId, runId}`.

### Run Detail (`views/RunDetailView.tsx`)
- Header: run label, pass rate (+CI text is fine as a static "±X%" if you don't want to
  build real stats), session counts by verdict, average composite + grade.
- Sessions table: scenario, time, duration, composite score + grade, per-dimension summary
  is not needed here (that's Session Detail) — just the columns above plus verdict chip.
  Filterable by failing dimension is REQ-nice-to-have; skip if time-constrained, note as a
  deferred nice-to-have rather than building it.
- "Export as calibration case" (REQ-051): dialog with session checkboxes (non-PASS
  pre-selected), disabled export button at zero selected, confirmation chip on "export"
  (mock — no real file write, just show the destination-path string and a success state).
- Row click navigates to `{name: "session-detail", agentId, runId, sessionId}`.
- Breadcrumb: Home / Agent / Run.

### Session Detail (`views/SessionDetailView.tsx`)
- Alerts at top: worst-dimension gate warning (list dimensions < 55) when non-PASS;
  Safety Override alert (Critical = red/FAIL-forcing, High = amber/PARTIAL-forcing) when
  `session.safetyOverride` present.
- Score card: `ScoreRing`, `GradeChip`, `SessionVerdictChip`, scenario name, timestamp,
  duration, all enabled `DimensionScoreBar`s.
- Attribution panel (non-PASS only): root cause, confidence, agent-fault flag, ordered
  evidence chain with the culprit step visually highlighted, recommendations list.
- Ship Decision panel: record Ship/Hold/Reject with rationale + author (a simple
  free-text author field is fine, no real auth), an "overrides verdict" indicator when the
  decision disagrees with the computed verdict, editable after the fact. Calls
  `recordShipDecision`.
- Breadcrumb: Home / Agent / Run / Session. Skip the Markdown/JSON report-export side
  panel from the old prototype's R4 — not core to the demo story, note as deferred.

## Phase B — Traces tab + span explorer

### Traces tab (`views/agent-overview/traces/TracesTab.tsx`)
- Full traces table (not capped at 5 like Overview's recent-traces table) via
  `listAgentTraces` (no limit). Simple text search over trace name is enough filtering.
- Row click opens a Drawer (span explorer, REQ-022) via `getTraceDetail`.

### Span explorer (`views/agent-overview/traces/SpanExplorerDrawer.tsx`)
- Render the `SpanNode` tree with indentation per depth, a horizontal timing bar per span
  (position/width proportional to `startOffsetMs`/`durationMs` against the trace's total
  duration — a simple `<Box>` bar is enough, no need for a charting library), token count
  and cost shown per span, kind indicated by icon/color (agent/llm/tool).
- Clicking a span expands it to show `input`/`output` text (lazy — the mock data already
  has it, so this is just a local expand/collapse, no real lazy-fetch needed).

## Phase C — Add Agent onboarding (`views/AddAgentView.tsx`)

Single wizard, 4 steps (simpler than old prototype's two-path/6-step version — REQ-042
only requires "OTel configuration, trace collection, fingerprint-based profile matching,
agent naming," not two full onboarding paths):

1. **Basics** — name, agent type (card grid of the six types), kind (external/internal).
2. **Connect via OTel** — mock API key (`as_live_...` format string), OTLP endpoint,
   required env vars, a short code snippet. Static display, no real connection.
3. **Waiting for traces** — a short staged animation (received → recognized → matched),
   then show a `getFingerprintMatch` result (confidence %, matched profile name, session
   count) once "traces arrive" (simulate with a timeout or a "Simulate first trace"
   button, consistent with the existing `simulateTraces` demo pattern).
4. **Review & launch** — summary, "Launch" button calls `createAgent`, then navigates to
   that new agent's Overview (`{name: "agent-overview", agentId: newAgent.agent_id}`).

Wire the Home dashboard's (currently absent) "Add Agent" entry point — add a button in
`HomeView`'s header navigating to `{name: "add-agent"}`.

## Phase D — Labeling tab (`views/agent-overview/labeling/LabelingTab.tsx`)

No REQ numbers describe UI for this (it's newer, real-API-only — see the API reference's
`.../scoring/labeling/queue`, `.../scoring/labeling`, `.../scoring/goldens`). Design it
plainly:
- Queue section: cards from `listLabelingQueue`, each showing the trace name, timestamp,
  why it's flagged (`reason`), the system's suggested verdict, and Confirm/Override
  actions (override lets you pick a different verdict + optional note) calling
  `submitLabel`.
- Confirmed examples section below: table from `listGoldens` (trace name, when confirmed,
  confirm vs. override, note).

## Phase E — Settings tab (`views/agent-overview/settings/SettingsTab.tsx`)

Simplified, single agent scope (no profile/judge editing — that's the admin surface
explicitly out of scope):
- Verdict bands: three sliders (Ship/Review/Block, REQ-016), plain-language labels.
- Trace sampling: 1-100% slider (REQ-020), warning color below 50%, static info line about
  the smart-override (errors/timeouts/guard triggers always sampled at 100%).
- Provenance (REQ-047, read-only): creator email, created date, agent ID, workspace ID.
- Connection status (REQ-048): Langfuse provisioning status + project ID.
- Danger Zone (REQ-046): Archive (pause ingest, keep history) and Remove (permanent,
  confirm dialog) actions calling `archiveAgent`/`removeAgent`.
- Save button persists the editable fields via `updateAgentSettings`.

## Suggested execution order

1. **Foundation** (do myself, sequential): data layer additions above, `view.ts` changes,
   any new shared components multiple phases will need (a simple `Stepper`/wizard shell
   if Phase C needs one beyond MUI's own `Stepper`; an `AttributionPanel`-adjacent visual
   pattern; a span-waterfall bar primitive for Phase B).
2. **Phase A**, parallelized: one agent for Scoring tab, one for Run Detail + Session
   Detail (they share the sessions data model closely enough to be one owner).
3. Wire routing for Phase A into `App.tsx`, verify in browser (this is the demoable
   checkpoint — stop and confirm it looks right before continuing).
4. **Phase B**, single agent (Traces tab + span explorer are tightly coupled).
5. Wire + verify.
6. **Phases C, D, E** — three parallel agents, one per phase, since they're independent of
   each other and of Phase A/B's files.
7. Final wire-up + full-app browser verification (all tabs, onboarding flow end-to-end,
   light/dark mode).
