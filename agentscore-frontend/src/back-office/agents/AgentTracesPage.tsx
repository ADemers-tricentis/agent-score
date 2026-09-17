/** AgentTracesPage — paginated trace list for one agent.
 *
 * Toolbar (compact split layout): search box + time-range preset picker + a
 * manual-refresh / auto-refresh split control + a Download action that
 * exports every trace matching the current filters as JSONL, refused above
 * `TRACE_EXPORT_CAP` traces (narrow the time range to get under it). Row
 * click navigates to the trace detail page with `?timestamp=` (required by
 * the BE for the ClickHouse partition lookup).
 *
 * Time window: for relative presets the `{from,to}` window is recomputed
 * against `now` whenever `refreshNonce` bumps (manual refresh or an
 * auto-refresh tick), so polling actually advances the window and picks up
 * the newest traces. Custom calendar ranges are fixed and just refetch.
 *
 * Search is server-side and matches trace ids and names: the term is ANDed with
 * the time window and per-agent scope on the BE, and `total`/pagination
 * reflect the filtered set. The raw input is debounced before it feeds the
 * query so each keystroke doesn't fire a request.
 *
 * Pagination is a cursor stack, not a page index (the BE's `traces.all` takes
 * an opaque `cursor`, not `page`): Next pushes `next_cursor`, Previous pops.
 * A cursor is only valid for the query that produced it, so search/session-filter/
 * manual range changes reset the stack, as does a `$tenantId`/`$agentId` route
 * change (the route declares no `key`, so this component instance survives an
 * agent switch); an auto-refresh tick reuses the current cursor (see the effects
 * below for why).
 *
 * The Session column filters: the toolbar carries a debounced session-id
 * filter (exact match, server-side), and clicking a populated cell applies
 * that same filter without navigating to the trace's detail page. A trace
 * with no session id renders a muted "No session" — absent, not broken.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useFakeQuery as useQuery } from "@/back-office/agents/fake-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import { alpha } from "@mui/material/styles";
import IconMaterialSymbolsWarning from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsWarning.mjs";
import IconMaterialSymbolsCheckCircle from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsCheckCircle.mjs";
import IconMaterialSymbolsDownload from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsDownload.mjs";
import IconMaterialSymbolsList from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsList.mjs";
import IconMaterialSymbolsSearch from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsSearch.mjs";
import IconMaterialSymbolsCancel from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsCancel.mjs";
import type { ColumnDef } from "@tanstack/react-table";

import * as api from "@/back-office/agents/fake-trace-data";
import { listCoverageLabel } from "@/back-office/agents/trace-score-format";
import { AutoRefreshControl } from "@/shared/components/auto-refresh-control";
import { Chip } from "@/shared/components/chip";
import { DataTable } from "@/shared/components/data-table";
import { PageBand } from "@/shared/components/page-band";
import { REFRESH_INTERVALS } from "@/shared/components/refresh-intervals";
import { StatusDot } from "@/shared/components/status-dot";
import { TimeRangePicker } from "@/shared/components/time-range-picker";
import {
  resolveTimeRange,
  type TimeRangeValue,
} from "@/shared/components/time-range";
import { Toolbar } from "@/shared/components/toolbar";
import { formatCostUsd, formatDuration } from "@/shared/lib/format";
import { toast } from "@/shared/lib/toast";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
import { focusRing } from "@/shared/theme/focus-ring";

const PAGE_SIZE = 25;

/** Column defs are a factory, not a module constant, because the Session
 * column's click-to-filter needs the page's own `setSessionId` — passed in
 * as `onFilterSession` rather than reached for via a module-level ref. Not
 * exported: this file is component-only per `react-refresh/only-export-
 * components`, so `AgentTracesPage.test.tsx` renders the exported
 * `TraceScoreCell` component directly instead of driving this factory
 * through `DataTable`. */
function createColumns(
  onFilterSession: (sessionId: string) => void,
): ColumnDef<api.TraceProfile, unknown>[] {
  return [
    {
      id: "timestamp",
      header: "Timestamp",
      meta: { headerSx: { width: "14%" } },
      accessorFn: (t) => t.timestamp,
      cell: ({ row }) => (
        <Box
          component="span"
          sx={{ fontFamily: "monospace", typography: "caption" }}
          title={new Date(row.original.timestamp).toISOString()}
        >
          {new Date(row.original.timestamp).toLocaleString()}
        </Box>
      ),
      enableSorting: false,
    },
    {
      id: "session",
      header: "Session",
      meta: { headerSx: { width: "14%" } },
      accessorFn: (t) => t.session_id,
      cell: ({ row }) => {
        const sessionId = row.original.session_id;
        if (!sessionId) {
          return (
            <Box
              component="span"
              sx={{ display: "block", typography: "caption", color: "text.secondary" }}
            >
              No session
            </Box>
          );
        }
        return (
          // A real button, not a `span` wrapper: keyboard-operable with a
          // visible focus ring. `stopPropagation` keeps this click from also
          // bubbling into the row's own `onRowClick` (which navigates to the
          // trace detail) — one click cannot both filter and navigate.
          <Box
            component="button"
            type="button"
            data-testid={`session-filter-${row.original.trace_id}`}
            onClick={(e) => {
              e.stopPropagation();
              onFilterSession(sessionId);
            }}
            title={sessionId}
            sx={[
              focusRing,
              {
                display: "block",
                width: 1,
                p: 0,
                border: 0,
                background: "none",
                font: "inherit",
                fontFamily: "monospace",
                typography: "caption",
                textAlign: "left",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                cursor: "pointer",
                "&:hover": { textDecoration: "underline" },
              },
            ]}
          >
            {sessionId}
          </Box>
        );
      },
      enableSorting: false,
    },
    {
      id: "name",
      header: "Name",
      meta: { headerSx: { width: "22%" } },
      accessorFn: (t) => t.name,
      cell: ({ row }) => (
        <Box
          component="span"
          sx={{
            display: "block",
            fontWeight: 500,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {row.original.name ?? "—"}
        </Box>
      ),
      enableSorting: false,
    },
    {
      id: "latency",
      header: () => (
        <Box component="span" sx={{ display: "block", textAlign: "right" }}>
          Latency
        </Box>
      ),
      meta: { headerSx: { width: "9%" } },
      accessorFn: (t) => t.latency_ms,
      cell: ({ row }) => (
        <Box
          component="span"
          sx={{
            display: "block",
            textAlign: "right",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {formatDuration(row.original.latency_ms)}
        </Box>
      ),
      enableSorting: false,
    },
    {
      id: "tokens",
      header: () => (
        <Box component="span" sx={{ display: "block", textAlign: "right" }}>
          Tokens
        </Box>
      ),
      meta: { headerSx: { width: "9%" } },
      accessorFn: (t) => t.total_tokens,
      cell: ({ row }) => (
        <Box
          component="span"
          sx={{
            display: "block",
            textAlign: "right",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {row.original.total_tokens?.toLocaleString() ?? "—"}
        </Box>
      ),
      enableSorting: false,
    },
    {
      id: "cost",
      header: () => (
        <Box component="span" sx={{ display: "block", textAlign: "right" }}>
          Cost
        </Box>
      ),
      meta: { headerSx: { width: "9%" } },
      accessorFn: (t) => t.total_cost_usd,
      cell: ({ row }) => (
        <Box
          component="span"
          sx={{
            display: "block",
            textAlign: "right",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {formatCostUsd(row.original.total_cost_usd)}
        </Box>
      ),
      enableSorting: false,
    },
    {
      id: "status",
      header: "Status",
      meta: { headerSx: { width: "9%" } },
      accessorFn: (t) => t.status,
      cell: ({ row }) => <TraceStatusBadge status={row.original.status} />,
      enableSorting: false,
    },
    {
      id: "score",
      header: () => (
        <Box component="span" sx={{ display: "block", textAlign: "right" }}>
          Score
        </Box>
      ),
      meta: { headerSx: { width: "14%" } },
      accessorFn: (t) => t.score?.score ?? null,
      cell: ({ row }) => <TraceScoreCell trace={row.original} />,
      enableSorting: false,
    },
  ];
}

export function AgentTracesPage() {
  const { tenantId, agentId } = useParams({ strict: false }) as {
    tenantId: string;
    agentId: string;
  };
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [range, setRange] = useState<TimeRangeValue>({
    kind: "preset",
    preset: "7d",
  });
  const [intervalId, setIntervalId] = useState("off");
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  // Cursor stack: index 0 is always `null` (first page); the current cursor
  // is the last element. Next pushes `next_cursor`; Previous pops. A cursor
  // is only valid for the query that produced it, so search/session-filter
  // changes reset the stack to `[null]` inline in their own input's
  // `onChange` (see those handlers below), and a manual range change does
  // the same in the TimeRangePicker `onChange`; only the route reset needs
  // its own effect (see below) — an auto-refresh tick is the deliberate
  // exception (see the comment above the polling effect).
  const [cursorStack, setCursorStack] = useState<(string | null)[]>([null]);
  const cursor = cursorStack[cursorStack.length - 1];

  // Debounce the term that feeds the query — keeps the input snappy while
  // throttling requests.
  const debouncedSearch = useDebouncedValue(search, 350);
  const trimmedSearch = debouncedSearch.trim();
  const debouncedSessionId = useDebouncedValue(sessionId, 350);
  const trimmedSessionId = debouncedSessionId.trim();

  const columns = useMemo(() => createColumns(setSessionId), []);

  // Re-query the agent for the soft-delete banner. TanStack Query dedupes
  // against the layout's fetch, so this is cheap.
  const agentQuery = useQuery({
    queryKey: ["agent", tenantId, agentId],
    queryFn: () => api.getAgent(tenantId, agentId),
  });
  const agentDeletedAt = agentQuery.data?.deleted_at ?? null;

  // Resolve the concrete window. Presets recompute against `now` on each
  // `refreshNonce` bump so polling advances the window; custom ranges are
  // stable.
  const { from, to } = useMemo(() => {
    const r = resolveTimeRange(range);
    return { from: r.from.toISOString(), to: r.to.toISOString() };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, refreshNonce]);

  // Reset to the first page on a `tenantId`/`agentId` route change: the
  // route declares no `key`, so TanStack Router reuses this component
  // instance across a `$tenantId`/`$agentId` change instead of remounting
  // it. Without this, a leftover cursor from the previous agent's
  // Next/Previous clicks would silently feed the new agent's first request —
  // the wrong agent's page N, not a 422.
  //
  // The search term and session filter deliberately do NOT reset here: an
  // effect keyed on the debounced value fires one render *after* the value
  // changes, so a filter change on page 2 would pair the new filter with the
  // still-stale cursor for exactly one query — a wrong page of data, not a
  // cosmetic flash. They reset inline in their own input's `onChange`
  // instead (see below), which batches the reset with the same state update
  // that starts the change. Time-window changes reset the stack the same way
  // in the picker's onChange; auto-refresh ticks (which also move from/to)
  // intentionally preserve the current cursor.
  useEffect(() => {
    setCursorStack([null]);
  }, [tenantId, agentId]);

  const queryKey = useMemo(
    () => [
      "agent-traces",
      tenantId,
      agentId,
      {
        cursor,
        limit: PAGE_SIZE,
        from,
        to,
        search: trimmedSearch,
        sessionId: trimmedSessionId,
      },
    ],
    [tenantId, agentId, cursor, from, to, trimmedSearch, trimmedSessionId],
  );

  const tracesQuery = useQuery({
    queryKey,
    queryFn: () =>
      api.listAgentTraces(tenantId, agentId, {
        cursor: cursor ?? undefined,
        limit: PAGE_SIZE,
        from,
        to,
        search: trimmedSearch || undefined,
        session_id: trimmedSessionId || undefined,
      }),
  });

  // Manual + auto refresh. For presets, bumping the nonce recomputes the
  // window (key change → refetch). For a fixed custom range the key is
  // unchanged, so refetch explicitly. A ref keeps the polling effect stable
  // across renders without re-arming the interval each time.
  const refreshRef = useRef<() => void>(() => {});
  refreshRef.current = () => {
    if (range.kind === "preset") {
      setRefreshNonce((n) => n + 1);
    } else {
      void tracesQuery.refetch();
    }
  };

  const intervalMs =
    REFRESH_INTERVALS.find((i) => i.id === intervalId)?.ms ?? null;

  useEffect(() => {
    if (intervalMs == null) return;
    const t = window.setInterval(() => refreshRef.current(), intervalMs);
    return () => window.clearInterval(t);
  }, [intervalMs]);

  const items = tracesQuery.data?.items ?? [];
  const total = tracesQuery.data?.total ?? 0;
  const nextCursor = tracesQuery.data?.next_cursor ?? null;
  const hasSearch = trimmedSearch.length > 0;
  const hasSessionFilter = trimmedSessionId.length > 0;

  // `total` collapses to 0 whenever `data` is undefined — true on first load
  // AND mid-refetch (a keyed refetch, e.g. from a search-term change, clears
  // `data` before the new page lands, and `isLoading` only covers the first
  // load). Gate the empty/over-cap claims on a settled query so an in-flight
  // request never asserts "nothing to export" about a count it doesn't
  // actually know yet; `isFetching` (not `isLoading`) covers every refetch.
  const hasSettledTraces = tracesQuery.data !== undefined;
  const isEmpty = hasSettledTraces && total === 0;
  const overCap = hasSettledTraces && total > api.TRACE_EXPORT_CAP;
  // A failed list query also leaves `total` at its 0 default without
  // `hasSettledTraces` — the count is genuinely unknown, not zero, so this
  // must gate the button independently of `isEmpty`/`overCap` rather than
  // fall through to "enabled".
  const downloadDisabled =
    isDownloading ||
    tracesQuery.isFetching ||
    tracesQuery.isError ||
    isEmpty ||
    overCap;
  const downloadTitle = overCap
    ? `Export is capped at ${api.TRACE_EXPORT_CAP} traces — narrow the time range to bring the count under the cap.`
    : isEmpty
      ? "There is nothing to export."
      : tracesQuery.isError
        ? "The trace list failed to load — retry before exporting."
        : undefined;

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const blob = await api.exportAgentTraces(tenantId, agentId, {
        from,
        to,
        search: trimmedSearch || undefined,
        session_id: trimmedSessionId || undefined,
      });
      const safeName = (agentQuery.data?.name ?? agentId).replace(
        /[^A-Za-z0-9._-]+/g,
        "-",
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      // Compact `YYYYMMDDTHHMMSSZ` — `toISOString()`'s `:` is illegal in a
      // Windows filename, unlike the server's own colon-free
      // `Content-Disposition` stamp this mirrors.
      const stamp = new Date()
        .toISOString()
        .replace(/[-:]/g, "")
        .replace(/\.\d{3}Z$/, "Z");
      a.download = `${safeName}-traces-${stamp}.jsonl`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      // Defer the revoke: `a.click()` starts the download asynchronously, and
      // revoking synchronously can invalidate the blob URL before some
      // browsers read it, yielding an empty/failed download.
      setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to export traces");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Box sx={{ display: "flex", height: "100%", minHeight: 0, flexDirection: "column" }}>
      <PageBand>
        <Toolbar
          search={
            <TextField
              placeholder="Search by trace id or name…"
              value={search}
              onChange={(e) => {
                // Reset the cursor in the same state update that starts the
                // change, not in an effect keyed on the debounced term — see
                // the comment on the route-reset effect above for why. One
                // request may go out as "previous term, first page" before
                // the debounce lands and re-queries as "new term, first
                // page" — a harmless extra fetch of correct data, and
                // strictly better than pairing the new term with a leftover
                // cursor from the previous result set.
                setSearch(e.target.value);
                setCursorStack([null]);
              }}
              fullWidth
              size="small"
              slotProps={{
                htmlInput: {
                  "data-testid": "search-traces",
                  "aria-label": "Search traces",
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
              <TextField
                placeholder="Filter by session id…"
                value={sessionId}
                onChange={(e) => {
                  // Same reasoning as the search box's onChange above: reset
                  // inline so the cursor never pairs with a stale page while
                  // this value is still debouncing.
                  setSessionId(e.target.value);
                  setCursorStack([null]);
                }}
                size="small"
                sx={{ width: 220 }}
                slotProps={{
                  htmlInput: {
                    "data-testid": "filter-session",
                    "aria-label": "Filter by session id",
                    maxLength: 128,
                  },
                }}
              />
              <TimeRangePicker
                value={range}
                onChange={(v) => {
                  setCursorStack([null]);
                  setRange(v);
                }}
              />
              <AutoRefreshControl
                intervalId={intervalId}
                onIntervalChange={setIntervalId}
                onRefresh={() => refreshRef.current()}
                isRefreshing={tracesQuery.isFetching}
              />
            </>
          }
          actions={
            // A native `disabled` button fires no pointer events, so a plain
            // `title` on it never reaches the user (Chromium shows no
            // tooltip and MUI's own Tooltip warns about exactly this). Wrap
            // it in a `span` so `Tooltip` has something live to listen on;
            // the `data-testid` stays on the `Button` itself.
            <Tooltip title={downloadTitle ?? ""}>
              <span>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<IconMaterialSymbolsDownload fontSize="small" />}
                  data-testid="download-traces"
                  disabled={downloadDisabled}
                  onClick={() => void handleDownload()}
                >
                  {isDownloading ? "Downloading…" : "Download"}
                </Button>
              </span>
            </Tooltip>
          }
          right={total > 0 ? <span>{total} traces</span> : undefined}
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
        {agentDeletedAt !== null && (
          <Box
            data-testid="agent-deleted-banner"
            sx={(theme) => ({
              borderRadius: 1,
              border: 1,
              borderColor: alpha(theme.palette.error.main, 0.3),
              bgcolor: alpha(theme.palette.error.main, 0.1),
              px: 1.5,
              py: 1,
              typography: "body1",
              color: "error.main",
            })}
          >
            Agent is deleted — read-only view.
          </Box>
        )}

        <DataTable
          columns={columns}
          data={items}
          tableSx={{ tableLayout: "fixed" }}
          isLoading={tracesQuery.isLoading}
          error={tracesQuery.error as Error | null}
          getRowId={(t) => t.trace_id}
          getRowTestId={(t) => `trace-row-${t.trace_id}`}
          onRowClick={(t) =>
            void navigate({
              to: "/tenants/$tenantId/agents/$agentId/traces/$traceId",
              params: { tenantId, agentId, traceId: t.trace_id },
              search: { timestamp: t.timestamp, view: "spans" },
            })
          }
          emptyState={{
            icon: IconMaterialSymbolsList,
            title:
              hasSearch || hasSessionFilter
                ? "No traces match your filters"
                : "No traces in the selected window",
            description:
              hasSearch || hasSessionFilter
                ? "Clear the search or session filter, or widen the time range."
                : "Widen the time range or check that the agent is emitting traces.",
          }}
          pagination={{
            mode: "cursor",
            hasNext: nextCursor !== null,
            hasPrev: cursorStack.length > 1,
            total,
            onNext: () =>
              setCursorStack((stack) => [...stack, nextCursor]),
            onPrev: () =>
              setCursorStack((stack) =>
                stack.length > 1 ? stack.slice(0, -1) : stack,
              ),
          }}
          enableSorting={false}
        />
      </Box>
    </Box>
  );
}

/** The trace's judge outcome under the latest scoring run that covered it.
 *
 * Three states, all distinct: no summary at all (no run has ever covered this
 * trace) renders "—"; a summary whose `score` is null (covered, but no eval
 * produced a score — every one landed on insufficient evidence) renders
 * "n/a"; otherwise the mean, with its own coverage denominator beside it —
 * `scored_evals` of `total_evals`, the run's own assigned-eval count for this
 * trace. Coverage varies per trace (skips and exclusions differ), so two
 * traces with the same mean can rest on very different amounts of evidence —
 * the percent alone would hide that. The run id moves into the tooltip.
 *
 * Deliberately uncolored: a verdict band is defined for the agent composite,
 * not for a single trace's unweighted mean, and tinting this would assert one.
 */
export function TraceScoreCell({ trace }: { trace: api.TraceProfile }) {
  const testId = `trace-score-${trace.trace_id}`;
  const summary = trace.score;

  if (!summary) {
    return (
      <Box
        component="span"
        data-testid={testId}
        title="No scoring run has covered this trace."
        sx={{ display: "block", textAlign: "right", color: "text.secondary" }}
      >
        —
      </Box>
    );
  }

  if (summary.score == null) {
    return (
      <Box
        data-testid={testId}
        title={`Run ${summary.run_id} covered this trace; none of its ${summary.total_evals} evals produced a score.`}
        sx={{ display: "flex", justifyContent: "flex-end" }}
      >
        <Chip tint="muted">n/a</Chip>
      </Box>
    );
  }

  return (
    <Box
      component="span"
      data-testid={testId}
      title={`Run ${summary.run_id} — ${summary.scored_evals} of ${summary.total_evals} evals produced a score.`}
      sx={{
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "baseline",
        gap: 0.75,
      }}
    >
      <Box
        component="span"
        sx={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}
      >
        {(summary.score * 100).toFixed(0)}%
      </Box>
      <Box
        component="span"
        sx={{
          typography: "caption",
          color: "text.secondary",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {listCoverageLabel(summary.scored_evals, summary.total_evals)}
      </Box>
    </Box>
  );
}

function TraceStatusBadge({ status }: { status: string }) {
  if (status === "error") {
    return (
      <Box
        component="span"
        sx={{ display: "inline-flex", alignItems: "center", gap: 0.75 }}
      >
        <IconMaterialSymbolsCancel sx={{ fontSize: 14, color: "error.main" }} />
        <StatusDot status="destructive">error</StatusDot>
      </Box>
    );
  }
  if (status === "warning") {
    return (
      <Box
        component="span"
        sx={{ display: "inline-flex", alignItems: "center", gap: 0.75 }}
      >
        <IconMaterialSymbolsWarning
          sx={{ fontSize: 14, color: "warning.main" }}
        />
        <StatusDot status="warning">review</StatusDot>
      </Box>
    );
  }
  return (
    <Box
      component="span"
      sx={{ display: "inline-flex", alignItems: "center", gap: 0.75 }}
    >
      <IconMaterialSymbolsCheckCircle
        sx={{ fontSize: 14, color: "success.main" }}
      />
      <StatusDot status="success">ok</StatusDot>
    </Box>
  );
}
