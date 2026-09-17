/** TenantUsageDetailPage — one tenant's per-agent usage breakdown, at
 * `/reports/usage/$tenantId`.
 *
 * Replaces the inline `?tenant=` drill-down `UsageReportTab` used to render
 * below the tenant table — the same list → detail convention every other
 * entity table in this app follows (`UsageCallDetailPage` in `llm-catalog/`
 * is the exemplar this mirrors: `EntityShell` + a breadcrumb back to the list,
 * carrying the list's own view params so returning restores it).
 *
 * Reads the SAME `GET /admin/reports/usage` window report `UsageReportTab`
 * reads (one endpoint returns both the tenant and agent grain) and filters to
 * this tenant client-side — there is no second, tenant-scoped read endpoint.
 * The window comes from the URL (`?range=`/`?from=&to=`), parsed by
 * `parseReportsWindowSearch` (`tab-params.ts`) — the exact same parser
 * `/reports` uses, so the breadcrumb back-link can hand the window off
 * without either side re-deriving it. `rangeFromSearch`/`rangeToSearch`/
 * `clampToNinetyDays` (`window.ts`) and `metricColumn`/`moneyValue`
 * (`columns.tsx`) are shared with `UsageReportTab` for the same reason: two
 * pages resolving the same URL window or rendering the same metric column
 * must never drift apart.
 */

import { useMemo, useState } from "react";
import { Link, useParams, useSearch } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import BreadcrumbsItem from "@tricentis/aura/components/BreadcrumbsItem.js";
import IconMaterialSymbolsDownload from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsDownload.mjs";
import type { ColumnDef } from "@tanstack/react-table";

import * as api from "@/back-office/reports/report-fixtures";
import type { UsageReportAgentRow } from "@/back-office/reports/report-fixtures";
import { metricColumn, moneyValue } from "@/shared/reports/columns";
import {
  formatReportCost,
  formatReportCount,
  formatUnitCost,
} from "@/shared/reports/format";
import type { ReportsWindowSearch } from "@/back-office/reports/tab-params";
import {
  clampToNinetyDays,
  rangeFromSearch,
  rangeToSearch,
} from "@/shared/reports/window";
import { Chip } from "@/shared/components/chip";
import { DataTable } from "@/shared/components/data-table";
import { EntityShell } from "@/shared/components/entity-shell";
import { NotFoundState } from "@/shared/components/not-found-state";
import { RefreshButton } from "@/shared/components/refresh-button";
import { resolveTimeRange } from "@/shared/components/time-range";
import { toast } from "@/shared/lib/toast";

/** Back-to-Reports affordance for the not-found branch, carrying the current
 *  window so a bogus `tenantId` never strands the reader on a dead end. */
function BackToReports({ search }: { search: ReportsWindowSearch }) {
  return (
    <Button
      component={Link}
      to="/reports"
      search={{ tab: "usage", ...search } as never}
      variant="outlined"
      data-testid="tenant-usage-not-found-back"
    >
      Back to Reports
    </Button>
  );
}

const agentColumns: ColumnDef<UsageReportAgentRow, unknown>[] = [
  {
    id: "agent",
    header: "Agent",
    accessorFn: (a) => a.agentName,
    meta: { headerSx: { width: "16%" } },
    cell: ({ row }) => (
      <Box
        component="span"
        sx={{
          display: "block",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {row.original.agentName}
      </Box>
    ),
  },
  metricColumn(
    "traces",
    "Traces",
    "7%",
    (a) => a.traces,
    (a) => formatReportCount(a.traces),
  ),
  metricColumn(
    "evalResults",
    "Evaluation results",
    "7%",
    (a) => a.evalResults,
    (a) => formatReportCount(a.evalResults),
  ),
  metricColumn(
    "profileFits",
    "Profile fits",
    "7%",
    (a) => a.profileFits,
    (a) => formatReportCount(a.profileFits),
  ),
  metricColumn(
    "agentCards",
    "Agent cards",
    "7%",
    (a) => a.agentCards,
    (a) => formatReportCount(a.agentCards),
  ),
  metricColumn(
    "costUsd",
    "Total cost",
    "7%",
    (a) => moneyValue(a.costUsd),
    (a) => formatReportCost(a.costUsd),
  ),
  metricColumn(
    "costScoringUsd",
    "Scoring",
    "7%",
    (a) => moneyValue(a.costScoringUsd),
    (a) => formatReportCost(a.costScoringUsd),
  ),
  metricColumn(
    "costProfileFitUsd",
    "Profile fit",
    "7%",
    (a) => moneyValue(a.costProfileFitUsd),
    (a) => formatReportCost(a.costProfileFitUsd),
  ),
  metricColumn(
    "costAgentCardUsd",
    "Agent card",
    "7%",
    (a) => moneyValue(a.costAgentCardUsd),
    (a) => formatReportCost(a.costAgentCardUsd),
  ),
  metricColumn(
    "costOtherUsd",
    "Other",
    "7%",
    (a) => moneyValue(a.costOtherUsd),
    (a) => formatReportCost(a.costOtherUsd),
  ),
  metricColumn(
    "avgCostPerEvalResult",
    "Avg cost/result",
    "7%",
    (a) => moneyValue(a.avgCostPerEvalResult),
    (a) => formatUnitCost(a.avgCostPerEvalResult),
  ),
  metricColumn(
    "avgCostPerProfileFit",
    "Avg cost/fit",
    "7%",
    (a) => moneyValue(a.avgCostPerProfileFit),
    (a) => formatUnitCost(a.avgCostPerProfileFit),
  ),
  metricColumn(
    "avgCostPerAgentCard",
    "Avg cost/card",
    "7%",
    (a) => moneyValue(a.avgCostPerAgentCard),
    (a) => formatUnitCost(a.avgCostPerAgentCard),
  ),
];

/** The gate is its own component, above the one that holds the query —
 *  mirrors `ReportsPage`/`UsageCallDetailPage`. Hooks run unconditionally, so
 *  gating inside the query-holding component would fire the report request
 *  from a member's browser before `AccessDenied` ever rendered. */
export function TenantUsageDetailPage() {
  return <TenantUsageDetail />;
}

function TenantUsageDetail() {
  // `strict: false` mirrors `UsageCallDetailPage` — avoids brittleness around
  // how TanStack Router computes the route id under the pathless layout parent.
  const { tenantId } = useParams({ strict: false }) as { tenantId: string };
  const search = useSearch({ strict: false }) as ReportsWindowSearch;

  const preClampRange = useMemo(() => rangeFromSearch(search), [search]);
  const range = useMemo(() => clampToNinetyDays(preClampRange), [preClampRange]);

  // Same nonce mechanism as `UsageReportTab`'s Refresh — re-resolving the
  // window here too keeps a "Past 30 days" drill-down honest on refresh
  // instead of re-fetching the window it loaded with.
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

  const tenantRow = useMemo(
    () => report?.tenants.find((t) => t.tenantId === tenantId),
    [report, tenantId],
  );
  const agents = useMemo(
    () => (report?.agents ?? []).filter((a) => a.tenantId === tenantId),
    [report, tenantId],
  );

  // Every hook above this line, unconditionally — the not-found branch below
  // returns early, and React's hooks must not follow a conditional return.
  const [isExporting, setIsExporting] = useState(false);

  // Only once the query has settled WITHOUT error may an unmatched tenant id
  // mean "not found" — during loading or on a fetch error, `tenantRow` is
  // just as undefined, and rendering not-found then would be the exact false
  // negative the inline drill-down was replaced for showing.
  const isSuccess = !reportQuery.isLoading && !reportQuery.isError;
  if (isSuccess && tenantRow === undefined) {
    return (
      <NotFoundState entity="Tenant" action={<BackToReports search={rangeToSearch(range)} />} />
    );
  }

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await api.downloadUsageReport(fromIso, toIso, tenantId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to export the usage report");
    } finally {
      setIsExporting(false);
    }
  };

  const usageTabSearch = { tab: "usage" as const, ...rangeToSearch(range) };

  return (
    <EntityShell
      breadcrumb={
        <Breadcrumbs data-slot="breadcrumb" aria-label="breadcrumb">
          <BreadcrumbsItem
            data-slot="breadcrumb-link"
            component={Link}
            to="/reports"
            label="Reports"
          />
          <BreadcrumbsItem
            data-slot="breadcrumb-link"
            data-testid="tenant-usage-breadcrumb-usage"
            component={Link}
            to="/reports"
            search={usageTabSearch as never}
            label="Usage"
          />
          <Typography
            data-slot="breadcrumb-page"
            component="span"
            variant="body2"
            color="text.primary"
            aria-current="page"
          >
            {tenantRow?.tenantName ?? tenantId}
          </Typography>
        </Breadcrumbs>
      }
      title={tenantRow?.tenantName ?? tenantId}
      badges={
        tenantRow?.isDeleted ? (
          <Chip tint="destructive" data-testid="tenant-usage-deleted-chip">
            Deleted
          </Chip>
        ) : undefined
      }
      meta={
        <Box component="span" data-testid="tenant-usage-window">
          {from.toLocaleString()} – {to.toLocaleString()}
        </Box>
      }
      actions={
        <>
          <RefreshButton
            onRefresh={() => setRefreshNonce((n) => n + 1)}
            isRefreshing={reportQuery.isFetching}
            label="Refresh tenant usage"
            testId="refresh-tenant-usage"
          />
          <Button
            variant="outlined"
            data-testid="export-tenant-usage"
            disabled={reportQuery.isLoading || isExporting}
            startIcon={<IconMaterialSymbolsDownload sx={{ fontSize: 16 }} />}
            onClick={() => void handleExport()}
          >
            Export to Excel
          </Button>
        </>
      }
    >
      <Box sx={{ px: 4, py: 3 }} data-testid="tenant-usage-detail">
        <DataTable
          columns={agentColumns}
          data={agents}
          isLoading={reportQuery.isLoading}
          error={reportQuery.error as Error | null}
          getRowId={(a) => a.agentId}
          getRowTestId={(a) => `usage-agent-row-${a.agentId}`}
          tableSx={{ tableLayout: "fixed" }}
          emptyState={{
            title: "No agent activity for this tenant in this window.",
          }}
        />
      </Box>
    </EntityShell>
  );
}
