/** UsageLogTab — the LLM usage audit log (build-plan S10, spec §4.3/§5.1/§5.2).
 *
 * Toolbar (search + `TimeRangePicker` + `FacetedFilter` facets +
 * `AutoRefreshControl`, default off) → stat strip (`StatCard`s from the
 * summary query) → `DataTable` in cursor mode → row click navigates to
 * `UsageCallDetailPage` at `/llm-catalog/usage/$callId`, carrying the view.
 *
 * The filters, window and search term live in the **URL**
 * (`usage-view-params.ts`), not in component state, because the tab unmounts
 * when the detail route renders — `useState` cannot survive the round trip and
 * `history.back()` would restore a URL, not a remounted component's state. Each
 * control writes its change with `replace: true` so filter churn never buries
 * the row click's own history entry under a stack of near-identical URLs.
 *
 * Pagination is the deliberate exception: the cursor stack stays component
 * state, so returning from a call detail lands on page 1 of the restored filter
 * set. A cursor is only valid for the query that produced it, so putting the
 * stack in the URL would mean carrying per-query tokens that are dead the
 * moment any filter changes.
 *
 * **R8** — the summary's 7-day window cap is a server-side 422. This tab
 * makes that 422 unreachable from the UI: `TimeRangePicker` itself still
 * exposes every stock preset up to 90 days plus an unrestricted calendar
 * (it is a shared component — out of this slice's file scope to change), so
 * `clampToSevenDays` intercepts *both* the preset menu and the custom
 * calendar path and re-points the picker's own value at the 7-day preset —
 * and, now that the window is a URL param, a hand-typed or bookmarked
 * `?range=90d` as well. That keeps the trigger label, the table window and the
 * stat strip in agreement — clamping only the outgoing query params (and
 * leaving the trigger reading "Past 30 days") would be a UI that silently lies
 * about what it's showing.
 *
 * The Tenant and Agent columns both render a **name resolved client-side from
 * an id the ledger row carries**, each falling back to the raw id, and both
 * showing an em-dash when the call has no such attribution at all. Both lookups
 * are bounded by the server's 200-row page cap, and that ceiling is stated at
 * each one rather than implied.
 *
 * The pager's count is the **summary's** `attempts`, not the row count of the
 * page: `LlmUsageListOut` has no total, and the page length rendered as
 * "50 results" on every page as if it were the whole result set. The Model
 * facet is likewise sourced from the unpaginated LLM inference catalog rather than the
 * page — the page-derived option list could not offer a model whose calls all
 * sat further down the cursor.
 *
 * Auto-refresh: `AutoRefreshControl` genuinely drives `refetchInterval` on
 * the list and summary queries (`usageListQueryOptions`/
 * `usageSummaryQueryOptions` in `api.ts`) — mirrors `dashboard/api.ts`, not
 * the Ingestion divergence where the control only selects a label and each
 * hook polls on its own hard-coded timer. It never drives the payload query
 * (R2) — that query lives on the detail page, pinned to its `call_id`.
 *
 * For a relative preset, only `from` is sent to the server and `to` is left
 * unset — the backend then anchors its own upper bound on the server's now,
 * per request, for BOTH the list and the summary. That is what keeps each
 * poll surfacing newer rows with no client-side clock-nonce bookkeeping,
 * while the table and the stat strip still describe one window. (The list
 * used to leave the bound unbounded while the summary anchored on now; the
 * two then disagreed about what they were showing.) A custom calendar range
 * sends both bounds, fixed.
 *
 * The server's cap carries an hour of tolerance for exactly this shape: a
 * client asking for "the last 7 days" sends `from = its now - 7d` with no
 * `to`, so the span the server measures is 7 days plus the request latency
 * and any clock skew. Compared exactly, the 7-day view would reject every
 * request.
 *
 * The cursor stack resets on any filter change — a cursor is only valid for
 * the query that produced it (mirrors `AgentTracesPage.tsx`).
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import IconMaterialSymbolsSearch from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsSearch.mjs";
import IconMaterialSymbolsDatabase from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsDatabase.mjs";
import type { ColumnDef } from "@tanstack/react-table";

import { PROVIDER_LABEL } from "@/back-office/llm-catalog/schema";
import type { LLMCatalogSearch } from "@/back-office/llm-catalog/tab-params";
import {
  formatUsageCost,
  formatUsageLatencyMs,
  formatUsageTokens,
} from "@/back-office/llm-catalog/usage-format";
import type { UsageViewSearch } from "@/back-office/llm-catalog/usage-view-params";
import {
  FAKE_INFERENCES,
  FAKE_USAGE_ROWS,
  usageSummaryFake,
  type FakeUsageRow,
} from "@/back-office/llm-catalog/usage-pricing-fixtures";
import { listAgentsFlat } from "@/back-office/agents/fake-data";
import { TENANTS } from "@/back-office/tenants/tenant-fixtures";
import { AutoRefreshControl } from "@/shared/components/auto-refresh-control";
import { Chip } from "@/shared/components/chip";
import { DataTable } from "@/shared/components/data-table";
import {
  FacetedFilter,
  type FacetedFilterOption,
} from "@/shared/components/faceted-filter";
import { REFRESH_INTERVALS } from "@/shared/components/refresh-intervals";
import { StatCard } from "@/shared/components/stat-card";
import {
  resolveTimeRange,
  type TimeRangeValue,
} from "@/shared/components/time-range";
import { TimeRangePicker } from "@/shared/components/time-range-picker";
import { Toolbar } from "@/shared/components/toolbar";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const PAGE_SIZE = 10;

type LlmUsageRowOut = FakeUsageRow;

interface UsageFilters {
  purpose?: string[];
  provider?: string[];
  modelId?: string[];
  tenantName?: string[];
  outcome?: string[];
  q?: string;
  agentRunId?: string;
  from?: string;
  to?: string;
}

// Closed sets mirrored from the backend (spec §4.3): `Purpose` is a
// `CHECK`-constrained 9-value enum (`packages/common/.../llm/types.py`),
// `outcome` is `{success, failure}` (`llm_usage.py`'s `_OUTCOME_VALUES`).
// Neither has a discovery endpoint, so both are small fixed lists here
// rather than a network round-trip for nine strings.
const PURPOSE_OPTIONS: FacetedFilterOption[] = [
  { value: "scoring_eval", label: "Scoring eval" },
  { value: "profile_fit", label: "Profile fit" },
  { value: "agent_card", label: "Agent card" },
  { value: "guide_generation", label: "Guide generation" },
  { value: "eval_preview", label: "Eval preview" },
  { value: "connectivity_probe", label: "Connectivity probe" },
  { value: "catalog_verification", label: "Catalog verification" },
  { value: "chat_assistant", label: "Chat assistant" },
  { value: "improvement_advisor", label: "Improvement advisor" },
];

const OUTCOME_OPTIONS: FacetedFilterOption[] = [
  { value: "success", label: "Success" },
  { value: "failure", label: "Failure" },
];

const PROVIDER_OPTIONS: FacetedFilterOption[] = Object.entries(
  PROVIDER_LABEL,
).map(([value, label]) => ({ value, label }));

/** Clamp a `TimeRangeValue` to at most 7 days, re-pointing at the `7d` preset
 *  when either a wider preset or a wider custom calendar range is chosen —
 *  covers both `TimeRangePicker` paths (R8), and now also a hand-typed or
 *  stale `?range=`/`?from=&?to=` in the URL.
 *
 *  Returns the input by identity when it already fits, so callers can test
 *  "did the clamp fire?" with `!==`. */
function clampToSevenDays(value: TimeRangeValue): TimeRangeValue {
  const { from, to } = resolveTimeRange(value);
  if (to.getTime() - from.getTime() <= SEVEN_DAYS_MS) return value;
  return { kind: "preset", preset: "7d" };
}

const DEFAULT_RANGE: TimeRangeValue = { kind: "preset", preset: "1d" };

// No id in `TIME_RANGE_PRESETS` matches this, so `TimeRangePicker` highlights
// no menu item as active — paired with `NO_LOWER_BOUND_TRIGGER` below so the
// trigger itself says so too, rather than falling back to a preset's badge.
const NO_LOWER_BOUND_RANGE_VALUE: TimeRangeValue = { kind: "preset", preset: "unbounded" };

const NO_LOWER_BOUND_TRIGGER = { badge: "∞", label: "No window cap" };

/** The URL's window as a `TimeRangeValue`. A preset id wins over a custom pair
 *  (the normalizer already guarantees they never both survive). */
function rangeFromSearch(search: UsageViewSearch): TimeRangeValue {
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

/** The inverse: the three window params a `TimeRangeValue` implies. The unused
 *  side is explicitly `undefined` so writing a preset clears a stale custom
 *  pair out of the URL rather than leaving both behind. */
function rangeToSearch(
  value: TimeRangeValue,
): Pick<UsageViewSearch, "range" | "from" | "to"> {
  if (value.kind === "preset") {
    return { range: value.preset, from: undefined, to: undefined };
  }
  return {
    range: undefined,
    from: value.from.toISOString(),
    to: value.to.toISOString(),
  };
}

const NO_VALUES: string[] = [];

export function UsageLogTab() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as LLMCatalogSearch;

  /** Write a view change to the URL. `replace` so that dragging a facet open
   *  and picking four values leaves ONE history entry, not four — otherwise the
   *  browser Back button walks back through filter states instead of leaving
   *  the page, and the row click's entry ends up buried. */
  const setView = useCallback(
    (patch: Partial<UsageViewSearch>) =>
      void navigate({
        to: "/llm-catalog",
        search: ((prev: LLMCatalogSearch) => ({ ...prev, tab: "usage" as const, ...patch })) as never,
        replace: true,
      }),
    [navigate],
  );

  const purposeValues = search.purpose ?? NO_VALUES;
  const providerValues = search.provider ?? NO_VALUES;
  const modelValues = search.model ?? NO_VALUES;
  const tenantValues = search.tenant ?? NO_VALUES;
  const outcomeValues = search.outcome ?? NO_VALUES;

  // R8, applied on the way OUT of the URL rather than inside the normalizer:
  // `clampToSevenDays` reads the wall clock, and a clock read inside
  // `validateSearch` (which TanStack re-runs on every search change) can return
  // a different object each run. Clamping here keeps the picker trigger, the
  // table window and the stat strip in agreement for a hand-typed `?range=90d`
  // exactly as it already did for the picker's own two paths.
  //
  // MEMOIZED, and that is load-bearing rather than an optimization. `range`
  // feeds the `filters` memo below, which calls `resolveTimeRange` — i.e. reads
  // `new Date()`. An unmemoized `range` is a fresh object every render, so
  // `filters` would recompute every render with a slightly later `from`, which
  // changes the query key, which refetches, which re-renders: an infinite loop
  // (React bails out with "Maximum update depth exceeded"). This used to be
  // held by `range` living in `useState`; deriving it from the URL is what put
  // the guarantee at risk. Keyed on primitives only.
  // The three window params are pulled out first so the dependency list is the
  // honest one. Depending on `search` itself (which is what `exhaustive-deps`
  // would ask for) defeats the memo and brings the loop straight back.
  const { range: rangeParam, from: fromParam, to: toParam } = search;
  // `agentRunId` narrows on its own (`_effective_from` in `llm_usage.py`):
  // sending a `from` alongside it re-applies the default window on top of the
  // run filter and can hide every call from a run older than that window —
  // defeating the point of a drill-through link from a run-detail page that
  // carries no time bound of its own. So while the run filter is active and
  // the operator has not chosen a window of their own, the window params stay
  // out of both the query (see `filters` below) AND the URL — writing the
  // default `range=1d` back into the URL here would silently reintroduce the
  // bound on the very next render. An operator-chosen range still wins.
  const agentRunNoLowerBound =
    Boolean(search.agentRunId) &&
    rangeParam === undefined &&
    fromParam === undefined &&
    toParam === undefined;
  const range = useMemo(
    () =>
      clampToSevenDays(
        rangeFromSearch({ range: rangeParam, from: fromParam, to: toParam }),
      ),
    [rangeParam, fromParam, toParam],
  );
  const {
    range: clampedRange,
    from: clampedFrom,
    to: clampedTo,
  } = rangeToSearch(range);
  // ...and then close the remaining gap: the view now says 7 days while the URL
  // still says 90. Rewrite it once so a copied link reproduces what was shown.
  const windowDisagrees =
    !agentRunNoLowerBound &&
    (clampedRange !== search.range ||
      clampedFrom !== search.from ||
      clampedTo !== search.to);
  useEffect(() => {
    if (!windowDisagrees) return;
    setView({ range: clampedRange, from: clampedFrom, to: clampedTo });
  }, [windowDisagrees, clampedRange, clampedFrom, clampedTo, setView]);

  const [intervalId, setIntervalId] = useState("off");
  const [cursorStack, setCursorStack] = useState<(string | null)[]>([null]);
  const cursor = cursorStack[cursorStack.length - 1];

  // The search box keeps its own state so typing stays responsive; only the
  // debounced value reaches the URL (and therefore the query). Seeded from the
  // URL so a restored or shared view shows its own term in the box.
  //
  // No "still mounted" guard is needed on the write below: this tab unmounts
  // when the detail route renders, `useDebouncedValue` clears its timer in its
  // effect cleanup, and an unmounted component's effects never run — so a term
  // typed moments before a row click cannot navigate back to the list.
  const [qInput, setQInput] = useState(search.q ?? "");
  const debouncedQ = useDebouncedValue(qInput, 350);
  useEffect(() => {
    if (debouncedQ === (search.q ?? "")) return;
    setView({ q: debouncedQ || undefined });
  }, [debouncedQ, search.q, setView]);

  // No backend: tenants/agents are read straight from their fixture modules
  // rather than through a query — both are already in-memory and synchronous.
  const tenantOptions = useMemo<FacetedFilterOption[]>(
    () =>
      TENANTS.map((t) => ({
        value: t.tenant_id,
        label: t.name,
        searchText: `${t.name} ${t.tenant_id}`,
      })),
    [],
  );
  const tenantNameById = useMemo(
    () => new Map(TENANTS.map((t) => [t.tenant_id, t.name])),
    [],
  );

  const agentsFlat = useMemo(
    () => listAgentsFlat({ limit: 200, sort: "last_active", dir: "desc" }),
    [],
  );
  const agentNameById = useMemo(
    () => new Map(agentsFlat.items.map((i) => [i.agent.agent_id, i.agent.name])),
    [agentsFlat],
  );

  // A cursor is only valid for the query that produced it, so any change to the
  // filter set returns to page 1. Keyed on a serialized snapshot rather than on
  // the search values' identities: re-parsing the URL yields equal-but-NEW
  // arrays, and keying on identity would read every render as a filter change
  // and throw the user back to page 1 the moment they clicked Next.
  const filterKey = JSON.stringify([
    search.q ?? "",
    clampedRange ?? "",
    clampedFrom ?? "",
    clampedTo ?? "",
    purposeValues,
    providerValues,
    modelValues,
    tenantValues,
    outcomeValues,
    search.agentRunId ?? "",
  ]);
  useEffect(() => {
    setCursorStack([null]);
  }, [filterKey]);

  const filters: UsageFilters = useMemo(() => {
    const base: UsageFilters = {
      purpose: purposeValues.length ? purposeValues : undefined,
      provider: providerValues.length ? providerValues : undefined,
      modelId: modelValues.length ? modelValues : undefined,
      tenantName: tenantValues.length ? tenantValues : undefined,
      outcome: outcomeValues.length ? outcomeValues : undefined,
      q: search.q,
      agentRunId: search.agentRunId,
    };
    // See `agentRunNoLowerBound` above: an agent-run filter with no
    // operator-chosen window sends NO `from`/`to`, so the backend's
    // `agentRunId` exception (`_effective_from`) does the narrowing instead
    // of the default window silently hiding an older run's calls.
    if (agentRunNoLowerBound) return base;
    if (range.kind === "custom") {
      return { ...base, from: range.from.toISOString(), to: range.to.toISOString() };
    }
    const { from } = resolveTimeRange(range);
    return { ...base, from: from.toISOString() };
  }, [
    search.q,
    search.agentRunId,
    agentRunNoLowerBound,
    range,
    purposeValues,
    providerValues,
    modelValues,
    tenantValues,
    outcomeValues,
  ]);

  // No backend: `activeMs`/`intervalId` still drive the toolbar's own
  // AutoRefreshControl UI, but there's no live poll to schedule against a
  // static fixture — filtering/pagination below is synchronous.
  const activeMs = REFRESH_INTERVALS.find((i) => i.id === intervalId)?.ms ?? null;
  void activeMs;

  const filteredRows = useMemo(() => {
    return FAKE_USAGE_ROWS.filter((r) => {
      if (filters.purpose && !filters.purpose.includes(r.purpose)) return false;
      if (filters.provider && !filters.provider.includes(r.provider)) return false;
      if (filters.modelId && !filters.modelId.includes(r.modelId)) return false;
      if (filters.tenantName && (!r.tenantName || !filters.tenantName.includes(r.tenantName))) return false;
      if (filters.outcome) {
        const outcome = r.failureCode ? "failure" : "success";
        if (!filters.outcome.includes(outcome)) return false;
      }
      if (filters.agentRunId && r.runId !== filters.agentRunId) return false;
      if (filters.from && new Date(r.createdAt).getTime() < new Date(filters.from).getTime()) return false;
      if (filters.to && new Date(r.createdAt).getTime() > new Date(filters.to).getTime()) return false;
      if (filters.q) {
        const needle = filters.q.toLowerCase();
        const haystack = `${r.callId} ${r.modelId} ${r.purpose}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
  }, [filters]);

  const pageIndex = cursorStack.length - 1;
  void cursor;
  const items = useMemo(
    () => filteredRows.slice(pageIndex * PAGE_SIZE, (pageIndex + 1) * PAGE_SIZE),
    [filteredRows, pageIndex],
  );
  const nextCursor = (pageIndex + 1) * PAGE_SIZE < filteredRows.length ? String(pageIndex + 1) : null;
  const summary = useMemo(() => usageSummaryFake(filteredRows), [filteredRows]);

  const modelOptions = useMemo<FacetedFilterOption[]>(() => {
    const seen = new Map<string, FacetedFilterOption>();
    // The LLM inference catalog first, because it is COMPLETE:
    // `/admin/llm-inferences` is unpaginated, so every model the platform is
    // configured to call is selectable regardless of which ledger page happens
    // to be on screen. Built from the page alone, this facet could not reach a
    // model whose only calls sat on page 2 — selecting it was impossible,
    // which is the same defect the agents-list facets had when they filtered
    // client-side.
    for (const inference of FAKE_INFERENCES) {
      if (!seen.has(inference.modelId)) {
        seen.set(inference.modelId, {
          value: inference.modelId,
          label: inference.modelId,
          searchText: `${inference.modelId} ${inference.provider}`,
        });
      }
    }
    // The page's own models are unioned in ON TOP of the catalog, not replaced
    // by it: a ledger row can name a model no inference serves any more (the
    // inference was edited to a different model, or hard-purged), and the
    // catalog cannot know about it. This is the residual bound the scope
    // caption states.
    for (const row of items) {
      if (!seen.has(row.modelId)) {
        seen.set(row.modelId, { value: row.modelId, label: row.modelId });
      }
    }
    // Union with the current selection — otherwise filtering by a model
    // removes every other model from the option list on the next render,
    // stranding the user with no way to add a second model to the filter.
    for (const v of modelValues) {
      if (!seen.has(v)) seen.set(v, { value: v, label: v });
    }
    return Array.from(seen.values());
  }, [items, modelValues]);

  // The view rides along as the detail route's own search params so its
  // breadcrumb can hand this exact filtered view back. A push (not `replace`),
  // so the browser Back button also returns here.
  const openDetail = (row: LlmUsageRowOut) =>
    void navigate({
      to: "/llm-catalog/usage/$callId",
      params: { callId: row.callId },
      search: {
        q: search.q,
        range: clampedRange,
        from: clampedFrom,
        to: clampedTo,
        purpose: search.purpose,
        provider: search.provider,
        model: search.model,
        tenant: search.tenant,
        outcome: search.outcome,
        agentRunId: search.agentRunId,
      } satisfies UsageViewSearch,
    });

  const columns = useMemo<ColumnDef<LlmUsageRowOut, unknown>[]>(
    () => [
      {
        id: "createdAt",
        header: "Time",
        accessorFn: (r) => r.createdAt,
        meta: { headerSx: { width: "12%" } },
        cell: ({ row }) => new Date(row.original.createdAt).toLocaleString(),
      },
      {
        id: "purpose",
        header: "Purpose",
        accessorFn: (r) => r.purpose,
        meta: { headerSx: { width: "12%" } },
      },
      {
        id: "tenant",
        header: "Tenant",
        accessorFn: (r) => r.tenantName,
        meta: { headerSx: { width: "12%" } },
        cell: ({ row }) => {
          const tenantId = row.original.tenantName;
          if (tenantId === null || tenantId === undefined) {
            return (
              <Box component="span" sx={{ color: "text.secondary" }}>
                —
              </Box>
            );
          }
          // Falls back to the raw id when the tenant is not in the picker list
          // (purged, or beyond the 200 fetched) — an id is worse than a name
          // but far better than an empty cell for a row that has a tenant.
          return tenantNameById.get(tenantId) ?? tenantId;
        },
      },
      {
        id: "agent",
        header: "Agent",
        accessorFn: (r) => r.agentId,
        meta: { headerSx: { width: "14%" } },
        cell: ({ row }) => {
          const agentId = row.original.agentId;
          // Em-dash for a call no agent initiated (guide generation, the
          // connectivity probe, catalog verification) — the app-wide convention
          // for an absent value, and the same glyph the Tenant column beside it
          // uses for a call with no tenant.
          if (agentId == null) {
            return (
              <Box component="span" sx={{ color: "text.secondary" }}>
                —
              </Box>
            );
          }
          return (
            <Box
              component="span"
              sx={{
                display: "block",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {agentNameById.get(agentId) ?? agentId}
            </Box>
          );
        },
      },
      {
        id: "model",
        header: "Provider / Model",
        accessorFn: (r) => r.modelId,
        meta: { headerSx: { width: "17%" } },
        cell: ({ row }) => (
          <Box sx={{ display: "flex", minWidth: 0, flexDirection: "column" }}>
            <Box
              component="span"
              sx={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontFamily: "monospace",
                typography: "caption",
              }}
            >
              {row.original.provider} · {row.original.modelId}
            </Box>
            {row.original.modelDiffers ? (
              <Box component="span" sx={{ typography: "caption", color: "warning.main" }}>
                resolved: {row.original.modelIdResolved}
              </Box>
            ) : null}
            {/* WHICH configured endpoint served this call. Provider and model
             *  cannot say: two catalog rows may name the same model, which is
             *  what routing a task type to a second entry of the same model
             *  produces. Rows written before the ledger stored the id, and
             *  probes against an unsaved form, name nothing — and say so
             *  rather than borrowing the neighbouring row's identity. */}
            <Box
              component="span"
              data-testid={`usage-inference-${row.original.callId}`}
              sx={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                typography: "caption",
                color: "text.secondary",
              }}
            >
              {row.original.inferenceName ?? "no inference recorded"}
            </Box>
          </Box>
        ),
      },
      {
        id: "tokens",
        header: "Tokens (in/out)",
        accessorFn: (r) => r.inputTokens,
        meta: { headerSx: { width: "11%" } },
        cell: ({ row }) =>
          `${formatUsageTokens(row.original.inputTokens)} / ${formatUsageTokens(row.original.outputTokens)}`,
      },
      {
        id: "cost",
        header: "Cost",
        accessorFn: (r) => r.costUsd,
        meta: { headerSx: { width: "9%" } },
        // Hooked per row: "unpriced" and "$0.00" are one glance apart, so the
        // browser lane must be able to assert which one a call shows without
        // selecting on the cell's text.
        cell: ({ row }) => (
          <Box component="span" data-testid={`usage-cost-${row.original.callId}`}>
            {formatUsageCost(row.original.costUsd)}
          </Box>
        ),
      },
      {
        id: "outcome",
        header: "Outcome",
        accessorFn: (r) => r.failureCode,
        meta: { headerSx: { width: "8%" } },
        cell: ({ row }) =>
          row.original.failureCode ? (
            <Chip tint="destructive">{row.original.failureCode}</Chip>
          ) : (
            <Chip tint="success">success</Chip>
          ),
      },
      {
        id: "latency",
        header: "Latency",
        accessorFn: (r) => r.latencyMs,
        meta: { headerSx: { width: "6%" } },
        cell: ({ row }) => formatUsageLatencyMs(row.original.latencyMs),
      },
    ],
    [tenantNameById, agentNameById],
  );


  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Toolbar
        search={
          <TextField
            size="small"
            fullWidth
            placeholder="Search calls…"
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            slotProps={{
              htmlInput: {
                "aria-label": "Search usage log",
                "data-testid": "search-usage",
              },
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <IconMaterialSymbolsSearch sx={{ fontSize: 16, color: "text.secondary" }} />
                  </InputAdornment>
                ),
              },
            }}
          />
        }
        filters={
          <>
            <TimeRangePicker
              value={agentRunNoLowerBound ? NO_LOWER_BOUND_RANGE_VALUE : range}
              testId="filter-usage-range"
              onChange={(v) => setView(rangeToSearch(clampToSevenDays(v)))}
              triggerOverride={agentRunNoLowerBound ? NO_LOWER_BOUND_TRIGGER : undefined}
            />
            <FacetedFilter
              title="Purpose"
              testId="filter-purpose"
              options={PURPOSE_OPTIONS}
              values={purposeValues}
              onChange={(v) => setView({ purpose: v.length ? v : undefined })}
            />
            <FacetedFilter
              title="Provider"
              testId="filter-provider"
              options={PROVIDER_OPTIONS}
              values={providerValues}
              onChange={(v) => setView({ provider: v.length ? v : undefined })}
            />
            <FacetedFilter
              title="Model"
              testId="filter-model"
              options={modelOptions}
              values={modelValues}
              onChange={(v) => setView({ model: v.length ? v : undefined })}
            />
            <FacetedFilter
              title="Tenant"
              testId="filter-tenant"
              options={tenantOptions}
              values={tenantValues}
              onChange={(v) => setView({ tenant: v.length ? v : undefined })}
              searchPlaceholder="Search tenants…"
            />
            <FacetedFilter
              title="Outcome"
              testId="filter-outcome"
              options={OUTCOME_OPTIONS}
              values={outcomeValues}
              onChange={(v) => setView({ outcome: v.length ? v : undefined })}
            />
            <AutoRefreshControl
              intervalId={intervalId}
              onIntervalChange={setIntervalId}
              onRefresh={() => {
                // No backend to re-poll — the fixture is static, so there's
                // nothing to refetch.
              }}
              isRefreshing={false}
            />
          </>
        }
      />

      <Typography
        variant="caption"
        sx={{ color: "text.secondary" }}
        data-testid="usage-scope-caption"
      >
        {agentRunNoLowerBound
          ? "No window cap applies while filtered to this agent run — every call it made is shown, however old. "
          : "Widest window: 7 days — the summary stat strip is capped server-side beyond that. "}
        Model options list every configured inference plus the models on this page, so a
        model served only by a purged inference is selectable only while a row here names it.
      </Typography>

      {/* A failed summary previously rendered as six em-dashes — visually
          identical to "no calls in this window", so a persistent server-side
          rejection looked like an empty result set forever. The tiles keep
          their em-dash for genuine absence; an actual error now says so. */}
      <Grid container spacing={2}>
        {(
          [
            { label: "Spend", value: summary ? formatUsageCost(summary.spendUsd) : "—", testId: "usage-stat-spend" },
            { label: "Attempts", value: summary ? summary.attempts.toLocaleString("en-US") : "—", testId: "usage-stat-attempts" },
            {
              label: "Failure rate",
              value: summary ? `${(summary.failureRate * 100).toFixed(1)}%` : "—",
              testId: "usage-stat-failure-rate",
            },
            {
              label: "Latency (p50)",
              value: summary ? formatUsageLatencyMs(summary.latencyMsP50) : "—",
              testId: "usage-stat-latency-p50",
            },
            {
              label: "Queue wait (p50)",
              value: summary ? formatUsageLatencyMs(summary.queueWaitMsP50) : "—",
              hint: summary ? `n=${summary.queueWaitSampleCount}` : undefined,
              testId: "usage-stat-queue-wait-p50",
            },
            {
              label: "Tokens (in/out)",
              value: summary
                ? `${formatUsageTokens(summary.inputTokens)} / ${formatUsageTokens(summary.outputTokens)}`
                : "—",
              testId: "usage-stat-tokens",
            },
          ] as const
        ).map((t) => (
          <Grid key={t.label} size={{ xs: 12, sm: 6, md: 4, lg: 2 }} data-testid={t.testId}>
            <StatCard label={t.label} value={t.value} hint={"hint" in t ? t.hint : undefined} sx={{ height: "100%" }} />
          </Grid>
        ))}
      </Grid>

      {search.agentRunId ? (
        <Box
          data-testid="usage-agent-run-filter"
          sx={{ display: "flex", alignItems: "baseline", gap: 1 }}
        >
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Filtered to agent run{" "}
            <Box
              component="span"
              sx={{ typography: "body2", fontFamily: "monospace" }}
            >
              {search.agentRunId}
            </Box>
            {agentRunNoLowerBound
              ? " — no time bound applied; every call from this run is shown."
              : null}
          </Typography>
          <Button
            variant="text"
            size="small"
            data-testid="usage-agent-run-filter-clear"
            onClick={() => setView({ agentRunId: undefined })}
          >
            Clear
          </Button>
        </Box>
      ) : null}

      <DataTable
        columns={columns}
        data={items}
        isLoading={false}
        error={null}
        getRowId={(r) => r.callId}
        getRowTestId={(r) => `usage-row-${r.callId}`}
        onRowClick={openDetail}
        tableSx={{ tableLayout: "fixed" }}
        enableSorting={false}
        pagination={{
          mode: "cursor",
          hasNext: nextCursor != null,
          hasPrev: cursorStack.length > 1,
          // `LlmUsageListOut` carries no total, and `items.length` rendered as
          // "50 results" on every page — the page size dressed up as a grand
          // total. The summary's `attempts` is `COUNT(*)` over the SAME
          // predicate and window as this list (both build `UsageFilters` from
          // the same `filters` object and the server runs both through
          // `_usage_row_conditions`), so it IS the filtered total. Falls back
          // to the page length only when the summary is absent — while it
          // loads, and on the error path the Alert above already names.
          total: summary?.attempts ?? items.length,
          onNext: () => {
            if (nextCursor != null) setCursorStack((s) => [...s, nextCursor]);
          },
          onPrev: () => setCursorStack((s) => (s.length > 1 ? s.slice(0, -1) : s)),
        }}
        emptyState={{
          icon: IconMaterialSymbolsDatabase,
          title: "No usage recorded",
          description:
            tenantValues.length > 0
              ? "No rows match these filters. Rows with no tenant (probe, guide-generation calls) are always excluded while a tenant filter is active."
              : "No calls recorded for this window and filters yet.",
        }}
      />
    </Box>
  );
}
