/** TenantAgentsPage — agents-in-this-tenant table.
 *
 * Click a row to navigate to that agent's detail page. Per-tenant
 * agent-create lands in a follow-up PR.
 */

import { useMemo, useRef, useState, type ReactNode } from "react";
import { useFakeMutation as useMutation, useFakeQuery as useQuery, useFakeQueryClient as useQueryClient } from "@/back-office/agents/fake-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { toast } from "@/shared/lib/toast";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Tooltip from "@mui/material/Tooltip";
import IconMaterialSymbolsSmartToy from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsSmartToy.mjs";
import IconMaterialSymbolsMoreVert from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsMoreVert.mjs";
import IconMaterialSymbolsToggleOn from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsToggleOn.mjs";
import IconMaterialSymbolsRestartAlt from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsRestartAlt.mjs";
import type {
  ColumnDef,
  OnChangeFn,
  SortingState,
} from "@tanstack/react-table";

import { FAKE_AGENTS, type FakeAgent } from "@/back-office/agents/fake-data";
import {
  LastActiveCell,
  ScoreCell,
  TracesCell,
} from "@/shared/components/activity-cells";
import { Chip } from "@/shared/components/chip";
import { DataTable } from "@/shared/components/data-table";
import { LifecycleChip } from "@/shared/components/lifecycle-chip";
import { StatusDot } from "@/shared/components/status-dot";

const PAGE_SIZE = 25;

export function TenantAgentsPage() {
  const { tenantId } = useParams({ strict: false }) as { tenantId: string };
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [includeDeleted, setIncludeDeleted] = useState(false);

  const handleSortingChange: OnChangeFn<SortingState> = (updater) => {
    setPage(0);
    setSorting(updater);
  };
  const sort = sorting[0]?.id as string | undefined;
  const dir = sorting[0] ? (sorting[0].desc ? "desc" : "asc") : undefined;

  const invalidate = () => {
    queryClient.invalidateQueries({
      queryKey: ["agents-for-tenant", tenantId],
    });
    queryClient.invalidateQueries({ queryKey: ["agents-flat"] });
  };

  // `mutate` is destructured at the call site (not read off the mutation
  // result object later) because `mutate` is the one part of that object
  // TanStack Query guarantees stable across renders — the object itself is
  // recreated every render. Destructuring gives the `columns` memo below a
  // plain identifier its dependency array can actually track.
  //
  // Only Activate and Restore live here — both are non-destructive and
  // reversible with one more click. Deactivate and Soft-delete are NOT
  // offered from this row menu: Deactivate's confirmation must state the
  // full cancellation contract, and Soft-delete's dialog must show a
  // drop-pressure warning when `dropped_recently` — and this row's data
  // comes from the LIST read, where `drop_pressure` is always `null` (only
  // the detail read populates it). Duplicating that copy here risks drift
  // from `AgentSettingsPage`, and showing the drop-pressure dialog here would
  // need an extra per-row detail fetch just to answer one question the
  // settings page already answers for free. Both destructive steps stay one
  // click away via "Open".
  const { mutate: activateAgent } = useMutation({
    mutationFn: (agentId: string) => {
      const a = FAKE_AGENTS.find((x) => x.agent_id === agentId);
      if (a) a.deactivated_at = null;
      return Promise.resolve(a);
    },
    onSuccess: () => {
      toast.success("Agent activated");
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const { mutate: restoreAgent } = useMutation({
    mutationFn: (agentId: string) => {
      const a = FAKE_AGENTS.find((x) => x.agent_id === agentId);
      if (a) a.deleted_at = null;
      return Promise.resolve(a);
    },
    onSuccess: () => {
      toast.success("Agent restored");
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const columns = useMemo<ColumnDef<FakeAgent, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        meta: { headerSx: { width: "20%" } },
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
            {row.original.name}
          </Box>
        ),
      },
      {
        accessorKey: "kind",
        header: "Kind",
        meta: { headerSx: { width: "8%" } },
        cell: ({ row }) => (
          <Chip tint={row.original.kind === "internal" ? "info" : "muted"}>
            {row.original.kind}
          </Chip>
        ),
      },
      {
        id: "stage",
        header: "Stage",
        meta: { headerSx: { width: "16%" } },
        // Replaces the Provisioning column, which showed `active` on every healthy
        // row and said nothing about what the pipeline was doing with the agent.
        // `connecting` covers both of its non-active states and carries a reason
        // the three dots never had. The Status column beside it stays — soft
        // deletion is not a pipeline stage, and the derivation never reads
        // `deleted_at`.
        accessorFn: (a) => a.lifecycle?.stage,
        // Display-only. This table is `manualSorting` against a backend `sort`
        // enum that has no "stage" member, so a sort click would 422 the whole
        // list — TanStack makes any column with an `accessorFn` sortable unless
        // told otherwise. (The enum's `provisioning` member is now unused by the
        // UI; it stays valid on the wire and breaks nothing.)
        enableSorting: false,
        cell: ({ row }) => (
          <LifecycleChip
            lifecycle={row.original.lifecycle}
            voice="operator"
            // Same fixed-layout column bound as the cross-tenant agents table.
            reasonBelow
            tooltip={
              row.original.lifecycle?.reason === "provision_failed"
                ? row.original.failure_reason
                : null
            }
            // A deactivated agent's stage keeps computing server-side; it is
            // suppressed here only so it never sits beside the Inactive
            // status beside it and reads as a contradiction.
            suppressed={Boolean(row.original.deactivated_at)}
          />
        ),
      },
      {
        id: "created",
        header: "Created",
        meta: { headerSx: { width: "10%" } },
        accessorFn: (a) => a.created_at,
        cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString(),
      },
      {
        id: "status",
        header: "Status",
        meta: { headerSx: { width: "9%" } },
        // Precedence: deleted → inactive → active. The backend `sort=status`
        // enum member is real (unlike Stage's, which 422s) but orders on
        // `Agent.deleted_at` alone — it has no notion of "inactive" — so a
        // sort click here would silently order inactive rows in with the
        // actives rather than fail loudly. Disabled until the backend enum
        // grows a third state to sort on.
        enableSorting: false,
        accessorFn: (a) =>
          a.deleted_at ? "deleted" : a.deactivated_at ? "inactive" : "active",
        cell: ({ row }) =>
          row.original.deleted_at ? (
            <StatusDot status="destructive">deleted</StatusDot>
          ) : row.original.deactivated_at ? (
            <StatusDot status="muted">Inactive</StatusDot>
          ) : (
            <StatusDot status="success">active</StatusDot>
          ),
      },
      {
        id: "traces",
        header: "Traces",
        meta: { headerSx: { width: "9%" } },
        accessorFn: (a) => a.forwarded_trace_count,
        cell: ({ row }) => <TracesCell agent={row.original} />,
      },
      {
        id: "last_active",
        header: "Last active",
        meta: { headerSx: { width: "10%" } },
        accessorFn: (a) => a.last_seen_at,
        cell: ({ row }) => <LastActiveCell agent={row.original} />,
      },
      {
        id: "score",
        header: "Score",
        meta: { headerSx: { width: "10%" } },
        accessorFn: (a) => a.latest_score?.composite_score,
        cell: ({ row }) => <ScoreCell agent={row.original} />,
      },
      {
        id: "actions",
        header: "",
        meta: { headerSx: { width: "8%" } },
        cell: ({ row }) => (
          <RowActions
            agent={row.original}
            onActivate={(a) => activateAgent(a.agent_id)}
            onRestore={(a) => restoreAgent(a.agent_id)}
          />
        ),
      },
    ],
    [activateAgent, restoreAgent],
  );

  const agentsQuery = useQuery({
    queryKey: [
      "agents-for-tenant",
      tenantId,
      { offset: page * PAGE_SIZE, sort, dir, includeDeleted },
    ],
    queryFn: () => {
      let rows = FAKE_AGENTS.filter((a) => a.tenant_id === tenantId && (includeDeleted || !a.deleted_at));
      if (sort) {
        rows = [...rows].sort((a, b) => {
          const av = (a as unknown as Record<string, unknown>)[sort];
          const bv = (b as unknown as Record<string, unknown>)[sort];
          const cmp = String(av ?? "").localeCompare(String(bv ?? ""));
          return dir === "desc" ? -cmp : cmp;
        });
      }
      const total = rows.length;
      const items = rows.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
      return Promise.resolve({ items, total });
    },
  });

  const total = agentsQuery.data?.total ?? 0;

  return (
    <Box sx={{ px: 4, py: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1.5 }}>
        <ShowDeletedButton
          active={includeDeleted}
          onClick={() => {
            setPage(0);
            setIncludeDeleted((v) => !v);
          }}
        />
      </Box>
      <DataTable
        columns={columns}
        data={agentsQuery.data?.items ?? []}
        tableSx={{ tableLayout: "fixed" }}
        isLoading={agentsQuery.isLoading}
        error={agentsQuery.error as Error | null}
        getRowId={(a) => a.agent_id}
        getRowTestId={(a) => `tenant-agent-row-${a.agent_id}`}
        onRowClick={(a) =>
          void navigate({
            to: "/tenants/$tenantId/agents/$agentId",
            params: { tenantId, agentId: a.agent_id },
            search: { sub: "run" },
          })
        }
        pagination={{
          pageIndex: page,
          pageSize: PAGE_SIZE,
          total,
          onPageChange: setPage,
        }}
        sorting={sorting}
        onSortingChange={handleSortingChange}
        manualSorting
        emptyState={{
          icon: IconMaterialSymbolsSmartToy,
          title: "No agents yet",
          description:
            "Create an agent to start receiving traces. Per-tenant agent-create lands in a follow-up PR.",
        }}
      />
    </Box>
  );
}

/** "Show deleted" toggle. Same styling/testid as `AgentsSearchPage`'s
 *  `ShowDeletedButton` — duplicated rather than shared because that page has
 *  no export for it and this table has no toolbar to hang a shared control
 *  from. */
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

/** Row actions — Activate / Restore only. Both are non-destructive
 *  (reversible with the row's own opposite action, no data loss), so a
 *  direct `mutate()` from the kebab is proportional to their risk. Deactivate
 *  and Soft-delete are destructive/disruptive enough to need their full
 *  confirmation copy (the cancellation contract, the drop-pressure warning) —
 *  they stay on `AgentSettingsPage`, one click away via "Open", rather than
 *  duplicated here without it. */
function RowActions({
  agent,
  onActivate,
  onRestore,
}: {
  agent: FakeAgent;
  onActivate: (agent: FakeAgent) => void;
  onRestore: (agent: FakeAgent) => void;
}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  const isDeleted = Boolean(agent.deleted_at);
  const isActive = !agent.deactivated_at;

  const activateReason = isDeleted
    ? "restore first"
    : isActive
      ? "already active"
      : null;
  const restoreReason = !isDeleted ? "soft-delete first" : null;

  return (
    <Box
      sx={{ display: "flex", justifyContent: "flex-end" }}
      onClick={(e) => e.stopPropagation()}
    >
      <IconButton
        ref={triggerRef}
        size="small"
        aria-label={`Actions for ${agent.name}`}
        // Row-scoped hook: the lifecycle e2e flow has to open a SPECIFIC
        // row's menu, and the id is what makes "this agent's actions" a
        // selector rather than a position in the table.
        data-testid={`row-actions-${agent.agent_id}`}
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
        <LadderMenuItem
          testId="row-action-activate"
          label="Activate"
          icon={<IconMaterialSymbolsToggleOn fontSize="small" sx={{ mr: 1 }} />}
          disabledReason={activateReason}
          onClick={() => {
            setOpen(false);
            onActivate(agent);
          }}
        />
        <LadderMenuItem
          testId="row-action-restore"
          label="Restore"
          icon={<IconMaterialSymbolsRestartAlt fontSize="small" sx={{ mr: 1 }} />}
          disabledReason={restoreReason}
          onClick={() => {
            setOpen(false);
            onRestore(agent);
          }}
        />
      </Menu>
    </Box>
  );
}

/** One ladder menu item. Mirrors `LadderActionButton` on `AgentSettingsPage`:
 *  a precondition failure renders `aria-disabled` (not native `disabled`),
 *  because a natively disabled `MenuItem` fires no pointer events and would
 *  never show the Tooltip naming the missing precondition. */
function LadderMenuItem({
  testId,
  label,
  icon,
  disabledReason,
  color,
  onClick,
}: {
  testId: string;
  label: string;
  icon: ReactNode;
  disabledReason: string | null;
  color?: string;
  onClick: () => void;
}) {
  const blocked = disabledReason != null;
  const item = (
    <MenuItem
      data-testid={testId}
      aria-disabled={blocked || undefined}
      tabIndex={blocked ? 0 : undefined}
      onClick={blocked ? undefined : onClick}
      sx={{ color: blocked ? "text.disabled" : color }}
    >
      {icon}
      {label}
    </MenuItem>
  );
  return blocked ? <Tooltip title={disabledReason}>{item}</Tooltip> : item;
}
