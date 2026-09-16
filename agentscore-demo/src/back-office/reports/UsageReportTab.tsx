/** UsageReportTab — the Usage report body (Reports page's only tab today).
 *
 * Toolbar (`TimeRangePicker` + Refresh + "Export to Excel") → a per-tenant
 * `DataTable`, cost-sorted from the server. Clicking a tenant row now
 * navigates to `/reports/usage/$tenantId` (`TenantUsageDetailPage`) instead
 * of expanding an inline drill-down — the same list → detail convention every
 * other entity table in this app follows.
 *
 * The window lives in the **URL** (`tab-params.ts`), not component state —
 * the same reasoning `UsageLogTab` documents: it survives an export click and
 * makes the current view shareable. `clampToNinetyDays` mirrors
 * `UsageLogTab`'s `clampToSevenDays`: `/admin/reports/usage` caps its own
 * window at 90 days, and clamping only the outgoing query while the picker
 * trigger still reads a wider preset would be a UI that lies about what it's
 * showing. Applied to the picker's own displayed value (via `range`,
 * threaded through the trigger), not only the `from`/`to` sent to the server.
 *
 * Unlike `UsageLogTab`'s open-ended relative presets (which leave `to` unset
 * so the server can anchor it on its own now), this report always sends both
 * bounds — it's a fixed window read once per fetch, not a live-polling audit
 * log.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconMaterialSymbolsDownload from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsDownload.mjs";
import IconMaterialSymbolsPayments from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsPayments.mjs";
import type { ColumnDef } from "@tanstack/react-table";

import * as api from "@/back-office/reports/report-fixtures";
import type { UsageReportTenantRow } from "@/back-office/reports/report-fixtures";
import { metricColumn, moneyValue } from "@/shared/reports/columns";
import {
  formatAverage,
  formatReportCost,
  formatReportCount,
  formatUnitCost,
} from "@/shared/reports/format";
import type { ReportsSearch } from "@/back-office/reports/tab-params";
import {
  clampToNinetyDays,
  rangeFromSearch,
  rangeToSearch,
} from "@/shared/reports/window";
import { Chip } from "@/shared/components/chip";
import { DataTable } from "@/shared/components/data-table";
import { RefreshButton } from "@/shared/components/refresh-button";
import { resolveTimeRange } from "@/shared/components/time-range";
import { TimeRangePicker } from "@/shared/components/time-range-picker";
import { Toolbar } from "@/shared/components/toolbar";
import { toast } from "@/shared/lib/toast";

export function UsageReportTab() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as ReportsSearch;

  /** Write a view change to the URL. `replace` so filter churn leaves one
   *  history entry, not one per keystroke/click. */
  const setView = useCallback(
    (patch: Partial<ReportsSearch>) =>
      void navigate({
        to: "/reports",
        search: (prev: Record<string, unknown>) => ({ ...prev, tab: "usage", ...patch }) as ReportsSearch,
        replace: true,
      }),
    [navigate],
  );

  // MEMOIZED, and that is load-bearing rather than an optimization — mirrors
  // `UsageLogTab`'s `range`. `resolveTimeRange` reads `new Date()`; an
  // unmemoized `range` is a fresh object every render, which changes the
  // query key, which refetches, which re-renders (an infinite loop). Keyed on
  // primitives only, not on `search` itself.
  const { range: rangeParam, from: fromParam, to: toParam } = search;
  const preClampRange = useMemo(
    () => rangeFromSearch({ range: rangeParam, from: fromParam, to: toParam }),
    [rangeParam, fromParam, toParam],
  );
  const range = useMemo(
    () => clampToNinetyDays(preClampRange),
    [preClampRange],
  );
  // Did the clamp actually change anything? `clampToNinetyDays` returns its
  // input by identity when it already fits, so `!==` here means exactly
  // that — never "does the URL happen to differ from the default", which
  // would fire on every cold `/reports` load (no `range` param at all) and
  // rewrite a window the user never chose into their URL.
  const clampFired = range !== preClampRange;
  useEffect(() => {
    if (!clampFired) return;
    setView(rangeToSearch(range));
  }, [clampFired, range, setView]);

  // `refreshNonce` bumps on every Refresh click. It's a dependency of the
  // window memo below, so for a preset range it re-resolves `resolveTimeRange`
  // against a fresh `new Date()` — a plain `refetch()` against the
  // already-resolved `from`/`to` would silently re-fetch the SAME stale
  // window, defeating the point of refreshing a "Past 30 days" report. It
  // also rides in `useUsageReport`'s query key (api.ts), which is what makes
  // a custom (absolute) range — whose `from`/`to` don't move on refresh —
  // still issue a real request instead of no-op-ing on an unchanged key.
  const [refreshNonce, setRefreshNonce] = useState(0);

  // `resolveTimeRange` reads `new Date()`, a dependency eslint can't see;
  // `refreshNonce` is what actually forces the re-resolve described above.
  const { from, to } = useMemo(() => {
    return resolveTimeRange(range);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, refreshNonce]);
  const fromIso = from.toISOString();
  const toIso = to.toISOString();

  const reportQuery = api.useUsageReport(fromIso, toIso, refreshNonce);
  const report = reportQuery.data;

  const [isExporting, setIsExporting] = useState(false);
  const handleExport = async () => {
    setIsExporting(true);
    try {
      await api.downloadUsageReport(fromIso, toIso);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to export the usage report");
    } finally {
      setIsExporting(false);
    }
  };

  const tenants = report?.tenants ?? [];

  const tenantColumns = useMemo<ColumnDef<UsageReportTenantRow, unknown>[]>(
    () => [
      {
        id: "tenant",
        header: "Tenant",
        accessorFn: (t) => t.tenantName,
        meta: { headerSx: { width: "16%" } },
        cell: ({ row }) => (
          <Box sx={{ display: "flex", minWidth: 0, alignItems: "center", gap: 0.75 }}>
            <Box
              component="span"
              sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
            >
              {row.original.tenantName}
            </Box>
            {row.original.isDeleted ? (
              <Chip tint="destructive" sx={{ flexShrink: 0 }}>
                Deleted
              </Chip>
            ) : null}
          </Box>
        ),
      },
      metricColumn(
        "activeAgents",
        "Active agents",
        "6%",
        (t) => t.activeAgents,
        (t) => formatReportCount(t.activeAgents),
      ),
      metricColumn(
        "traces",
        "Traces",
        "6%",
        (t) => t.traces,
        (t) => formatReportCount(t.traces),
      ),
      metricColumn(
        "avgTraces",
        "Avg traces/active agent",
        "6%",
        (t) => t.avgTracesPerActiveAgent ?? Number.NEGATIVE_INFINITY,
        (t) => formatAverage(t.avgTracesPerActiveAgent),
      ),
      metricColumn(
        "evalResults",
        "Evaluation results",
        "6%",
        (t) => t.evalResults,
        (t) => formatReportCount(t.evalResults),
      ),
      metricColumn(
        "profileFits",
        "Profile fits",
        "6%",
        (t) => t.profileFits,
        (t) => formatReportCount(t.profileFits),
      ),
      metricColumn(
        "agentCards",
        "Agent cards",
        "6%",
        (t) => t.agentCards,
        (t) => formatReportCount(t.agentCards),
      ),
      metricColumn(
        "costUsd",
        "Total cost",
        "6%",
        (t) => moneyValue(t.costUsd),
        (t) => formatReportCost(t.costUsd),
      ),
      metricColumn(
        "costScoringUsd",
        "Scoring",
        "6%",
        (t) => moneyValue(t.costScoringUsd),
        (t) => formatReportCost(t.costScoringUsd),
      ),
      metricColumn(
        "costProfileFitUsd",
        "Profile fit",
        "6%",
        (t) => moneyValue(t.costProfileFitUsd),
        (t) => formatReportCost(t.costProfileFitUsd),
      ),
      metricColumn(
        "costAgentCardUsd",
        "Agent card",
        "6%",
        (t) => moneyValue(t.costAgentCardUsd),
        (t) => formatReportCost(t.costAgentCardUsd),
      ),
      metricColumn(
        "costOtherUsd",
        "Other",
        "6%",
        (t) => moneyValue(t.costOtherUsd),
        (t) => formatReportCost(t.costOtherUsd),
      ),
      metricColumn(
        "avgCostPerEvalResult",
        "Avg cost/result",
        "6%",
        (t) => moneyValue(t.avgCostPerEvalResult),
        (t) => formatUnitCost(t.avgCostPerEvalResult),
      ),
      metricColumn(
        "avgCostPerProfileFit",
        "Avg cost/fit",
        "6%",
        (t) => moneyValue(t.avgCostPerProfileFit),
        (t) => formatUnitCost(t.avgCostPerProfileFit),
      ),
      metricColumn(
        "avgCostPerAgentCard",
        "Avg cost/card",
        "6%",
        (t) => moneyValue(t.avgCostPerAgentCard),
        (t) => formatUnitCost(t.avgCostPerAgentCard),
      ),
    ],
    [],
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Toolbar
        filters={
          <>
            <TimeRangePicker
              value={range}
              testId="filter-range"
              onChange={(v) => setView(rangeToSearch(clampToNinetyDays(v)))}
            />
            <RefreshButton
              onRefresh={() => setRefreshNonce((n) => n + 1)}
              isRefreshing={reportQuery.isFetching}
              label="Refresh usage report"
              testId="refresh-usage-report"
            />
          </>
        }
        actions={
          <Button
            variant="outlined"
            data-testid="export-usage-report"
            disabled={reportQuery.isLoading || isExporting}
            startIcon={<IconMaterialSymbolsDownload sx={{ fontSize: 16 }} />}
            onClick={() => void handleExport()}
          >
            Export to Excel
          </Button>
        }
      />

      <DataTable
        columns={tenantColumns}
        data={tenants}
        isLoading={reportQuery.isLoading}
        error={reportQuery.error as Error | null}
        getRowId={(t) => t.tenantId}
        getRowTestId={(t) => `usage-tenant-row-${t.tenantId}`}
        onRowClick={(t) =>
          void navigate({
            to: "/reports/usage/$tenantId",
            params: { tenantId: t.tenantId },
            search: rangeToSearch(range),
          })
        }
        tableSx={{ tableLayout: "fixed" }}
        emptyState={{
          icon: IconMaterialSymbolsPayments,
          title: "No usage recorded",
          description: "No tenant activity in this window yet.",
          testId: "usage-tenant-empty",
        }}
      />
    </Box>
  );
}
