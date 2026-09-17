/** VersionCreatePage — `/agent-registry/slots/$slotSlug/versions/new`.
 *
 * Copy-then-edit is the only authoring flow whenever a lineage exists
 * (decisions D11/D12): with `?from=<versionId>` present, every field prefills
 * from that version and `baseVersionId` is sent. Authoring from scratch is
 * reachable only in the bootstrap case — no version of this slot in the
 * selected scope AND none globally — and then `baseVersionId` is omitted.
 * If a lineage exists but `?from=` is missing, this renders neither a blank
 * form nor silently redirects: it sends the operator back to the slot to
 * pick a source version, with the reason stated (the spec rejects a
 * from-scratch entry point when a lineage exists).
 */

import { focusRing } from "@/shared/theme/focus-ring";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearch } from "@tanstack/react-router";
import { toast } from "@/shared/lib/toast";
import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Button from "@mui/material/Button";
import FormLabel from "@mui/material/FormLabel";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import BreadcrumbsItem from "@tricentis/aura/components/BreadcrumbsItem.js";
import IconMaterialSymbolsClose from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsClose.mjs";
import IconMaterialSymbolsSave from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsSave.mjs";

import {
  useBindableVersions,
  useCreateVersion,
  useRegistrySlots,
  useRegistryVersion,
  type AgentVersionCreate,
} from "@/back-office/agent-registry/api";
import { RegistryErrorAlert } from "@/back-office/agent-registry/components/RegistryErrorAlert";
import type { RegistryScopeSearch } from "@/back-office/agent-registry/scope-params";
import { Chip } from "@/shared/components/chip";
import { MultiSelect } from "@/shared/components/combobox";
import { EmptyState } from "@/shared/components/empty-state";
import { FormSection } from "@/shared/components/form-section";
import { NotFoundState } from "@/shared/components/not-found-state";

interface CreateSearch extends RegistryScopeSearch {
  from?: string;
}

export function VersionCreatePage() {
  const { slotSlug } = useParams({ strict: false }) as { slotSlug: string };
  const search = useSearch({ strict: false }) as CreateSearch;
  const tenantId = search.tenant ?? null;
  const fromId = search.from;
  const navigate = useNavigate();

  const slotsQuery = useRegistrySlots(tenantId);
  const slot = (slotsQuery.data ?? []).find((s) => s.slug === slotSlug);

  const bindable = useBindableVersions({ tenantId, slotSlug });
  const bindableLoading = bindable.tenant.isLoading || bindable.global.isLoading;
  const sourceQuery = useRegistryVersion({ tenantId, slotSlug, versionId: fromId ?? null });
  const sourceVersion = sourceQuery.data;

  const [name, setName] = useState("");
  const [instructions, setInstructions] = useState("");
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [modelProvider, setModelProvider] = useState("");
  const [modelId, setModelId] = useState("");
  const [dollarCeiling, setDollarCeiling] = useState("3.00");
  const [turnCap, setTurnCap] = useState("");
  const [wallClockCap, setWallClockCap] = useState("");

  // Seed once from the source version — a background refetch of `bindable`
  // must never clobber what the operator has started editing.
  const seededRef = useRef(false);
  useEffect(() => {
    if (seededRef.current || !sourceVersion || !slot) return;
    setName(sourceVersion.name);
    setInstructions(sourceVersion.instructions);
    // The picker offers exactly this slot's own allowlist — drop any source
    // tool that isn't in it rather than pre-checking an option that doesn't exist.
    setSelectedTools(
      sourceVersion.toolAllowlist.filter((t) => slot.toolAllowlist.includes(t)),
    );
    setModelProvider(sourceVersion.modelProvider);
    setModelId(sourceVersion.modelId);
    setDollarCeiling(String(sourceVersion.dollarCeilingUsd));
    setTurnCap(sourceVersion.turnCap != null ? String(sourceVersion.turnCap) : "");
    setWallClockCap(
      sourceVersion.wallClockCapSeconds != null ? String(sourceVersion.wallClockCapSeconds) : "",
    );
    seededRef.current = true;
  }, [sourceVersion, slot]);

  const createVersion = useCreateVersion();

  const toolOptions = useMemo(
    () => (slot?.toolAllowlist ?? []).map((t) => ({ value: t, label: t })),
    [slot],
  );

  // No auth backend in this clone (precedent set across every other
  // section) — the operator is always treated as a superadmin.
  const globalLocked = false;

  if (slotsQuery.isLoading || bindableLoading || sourceQuery.isLoading) {
    return (
      <Stack sx={{ gap: 2, px: 4, py: 3 }}>
        <Skeleton variant="rounded" sx={{ height: 48, width: "33%" }} />
        <Skeleton variant="rounded" sx={{ height: 160, width: "100%" }} />
      </Stack>
    );
  }

  if (!slot) {
    return (
      <NotFoundState
        entity="Slot"
        action={
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
        }
      />
    );
  }

  // A failed lineage query is NOT "no lineage" — `bindable.versions` reads as
  // `[]` on error exactly like the genuine bootstrap case, so without this
  // gate a failed tenant/global fetch would silently open the from-scratch
  // form and publish a version with no `baseVersionId`, which decision
  // D12's staleness computation can never flag. Block every path (bootstrap,
  // copy-prefill, and the "pick a source" redirect) until this resolves.
  const bindableError = sourceQuery.error ?? bindable.tenant.error ?? bindable.global.error;

  if (bindableError) {
    return (
      <Box sx={{ px: 4, py: 6 }}>
        <Stack sx={{ gap: 2, maxWidth: 640 }}>
          <RegistryErrorAlert
            error={bindableError}
            fallback="Failed to load this slot's version history — can't determine whether a version already exists to copy from."
          />
          <Button
            variant="outlined"
            component={Link}
            to="/agent-registry/slots/$slotSlug"
            params={{ slotSlug } as never}
            search={(tenantId ? { tenant: tenantId } : {}) as never}
          >
            Back to slot
          </Button>
        </Stack>
      </Box>
    );
  }

  const hasLineage = bindable.versions.length > 0;

  if (fromId && !sourceVersion) {
    return (
      <NotFoundState
        entity="Source version"
        action={
          <Button
            variant="outlined"
            component={Link}
            to="/agent-registry/slots/$slotSlug"
            params={{ slotSlug } as never}
            search={(tenantId ? { tenant: tenantId } : {}) as never}
          >
            Back to slot
          </Button>
        }
      />
    );
  }

  if (!fromId && hasLineage) {
    return (
      <Box sx={{ px: 4, py: 6 }} data-testid="version-create-needs-source">
        <EmptyState
          title="Pick a version to copy"
          description="This slot already has a version in scope — creating from scratch isn't allowed once a lineage exists. Open the slot and copy the version you want to base this one on."
          action={
            <Button
              variant="contained"
              component={Link}
              to="/agent-registry/slots/$slotSlug"
              params={{ slotSlug } as never}
              search={(tenantId ? { tenant: tenantId } : {}) as never}
            >
              Back to slot
            </Button>
          }
        />
      </Box>
    );
  }

  // Integer-or-empty: `Number("abc")` is `NaN` and serializes to `null`
  // (the field silently vanishes), and `Number("1.5")` is a float the caps'
  // integer contract doesn't allow — both must block submit with a stated
  // reason instead of being coerced.
  const INTEGER_OR_EMPTY = /^\d+$/;
  const turnCapValid = turnCap.trim() === "" || INTEGER_OR_EMPTY.test(turnCap.trim());
  const wallClockCapValid = wallClockCap.trim() === "" || INTEGER_OR_EMPTY.test(wallClockCap.trim());

  const canCreate =
    name.trim().length > 0 &&
    instructions.trim().length > 0 &&
    modelProvider.trim().length > 0 &&
    modelId.trim().length > 0 &&
    dollarCeiling.trim().length > 0 &&
    turnCapValid &&
    wallClockCapValid &&
    !globalLocked &&
    !createVersion.isPending;

  const handleCreate = () => {
    const body: AgentVersionCreate = {
      slotSlug,
      name: name.trim(),
      instructions,
      toolAllowlist: selectedTools,
      modelProvider: modelProvider.trim(),
      modelId: modelId.trim(),
      dollarCeilingUsd: dollarCeiling.trim(),
      turnCap: turnCap.trim() === "" ? null : Number(turnCap.trim()),
      wallClockCapSeconds: wallClockCap.trim() === "" ? null : Number(wallClockCap.trim()),
      ...(fromId ? { baseVersionId: fromId } : {}),
    };
    createVersion.mutate(
      { tenantId, body },
      {
        onSuccess: (created) => {
          toast.success(`Version #${created.versionNumber} published`);
          void navigate({
            to: "/agent-registry/slots/$slotSlug/versions/$versionId",
            params: { slotSlug, versionId: created.id },
            search: tenantId ? { tenant: tenantId } : {},
          });
        },
      },
    );
  };

  return (
    <Box sx={{ minHeight: 0, flex: 1, overflowY: "auto", px: 4, py: 3 }}>
      <Stack sx={{ maxWidth: 1024, gap: 3 }}>
        <Box>
          <Breadcrumbs aria-label="breadcrumb">
            <BreadcrumbsItem component={Link} to="/agent-registry" search={(tenantId ? { tenant: tenantId } : {}) as never} label="Agent Registry" />
            <BreadcrumbsItem
              component={Link}
              to="/agent-registry/slots/$slotSlug"
              params={{ slotSlug } as never}
              search={(tenantId ? { tenant: tenantId } : {}) as never}
              label={slotSlug}
            />
            <Typography component="span" variant="body2" color="text.primary" aria-current="page">
              New version
            </Typography>
          </Breadcrumbs>
          <Typography component="h1" variant="h3" sx={{ mt: 1.5 }}>
            New version
          </Typography>
          <Typography variant="subtitle1" sx={{ mt: 0.5, color: "text.secondary" }}>
            {sourceVersion
              ? `Copied from #${sourceVersion.versionNumber} ${sourceVersion.name}${
                  sourceVersion.revokedAt
                    ? " (revoked — publishing this copy is the documented recovery path)"
                    : ""
                }. Edit any field before publishing.`
              : "No version exists for this slot yet — authoring from scratch."}
          </Typography>
        </Box>

        <FormSection title="General">
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
            <FormLabel htmlFor="version-name">
              Name <Box component="span" sx={{ color: "error.main" }}>*</Box>
            </FormLabel>
            <TextField
              id="version-name"
              autoComplete="off"
              value={name}
              onChange={(e) => setName(e.target.value)}
              size="small"
              slotProps={{ htmlInput: { "data-testid": "version-name" } }}
            />
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
            <FormLabel htmlFor="version-instructions">
              Instructions <Box component="span" sx={{ color: "error.main" }}>*</Box>
            </FormLabel>
            <TextField
              id="version-instructions"
              multiline
              minRows={6}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              slotProps={{ htmlInput: { "data-testid": "version-instructions" } }}
            />
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
            <FormLabel>Tools</FormLabel>
            <MultiSelect
              options={toolOptions}
              values={selectedTools}
              onChange={setSelectedTools}
              placeholder="Add tools…"
              triggerLabel="Add tools…"
              searchPlaceholder="Filter tools…"
              emptyLabel="This slot allows no tools."
              testId="version-tools-picker"
            />
            {selectedTools.length > 0 ? (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, pt: 0.5 }}>
                {selectedTools.map((tool) => (
                  <Chip key={tool} tint="info" data-testid={`version-tool-chip-${tool}`}>
                    {tool}
                    <Box
                      component="button"
                      type="button"
                      aria-label={`Remove ${tool}`}
                      data-testid={`version-tool-remove-${tool}`}
                      onClick={() => setSelectedTools((prev) => prev.filter((t) => t !== tool))}
                      sx={[focusRing, {
                        display: "inline-flex",
                        alignItems: "center",
                        border: 0,
                        p: 0,
                        ml: 0.25,
                        mr: "-0.125rem",
                        borderRadius: 0.5,
                        background: "transparent",
                        color: "inherit",
                        cursor: "pointer",
                        opacity: 0.7,
                        "&:hover": { opacity: 1 },
                      }]}
                    >
                      <IconMaterialSymbolsClose sx={{ fontSize: 12 }} />
                    </Box>
                  </Chip>
                ))}
              </Box>
            ) : (
              <Typography variant="caption" sx={{ pt: 0.5, color: "text.secondary" }}>
                No tools selected.
              </Typography>
            )}
          </Box>
        </FormSection>

        <FormSection
          title="Model"
          description="No route lists valid model identities — enter exactly what the inference layer expects."
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
            <FormLabel htmlFor="version-model-provider">
              Model provider <Box component="span" sx={{ color: "error.main" }}>*</Box>
            </FormLabel>
            <TextField
              id="version-model-provider"
              autoComplete="off"
              placeholder="e.g. openai"
              value={modelProvider}
              onChange={(e) => setModelProvider(e.target.value)}
              size="small"
              helperText="Free text — not validated against a catalog."
              slotProps={{ htmlInput: { "data-testid": "version-model-provider" } }}
            />
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
            <FormLabel htmlFor="version-model-id">
              Model id <Box component="span" sx={{ color: "error.main" }}>*</Box>
            </FormLabel>
            <TextField
              id="version-model-id"
              autoComplete="off"
              placeholder="e.g. gpt-4.1"
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              size="small"
              helperText="Free text — not validated against a catalog."
              slotProps={{ htmlInput: { "data-testid": "version-model-id" } }}
            />
          </Box>
        </FormSection>

        <FormSection title="Bounds">
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
            <FormLabel htmlFor="version-dollar-ceiling">
              Dollar ceiling (USD) <Box component="span" sx={{ color: "error.main" }}>*</Box>
            </FormLabel>
            <TextField
              id="version-dollar-ceiling"
              autoComplete="off"
              value={dollarCeiling}
              onChange={(e) => setDollarCeiling(e.target.value)}
              size="small"
              slotProps={{ htmlInput: { "data-testid": "version-dollar-ceiling" } }}
            />
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
            <FormLabel htmlFor="version-turn-cap">Turn cap (optional)</FormLabel>
            <TextField
              id="version-turn-cap"
              autoComplete="off"
              value={turnCap}
              onChange={(e) => setTurnCap(e.target.value)}
              size="small"
              error={!turnCapValid}
              helperText={turnCapValid ? undefined : "Enter a whole number, or leave blank for no cap."}
              slotProps={{ htmlInput: { "data-testid": "version-turn-cap" } }}
            />
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
            <FormLabel htmlFor="version-wall-clock-cap">Wall-clock cap, seconds (optional)</FormLabel>
            <TextField
              id="version-wall-clock-cap"
              autoComplete="off"
              value={wallClockCap}
              onChange={(e) => setWallClockCap(e.target.value)}
              size="small"
              error={!wallClockCapValid}
              helperText={wallClockCapValid ? undefined : "Enter a whole number of seconds, or leave blank for no cap."}
              slotProps={{ htmlInput: { "data-testid": "version-wall-clock-cap" } }}
            />
          </Box>
        </FormSection>

        <RegistryErrorAlert error={createVersion.error} fallback="Failed to create version" />

        {globalLocked ? (
          <Typography variant="caption" color="text.secondary" data-testid="global-write-locked">
            Only superadmins can publish versions in Global scope.
          </Typography>
        ) : null}

        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 1 }}>
          <Button
            variant="outlined"
            data-testid="cancel-version"
            disabled={createVersion.isPending}
            onClick={() =>
              void navigate({
                to: "/agent-registry/slots/$slotSlug",
                params: { slotSlug },
                search: tenantId ? { tenant: tenantId } : {},
              })
            }
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            data-testid="create-version-submit"
            disabled={!canCreate}
            onClick={handleCreate}
            startIcon={<IconMaterialSymbolsSave sx={{ fontSize: 16 }} />}
          >
            Create
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}
