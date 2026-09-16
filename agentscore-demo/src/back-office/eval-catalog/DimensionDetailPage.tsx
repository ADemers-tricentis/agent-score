/** DimensionDetailPage — view + edit one curated dimension.
 *
 * Superadmin-only (catalog CRUD is `SuperadminDep` on the backend). Follows the
 * back-office settings canon (TenantSettingsPage / UserEditPage): pinned header
 * with NO action buttons, then a stack of `FormSection`s where each mutable
 * concern owns its inline `Save changes` button (dirty-tracked), plus a Danger
 * zone for archive/restore. The slug is immutable (`patchDimension` has no slug).
 *
 * There is no get-by-id endpoint for dimensions — the target is resolved by
 * merging the active + archived list queries, so an archived dimension is still
 * loadable.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { toast } from "@/shared/lib/toast";
import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import FormLabel from "@mui/material/FormLabel";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import BreadcrumbsItem from "@tricentis/aura/components/BreadcrumbsItem.js";
import IconMaterialSymbolsArchive from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsArchive.mjs";
import IconMaterialSymbolsClose from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsClose.mjs";
import IconMaterialSymbolsLock from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsLock.mjs";
import IconMaterialSymbolsReplay from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsReplay.mjs";
import IconMaterialSymbolsSave from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsSave.mjs";

import { DIMENSIONS, EVALS } from "@/back-office/eval-catalog/eval-catalog-fixtures";
import { Chip } from "@/shared/components/chip";
import { DangerZone } from "@/shared/components/danger-zone";
import { EntityShell } from "@/shared/components/entity-shell";
import { FormSection } from "@/shared/components/form-section";
import { NotFoundState } from "@/shared/components/not-found-state";
import { MultiSelect } from "@/shared/components/combobox";

/** Order-insensitive set equality for the evals dirty check. */
function sameSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const set = new Set(a);
  return b.every((x) => set.has(x));
}

export function DimensionDetailPage() {
  // `strict: false` avoids brittleness around how TanStack Router computes the
  // route ID under the pathless layout parent (matches EvalDetailPage).
  const { dimensionId } = useParams({ strict: false }) as {
    dimensionId: string;
  };
  const navigate = useNavigate();
  const [, forceRerender] = useState(0);

  const dimension = DIMENSIONS.find((d) => d.id === dimensionId);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedEvalIds, setSelectedEvalIds] = useState<string[]>([]);

  useEffect(() => {
    if (dimension) {
      setName(dimension.name);
      setDescription(dimension.description ?? "");
    }
  }, [dimension]);

  const activeEvals = useMemo(() => EVALS.filter((e) => e.status === "active"), []);
  const evalOptions = useMemo(
    () => activeEvals.map((e) => ({ value: e.id, label: e.name })),
    [activeEvals],
  );

  const dimensionEvals = useMemo(
    () => EVALS.filter((e) => e.dimensionIds.includes(dimensionId)),
    [dimensionId],
  );

  // Resolve a selected eval id → its name for chip labels. Active evals are the
  // source; fall back to the dimension's current members so a selected eval no
  // longer active still shows a name rather than a raw id.
  const evalNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const e of activeEvals) map.set(e.id, e.name);
    for (const e of dimensionEvals) if (!map.has(e.id)) map.set(e.id, e.name);
    return map;
  }, [activeEvals, dimensionEvals]);

  // Seed once so background changes can't clobber in-flight user edits.
  const seededRef = useRef(false);
  const seededEvalIds = useMemo(
    () => dimensionEvals.map((e) => e.id),
    [dimensionEvals],
  );
  useEffect(() => {
    if (!seededRef.current) {
      setSelectedEvalIds(seededEvalIds);
      seededRef.current = true;
    }
  }, [seededEvalIds]);

  const saveGeneral = {
    isPending: false,
    mutate: () => {
      if (dimension) {
        dimension.name = name.trim();
        dimension.description = description.trim() || null;
        dimension.updatedAt = new Date().toISOString();
      }
      toast.success("Dimension updated");
      forceRerender((n) => n + 1);
    },
  };

  const saveEvals = {
    isPending: false,
    mutate: () => {
      for (const e of EVALS) {
        const shouldHave = selectedEvalIds.includes(e.id);
        const has = e.dimensionIds.includes(dimensionId);
        if (shouldHave && !has) e.dimensionIds.push(dimensionId);
        if (!shouldHave && has) e.dimensionIds = e.dimensionIds.filter((id) => id !== dimensionId);
      }
      toast.success("Evals updated");
      seededRef.current = false;
      forceRerender((n) => n + 1);
    },
  };

  const setStatus = {
    isPending: false,
    mutate: (status: "active" | "archived") => {
      if (dimension) {
        dimension.status = status;
        toast.success(status === "archived" ? `"${dimension.name}" archived` : "Dimension restored");
      }
      setArchiveOpen(false);
      forceRerender((n) => n + 1);
    },
  };

  const [archiveOpen, setArchiveOpen] = useState(false);

  if (!dimension) {
    return (
      <NotFoundState
        entity="Dimension"
        action={
          <Button
            variant="outlined"
            data-testid="dimension-not-found-back"
            onClick={() => void navigate({ to: "/evals/catalog/dimensions" })}
          >
            Back to dimensions
          </Button>
        }
      />
    );
  }

  const isArchived = dimension.status === "archived";
  const generalDirty =
    name.trim() !== dimension.name ||
    (description.trim() || null) !== (dimension.description ?? null);
  const evalsDirty = !sameSet(selectedEvalIds, seededEvalIds);

  return (
    <EntityShell
      title={dimension.name}
      breadcrumb={
        <Breadcrumbs data-slot="breadcrumb" aria-label="breadcrumb">
          <BreadcrumbsItem
            data-slot="breadcrumb-link"
            component={Link}
            to="/evals/catalog/evals"
            label="Catalog"
          />
          <BreadcrumbsItem
            data-slot="breadcrumb-link"
            component={Link}
            to="/evals/catalog/dimensions"
            label="Dimensions"
          />
          <Typography
            data-slot="breadcrumb-page"
            component="span"
            variant="body2"
            color="text.primary"
            aria-current="page"
          >
            {dimension.name}
          </Typography>
        </Breadcrumbs>
      }
      badges={
        isArchived ? (
          <Chip tint="muted">Archived</Chip>
        ) : (
          <Chip tint="success">Active</Chip>
        )
      }
      meta={
        <>
          <Box component="span" sx={{ fontFamily: "monospace" }}>
            {dimension.slug}
          </Box>
          <Box component="span">·</Box>
          <Box component="span">
            Updated {new Date(dimension.updatedAt).toLocaleDateString()}
          </Box>
        </>
      }
    >
      <Box sx={{ px: 4, py: 3 }}>
        <Stack sx={{ maxWidth: 1024, gap: 3 }}>
          <FormSection
            title="General"
            description="The slug is the stable identifier and is immutable; the display name and description can change."
          >
            <Stack sx={{ gap: 0.75 }}>
              <FormLabel
                htmlFor="dimension-slug"
                sx={{ display: "flex", alignItems: "center", gap: 0.75 }}
              >
                Slug{" "}
                <IconMaterialSymbolsLock
                  sx={{ fontSize: 12, color: "text.secondary" }}
                />
              </FormLabel>
              <TextField
                id="dimension-slug"
                value={dimension.slug}
                slotProps={{
                  htmlInput: { readOnly: true, "data-testid": "dimension-slug" },
                }}
                disabled
                fullWidth
                sx={{ "& .MuiInputBase-input": { fontFamily: "monospace", color: "text.secondary" } }}
              />
              <Box
                component="p"
                sx={{ m: 0, typography: "caption", color: "text.secondary" }}
              >
                Immutable. The slug is the stable identifier — create a new
                dimension to use a different one.
              </Box>
            </Stack>
            <Stack sx={{ gap: 0.75 }}>
              <FormLabel htmlFor="dimension-name">
                Name <Box component="span" sx={{ color: "error.main" }}>*</Box>
              </FormLabel>
              <TextField
                id="dimension-name"
                autoComplete="off"
                value={name}
                disabled={isArchived}
                onChange={(e) => setName(e.target.value)}
                fullWidth
                slotProps={{ htmlInput: { "data-testid": "dimension-name" } }}
              />
            </Stack>
            <Stack sx={{ gap: 0.75 }}>
              <FormLabel htmlFor="dimension-description">Description</FormLabel>
              <TextField
                multiline
                minRows={2}
                placeholder="Optional — what this dimension captures."
                value={description}
                disabled={isArchived}
                onChange={(e) => setDescription(e.target.value)}
                fullWidth
                slotProps={{
                  htmlInput: {
                    id: "dimension-description",
                    "data-testid": "dimension-description",
                  },
                }}
              />
            </Stack>
            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Button
                variant="contained"
                data-testid="save-general"
                disabled={
                  !generalDirty ||
                  isArchived ||
                  name.trim().length === 0 ||
                  saveGeneral.isPending
                }
                onClick={() => saveGeneral.mutate()}
                startIcon={<IconMaterialSymbolsSave sx={{ fontSize: 16 }} />}
              >
                Save changes
              </Button>
            </Box>
          </FormSection>

          <FormSection
            title="Evals"
            description="Which evals belong to this dimension. Assigning here is the same as setting the dimension on each eval."
          >
            <Stack sx={{ gap: 0.75 }}>
              <FormLabel>Evals</FormLabel>
              <MultiSelect
                options={evalOptions}
                values={selectedEvalIds}
                onChange={setSelectedEvalIds}
                disabled={isArchived}
                placeholder="Add evals…"
                triggerLabel="Add evals…"
                searchPlaceholder="Filter evals…"
                emptyLabel="No active evals."
              />
              {selectedEvalIds.length > 0 ? (
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 0.75,
                    pt: 0.5,
                  }}
                >
                  {selectedEvalIds.map((id) => {
                    const label = evalNameById.get(id) ?? id;
                    return (
                      <Chip key={id} tint="info">
                        {label}
                        <IconButton
                          aria-label={`Remove ${label}`}
                          disabled={isArchived}
                          onClick={() =>
                            setSelectedEvalIds((prev) =>
                              prev.filter((x) => x !== id),
                            )
                          }
                          sx={{
                            ml: 0.25,
                            mr: -0.25,
                            p: 0,
                            opacity: 0.7,
                            color: "inherit",
                            "&:hover": { opacity: 1, bgcolor: "transparent" },
                            "& svg": { fontSize: 12 },
                          }}
                        >
                          <IconMaterialSymbolsClose />
                        </IconButton>
                      </Chip>
                    );
                  })}
                </Box>
              ) : (
                <Typography variant="caption" sx={{ pt: 0.5, color: "text.secondary" }}>
                  No evals assigned yet.
                </Typography>
              )}
            </Stack>
            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Button
                variant="contained"
                data-testid="save-evals"
                disabled={!evalsDirty || isArchived || saveEvals.isPending}
                onClick={() => saveEvals.mutate()}
                startIcon={<IconMaterialSymbolsSave sx={{ fontSize: 16 }} />}
              >
                Save changes
              </Button>
            </Box>
          </FormSection>

          <FormSection
            title="Danger zone"
            description="Archiving hides the dimension from new selection. Reversible via Restore."
            tone="destructive"
            bare
          >
            <DangerZone>
              {isArchived ? (
                <DangerZone.Row
                  title="Restore dimension"
                  description="Bring this dimension back to active so it can be assigned again."
                  action={
                    <Button
                      variant="outlined"
                      data-testid="dimension-restore"
                      disabled={setStatus.isPending}
                      onClick={() => setStatus.mutate("active")}
                      startIcon={<IconMaterialSymbolsReplay sx={{ fontSize: 16 }} />}
                    >
                      Restore
                    </Button>
                  }
                />
              ) : (
                <DangerZone.Row
                  title="Archive dimension"
                  description="Hides the dimension from new selection. Nothing is deleted."
                  action={
                    <Button
                      variant="contained"
                      color="error"
                      data-testid="dimension-archive"
                      onClick={() => setArchiveOpen(true)}
                      startIcon={<IconMaterialSymbolsArchive sx={{ fontSize: 16 }} />}
                    >
                      Archive
                    </Button>
                  }
                />
              )}
            </DangerZone>
          </FormSection>
        </Stack>
      </Box>

      <Dialog open={archiveOpen} onClose={() => setArchiveOpen(false)}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconMaterialSymbolsArchive
            sx={{ fontSize: 16, color: "text.secondary" }}
          />
          Archive {dimension.name}?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Hides the dimension from new selection. Nothing is deleted —
            reversible via Restore.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            data-testid="archive-cancel"
            onClick={() => setArchiveOpen(false)}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            data-testid="archive-confirm"
            disabled={setStatus.isPending}
            onClick={() => setStatus.mutate("archived")}
            startIcon={<IconMaterialSymbolsArchive sx={{ fontSize: 16 }} />}
          >
            Archive
          </Button>
        </DialogActions>
      </Dialog>
    </EntityShell>
  );
}
