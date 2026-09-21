/** Cross-tenant agents search.
 *
 * PageHeader + Toolbar + DataTable with q-search, faceted filters
 * (client-side over the current page), and an inline "Connect an agent"
 * dialog. Nothing to fill in and submit — an agent is expected to appear on
 * its own the first time its traces are forwarded, so the dialog is purely
 * instructions (the ingest key, the exporter env vars to paste, what happens
 * once traces start arriving) rather than a form.
 *
 * List | Grouped view toggle (agents-grouped-view spec §3.1 Feature 3): the
 * view mode + group-by axis are URL search state (`view-params.ts`); List
 * view is the original flat table, unchanged. Grouped view uses a narrower,
 * scalar filter contract (`q` + `Show deleted` + single-select Tenant/Kind)
 * to avoid the multi-select-facet → scalar-BE-param mismatch — see
 * `AgentGroupSection.tsx`.
 */

import { useMemo, useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { toast } from "@/shared/lib/toast";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import IconMaterialSymbolsSmartToy from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsSmartToy.mjs";
import IconMaterialSymbolsApartment from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsApartment.mjs";
import IconMaterialSymbolsAdd from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsAdd.mjs";
import IconMaterialSymbolsClose from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsClose.mjs";
import IconMaterialSymbolsSearch from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsSearch.mjs";
import IconMaterialSymbolsSell from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsSell.mjs";
import IconMaterialSymbolsHub from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsHub.mjs";
import type { OnChangeFn, SortingState } from "@tanstack/react-table";

import { flatAgentColumns } from "@/back-office/agents/agent-columns";
import { AgentGroupsView } from "@/back-office/agents/AgentGroupSection";
import {
  FAKE_TENANTS,
  listAgentGroups,
  listAgentsFlat,
  type AgentKind,
} from "@/back-office/agents/fake-data";
import type { AgentsViewSearch, AgentView } from "@/back-office/agents/view-params";
import { AutoRefreshControl } from "@/shared/components/auto-refresh-control";
import { Chip } from "@/shared/components/chip";
import { CodeBlock } from "@/shared/components/code-block";
import { Combobox, type ComboboxOption } from "@/shared/components/combobox";
import { DataTable } from "@/shared/components/data-table";
import { FacetedFilter } from "@/shared/components/faceted-filter";
import { OnboardingCallout } from "@/shared/components/onboarding-callout";
import { PageBand } from "@/shared/components/page-band";
import { pageContentPaddingSx } from "@/shared/components/page-content";
import { PageHeader } from "@/shared/components/page-header";
import { ScrollRegion } from "@/shared/components/scroll-region";
import { Toolbar } from "@/shared/components/toolbar";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
import { useDemoMode } from "@/shared/demo-mode/demo-mode-context";

// OTLP/HTTP traces endpoint external tenants export to (see
// agent-score-skill/skills/agent-score/references/env-vars.md for the
// matching OTEL_EXPORTER_OTLP_TRACES_ENDPOINT setup).
const TRACE_INGEST_URL = "https://agent-score-ingest.product.tricentis.com/internal/otel/v1/traces";

// The _TRACES_-suffixed vars take the full ingest path already - the
// unsuffixed OTEL_EXPORTER_OTLP_ENDPOINT/HEADERS form is a base an exporter
// appends /v1/traces onto itself, which would double it up here.
const EXPORTER_ENV_VARS = `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=${TRACE_INGEST_URL}
OTEL_EXPORTER_OTLP_TRACES_HEADERS=Authorization=Bearer <tk_your_key>`;

// Masked display only - no real key material lives in this demo.
const FAKE_TENANT_KEY_DISPLAY = "default: tk_...lcPo";

const PAGE_SIZE = 25;

const GROUP_BY_OPTIONS: ComboboxOption[] = [
  { value: "tenant", label: "Tenant" },
  { value: "source", label: "Source service" },
  { value: "kind", label: "Kind" },
];

const KIND_OPTIONS: ComboboxOption[] = [
  { value: "internal", label: "internal" },
  { value: "external", label: "external" },
];

// No auth backend in this clone - the real gate (superadmin-only access,
// via `useAuth`/`canAccess`) is reintroduced when auth gets its own pass.
export function AgentsSearchPage() {
  return <AgentsSearchShell />;
}

function AgentsSearchShell() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 350);
  const [includeDeleted, setIncludeDeleted] = useState(false);
  // List-view-only: multi-select client-side facets over the current page.
  const [tenantFilter, setTenantFilter] = useState<string[]>([]);
  // Typed to the wire enum, not `string[]`: `kind` is a server param now, so a
  // value the API cannot express has to fail here rather than at runtime. The
  // facet's own options are the only two members.
  const [kindFilter, setKindFilter] = useState<AgentKind[]>([]);
  const [sourceFilter, setSourceFilter] = useState<string[]>([]);
  // Grouped-view-only: single-select scalar BE filters (spec §3.1 Feature 3 —
  // the multi→scalar hazard means these can't reuse the List facets above).
  const [groupedTenantId, setGroupedTenantId] = useState<string | undefined>();
  const [groupedKind, setGroupedKind] = useState<
    "internal" | "external" | undefined
  >();
  const [page, setPage] = useState(0);
  // Server-side sort. Default: most-recently-active first. A sort click resets
  // to page 0 so the user sees the top of the newly-ordered result.
  const [sorting, setSorting] = useState<SortingState>([
    { id: "last_active", desc: true },
  ]);
  const [createOpen, setCreateOpen] = useState(false);
  const navigate = useNavigate();
  const { blank } = useDemoMode();

  // Auto-refresh (spec §3.1 Feature 2 / §4.6): local useState only, no
  // URL-sync. Default 30s. No cache to invalidate against fixed fake data -
  // "Refresh" is a no-op toast instead.
  const [intervalId, setIntervalId] = useState("30s");
  const isRefreshing = false;
  const handleRefresh = () => toast.info("Nothing new - this demo's agent list is fixed.");

  // validateSearch guarantees a valid { view, by }; strict:false is loosely
  // typed here (this page IS the /agents route's component, matching the
  // IngestionPage / InternalTab convention elsewhere in back-office).
  const searchParams = useSearch({ strict: false }) as Partial<AgentsViewSearch>;
  const view: AgentView = searchParams.view ?? "list";
  const by: "tenant" | "source" | "kind" = searchParams.by ?? "tenant";
  const updateViewParams = (patch: Partial<AgentsViewSearch>) =>
    void navigate({
      to: "/agents",
      search: (prev: AgentsViewSearch) => ({ ...prev, ...patch }),
    } as never);

  const handleSortingChange: OnChangeFn<SortingState> = (updater) => {
    setPage(0);
    setSorting(updater);
  };
  // A facet is a server-side request input now, so it has to rewind the page the
  // way the search box and Show-deleted already do. Narrowing while parked on
  // page 3 of the unfiltered list would otherwise request an offset past the end
  // of the filtered one and render an empty table over a non-empty result.
  const facetSetter =
    (set: (values: string[]) => void) => (values: string[]) => {
      setPage(0);
      set(values);
    };
  const sort = sorting[0]?.id as "last_active" | "name" | "score" | undefined;
  const dir = sorting[0] ? (sorting[0].desc ? "desc" : "asc") : undefined;

  // Tenants list — used by the Tenant FacetedFilter (List), the Tenant
  // Combobox (Grouped), and the tenant Combobox inside the New agent dialog.
  const tenantOptions = useMemo(
    () =>
      FAKE_TENANTS.map((t) => ({
        value: t.tenant_id,
        label: t.name,
        searchText: t.name,
      })),
    [],
  );

  // Every facet is part of the REQUEST, and therefore part of the key.
  const filterParams = useMemo(
    () => ({
      includeDeleted,
      q: debouncedSearch || undefined,
      tenantId: tenantFilter,
      kind: kindFilter,
      source: sourceFilter,
      onlySample: blank,
    }),
    [includeDeleted, debouncedSearch, tenantFilter, kindFilter, sourceFilter, blank],
  );

  const { items, total } = useMemo(
    () =>
      view === "list"
        ? listAgentsFlat({
            limit: PAGE_SIZE,
            offset: page * PAGE_SIZE,
            ...filterParams,
            sort,
            dir,
          })
        : { items: [], total: 0 },
    [view, page, filterParams, sort, dir],
  );
  // The Source facet's options come from the by=source GROUP rollup, not from
  // the rows on screen — a source that exists only further down the list
  // still has to show up as a filter option.
  const sourceOptions = useMemo(
    () =>
      (view === "list" ? listAgentGroups({ by: "source", includeDeleted, onlySample: blank }).groups : [])
        .map((g) => ({ value: g.key, label: g.label }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [view, includeDeleted, blank],
  );

  const columns = useMemo(() => flatAgentColumns(), []);

  return (
    <Box sx={{ display: "flex", minHeight: 0, flex: 1, flexDirection: "column" }}>
      <PageBand sx={{ pt: 4, pb: 2.5 }}>
        <PageHeader
          title="My Agents"
          description="All of your agents, in one place."
          actions={
            <Button
              variant="contained"
              startIcon={<IconMaterialSymbolsAdd sx={{ fontSize: 16 }} />}
              onClick={() => setCreateOpen(true)}
              data-testid="new-agent-button"
            >
              Connect agent
            </Button>
          }
        />
      </PageBand>

      {blank ? (
        <PageBand>
          <OnboardingCallout
            title="You're looking at a sample agent"
            testId="onboarding-callout-agents"
            action={
              <Button
                size="small"
                variant="outlined"
                onClick={() => setCreateOpen(true)}
                data-testid="onboarding-new-agent"
              >
                Connect agent
              </Button>
            }
          >
            It's fully scored so you can explore before connecting your own.
          </OnboardingCallout>
        </PageBand>
      ) : null}

      <PageBand>
        <Toolbar
          search={
            <TextField
              size="small"
              fullWidth
              placeholder="Filter agents by name…"
              value={search}
              onChange={(e) => {
                setPage(0);
                setSearch(e.target.value);
              }}
              slotProps={{
                htmlInput: {
                  "aria-label": "Search agents",
                  "data-testid": "search-agents",
                },
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <IconMaterialSymbolsSearch
                        sx={{ fontSize: 16, color: "text.secondary" }}
                      />
                    </InputAdornment>
                  ),
                },
              }}
            />
          }
          filters={
            view === "list" ? (
              <>
                <FacetedFilter
                  title="Tenant"
                  testId="filter-tenant"
                  icon={IconMaterialSymbolsApartment}
                  values={tenantFilter}
                  onChange={facetSetter(setTenantFilter)}
                  options={tenantOptions}
                  searchPlaceholder="Search tenants…"
                />
                <FacetedFilter
                  title="Kind"
                  testId="filter-kind"
                  icon={IconMaterialSymbolsSell}
                  values={kindFilter}
                  onChange={(values) => {
                    setPage(0);
                    setKindFilter(values as AgentKind[]);
                  }}
                  options={[
                    { value: "external", label: "external" },
                    { value: "internal", label: "internal" },
                  ]}
                />
                <FacetedFilter
                  title="Source"
                  testId="filter-source"
                  icon={IconMaterialSymbolsHub}
                  values={sourceFilter}
                  onChange={facetSetter(setSourceFilter)}
                  options={sourceOptions}
                  searchPlaceholder="Search sources…"
                />
                <ShowDeletedButton
                  active={includeDeleted}
                  onClick={() => {
                    setPage(0);
                    setIncludeDeleted((v) => !v);
                  }}
                />
              </>
            ) : (
              <>
                {by !== "tenant" ? (
                  <Box sx={{ width: 200 }}>
                    <Combobox
                      testId="filter-grouped-tenant"
                      options={tenantOptions}
                      value={groupedTenantId}
                      onChange={setGroupedTenantId}
                      placeholder="Tenant"
                      searchPlaceholder="Search tenants…"
                    />
                  </Box>
                ) : null}
                {by !== "kind" ? (
                  <Box sx={{ width: 160 }}>
                    <Combobox
                      testId="filter-grouped-kind"
                      options={KIND_OPTIONS}
                      value={groupedKind}
                      onChange={(v) =>
                        setGroupedKind(v as "internal" | "external" | undefined)
                      }
                      placeholder="Kind"
                    />
                  </Box>
                ) : null}
                <ShowDeletedButton
                  active={includeDeleted}
                  onClick={() => setIncludeDeleted((v) => !v)}
                />
              </>
            )
          }
          actions={
            <>
              <Box data-testid="agents-auto-refresh">
                <AutoRefreshControl
                  intervalId={intervalId}
                  onIntervalChange={setIntervalId}
                  onRefresh={handleRefresh}
                  isRefreshing={isRefreshing}
                />
              </Box>
              {view === "grouped" ? (
                <Box sx={{ width: 180 }}>
                  <Combobox
                    testId="agents-group-by"
                    options={GROUP_BY_OPTIONS}
                    value={by}
                    onChange={(v) =>
                      v && updateViewParams({ by: v as "tenant" | "source" | "kind" })
                    }
                    clearable={false}
                    placeholder="Group by…"
                  />
                </Box>
              ) : null}
              <ToggleButtonGroup
                exclusive
                size="small"
                value={view}
                onChange={(_e, v) => {
                  if (v) updateViewParams({ view: v as AgentView });
                }}
                aria-label="View mode"
                data-testid="agents-view-toggle"
              >
                <ToggleButton value="list" data-testid="agents-view-list">
                  List
                </ToggleButton>
                <ToggleButton value="grouped" data-testid="agents-view-grouped">
                  Grouped
                </ToggleButton>
              </ToggleButtonGroup>
            </>
          }
          right={
            view === "list" && total > 0 ? <span>{total} agents</span> : undefined
          }
        />
      </PageBand>

      <ScrollRegion>
        <Box sx={pageContentPaddingSx} data-tour="agents-table">
          {view === "list" ? (
            <DataTable
              columns={columns}
              data={items}
              tableSx={{ tableLayout: "fixed" }}
              isLoading={false}
              error={null}
              getRowId={(i) => i.agent.agent_id}
              getRowTestId={(i) => `agent-row-${i.agent.agent_id}`}
              onRowClick={(i) =>
                void navigate({
                  to: "/tenants/$tenantId/agents/$agentId",
                  params: { tenantId: i.tenant_id, agentId: i.agent.agent_id },
                } as never)
              }
              emptyState={{
                icon: IconMaterialSymbolsSmartToy,
                title: "No agents found",
                description: search
                  ? "Try a different search term, or toggle Show deleted."
                  : blank
                    ? "This is where your connected agents will show up."
                    : "Create an agent inside a tenant to see it here.",
              }}
              pagination={{
                pageIndex: page,
                pageSize: PAGE_SIZE,
                total,
                onPageChange: setPage,
              }}
              sorting={sorting}
              onSortingChange={handleSortingChange}
              manualSorting
            />
          ) : (
            <AgentGroupsView
              by={by}
              filters={{
                q: debouncedSearch || undefined,
                includeDeleted,
                tenantId: by !== "tenant" ? groupedTenantId : undefined,
                kind: by !== "kind" ? groupedKind : undefined,
                onlySample: blank,
              }}
              refetchInterval={null}
            />
          )}
        </Box>
      </ScrollRegion>

      <ConnectAgentDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </Box>
  );
}

/** "Show deleted" toggle — identical styling in List and Grouped view. */
function ShowDeletedButton({
  active,
  onClick,
}: {
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outlined"
      size="small"
      color="inherit"
      data-testid="toggle-deleted"
      data-active={active || undefined}
      onClick={onClick}
      sx={{
        height: 32,
        borderStyle: "solid",
        fontWeight: 400,
        color: "text.secondary",
        "&:hover": { color: "text.primary" },
        "&[data-active]": {
          borderColor: "text.primary",
          bgcolor: "action.hover",
          color: "text.primary",
        },
      }}
    >
      Show deleted
    </Button>
  );
}

/** Purely instructional - there's nothing to fill in and submit. An agent is
 * expected to show up on its own the first time its traces are forwarded, so
 * this just walks through the ingest key, the exporter env vars to paste,
 * and what happens once traces start arriving. Closing (the header X) is the
 * only action. */
function ConnectAgentDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      slotProps={{ paper: { sx: { maxWidth: 480 } } }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
        Connect an agent
        <IconButton
          size="small"
          onClick={onClose}
          aria-label="Close"
          data-testid="connect-agent-close"
        >
          <IconMaterialSymbolsClose sx={{ fontSize: 18 }} />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          An agent appears here automatically the first time your ingest key
          forwards a trace - there is nothing to create by hand.
        </DialogContentText>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
            <Box component="p" sx={{ m: 0, typography: "subtitle2", fontWeight: 600 }}>
              1. Your API key
            </Box>
            <Box>
              <Chip tint="muted">{FAKE_TENANT_KEY_DISPLAY}</Chip>
            </Box>
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
            <Box component="p" sx={{ m: 0, typography: "subtitle2", fontWeight: 600 }}>
              2. Exporter configuration
            </Box>
            <Box component="p" sx={{ m: 0, typography: "caption", color: "text.secondary" }}>
              Paste into the agent&rsquo;s environment.
            </Box>
            <CodeBlock testId="new-agent-exporter-config">{EXPORTER_ENV_VARS}</CodeBlock>
            <Box component="p" sx={{ m: 0, typography: "caption", color: "text.secondary" }}>
              Use the <Box component="span" sx={{ fontFamily: "monospace" }}>_TRACES_</Box>-suffixed
              variables, which take the full ingest path. The unsuffixed form is a base your
              exporter would silently append{" "}
              <Box component="span" sx={{ fontFamily: "monospace" }}>/v1/traces</Box> to a second
              time.
            </Box>
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
            <Box component="p" sx={{ m: 0, typography: "subtitle2", fontWeight: 600 }}>
              3. What happens next
            </Box>
            <Box component="p" sx={{ m: 0, typography: "caption", color: "text.secondary" }}>
              Once this agent has forwarded at least 20 traces, Tricentis binds a scoring
              profile and scoring begins automatically.
            </Box>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
