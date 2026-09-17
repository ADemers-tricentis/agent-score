/** The Usage report's window logic — shared by `UsageReportTab` (the
 * per-tenant table) and `TenantUsageDetailPage` (the per-tenant drill-down),
 * which resolve the SAME URL window and must clamp/parse it identically so
 * their displayed windows can never disagree.
 *
 * Pure window logic, no JSX, no React — split out of `UsageReportTab.tsx` so
 * a second page importing it doesn't need `react-refresh/only-export-components`
 * suppressed on a component module.
 *
 * Lives in `shared/` (not `back-office/reports/`, its original home) so a
 * customer-facing usage report can resolve/clamp the same URL window the
 * same way. `ReportWindowSearch` below is structurally identical to
 * `back-office/reports/tab-params.ts`'s `ReportsWindowSearch` — kept as a
 * local interface rather than imported from there because `shared/` must not
 * import from either app (`frontend/eslint.config.js`'s app-boundary rule).
 */

import {
  resolveTimeRange,
  type TimeRangeValue,
} from "@/shared/components/time-range";

/** A `range`/`from`/`to` window as it rides in a route's URL search params. */
export interface ReportWindowSearch {
  range?: string;
  from?: string;
  to?: string;
}

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

/** Clamp a `TimeRangeValue` to at most 90 days, re-pointing at the `90d`
 *  preset when either a wider preset or a wider custom calendar range is
 *  chosen — covers both `TimeRangePicker` paths, and a hand-typed or stale
 *  `?range=`/`?from=&to=` in the URL.
 *
 *  Returns the input by identity when it already fits, so callers can test
 *  "did the clamp fire?" with `!==`. Used by both `UsageReportTab` and
 *  `TenantUsageDetailPage`, which resolve the same URL window and must clamp
 *  it the same way so their displayed window can never disagree with what the
 *  server actually computed.
 *
 *  This lives here, not in `validateSearch` — a clock read there re-navigates
 *  on TanStack's re-run. */
export function clampToNinetyDays(value: TimeRangeValue): TimeRangeValue {
  const { from, to } = resolveTimeRange(value);
  if (to.getTime() - from.getTime() <= NINETY_DAYS_MS) return value;
  return { kind: "preset", preset: "90d" };
}

export const DEFAULT_RANGE: TimeRangeValue = { kind: "preset", preset: "30d" };

/** The URL's window as a `TimeRangeValue`. A preset id wins over a custom
 *  pair (the normalizer already guarantees they never both survive). */
export function rangeFromSearch(search: ReportWindowSearch): TimeRangeValue {
  if (search.range !== undefined) {
    return { kind: "preset", preset: search.range };
  }
  if (search.from !== undefined && search.to !== undefined) {
    return {
      kind: "custom",
      from: new Date(search.from),
      to: new Date(search.to),
    };
  }
  return DEFAULT_RANGE;
}

/** The inverse: the three window params a `TimeRangeValue` implies. The
 *  unused side is explicitly `undefined` so writing a preset clears a stale
 *  custom pair out of the URL rather than leaving both behind. */
export function rangeToSearch(value: TimeRangeValue): ReportWindowSearch {
  if (value.kind === "preset") {
    return { range: value.preset, from: undefined, to: undefined };
  }
  return {
    range: undefined,
    from: value.from.toISOString(),
    to: value.to.toISOString(),
  };
}
