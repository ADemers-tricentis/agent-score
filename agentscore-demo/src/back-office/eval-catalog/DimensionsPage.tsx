/** Curated dimensions — global, superadmin-managed taxonomy for the Evals Catalog.
 *
 * Visual-browse counterpart to the prior DataTable (catalog-cards-refactor
 * W3-S2): the list body is a `CardGrid` of expandable dimension cards.
 * Curated dimensions are a global, superadmin-only taxonomy (spec §3.1 F3,
 * §4.6): non-superadmins get the access-required message. Edit / "New dimension"
 * navigate to the dedicated DimensionDetailPage / DimensionCreatePage. Archive
 * lives on the Dimension Edit page, not the catalog; the panel keeps
 * Restore for already-archived dimensions. There is no hard delete (dimensions
 * are append-only).
 *
 * The expanded panel derives member evals client-side (evals whose
 * `dimensionIds` includes this dim id) from the eager sibling evals list; a
 * still-loading list shows a skeleton and a failed list reads "Members
 * unavailable." rather than a silent empty (§Feature 1). The panel surfaces no
 * profile-weighting number (composite share is profile-dependent and misleading
 * on a dimension card).
 */

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "@/shared/lib/toast";
import Box from "@mui/material/Box";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import IconMaterialSymbolsLayers from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsLayers.mjs";
import IconMaterialSymbolsSearch from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsSearch.mjs";

import { DIMENSIONS, EVALS } from "@/back-office/eval-catalog/eval-catalog-fixtures";
import {
  renderDimensionCard,
  renderDimensionDetail,
} from "@/back-office/eval-catalog/components/dimension-card";
import { dimensionAccent } from "@/shared/components/dimension-palette";
import { CardGrid } from "@/shared/components/card-grid";
import { FacetedFilter } from "@/shared/components/faceted-filter";
import { pageBandSx } from "@/shared/components/page-band";
import { pageContentSx } from "@/shared/components/page-content";
import { Toolbar } from "@/shared/components/toolbar";
import { useSingleStatusFilter } from "@/shared/hooks/use-single-status-filter";

type StatusFilter = "active" | "archived";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
];

export function DimensionsPage() {
  return <DimensionsList />;
}

function DimensionsList() {
  const { statusFilter, setStatusSingle, status } =
    useSingleStatusFilter<StatusFilter>();
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [, forceRerender] = useState(0);

  const navigate = useNavigate();

  const allDimensions = DIMENSIONS;
  const allEvals = EVALS;
  const allEvalsError: Error | null = null;
  const evalsLoading = false;

  const restore = {
    mutate: (dimensionId: string) => {
      const dim = allDimensions.find((d) => d.id === dimensionId);
      if (dim) dim.status = "active";
      toast.success("Dimension restored");
      forceRerender((n) => n + 1);
    },
  };

  const dimensions = useMemo(
    () => allDimensions.filter((d) => d.status === status),
    [allDimensions, status],
  );

  // Stable accent index: a dimension's hue is fixed by its position in the
  // UNFILTERED list (sorted by id) so it never shifts when the search/status
  // filter narrows the grid.
  const accentIndexById = useMemo(() => {
    const map = new Map<string, number>();
    const sorted = [...allDimensions].sort((a, b) => a.id.localeCompare(b.id));
    sorted.forEach((d, idx) => map.set(d.id, idx));
    return map;
  }, [allDimensions]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return dimensions;
    return dimensions.filter(
      (d) =>
        d.name.toLowerCase().includes(q) || d.slug.toLowerCase().includes(q),
    );
  }, [dimensions, search]);

  // If the open card is filtered out (search/status change), close the panel
  // so selection never points at a card that is no longer rendered (§3.3).
  useEffect(() => {
    if (openId != null && !filtered.some((d) => d.id === openId)) {
      setOpenId(null);
    }
  }, [filtered, openId]);

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
                  "aria-label": "Search dimensions",
                  "data-testid": "search-dimensions",
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
            <FacetedFilter
              title="Status"
              testId="filter-status"
              values={statusFilter}
              onChange={setStatusSingle}
              options={STATUS_OPTIONS}
              searchPlaceholder="Filter status…"
            />
          }
          right={
            filtered.length > 0 ? (
              <Box component="span">
                {filtered.length} dimension
                {filtered.length === 1 ? "" : "s"}
              </Box>
            ) : undefined
          }
        />
      </Box>

      <Box sx={pageContentSx}>
        <CardGrid
          items={filtered}
          isLoading={false}
          error={null}
          getItemId={(d) => d.id}
          getItemTestId={(d) => `dimension-card-${d.id}`}
          getItemLabel={(d) => d.name}
          minCardWidth={330}
          openId={openId}
          onToggle={setOpenId}
          cardHeight={180}
          renderCard={(dim, isOpen) =>
            renderDimensionCard(dim, isOpen, {
              accentColor: dimensionAccent(accentIndexById.get(dim.id) ?? 0),
              allEvals,
              allEvalsLoading: evalsLoading,
              onEdit: () =>
                void navigate({
                  to: "/evals/catalog/dimensions/$dimensionId",
                  params: { dimensionId: dim.id },
                }),
            })
          }
          renderDetail={(dim) =>
            renderDimensionDetail(dim, {
              accentColor: dimensionAccent(accentIndexById.get(dim.id) ?? 0),
              allEvals,
              allEvalsLoading: evalsLoading,
              allEvalsError,
              onEdit: () =>
                void navigate({
                  to: "/evals/catalog/dimensions/$dimensionId",
                  params: { dimensionId: dim.id },
                }),
              onRestore: () => restore.mutate(dim.id),
            })
          }
          emptyState={{
            icon: IconMaterialSymbolsLayers,
            title: search
              ? "No dimensions match your search"
              : status === "archived"
                ? "No archived dimensions"
                : "No dimensions yet",
            description: search
              ? "Try a different search term, or clear it."
              : status === "archived"
                ? "Nothing has been archived yet."
                : "Create a dimension to start tagging evals.",
          }}
        />
      </Box>
    </Box>
  );
}
