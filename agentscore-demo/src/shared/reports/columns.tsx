/** Shared `DataTable` column helpers for the Usage report — used by both
 * `UsageReportTab` (per-tenant table) and `TenantUsageDetailPage` (per-agent
 * table), which must render/sort the same metric shape identically.
 *
 * Split out of `UsageReportTab.tsx` so a second page importing these doesn't
 * need `react-refresh/only-export-components` suppressed on a component
 * module.
 */

import Box from "@mui/material/Box";
import type { ColumnDef } from "@tanstack/react-table";

/** A right-aligned numeric column. `sortValue` feeds the column's sort
 *  comparator directly, kept separate from `render`'s formatted string —
 *  sorting on `"$1,000.00"` vs. `"$200.00"` alphabetically would put $200
 *  first. A `null` metric (no such job ran) maps to
 *  `Number.NEGATIVE_INFINITY` — sorts last on a descending sort, but FIRST
 *  on ascending, same as any other minimum value. */
export function metricColumn<TRow>(
  id: string,
  header: string,
  width: string,
  sortValue: (row: TRow) => number,
  render: (row: TRow) => string,
): ColumnDef<TRow, unknown> {
  return {
    id,
    header,
    meta: { headerSx: { width, textAlign: "right" }, cellSx: { textAlign: "right" } },
    accessorFn: (row) => sortValue(row),
    cell: ({ row }) => (
      <Box component="span" sx={{ fontVariantNumeric: "tabular-nums" }}>
        {render(row.original)}
      </Box>
    ),
  };
}

/** A nullable decimal-string metric (a cost or an average) to a sortable
 *  number. `null` → `-Infinity`, so it never collides with a genuine `0` —
 *  it sorts last on descending, first on ascending, like any other
 *  minimum value. */
export function moneyValue(usd: string | null): number {
  if (usd == null) return Number.NEGATIVE_INFINITY;
  const n = Number(usd);
  return Number.isFinite(n) ? n : Number.NEGATIVE_INFINITY;
}
