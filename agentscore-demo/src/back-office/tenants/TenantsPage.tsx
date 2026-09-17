/** Tenants list page — cross-tenant view with search, filters, and lifecycle actions.
 *
 * Composition: PageHeader + Toolbar + DataTable. Soft-delete is reversible;
 * hard-purge cascades and is gated by a typed-confirm dialog with a cascade
 * preview (per the design ref).
 */

import { useMemo, useRef, useState } from "react";
import { useFakeMutation as useMutation, useFakeQuery as useQuery, useFakeQueryClient as useQueryClient } from "@/back-office/agents/fake-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "@/shared/lib/toast";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import IconMaterialSymbolsApartment from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsApartment.mjs";
import IconMaterialSymbolsEdit from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsEdit.mjs";
import IconMaterialSymbolsHistory from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsHistory.mjs";
import IconMaterialSymbolsLocationOn from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsLocationOn.mjs";
import IconMaterialSymbolsMoreVert from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsMoreVert.mjs";
import IconMaterialSymbolsPublic from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsPublic.mjs";
import IconMaterialSymbolsAdd from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsAdd.mjs";
import IconMaterialSymbolsSearch from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsSearch.mjs";
import IconMaterialSymbolsSell from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsSell.mjs";
import IconMaterialSymbolsWhatshot from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsWhatshot.mjs";
import IconMaterialSymbolsDelete from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsDelete.mjs";
import type { ColumnDef } from "@tanstack/react-table";

import * as api from "@/back-office/tenants/tenant-fixtures";
import type { TenantProfile } from "@/back-office/tenants/tenant-fixtures";
import { CascadePreviewList } from "@/shared/components/cascade-preview-list";
import { TENANT_PURGE_CASCADE } from "@/shared/components/purge-cascade";
import { Chip } from "@/shared/components/chip";
import { DataTable } from "@/shared/components/data-table";
import { FacetedFilter } from "@/shared/components/faceted-filter";
import { PageBand } from "@/shared/components/page-band";
import { pageContentPaddingSx } from "@/shared/components/page-content";
import { PageHeader } from "@/shared/components/page-header";
import { ScrollRegion } from "@/shared/components/scroll-region";
import { StatusDot } from "@/shared/components/status-dot";
import { Toolbar } from "@/shared/components/toolbar";
import { TypedConfirmInput } from "@/shared/components/typed-confirm-input";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";

const PAGE_SIZE = 25;

// Split into a gate + an inner shell so a non-superadmin never fires the
// tenants/facets queries below — React hooks run unconditionally at the top
// of the component that declares them, so an early return has to happen in a
// component that declares none. Mirrors `SimulationLayout.tsx`.
export function TenantsPage() {
  return <TenantsShell />;
}

function TenantsShell() {
  const [search, setSearch] = useState("");
  // Typed to the wire enum, not `string[]`: `kind` is a server param now, so a
  // value the API cannot express fails here rather than at runtime.
  const [kindFilter, setKindFilter] = useState<api.TenantKind[]>([]);
  const [envFilter, setEnvFilter] = useState<string[]>([]);
  const [regionFilter, setRegionFilter] = useState<string[]>([]);
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [page, setPage] = useState(0);
  const [softDeleteTarget, setSoftDeleteTarget] = useState<TenantProfile | null>(
    null,
  );
  const [purgeTarget, setPurgeTarget] = useState<TenantProfile | null>(null);

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const debouncedSearch = useDebouncedValue(search, 350);

  // Every facet is part of the REQUEST, and therefore part of the key.
  //
  // They used to narrow the fetched page in the browser, so with a 25-row page
  // and more tenants than that, a facet could not surface a row that was not
  // already on screen, and `total` below kept describing the unfiltered set
  // while the rows described a narrowed one.
  const filterParams = useMemo(
    () => ({
      includeDeleted,
      q: debouncedSearch || undefined,
      kind: kindFilter,
      env: envFilter,
      region: regionFilter,
    }),
    [includeDeleted, debouncedSearch, kindFilter, envFilter, regionFilter],
  );

  const queryKey = useMemo(
    () => ["tenants", { limit: PAGE_SIZE, offset: page * PAGE_SIZE, ...filterParams }],
    [page, filterParams],
  );

  const tenantsQuery = useQuery({
    queryKey,
    queryFn: () =>
      api.listTenants({
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
        ...filterParams,
      }),
  });

  // Facet options from the complete Env/Region vocabularies, not from the rows
  // on screen — a page could only ever offer what it happened to contain.
  const facetsQuery = useQuery({
    queryKey: ["tenants", "facets", { includeDeleted }],
    queryFn: () => api.listTenantFacets(includeDeleted),
  });

  // A facet is a server-side request input now, so it has to rewind the page the
  // way search and Show-deleted already do: narrowing while parked on a later
  // page requests an offset past the end of the filtered result.
  const facetSetter =
    <T extends string>(set: (values: T[]) => void) =>
    (values: string[]) => {
      setPage(0);
      set(values as T[]);
    };

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["tenants"] });
    queryClient.invalidateQueries({ queryKey: ["sidebar-counts", "tenants"] });
  };

  const softDelete = useMutation({
    mutationFn: (tenantId: string) => api.softDeleteTenant(tenantId),
    onSuccess: () => {
      toast.success("Tenant deleted");
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const restore = useMutation({
    mutationFn: (tenantId: string) => api.restoreTenant(tenantId),
    onSuccess: () => {
      toast.success("Tenant restored");
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const purge = useMutation({
    mutationFn: (tenantId: string) => api.purgeTenant(tenantId),
    onSuccess: () => {
      toast.success("Tenant purged");
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const columns = useMemo<ColumnDef<TenantProfile, unknown>[]>(
    () => [
      {
        id: "name",
        header: "Tenant",
        meta: { headerSx: { width: "34%" } },
        accessorFn: (t) => t.name,
        cell: ({ row }) => (
          <Box sx={{ minWidth: 0 }}>
            <Box
              sx={{
                fontWeight: 500,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {row.original.name}
            </Box>
            <Box
              sx={{
                fontFamily: "monospace",
                typography: "caption",
                color: "text.secondary",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {row.original.tenant_id}
            </Box>
          </Box>
        ),
      },
      {
        id: "kind",
        header: "Kind",
        meta: { headerSx: { width: "12%" } },
        accessorFn: (t) => t.kind,
        cell: ({ row }) => (
          <Chip tint={row.original.kind === "internal" ? "info" : "muted"}>
            {row.original.kind}
          </Chip>
        ),
      },
      {
        id: "env",
        header: "Env",
        meta: { headerSx: { width: "14%" } },
        accessorFn: (t) => t.env ?? "—",
        cell: ({ row }) => (
          <Box component="span" sx={{ color: "text.secondary" }}>
            {row.original.env ?? "—"}
          </Box>
        ),
      },
      {
        id: "region",
        header: "Region",
        meta: { headerSx: { width: "14%" } },
        accessorFn: (t) => t.region ?? "—",
        cell: ({ row }) => (
          <Box component="span" sx={{ color: "text.secondary" }}>
            {row.original.region ?? "—"}
          </Box>
        ),
      },
      {
        id: "created",
        header: "Created",
        meta: { headerSx: { width: "13%" } },
        accessorFn: (t) => t.created_at,
        cell: ({ row }) =>
          new Date(row.original.created_at).toLocaleDateString(),
      },
      {
        id: "status",
        header: "Status",
        meta: { headerSx: { width: "9%" } },
        accessorFn: (t) => (t.deleted_at ? "deleted" : "active"),
        cell: ({ row }) =>
          row.original.deleted_at ? (
            <StatusDot status="destructive">deleted</StatusDot>
          ) : (
            <StatusDot status="success">active</StatusDot>
          ),
      },
      {
        id: "actions",
        header: "",
        meta: { headerSx: { width: "4%" } },
        cell: ({ row }) => (
          <RowActions
            tenant={row.original}
            onOpen={(t) =>
              void navigate({
                to: "/tenants/$tenantId",
                params: { tenantId: t.tenant_id },
              })
            }
            onRestore={(t) => restore.mutate(t.tenant_id)}
            onPurge={setPurgeTarget}
            onSoftDelete={setSoftDeleteTarget}
          />
        ),
      },
    ],
    [navigate, restore],
  );

  const items = useMemo(
    () => tenantsQuery.data?.items ?? [],
    [tenantsQuery.data],
  );
  const envOptions = useMemo(
    () =>
      (facetsQuery.data?.envs ?? []).map((v) => ({ value: v, label: v })),
    [facetsQuery.data],
  );
  const regionOptions = useMemo(
    () =>
      (facetsQuery.data?.regions ?? []).map((v) => ({ value: v, label: v })),
    [facetsQuery.data],
  );
  const total = tenantsQuery.data?.total ?? 0;

  return (
    <Box sx={{ display: "flex", minHeight: 0, flex: 1, flexDirection: "column" }}>
      <PageBand sx={{ pt: 4, pb: 2.5 }}>
        <PageHeader
          title="Tenants"
          description="One tenant per customer, per environment (like production or staging). Groups their agents for billing and scoring."
          actions={
            <Button
              variant="contained"
              startIcon={<IconMaterialSymbolsAdd fontSize="small" />}
              onClick={() => void navigate({ to: "/tenants/new" })}
              data-testid="new-tenant-button"
            >
              New tenant
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
              placeholder="Filter tenants by name…"
              value={search}
              onChange={(e) => {
                setPage(0);
                setSearch(e.target.value);
              }}
              slotProps={{
                htmlInput: {
                  "aria-label": "Search tenants",
                  "data-testid": "search-tenants",
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
            <>
              <FacetedFilter
                title="Kind"
                testId="filter-kind"
                icon={IconMaterialSymbolsSell}
                values={kindFilter}
                onChange={facetSetter(setKindFilter)}
                options={[
                  { value: "external", label: "external" },
                  { value: "internal", label: "internal" },
                ]}
              />
              <FacetedFilter
                title="Env"
                testId="filter-env"
                icon={IconMaterialSymbolsPublic}
                values={envFilter}
                onChange={facetSetter(setEnvFilter)}
                options={envOptions}
              />
              <FacetedFilter
                title="Region"
                testId="filter-region"
                icon={IconMaterialSymbolsLocationOn}
                values={regionFilter}
                onChange={facetSetter(setRegionFilter)}
                options={regionOptions}
              />
              <Button
                type="button"
                variant="outlined"
                size="small"
                color="inherit"
                data-testid="toggle-deleted"
                data-active={includeDeleted || undefined}
                onClick={() => {
                  setPage(0);
                  setIncludeDeleted((v) => !v);
                }}
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
            </>
          }
          right={total > 0 ? <span>{total} tenants</span> : undefined}
        />
      </PageBand>

      <ScrollRegion>
        <Box sx={pageContentPaddingSx}>
          <DataTable
          columns={columns}
          data={items}
          tableSx={{ tableLayout: "fixed" }}
          isLoading={tenantsQuery.isLoading}
          error={tenantsQuery.error as Error | null}
          getRowId={(t) => t.tenant_id}
          getRowTestId={(t) => `tenant-row-${t.tenant_id}`}
          onRowClick={(t) =>
            void navigate({
              to: "/tenants/$tenantId",
              params: { tenantId: t.tenant_id },
            })
          }
          emptyState={{
            icon: IconMaterialSymbolsApartment,
            title: "No tenants yet",
            description:
              "Onboard your first customer to start scoring agents.",
          }}
          pagination={{
            pageIndex: page,
            pageSize: PAGE_SIZE,
            total,
            onPageChange: setPage,
          }}
          enableSorting={false}
          />
        </Box>
      </ScrollRegion>

      <SoftDeleteDialog
        target={softDeleteTarget}
        onClose={() => setSoftDeleteTarget(null)}
        onConfirm={(t) => {
          softDelete.mutate(t.tenant_id);
          setSoftDeleteTarget(null);
        }}
      />
      <HardPurgeDialog
        target={purgeTarget}
        onClose={() => setPurgeTarget(null)}
        onConfirm={(t) => {
          purge.mutate(t.tenant_id);
          setPurgeTarget(null);
        }}
      />
    </Box>
  );
}

function RowActions({
  tenant,
  onOpen,
  onRestore,
  onPurge,
  onSoftDelete,
}: {
  tenant: TenantProfile;
  onOpen: (tenant: TenantProfile) => void;
  onRestore: (tenant: TenantProfile) => void;
  onPurge: (tenant: TenantProfile) => void;
  onSoftDelete: (tenant: TenantProfile) => void;
}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  return (
    <Box
      sx={{ display: "flex", justifyContent: "flex-end" }}
      onClick={(e) => e.stopPropagation()}
    >
      <IconButton
        ref={triggerRef}
        size="small"
        aria-label={`Actions for ${tenant.name}`}
        onClick={() => setOpen(true)}
      >
        <IconMaterialSymbolsMoreVert sx={{ fontSize: 18 }} />
      </IconButton>
      <Menu
        anchorEl={triggerRef.current}
        open={open}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem
          data-testid="row-action-edit"
          onClick={() => {
            setOpen(false);
            onOpen(tenant);
          }}
        >
          <IconMaterialSymbolsEdit fontSize="small" sx={{ mr: 1 }} />
          Open
        </MenuItem>
        {tenant.deleted_at
          ? [
              <MenuItem
                key="restore"
                data-testid="row-action-restore"
                onClick={() => {
                  setOpen(false);
                  onRestore(tenant);
                }}
              >
                <IconMaterialSymbolsHistory fontSize="small" sx={{ mr: 1 }} />
                Restore
              </MenuItem>,
              <Divider key="divider" />,
              <MenuItem
                key="purge"
                data-testid="row-action-purge"
                sx={{ color: "error.main" }}
                onClick={() => {
                  setOpen(false);
                  onPurge(tenant);
                }}
              >
                <IconMaterialSymbolsWhatshot fontSize="small" sx={{ mr: 1 }} />
                Permanently delete…
              </MenuItem>,
            ]
          : [
              <Divider key="divider" />,
              <MenuItem
                key="delete"
                data-testid="row-action-delete"
                sx={{ color: "error.main" }}
                onClick={() => {
                  setOpen(false);
                  onSoftDelete(tenant);
                }}
              >
                <IconMaterialSymbolsDelete fontSize="small" sx={{ mr: 1 }} />
                Delete
              </MenuItem>,
            ]}
      </Menu>
    </Box>
  );
}

function SoftDeleteDialog({
  target,
  onClose,
  onConfirm,
}: {
  target: TenantProfile | null;
  onClose: () => void;
  onConfirm: (target: TenantProfile) => void;
}) {
  return (
    <Dialog open={target !== null} onClose={onClose}>
      <DialogTitle>Delete {target?.name}?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Reversible. Its agents stop working immediately. Stored traces
          stay — use Permanently delete from the Show-deleted view to
          remove it for good.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" data-testid="delete-cancel" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          data-testid="delete-confirm"
          startIcon={<IconMaterialSymbolsDelete fontSize="small" />}
          onClick={() => target && onConfirm(target)}
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function HardPurgeDialog({
  target,
  onClose,
  onConfirm,
}: {
  target: TenantProfile | null;
  onClose: () => void;
  onConfirm: (target: TenantProfile) => void;
}) {
  return (
    <Dialog
      open={target !== null}
      onClose={onClose}
      slotProps={{ paper: { sx: { maxWidth: 512 } } }}
    >
      <DialogTitle>Permanently delete {target?.name}?</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ color: "error.main" }}>
          This cannot be undone.
        </DialogContentText>
        <CascadePreviewList
          heading="The following will be destroyed:"
          items={TENANT_PURGE_CASCADE}
        />
        {target ? (
          <TypedConfirmInput
            confirmText={target.name}
            testId="purge"
            buttonLabel={
              <Box
                component="span"
                sx={{ display: "inline-flex", alignItems: "center", gap: 0.75 }}
              >
                <IconMaterialSymbolsWhatshot fontSize="small" />
                Permanently delete {target.name}
              </Box>
            }
            onConfirm={() => onConfirm(target)}
          />
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" data-testid="purge-cancel" onClick={onClose}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
}
