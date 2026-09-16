/** ProfileDetailPage — view + edit one scoring profile.
 *
 * Slice W7-S4 (spec §3.1 Feature 4). Superadmin-only (catalog reads are
 * `SuperadminDep` on the backend).
 *
 * Follows the back-office settings canon (TenantSettingsPage / UserEditPage):
 * a pinned header with NO action buttons, then a stack of `FormSection`s. The
 * stable *identity* (name, description) is edited inline in the
 * General section with its own `Save changes` button. A profile's *content*
 * (entries + dimension weights) is immutable per version, so "editing" it means
 * publishing a New version (spec §3.1 F4). Archive/Restore live in a Danger
 * zone — the slug is immutable.
 */

import { useEffect, useState } from "react";
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
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import BreadcrumbsItem from "@tricentis/aura/components/BreadcrumbsItem.js";
import IconMaterialSymbolsArchive from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsArchive.mjs";
import IconMaterialSymbolsAdd from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsAdd.mjs";
import IconMaterialSymbolsLock from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsLock.mjs";
import IconMaterialSymbolsReplay from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsReplay.mjs";
import IconMaterialSymbolsSave from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsSave.mjs";

import * as api from "@/back-office/eval-catalog/profile-catalog-fixtures";
import type { ProfileRead } from "@/back-office/eval-catalog/profile-catalog-fixtures";
import { Chip } from "@/shared/components/chip";
import { DangerZone } from "@/shared/components/danger-zone";
import { EntityShell } from "@/shared/components/entity-shell";
import { FormSection } from "@/shared/components/form-section";
import { NotFoundState } from "@/shared/components/not-found-state";

/** Versions sorted newest-first. */
function sortedVersions(profile: ProfileRead) {
  return [...(profile.versions ?? [])].sort((a, b) => b.version - a.version);
}

/** Compact "slug: weight, slug: weight" summary of a version's weights. */
function dimensionWeightsSummary(weights: Record<string, number>): string {
  const parts = Object.entries(weights).map(([slug, w]) => `${slug}: ${w}`);
  return parts.length > 0 ? parts.join(", ") : "—";
}

export function ProfileDetailPage() {
  // `strict: false` avoids brittleness around how TanStack Router computes the
  // route ID under the pathless layout parent (matches EvalDetailPage).
  const { profileId } = useParams({ strict: false }) as { profileId: string };
  const navigate = useNavigate();
  const [, forceRerender] = useState(0);

  const profile = api.getProfile(profileId);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [archiveOpen, setArchiveOpen] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setDescription(profile.description ?? "");
    }
  }, [profile]);

  const saveGeneral = {
    isPending: false,
    mutate: () => {
      api.patchProfile(profileId, { name: name.trim(), description: description.trim() || null });
      toast.success("Profile updated");
      forceRerender((n) => n + 1);
    },
  };

  const setStatus = {
    isPending: false,
    mutate: (status: "active" | "archived") => {
      const updated = api.patchProfile(profileId, { status });
      toast.success(updated.status === "archived" ? `"${updated.name}" archived` : "Profile restored");
      forceRerender((n) => n + 1);
      setArchiveOpen(false);
    },
  };

  if (!profile) {
    return (
      <NotFoundState
        entity="Profile"
        action={
          <Button
            variant="outlined"
            data-testid="profile-not-found-back"
            onClick={() => void navigate({ to: "/evals/catalog/profiles" })}
          >
            Back to profiles
          </Button>
        }
      />
    );
  }

  const isArchived = profile.status === "archived";
  const versions = sortedVersions(profile);
  const latestVersion = versions[0];
  const latestEntries = latestVersion?.entries ?? [];

  const generalDirty =
    name.trim() !== profile.name ||
    (description.trim() || null) !== (profile.description ?? null);

  const headCellSx = { typography: "subtitle2" } as const;

  return (
    <EntityShell
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
            to="/evals/catalog/profiles"
            label="Profiles"
          />
          <Typography
            data-slot="breadcrumb-page"
            component="span"
            variant="body2"
            color="text.primary"
            aria-current="page"
          >
            {profile.name}
          </Typography>
        </Breadcrumbs>
      }
      title={profile.name}
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
            {profile.slug}
          </Box>
          <Box component="span">·</Box>
          <Box component="span">
            Updated {new Date(profile.updatedAt).toLocaleDateString()}
          </Box>
        </>
      }
    >
      <Box sx={{ px: 4, py: 3 }}>
        <Stack sx={{ maxWidth: 1024, gap: 3 }}>
          <FormSection
            title="General"
            description="Stable identity of this profile. The slug is immutable; evals and weights are versioned — edit them by publishing a new version."
          >
            <Stack sx={{ gap: 0.75 }}>
              <FormLabel htmlFor="profile-slug">Slug</FormLabel>
              <TextField
                id="profile-slug"
                value={profile.slug}
                disabled
                fullWidth
                slotProps={{
                  htmlInput: {
                    readOnly: true,
                    "data-testid": "profile-slug-input",
                  },
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconMaterialSymbolsLock
                          sx={{ fontSize: 14, color: "text.secondary" }}
                        />
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{ "& .MuiInputBase-input": { fontFamily: "monospace", color: "text.secondary" } }}
              />
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                The slug is immutable — it is the profile&apos;s stable id.
              </Typography>
            </Stack>
            <Stack sx={{ gap: 0.75 }}>
              <FormLabel htmlFor="profile-name">
                Name <Box component="span" sx={{ color: "error.main" }}>*</Box>
              </FormLabel>
              <TextField
                id="profile-name"
                autoComplete="off"
                placeholder="e.g. Support-agent baseline"
                value={name}
                disabled={isArchived}
                onChange={(e) => setName(e.target.value)}
                fullWidth
                slotProps={{ htmlInput: { "data-testid": "profile-name-input" } }}
              />
            </Stack>
            <Stack sx={{ gap: 0.75 }}>
              <FormLabel htmlFor="profile-description">Description</FormLabel>
              <TextField
                id="profile-description"
                multiline
                minRows={2}
                placeholder="Optional — what this profile scores."
                value={description}
                disabled={isArchived}
                onChange={(e) => setDescription(e.target.value)}
                fullWidth
                slotProps={{
                  htmlInput: { "data-testid": "profile-description-input" },
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
            title="Latest version entries"
            description={
              latestVersion
                ? `Pinned evals for v${latestVersion.version} (read-only — edit creates a new version).`
                : "No versions yet."
            }
          >
            {latestEntries.length > 0 ? (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={headCellSx}>Eval</TableCell>
                    <TableCell sx={{ ...headCellSx, width: 112 }}>Threshold</TableCell>
                    <TableCell sx={{ ...headCellSx, width: 96 }}>Weight</TableCell>
                    <TableCell sx={{ ...headCellSx, width: 96 }}>Enabled</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {latestEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Box component="span" sx={{ fontWeight: 500 }}>
                            {entry.evalName}
                          </Box>
                          <Chip tint="outline">
                            <Box component="span" sx={{ fontFamily: "monospace" }}>
                              v{entry.evalVersion}
                            </Box>
                          </Chip>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontFamily: "monospace", typography: "caption" }}>
                        {entry.threshold}
                      </TableCell>
                      <TableCell sx={{ fontFamily: "monospace", typography: "caption" }}>
                        {entry.weight}
                      </TableCell>
                      <TableCell>
                        {entry.enabled ? (
                          <Chip tint="success">Enabled</Chip>
                        ) : (
                          <Chip tint="muted">Disabled</Chip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Typography variant="body1" sx={{ color: "text.secondary" }}>
                {latestVersion
                  ? "This version has no entries."
                  : "This profile has no versions."}
              </Typography>
            )}
            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Button
                variant="contained"
                onClick={() =>
                  void navigate({
                    to: "/evals/catalog/profiles/$profileId/version",
                    params: { profileId },
                  })
                }
                data-testid="new-profile-version-button"
                startIcon={<IconMaterialSymbolsAdd sx={{ fontSize: 16 }} />}
              >
                New version
              </Button>
            </Box>
          </FormSection>

          <FormSection
            title="Version history"
            description="Immutable, append-only. Anything that pinned an older version is unaffected by later edits."
          >
            {versions.length > 0 ? (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={headCellSx}>Version</TableCell>
                    <TableCell sx={headCellSx}>Entries</TableCell>
                    <TableCell sx={headCellSx}>Dimension weights</TableCell>
                    <TableCell sx={headCellSx}>Created</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {versions.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell sx={{ fontWeight: 500 }}>v{v.version}</TableCell>
                      <TableCell>{(v.entries ?? []).length}</TableCell>
                      <TableCell
                        sx={{
                          maxWidth: 320,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          fontFamily: "monospace",
                          typography: "caption",
                          color: "text.secondary",
                        }}
                      >
                        {dimensionWeightsSummary(v.dimensionWeights)}
                      </TableCell>
                      <TableCell sx={{ typography: "caption", color: "text.secondary" }}>
                        {new Date(v.createdAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Typography variant="body1" sx={{ color: "text.secondary" }}>
                No versions yet.
              </Typography>
            )}
          </FormSection>

          <FormSection
            title="Danger zone"
            description="Archiving hides the profile from new selection. Published versions still resolve and anything that pinned a version is unaffected. Reversible via Restore."
            tone="destructive"
            bare
          >
            <DangerZone>
              {isArchived ? (
                <DangerZone.Row
                  title="Restore profile"
                  description="Bring this profile back to active so it can be selected again."
                  action={
                    <Button
                      variant="outlined"
                      data-testid="profile-restore"
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
                  title="Archive profile"
                  description="Hides the profile from new selection. Nothing is deleted — published versions still resolve."
                  action={
                    <Button
                      variant="contained"
                      color="error"
                      data-testid="profile-archive"
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
          <IconMaterialSymbolsArchive sx={{ fontSize: 16, color: "text.secondary" }} />
          Archive {profile.name}?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Hides the profile from new selection. Published versions still
            resolve and anything that pinned a version is unaffected.
            Reversible via Restore.
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
