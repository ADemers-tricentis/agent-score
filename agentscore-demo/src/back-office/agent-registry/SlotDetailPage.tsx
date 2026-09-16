/** SlotDetailPage — `/agent-registry/slots/$slotSlug`. The slot's contract,
 *  its current binding, and its version lineage (spec S14a §3).
 *
 * "New version" and "Reassign" are the two write affordances this page
 * exposes; in Global scope both render disabled with a stated reason for a
 * non-superadmin (D10) rather than relying on the API's own 403.
 *
 * The current binding's version NAME (not just its id/number) comes from
 * `useRegistryVersion`, not `useRegistrySlots` — the slots listing carries
 * only the bound version's id and number. In tenant scope the bound version
 * can itself be a global row (the tenant has no override and falls back), so
 * target lookup scans both tenant and global pages to resolve it.
 */

import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearch } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import BreadcrumbsItem from "@tricentis/aura/components/BreadcrumbsItem.js";
import IconMaterialSymbolsAdd from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsAdd.mjs";
import IconMaterialSymbolsChat from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsChat.mjs";
import type { ColumnDef } from "@tanstack/react-table";

import {
  MAX_VERSIONS_OFFSET,
  useBindableVersions,
  useRegistrySlots,
  useRegistryVersion,
  useSlotVersions,
  type AgentVersionRead,
  type SlotRead,
  type TenantSlotRead,
} from "@/back-office/agent-registry/api";
import { ReassignBindingDialog } from "@/back-office/agent-registry/components/ReassignBindingDialog";
import { formatDollarCeiling } from "@/back-office/agent-registry/format";
import { RegistryErrorAlert } from "@/back-office/agent-registry/components/RegistryErrorAlert";
import type { RegistryScopeSearch } from "@/back-office/agent-registry/scope-params";
import { detailCode } from "@/shared/api/errors";
import { Chip, ChipStrip } from "@/shared/components/chip";
import { DataTable } from "@/shared/components/data-table";
import { EntityShell } from "@/shared/components/entity-shell";
import { FormSection } from "@/shared/components/form-section";
import { JsonViewer } from "@/shared/components/json-viewer";
import { NotFoundState } from "@/shared/components/not-found-state";

const SLOT_VERSIONS_PAGE_SIZE = 200;

function dedupeById(versions: AgentVersionRead[]): AgentVersionRead[] {
  const seen = new Set<string>();
  const deduped: AgentVersionRead[] = [];
  for (const v of versions) {
    if (seen.has(v.id)) continue;
    seen.add(v.id);
    deduped.push(v);
  }
  return deduped;
}

/** The slot's own bound-version id/number, resolved for the current scope. */
function boundVersionRef(
  slot: SlotRead | TenantSlotRead,
  tenantId: string | null,
): { id: string | null; number: number | null } {
  if (tenantId === null) {
    const s = slot as SlotRead;
    return { id: s.globalVersionId, number: s.globalVersionNumber };
  }
  const s = slot as TenantSlotRead;
  return { id: s.boundVersionId, number: s.boundVersionNumber };
}

export function SlotDetailPage() {
  const { slotSlug } = useParams({ strict: false }) as { slotSlug: string };
  const search = useSearch({ strict: false }) as RegistryScopeSearch;
  const tenantId = search.tenant ?? null;
  const navigate = useNavigate();

  const slotsQuery = useRegistrySlots(tenantId);
  const slot = (slotsQuery.data ?? []).find((s) => s.slug === slotSlug);

  const bound = slot ? boundVersionRef(slot, tenantId) : { id: null, number: null };
  const boundQuery = useRegistryVersion({ tenantId, slotSlug, versionId: bound.id });
  const currentVersion = boundQuery.data;

  const bindable = useBindableVersions({ tenantId, slotSlug });
  const bindableLoading = bindable.tenant.isLoading || bindable.global.isLoading;

  const [offset, setOffset] = useState(0);
  const [pages, setPages] = useState<AgentVersionRead[][]>([]);
  const versionsQuery = useSlotVersions({
    tenantId,
    slotSlug,
    limit: SLOT_VERSIONS_PAGE_SIZE,
    offset,
  });

  // Scope switch or a different slot resets paging — the accumulated pages
  // belong to the previous scope/slot's lineage, not this one's.
  useEffect(() => {
    setOffset(0);
    setPages([]);
  }, [tenantId, slotSlug]);

  useEffect(() => {
    if (versionsQuery.data) {
      setPages((prev) => {
        const next = [...prev];
        next[offset / SLOT_VERSIONS_PAGE_SIZE] = versionsQuery.data!;
        return next;
      });
    }
  }, [versionsQuery.data, offset]);

  const versions = useMemo(() => dedupeById(pages.flat()), [pages]);
  const lastPageFull = (versionsQuery.data?.length ?? 0) === SLOT_VERSIONS_PAGE_SIZE;

  const [reassignOpen, setReassignOpen] = useState(false);

  // No auth backend in this clone (precedent set across every other
  // section) — the operator is always treated as a superadmin.
  const globalLocked = false;

  if (slotsQuery.isLoading) {
    return (
      <Stack sx={{ gap: 2, px: 4, py: 3 }}>
        <Skeleton variant="rounded" sx={{ height: 48, width: "33%" }} />
        <Skeleton variant="rounded" sx={{ height: 160, width: "100%" }} />
      </Stack>
    );
  }

  if (!slot) {
    // The slug can be absent from the list for two different reasons: it
    // genuinely names no slot, or a scoped query (`useSlotVersions`, which
    // 404s per-slug) refused with a coded envelope that a bare list lookup
    // would otherwise discard. Wait for that query to settle before deciding
    // which one this is, so a refusal never gets misreported as "not found".
    const codedError = detailCode(versionsQuery.error)
      ? versionsQuery.error
      : detailCode(slotsQuery.error)
        ? slotsQuery.error
        : null;

    if (!codedError && versionsQuery.isLoading) {
      return (
        <Stack sx={{ gap: 2, px: 4, py: 3 }}>
          <Skeleton variant="rounded" sx={{ height: 48, width: "33%" }} />
          <Skeleton variant="rounded" sx={{ height: 160, width: "100%" }} />
        </Stack>
      );
    }

    const backToRegistry = (
      <Button
        variant="outlined"
        component={Link}
        to="/agent-registry"
        // No `Register` augmentation on this router — `to`/`search`/`params`
        // are untyped, so a `component={Link}` object literal needs this cast
        // (the repo-wide idiom, see RunDetailPage.tsx).
        search={(tenantId ? { tenant: tenantId } : {}) as never}
      >
        Back to Agent Registry
      </Button>
    );

    if (codedError) {
      return (
        <Stack sx={{ gap: 2, px: 4, py: 6, maxWidth: 640 }}>
          <RegistryErrorAlert error={codedError} fallback="Failed to load this slot" />
          {backToRegistry}
        </Stack>
      );
    }

    return <NotFoundState entity="Slot" action={backToRegistry} />;
  }

  // A failed lineage query reads as `[]`, identical to the genuine bootstrap
  // case — without this flag "New version" would send the operator to the
  // from-scratch form (no `baseVersionId`) instead of surfacing the refusal.
  const bindableError = bindable.tenant.isError || bindable.global.isError;

  const newestByCreatedAt = [...bindable.versions].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  const newestNonRevoked = newestByCreatedAt.find((v) => v.revokedAt === null);
  // Publishing N+1 is the documented recovery path when every version in the
  // lineage has been revoked — falling back to the newest revoked version as
  // the copy source keeps that path reachable. The API only checks slot/tenant
  // ownership on `base_version_id`, never `revoked_at`, so this is permitted.
  const copySource = newestNonRevoked ?? newestByCreatedAt[0];
  const isBootstrap = !bindableLoading && !bindableError && bindable.versions.length === 0;

  // The table is `tableLayout: "fixed"`, so a cell never widens to fit its
  // content — an unbreakable string just overflows, and a right-aligned one
  // bleeds left across its neighbour. The two free-text columns break a long
  // token rather than overflow ("break-word", not "anywhere": it breaks only
  // when the word cannot fit, so an ordinary name still wraps at its spaces).
  const breakLongWords = { overflowWrap: "break-word" as const };

  const versionColumns: ColumnDef<AgentVersionRead, unknown>[] = [
    {
      id: "number",
      header: "#",
      accessorFn: (v) => v.versionNumber,
      meta: { headerSx: { width: "8%" } },
      cell: ({ row }) => `#${row.original.versionNumber}`,
    },
    {
      id: "name",
      header: "Name",
      accessorFn: (v) => v.name,
      meta: { headerSx: { width: "30%" }, cellSx: breakLongWords },
    },
    {
      id: "model",
      header: "Model",
      accessorFn: (v) => `${v.modelProvider}/${v.modelId}`,
      meta: { headerSx: { width: "38%" }, cellSx: breakLongWords },
      cell: ({ row }) => (
        <Box component="span" sx={{ fontFamily: "monospace", typography: "caption" }}>
          {row.original.modelProvider}/{row.original.modelId}
        </Box>
      ),
    },
    {
      id: "ceiling",
      header: "$ ceiling",
      accessorFn: (v) => v.dollarCeilingUsd,
      // A formatted amount is atomic — `nowrap` so it never breaks across
      // lines the way "$1.00" did at a narrow viewport.
      meta: {
        headerSx: { width: "14%" },
        cellSx: { textAlign: "right", whiteSpace: "nowrap" },
      },
      cell: ({ row }) => formatDollarCeiling(row.original.dollarCeilingUsd),
    },
    {
      id: "revoked",
      header: "",
      meta: { headerSx: { width: "10%" } },
      cell: ({ row }) =>
        row.original.revokedAt ? <Chip tint="destructive">Revoked</Chip> : null,
    },
  ];

  return (
    <EntityShell
      testId="slot-detail"
      breadcrumb={
        <Breadcrumbs aria-label="breadcrumb">
          <BreadcrumbsItem
            component={Link}
            to="/agent-registry"
            search={(tenantId ? { tenant: tenantId } : {}) as never}
            label="Agent Registry"
          />
          <Typography component="span" variant="body2" color="text.primary" aria-current="page">
            {slot.slug}
          </Typography>
        </Breadcrumbs>
      }
      title={slot.slug}
      meta={slot.description ? <Box component="span">{slot.description}</Box> : undefined}
      actions={
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 0.5 }}>
          <Box sx={{ display: "flex", gap: 1 }}>
            {/* The only coupling between the registry and the chat surface
                (spec `s11b-chat-surface`, Nav.dc.html): an operator who has
                just bound a version can go try it. Gated to this one slot's
                slug rather than every slot's page. */}
            {slot.slug === "chat_assistant" ? (
              <Button
                variant="outlined"
                component={Link}
                to="/assistant"
                data-testid="slot-open-assistant"
                startIcon={<IconMaterialSymbolsChat sx={{ fontSize: 16 }} />}
              >
                Open Assistant
              </Button>
            ) : null}
            <Button
              variant="contained"
              data-testid="new-version-button"
              disabled={globalLocked || bindableLoading || bindableError}
              startIcon={<IconMaterialSymbolsAdd sx={{ fontSize: 16 }} />}
              onClick={() =>
                void navigate({
                  to: "/agent-registry/slots/$slotSlug/versions/new",
                  params: { slotSlug },
                  search: {
                    ...(tenantId ? { tenant: tenantId } : {}),
                    ...(isBootstrap ? {} : { from: copySource?.id }),
                  },
                })
              }
            >
              New version
            </Button>
          </Box>
          {globalLocked ? (
            <Typography variant="caption" color="text.secondary" data-testid="global-write-locked">
              Only superadmins can publish versions in Global scope.
            </Typography>
          ) : null}
          {!globalLocked && (bindable.tenant.error ?? bindable.global.error) ? (
            <Box sx={{ maxWidth: 320 }}>
              <RegistryErrorAlert
                error={bindable.tenant.error ?? bindable.global.error}
                fallback="Failed to load this slot's version history — can't determine whether creating a version is safe."
              />
            </Box>
          ) : null}
        </Box>
      }
    >
      <Box sx={{ px: 4, py: 3 }}>
        <Stack sx={{ maxWidth: 1024, gap: 3 }}>
          <FormSection
            title="Slot contract"
            description="The output contract and tool allowlist every version of this slot must satisfy."
          >
            <JsonViewer value={slot.outputContract} />
            <ChipStrip>
              {slot.toolAllowlist.length === 0 ? (
                <Typography variant="caption" color="text.secondary">
                  No tools allowed.
                </Typography>
              ) : (
                slot.toolAllowlist.map((tool) => <Chip key={tool}>{tool}</Chip>)
              )}
            </ChipStrip>
            <ChipStrip>
              <Chip tint={slot.readOnly ? "warning" : "muted"}>
                {slot.readOnly ? "Read-only" : "Writable"}
              </Chip>
              <Chip tint="outline">{slot.priorityClass}</Chip>
            </ChipStrip>
          </FormSection>

          <FormSection
            title="Current binding"
            description="The version this slot serves in the selected scope."
          >
            <Box>
              {bound.id && boundQuery.isLoading ? (
                <Skeleton
                  variant="rounded"
                  sx={{ height: 40, width: "40%" }}
                  data-testid="current-binding-loading"
                />
              ) : boundQuery.isError ? (
                <RegistryErrorAlert error={boundQuery.error} fallback="Failed to load the bound version" />
              ) : currentVersion ? (
                <>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {currentVersion.name} · #{currentVersion.versionNumber}
                  </Typography>
                  {tenantId !== null && "source" in slot && slot.source ? (
                    <Chip tint={slot.source === "global" ? "muted" : "info"} sx={{ mt: 0.5, display: "block" }}>
                      {slot.source}
                    </Chip>
                  ) : null}
                </>
              ) : bound.id ? (
                <>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {bound.number != null ? `#${bound.number}` : bound.id}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Bound to a version not found in this slot's lineage — its name isn't available here.
                  </Typography>
                  {tenantId !== null && "source" in slot && slot.source ? (
                    <Chip tint={slot.source === "global" ? "muted" : "info"} sx={{ mt: 0.5, display: "block" }}>
                      {slot.source}
                    </Chip>
                  ) : null}
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Unbound — no version currently serves this slot in this scope.
                </Typography>
              )}
              {bound.id !== null && slot.boundVersionRevoked ? (
                <>
                  <Chip tint="destructive" sx={{ mt: 0.5, display: "block" }}>
                    Revoked
                  </Chip>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                    This slot cannot serve traffic — every run through it refuses with
                    "version revoked". Reassign it to a live version.
                  </Typography>
                </>
              ) : null}
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 0.5 }}>
              <Button
                variant="outlined"
                data-testid="slot-reassign"
                disabled={globalLocked}
                onClick={() => setReassignOpen(true)}
              >
                Reassign
              </Button>
              {globalLocked ? (
                <Typography variant="caption" color="text.secondary" data-testid="global-write-locked">
                  Only superadmins can reassign bindings in Global scope.
                </Typography>
              ) : null}
            </Box>
          </FormSection>

          <FormSection
            title="Versions"
            description="Every version of this slot in the selected scope, newest first."
          >
            <DataTable
              columns={versionColumns}
              data={versions}
              isLoading={versions.length === 0 && versionsQuery.isLoading}
              error={versionsQuery.error as Error | null}
              getRowId={(v) => v.id}
              getRowTestId={(v) => `version-row-${v.id}`}
              onRowClick={(v) =>
                void navigate({
                  to: "/agent-registry/slots/$slotSlug/versions/$versionId",
                  params: { slotSlug, versionId: v.id },
                  search: tenantId ? { tenant: tenantId } : {},
                })
              }
              // `fixed` makes the percentage widths above binding. The floor
              // is what makes it responsive rather than merely proportional:
              // below it the five columns would compress past legibility (at
              // 375px the amount and the "#n" both overflowed their cells), so
              // TableContainer's own horizontal scroll takes over instead.
              tableSx={{ tableLayout: "fixed", minWidth: 480 }}
              emptyState={{ title: "No versions yet", testId: "version-list-empty" }}
              enableSorting={false}
            />
            {lastPageFull && offset < MAX_VERSIONS_OFFSET ? (
              <Box sx={{ display: "flex", justifyContent: "center" }}>
                <Button
                  variant="outlined"
                  size="small"
                  data-testid="load-more-versions"
                  onClick={() => setOffset((o) => o + SLOT_VERSIONS_PAGE_SIZE)}
                  disabled={versionsQuery.isLoading}
                >
                  Load more
                </Button>
              </Box>
            ) : null}
            {lastPageFull && offset === MAX_VERSIONS_OFFSET ? (
              <Typography variant="caption" data-testid="version-history-truncated">
                Version history is incomplete at the server limit. Ask an administrator to increase the history limit to access older versions.
              </Typography>
            ) : null}
          </FormSection>
        </Stack>
      </Box>

      <ReassignBindingDialog
        open={reassignOpen}
        onClose={() => setReassignOpen(false)}
        tenantId={tenantId}
        slotSlug={slotSlug}
        currentVersionId={bound.id}
      />
    </EntityShell>
  );
}
