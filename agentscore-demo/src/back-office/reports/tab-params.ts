/** Reports page `?tab={tab}` + the Usage report's window view params.
 *
 * `tab` selects the report shown — today just `"usage"`. An unknown or absent
 * value normalizes to `"usage"`. `range`/`from`/`to` are the report window;
 * all three ride in the URL rather than component state so a shared link
 * reproduces the same view.
 *
 * A pure, time-independent, idempotent normalizer, shared by the route's
 * `validateSearch` (router.tsx) and its tests so the two cannot drift — the
 * same shape as `llm-catalog/tab-params.ts` and `usage-view-params.ts`.
 * `parseReportsWindowSearch` is the window-only half of it, exported so the
 * per-tenant drill-down route (`/reports/usage/$tenantId`, which has no
 * `tab`) can reuse the exact same window parsing rather than duplicating it.
 *
 * **Deliberately NOT here: the 90-day clamp.** `clampToNinetyDays` reads the
 * wall clock (`resolveTimeRange` calls `new Date()`), and TanStack re-runs
 * `validateSearch` against the already-normalized search object on every
 * search change — a clock read inside it can return a different object on
 * re-run, which reads as a search change and re-navigates. The clamp stays at
 * the point `UsageReportTab` derives its `TimeRangeValue`.
 *
 * Absent values are **omitted keys**, never empty strings, so a bare
 * `?tab=usage` URL stays byte-identical to what it was before the window
 * moved into the URL.
 */

import { TIME_RANGE_PRESETS } from "@/shared/components/time-range";

export const REPORTS_TABS = ["usage"] as const;

export type ReportsTab = (typeof REPORTS_TABS)[number];

export interface ReportsSearch {
  tab: ReportsTab;
  /** No free-text search on this page — carried as a type-level marker so a
   *  stray `?q=` never silently attaches meaning here. */
  q?: never;
  /** A `TIME_RANGE_PRESETS` id. Takes precedence over `from`/`to`. */
  range?: string;
  /** Custom-window lower bound (ISO). Only read when `range` is absent. */
  from?: string;
  /** Custom-window upper bound (ISO). Only read when `range` is absent. */
  to?: string;
}

export type ReportsWindowSearch = Pick<ReportsSearch, "range" | "from" | "to">;

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

/** The window-only half of `parseReportsSearch` — no `tab`. Idempotent for
 *  the same reason `parseReportsSearch` is (see its docstring). */
export function parseReportsWindowSearch(raw: unknown): ReportsWindowSearch {
  if (raw === null || typeof raw !== "object") return {};
  const source = raw as Record<string, unknown>;
  const out: ReportsWindowSearch = {};

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

  return out;
}

export function parseReportsSearch(raw: unknown): ReportsSearch {
  // Idempotent: TanStack Router re-runs `validateSearch` against the already
  // normalized search object (not just the raw URL string), so re-parsing a
  // well-formed view must yield the same result.
  if (raw === null || typeof raw !== "object") return { tab: "usage" };
  const source = raw as Record<string, unknown>;

  const tab = str(source.tab);
  const validTab =
    tab !== undefined && (REPORTS_TABS as readonly string[]).includes(tab)
      ? (tab as ReportsTab)
      : "usage";

  return { tab: validTab, ...parseReportsWindowSearch(raw) };
}
