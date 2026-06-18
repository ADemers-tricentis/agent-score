import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import FormLabel from "@mui/material/FormLabel";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import SvgIcon from "@mui/material/SvgIcon";
import Divider from "@mui/material/Divider";
import ChipStatus from "@tricentis/aura/components/ChipStatus.js";
import type { View, ScoringProfile, ProjectType, VerdictBandKey } from "../types";
import { getProfile, updateProfile, PROJECTS } from "../data/mock";
import TypeTag from "../components/TypeTag";

interface Props {
  profileId: string;
  navigate: (v: View) => void;
}

const PROJECT_TYPE_OPTIONS: ProjectType[] = ["ATA", "ATC", "CURA", "AI_WORKSPACE", "CODING", "APT"];

const VERDICT_LABELS: Record<VerdictBandKey, string> = {
  ship: "Ship",
  ship_note: "Ship with notes",
  review: "Review",
  block_rec: "Block",
};

const VERDICT_COLORS: Record<VerdictBandKey, string> = {
  ship: "success.main",
  ship_note: "success.dark",
  review: "warning.main",
  block_rec: "error.main",
};

function LockIcon() {
  return <SvgIcon sx={{ fontSize: 14, color: "text.secondary" }}><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" /></SvgIcon>;
}
function AddIcon() {
  return <SvgIcon sx={{ fontSize: 16 }}><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></SvgIcon>;
}
function ArchiveIcon() {
  return <SvgIcon sx={{ fontSize: 16 }}><path d="M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM12 17.5L6.5 12H10v-2h4v2h3.5L12 17.5zM5.12 5l.81-1h12l.94 1H5.12z" /></SvgIcon>;
}
function RestoreIcon() {
  return <SvgIcon sx={{ fontSize: 16 }}><path d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z" /></SvgIcon>;
}
function ArrowBackIcon() {
  return <SvgIcon><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" /></SvgIcon>;
}
function SaveIcon() {
  return <SvgIcon sx={{ fontSize: 16 }}><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z" /></SvgIcon>;
}

/** A titled section card — mirrors Tricentis FormSection. */
function Section({
  title,
  description,
  tone,
  children,
}: {
  title: string;
  description?: string;
  tone?: "destructive";
  children: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        border: 1,
        borderColor: tone === "destructive" ? "error.main" : "divider",
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          px: 2.5,
          py: 2,
          bgcolor: tone === "destructive"
            ? "rgba(var(--mui-palette-error-mainChannel) / 0.04)"
            : "rgba(var(--mui-palette-primary-mainChannel) / 0.02)",
          borderBottom: 1,
          borderColor: tone === "destructive" ? "error.main" : "divider",
        }}
      >
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 700,
            color: tone === "destructive" ? "error.main" : "text.primary",
          }}
        >
          {title}
        </Typography>
        {description && (
          <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 0.25 }}>
            {description}
          </Typography>
        )}
      </Box>
      <Stack sx={{ gap: 2, p: 2.5 }}>
        {children}
      </Stack>
    </Box>
  );
}

function dimensionWeightsSummary(weights: Record<string, number>): string {
  const parts = Object.entries(weights).map(([slug, w]) => `${slug}: ×${w}`);
  return parts.length > 0 ? parts.join(" · ") : "—";
}

function AdoptedBySection({ profile, navigate }: { profile: ScoringProfile; navigate: (v: View) => void }) {
  const adopters = PROJECTS.filter((p) => p.adoptedProfileId === profile.id);
  if (adopters.length === 0) return null;
  return (
    <Box>
      <Typography variant="caption" sx={{ fontWeight: 700, color: "text.disabled", textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 0.75 }}>
        Adopted by
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
        {adopters.map((p) => (
          <Box
            key={p.id}
            onClick={() => navigate({ name: "project", projectId: p.id })}
            sx={{
              display: "flex", alignItems: "center", gap: 1,
              px: 1.5, py: 0.75, border: 1, borderColor: "divider",
              borderRadius: 1.5, cursor: "pointer",
              "&:hover": { borderColor: "primary.main", bgcolor: "action.hover" },
              transition: "all 0.15s",
            }}
          >
            <TypeTag type={p.type} />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{p.name}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export default function ProfileDetailView({ profileId, navigate }: Props) {
  const [profile, setProfile] = useState<ScoringProfile | undefined>(() => getProfile(profileId));

  const [name, setName] = useState(profile?.name ?? "");
  const [description, setDescription] = useState(profile?.description ?? "");
  const [agentType, setAgentType] = useState<ProjectType>(profile?.agentType ?? "ATA");
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [saveFlash, setSaveFlash] = useState(false);

  if (!profile) {
    return (
      <Box sx={{ p: 3 }}>
        <Button startIcon={<ArrowBackIcon />} variant="text" size="small" onClick={() => navigate({ name: "profiles" })} sx={{ color: "text.secondary", mb: 2 }}>
          Profiles
        </Button>
        <Typography>Profile not found.</Typography>
      </Box>
    );
  }

  const isArchived = profile.status === "archived";
  const sortedVersions = [...profile.versions].sort((a, b) => b.version - a.version);
  const latestVersion = sortedVersions[0];
  const latestEntries = latestVersion?.entries ?? [];

  const generalDirty =
    name.trim() !== profile.name ||
    description.trim() !== (profile.description ?? "") ||
    agentType !== profile.agentType;

  function handleSave() {
    const updated: ScoringProfile = { ...profile!, name: name.trim(), description: description.trim(), agentType };
    updateProfile(updated);
    setProfile(updated);
    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 1800);
  }

  function handleArchive() {
    const updated: ScoringProfile = { ...profile!, status: "archived" };
    updateProfile(updated);
    setProfile(updated);
    setArchiveOpen(false);
  }

  function handleRestore() {
    const updated: ScoringProfile = { ...profile!, status: "active" };
    updateProfile(updated);
    setProfile(updated);
  }

  const headSx = { typography: "subtitle2", fontWeight: 600 } as const;

  return (
    <Box sx={{ p: 3, maxWidth: 960 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        variant="text"
        size="small"
        onClick={() => navigate({ name: "profiles" })}
        sx={{ color: "text.secondary", mb: 2 }}
      >
        Profiles
      </Button>

      {/* Page header */}
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 3, gap: 2 }}>
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>{profile.name}</Typography>
            {isArchived
              ? <Chip label="Archived" size="small" color="default" sx={{ height: 20, fontSize: "0.65rem" }} />
              : <Chip label="Active" size="small" color="success" sx={{ height: 20, fontSize: "0.65rem" }} />
            }
          </Box>
          <Typography variant="caption" sx={{ fontFamily: "monospace", color: "text.secondary", display: "block", mb: 0.5 }}>
            {profile.slug}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Created {new Date(profile.createdAt).toLocaleDateString()}
          </Typography>
        </Box>
        <TypeTag type={profile.agentType} />
      </Box>

      <AdoptedBySection profile={profile} navigate={navigate} />
      {PROJECTS.some((p) => p.adoptedProfileId === profile.id) && <Box sx={{ mb: 3 }} />}

      <Stack sx={{ gap: 3 }}>
        {/* General */}
        <Section
          title="General"
          description="Stable identity of this profile. The slug is immutable; eval entries and weights are versioned — publish a new version to change them."
        >
          <Stack sx={{ gap: 0.75 }}>
            <FormLabel>Slug</FormLabel>
            <TextField
              value={profile.slug}
              disabled
              fullWidth
              slotProps={{
                htmlInput: { readOnly: true },
                input: { endAdornment: <LockIcon /> },
              }}
              sx={{ "& .MuiInputBase-input": { fontFamily: "monospace", color: "text.secondary" } }}
            />
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              The slug is immutable — it is the profile&apos;s stable identifier.
            </Typography>
          </Stack>
          <Stack sx={{ gap: 0.75 }}>
            <FormLabel required>Name</FormLabel>
            <TextField
              value={name}
              disabled={isArchived}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              placeholder="e.g. ATA regression baseline"
            />
          </Stack>
          <Stack sx={{ gap: 0.75 }}>
            <FormLabel>Description</FormLabel>
            <TextField
              multiline
              minRows={2}
              value={description}
              disabled={isArchived}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              placeholder="Optional — what this profile scores."
            />
          </Stack>
          <Stack sx={{ gap: 0.75 }}>
            <FormLabel required>Agent type</FormLabel>
            <TextField
              select
              value={agentType}
              disabled={isArchived}
              onChange={(e) => setAgentType(e.target.value as ProjectType)}
              fullWidth
            >
              {PROJECT_TYPE_OPTIONS.map((t) => (
                <MenuItem key={t} value={t}>{t}</MenuItem>
              ))}
            </TextField>
          </Stack>
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              disabled={!generalDirty || isArchived || name.trim().length === 0}
              onClick={handleSave}
            >
              {saveFlash ? "Saved" : "Save changes"}
            </Button>
          </Box>
        </Section>

        {/* Latest version entries */}
        <Section
          title={latestVersion ? `Latest version entries — v${latestVersion.version}` : "Latest version entries"}
          description={
            latestVersion
              ? `Pinned evals for v${latestVersion.version} (read-only — publish a new version to modify entries).`
              : "No versions yet."
          }
        >
          {latestVersion && (
            <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", mb: 0.5 }}>
              {(["ship", "ship_note", "review", "block_rec"] as VerdictBandKey[]).map((key) => (
                <Box key={key} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Typography variant="caption" sx={{ color: VERDICT_COLORS[key], fontWeight: 700 }}>
                    {VERDICT_LABELS[key]}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    ≥ {latestVersion.verdictBands[key]}
                  </Typography>
                </Box>
              ))}
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Typography variant="caption" sx={{ color: "error.dark", fontWeight: 700 }}>Block</Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  &lt; {latestVersion.verdictBands.block_rec} (automatic)
                </Typography>
              </Box>
            </Box>
          )}

          {latestEntries.length > 0 ? (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={headSx}>Eval</TableCell>
                  <TableCell sx={{ ...headSx, width: 120 }}>Dimension</TableCell>
                  <TableCell sx={{ ...headSx, width: 100 }}>Threshold</TableCell>
                  <TableCell sx={{ ...headSx, width: 80 }}>Weight</TableCell>
                  <TableCell sx={{ ...headSx, width: 96 }}>Enabled</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {latestEntries.map((entry) => (
                  <TableRow key={entry.id} sx={{ opacity: entry.enabled ? 1 : 0.5 }}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{entry.evalName}</Typography>
                      <Typography variant="caption" sx={{ color: "text.disabled", fontFamily: "monospace" }}>{entry.evalSlug}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={entry.dimension} size="small" variant="outlined" sx={{ height: 20, fontSize: "0.63rem" }} />
                    </TableCell>
                    <TableCell sx={{ fontFamily: "monospace", typography: "caption" }}>{entry.threshold}</TableCell>
                    <TableCell sx={{ fontFamily: "monospace", typography: "caption" }}>×{entry.weight}</TableCell>
                    <TableCell>
                      <ChipStatus status={entry.enabled ? "Passed" : "Failed"} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {latestVersion ? "This version has no entries." : "This profile has no versions yet."}
            </Typography>
          )}
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate({ name: "add-profile" })}
            >
              New version
            </Button>
          </Box>
        </Section>

        {/* Version history */}
        <Section
          title="Version history"
          description="Immutable, append-only. Anything that pinned an older version is unaffected by later publishes."
        >
          {sortedVersions.length > 0 ? (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={headSx}>Version</TableCell>
                  <TableCell sx={headSx}>Entries</TableCell>
                  <TableCell sx={headSx}>Dimension weights</TableCell>
                  <TableCell sx={headSx}>Created</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedVersions.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: "monospace" }}>
                          v{v.version}
                        </Typography>
                        {v.id === latestVersion?.id && (
                          <Chip label="latest" size="small" color="primary" sx={{ height: 18, fontSize: "0.6rem" }} />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>{v.entries.length}</TableCell>
                    <TableCell
                      sx={{
                        maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis",
                        whiteSpace: "nowrap", fontFamily: "monospace",
                        typography: "caption", color: "text.secondary",
                      }}
                    >
                      {dimensionWeightsSummary(v.dimensionWeights)}
                    </TableCell>
                    <TableCell sx={{ typography: "caption", color: "text.secondary" }}>
                      {new Date(v.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Typography variant="body2" sx={{ color: "text.secondary" }}>No versions yet.</Typography>
          )}
        </Section>

        {/* Danger zone */}
        <Section
          title="Danger zone"
          description="Archiving hides the profile from new selection. Published versions still resolve and anything that pinned a version is unaffected. Reversible via Restore."
          tone="destructive"
        >
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {isArchived ? "Restore profile" : "Archive profile"}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {isArchived
                  ? "Bring this profile back to active so it can be selected again."
                  : "Hides the profile from new selection. Nothing is deleted — published versions still resolve."}
              </Typography>
            </Box>
            {isArchived ? (
              <Button variant="outlined" startIcon={<RestoreIcon />} onClick={handleRestore} sx={{ flexShrink: 0 }}>
                Restore
              </Button>
            ) : (
              <Button variant="contained" color="error" startIcon={<ArchiveIcon />} onClick={() => setArchiveOpen(true)} sx={{ flexShrink: 0 }}>
                Archive
              </Button>
            )}
          </Box>
        </Section>
      </Stack>

      {/* Archive confirmation dialog */}
      <Dialog open={archiveOpen} onClose={() => setArchiveOpen(false)}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <ArchiveIcon />
          Archive {profile.name}?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Hides the profile from new selection. Published versions still resolve and anything that pinned
            a version is unaffected. Reversible via Restore.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setArchiveOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" startIcon={<ArchiveIcon />} onClick={handleArchive}>
            Archive
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
