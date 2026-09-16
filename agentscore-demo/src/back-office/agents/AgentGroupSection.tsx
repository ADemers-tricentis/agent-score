/** Grouped agents view — collapsible per-group section + lazy per-group
 *  table (agents-grouped-view spec §3.1 Features 1/3/4, §4.6, §6.6).
 *
 * `AgentGroupsView` fetches the group rollups (`GET /admin/agents/groups`)
 * for the current axis + filters and renders one collapsed `AgentGroupSection`
 * per group. Each section lazily fetches — and paginates/sorts — only its own
 * agents (`listAgentsFlat` with the group's key as the matching axis param)
 * once expanded; collapsing keeps the fetched page cached. No Accordion
 * primitive exists in the repo (§4.6) — this is a header `<button>` +
 * conditional render, matching the chevron-toggle convention already used by
 * `InternalTenants` (ingestion tab).
 */

import { focusRing } from "@/shared/theme/focus-ring";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import IconMaterialSymbolsChevronRight from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsChevronRight.mjs";
import IconMaterialSymbolsKeyboardArrowDown from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsKeyboardArrowDown.mjs";
import IconMaterialSymbolsSmartToy from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsSmartToy.mjs";
import type { OnChangeFn, SortingState } from "@tanstack/react-table";

import { flatAgentColumns } from "@/back-office/agents/agent-columns";
import { listAgentGroups, listAgentsFlat, type ListAgentsFlatFakeParams } from "@/back-office/agents/fake-data";
import { fmtRelative } from "@/back-office/ingestion/format";
import { Chip } from "@/shared/components/chip";
import { DataTable } from "@/shared/components/data-table";
import { EmptyState } from "@/shared/components/empty-state";

type AgentGroupBy = "tenant" | "source" | "kind";
type AgentGroup = ReturnType<typeof listAgentGroups>["groups"][number];

const GROUP_PAGE_SIZE = 25;

/** The scalar filter contract for Grouped view (spec §3.1 Feature 3) — `q` +
 *  `includeDeleted` always apply; `tenantId`/`kind` are the single-select
 *  facets that aren't superseded by the current group-by axis. `source` is
 *  intentionally absent: it is axis-only in Grouped view (no secondary
 *  Source filter is offered off the flat page). */
export interface GroupedFilters {
  q?: string;
  includeDeleted?: boolean;
  tenantId?: string;
  kind?: "internal" | "external";
}

/** The group's key mapped onto the matching `listAgentsFlat` axis param
 *  (spec §3.1 Feature 4: `by=tenant` → `tenant_id`, `by=source` → `source`,
 *  `by=kind` → `kind`). */
function axisOverride(
  by: AgentGroupBy,
  key: string,
): Pick<ListAgentsFlatFakeParams, "tenantId" | "source" | "kind"> {
  if (by === "tenant") return { tenantId: key };
  if (by === "source") return { source: key };
  return { kind: key as "internal" | "external" };
}

export function AgentGroupsView({
  by,
  filters,
  refetchInterval: _refetchInterval,
}: {
  by: AgentGroupBy;
  filters: GroupedFilters;
  /** Poll period in ms, or null/undefined for off — unused now that groups
   *  come from an in-memory fixture instead of a polled query. */
  refetchInterval?: number | null;
}) {
  const groups = useMemo(
    () =>
      listAgentGroups({
        by,
        q: filters.q || undefined,
        includeDeleted: filters.includeDeleted,
        tenantId: filters.tenantId,
        kind: filters.kind,
      }).groups,
    [by, filters.q, filters.includeDeleted, filters.tenantId, filters.kind],
  );

  if (groups.length === 0) {
    return (
      <EmptyState
        icon={IconMaterialSymbolsSmartToy}
        title="No agents found"
        description={
          filters.q
            ? "Try a different search term, or toggle Show deleted."
            : "Create an agent to see groups here."
        }
        testId="agent-groups-empty"
      />
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {groups.map((group) => (
        <AgentGroupSection
          key={group.key}
          group={group}
          by={by}
          filters={filters}
          refetchInterval={_refetchInterval}
        />
      ))}
    </Box>
  );
}

export function AgentGroupSection({
  group,
  by,
  filters,
  refetchInterval: _refetchInterval,
}: {
  group: AgentGroup;
  by: AgentGroupBy;
  filters: GroupedFilters;
  refetchInterval?: number | null;
}) {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "last_active", desc: true },
  ]);
  const navigate = useNavigate();
  const columns = useMemo(() => flatAgentColumns(), []);

  const handleSortingChange: OnChangeFn<SortingState> = (updater) => {
    setPage(0);
    setSorting(updater);
  };
  const sort = sorting[0]?.id as "last_active" | "name" | "score" | undefined;
  const dir = sorting[0] ? (sorting[0].desc ? "desc" : "asc") : undefined;

  // A parent filter change shrinks the result set; reset to page 0 so a stale
  // offset can't land past the new end (empty body + nonsensical "51–50 of 5").
  useEffect(() => {
    setPage(0);
  }, [filters.q, filters.includeDeleted, filters.tenantId, filters.kind]);

  const params: ListAgentsFlatFakeParams = useMemo(
    () => ({
      limit: GROUP_PAGE_SIZE,
      offset: page * GROUP_PAGE_SIZE,
      includeDeleted: filters.includeDeleted,
      q: filters.q || undefined,
      sort,
      dir,
      tenantId: filters.tenantId,
      kind: filters.kind,
      ...axisOverride(by, group.key),
    }),
    [page, filters.includeDeleted, filters.q, filters.tenantId, filters.kind, sort, dir, by, group.key],
  );

  const { items, total } = useMemo(() => (open ? listAgentsFlat(params) : { items: [], total: group.count }), [open, params, group.count]);

  return (
    <Box
      data-slot="agent-group-section"
      data-testid={`agent-group-${group.key}`}
      sx={{ border: 1, borderColor: "divider", borderRadius: 1.25, overflow: "hidden" }}
    >
      <Box
        component="button"
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        data-testid={`agent-group-header-${group.key}`}
        sx={[focusRing, {
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          width: "100%",
          p: 1.5,
          border: 0,
          background: "none",
          font: "inherit",
          textAlign: "left",
          cursor: "pointer",
          "&:hover": { bgcolor: "action.hover" },
        }]}
      >
        {open ? (
          <IconMaterialSymbolsKeyboardArrowDown
            sx={{ fontSize: 18, color: "text.secondary", flexShrink: 0 }}
          />
        ) : (
          <IconMaterialSymbolsChevronRight
            sx={{ fontSize: 18, color: "text.secondary", flexShrink: 0 }}
          />
        )}
        <Box sx={{ fontWeight: 500, flexShrink: 0 }}>{group.label}</Box>
        <Chip tint="muted">{group.count}</Chip>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, ml: "auto", flexShrink: 0 }}>
          <Chip tint="outline">Σ {group.rollup.total_traces} traces</Chip>
          <Chip tint="outline">{fmtRelative(group.rollup.last_active)}</Chip>
          <Chip tint="outline">{group.rollup.scored_count} scored</Chip>
        </Box>
      </Box>

      {open ? (
        <Box sx={{ borderTop: 1, borderColor: "divider", p: 1.5 }}>
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
              title: "No agents in this group",
            }}
            pagination={{
              pageIndex: page,
              pageSize: GROUP_PAGE_SIZE,
              total,
              onPageChange: setPage,
            }}
            sorting={sorting}
            onSortingChange={handleSortingChange}
            manualSorting
          />
        </Box>
      ) : null}
    </Box>
  );
}
