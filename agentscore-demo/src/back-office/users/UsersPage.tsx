/** Users list — back-office staff with email/password login.
 *
 * Toolbar mirrors the design ref: search + Role + Tenant + Status faceted
 * filters. The "Status" filter drives the `includeDeleted` BE param and
 * client-side filtering. Self-row actions are disabled to prevent locking
 * yourself out.
 */

import { useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "@/shared/lib/toast";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
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
import ListItemIcon from "@mui/material/ListItemIcon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import IconMaterialSymbolsApartment from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsApartment.mjs";
import IconMaterialSymbolsDelete from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsDelete.mjs";
import IconMaterialSymbolsEdit from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsEdit.mjs";
import IconMaterialSymbolsGroup from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsGroup.mjs";
import IconMaterialSymbolsLogout from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsLogout.mjs";
import IconMaterialSymbolsMoreVert from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsMoreVert.mjs";
import IconMaterialSymbolsRadioButtonChecked from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsRadioButtonChecked.mjs";
import IconMaterialSymbolsReplay from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsReplay.mjs";
import IconMaterialSymbolsSearch from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsSearch.mjs";
import IconMaterialSymbolsShield from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsShield.mjs";
import type { ColumnDef } from "@tanstack/react-table";

import {
  CURRENT_USER_ID,
  FAKE_TENANT_OPTIONS,
  FAKE_USERS,
  listUsersFake,
  revokeSessionsFake,
  restoreUserFake,
  deleteUserFake,
  type FakeUser as UserProfile,
  type UserRole,
  type UserStatus,
} from "@/back-office/users/fake-data";
import { Chip } from "@/shared/components/chip";
import { DataTable } from "@/shared/components/data-table";
import { FacetedFilter } from "@/shared/components/faceted-filter";
import { PageBand } from "@/shared/components/page-band";
import { pageContentPaddingSx } from "@/shared/components/page-content";
import { ScrollRegion } from "@/shared/components/scroll-region";
import { StatusDot } from "@/shared/components/status-dot";
import { Toolbar } from "@/shared/components/toolbar";

const PAGE_SIZE = 25;

interface RowActionsMenuProps {
  user: UserProfile;
  isSelf: boolean;
  onEdit: () => void;
  onRevoke: () => void;
  onRestore: () => void;
  onSoftDelete: () => void;
}

function RowActionsMenu({
  user,
  isSelf,
  onEdit,
  onRevoke,
  onRestore,
  onSoftDelete,
}: RowActionsMenuProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
      <IconButton
        ref={triggerRef}
        size="small"
        aria-label={`Actions for ${user.email}`}
        onClick={() => setOpen(true)}
      >
        <IconMaterialSymbolsMoreVert sx={{ fontSize: 18 }} />
      </IconButton>
      <Menu
        anchorEl={triggerRef.current}
        open={open}
        onClose={close}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem
          data-testid="row-action-edit"
          onClick={() => {
            close();
            onEdit();
          }}
        >
          <ListItemIcon>
            <IconMaterialSymbolsEdit sx={{ fontSize: 18 }} />
          </ListItemIcon>
          Edit
        </MenuItem>
        <MenuItem
          data-testid="row-action-revoke"
          disabled={isSelf}
          data-disabled={isSelf || undefined}
          onClick={() => {
            close();
            onRevoke();
          }}
        >
          <ListItemIcon>
            <IconMaterialSymbolsLogout sx={{ fontSize: 18 }} />
          </ListItemIcon>
          Revoke sessions
        </MenuItem>
        <Divider />
        {user.deleted_at ? (
          <MenuItem
            data-testid="row-action-restore"
            disabled={isSelf}
            data-disabled={isSelf || undefined}
            onClick={() => {
              close();
              onRestore();
            }}
          >
            <ListItemIcon>
              <IconMaterialSymbolsReplay sx={{ fontSize: 18 }} />
            </ListItemIcon>
            Restore
          </MenuItem>
        ) : (
          <MenuItem
            data-testid="row-action-delete"
            disabled={isSelf}
            data-disabled={isSelf || undefined}
            onClick={() => {
              close();
              onSoftDelete();
            }}
            sx={{ color: "error.main" }}
          >
            <ListItemIcon>
              <IconMaterialSymbolsDelete sx={{ fontSize: 18, color: "error.main" }} />
            </ListItemIcon>
            Soft-delete
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
}

// The superadmin gate lives on `UsersLayout` now, once for both tabs — this
// page renders content only. `useAuth()` still runs here: the self-row
// disabled-actions check below needs the signed-in principal.
export function UsersPage() {
  const currentUser = FAKE_USERS.find((u) => u.user_id === CURRENT_USER_ID) ?? null;
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole[]>([]);
  const [tenantFilter, setTenantFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<UserStatus[]>([]);
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [page, setPage] = useState(0);
  const [softDeleteTarget, setSoftDeleteTarget] = useState<UserProfile | null>(
    null,
  );
  const [restoreTarget, setRestoreTarget] = useState<UserProfile | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const navigate = useNavigate();

  // Keep the input responsive but throttle the value that hits the server.
  const debouncedSearch = useDebouncedValue(search, 350);

  const filterParams = useMemo(
    () => ({
      includeDeleted,
      q: debouncedSearch || undefined,
      role: roleFilter,
      tenantId: tenantFilter,
      status: statusFilter,
    }),
    [includeDeleted, debouncedSearch, roleFilter, tenantFilter, statusFilter],
  );

  const usersResult = useMemo(
    () => listUsersFake({ limit: PAGE_SIZE, offset: page * PAGE_SIZE, ...filterParams }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [page, filterParams, refreshTick],
  );

  // The admin count beside the total was counted over the PAGE, so the
  // label read "200 users · 3 admins" where the 3 described only the 25
  // rows on screen. One number over the whole set, under the same filters.
  const admins = useMemo(
    () => listUsersFake({ ...filterParams, role: ["superadmin"], limit: 1000, offset: 0 }).total,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filterParams, refreshTick],
  );

  // A facet is a server-side request input now, so it has to rewind the page the
  // way search and Show-deleted already do.
  const facetSetter =
    <T extends string>(set: (values: T[]) => void) =>
    (values: string[]) => {
      setPage(0);
      set(values as T[]);
    };

  const tenantOptionsRaw = FAKE_TENANT_OPTIONS;

  const invalidate = () => setRefreshTick((t) => t + 1);

  const softDelete = {
    mutate: (userId: string) => {
      deleteUserFake(userId);
      toast.success("User deleted");
      invalidate();
    },
  };

  const restore = {
    isPending: false,
    mutate: (userId: string) => {
      restoreUserFake(userId);
      toast.success("User restored");
      setRestoreTarget(null);
      invalidate();
    },
  };

  const revoke = {
    mutate: (userId: string) => {
      const result = revokeSessionsFake(userId);
      toast.success(`Revoked ${result.revoked} session(s)`);
      invalidate();
    },
  };

  const items = usersResult.items;
  const total = usersResult.total;

  const columns = useMemo<ColumnDef<UserProfile, unknown>[]>(
    () => [
      {
        id: "email",
        header: "Email",
        accessorFn: (u) => u.email,
        meta: {
          headerSx: { width: "32%" },
          cellSx: {
            maxWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          },
        },
        cell: ({ row }) => (
          <Box
            component="span"
            title={row.original.email}
            sx={{ fontWeight: 500 }}
          >
            {row.original.email}
          </Box>
        ),
      },
      {
        id: "role",
        header: "Role",
        accessorFn: (u) => (u.is_superadmin ? "admin" : "member"),
        meta: { headerSx: { width: "16%" } },
        cell: ({ row }) => (
          <Chip tint={row.original.is_superadmin ? "info" : "muted"}>
            {row.original.is_superadmin ? "admin" : "member"}
          </Chip>
        ),
      },
      {
        id: "tenants",
        header: "Tenants",
        accessorFn: (u) => u.tenants.length,
        meta: { headerSx: { width: "12%" } },
        cell: ({ row }) => (
          <Box component="span" sx={{ color: "text.secondary" }}>
            {row.original.is_superadmin ? "all" : row.original.tenants.length}
          </Box>
        ),
      },
      {
        id: "created",
        header: "Created",
        accessorFn: (u) => u.created_at,
        meta: { headerSx: { width: "20%" } },
        cell: ({ row }) =>
          new Date(row.original.created_at).toLocaleDateString(),
      },
      {
        id: "status",
        header: "Status",
        accessorFn: (u) => (u.deleted_at ? "deleted" : "active"),
        meta: { headerSx: { width: "14%" } },
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
        cell: ({ row }) => {
          const isSelf = currentUser?.user_id === row.original.user_id;
          return (
            <Box onClick={(e) => e.stopPropagation()}>
              <RowActionsMenu
                user={row.original}
                isSelf={isSelf}
                onEdit={() =>
                  void navigate({
                    to: "/users/$userId",
                    params: { userId: row.original.user_id },
                  })
                }
                onRevoke={() => revoke.mutate(row.original.user_id)}
                onRestore={() => setRestoreTarget(row.original)}
                onSoftDelete={() => setSoftDeleteTarget(row.original)}
              />
            </Box>
          );
        },
      },
    ],
    [currentUser?.user_id, navigate, revoke],
  );

  const tenantOptions = useMemo(
    () =>
      tenantOptionsRaw.map((t) => ({
        value: t.tenant_id,
        label: t.name,
        searchText: t.name,
      })),
    [tenantOptionsRaw],
  );

  return (
    <Box sx={{ display: "flex", minHeight: 0, flex: 1, flexDirection: "column" }}>
      <PageBand>
        <Toolbar
          search={
            <TextField
              size="small"
              fullWidth
              placeholder="Filter users by email…"
              value={search}
              onChange={(e) => {
                setPage(0);
                setSearch(e.target.value);
              }}
              slotProps={{
                htmlInput: {
                  "aria-label": "Search users",
                  "data-testid": "search-users",
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
                title="Role"
                testId="filter-role"
                icon={IconMaterialSymbolsShield}
                values={roleFilter}
                onChange={facetSetter(setRoleFilter)}
                options={[
                  { value: "member", label: "member" },
                  { value: "superadmin", label: "admin" },
                ]}
              />
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
                title="Status"
                testId="filter-status"
                icon={IconMaterialSymbolsRadioButtonChecked}
                values={statusFilter}
                onChange={facetSetter(setStatusFilter)}
                // `active` only, deliberately: Show-deleted is the single
                // control for deleted visibility (pinned by a test), so a second
                // affordance for it here would be two controls for one thing.
                options={[{ value: "active", label: "active" }]}
              />
              <Button
                type="button"
                variant="outlined"
                size="small"
                data-testid="toggle-deleted"
                data-active={includeDeleted || undefined}
                onClick={() => {
                  setPage(0);
                  setIncludeDeleted((v) => !v);
                }}
                sx={{
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
          right={
            total > 0 ? (
              <Box component="span">
                {total} users
                {admins > 0 ? ` · ${admins} admin${admins === 1 ? "" : "s"}` : ""}
              </Box>
            ) : undefined
          }
        />
      </PageBand>

      <ScrollRegion>
        <Box sx={pageContentPaddingSx}>
          <DataTable
          columns={columns}
          data={items}
          tableSx={{ tableLayout: "fixed" }}
          isLoading={false}
          error={null}
          getRowId={(u) => u.user_id}
          getRowTestId={(u) => `user-row-${u.user_id}`}
          onRowClick={(u) =>
            void navigate({
              to: "/users/$userId",
              params: { userId: u.user_id },
            })
          }
          emptyState={{
            icon: IconMaterialSymbolsGroup,
            title: "No users found",
            description:
              search ||
              roleFilter.length > 0 ||
              tenantFilter.length > 0 ||
              statusFilter.length > 0 ||
              includeDeleted
                ? "Try a different search term, or clear the filters."
                : "Approve an access request to add a user.",
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

      <Dialog
        open={softDeleteTarget !== null}
        onClose={() => setSoftDeleteTarget(null)}
      >
        <DialogTitle>Soft-delete {softDeleteTarget?.email}?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Revokes all sessions and hides the user from active lists.
            Tenant memberships and role are preserved and come back with a
            restore.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            data-testid="delete-cancel"
            onClick={() => setSoftDeleteTarget(null)}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            data-testid="delete-confirm"
            onClick={() => {
              if (softDeleteTarget) {
                softDelete.mutate(softDeleteTarget.user_id);
                setSoftDeleteTarget(null);
              }
            }}
            startIcon={<IconMaterialSymbolsDelete sx={{ fontSize: 16 }} />}
          >
            Soft-delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={restoreTarget !== null}
        onClose={() => setRestoreTarget(null)}
      >
        <DialogTitle>Restore {restoreTarget?.email}?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Reinstates their tenant memberships
            {restoreTarget?.is_superadmin ? " and the admin flag" : ""}.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            data-testid="restore-cancel"
            onClick={() => setRestoreTarget(null)}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            data-testid="restore-confirm"
            onClick={() => {
              if (restoreTarget) restore.mutate(restoreTarget.user_id);
            }}
            disabled={restore.isPending}
            startIcon={<IconMaterialSymbolsReplay sx={{ fontSize: 16 }} />}
          >
            Restore
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
