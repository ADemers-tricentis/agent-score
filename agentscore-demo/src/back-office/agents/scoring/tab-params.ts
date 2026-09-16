/** Agent Score-page `?sub={sub}` + run-detail `?panel={panel}` deep-link
 * parsing (`agent-ia` spec §3.1 Feature 1, §7.1; `agent-card` §4.6).
 *
 *  The Scoring tab and its four `?tab=`-synced sub-tabs (Scorecard /
 *  Profile Fit / Runs / Activity) are gone — Scorecard and Runs now compose
 *  directly on the agent's landing page (Score), and Profile Fit / Activity
 *  compose on the Profile tab. Only the Runs body's own By-run / By-version
 *  toggle remains URL search state, via `sub` below.
 *  Mirrors `back-office/ingestion/tab-params.ts` /
 *  `back-office/scoring-pipeline/tab-params.ts`'s `sub` shape.
 */
export const RUNS_SUBS = ["run", "version"] as const;

export type RunsSub = (typeof RUNS_SUBS)[number];

/** The Score page's `?sub=` search shape. */
export interface AgentScoreSearch {
  sub: RunsSub;
}

/** Score-page search normalizer — only `?sub=` (the Runs By-run/version
 *  toggle) is meaningful here. Normalizes a bogus value so the toggle
 *  always shows a selected option; TanStack already round-trips the param
 *  through untouched without a validator, so round-trip preservation is
 *  not the reason this exists. */
export function parseAgentScoreSearch(raw: unknown): AgentScoreSearch {
  // Idempotent: TanStack re-runs validateSearch against the already-parsed
  // object, so re-parsing `{ sub }` must yield the same result.
  if (raw === null || typeof raw !== "object") return { sub: "run" };
  const { sub } = raw as { sub?: unknown };
  const validSub =
    typeof sub === "string" && RUNS_SUBS.includes(sub as RunsSub)
      ? (sub as RunsSub)
      : "run";
  return { sub: validSub };
}

/** `/runs/$runId` run-detail page's tab and selected result identifiers —
 *  independent of the Score page's `sub` above. */
export const RUN_PANELS = ["overview", "tasks"] as const;

export type RunPanel = (typeof RUN_PANELS)[number];

export interface RunResultSearch {
  panel: RunPanel;
  interaction?: string;
  verdict?: string;
}

export function parseRunResultSearch(raw: unknown): RunResultSearch {
  // Idempotent for the same reason as `parseAgentScoreSearch` above.
  if (raw === null || typeof raw !== "object") return { panel: "overview" };
  const { panel, interaction, verdict } = raw as {
    panel?: unknown;
    interaction?: unknown;
    verdict?: unknown;
  };
  const validPanel =
    panel === "events"
      ? "tasks"
      : typeof panel === "string" && RUN_PANELS.includes(panel as RunPanel)
        ? (panel as RunPanel)
        : "overview";
  return {
    panel: validPanel,
    ...(typeof interaction === "string" && interaction.length > 0
      ? { interaction }
      : {}),
    ...(typeof verdict === "string" && verdict.length > 0 ? { verdict } : {}),
  };
}
