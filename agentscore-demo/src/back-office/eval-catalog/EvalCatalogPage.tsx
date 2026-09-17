/** Evals Catalog list — global, superadmin-managed catalog of eval definitions.
 *
 * Card-grid rewrite + the comprehension-first detail panel.
 * The toolbar chrome (superadmin gate, Toolbar + FacetedFilter + search +
 * `useSingleStatusFilter` + `dimensionsQuery` + the restore mutation) is
 * preserved; the list body is a `CardGrid` (no pagination — all matching
 * cards render). Eval create/edit is API-only for now; the detail panel's
 * Library "how it scores" view reads `metricId` and `rubric` straight off the
 * version's `engine_ref`, and Restore is the only header action.
 *
 * View toggle (Feature 5): Flat / By dimension / By kind. Each group is its own
 * grid with its own open-card accordion via `EvalCardGroup` (mounted keyed by
 * `viewMode + groupKey`, so switching views or regrouping resets the open
 * card). "Used in N profiles" is derived from eagerly-fetched profile **details**
 * (`profileQueryOptions`, ≤8); the open card's version-level detail is fetched
 * lazily on expand (`evalQueryOptions`, `enabled` only when a card is open).
 */

import { useEffect, useMemo, useState } from "react";
import { toast } from "@/shared/lib/toast";
import Box from "@mui/material/Box";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import IconMaterialSymbolsLibraryBooks from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsLibraryBooks.mjs";
import IconMaterialSymbolsSearch from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsSearch.mjs";

import {
  DIMENSIONS,
  EVALS,
  PROFILES_FOR_USAGE_COUNT,
  type EvalDefinitionRead,
  type ProfileRead,
} from "@/back-office/eval-catalog/eval-catalog-fixtures";
import {
  renderEvalCard,
  renderEvalDetail,
} from "@/back-office/eval-catalog/components/eval-card";
import { dimensionAccent } from "@/shared/components/dimension-palette";
import { CardGrid } from "@/shared/components/card-grid";
import { FacetedFilter } from "@/shared/components/faceted-filter";
import { OnboardingCallout } from "@/shared/components/onboarding-callout";
import { pageBandSx } from "@/shared/components/page-band";
import { pageContentSx } from "@/shared/components/page-content";
import { Toolbar } from "@/shared/components/toolbar";
import { useDemoMode } from "@/shared/demo-mode/demo-mode-context";
import { useSingleStatusFilter } from "@/shared/hooks/use-single-status-filter";

const KIND_LABELS: Record<string, string> = {
  library: "Library",
  g_eval: "G-Eval",
  hybrid: "Hybrid",
};

const KIND_OPTIONS = Object.entries(KIND_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
];

/** Fixed `By kind` section order (spec §3.1 F5). */
const KIND_ORDER = ["library", "g_eval", "hybrid"] as const;

type ViewMode = "flat" | "dimension" | "kind";

const CARD_HEIGHT = 200;
const CARD_MIN_WIDTH = 330;

/** Shared deps for the eval detail panel, independent of which card is open. */
interface EvalDetailDeps {
  profileDetails: ProfileRead[];
  profileDetailsError: Error | null;
  dimensionNameById: Map<string, string>;
  dimensionAccentById: Map<string, string>;
  onRestore: (ev: EvalDefinitionRead) => void;
}

/**
 * Build the `renderDetail` for a grid from its OWN lazy eval-detail query +
 * the shared deps. Each accordion scope (the flat grid and every grouped grid)
 * owns its own open card, so each must key the detail fetch on its own open id
 * — a single shared query keyed on one `openId` would leave grouped panels
 * stuck on a skeleton.
 */
function makeEvalDetailRenderer(
  detail: { data?: EvalDefinitionRead; isLoading: boolean; error: Error | null },
  deps: EvalDetailDeps,
) {
  return (ev: EvalDefinitionRead) =>
    renderEvalDetail(ev, {
      detail: detail.data,
      detailLoading: detail.isLoading,
      detailError: detail.error,
      profileDetails: deps.profileDetails,
      profileDetailsError: deps.profileDetailsError,
      dimensionNameById: deps.dimensionNameById,
      dimensionAccentById: deps.dimensionAccentById,
      onRestore: () => deps.onRestore(ev),
    });
}

export function EvalCatalogPage() {
  return <EvalCatalogList />;
}

function EvalCatalogList() {
  const { blank } = useDemoMode();
  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState<string[]>([]);
  const { statusFilter, setStatusSingle, status } = useSingleStatusFilter();
  const [dimensionFilter, setDimensionFilter] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("flat");
  const [openId, setOpenId] = useState<string | null>(null);
  const [, forceRerender] = useState(0);

  const profileDetails: ProfileRead[] = PROFILES_FOR_USAGE_COUNT;
  const profileDetailsError: Error | null = null;

  const openEval = useMemo(() => EVALS.find((e) => e.id === openId) ?? null, [openId]);

  const restore = {
    mutate: (evalId: string) => {
      const ev = EVALS.find((e) => e.id === evalId);
      if (ev) {
        ev.status = "active";
        toast.success(`"${ev.name}" restored`);
        forceRerender((n) => n + 1);
      }
    },
  };

  const dimensions = DIMENSIONS;

  const dimensionNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const d of dimensions) map.set(d.id, d.name);
    return map;
  }, [dimensions]);

  // Stable categorical accent per dimension id — keyed off the full sorted
  // dimension list so a section's color never shifts when the eval set filters.
  const dimensionAccentById = useMemo(() => {
    const map = new Map<string, string>();
    const sorted = [...dimensions].sort((a, b) => a.id.localeCompare(b.id));
    sorted.forEach((d, idx) => map.set(d.id, dimensionAccent(idx)));
    return map;
  }, [dimensions]);

  const dimensionOptions = useMemo(
    () => dimensions.map((d) => ({ value: d.id, label: d.name })),
    [dimensions],
  );

  const evals = useMemo(() => {
    const q = search.trim().toLowerCase();
    return EVALS.filter((e) => {
      if (e.status !== status) return false;
      if (q && !e.name.toLowerCase().includes(q) && !e.slug.toLowerCase().includes(q)) return false;
      if (kindFilter.length > 0 && !kindFilter.includes(e.kind)) return false;
      if (
        dimensionFilter.length > 0 &&
        !dimensionFilter.some((d) => e.dimensionIds.includes(d))
      ) {
        return false;
      }
      return true;
    });
  }, [search, status, kindFilter, dimensionFilter]);

  // If the open card leaves the filtered set (filter/search/archive), close the
  // panel + clear selection (spec §3.4: open card filtered out → panel closes).
  useEffect(() => {
    if (openId != null && !evals.some((e) => e.id === openId)) {
      setOpenId(null);
    }
  }, [evals, openId]);

  // Switching views resets the open card (spec §3.3: view change → open-card
  // state reset).
  useEffect(() => {
    setOpenId(null);
  }, [viewMode]);

  const buildRenderCard = (ev: EvalDefinitionRead, isOpen: boolean) =>
    renderEvalCard(ev, isOpen, {
      dimensionNameById,
    });

  const detailDeps: EvalDetailDeps = {
    profileDetails,
    profileDetailsError,
    dimensionNameById,
    dimensionAccentById,
    onRestore: (ev) => restore.mutate(ev.id),
  };

  // Flat-grid detail — no lazy fetch needed, the fixture already carries
  // full version detail synchronously.
  const flatRenderDetail = makeEvalDetailRenderer(
    { data: openEval ?? undefined, isLoading: false, error: null },
    detailDeps,
  );

  const hasFilters =
    Boolean(search) ||
    kindFilter.length > 0 ||
    status !== "active" ||
    dimensionFilter.length > 0;

  const emptyState = {
    icon: IconMaterialSymbolsLibraryBooks,
    title: "No evals found",
    description: hasFilters
      ? "Try a different search term, or clear the filters."
      : "Create an eval to start building the catalog.",
  };

  // Card-level props shared by the flat grid + every grouped grid (NOT
  // `renderDetail` — each scope builds that from its own open-card query).
  const cardGridProps = {
    isLoading: false,
    error: null as Error | null,
    getItemLabel: (e: EvalDefinitionRead) => e.name,
    renderCard: buildRenderCard,
    cardHeight: CARD_HEIGHT,
    minCardWidth: CARD_MIN_WIDTH,
  };

  // Grouped views: each section is its own grid managing its own open card
  // (spec §3.1 F5). By dimension → an eval appears under each of its dimensions;
  // By kind → an eval appears in exactly one section, in the fixed order.
  const dimensionGroups = useMemo(() => {
    if (viewMode !== "dimension") return [];
    const byDim = new Map<string, EvalDefinitionRead[]>();
    for (const ev of evals) {
      for (const dimId of ev.dimensionIds) {
        const bucket = byDim.get(dimId) ?? [];
        bucket.push(ev);
        byDim.set(dimId, bucket);
      }
    }
    return [...byDim.entries()]
      .map(([dimId, items]) => ({
        key: dimId,
        label: dimensionNameById.get(dimId) ?? dimId,
        accent: dimensionAccentById.get(dimId) ?? dimensionAccent(0),
        items,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [viewMode, evals, dimensionNameById, dimensionAccentById]);

  const kindGroups = useMemo(() => {
    if (viewMode !== "kind") return [];
    const byKind = new Map<string, EvalDefinitionRead[]>();
    for (const ev of evals) {
      const bucket = byKind.get(ev.kind) ?? [];
      bucket.push(ev);
      byKind.set(ev.kind, bucket);
    }
    return KIND_ORDER.filter((kind) => byKind.has(kind)).map((kind, idx) => ({
      key: kind,
      label: KIND_LABELS[kind] ?? kind,
      accent: dimensionAccent(idx),
      items: byKind.get(kind) ?? [],
    }));
  }, [viewMode, evals]);

  const groups =
    viewMode === "dimension"
      ? dimensionGroups
      : viewMode === "kind"
        ? kindGroups
        : [];

  return (
    <Box sx={{ display: "flex", height: "100%", minHeight: 0, flexDirection: "column" }}>
      <Box sx={pageBandSx}>
        <Toolbar
          search={
            <TextField
              size="small"
              fullWidth
              placeholder="Filter by name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              slotProps={{
                htmlInput: {
                  "aria-label": "Search evals",
                  "data-testid": "search-evals",
                },
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <IconMaterialSymbolsSearch
                        sx={{ fontSize: 16, color: "text.secondary" }}
                      />
                    </InputAdornment>
                  ),
                },
              }}
            />
          }
          filters={
            <>
              <FacetedFilter
                title="Kind"
                testId="filter-kind"
                values={kindFilter}
                onChange={setKindFilter}
                options={KIND_OPTIONS}
                searchPlaceholder="Filter kind…"
              />
              <FacetedFilter
                title="Status"
                testId="filter-status"
                values={statusFilter}
                onChange={setStatusSingle}
                options={STATUS_OPTIONS}
                searchPlaceholder="Filter status…"
              />
              <FacetedFilter
                title="Dimension"
                testId="filter-dimension"
                values={dimensionFilter}
                onChange={setDimensionFilter}
                options={dimensionOptions}
                searchPlaceholder="Filter dimension…"
              />
              <ToggleButtonGroup
                exclusive
                size="small"
                value={viewMode}
                onChange={(_e, v: ViewMode | null) => {
                  // ToggleButtonGroup emits null when the active item is
                  // re-clicked; ignore that so a view is always selected.
                  if (v) setViewMode(v);
                }}
                aria-label="View mode"
                data-testid="eval-view-toggle"
              >
                <ToggleButton value="flat" data-testid="eval-view-flat">
                  Flat
                </ToggleButton>
                <ToggleButton value="dimension" data-testid="eval-view-dimension">
                  By dimension
                </ToggleButton>
                <ToggleButton value="kind" data-testid="eval-view-kind">
                  By kind
                </ToggleButton>
              </ToggleButtonGroup>
            </>
          }
          right={
            evals.length > 0 ? (
              <Box component="span">
                {evals.length} eval{evals.length === 1 ? "" : "s"}
              </Box>
            ) : undefined
          }
        />
      </Box>

      <Box sx={pageContentSx} data-tour="eval-catalog">
        {blank ? (
          <Box sx={{ mb: 3 }}>
            <OnboardingCallout title="What gets checked" testId="onboarding-callout-evals">
              These are the evals AgentScore runs out of the box, grouped by dimension. You don't
              have to configure any of them to get a first score.
            </OnboardingCallout>
          </Box>
        ) : null}
        {viewMode === "flat" ? (
          <CardGrid<EvalDefinitionRead>
            {...cardGridProps}
            renderDetail={flatRenderDetail}
            items={evals}
            getItemId={(e) => e.id}
            getItemTestId={(e) => `eval-card-${e.id}`}
            openId={openId}
            onToggle={setOpenId}
            emptyState={emptyState}
          />
        ) : (
          <Stack spacing={4}>
            {groups.map((group) => (
              <EvalCardGroup
                key={`${viewMode}-${group.key}`}
                label={group.label}
                accent={group.accent}
                items={group.items}
                cardGridProps={cardGridProps}
                detailDeps={detailDeps}
              />
            ))}
            {groups.length === 0 ? (
              <CardGrid<EvalDefinitionRead>
                {...cardGridProps}
                renderDetail={flatRenderDetail}
                items={[]}
                getItemId={(e) => e.id}
                getItemTestId={(e) => `eval-card-${e.id}`}
                openId={null}
                onToggle={() => {}}
                emptyState={emptyState}
              />
            ) : null}
          </Stack>
        )}
      </Box>
    </Box>
  );
}

interface EvalCardGroupProps {
  label: string;
  accent: string;
  items: EvalDefinitionRead[];
  cardGridProps: {
    isLoading?: boolean;
    error: Error | null;
    getItemLabel: (ev: EvalDefinitionRead) => string;
    renderCard: (ev: EvalDefinitionRead, isOpen: boolean) => React.ReactNode;
    cardHeight: number;
    minCardWidth: number;
  };
  detailDeps: EvalDetailDeps;
}

/**
 * One grouped section (By dimension / By kind): an accent-dot header + its own
 * `CardGrid` with a section-local `openId`, so each grouped grid is an
 * independent accordion. Mounting it keyed by `viewMode + groupKey` resets this
 * state on view change (spec §3.1 F5). It owns its own lazy eval-detail query
 * keyed on the section-local open card, so a grouped panel resolves its
 * version-level detail (not a permanent skeleton).
 */
function EvalCardGroup({
  label,
  accent,
  items,
  cardGridProps,
  detailDeps,
}: EvalCardGroupProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  const openEval = items.find((e) => e.id === openId) ?? null;

  // Close the section's panel if its open card leaves the (re-filtered) group.
  useEffect(() => {
    if (openId != null && !items.some((e) => e.id === openId)) {
      setOpenId(null);
    }
  }, [items, openId]);

  const renderDetail = makeEvalDetailRenderer(
    { data: openEval ?? undefined, isLoading: false, error: null },
    detailDeps,
  );

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
        <Box
          aria-hidden
          sx={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            bgcolor: accent,
            flexShrink: 0,
          }}
        />
        <Typography variant="h5" sx={{ fontWeight: 600 }}>{label}</Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {items.length}
        </Typography>
      </Box>
      <CardGrid<EvalDefinitionRead>
        {...cardGridProps}
        renderDetail={renderDetail}
        items={items}
        getItemId={(e) => e.id}
        getItemTestId={(e) => `eval-card-${e.id}`}
        openId={openId}
        onToggle={setOpenId}
      />
    </Box>
  );
}
