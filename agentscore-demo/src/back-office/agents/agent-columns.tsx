/** Flat agent-list column defs (agents-grouped-view spec §3.1 Feature 4, §4.6).
 *
 * Extracted from `AgentsSearchPage` so the List view and every expanded
 * `AgentGroupSection` table render the exact same columns from one
 * definition — the two surfaces cannot drift apart. This module exports only
 * the factory (not a component) — the cell renderers it composes live in
 * `activity-cells.tsx` (back-office-only cells) and
 * `shared/components/activity-cells.tsx` (the cells the customer list renders
 * too), so react-refresh doesn't have to fast-refresh a mix of components and
 * plain functions from one file.
 */

import Box from "@mui/material/Box";
import type { ColumnDef } from "@tanstack/react-table";

import type { FakeFlatAgentItem } from "@/back-office/agents/fake-data";
import {
  DeletedBadge,
  FitStatusCell,
  InactiveBadge,
  SourceCell,
} from "@/back-office/agents/activity-cells";
import {
  LastActiveCell,
  ScoreCell,
  TracesCell,
} from "@/shared/components/activity-cells";
import { Chip } from "@/shared/components/chip";
import { LifecycleChip } from "@/shared/components/lifecycle-chip";

/**
 * Column defs shared by the flat List view and each expanded
 * `AgentGroupSection` table (Agent / Tenant / Traces / Last active / Score).
 * A factory — not a module-level constant — so each caller's `useMemo` owns
 * a stable identity.
 */
export function flatAgentColumns(): ColumnDef<FakeFlatAgentItem, unknown>[] {
  return [
    {
      id: "name",
      header: "Agent",
      meta: { headerSx: { width: "25%" } },
      accessorFn: (i) => i.agent.name,
      // No `ProvisioningBadge` here any more: the Stage column's `connecting`
      // absorbs it and says more — the badge showed `pending`/`failed` with no
      // reason, where the stage carries `provision_failed`. Two indicators for
      // one fact is the thing this column set exists to stop.
      cell: ({ row }) => (
        <Box sx={{ minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
            <Box
              sx={{
                fontWeight: 500,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                minWidth: 0,
              }}
            >
              {row.original.agent.name}
            </Box>
            <DeletedBadge agent={row.original.agent} />
            <InactiveBadge agent={row.original.agent} />
          </Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              mt: 0.5,
              minWidth: 0,
            }}
          >
            <Chip tint={row.original.agent.kind === "internal" ? "info" : "muted"}>
              {row.original.agent.kind}
            </Chip>
            <SourceCell agent={row.original.agent} />
          </Box>
        </Box>
      ),
    },
    {
      id: "tenant",
      header: "Tenant",
      meta: { headerSx: { width: "10%" } },
      accessorFn: (i) => i.tenant_name ?? i.tenant_id,
      cell: ({ row }) => (
        <Box
          component="span"
          sx={{
            display: "block",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            color: "text.secondary",
          }}
        >
          {row.original.tenant_name ?? row.original.tenant_id}
        </Box>
      ),
    },
    {
      id: "traces",
      header: "Traces",
      // 10%, not the 6% the other small columns get: the header label plus its
      // sort button has a min-content width that `table-layout: fixed` still
      // honours, so a share below it made the TABLE overflow its container on a
      // narrow viewport — the whole last column clipped, not just this one.
      meta: { headerSx: { width: "10%" } },
      accessorFn: (i) => i.agent.forwarded_trace_count,
      cell: ({ row }) => <TracesCell agent={row.original.agent} />,
    },
    {
      id: "last_active",
      header: "Last active",
      meta: { headerSx: { width: "9%" } },
      accessorFn: (i) => i.agent.last_seen_at,
      cell: ({ row }) => <LastActiveCell agent={row.original.agent} />,
    },
    {
      id: "stage",
      header: "Stage",
      meta: { headerSx: { width: "18%" } },
      // Sits BEFORE Score deliberately: the stage answers "is that number
      // current, and is anything happening right now", which has to be read
      // first for the number beside it to mean anything. A row can show a
      // score and `Scoring…` at once — the number is the last finished run,
      // the chip is the one in flight.
      accessorFn: (i) => i.agent.lifecycle?.stage,
      // Display-only, same as the fit column: the backend `sort` Literal has
      // no "stage" value, so a client-side sort click would 422 the list.
      enableSorting: false,
      cell: ({ row }) => (
        <LifecycleChip
          lifecycle={row.original.agent.lifecycle}
          voice="operator"
          // This column is one share of a fixed-layout table; a `nowrap` chip
          // holding stage AND reason measured wider than that share and
          // printed over the Score cell. The reason moves to its own wrapping
          // line — the same two-line shape Score and Profile / Fit use.
          reasonBelow
          // The saga's own error text, which the chip's reason name reduces to
          // "provisioning failed". It was reachable on hover from the badge
          // this column replaced, and stays reachable from the state that
          // actually owns it.
          tooltip={
            row.original.agent.lifecycle?.reason === "provision_failed"
              ? row.original.agent.failure_reason
              : null
          }
          // Presentation-only: the stage keeps computing server-side for a
          // deactivated agent, but showing it here would read as live work on
          // an agent that has actually stopped. `InactiveBadge` beside the
          // name (above) is what explains the resulting blank cell — the two
          // land in the same PR on purpose, so the suppression is never
          // unexplained the way it was before this table had that badge.
          suppressed={Boolean(row.original.agent.deactivated_at)}
        />
      ),
    },
    {
      id: "score",
      header: "Score",
      meta: { headerSx: { width: "14%" } },
      accessorFn: (i) => i.agent.latest_score?.composite_score,
      cell: ({ row }) => <ScoreCell agent={row.original.agent} />,
    },
    {
      id: "fit",
      header: "Profile / Fit",
      meta: { headerSx: { width: "14%" } },
      accessorFn: (i) => i.fit_status?.state,
      // Display-only (spec §1.3/§4.6 — no fit sort): the backend `sort`
      // Literal has no "fit" value, so a client-side sort click would send
      // `sort=fit` and 422 the whole list. DataTable defaults
      // `enableSorting=true` and TanStack's `getCanSort()` returns true for
      // any column with an `accessorFn`, so this must be explicit.
      enableSorting: false,
      cell: ({ row }) => <FitStatusCell item={row.original} />,
    },
  ];
}
