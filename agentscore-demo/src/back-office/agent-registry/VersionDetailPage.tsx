/** VersionDetailPage — `/agent-registry/slots/$slotSlug/versions/$versionId`.
 *
 * There is no `GET /admin/agent-registry/versions/{id}` route (spec finding
 * F1) — the target version is found inside the slot's own paginated lineage
 * for BOTH the current scope and global, and
 * resolved from whichever list has it. A tenant binding can point at a global
 * version (no tenant override yet), so the tenant list alone is not enough.
 *
 * Every field renders read-only: the registry is append-only, so "edit"
 * means publishing a new version via "New version from this", which prefills
 * the create form from this row and sends it as `baseVersionId`.
 */

import { useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearch } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import BreadcrumbsItem from "@tricentis/aura/components/BreadcrumbsItem.js";
import IconMaterialSymbolsAdd from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsAdd.mjs";
import IconMaterialSymbolsBlock from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsBlock.mjs";

import {
  useRegistrySlots,
  useVersionLineage,
  type SlotBindingImpact,
  type SlotRead,
  type TenantSlotRead,
} from "@/back-office/agent-registry/api";
import { RegistryErrorAlert } from "@/back-office/agent-registry/components/RegistryErrorAlert";
import { RevokeVersionDialog } from "@/back-office/agent-registry/components/RevokeVersionDialog";
import { buildLineage } from "@/back-office/agent-registry/lineage";
import type { RegistryScopeSearch } from "@/back-office/agent-registry/scope-params";
import { Chip, ChipStrip } from "@/shared/components/chip";
import { CodeBlock } from "@/shared/components/code-block";
import { DangerZone } from "@/shared/components/danger-zone";
import { EntityShell } from "@/shared/components/entity-shell";
import { FormSection } from "@/shared/components/form-section";
import { NotFoundState } from "@/shared/components/not-found-state";

function FieldRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
      <Typography variant="subtitle2" color="text.secondary">
        {label}
      </Typography>
      <Box sx={{ typography: "body2" }}>{value}</Box>
    </Box>
  );
}

export function VersionDetailPage() {
  const { slotSlug, versionId } = useParams({ strict: false }) as {
    slotSlug: string;
    versionId: string;
  };
  const search = useSearch({ strict: false }) as RegistryScopeSearch;
  const tenantId = search.tenant ?? null;
  const navigate = useNavigate();

  const lineageQuery = useVersionLineage({ tenantId, slotSlug, versionId });
  const byId = useMemo(
    () => new Map((lineageQuery.data ?? []).map((version) => [version.id, version])),
    [lineageQuery.data],
  );
  const version = byId.get(versionId);
  const loading = lineageQuery.isLoading;

  const slotsQuery = useRegistrySlots(tenantId);
  const visibleBindings: SlotBindingImpact[] = useMemo(() => {
    const slots = slotsQuery.data ?? [];
    const impacts: SlotBindingImpact[] = [];
    for (const s of slots) {
      const boundId =
        tenantId === null ? (s as SlotRead).globalVersionId : (s as TenantSlotRead).boundVersionId;
      if (boundId !== versionId) continue;
      // In tenant scope, `boundVersionId` can be served by the TENANT's own
      // binding or, when the tenant has none yet, by a fallback to the
      // GLOBAL one (`TenantSlotRead.source`) — hardcoding `isGlobal: false`
      // here would invent a tenant binding that doesn't exist.
      const isGlobalBinding =
        tenantId === null || (s as TenantSlotRead).source === "global";
      impacts.push({
        // Not a real binding id — no route returns one before revocation
        // (spec finding F2), so this can never correlate with the server's
        // own `affectedBindings` ids post-revoke. Prefixed so it is never
        // mistaken for one; the slot it names is scope-local to this read.
        id: `slot-local:${s.id}`,
        slotSlug: s.slug,
        tenantId: isGlobalBinding ? null : tenantId,
        isGlobal: isGlobalBinding,
      });
    }
    return impacts;
  }, [slotsQuery.data, tenantId, versionId]);

  const [revokeOpen, setRevokeOpen] = useState(false);
  // No auth backend in this clone (precedent set across every other
  // section) — the operator is always treated as a superadmin.
  const globalLocked = false;

  if (loading) {
    return (
      <Stack sx={{ gap: 2, px: 4, py: 3 }}>
        <Skeleton variant="rounded" sx={{ height: 48, width: "33%" }} />
        <Skeleton variant="rounded" sx={{ height: 160, width: "100%" }} />
      </Stack>
    );
  }

  if (lineageQuery.isError || !version) {
    const backToSlot = (
      <Button
        variant="outlined"
        component={Link}
        to="/agent-registry/slots/$slotSlug"
        // No `Register` augmentation on this router — `to`/`search`/`params`
        // are untyped, so a `component={Link}` object literal needs this cast
        // (the repo-wide idiom, see RunDetailPage.tsx).
        params={{ slotSlug } as never}
        search={(tenantId ? { tenant: tenantId } : {}) as never}
      >
        Back to slot
      </Button>
    );

    if (lineageQuery.isError) {
      return (
        <Stack sx={{ gap: 2, px: 4, py: 6, maxWidth: 640 }}>
          <RegistryErrorAlert error={lineageQuery.error} fallback="Failed to load this version" />
          {backToSlot}
        </Stack>
      );
    }

    return <NotFoundState entity="Version" action={backToSlot} />;
  }

  const lineage = buildLineage(versionId, byId);
  const revokeLocked = false;
  const isRevoked = version.revokedAt !== null;

  return (
    <EntityShell
      testId="version-detail"
      breadcrumb={
        <Breadcrumbs aria-label="breadcrumb">
          <BreadcrumbsItem
            component={Link}
            to="/agent-registry/slots/$slotSlug"
            params={{ slotSlug } as never}
            search={(tenantId ? { tenant: tenantId } : {}) as never}
            label={slotSlug}
          />
          <Typography component="span" variant="body2" color="text.primary" aria-current="page">
            #{version.versionNumber} {version.name}
          </Typography>
        </Breadcrumbs>
      }
      title={`${version.name} · #${version.versionNumber}`}
      badges={isRevoked ? <Chip tint="destructive">Revoked</Chip> : <Chip tint="success">Active</Chip>}
      actions={
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 0.5 }}>
          <Button
            variant="contained"
            data-testid="new-version-from-this"
            disabled={globalLocked}
            startIcon={<IconMaterialSymbolsAdd sx={{ fontSize: 16 }} />}
            onClick={() =>
              void navigate({
                to: "/agent-registry/slots/$slotSlug/versions/new",
                params: { slotSlug },
                search: { ...(tenantId ? { tenant: tenantId } : {}), from: version.id },
              })
            }
          >
            New version from this
          </Button>
          {globalLocked ? (
            <Typography variant="caption" color="text.secondary" data-testid="global-write-locked">
              Only superadmins can publish versions in Global scope.
            </Typography>
          ) : null}
        </Box>
      }
    >
      <Box sx={{ px: 4, py: 3 }}>
        <Stack sx={{ maxWidth: 1024, gap: 3 }}>
          <Typography variant="body2" color="text.secondary">
            This version is immutable — every field below is fixed at creation.
            To change any of them, publish "New version from this" and edit the
            copy.
          </Typography>

          <FormSection title="General">
            <FieldRow label="Name" value={version.name} />
            <FieldRow
              label="Instructions"
              value={<CodeBlock testId="version-instructions-copy">{version.instructions}</CodeBlock>}
            />
            <FieldRow
              label="Tools"
              value={
                version.toolAllowlist.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No tools allowed.
                  </Typography>
                ) : (
                  <ChipStrip>
                    {version.toolAllowlist.map((tool) => (
                      <Chip key={tool}>{tool}</Chip>
                    ))}
                  </ChipStrip>
                )
              }
            />
          </FormSection>

          <FormSection title="Model">
            <FieldRow label="Provider" value={version.modelProvider} />
            <FieldRow label="Model id" value={version.modelId} />
          </FormSection>

          <FormSection title="Bounds">
            <FieldRow label="Dollar ceiling" value={`$${version.dollarCeilingUsd}`} />
            <FieldRow label="Turn cap" value={version.turnCap ?? "No cap"} />
            <FieldRow
              label="Wall-clock cap"
              value={version.wallClockCapSeconds != null ? `${version.wallClockCapSeconds}s` : "No cap"}
            />
          </FormSection>

          <FormSection title="Provenance">
            <FieldRow label="Created" value={new Date(version.createdAt).toLocaleString()} />
            <FieldRow label="Created by" value={version.createdByUserId ?? "System"} />
            <FieldRow
              label="Revoked"
              value={version.revokedAt ? new Date(version.revokedAt).toLocaleString() : "Not revoked"}
            />
          </FormSection>

          <FormSection
            title="Lineage"
            description="Newest → oldest. Each version's base is the one it was copied from."
          >
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
              {lineage.chain.map((v) => (
                <Box key={v.id} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Chip tint={v.id === versionId ? "info" : "muted"}>
                    #{v.versionNumber} {v.name}
                  </Chip>
                  {v.tenantId === null ? <Chip tint="outline">global</Chip> : null}
                  {v.revokedAt ? <Chip tint="destructive">Revoked</Chip> : null}
                </Box>
              ))}
            </Box>
            <Typography variant="caption" color="text.secondary">
              {lineage.truncated
                ? "Lineage truncated (a base link is missing or the depth cap was hit) — whether it terminates at a global version can't be determined from what loaded."
                : lineage.terminatesGlobal
                  ? "Terminates at a global version."
                  : "From-scratch chain — does not terminate at a global version."}
            </Typography>
          </FormSection>

          <FormSection title="Danger zone" tone="destructive" bare>
            <DangerZone>
              <DangerZone.Row
                title="Revoke this version"
                description={
                  isRevoked
                    ? "This version is already revoked."
                    : "Permanent — no un-revoke. Recovery means publishing a new version and rebinding every slot that used this one."
                }
                action={
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 0.5 }}>
                    <Button
                      variant="contained"
                      color="error"
                      data-testid="version-revoke"
                      disabled={isRevoked || revokeLocked}
                      startIcon={<IconMaterialSymbolsBlock sx={{ fontSize: 16 }} />}
                      onClick={() => setRevokeOpen(true)}
                    >
                      Revoke
                    </Button>
                    {!isRevoked && revokeLocked ? (
                      <Typography variant="caption" color="text.secondary" data-testid="global-write-locked">
                        Only superadmins can revoke versions in Global scope.
                      </Typography>
                    ) : null}
                  </Box>
                }
              />
            </DangerZone>
          </FormSection>
        </Stack>
      </Box>

      <RevokeVersionDialog
        open={revokeOpen}
        onClose={() => setRevokeOpen(false)}
        tenantId={version.tenantId}
        version={version}
        visibleBindings={visibleBindings}
      />
    </EntityShell>
  );
}
