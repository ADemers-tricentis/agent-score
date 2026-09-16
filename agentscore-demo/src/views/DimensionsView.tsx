import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Divider from "@mui/material/Divider";
import SvgIcon from "@mui/material/SvgIcon";
import Tag from "@tricentis/aura/components/Tag.js";
import type { ShowcaseCategory, ProfileEntry, EvalKind } from "../types";
import { PROFILES } from "../data/mock";
import { DIMENSION_ORDER, DIMENSION_DOT_COLOR } from "../data/dimensions";
import { DIMENSION_QUESTION } from "../components/ScoreBar";
import ExpandableCard from "../components/ExpandableCard";

const KIND_ORDER: EvalKind[] = ["library_metric", "decision_tree", "llm_judge", "hybrid"];

const KIND_LABELS: Record<EvalKind, string> = {
  library_metric: "Library metric",
  decision_tree: "Decision tree",
  llm_judge: "LLM judge",
  hybrid: "Hybrid",
};

const KIND_COLOR: Record<EvalKind, string> = {
  library_metric: "#38bdf8",
  decision_tree: "#c084fc",
  llm_judge: "#fbbf24",
  hybrid: "#4ade80",
};

function SearchIcon() {
  return <SvgIcon sx={{ fontSize: 18 }}><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" /></SvgIcon>;
}

function LayersIcon() {
  return <SvgIcon sx={{ fontSize: 22 }}><path d="m11.99 18.54-7.37-5.73L3 14.07l9 7 9-7-1.63-1.27zM12 16l7.36-5.73L21 9l-9-7-9 7 1.63 1.27L12 16z" /></SvgIcon>;
}

/** Latest version's entries for every profile, regardless of `enabled` — the
 * dimension catalog is about the eval taxonomy, not a single profile's live
 * config. Deduped by evalSlug (first profile that defines it wins). */
function allLatestEntries(): ProfileEntry[] {
  const bySlug = new Map<string, ProfileEntry>();
  for (const profile of PROFILES) {
    const latest = profile.versions.reduce((max, v) => (v.version > max.version ? v : max), profile.versions[0]);
    if (!latest) continue;
    for (const entry of latest.entries) {
      if (!bySlug.has(entry.evalSlug)) bySlug.set(entry.evalSlug, entry);
    }
  }
  return [...bySlug.values()];
}

function groupByKind(entries: ProfileEntry[]): { kind: EvalKind; evals: ProfileEntry[] }[] {
  const byKind = new Map<EvalKind, ProfileEntry[]>();
  for (const e of entries) {
    const bucket = byKind.get(e.evalKind);
    if (bucket) bucket.push(e);
    else byKind.set(e.evalKind, [e]);
  }
  return KIND_ORDER.filter((k) => byKind.has(k)).map((k) => ({ kind: k, evals: byKind.get(k)! }));
}

function profileCountFor(dimension: ShowcaseCategory): number {
  return PROFILES.filter((p) => {
    const latest = p.versions.reduce((max, v) => (v.version > max.version ? v : max), p.versions[0]);
    return latest?.entries.some((e) => e.dimension === dimension && e.enabled) ?? false;
  }).length;
}

function KindTally({ groups }: { groups: { kind: EvalKind; evals: ProfileEntry[] }[] }) {
  if (groups.length === 0) {
    return <Typography variant="caption" sx={{ color: "text.disabled" }}>No evals tagged yet</Typography>;
  }
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, columnGap: 1.5 }}>
      {groups.map((g) => (
        <Box key={g.kind} sx={{ display: "inline-flex", alignItems: "center", gap: 0.625 }}>
          <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: KIND_COLOR[g.kind], flexShrink: 0 }} />
          <Typography variant="caption" sx={{ color: "text.secondary" }}>{KIND_LABELS[g.kind]}</Typography>
          <Typography variant="caption" sx={{ color: "text.primary", fontWeight: 700 }}>{g.evals.length}</Typography>
        </Box>
      ))}
    </Box>
  );
}

function DimensionCardContent({ dimension, members }: { dimension: ShowcaseCategory; members: ProfileEntry[] }) {
  const groups = groupByKind(members);
  return (
    <Box sx={{ p: 2, height: "100%", display: "flex", flexDirection: "column" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.75 }}>
        <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: DIMENSION_DOT_COLOR[dimension], flexShrink: 0 }} />
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
        >
          {dimension}
        </Typography>
      </Box>
      <Typography
        variant="body2"
        sx={{
          color: "text.secondary",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          mb: 1.5,
        }}
      >
        {DIMENSION_QUESTION[dimension] ?? ""}
      </Typography>
      <Box sx={{ mt: "auto" }}>
        <Typography variant="overline" sx={{ display: "block", color: "text.secondary", lineHeight: 1, mb: 0.75 }}>
          Evals by kind
        </Typography>
        <KindTally groups={groups} />
      </Box>
    </Box>
  );
}

function DimensionDetailContent({ dimension, members }: { dimension: ShowcaseCategory; members: ProfileEntry[] }) {
  const groups = groupByKind(members);
  const profileCount = profileCountFor(dimension);
  const accentColor = DIMENSION_DOT_COLOR[dimension];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.75, pr: 4.5 }}>
        <Box
          sx={{
            flexShrink: 0,
            width: 42,
            height: 42,
            borderRadius: 1,
            display: "grid",
            placeItems: "center",
            color: "#fff",
            bgcolor: accentColor,
          }}
        >
          <LayersIcon />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 700 }}>
            {dimension}
          </Typography>
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, mt: 0.5 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: accentColor, flexShrink: 0 }} />
            <Typography variant="caption" sx={{ color: "text.secondary" }}>Dimension</Typography>
          </Box>
        </Box>
      </Box>

      {DIMENSION_QUESTION[dimension] && (
        <Typography variant="body2" sx={{ color: "text.secondary", mt: 1.5, maxWidth: "60ch" }}>
          {DIMENSION_QUESTION[dimension]}
        </Typography>
      )}

      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 1.5, flexWrap: "wrap", color: "text.disabled", typography: "caption" }}>
        <Box component="span">
          <Box component="span" sx={{ color: "text.secondary", fontWeight: 500 }}>{profileCount}</Box>{" "}
          profile{profileCount === 1 ? "" : "s"} using this dimension
        </Box>
        <Box component="span">
          <Box component="span" sx={{ color: "text.secondary", fontWeight: 500 }}>{members.length}</Box>{" "}
          member eval{members.length === 1 ? "" : "s"}
        </Box>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Typography variant="overline" sx={{ color: "text.secondary", display: "block", mb: 1.5 }}>
        What it measures
      </Typography>
      {members.length === 0 ? (
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          No evals are tagged with this dimension yet.
        </Typography>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
            columnGap: 3.5,
            rowGap: 2.25,
            alignItems: "start",
          }}
        >
          {groups.map((g) => (
            <Box key={g.kind}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: KIND_COLOR[g.kind], flexShrink: 0 }} />
                <Typography variant="caption" sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {KIND_LABELS[g.kind]}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.disabled" }}>
                  · {g.evals.length} {g.evals.length === 1 ? "eval" : "evals"}
                </Typography>
              </Box>
              <Stack sx={{ gap: 0.875, pl: 2 }}>
                {g.evals.map((e) => (
                  <Box key={e.evalSlug} sx={{ display: "flex", alignItems: "center", gap: 1.125, typography: "body2", color: "text.primary" }}>
                    <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: KIND_COLOR[g.kind], flexShrink: 0 }} />
                    {e.evalName}
                  </Box>
                ))}
              </Stack>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

export default function DimensionsView() {
  const [search, setSearch] = useState("");
  const allEntries = useMemo(() => allLatestEntries(), []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return DIMENSION_ORDER;
    return DIMENSION_ORDER.filter((d) => d.toLowerCase().includes(q));
  }, [search]);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3, gap: 2, flexWrap: "wrap" }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Dimensions</Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.25 }}>
            The quality taxonomy every profile draws from. Each dimension groups the evals that measure it.
          </Typography>
        </Box>
        <Tag
          label={`${DIMENSION_ORDER.length} dimensions`}
          sx={{ height: 24, fontSize: "0.7rem", fontWeight: 600 }}
        />
      </Box>

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
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 2,
        }}
      >
        {filtered.map((dimension) => {
          const members = allEntries.filter((e) => e.dimension === dimension);
          return (
            <ExpandableCard
              key={dimension}
              testId={`dimension-card-${dimension}`}
              cardContent={<DimensionCardContent dimension={dimension} members={members} />}
              detailContent={<DimensionDetailContent dimension={dimension} members={members} />}
            />
          );
        })}
      </Box>

      {filtered.length === 0 && (
        <Typography variant="body2" sx={{ color: "text.disabled", mt: 4, textAlign: "center" }}>
          No dimensions match your search.
        </Typography>
      )}
    </Box>
  );
}
