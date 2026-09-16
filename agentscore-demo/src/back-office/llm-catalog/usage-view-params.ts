/** Usage log view state as URL search params — the filters, the time window and
 *  the search term.
 *
 * These live in the URL so the view survives a round trip through the per-call
 * detail sub-page (`/llm-catalog/usage/$callId`). The tab unmounts when that
 * route renders, so component state cannot survive it — `history.back()` would
 * restore a URL, not a remounted component's `useState`. Both routes therefore
 * carry these params: the list reads them, and the detail page carries them
 * through so its breadcrumb can hand them back. A shareable filtered audit view
 * is the side benefit, not the reason.
 *
 * A pure, time-independent, idempotent normalizer, shared by both routes'
 * `validateSearch` (router.tsx) and its tests so the two cannot drift — the
 * same shape as `agents/view-params.ts` and `ingestion/tab-params.ts`.
 *
 * **Deliberately NOT here: the 7-day clamp.** `clampToSevenDays` reads the wall
 * clock (`resolveTimeRange` calls `new Date()`), and TanStack re-runs
 * `validateSearch` on every search change — a clock read inside it can return a
 * different object on re-run, which reads as a search change and re-navigates.
 * The clamp stays at the point the tab derives its `TimeRangeValue`, where it
 * already lived. See `UsageLogTab`'s `useUsageView`.
 *
 * Absent values are **omitted keys**, never empty strings or empty arrays, so a
 * bare `?tab=usage` URL stays byte-identical to what it was before filters
 * moved into the URL.
 */

import { TIME_RANGE_PRESETS } from "@/shared/components/time-range";

/** The facet params, in the order the toolbar renders them. */
export const USAGE_FACET_KEYS = [
  "purpose",
  "provider",
  "model",
  "tenant",
  "outcome",
] as const;

export type UsageFacetKey = (typeof USAGE_FACET_KEYS)[number];

export interface UsageViewSearch {
  /** Free-text search term. */
  q?: string;
  /** A `TIME_RANGE_PRESETS` id. Takes precedence over `from`/`to`. */
  range?: string;
  /** Custom-window lower bound (ISO). Only read when `range` is absent. */
  from?: string;
  /** Custom-window upper bound (ISO). Only read when `range` is absent. */
  to?: string;
  /** Filters to a single agent run. Set by the agent-run detail page's
   *  ledger link; the toolbar itself never writes it. */
  agentRunId?: string;
  purpose?: string[];
  provider?: string[];
  model?: string[];
  tenant?: string[];
  outcome?: string[];
}

/** Non-empty string, else undefined. */
function str(raw: unknown): string | undefined {
  return typeof raw === "string" && raw !== "" ? raw : undefined;
}

/** An ISO-ish date string that actually parses, else undefined. */
function isoDate(raw: unknown): string | undefined {
  const s = str(raw);
  if (s === undefined) return undefined;
  const t = Date.parse(s);
  return Number.isNaN(t) ? undefined : s;
}

/** A facet's values: one string or many, de-duplicated, blanks dropped.
 *
 *  Order is preserved rather than sorted — re-parsing must not reorder, or the
 *  normalizer would not be idempotent. Values are NOT checked against the
 *  closed option sets (purpose/provider/outcome are closed; model/tenant are
 *  open id sets): an unknown value simply matches no rows, which the table's
 *  own empty state already explains, and keeping this module free of feature
 *  vocabulary is what lets both routes share it. */
function strList(raw: unknown): string[] | undefined {
  const items = Array.isArray(raw) ? raw : [raw];
  const out: string[] = [];
  for (const item of items) {
    const s = str(item);
    if (s !== undefined && !out.includes(s)) out.push(s);
  }
  return out.length > 0 ? out : undefined;
}

export function parseUsageViewSearch(raw: unknown): UsageViewSearch {
  // Idempotent: TanStack Router re-runs `validateSearch` against the already
  // normalized search object (not just the raw URL string), so re-parsing a
  // well-formed view must yield the same result.
  if (raw === null || typeof raw !== "object") return {};
  const source = raw as Record<string, unknown>;

  const out: UsageViewSearch = {};

  const q = str(source.q);
  if (q !== undefined) out.q = q;

  const agentRunId = str(source.agentRunId);
  if (agentRunId !== undefined) out.agentRunId = agentRunId;

  // A preset id wins outright: it is the canonical form, and letting a stale
  // `from`/`to` pair survive beside it would leave two disagreeing windows in
  // one URL with no rule for which the picker should show.
  const range = str(source.range);
  if (range !== undefined && TIME_RANGE_PRESETS.some((p) => p.id === range)) {
    out.range = range;
  } else {
    const from = isoDate(source.from);
    const to = isoDate(source.to);
    // Both bounds or neither — a half-specified custom window has no meaning,
    // and silently pairing one bound with `now` would show a window the URL
    // does not describe.
    if (from !== undefined && to !== undefined && Date.parse(from) < Date.parse(to)) {
      out.from = from;
      out.to = to;
    }
  }

  for (const key of USAGE_FACET_KEYS) {
    const values = strList(source[key]);
    if (values !== undefined) out[key] = values;
  }

  return out;
}
