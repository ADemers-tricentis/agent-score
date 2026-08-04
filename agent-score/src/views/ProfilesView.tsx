import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import SvgIcon from "@mui/material/SvgIcon";
import Tag from "@tricentis/aura/components/Tag.js";
import type { View, ScoringProfile, ProfileVersion, VerdictBandKey, ShowcaseCategory } from "../types";
import { PROFILES, PROJECTS } from "../data/mock";
import { DIMENSION_DOT_COLOR } from "../data/dimensions";
import { VERDICT_BAND_META } from "../data/verdict";
import TypeTag from "../components/TypeTag";
import ExpandableCard from "../components/ExpandableCard";

interface Props {
  navigate: (v: View) => void;
}

function AddIcon() {
  return <SvgIcon fontSize="small"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></SvgIcon>;
}

function LayersIcon() {
  return (
    <SvgIcon sx={{ fontSize: 40, color: "text.disabled" }}>
      <path d="m11.99 18.54-7.37-5.73L3 14.07l9 7 9-7-1.63-1.27zM12 16l7.36-5.73L21 9l-9-7-9 7 1.63 1.27L12 16z" />
    </SvgIcon>
  );
}

function SearchIcon() {
  return <SvgIcon sx={{ fontSize: 18 }}><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" /></SvgIcon>;
}

function latestVersion(profile: ScoringProfile): ProfileVersion {
  return profile.versions.reduce((max, v) => (v.version > max.version ? v : max), profile.versions[0]);
}

function weightEntries(version: ProfileVersion): { dimension: ShowcaseCategory; weight: number }[] {
  return Object.entries(version.dimensionWeights)
    .filter((entry): entry is [ShowcaseCategory, number] => entry[1] != null)
    .map(([dimension, weight]) => ({ dimension, weight }));
}

/** Stacked bar showing each dimension's share of total weight, colored by the
 * shared dimension palette, with a wrapping dot+name+weight legend beneath. */
function WeightBar({ version, compact }: { version: ProfileVersion; compact?: boolean }) {
  const weights = weightEntries(version);
  const total = weights.reduce((sum, w) => sum + w.weight, 0);
  if (weights.length === 0 || total === 0) {
    return <Typography variant="caption" sx={{ color: "text.disabled" }}>No dimension weights set</Typography>;
  }
  return (
    <Box>
      <Box sx={{ display: "flex", height: compact ? 6 : 8, borderRadius: 4, overflow: "hidden", mb: 0.75 }}>
        {weights.map((w) => (
          <Box
            key={w.dimension}
            sx={{ width: `${(w.weight / total) * 100}%`, bgcolor: DIMENSION_DOT_COLOR[w.dimension] }}
          />
        ))}
      </Box>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, columnGap: 1.5 }}>
        {weights.map((w) => (
          <Box key={w.dimension} sx={{ display: "inline-flex", alignItems: "center", gap: 0.625 }}>
            <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: DIMENSION_DOT_COLOR[w.dimension], flexShrink: 0 }} />
            <Typography variant="caption" sx={{ color: "text.secondary" }}>{w.dimension}</Typography>
            <Typography variant="caption" sx={{ color: "text.primary", fontWeight: 700 }}>×{w.weight}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function ProfileCardContent({ profile }: { profile: ScoringProfile }) {
  const version = latestVersion(profile);
  const enabledEntries = version?.entries.filter((e) => e.enabled) ?? [];
  const archived = profile.status === "archived";

  return (
    <Box sx={{ p: 2, height: "100%", display: "flex", flexDirection: "column", opacity: archived ? 0.6 : 1 }}>
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1, mb: 0.5 }}>
        <Box sx={{ minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
            >
              {profile.name}
            </Typography>
            {profile.origin === "auto" && (
              <Chip label="Auto" size="small" color="primary" variant="outlined" sx={{ height: 18, fontSize: "0.6rem" }} />
            )}
          </Box>
          <Typography variant="caption" sx={{ color: "text.secondary", fontFamily: "monospace" }}>
            {profile.slug}
          </Typography>
        </Box>
        <TypeTag type={profile.agentType} />
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5, flexWrap: "wrap" }}>
        <Typography variant="caption" sx={{ fontFamily: "monospace", fontWeight: 600, color: "text.secondary" }}>
          v{version?.version ?? "—"}
        </Typography>
        <Typography variant="caption" sx={{ color: "text.disabled" }}>·</Typography>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          {enabledEntries.length}/{version?.entries.length ?? 0} evals
        </Typography>
        {archived && (
          <Chip label="Archived" size="small" sx={{ height: 18, fontSize: "0.6rem" }} />
        )}
      </Box>

      <Box sx={{ mt: "auto" }}>
        <Typography variant="overline" sx={{ display: "block", color: "text.secondary", lineHeight: 1, mb: 0.75 }}>
          Dimension weights
        </Typography>
        {version && <WeightBar version={version} compact />}
      </Box>
    </Box>
  );
}

function ProfileDetailContent({ profile, navigate }: { profile: ScoringProfile; navigate: (v: View) => void }) {
  const [cloned, setCloned] = useState(false);
  const version = latestVersion(profile);
  const archived = profile.status === "archived";
  const adopters = PROJECTS.filter((p) => p.adoptedProfileId === profile.id);
  const weights = version ? weightEntries(version) : [];
  const groups = useMemo(() => {
    if (!version) return [];
    const byDim = new Map<ShowcaseCategory, typeof version.entries>();
    for (const e of version.entries) {
      const bucket = byDim.get(e.dimension);
      if (bucket) bucket.push(e);
      else byDim.set(e.dimension, [e]);
    }
    return weights
      .map((w) => ({ dimension: w.dimension, entries: byDim.get(w.dimension) ?? [] }))
      .filter((g) => g.entries.length > 0);
  }, [version, weights]);

  return (
    <Box sx={{ p: 3, opacity: archived ? 0.72 : 1 }}>
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.75, pr: 4.5 }}>
        <Box
          sx={{
            flexShrink: 0,
            width: 42,
            height: 42,
            borderRadius: 1,
            display: "grid",
            placeItems: "center",
          }}
        >
          <TypeTag type={profile.agentType} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 700 }}>{profile.name}</Typography>
            {archived
              ? <Chip label="Archived" size="small" sx={{ height: 20, fontSize: "0.65rem" }} />
              : <Chip label="Active" size="small" color="success" sx={{ height: 20, fontSize: "0.65rem" }} />}
            {profile.origin === "auto" && (
              <Chip label="Auto-generated" size="small" color="primary" variant="outlined" sx={{ height: 20, fontSize: "0.65rem" }} />
            )}
          </Box>
          <Typography variant="caption" sx={{ fontFamily: "monospace", color: "text.secondary" }}>
            {profile.slug}
          </Typography>
        </Box>
      </Box>

      {profile.description && (
        <Typography variant="body2" sx={{ color: "text.secondary", mt: 1.5, maxWidth: "60ch" }}>
          {profile.description}
        </Typography>
      )}

      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 1.5, flexWrap: "wrap", color: "text.disabled", typography: "caption" }}>
        <Box component="span">v{version?.version ?? "—"} · created {new Date(profile.createdAt).toLocaleDateString()}</Box>
        {adopters.length > 0 && (
          <Box component="span">
            Adopted by{" "}
            <Box component="span" sx={{ color: "text.secondary", fontWeight: 500 }}>{adopters.length}</Box>{" "}
            agent{adopters.length === 1 ? "" : "s"}
          </Box>
        )}
      </Box>

      <Divider sx={{ my: 2 }} />

      <Typography variant="overline" sx={{ color: "text.secondary", display: "block", mb: 1.5 }}>
        How it scores
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
        Composite is the weight-averaged roll-up across {weights.length} dimension{weights.length === 1 ? "" : "s"},
        then mapped to a verdict against the bands below.
      </Typography>
      {version && (
        <Box sx={{ mb: 2 }}>
          <WeightBar version={version} />
        </Box>
      )}
      <Box sx={{ display: "flex", gap: 2.5, flexWrap: "wrap" }}>
        {(["ship", "review", "block"] as VerdictBandKey[]).map((key) => (
          <Box key={key} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Typography variant="caption" sx={{ color: VERDICT_BAND_META[key].token, fontWeight: 700 }}>
              {VERDICT_BAND_META[key].label}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {key === "block" ? `< ${version?.verdictBands.block ?? 0}` : `≥ ${version?.verdictBands[key] ?? 0}`}
            </Typography>
          </Box>
        ))}
      </Box>

      <Divider sx={{ my: 2 }} />

      <Typography variant="overline" sx={{ color: "text.secondary", display: "block", mb: 1.5 }}>
        Evals that feed it
      </Typography>
      {groups.length === 0 ? (
        <Typography variant="body2" sx={{ color: "text.secondary" }}>This version has no entries.</Typography>
      ) : (
        <Stack sx={{ gap: 2 }}>
          {groups.map((g) => (
            <Box key={g.dimension}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: DIMENSION_DOT_COLOR[g.dimension], flexShrink: 0 }} />
                <Typography variant="caption" sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {g.dimension}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.disabled" }}>
                  · {g.entries.length} {g.entries.length === 1 ? "eval" : "evals"}
                </Typography>
              </Box>
              <Stack sx={{ gap: 0.75, pl: 2 }}>
                {g.entries.map((entry) => (
                  <Box
                    key={entry.id}
                    sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, opacity: entry.enabled ? 1 : 0.5 }}
                  >
                    <Typography variant="body2">{entry.evalName}</Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary", fontFamily: "monospace", flexShrink: 0 }}>
                      {entry.threshold} · ×{entry.weight}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Box>
          ))}
        </Stack>
      )}

      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 3 }}>
        <Button
          variant="outlined"
          color="inherit"
          sx={{ color: cloned ? "success.main" : "text.secondary" }}
          onClick={() => {
            setCloned(true);
            setTimeout(() => setCloned(false), 2000);
          }}
        >
          {cloned ? "Cloned!" : "Clone"}
        </Button>
        <Button variant="contained" onClick={() => navigate({ name: "profile", profileId: profile.id })}>
          Edit profile
        </Button>
      </Box>
    </Box>
  );
}

export default function ProfilesView({ navigate }: Props) {
  const [search, setSearch] = useState("");
  const profiles = PROFILES;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter((p) => p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q));
  }, [profiles, search]);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Scoring Profiles</Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.25 }}>
            Versioned, dimension-weighted eval bundles. Agents adopt a profile version to define how they're scored.
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Tag label={`${profiles.length} profiles`} sx={{ height: 24, fontSize: "0.7rem", fontWeight: 600 }} />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate({ name: "add-profile" })}
          >
            New profile
          </Button>
        </Box>
      </Box>

      {profiles.length === 0 ? (
        <Paper
          variant="outlined"
          sx={{ p: 6, display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5, borderRadius: 2 }}
        >
          <LayersIcon />
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>No profiles yet</Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Create a profile to bundle evals for an agent type.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate({ name: "add-profile" })}
            sx={{ mt: 1 }}
          >
            New profile
          </Button>
        </Paper>
      ) : (
        <>
          <TextField
            size="small"
            placeholder="Filter by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ mb: 2.5, width: 280 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              },
            }}
          />
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: 2,
            }}
          >
            {filtered.map((profile) => (
              <ExpandableCard
                key={profile.id}
                testId={`profile-card-${profile.id}`}
                cardContent={<ProfileCardContent profile={profile} />}
                detailContent={<ProfileDetailContent profile={profile} navigate={navigate} />}
              />
            ))}
          </Box>
          {filtered.length === 0 && (
            <Typography variant="body2" sx={{ color: "text.disabled", mt: 4, textAlign: "center" }}>
              No profiles match your search.
            </Typography>
          )}
        </>
      )}
    </Box>
  );
}
