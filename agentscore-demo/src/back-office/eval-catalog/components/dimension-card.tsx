/** Dimension card + detail renderers (catalog-cards-refactor).
 *
 *  Pure render-prop functions consumed by `CardGrid` on `DimensionsPage`:
 *  `renderDimensionCard` (collapsed tile) + `renderDimensionDetail` (expanded
 *  centered-modal panel). Both are presentation-only — all data + callbacks are
 *  passed in; no queries, no router, no local state here.
 *
 * The detail panel is **comprehension-first**: identity → quiet
 *  provenance → a single **"What it measures"** centerpiece (member evals
 *  grouped by kind in a two-column grid), with Edit as the top-right header
 *  action (Restore when archived; Archive lives on the Dimension Edit page, not
 *  here). It deliberately surfaces **no** profile-weighting number (composite
 * share is profile-dependent and misleading on a dimension card).
 *
 *  The dimension's categorical accent (`dimensionAccent`) reaches `sx` as the
 *  `accentColor` variable (header-badge fill + the "Dimension" tag dot) — UI
 *  only, never colored text (pinned ≥3:1 by token-contrast). The per-kind hues
 *  reuse `kindAccent` (UI ≥3:1) + `kindRamp.text` (AA ≥4.5:1 label text) from the
 *  eval panel, so the two catalog panels read identically.
 */

import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type SvgIcon from "@mui/material/SvgIcon";
import IconMaterialSymbolsCategory from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsCategory.mjs";
import IconMaterialSymbolsEdit from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsEdit.mjs";
import IconMaterialSymbolsFactCheck from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsFactCheck.mjs";
import IconMaterialSymbolsLibraryBooks from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsLibraryBooks.mjs";
import IconMaterialSymbolsReplay from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsReplay.mjs";
import IconMaterialSymbolsUpdate from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsUpdate.mjs";

import type {
  DimensionRead,
  EvalDefinitionRead,
} from "@/back-office/eval-catalog/api";
import {
  KIND_ICONS,
  KIND_LABELS,
  kindAccent,
} from "@/back-office/eval-catalog/components/eval-card";
import { kindRamp } from "@/shared/components/eval-detail-palette";
import { Chip } from "@/shared/components/chip";

/** Grouping order for the "What it measures" kind grid (a dimension-panel
 *  concern; the kind labels/icons/accents are shared from the eval panel). */
const KIND_ORDER = ["library", "g_eval", "hybrid"] as const;

/** Member evals of a dimension: evals whose `dimensionIds` includes the dim id
 *  (membership lives on the evals list, id-keyed — §3.8). */
export function memberEvals(
  dim: DimensionRead,
  allEvals: EvalDefinitionRead[],
): EvalDefinitionRead[] {
  return (allEvals ?? []).filter((e) => e.dimensionIds.includes(dim.id));
}

/** Two-line description clamp — a calm muted body line, ellipsised at 2 rows. */
function descriptionSx(archived: boolean) {
  return {
    color: archived ? "text.disabled" : "text.secondary",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical" as const,
    overflow: "hidden",
  };
}

/** Collapsed dimension tile: accent dot + name + mono slug + 2-line description,
 *  with a neutral Edit icon button top-right. Archived → muted.
 *
 *  The action button sits absolutely over the card (the card body itself is the
 *  CardGrid header `<button>`, so the action cannot be a DOM child of it —
 *  it stops propagation so a click runs the action, not the expand toggle). */
export function renderDimensionCard(
  dim: DimensionRead,
  _isOpen: boolean,
  opts: {
    accentColor: string;
    allEvals: EvalDefinitionRead[];
    allEvalsLoading: boolean;
    onEdit: () => void;
  },
): ReactNode {
  const archived = dim.status === "archived";
  return (
    <Box sx={{ position: "relative", height: "100%", p: 2, pr: 9 }}>
      <Box
        sx={{
          position: "absolute",
          top: 8,
          right: 8,
          display: "flex",
          gap: 0.5,
        }}
      >
        <IconButton
          size="small"
          aria-label={`Edit ${dim.name}`}
          data-testid={`dimension-edit-${dim.id}`}
          onClick={(e) => {
            e.stopPropagation();
            opts.onEdit();
          }}
        >
          <IconMaterialSymbolsEdit sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      <Stack sx={{ gap: 0.75, height: "100%" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            aria-hidden
            sx={{
              width: 10,
              height: 10,
              flexShrink: 0,
              borderRadius: 9999,
              bgcolor: opts.accentColor,
              opacity: archived ? 0.5 : 1,
            }}
          />
          <Typography
            variant="h6"
            component="div"
            sx={{
              flexGrow: 1,
              minWidth: 0,
              fontWeight: 600,
              lineHeight: 1.3,
              color: archived ? "text.secondary" : "text.primary",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {dim.name}
          </Typography>
        </Box>
        <Typography
          variant="caption"
          sx={{
            fontFamily: "monospace",
            color: "text.secondary",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {dim.slug}
        </Typography>
        {dim.description ? (
          <Typography variant="body2" sx={descriptionSx(archived)}>
            {dim.description}
          </Typography>
        ) : null}

        <Box sx={{ mt: "auto", pt: 0.5 }}>
          <Typography
            variant="overline"
            sx={{ display: "block", color: "text.secondary", lineHeight: 1, mb: 0.625 }}
          >
            Evals by kind
          </Typography>
          <CardKindLegend
            dim={dim}
            allEvals={opts.allEvals}
            allEvalsLoading={opts.allEvalsLoading}
          />
        </Box>
      </Stack>
    </Box>
  );
}

/** Compact per-kind member-eval tally for the collapsed card: a kind-accent dot
 *  + kind label + count for each present kind (so the card carries its "what it
 *  measures" at a glance). Skeleton while the evals list loads; a quiet note when
 *  nothing is tagged yet (never a blank). */
function CardKindLegend({
  dim,
  allEvals,
  allEvalsLoading,
}: {
  dim: DimensionRead;
  allEvals: EvalDefinitionRead[];
  allEvalsLoading: boolean;
}): ReactNode {
  if (allEvalsLoading) {
    return <Skeleton variant="text" sx={{ width: "70%" }} />;
  }
  const groups = groupByKind(memberEvals(dim, allEvals));
  if (groups.length === 0) {
    return (
      <Typography variant="caption" sx={{ color: "text.disabled" }}>
        No evals tagged yet
      </Typography>
    );
  }
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, columnGap: 1.5 }}>
      {groups.map((g) => (
        <Box key={g.kind} sx={{ display: "inline-flex", alignItems: "center", gap: 0.625 }}>
          <Box
            aria-hidden
            sx={(theme) => ({
              width: 7,
              height: 7,
              flexShrink: 0,
              borderRadius: 9999,
              bgcolor: kindAccent(g.kind, theme),
            })}
          />
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {KIND_LABELS[g.kind] ?? g.kind}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.primary", fontWeight: 600 }}>
            {g.evals.length}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Detail panel — comprehension-first, "What it measures" by kind
// ---------------------------------------------------------------------------

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
 *  first). Mirrors the eval panel so the two catalog panels read identically. */
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

/** Group member evals by kind in `KIND_ORDER`; out-of-canon kinds trail in
 *  first-seen order so a non-standard kind is never silently dropped (§3.4). */
function groupByKind(
  members: EvalDefinitionRead[],
): { kind: string; evals: EvalDefinitionRead[] }[] {
  // One pass into a Map preserves first-seen order for the out-of-canon kinds.
  const byKind = new Map<string, EvalDefinitionRead[]>();
  for (const e of members) {
    const bucket = byKind.get(e.kind);
    if (bucket) bucket.push(e);
    else byKind.set(e.kind, [e]);
  }
  const canonical = new Set<string>(KIND_ORDER);
  const canonicalGroups = KIND_ORDER.filter((kind) => byKind.has(kind)).map(
    (kind) => ({ kind, evals: byKind.get(kind)! }),
  );
  const extraGroups = [...byKind]
    .filter(([kind]) => !canonical.has(kind))
    .map(([kind, evals]) => ({ kind, evals }));
  return [...canonicalGroups, ...extraGroups];
}

/** One kind cell: a kind-icon badge (white glyph on `kindAccent`, ≥3:1 UI) +
 *  the colored kind label (`kindRamp.text`, ≥4.5:1) + a count, then the member
 *  eval rows (each a kind-accent dot + name, wrapping fully — no truncation). */
function MemberKindGroup({
  kind,
  evals,
}: {
  kind: string;
  evals: EvalDefinitionRead[];
}): ReactNode {
  const KindIcon = KIND_ICONS[kind] ?? IconMaterialSymbolsLibraryBooks;
  const label = KIND_LABELS[kind] ?? kind;
  const ramp = kindRamp(kind);
  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <Box
          aria-hidden
          sx={(theme) => ({
            flexShrink: 0,
            width: 24,
            height: 24,
            borderRadius: 1,
            display: "grid",
            placeItems: "center",
            color: "common.white",
            bgcolor: kindAccent(kind, theme),
          })}
        >
          <KindIcon sx={{ fontSize: 16 }} />
        </Box>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: ramp.text,
          }}
        >
          {label}
        </Typography>
        <Typography variant="caption" sx={{ color: "text.disabled" }}>
          · {evals.length} {evals.length === 1 ? "eval" : "evals"}
        </Typography>
      </Box>
      <Stack sx={{ gap: 0.875, pl: 4 }}>
        {evals.map((e) => (
          <Box
            key={e.id}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.125,
              typography: "body2",
              color: "text.primary",
            }}
          >
            <Box
              aria-hidden
              sx={(theme) => ({
                flexShrink: 0,
                width: 6,
                height: 6,
                borderRadius: "50%",
                bgcolor: kindAccent(kind, theme),
              })}
            />
            {e.name}
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

/** "What it measures": member evals grouped by kind in a 2-column grid. A
 *  skeleton while the evals list loads, "Members unavailable." on error, an
 *  empty note when nothing is tagged, else the grid — so a failed or still-
 *  loading fetch never flashes the empty state (§Feature 1, §5.5). */
function MemberEvalsByKind({
  dim,
  allEvals,
  allEvalsLoading,
  allEvalsError,
}: {
  dim: DimensionRead;
  allEvals: EvalDefinitionRead[];
  allEvalsLoading: boolean;
  allEvalsError: Error | null;
}): ReactNode {
  if (allEvalsError) {
    return (
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        Members unavailable.
      </Typography>
    );
  }
  if (allEvalsLoading) {
    return (
      <Stack sx={{ gap: 1 }}>
        <Skeleton variant="rounded" height={20} width="55%" />
        <Skeleton variant="rounded" height={20} width="70%" />
        <Skeleton variant="rounded" height={20} width="45%" />
      </Stack>
    );
  }
  const groups = groupByKind(memberEvals(dim, allEvals));
  if (groups.length === 0) {
    return (
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        No evals are tagged with this dimension yet.
      </Typography>
    );
  }
  return (
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
        <MemberKindGroup key={g.kind} kind={g.kind} evals={g.evals} />
      ))}
    </Box>
  );
}

/** Expanded dimension panel: a dimension-accent kind-style header
 *  badge + name + slug · "Dimension" tag, top-right Edit (/ Restore when
 *  archived), an optional summary, a quiet `Updated … · N member evals`
 *  provenance line, and the "What it measures" 2-column kind grid. Renders
 *  immediately from `dim` + the eager evals list — no lazy detail fetch, so
 *  there is no panel-wide "Details unavailable" state (member-fetch failure
 *  surfaces in-section as "Members unavailable." — §3.5). */
export function renderDimensionDetail(
  dim: DimensionRead,
  opts: {
    accentColor: string;
    allEvals: EvalDefinitionRead[];
    allEvalsLoading: boolean;
    allEvalsError: Error | null;
    onEdit: () => void;
    onRestore: () => void;
  },
): ReactNode {
  const archived = dim.status === "archived";
  const memberCount = memberEvals(dim, opts.allEvals).length;

  return (
    <Box
      data-testid={`dimension-detail-${dim.id}`}
      sx={{ p: 3, opacity: archived ? 0.72 : 1 }}
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
            bgcolor: opts.accentColor,
          }}
        >
          <IconMaterialSymbolsCategory sx={{ fontSize: 24 }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
              {dim.name}
            </Typography>
            {archived ? <Chip tint="muted">Archived</Chip> : null}
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 0.25 }}>
            <Typography
              variant="caption"
              sx={{ fontFamily: "monospace", color: "text.secondary" }}
            >
              {dim.slug}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.disabled" }}>
              ·
            </Typography>
            <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.75 }}>
              <Box
                aria-hidden
                sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: opts.accentColor }}
              />
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Dimension
              </Typography>
            </Box>
          </Box>
        </Box>
        <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<IconMaterialSymbolsEdit sx={{ fontSize: 18 }} />}
            data-testid={`dimension-detail-edit-${dim.id}`}
            onClick={opts.onEdit}
          >
            Edit
          </Button>
          {archived ? (
            <Button
              variant="outlined"
              size="small"
              startIcon={<IconMaterialSymbolsReplay sx={{ fontSize: 18 }} />}
              data-testid={`dimension-detail-restore-${dim.id}`}
              onClick={opts.onRestore}
            >
              Restore
            </Button>
          ) : null}
        </Stack>
      </Box>

      {dim.description ? (
        <Typography
          variant="body2"
          sx={{ color: "text.secondary", mt: 1.5, maxWidth: "72ch" }}
        >
          {dim.description}
        </Typography>
      ) : null}

      {/* Provenance — quiet meta line (no profile/weighting item). */}
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
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          <IconMaterialSymbolsUpdate aria-hidden sx={{ fontSize: 15 }} />
          Updated {new Date(dim.updatedAt).toLocaleDateString()}
        </Box>
        <Box
          sx={{ display: "flex", alignItems: "center", gap: 0.75 }}
          data-testid={`dimension-members-${dim.id}`}
        >
          <IconMaterialSymbolsFactCheck aria-hidden sx={{ fontSize: 15 }} />
          {/* The count derives from the eager evals list, so it is unknown
              while that list loads or fails — a neutral phrase beats a
              misleading "0" that would contradict the section below (§5.5). */}
          {opts.allEvalsError ? (
            "Member evals unavailable"
          ) : opts.allEvalsLoading ? (
            "Counting member evals…"
          ) : (
            <Box component="span">
              <Box component="span" sx={{ color: "text.secondary", fontWeight: 500 }}>
                {memberCount}
              </Box>{" "}
              member eval{memberCount === 1 ? "" : "s"}
            </Box>
          )}
        </Box>
      </Box>

      <PanelSection icon={IconMaterialSymbolsFactCheck} label="What it measures">
        <MemberEvalsByKind
          dim={dim}
          allEvals={opts.allEvals}
          allEvalsLoading={opts.allEvalsLoading}
          allEvalsError={opts.allEvalsError}
        />
      </PanelSection>
    </Box>
  );
}
