/** Profile card + detail renderers (catalog cards refactor).
 *
 * Renders one scoring profile as a collapsed card and as the expanded
 * centered-modal panel. Version-level data (weights, pinned entries, verdict
 * bands) lives on `versions[]`, which the *list* endpoint omits — so every
 * renderer reads it from the eagerly-fetched GET-by-id `detail` the page passes
 * in, guarding the optional `detail`/`versions`/`entries`/`verdictBands` shapes.
 *
 * The detail panel is **comprehension-first**: identity → quiet
 * provenance → **how it scores** (the composite roll-up: prose → formula →
 * Evals→Dimensions→Composite→Verdict pipeline → dimension-weight composition →
 * verdict-band ladder) → **the evals that feed it**, grouped by dimension. Edit
 * sits top-right (Restore when archived; Archive lives on the Profile
 * Builder, not here). The collapsed card's weight bar gains a labeled
 * dimension legend so the colored bar carries meaning at a glance.
 *
 * Color discipline: the profile identity (badge, formula, pipeline) is
 * the indigo `PROFILE` ramp; verdict zones reuse `VERDICT` (success/warn/error
 * AA shades); eval-row kind tags reuse `kindRamp(kind).text`; weight-bar/dot hues
 * are `dimensionAccent`. Every hex lives in a constant module reached via a
 * variable, so no raw hex / raw px-rem `fontSize` enters `sx`.
 */

import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import type SvgIcon from "@mui/material/SvgIcon";
import IconMaterialSymbolsBalance from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsBalance.mjs";
import IconMaterialSymbolsCategory from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsCategory.mjs";
import IconMaterialSymbolsChecklist from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsChecklist.mjs";
import IconMaterialSymbolsChevronRight from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsChevronRight.mjs";
import IconMaterialSymbolsEdit from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsEdit.mjs";
import IconMaterialSymbolsFlag from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsFlag.mjs";
import IconMaterialSymbolsFunctions from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsFunctions.mjs";
import IconMaterialSymbolsHistory from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsHistory.mjs";
import IconMaterialSymbolsLayers from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsLayers.mjs";
import IconMaterialSymbolsReplay from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsReplay.mjs";
import IconMaterialSymbolsUpdate from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsUpdate.mjs";

import type {
  ProfileRead,
  ProfileVersionRead,
} from "@/back-office/eval-catalog/api";
import { dimensionAccent } from "@/shared/components/dimension-palette";
import { KIND_LABELS } from "@/back-office/eval-catalog/components/eval-card";
import { kindRamp, VERDICT } from "@/shared/components/eval-detail-palette";
import { PROFILE } from "@/back-office/eval-catalog/profile-detail-palette";
import { DISCRIMINATION_VERDICT_CHIP } from "@/back-office/scoring-pipeline/format";
import { Chip, ChipStrip } from "@/shared/components/chip";
import { VerdictBadge } from "@/shared/components/verdict-badge";

/** A pinned-eval entry (no standalone export from the api module — derive it
 *  from the version shape that owns it). */
type ProfileVersionEntryRead = NonNullable<ProfileVersionRead["entries"]>[number];

/** Verdict-band → semantic zone (ship/review/block). Mirrors `aggregate.py`'s
 *  `verdict_for`: `block` is the fall-through for any composite below the lowest
 *  authored floor. */
const VERDICT_ZONE: Record<string, "ship" | "review" | "block"> = {
  ship: "ship",
  ship_note: "ship",
  review: "review",
  block_rec: "block",
  block: "block",
  insufficient_sample: "review",
};

const VERDICT_BAND_LABEL: Record<string, string> = {
  ship: "Ship",
  ship_note: "Ship (note)",
  review: "Review",
  block_rec: "Block (rec)",
  block: "Block",
  insufficient_sample: "Insufficient sample",
};

function verdictZone(band: string): "ship" | "review" | "block" {
  return VERDICT_ZONE[band] ?? "review";
}

/** Verdict zone → its light track tint + AA-safe text shade (reused from the
 *  eval detail palette so the catalog never invents a second verdict hex). */
const ZONE_TINT: Record<"ship" | "review" | "block", string> = {
  ship: VERDICT.passTint,
  review: VERDICT.midTint,
  block: VERDICT.failTint,
};
const ZONE_TEXT: Record<"ship" | "review" | "block", string> = {
  ship: VERDICT.passText,
  review: VERDICT.midText,
  block: VERDICT.failText,
};

/** Latest published version (max `version`), or undefined when none exist.
 *  Guards the optional `versions` so a detail with no published version is a
 *  clean `undefined`, not a throw. */
export function latestVersion(
  detail: ProfileRead | undefined,
): ProfileVersionRead | undefined {
  const versions = detail?.versions ?? [];
  if (versions.length === 0) return undefined;
  return versions.reduce((max: ProfileVersionRead, v: ProfileVersionRead) => (v.version > max.version ? v : max));
}

export interface WeightBarSegment {
  slug: string;
  name: string;
  weight: number;
  /** Share of the total weight, 0–100 (rounded for display width). */
  pct: number;
  color: string;
}

/** Stacked-weight-bar segments from a version's slug-keyed `dimensionWeights`,
 *  one per dimension, normalized to the weight sum. Color is the categorical
 *  `dimensionAccent` keyed by the segment's stable slug-sorted index so a
 *  dimension keeps the same hue regardless of weight order. Returns `[]` when
 *  there is no version or the weights are empty/non-positive. */
export function weightBarSegments(
  version: ProfileVersionRead | undefined,
  dimensionNameBySlug: Map<string, string>,
): WeightBarSegment[] {
  const weights = version?.dimensionWeights ?? {};
  const slugs = Object.keys(weights).sort();
  const total = slugs.reduce((sum, slug) => sum + (weights[slug] || 0), 0);
  if (total <= 0) return [];
  return slugs.map((slug, index) => {
    const weight = weights[slug] || 0;
    return {
      slug,
      name: dimensionNameBySlug.get(slug) ?? slug,
      weight,
      pct: (weight / total) * 100,
      color: dimensionAccent(index),
    };
  });
}

/** A verdict-band zone on the 0–100 ladder. `synthetic` marks the implicit
 *  `block` zone the helper adds for the `[0, lowest-floor)` range (the
 *  `verdict_for` fall-through carries no authored floor). */
export interface VerdictLadderZone {
  band: string;
  label: string;
  zone: "ship" | "review" | "block";
  floor: number;
  from: number;
  to: number;
  synthetic: boolean;
}

/** Ordered 0–100 zones for the verdict ladder. Each authored band (sorted by
 *  floor ascending) becomes `[floor, nextFloor)` (top band → 100). When there is
 *  no explicit `block` floor at 0, synthesize the implicit `block` zone
 *  `[0, lowestFloor)` so the bottom of the track is never an unlabeled gap —
 *  exactly the range where `verdict_for` returns block. Empty/null → `[]`.
 *  Floors are clamped to [0,100] for layout safety; never throws (§5.5). */
export function verdictLadderZones(
  bands: Record<string, number>,
): VerdictLadderZone[] {
  const entries = Object.entries(bands ?? {});
  if (entries.length === 0) return [];
  const clamp = (n: number) => Math.max(0, Math.min(100, n));
  const asc = entries
    .map(([band, floor]) => ({ band, floor: clamp(floor) }))
    .sort((a, b) => a.floor - b.floor);

  const hasZeroBlock = asc.some(
    (b) => verdictZone(b.band) === "block" && b.floor === 0,
  );
  const ordered: { band: string; floor: number; synthetic: boolean }[] =
    !hasZeroBlock && asc[0].floor > 0
      ? [
          { band: "block", floor: 0, synthetic: true },
          ...asc.map((b) => ({ ...b, synthetic: false })),
        ]
      : asc.map((b) => ({ ...b, synthetic: false }));

  return ordered.map((b, i) => ({
    band: b.band,
    label: VERDICT_BAND_LABEL[b.band] ?? b.band,
    zone: verdictZone(b.band),
    floor: b.floor,
    from: b.floor,
    to: i < ordered.length - 1 ? ordered[i + 1].floor : 100,
    synthetic: b.synthetic,
  }));
}

export interface DimensionEntryGroup {
  dimensionId: string;
  name: string;
  slug: string | undefined;
  color: string;
  /** Renormalizable authored weight; `null` ⇒ the dimension carries no weight. */
  weight: number | null;
  pct: number | null;
  entries: ProfileVersionEntryRead[];
}

/** Group a version's pinned entries by `dimensionId`, ordered to **match the
 *  weight-bar slug order** so a dimension's hue is identical in the composition
 *  bar, its legend, and this section. Weighted dimensions lead (in slug-sorted
 *  order, colored by their weight-bar index); a dimension absent from
 *  `dimensionWeights` trails as its own unweighted group with a continuing
 *  (non-colliding) accent index. An unmapped `dimensionId` falls back to the raw
 *  id as its name. Never throws (§5.5). */
export function groupEntriesByDimension(
  entries: ProfileVersionEntryRead[],
  weights: Record<string, number>,
  dimensionNameById: Map<string, string>,
  dimensionSlugById: Map<string, string>,
): DimensionEntryGroup[] {
  const safeEntries = entries ?? [];
  const safeWeights = weights ?? {};
  const weightSlugs = Object.keys(safeWeights).sort();
  const total = weightSlugs.reduce((sum, slug) => sum + (safeWeights[slug] || 0), 0);
  const slugIndex = new Map<string, number>();
  weightSlugs.forEach((slug, i) => slugIndex.set(slug, i));

  // Distinct dimensionIds in first-seen order.
  const byDim = new Map<string, ProfileVersionEntryRead[]>();
  for (const e of safeEntries) {
    const bucket = byDim.get(e.dimensionId);
    if (bucket) bucket.push(e);
    else byDim.set(e.dimensionId, [e]);
  }

  const weighted: DimensionEntryGroup[] = [];
  const unweighted: DimensionEntryGroup[] = [];
  for (const [dimensionId, dimEntries] of byDim) {
    const slug = dimensionSlugById.get(dimensionId);
    const name = dimensionNameById.get(dimensionId) ?? dimensionId;
    const isWeighted =
      slug != null && Object.prototype.hasOwnProperty.call(safeWeights, slug);
    if (isWeighted) {
      const weight = safeWeights[slug];
      weighted.push({
        dimensionId,
        name,
        slug,
        color: dimensionAccent(slugIndex.get(slug)!),
        weight,
        pct: total > 0 ? (weight / total) * 100 : null,
        entries: dimEntries,
      });
    } else {
      unweighted.push({
        dimensionId,
        name,
        slug,
        color: dimensionAccent(0), // re-indexed below to a non-colliding hue
        weight: null,
        pct: null,
        entries: dimEntries,
      });
    }
  }
  weighted.sort((a, b) => slugIndex.get(a.slug!)! - slugIndex.get(b.slug!)!);
  // Continue the accent index past the weighted hues so an unweighted group
  // never reuses a weighted dimension's color.
  unweighted.forEach((g, j) => {
    g.color = dimensionAccent(weightSlugs.length + j);
  });
  return [...weighted, ...unweighted];
}

interface WeightBarProps {
  segments: WeightBarSegment[];
}

/** The stacked horizontal weight bar shared by the card + the panel. Each
 *  segment's width is its `pct`; the accent fill is a runtime value (not a
 *  literal), so it sidesteps the raw-hex `sx` ban. */
function WeightBar({ segments }: WeightBarProps) {
  return (
    <Box
      data-slot="weight-bar"
      sx={{
        display: "flex",
        width: "100%",
        height: 8,
        borderRadius: 9999,
        overflow: "hidden",
        bgcolor: "action.hover",
      }}
    >
      {segments.map((segment) => (
        <Tooltip
          key={segment.slug}
          title={`${segment.name} · ${segment.weight}`}
          arrow
        >
          <Box
            data-slot="weight-bar-segment"
            data-dimension={segment.slug}
            sx={{ width: `${segment.pct}%`, bgcolor: segment.color }}
          />
        </Tooltip>
      ))}
    </Box>
  );
}

/** "no published version" placeholder where the weight bar would go. */
function NoVersionBar() {
  return (
    <Typography
      data-slot="profile-no-version"
      variant="caption"
      sx={{ color: "text.secondary" }}
    >
      No published version
    </Typography>
  );
}

/** Compact card weight legend (mock-card Option A): the first 3 segments as
 *  dot·name, then "+N more". A distinct `card-weight-legend` slot keeps it
 *  separable from the panel's fuller `weight-legend` (§3.2). */
function CardWeightLegend({ segments }: { segments: WeightBarSegment[] }) {
  const LIMIT = 3;
  const shown = segments.slice(0, LIMIT);
  const more = segments.length - shown.length;
  return (
    <Box
      data-slot="card-weight-legend"
      sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, columnGap: 1.5 }}
    >
      {shown.map((segment) => (
        <Box
          key={segment.slug}
          sx={{ display: "inline-flex", alignItems: "center", gap: 0.75 }}
        >
          <Box
            aria-hidden
            sx={{
              width: 7,
              height: 7,
              borderRadius: 9999,
              flexShrink: 0,
              bgcolor: segment.color,
            }}
          />
          <Typography variant="caption" sx={{ color: "text.primary" }}>
            {segment.name}
          </Typography>
        </Box>
      ))}
      {more > 0 ? (
        <Typography variant="caption" sx={{ color: "text.disabled" }}>
          +{more} more
        </Typography>
      ) : null}
    </Box>
  );
}

interface ProfileCardActionsProps {
  id: string;
  onEdit: () => void;
}

/** Borderless Edit icon button, top-right of the card. `stopPropagation`
 *  keeps a button click from toggling the accordion. */
function ProfileCardActions({ id, onEdit }: ProfileCardActionsProps) {
  return (
    <Box
      sx={{ display: "flex", gap: 0.5, flexShrink: 0 }}
      onClick={(e) => e.stopPropagation()}
    >
      <IconButton
        size="small"
        aria-label="Edit profile"
        data-testid={`profile-edit-${id}`}
        onClick={onEdit}
      >
        <IconMaterialSymbolsEdit fontSize="small" />
      </IconButton>
    </Box>
  );
}

export interface RenderProfileCardOpts {
  detail: ProfileRead | undefined;
  detailLoading: boolean;
  dimensionNameBySlug: Map<string, string>;
  onEdit: () => void;
}

/** Collapsed profile card: badge, name, `slug · v{n}`, description, eval-count
 *  chip, and the stacked dimension-weight bar from the latest
 *  version — now with a "Dimension weights" caption + dot·name legend so the
 * colored bar carries meaning. Version-level fields come from
 *  `opts.detail` (the list omits them); while it is in flight the version label
 *  + bar render as skeletons, and a profile with no published version shows an
 *  explicit empty state rather than a blank bar. */
export function renderProfileCard(
  profile: ProfileRead,
  _isOpen: boolean,
  opts: RenderProfileCardOpts,
): ReactNode {
  const { detail, detailLoading, dimensionNameBySlug } = opts;
  const isArchived = profile.status === "archived";
  const version = latestVersion(detail);
  const segments = weightBarSegments(version, dimensionNameBySlug);
  const entryCount = version?.entries?.length ?? 0;
  // No rows yet (`null`/`undefined`), or a verdict this build doesn't
  // recognize, renders no chip at all — never a "not assessed" state, which
  // could be misread as a measured result.
  const discriminationChip = profile.discriminationVerdict
    ? DISCRIMINATION_VERDICT_CHIP[profile.discriminationVerdict]
    : null;

  const versionLabel = (() => {
    if (detailLoading || !detail) {
      return <Skeleton variant="text" sx={{ width: 28, display: "inline-block" }} />;
    }
    return version ? `v${version.version}` : "no version";
  })();

  return (
    <Stack
      data-archived={isArchived || undefined}
      sx={{ height: "100%", p: 2, gap: 1, opacity: isArchived ? 0.6 : 1 }}
    >
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
        <Box
          aria-hidden
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 32,
            height: 32,
            flexShrink: 0,
            borderRadius: 1,
            bgcolor: PROFILE.accent,
            color: "common.white",
          }}
        >
          <IconMaterialSymbolsLayers fontSize="small" />
        </Box>
        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
          <Typography
            variant="h6"
            component="div"
            noWrap
            title={profile.name}
            sx={{ fontWeight: 600, lineHeight: 1.3 }}
          >
            {profile.name}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }} noWrap>
            <Box component="span" sx={{ fontFamily: "monospace" }}>
              {profile.slug}
            </Box>
            {" · "}
            {versionLabel}
          </Typography>
        </Box>
        <ProfileCardActions id={profile.id} onEdit={opts.onEdit} />
      </Box>

      <Typography
        variant="body2"
        sx={{
          color: "text.secondary",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {profile.description ?? "No description."}
      </Typography>

      <ChipStrip>
        <Chip tint="muted">
          {entryCount} {entryCount === 1 ? "eval" : "evals"}
        </Chip>
        {discriminationChip ? (
          <Chip
            tint={discriminationChip.tint}
            data-testid={`profile-discrimination-${profile.id}`}
          >
            {discriminationChip.label}
          </Chip>
        ) : null}
      </ChipStrip>

      <Box sx={{ mt: "auto", pt: 0.5 }}>
        {detailLoading || !detail ? (
          <Skeleton
            data-slot="weight-bar-skeleton"
            variant="rounded"
            sx={{ height: 8, borderRadius: 9999 }}
          />
        ) : segments.length > 0 ? (
          <Stack sx={{ gap: 0.625 }}>
            <Typography
              variant="overline"
              sx={{ color: "text.secondary", lineHeight: 1 }}
            >
              Dimension weights
            </Typography>
            <WeightBar segments={segments} />
            <CardWeightLegend segments={segments} />
          </Stack>
        ) : (
          <NoVersionBar />
        )}
      </Box>
    </Stack>
  );
}

// ---------------------------------------------------------------------------
// Detail panel — composite-first, "how it scores" + evals by dimension
// ---------------------------------------------------------------------------

/** One provenance meta-line item (icon + text); the emphasized run within it. */
const metaItemSx = { display: "flex", alignItems: "center", gap: 0.75 } as const;
const metaEmphasisSx = { color: "text.secondary", fontWeight: 500 } as const;

/** An overline section label with a leading icon (1:1 with the eval panel). */
function SectionLabel({
  icon: Icon,
  children,
}: {
  icon: typeof SvgIcon;
  children: ReactNode;
}) {
  return (
    <Typography
      variant="overline"
      sx={{
        color: "text.secondary",
        display: "flex",
        alignItems: "center",
        gap: 0.75,
        mb: 1.5,
      }}
    >
      <Icon aria-hidden sx={{ fontSize: 16 }} />
      {children}
    </Typography>
  );
}

/** A panel section: an icon'd overline label + a divider above (except the
 *  first). Mirrors the eval panel so the catalog panels read identically. */
function PanelSection({
  icon,
  label,
  first,
  children,
}: {
  icon: typeof SvgIcon;
  label: string;
  first?: boolean;
  children: ReactNode;
}) {
  return (
    <Box
      sx={{
        pt: first ? 0 : 2,
        mt: first ? 0 : 2,
        borderTop: first ? 0 : 1,
        borderColor: "divider",
      }}
    >
      <SectionLabel icon={icon}>{label}</SectionLabel>
      {children}
    </Box>
  );
}

/** A small caption subhead inside the score-card (weight composition / ladder). */
function SubHead({ icon: Icon, children }: { icon: typeof SvgIcon; children: ReactNode }) {
  return (
    <Typography
      variant="caption"
      component="div"
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.75,
        fontWeight: 600,
        color: "text.secondary",
        mb: 1,
      }}
    >
      <Icon aria-hidden sx={{ fontSize: 15, color: "text.disabled" }} />
      {children}
    </Typography>
  );
}

/** One stage in the Evals→Dimensions→Composite→Verdict pipeline. The Composite
 *  + Verdict stages are tinted indigo (`accent`) to mark where the profile's own
 *  math happens; the input stages are neutral. */
function PipelineStage({
  icon: Icon,
  label,
  body,
  accent,
}: {
  icon: typeof SvgIcon;
  label: string;
  body: string;
  accent: boolean;
}) {
  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 118,
        borderRadius: 1,
        p: 1.25,
        border: 1,
        borderColor: accent ? PROFILE.accentBorder : "divider",
        bgcolor: accent ? PROFILE.accentTint : "background.paper",
      }}
    >
      <Typography
        variant="overline"
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          color: accent ? PROFILE.accentText : "text.secondary",
          mb: 0.5,
        }}
      >
        <Icon aria-hidden sx={{ fontSize: 15 }} />
        {label}
      </Typography>
      <Typography variant="caption" sx={{ color: "text.primary" }}>
        {body}
      </Typography>
    </Box>
  );
}

/** The 0–100 verdict-band ladder (the profile analog of the eval threshold
 *  gauge): a zone-colored track + a 0/score/100 foot + a descending-floor label
 *  row. Empty bands → an explanatory callout (Feature 1). */
function VerdictLadder({ verdictBands }: { verdictBands: Record<string, number> }) {
  const zones = verdictLadderZones(verdictBands);
  if (zones.length === 0) {
    return (
      <Box sx={{ mt: 2.25 }}>
        <Typography variant="caption" sx={{ color: "text.disabled", fontStyle: "italic" }}>
          No verdict bands authored — a run reports the raw composite score with
          no ship / review / block call.
        </Typography>
      </Box>
    );
  }
  // The label row reads top-floor first; the track stays in ascending order.
  const labelRow = [...zones].sort((a, b) => b.floor - a.floor);
  return (
    <Box data-slot="verdict-ladder" sx={{ mt: 2.25 }}>
      <SubHead icon={IconMaterialSymbolsFlag}>
        Verdict bands — the band the composite clears
      </SubHead>
      <Box
        sx={{
          display: "flex",
          height: 16,
          borderRadius: 1,
          overflow: "hidden",
          border: 1,
          borderColor: "divider",
        }}
      >
        {zones.map((z) => (
          <Box
            key={z.band}
            aria-hidden
            sx={{ width: `${Math.max(0, z.to - z.from)}%`, bgcolor: ZONE_TINT[z.zone] }}
          />
        ))}
      </Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          mt: 0.75,
          color: "text.disabled",
          typography: "caption",
        }}
      >
        <Box component="span">0</Box>
        <Box component="span">composite score (0–100)</Box>
        <Box component="span">100</Box>
      </Box>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
        {labelRow.map((z) => (
          <Box
            key={z.band}
            data-band={z.band}
            sx={{ display: "inline-flex", alignItems: "center", gap: 0.75 }}
          >
            <VerdictBadge verdict={z.zone} label={z.label} />
            <Typography
              variant="caption"
              sx={{ fontFamily: "monospace", color: ZONE_TEXT[z.zone] }}
            >
              {/* The synthesized block's `to` IS the lowest authored floor. */}
              {z.synthetic ? `composite < ${z.to}` : `composite ≥ ${z.floor}`}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

/** "How it scores" body: algorithm prose → formula → pipeline → dimension-weight
 *  composition → verdict ladder. Structural/explanatory (no live scores — the
 *  catalog has no run), exactly like the eval panel's illustrative formula. */
function ScoringCard({
  segments,
  verdictBands,
}: {
  segments: WeightBarSegment[];
  verdictBands: Record<string, number>;
}) {
  const chevron = (
    <Box
      aria-hidden
      sx={{ display: "grid", placeItems: "center", px: 0.5, color: PROFILE.accentBorder }}
    >
      <IconMaterialSymbolsChevronRight sx={{ fontSize: 22 }} />
    </Box>
  );
  return (
    <Box
      sx={{
        bgcolor: "background.default",
        border: 1,
        borderColor: "divider",
        borderRadius: 1,
        p: 2,
      }}
    >
      <Typography variant="body2" sx={{ mb: 1.75, lineHeight: 1.6 }}>
        A profile rolls many evals into <Box component="b" sx={{ fontWeight: 600 }}>one 0–100
        composite</Box>: each eval scores 0–1 and averages within its dimension, then the
        dimensions combine by <Box component="b" sx={{ fontWeight: 600 }}>weight</Box>. The
        composite maps to a verdict band. Evals below the min-sample floor are
        excluded, and a dimension with no qualifying evals reports{" "}
        <Box component="b" sx={{ fontWeight: 600 }}>N/A — it never counts as 0</Box>.
      </Typography>
      <Box
        sx={{
          mb: 2,
          borderRadius: 1,
          p: 1.5,
          textAlign: "center",
          fontFamily: "monospace",
          typography: "body2",
          bgcolor: PROFILE.accentTint,
          border: 1,
          borderColor: PROFILE.accentBorder,
          color: PROFILE.accentText,
        }}
      >
        composite = Σ ( weightᵢ × dimension scoreᵢ ) ÷ Σ weightᵢ × 100
      </Box>
      <Box sx={{ display: "flex", alignItems: "stretch", flexWrap: "wrap", mb: 2 }}>
        <PipelineStage icon={IconMaterialSymbolsChecklist} label="Evals" body="each scores 0–1" accent={false} />
        {chevron}
        <PipelineStage icon={IconMaterialSymbolsCategory} label="Dimensions" body="weighted mean per dimension" accent={false} />
        {chevron}
        <PipelineStage icon={IconMaterialSymbolsFunctions} label="Composite" body="weighted across dimensions ×100" accent />
        {chevron}
        <PipelineStage icon={IconMaterialSymbolsFlag} label="Verdict" body="band the score clears" accent />
      </Box>
      <Box>
        <SubHead icon={IconMaterialSymbolsBalance}>
          Dimension weights — renormalized to 100%
        </SubHead>
        {segments.length > 0 ? (
          <Stack sx={{ gap: 1 }}>
            <WeightBar segments={segments} />
            <WeightLegend segments={segments} />
          </Stack>
        ) : (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            This version has no dimension weights.
          </Typography>
        )}
      </Box>
      <VerdictLadder verdictBands={verdictBands} />
    </Box>
  );
}

interface WeightLegendProps {
  segments: WeightBarSegment[];
}

/** Dimension-weight legend under the panel's weight bar — one dot+name+pct per
 *  segment. The dot fill is the same runtime `dimensionAccent` value. */
function WeightLegend({ segments }: WeightLegendProps) {
  return (
    <Box
      data-slot="weight-legend"
      sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}
    >
      {segments.map((segment) => (
        <Box
          key={segment.slug}
          sx={{ display: "inline-flex", alignItems: "center", gap: 0.75 }}
        >
          <Box
            aria-hidden
            sx={{
              width: 8,
              height: 8,
              borderRadius: 9999,
              flexShrink: 0,
              bgcolor: segment.color,
            }}
          />
          <Typography variant="caption" sx={{ color: "text.primary" }}>
            {segment.name}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: "text.secondary", fontFamily: "monospace" }}
          >
            {Math.round(segment.pct)}%
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

/** One dimension group in "Evals in this profile": a colored dim dot + name +
 *  weight chip, then a compact table of its pinned evals. */
function DimensionEvalGroup({ group }: { group: DimensionEntryGroup }) {
  const headSx = {
    typography: "overline",
    color: "text.secondary",
    borderColor: "divider",
    py: 0.5,
  } as const;
  const numSx = { fontFamily: "monospace", typography: "caption" } as const;
  return (
    <Box data-slot="dimension-eval-group" data-dimension={group.dimensionId}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
        <Box
          aria-hidden
          sx={{ width: 9, height: 9, borderRadius: 9999, flexShrink: 0, bgcolor: group.color }}
        />
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {group.name}
        </Typography>
        <Chip tint="muted">
          {group.weight != null
            ? `weight ${group.weight} · ${group.pct != null ? Math.round(group.pct) : "—"}%`
            : "unweighted"}
        </Chip>
      </Box>
      <Table size="small" data-slot="profile-entries">
        <TableHead>
          <TableRow>
            <TableCell sx={headSx}>Eval</TableCell>
            <TableCell align="right" sx={{ ...headSx, width: 96 }}>Threshold</TableCell>
            <TableCell align="right" sx={{ ...headSx, width: 80 }}>Weight</TableCell>
            <TableCell align="right" sx={{ ...headSx, width: 96 }}>State</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {group.entries.map((entry) => {
            const ramp = kindRamp(entry.kind);
            return (
              <TableRow key={entry.id} sx={{ opacity: entry.enabled ? 1 : 0.55 }}>
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
                    <Box component="span" sx={{ fontWeight: 500 }}>
                      {entry.evalName}
                    </Box>
                    <Chip tint="outline">
                      <Box component="span" sx={{ fontFamily: "monospace" }}>
                        v{entry.evalVersion}
                      </Box>
                    </Chip>
                    <Chip tint="outline" sx={{ color: ramp.text, borderColor: ramp.text }}>
                      {KIND_LABELS[entry.kind] ?? entry.kind}
                    </Chip>
                  </Box>
                </TableCell>
                <TableCell align="right" sx={numSx}>
                  {entry.threshold.toFixed(2)}
                </TableCell>
                <TableCell align="right" sx={numSx}>
                  {entry.weight}
                </TableCell>
                <TableCell align="right">
                  {entry.enabled ? (
                    <Chip tint="success">Enabled</Chip>
                  ) : (
                    <Chip tint="muted">Disabled</Chip>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Box>
  );
}

export interface RenderProfileDetailOpts {
  detail: ProfileRead | undefined;
  detailLoading: boolean;
  detailError: Error | null;
  dimensionNameById: Map<string, string>;
  dimensionNameBySlug: Map<string, string>;
  dimensionSlugById: Map<string, string>;
  onEdit: () => void;
  onRestore: () => void;
}

/** Expanded profile panel: a `layers` header badge + name + slug · vN,
 *  top-right Edit (/ Restore when archived), a quiet provenance line, the
 *  composite "How it scores" centerpiece, and the evals grouped by dimension —
 *  all from the eager `detail`. While the detail is in flight it shows a
 *  skeleton; on detail error an explicit "details unavailable" note (never a
 *  silent blank); a profile with no published version shows the empty state. */
export function renderProfileDetail(
  profile: ProfileRead,
  opts: RenderProfileDetailOpts,
): ReactNode {
  const {
    detail,
    detailLoading,
    detailError,
    dimensionNameById,
    dimensionNameBySlug,
    dimensionSlugById,
  } = opts;
  const isArchived = profile.status === "archived";
  const version = latestVersion(detail);

  const body = (() => {
    if (detailError) {
      return (
        <Typography
          data-slot="profile-detail-error"
          variant="body2"
          sx={{ color: "error.main", mt: 2 }}
        >
          Profile details unavailable — {detailError.message}
        </Typography>
      );
    }
    if (detailLoading || !detail) {
      return (
        <Stack sx={{ gap: 1, mt: 2 }}>
          <Skeleton variant="rounded" sx={{ height: 8, borderRadius: 9999 }} />
          <Skeleton variant="rounded" sx={{ height: 150 }} />
        </Stack>
      );
    }
    if (!version) {
      return (
        <Typography
          data-slot="profile-no-version"
          variant="body2"
          sx={{ color: "text.secondary", mt: 2 }}
        >
          No published version yet — publish a version to define this
          profile&apos;s evals, dimension weights, and verdict bands.
        </Typography>
      );
    }

    const segments = weightBarSegments(version, dimensionNameBySlug);
    const verdictBands = version.verdictBands ?? {};
    const groups = groupEntriesByDimension(
      version.entries ?? [],
      version.dimensionWeights ?? {},
      dimensionNameById,
      dimensionSlugById,
    );
    const evalCount = version.entries?.length ?? 0;

    return (
      <>
        {profile.description ? (
          <Typography
            variant="body2"
            sx={{ color: "text.secondary", mt: 1.5, maxWidth: "72ch" }}
          >
            {profile.description}
          </Typography>
        ) : null}

        {/* Provenance — quiet meta line (replaces the version-history section). */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            mt: 1.5,
            flexWrap: "wrap",
            color: "text.disabled",
            typography: "caption",
          }}
        >
          <Box sx={metaItemSx}>
            <IconMaterialSymbolsHistory aria-hidden sx={{ fontSize: 15 }} />
            <Box component="span">
              <Box component="span" sx={metaEmphasisSx}>
                v{version.version}
              </Box>{" "}
              · latest
            </Box>
          </Box>
          <Box sx={metaItemSx}>
            <IconMaterialSymbolsUpdate aria-hidden sx={{ fontSize: 15 }} />
            Updated {new Date(profile.updatedAt).toLocaleDateString()}
          </Box>
          <Box sx={metaItemSx}>
            <IconMaterialSymbolsChecklist aria-hidden sx={{ fontSize: 15 }} />
            <Box component="span">
              <Box component="span" sx={metaEmphasisSx}>
                {evalCount}
              </Box>{" "}
              eval{evalCount === 1 ? "" : "s"} across{" "}
              <Box component="span" sx={metaEmphasisSx}>
                {groups.length}
              </Box>{" "}
              dimension{groups.length === 1 ? "" : "s"}
            </Box>
          </Box>
        </Box>

        <PanelSection icon={IconMaterialSymbolsFunctions} label="How it scores">
          <ScoringCard segments={segments} verdictBands={verdictBands} />
        </PanelSection>

        <PanelSection icon={IconMaterialSymbolsChecklist} label="Evals in this profile">
          {groups.length > 0 ? (
            <Stack sx={{ gap: 2 }}>
              {groups.map((group) => (
                <DimensionEvalGroup key={group.dimensionId} group={group} />
              ))}
            </Stack>
          ) : (
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              This version has no pinned evals.
            </Typography>
          )}
        </PanelSection>
      </>
    );
  })();

  return (
    <Box
      data-testid={`profile-detail-${profile.id}`}
      sx={{ p: 3, opacity: isArchived ? 0.72 : 1 }}
    >
      {/* Header — identity + top-right actions (pr clears the modal close ✕). */}
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.75, pr: 4.5 }}>
        <Box
          aria-hidden
          sx={{
            flexShrink: 0,
            width: 42,
            height: 42,
            borderRadius: 1,
            display: "grid",
            placeItems: "center",
            color: "common.white",
            bgcolor: PROFILE.accent,
          }}
        >
          <IconMaterialSymbolsLayers sx={{ fontSize: 24 }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
              {profile.name}
            </Typography>
            {isArchived ? <Chip tint="muted">Archived</Chip> : null}
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 0.25 }}>
            <Typography
              variant="caption"
              sx={{ fontFamily: "monospace", color: "text.secondary" }}
            >
              {profile.slug}
            </Typography>
            {version ? (
              <>
                <Typography variant="caption" sx={{ color: "text.disabled" }}>
                  ·
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  v{version.version}
                </Typography>
              </>
            ) : null}
          </Box>
        </Box>
        <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<IconMaterialSymbolsEdit sx={{ fontSize: 18 }} />}
            data-testid={`profile-detail-edit-${profile.id}`}
            onClick={opts.onEdit}
          >
            Edit
          </Button>
          {isArchived ? (
            <Button
              variant="text"
              size="small"
              startIcon={<IconMaterialSymbolsReplay sx={{ fontSize: 18 }} />}
              data-testid={`profile-restore-${profile.id}`}
              onClick={opts.onRestore}
            >
              Restore
            </Button>
          ) : null}
        </Stack>
      </Box>

      {body}
    </Box>
  );
}
