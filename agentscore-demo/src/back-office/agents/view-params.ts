/** Agents page view/group-by deep-link `?view={view}&by={by}` parsing
 *  (agents-grouped-view spec §3.1 Feature 3, §4.6).
 *
 *  Mirrors `ingestion/tab-params.ts`: a pure normalizer shared by the agents
 *  route's `validateSearch` (router.tsx) and its tests so the two cannot
 *  drift. `by` round-trips through the URL even when `view === "list"`
 *  (§3.1: retained across a List <-> Grouped toggle) — it just has no effect
 *  until `view === "grouped"`.
 */
import type { AgentGroupBy } from "@/back-office/agents/api";

export const AGENT_VIEWS = ["list", "grouped"] as const;

export type AgentView = (typeof AGENT_VIEWS)[number];

export const AGENT_GROUP_BY_VALUES: readonly AgentGroupBy[] = [
  "tenant",
  "source",
  "kind",
];

export interface AgentsViewSearch {
  view: AgentView;
  by: AgentGroupBy;
}

export function parseAgentsViewSearch(raw: unknown): AgentsViewSearch {
  // Idempotent: TanStack Router re-runs `validateSearch` against the already
  // normalized search object (not just the raw URL string), so re-parsing a
  // well-formed `{ view, by }` must yield the same result.
  if (raw === null || typeof raw !== "object") {
    return { view: "list", by: "tenant" };
  }
  const { view, by } = raw as {
    view?: unknown;
    by?: unknown;
  };
  const validView =
    typeof view === "string" &&
    (AGENT_VIEWS as readonly string[]).includes(view)
      ? (view as AgentView)
      : "list";
  const validBy =
    typeof by === "string" &&
    (AGENT_GROUP_BY_VALUES as readonly string[]).includes(by)
      ? (by as AgentGroupBy)
      : "tenant";
  return {
    view: validView,
    by: validBy,
  };
}
