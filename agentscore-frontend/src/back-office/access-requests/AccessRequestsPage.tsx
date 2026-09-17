/** Access requests — the superadmin queue of people who signed in with
 * Microsoft and have no back-office account yet (mock screen 08).
 *
 * Waiting is the default facet so answered rows don't pile up in the working
 * list. Approving routes to the add-person screen with the verified address
 * pre-filled and locked — or, when that address belongs to a soft-deleted
 * account, to that account's restore path — because the one path that grants
 * access is creating or restoring the person, not a separate approve call.
 */

import { useCallback, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "@/shared/lib/toast";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import IconMaterialSymbolsCancel from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsCancel.mjs";
import IconMaterialSymbolsDelete from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsDelete.mjs";
import IconMaterialSymbolsHowToReg from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsHowToReg.mjs";
import IconMaterialSymbolsMoreVert from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsMoreVert.mjs";
import type { ColumnDef } from "@tanstack/react-table";

import {
  declineAccessRequestFake,
  listAccessRequestsFake,
  removeAccessRequestFake,
  type AccessRequestState,
  type FakeAccessRequest as AccessRequestSummary,
} from "@/back-office/users/fake-data";
import { Chip } from "@/shared/components/chip";
import { DataTable } from "@/shared/components/data-table";
import { FacetedFilter } from "@/shared/components/faceted-filter";
import { PageBand } from "@/shared/components/page-band";
import { pageContentPaddingSx } from "@/shared/components/page-content";
import { ScrollRegion } from "@/shared/components/scroll-region";
import { Toolbar } from "@/shared/components/toolbar";

const PAGE_SIZE = 25;

type StateFacet = AccessRequestState | "all";

const STATE_TINT: Record<AccessRequestState, "warning" | "muted" | "success"> = {
  waiting: "warning",
  declined: "muted",
  approved: "success",
};

interface RowActionsMenuProps {
  row: AccessRequestSummary;
  onApprove: () => void;
  onDecline: () => void;
  onRemove: () => void;
}

function RowActionsMenu({ row, onApprove, onDecline, onRemove }: RowActionsMenuProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const isWaiting = row.state === "waiting";
  // An active (non-deleted) existing account means Approve's create call
  // would 409 on the duplicate email — the row must go through Remove
  // instead, not through the create-a-new-account path.
  const hasActiveAccount = Boolean(row.existing_user && !row.existing_user.deleted);

  return (
    <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
      <IconButton
        ref={triggerRef}
        size="small"
        aria-label={`Actions for ${row.email}`}
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
        {isWaiting && hasActiveAccount ? (
          <Tooltip title="Already has an account — remove this request." placement="left">
            <span>
              <MenuItem data-testid="row-action-approve" disabled>
                <ListItemIcon>
                  <IconMaterialSymbolsHowToReg sx={{ fontSize: 18 }} />
                </ListItemIcon>
                Approve
              </MenuItem>
            </span>
          </Tooltip>
        ) : null}
        {isWaiting && !hasActiveAccount ? (
          <MenuItem
            data-testid="row-action-approve"
            onClick={() => {
              close();
              onApprove();
            }}
          >
            <ListItemIcon>
              <IconMaterialSymbolsHowToReg sx={{ fontSize: 18 }} />
            </ListItemIcon>
            Approve
          </MenuItem>
        ) : null}
        {isWaiting ? (
          <MenuItem
            data-testid="row-action-decline"
            onClick={() => {
              close();
              onDecline();
            }}
          >
            <ListItemIcon>
              <IconMaterialSymbolsCancel sx={{ fontSize: 18 }} />
            </ListItemIcon>
            Decline
          </MenuItem>
        ) : null}
        <MenuItem
          data-testid="row-action-remove"
          onClick={() => {
            close();
            onRemove();
          }}
          sx={{ color: "error.main" }}
        >
          <ListItemIcon>
            <IconMaterialSymbolsDelete sx={{ fontSize: 18, color: "error.main" }} />
          </ListItemIcon>
          Remove
        </MenuItem>
      </Menu>
    </Box>
  );
}

// The superadmin gate lives on `UsersLayout` now, once for both tabs — this
// page renders content only.
export function AccessRequestsPage() {
  const [stateFilter, setStateFilter] = useState<StateFacet>("waiting");
  const [page, setPage] = useState(0);
  const [declineTarget, setDeclineTarget] = useState<AccessRequestSummary | null>(null);
  const [removeTarget, setRemoveTarget] = useState<AccessRequestSummary | null>(null);

  const navigate = useNavigate();
  const [refreshTick, setRefreshTick] = useState(0);

  const requestsResult = useMemo(
    () => listAccessRequestsFake({ limit: PAGE_SIZE, offset: page * PAGE_SIZE, state: stateFilter }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [page, stateFilter, refreshTick],
  );

  const invalidate = () => setRefreshTick((t) => t + 1);

  const decline = {
    isPending: false,
    mutate: (id: string) => {
      declineAccessRequestFake(id);
      toast.success("Request declined");
      setDeclineTarget(null);
      invalidate();
    },
  };

  const remove = {
    isPending: false,
    mutate: (id: string) => {
      removeAccessRequestFake(id);
      toast.success("Request removed");
      setRemoveTarget(null);
      invalidate();
    },
  };

  const approve = useCallback(
    (row: AccessRequestSummary) => {
      if (row.existing_user?.deleted) {
        toast.info("Restore this account to approve the request");
        void navigate({
          to: "/users/$userId",
          params: { userId: row.existing_user.user_id },
          search: { request: row.id },
        });
        return;
      }
      void navigate({
        to: "/users/new",
        search: { email: row.email, request: row.id },
      });
    },
    [navigate],
  );

  const items = requestsResult.items;
  const total = requestsResult.total;

  const columns = useMemo<ColumnDef<AccessRequestSummary, unknown>[]>(
    () => [
      {
        id: "email",
        header: "Email",
        accessorFn: (r) => r.email,
        meta: {
          headerSx: { width: "42%" },
          cellSx: {
            maxWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          },
        },
        cell: ({ row }) => (
          <Box component="span" title={row.original.email} sx={{ fontWeight: 500 }}>
            {row.original.email}
          </Box>
        ),
      },
      {
        id: "requested",
        header: "Requested",
        accessorFn: (r) => r.requested_at,
        meta: {
          headerSx: { width: "18%", textAlign: "right" },
          cellSx: { textAlign: "right" },
        },
        cell: ({ row }) => new Date(row.original.requested_at).toLocaleString(),
      },
      {
        id: "state",
        header: "State",
        accessorFn: (r) => r.state,
        meta: { headerSx: { width: "16%" } },
        cell: ({ row }) => (
          <Stack sx={{ gap: 0.25 }}>
            <Chip tint={STATE_TINT[row.original.state]}>{row.original.state}</Chip>
            {row.original.state === "waiting" && row.original.declined_at ? (
              <Typography
                data-testid="access-request-previously-declined"
                variant="caption"
                sx={{ color: "text.secondary" }}
              >
                Previously declined {new Date(row.original.declined_at).toLocaleDateString()}
              </Typography>
            ) : null}
          </Stack>
        ),
      },
      {
        id: "account",
        header: "Account",
        accessorFn: (r) => r.existing_user?.deleted ?? "none",
        meta: { headerSx: { width: "16%" } },
        cell: ({ row }) => {
          const existing = row.original.existing_user;
          if (!existing) return <Box sx={{ color: "text.secondary" }}>—</Box>;
          return (
            <Chip tint={existing.deleted ? "destructive" : "success"}>
              {existing.deleted ? "deleted" : "active"}
            </Chip>
          );
        },
      },
      {
        id: "actions",
        header: "",
        meta: { headerSx: { width: "8%" } },
        cell: ({ row }) => (
          <Box onClick={(e) => e.stopPropagation()}>
            <RowActionsMenu
              row={row.original}
              onApprove={() => approve(row.original)}
              onDecline={() => setDeclineTarget(row.original)}
              onRemove={() => setRemoveTarget(row.original)}
            />
          </Box>
        ),
      },
    ],
    [approve],
  );

  return (
    <Box sx={{ display: "flex", minHeight: 0, flex: 1, flexDirection: "column" }}>
      <PageBand>
        <Toolbar
          filters={
            <FacetedFilter
              title="State"
              testId="filter-state"
              values={[stateFilter]}
              onChange={(values) => {
                const toggled = values.find((v) => v !== stateFilter);
                setStateFilter((toggled as StateFacet | undefined) ?? "waiting");
                setPage(0);
              }}
              options={[
                { value: "waiting", label: "Waiting" },
                { value: "declined", label: "Declined" },
                { value: "approved", label: "Approved" },
                { value: "all", label: "All" },
              ]}
            />
          }
          right={total > 0 ? <Box component="span">{total} requests</Box> : undefined}
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
            getRowId={(r) => r.id}
            getRowTestId={(r) => `access-request-row-${r.id}`}
            emptyState={{
              icon: IconMaterialSymbolsHowToReg,
              title: "Nothing waiting",
              description: stateFilter !== "waiting"
                ? "Try a different filter."
                : "Nobody is waiting on access right now.",
              testId: "access-requests-empty",
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

      <Dialog open={declineTarget !== null} onClose={() => setDeclineTarget(null)}>
        <DialogTitle>Decline {declineTarget?.email}?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            The person can ask again from the no-access screen. This does not
            block them permanently.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            data-testid="decline-cancel"
            onClick={() => setDeclineTarget(null)}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            data-testid="decline-confirm"
            disabled={decline.isPending}
            onClick={() => declineTarget && decline.mutate(declineTarget.id)}
            startIcon={<IconMaterialSymbolsCancel sx={{ fontSize: 16 }} />}
          >
            Decline
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={removeTarget !== null} onClose={() => setRemoveTarget(null)}>
        <DialogTitle>Remove {removeTarget?.email}?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Deletes the row outright. If they ask again, it starts as a fresh
            request.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            data-testid="remove-cancel"
            onClick={() => setRemoveTarget(null)}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            data-testid="remove-confirm"
            disabled={remove.isPending}
            onClick={() => removeTarget && remove.mutate(removeTarget.id)}
            startIcon={<IconMaterialSymbolsDelete sx={{ fontSize: 16 }} />}
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
