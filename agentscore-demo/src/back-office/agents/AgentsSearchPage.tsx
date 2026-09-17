/** Cross-tenant agents search.
 *
 * PageHeader + Toolbar + DataTable with q-search, faceted filters
 * (client-side over the current page), and an inline "New agent" dialog
 * that lets the operator pick a tenant before creating.
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
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import FormLabel from "@mui/material/FormLabel";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import IconMaterialSymbolsSmartToy from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsSmartToy.mjs";
import IconMaterialSymbolsApartment from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsApartment.mjs";
import IconMaterialSymbolsAdd from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsAdd.mjs";
import IconMaterialSymbolsSearch from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsSearch.mjs";
import IconMaterialSymbolsSell from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsSell.mjs";
import IconMaterialSymbolsHub from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsHub.mjs";
import type { OnChangeFn, SortingState } from "@tanstack/react-table";

import { flatAgentColumns } from "@/back-office/agents/agent-columns";
import { AgentGroupsView } from "@/back-office/agents/AgentGroupSection";
import {
  FAKE_AGENTS,
  FAKE_TENANTS,
  listAgentGroups,
  listAgentsFlat,
  type AgentKind,
} from "@/back-office/agents/fake-data";
import type { AgentsViewSearch, AgentView } from "@/back-office/agents/view-params";
import { AutoRefreshControl } from "@/shared/components/auto-refresh-control";
import { Chip } from "@/shared/components/chip";
import { Combobox, type ComboboxOption } from "@/shared/components/combobox";
import { DataTable } from "@/shared/components/data-table";
import { FacetedFilter } from "@/shared/components/faceted-filter";
import { PageBand } from "@/shared/components/page-band";
import { pageContentPaddingSx } from "@/shared/components/page-content";
import { PageHeader } from "@/shared/components/page-header";
import { ScrollRegion } from "@/shared/components/scroll-region";
import { Toolbar } from "@/shared/components/toolbar";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
import { useDemoMode } from "@/shared/demo-mode/demo-mode-context";

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
          description="Every agent across every customer. Each agent belongs to exactly one customer."
          actions={
            <Button
              variant="contained"
              startIcon={<IconMaterialSymbolsAdd sx={{ fontSize: 16 }} />}
              onClick={() => setCreateOpen(true)}
              data-testid="new-agent-button"
            >
              New agent
            </Button>
          }
        />
      </PageBand>

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
        <Box sx={pageContentPaddingSx}>
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

      <NewAgentDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(tenantId, agentId) => {
          setCreateOpen(false);
          void navigate({
            to: "/tenants/$tenantId/agents/$agentId",
            params: { tenantId, agentId },
          } as never);
        }}
      />
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

function NewAgentDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (tenantId: string, agentId: string) => void;
}) {
  const [tenantId, setTenantId] = useState<string | undefined>(undefined);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  const selectedTenant = FAKE_TENANTS.find((t) => t.tenant_id === tenantId);

  // Agent kind is fixed by the parent tenant — the backend enforces
  // body.kind == tenant.kind. Derive it from the selected tenant so the
  // operator can't pick a value that drifts and 422s on submit.
  const kind = selectedTenant?.kind;

  const resetForm = () => {
    setTenantId(undefined);
    setName("");
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  const handleCreate = () => {
    if (!tenantId || !kind) return;
    setCreating(true);
    const agentId = `agent-${Date.now()}`;
    FAKE_AGENTS.push({
      agent_id: agentId,
      tenant_id: tenantId,
      name: name.trim(),
      kind,
      source_service: null,
      lifecycle: { stage: "connecting", threshold: 20, captured: 0 },
      provisioning_status: "provisioning",
      failure_reason: null,
      deactivated_at: null,
      deleted_at: null,
      created_at: new Date().toISOString(),
      last_seen_at: null,
      forwarded_trace_count: 0,
      latest_score: null,
      drop_pressure: null,
    });
    toast.success(`Agent ${name.trim()} created`);
    onCreated(tenantId, agentId);
    resetForm();
    setCreating(false);
  };

  const disabled = !tenantId || name.trim().length === 0 || creating;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      slotProps={{ paper: { sx: { maxWidth: 448 } } }}
    >
      <DialogTitle>Create agent</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          Creates the agent and assigns its default scoring profile. It will
          briefly show as Connecting before it's ready.
        </DialogContentText>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
            <FormLabel htmlFor="new-agent-tenant">
              Tenant{" "}
              <Box component="span" sx={{ color: "error.main" }}>
                *
              </Box>
            </FormLabel>
            <Combobox
              testId="new-agent-tenant"
              options={FAKE_TENANTS.map((t) => ({
                value: t.tenant_id,
                label: t.name,
                description: `${t.kind}${t.env ? ` · ${t.env}` : ""}`,
                searchText: t.name,
              }))}
              value={tenantId}
              onChange={setTenantId}
              placeholder="Pick a tenant…"
            />
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
            <TextField
              label={
                <>
                  Name{" "}
                  <Box component="span" sx={{ color: "error.main" }}>
                    *
                  </Box>
                </>
              }
              id="new-agent-name"
              placeholder="e.g. billing-agent"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="off"
              fullWidth
              size="small"
              slotProps={{
                htmlInput: {
                  "data-testid": "new-agent-name",
                  sx: { fontFamily: "monospace" },
                },
              }}
            />
            <Box
              component="p"
              sx={{ m: 0, typography: "caption", color: "text.secondary" }}
            >
              Immutable. Lowercase, alphanumeric +{" "}
              <Box component="span" sx={{ fontFamily: "monospace" }}>
                _
              </Box>{" "}
              and{" "}
              <Box component="span" sx={{ fontFamily: "monospace" }}>
                -
              </Box>
              . Up to 63 chars.
            </Box>
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
            <FormLabel>Kind</FormLabel>
            {kind ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Chip tint="muted">{kind}</Chip>
                <Box
                  component="span"
                  sx={{ typography: "caption", color: "text.secondary" }}
                >
                  Fixed by the tenant.
                </Box>
              </Box>
            ) : (
              <Box
                component="p"
                sx={{ m: 0, typography: "caption", color: "text.secondary" }}
              >
                Determined by the tenant — pick a tenant first.
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button
          variant="outlined"
          onClick={handleClose}
          data-testid="cancel-agent"
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          disabled={disabled}
          onClick={handleCreate}
          data-testid="create-agent-submit"
        >
          Create agent
        </Button>
      </DialogActions>
    </Dialog>
  );
}
