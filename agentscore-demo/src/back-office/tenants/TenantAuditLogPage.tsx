/** TenantAuditLogPage — newest-first timeline of one tenant's notable events.
 *
 * The audit log is a tenant-scoped, append-only record of control-plane
 * lifecycle changes (tenant/agent/key) and notable ingestion outcomes
 * (auto-discovered agents, provisioning failures). Routine per-trace success is
 * never recorded — it surfaces only as the derived throughput banner
 * (`COUNT … GROUP BY status` over `trace_state`, the write-once
 * coordination row that replaced `trace_processing`).
 *
 * Reuses the tenant-detail chrome: a `Toolbar` (search + time-range + filters +
 * manual refresh) over a `DataTable` with offset pagination. There is NO live
 * polling — the operator refreshes manually.
 *
 * The list response is viewer-dependent: `actor_user_email` is populated only
 * for superadmin viewers (a staff actor's corporate email is redacted to a
 * member). `isSuperadmin` is therefore part of the query key so a
 * superadmin-cached body never renders staff emails to a member.
 */

import { useEffect, useMemo, useState } from "react";
import { useFakeQuery as useQuery } from "@/back-office/agents/fake-query";
import { useParams } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import InputAdornment from "@mui/material/InputAdornment";
import ListItemText from "@mui/material/ListItemText";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import type { SelectChangeEvent } from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import IconMaterialSymbolsHistory from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsHistory.mjs";
import IconMaterialSymbolsRefresh from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsRefresh.mjs";
import IconMaterialSymbolsSearch from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsSearch.mjs";
import type { ColumnDef } from "@tanstack/react-table";

import * as api from "@/back-office/tenants/tenant-fixtures";
import type { AuditEventProfile } from "@/back-office/tenants/tenant-fixtures";
import { useAuth } from "@/shared/auth/use-auth";
import { DataTable } from "@/shared/components/data-table";
import { PageBand } from "@/shared/components/page-band";
import { StatusDot } from "@/shared/components/status-dot";
import { TimeRangePicker } from "@/shared/components/time-range-picker";
import {
  resolveTimeRange,
  type TimeRangeValue,
} from "@/shared/components/time-range";
import { Toolbar } from "@/shared/components/toolbar";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";

const PAGE_SIZE = 25;

type Severity = AuditEventProfile["severity"];

/** Severity → status-dot variant. */
const SEVERITY_DOT: Record<Severity, "info" | "warning" | "destructive"> = {
  info: "info",
  warning: "warning",
  error: "destructive",
};

const SEVERITY_OPTIONS: readonly Severity[] = ["info", "warning", "error"];

/** The event types the platform emits — drives the filter list.
 *
 * Mirrors `AuditEventType` in `packages/common/.../audit/events.py`: every
 * member that has a live `record_audit_event` emit site somewhere in the
 * codebase (every row in `audit_events` carries a `tenant_name`, so any of
 * these can show up on a given tenant's log). Two groups are deliberately
 * left out: `trace.discovery_failed` / `trace.discovery_deferred` /
 * `inbox.retention_purged` no longer exist as enum members at all
 * (write-once trace ingestion) deleted the drain/inbox move-machinery those
 * types described; and `scoring_task.*` is a superseded enum member with no
 * emit site left (the job-grain `scoring_job.*` family replaced it — see the
 * comment on that member in `events.py`). Keep this in sync with the emit
 * sites. */
const EVENT_TYPE_OPTIONS: readonly string[] = [
  "tenant.created",
  "tenant.renamed",
  "tenant.soft_deleted",
  "tenant.restored",
  "tenant.auto_created",
  "tenant_api_key.created",
  "tenant_api_key.renamed",
  "tenant_api_key.rotated",
  "tenant_api_key.disabled",
  "tenant_api_key.enabled",
  "tenant_api_key.revoked",
  "agent.created",
  "agent.provisioned",
  "agent.provision_failed",
  "agent.soft_deleted",
  "agent.restored",
  "agent.purged",
  "agent.auto_created",
  "agent.deactivated",
  "agent.activated",
  "ingestion.tenant_disabled",
  "ingestion.tenant_enabled",
  "ingestion.tenant_rate_limit_set",
  "ingestion.tenant_rate_limit_cleared",
  "ingestion.quarantine_purged",
  "scoring_run.cancelled",
  "scoring_run.requeued",
  "scoring_run.purged",
  "scoring_job.cancelled",
  "scoring_job.requeued",
  "scoring_job.purged",
];

/** Each summary tile: backing count field + label + test-id hook (spec §6.7). */
const SUMMARY_TILES: readonly {
  key: keyof Pick<
    api.AuditThroughputSummary,
    "discovered" | "attributed" | "deferred" | "failed" | "purged"
  >;
  label: string;
  testId: string;
}[] = [
  { key: "discovered", label: "Discovered", testId: "audit-summary-discovered" },
  { key: "attributed", label: "Attributed", testId: "audit-summary-attributed" },
  { key: "deferred", label: "Deferred", testId: "audit-summary-deferred" },
  { key: "failed", label: "Failed", testId: "audit-summary-failed" },
  { key: "purged", label: "Purged", testId: "audit-summary-purged" },
];

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TenantAuditLogPage() {
  const { tenantId } = useParams({ strict: false }) as { tenantId: string };
  const { user } = useAuth();
  const isSuperadmin = Boolean(user?.is_superadmin);

  const [search, setSearch] = useState("");
  const [range, setRange] = useState<TimeRangeValue>({
    kind: "preset",
    preset: "7d",
  });
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [severities, setSeverities] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [refreshNonce, setRefreshNonce] = useState(0);

  const debouncedSearch = useDebouncedValue(search, 350);
  const trimmedSearch = debouncedSearch.trim();

  const { from, to } = useMemo(() => {
    const r = resolveTimeRange(range);
    return { from: r.from.toISOString(), to: r.to.toISOString() };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, refreshNonce]);

  const offset = page * PAGE_SIZE;

  // Reset to the first page whenever a filter narrows the result set.
  useEffect(() => {
    setPage(0);
  }, [trimmedSearch, eventTypes, severities, from, to]);

  const listQuery = useQuery({
    queryKey: [
      "tenant-audit-events",
      tenantId,
      isSuperadmin,
      { from, to, eventTypes, severities, q: trimmedSearch, offset },
    ],
    queryFn: () =>
      api.listAuditEvents(tenantId, {
        limit: PAGE_SIZE,
        offset,
        from,
        to,
        eventTypes,
        severities,
        q: trimmedSearch || undefined,
      }),
  });

  const summaryQuery = useQuery({
    queryKey: ["tenant-audit-summary", tenantId, { from, to }],
    queryFn: () =>
      api.getAuditThroughputSummary({ tenantId, from, to }),
  });

  const items = listQuery.data?.items ?? [];
  const total = listQuery.data?.total ?? 0;
  const summary = summaryQuery.data;
  const hasFilters =
    trimmedSearch.length > 0 ||
    eventTypes.length > 0 ||
    severities.length > 0;

  const onEventTypesChange = (e: SelectChangeEvent<string[]>) => {
    const v = e.target.value;
    setEventTypes(typeof v === "string" ? v.split(",") : v);
  };
  const onSeveritiesChange = (e: SelectChangeEvent<string[]>) => {
    const v = e.target.value;
    setSeverities(typeof v === "string" ? v.split(",") : v);
  };

  const refresh = () => {
    if (range.kind === "preset") {
      // Recompute the relative window so the refresh advances `now`; the
      // changed key re-runs both queries.
      setRefreshNonce((n) => n + 1);
    } else {
      void listQuery.refetch();
      void summaryQuery.refetch();
    }
  };

  const columns: ColumnDef<AuditEventProfile, unknown>[] = useMemo(() => {
    const cols: ColumnDef<AuditEventProfile, unknown>[] = [
      {
        id: "created_at",
        header: "Time",
        meta: { headerSx: { width: isSuperadmin ? "13%" : "14%" } },
        accessorFn: (e) => e.created_at,
        enableSorting: false,
        cell: ({ row }) => (
          <Box
            component="span"
            sx={{ typography: "caption", color: "text.secondary" }}
            title={new Date(row.original.created_at).toISOString()}
          >
            {formatTimestamp(row.original.created_at)}
          </Box>
        ),
      },
      {
        id: "severity",
        header: "Severity",
        meta: { headerSx: { width: "11%" } },
        accessorFn: (e) => e.severity,
        enableSorting: false,
        cell: ({ row }) => (
          <StatusDot status={SEVERITY_DOT[row.original.severity]}>
            {row.original.severity}
          </StatusDot>
        ),
      },
      {
        id: "event_type",
        header: "Event",
        meta: { headerSx: { width: isSuperadmin ? "17%" : "18%" } },
        accessorFn: (e) => e.event_type,
        enableSorting: false,
        cell: ({ row }) => (
          <Box
            component="span"
            sx={{
              display: "block",
              fontFamily: "monospace",
              typography: "caption",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={row.original.event_type}
          >
            {row.original.event_type}
          </Box>
        ),
      },
      {
        id: "resource",
        header: "Resource",
        meta: { headerSx: { width: isSuperadmin ? "15%" : "16%" } },
        accessorFn: (e) => e.resource_id,
        enableSorting: false,
        cell: ({ row }) => (
          <Box sx={{ minWidth: 0 }}>
            <Box
              component="span"
              sx={{ display: "block", typography: "caption" }}
            >
              {row.original.resource_type}
            </Box>
            {row.original.resource_id ? (
              <Box
                component="span"
                sx={{
                  display: "block",
                  fontFamily: "monospace",
                  typography: "caption",
                  color: "text.secondary",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={row.original.resource_id}
              >
                {row.original.resource_id}
              </Box>
            ) : null}
          </Box>
        ),
      },
    ];

    if (isSuperadmin) {
      cols.push({
        id: "actor",
        header: "Actor",
        meta: { headerSx: { width: "16%" } },
        accessorFn: (e) => e.actor_user_email,
        enableSorting: false,
        cell: ({ row }) => (
          <Box sx={{ minWidth: 0 }}>
            <Box
              component="span"
              sx={{ display: "block", typography: "caption" }}
            >
              {row.original.actor_type}
            </Box>
            {row.original.actor_user_email ? (
              <Box
                component="span"
                sx={{
                  display: "block",
                  typography: "caption",
                  color: "text.secondary",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={row.original.actor_user_email}
              >
                {row.original.actor_user_email}
              </Box>
            ) : null}
          </Box>
        ),
      });
    }

    cols.push({
      id: "summary",
      header: "Summary",
      meta: { headerSx: { width: isSuperadmin ? "28%" : "41%" } },
      accessorFn: (e) => e.summary,
      enableSorting: false,
      cell: ({ row }) => (
        <Tooltip title={row.original.summary}>
          <Box
            component="span"
            sx={{
              display: "block",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {row.original.summary}
          </Box>
        </Tooltip>
      ),
    });

    return cols;
  }, [isSuperadmin]);

  return (
    <Box
      sx={{
        display: "flex",
        height: "100%",
        minHeight: 0,
        flexDirection: "column",
      }}
    >
      <PageBand>
        <Toolbar
          search={
            <TextField
              placeholder="Search by summary or resource id…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              fullWidth
              size="small"
              slotProps={{
                htmlInput: {
                  "data-testid": "audit-search",
                  "aria-label": "Search audit events",
                },
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <IconMaterialSymbolsSearch
                        sx={{ fontSize: 14, color: "text.secondary" }}
                      />
                    </InputAdornment>
                  ),
                },
              }}
            />
          }
          filters={
            <>
              <Select<string[]>
                multiple
                displayEmpty
                size="small"
                value={eventTypes}
                onChange={onEventTypesChange}
                data-testid="audit-filter-event-type"
                renderValue={(selected) =>
                  selected.length === 0
                    ? "Event type"
                    : `Event type · ${selected.length}`
                }
                sx={{ minWidth: 160 }}
                inputProps={{ "aria-label": "Filter by event type" }}
              >
                {EVENT_TYPE_OPTIONS.map((value) => (
                  <MenuItem
                    key={value}
                    value={value}
                    data-testid={`audit-filter-event-type-option-${value}`}
                  >
                    <Checkbox
                      size="small"
                      checked={eventTypes.includes(value)}
                      sx={{ p: 0, mr: 1 }}
                    />
                    <ListItemText
                      primary={value}
                      slotProps={{
                        primary: {
                          sx: { fontFamily: "monospace", typography: "caption" },
                        },
                      }}
                    />
                  </MenuItem>
                ))}
              </Select>
              <Select<string[]>
                multiple
                displayEmpty
                size="small"
                value={severities}
                onChange={onSeveritiesChange}
                data-testid="audit-filter-severity"
                renderValue={(selected) =>
                  selected.length === 0
                    ? "Severity"
                    : `Severity · ${selected.length}`
                }
                sx={{ minWidth: 130 }}
                inputProps={{ "aria-label": "Filter by severity" }}
              >
                {SEVERITY_OPTIONS.map((value) => (
                  <MenuItem
                    key={value}
                    value={value}
                    data-testid={`audit-filter-severity-option-${value}`}
                  >
                    <Checkbox
                      size="small"
                      checked={severities.includes(value)}
                      sx={{ p: 0, mr: 1 }}
                    />
                    <ListItemText primary={value} />
                  </MenuItem>
                ))}
              </Select>
              <TimeRangePicker
                value={range}
                onChange={(v) => {
                  setPage(0);
                  setRange(v);
                }}
              />
              <Button
                variant="outlined"
                size="small"
                color="inherit"
                data-testid="audit-refresh"
                startIcon={<IconMaterialSymbolsRefresh sx={{ fontSize: 16 }} />}
                onClick={refresh}
                disabled={listQuery.isFetching || summaryQuery.isFetching}
              >
                Refresh
              </Button>
            </>
          }
          right={total > 0 ? <span>{total} events</span> : undefined}
        />
      </PageBand>

      <Box
        sx={{
          minHeight: 0,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 2,
          overflowY: "auto",
          px: 4,
          py: 3,
        }}
      >
        <ThroughputBanner summary={summary} />

        <DataTable
          columns={columns}
          data={items}
          tableSx={{ tableLayout: "fixed" }}
          isLoading={listQuery.isLoading}
          error={listQuery.error as Error | null}
          getRowId={(e) => e.id}
          getRowTestId={(e) => `audit-event-row-${e.id}`}
          emptyState={{
            icon: IconMaterialSymbolsHistory,
            title: hasFilters
              ? "No events match your filters"
              : "No audit events yet",
            description: hasFilters
              ? "Clear the filters or widen the time range."
              : "Tenant, agent, and key lifecycle changes plus notable ingestion outcomes appear here as they happen.",
          }}
          enableSorting={false}
        />

        {/* The shared DataTable pagination footer renders `data-slot` buttons
            without the audit-specific `data-testid` hooks the e2e flow + spec
            §6.7 pin, so the audit log owns its own offset pagination row. */}
        {!listQuery.error ? (
          <AuditPagination
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            rowsRendered={items.length}
            onPageChange={setPage}
          />
        ) : null}
      </Box>
    </Box>
  );
}

function AuditPagination({
  page,
  pageSize,
  total,
  rowsRendered,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  rowsRendered: number;
  onPageChange: (page: number) => void;
}) {
  const offset = page * pageSize;
  const first = total === 0 ? 0 : offset + 1;
  const last = offset + rowsRendered;
  const hasPrev = page > 0;
  const hasNext = last < total;

  return (
    <Box
      data-slot="audit-pagination"
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        color: "text.secondary",
      }}
    >
      <Typography component="span" variant="caption">
        {total === 0 ? "0 results" : `${first}–${last} of ${total}`}
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Button
          variant="outlined"
          size="small"
          disabled={!hasPrev}
          data-testid="audit-pagination-prev"
          onClick={() => onPageChange(Math.max(0, page - 1))}
        >
          Previous
        </Button>
        <Button
          variant="outlined"
          size="small"
          disabled={!hasNext}
          data-testid="audit-pagination-next"
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </Box>
    </Box>
  );
}

function ThroughputBanner({
  summary,
}: {
  summary: api.AuditThroughputSummary | undefined;
}) {
  return (
    <Paper
      variant="outlined"
      data-slot="audit-throughput-summary"
      sx={{
        borderRadius: 1.25,
        px: 3,
        py: 2,
        display: "flex",
        flexWrap: "wrap",
        gap: 4,
      }}
    >
      {SUMMARY_TILES.map((tile) => (
        <Box key={tile.key} sx={{ minWidth: 80 }}>
          <Typography
            variant="caption"
            sx={{ display: "block", color: "text.secondary" }}
          >
            {tile.label}
          </Typography>
          <Typography
            variant="h5"
            component="span"
            data-testid={tile.testId}
            sx={{ fontVariantNumeric: "tabular-nums" }}
          >
            {(summary?.[tile.key] ?? 0).toLocaleString()}
          </Typography>
        </Box>
      ))}
    </Paper>
  );
}
