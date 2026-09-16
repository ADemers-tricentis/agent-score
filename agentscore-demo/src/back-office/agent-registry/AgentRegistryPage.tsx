/** AgentRegistryPage — the Registry tab of the merged Agent Registry page,
 *  at `/agent-registry`. Every task slot plus which agent version currently
 *  serves it, scoped Global or to one tenant (spec S14a §2 "Global vs
 *  per-tenant: two page trees or one?").
 *
 * `SlotRead` (global) carries no `source`/`stale` field — those only exist on
 * `TenantSlotRead` — so those two columns render only in tenant scope rather
 * than as an always-present, sometimes-blank pair.
 *
 * Neither `SlotRead` nor `TenantSlotRead` carries the bound version's NAME,
 * only its id and number (`globalVersionNumber` / `boundVersionNumber`) — the
 * bound-version cell below can only show "#N", not a name, without an N+1
 * fetch per row this listing has no route to avoid.
 */

import { useMemo } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import IconMaterialSymbolsAccountTree from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsAccountTree.mjs";
import type { ColumnDef } from "@tanstack/react-table";

import {
  useRegistrySlots,
  type SlotRead,
  type TenantSlotRead,
} from "@/back-office/agent-registry/api";
import { RegistryErrorAlert } from "@/back-office/agent-registry/components/RegistryErrorAlert";
import { ScopeSwitcher } from "@/back-office/agent-registry/components/ScopeSwitcher";
import type { RegistryScopeSearch } from "@/back-office/agent-registry/scope-params";
import { Chip } from "@/shared/components/chip";
import { DataTable } from "@/shared/components/data-table";
import { pageContentPaddingSx } from "@/shared/components/page-content";
import { PageBand } from "@/shared/components/page-band";
import { ScrollRegion } from "@/shared/components/scroll-region";

type SlotRow = SlotRead | TenantSlotRead;

function BoundVersionCell({ row, tenantId }: { row: SlotRow; tenantId: string | null }) {
  const versionNumber =
    tenantId === null
      ? (row as SlotRead).globalVersionNumber
      : (row as TenantSlotRead).boundVersionNumber;
  if (versionNumber == null) {
    return (
      <Box component="span" sx={{ color: "text.secondary" }}>
        Unbound
      </Box>
    );
  }
  return (
    <Box component="span" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
      <Box component="span" sx={{ fontFamily: "monospace" }}>#{versionNumber}</Box>
      {row.boundVersionRevoked ? (
        <Chip tint="destructive" data-testid={`slot-bound-version-revoked-${row.slug}`}>
          Revoked
        </Chip>
      ) : null}
    </Box>
  );
}

function ModelCell({ row }: { row: SlotRow }) {
  // Both fields are null together — the slot is unbound, so there is no version
  // to have a model. Rendered as an em dash rather than a blank cell so "no
  // binding" reads as a stated fact instead of a value that failed to load.
  if (!row.boundVersionModelProvider || !row.boundVersionModelId) {
    return (
      <Box component="span" sx={{ color: "text.secondary" }}>
        —
      </Box>
    );
  }
  return (
    <Box
      component="span"
      sx={{ fontFamily: "monospace", typography: "caption", overflowWrap: "break-word" }}
    >
      {row.boundVersionModelProvider}/{row.boundVersionModelId}
    </Box>
  );
}

function SourceCell({ row }: { row: TenantSlotRead }) {
  if (!row.source) {
    return (
      <Box component="span" sx={{ color: "text.secondary" }}>
        —
      </Box>
    );
  }
  return <Chip tint={row.source === "global" ? "muted" : "info"}>{row.source}</Chip>;
}

function StalenessCell({ row }: { row: TenantSlotRead }) {
  if (!row.stale) return null;
  return (
    <Tooltip title="The bound version's global ancestor is no longer the version the slot's global binding serves.">
      <Box component="span">
        <Chip tint="warning" data-testid={`slot-stale-${row.slug}`}>
          Stale
        </Chip>
      </Box>
    </Tooltip>
  );
}

export function AgentRegistryPage() {
  const search = useSearch({ strict: false }) as RegistryScopeSearch;
  const tenantId = search.tenant ?? null;
  const navigate = useNavigate();

  const slotsQuery = useRegistrySlots(tenantId);
  const slots = (slotsQuery.data ?? []) as SlotRow[];

  const columns = useMemo<ColumnDef<SlotRow, unknown>[]>(() => {
    const cols: ColumnDef<SlotRow, unknown>[] = [
      {
        id: "slot",
        header: "Slot",
        accessorFn: (row) => row.slug,
        meta: { headerSx: { width: tenantId === null ? "34%" : "26%" } },
        cell: ({ row }) => (
          <Box sx={{ display: "flex", minWidth: 0, flexDirection: "column" }}>
            <Box
              component="span"
              sx={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontFamily: "monospace",
              }}
            >
              {row.original.slug}
            </Box>
            {row.original.description ? (
              <Box
                component="span"
                sx={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  typography: "caption",
                  color: "text.secondary",
                }}
              >
                {row.original.description}
              </Box>
            ) : null}
          </Box>
        ),
      },
      {
        id: "bound-version",
        header: "Bound version",
        accessorFn: (row) =>
          tenantId === null
            ? (row as SlotRead).globalVersionNumber
            : (row as TenantSlotRead).boundVersionNumber,
        meta: { headerSx: { width: tenantId === null ? "22%" : "18%" } },
        cell: ({ row }) => <BoundVersionCell row={row.original} tenantId={tenantId} />,
      },
    ];

    if (tenantId !== null) {
      cols.push(
        {
          id: "source",
          header: "Source",
          accessorFn: (row) => (row as TenantSlotRead).source,
          meta: { headerSx: { width: "14%" } },
          cell: ({ row }) => <SourceCell row={row.original as TenantSlotRead} />,
        },
        {
          id: "staleness",
          header: "Staleness",
          accessorFn: (row) => (row as TenantSlotRead).stale,
          meta: { headerSx: { width: "14%" } },
          cell: ({ row }) => <StalenessCell row={row.original as TenantSlotRead} />,
        },
      );
    }

    cols.push(
      {
        id: "model",
        header: "Model",
        accessorFn: (row) =>
          row.boundVersionModelProvider && row.boundVersionModelId
            ? `${row.boundVersionModelProvider}/${row.boundVersionModelId}`
            : null,
        meta: {
          headerSx: { width: tenantId === null ? "32%" : "22%" },
          cellSx: { overflowWrap: "break-word" },
        },
        cell: ({ row }) => <ModelCell row={row.original} />,
      },
      {
        id: "tools",
        header: "Tools",
        accessorFn: (row) => row.toolAllowlist.length,
        meta: {
          headerSx: { width: tenantId === null ? "12%" : "6%" },
          cellSx: { textAlign: "right" },
        },
        cell: ({ row }) => row.original.toolAllowlist.length,
      },
    );

    return cols;
  }, [tenantId]);

  return (
    <Box sx={{ display: "flex", minHeight: 0, flex: 1, flexDirection: "column" }}>
      <PageBand sx={{ py: 2 }}>
        <Box sx={{ maxWidth: 320 }}>
          <ScopeSwitcher
            tenantId={tenantId}
            onChange={(nextTenantId) =>
              void navigate({
                to: "/agent-registry",
                search: nextTenantId ? { tenant: nextTenantId } : {},
              })
            }
          />
        </Box>
      </PageBand>

      <ScrollRegion>
        <Box sx={pageContentPaddingSx}>
          {slotsQuery.error ? (
            // `DataTable`'s own error row renders only `error.message` — no
            // code, no explanation (a third swallow site). Replace the table
            // with the shared alert so the coded refusal reaches the operator
            // the same way every other registry mutation/read does.
            <RegistryErrorAlert error={slotsQuery.error} fallback="Failed to load task slots" />
          ) : (
            <DataTable
              columns={columns}
              data={slots}
              isLoading={slotsQuery.isLoading}
              error={null}
              getRowId={(s) => s.id}
              getRowTestId={(s) => `slot-row-${s.slug}`}
              onRowClick={(s) =>
                void navigate({
                  to: "/agent-registry/slots/$slotSlug",
                  params: { slotSlug: s.slug },
                  search: tenantId ? { tenant: tenantId } : {},
                })
              }
              tableSx={{ tableLayout: "fixed" }}
              emptyState={{
                icon: IconMaterialSymbolsAccountTree,
                title: "No task slots",
                description: "This scope has no task slots to show.",
                testId: "registry-empty",
              }}
              enableSorting={false}
            />
          )}
        </Box>
      </ScrollRegion>
    </Box>
  );
}
