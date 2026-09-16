/** Profiles list — global, superadmin-managed catalog of scoring profiles.
 *
 * Catalog cards refactor, slice W3-S3 (spec §3.1 Feature 4, §3.4, §3.5, §3.8).
 * A profile is a dimension-weighted, thresholded set of
 * evals that pin exact `eval_version` ids; profiles are versioned. The body is
 * a `CardGrid` — one expandable card per profile, full-width detail
 * panel on expand — replacing the former DataTable + pagination + row-kebab.
 *
 * Version-level data (weight bar, pinned entries, verdict bands, history) lives
 * on `versions[]`, which the *list* endpoint omits. So every visible profile's
 * GET-by-id detail is fetched eagerly (§3.8) via a bounded `useQueries` fan-out
 * (≤8 profiles per the spec) and threaded into the card + panel renderers; the
 * collapsed card's weight bar + version label and the panel both read from it,
 * skeleton while in flight and an explicit "details unavailable" on error.
 *
 * Global, superadmin-only: non-superadmins get the access-required message.
 * Restore PATCHes `status='active'` from the expanded panel (no hard delete);
 * archiving lives on the Profile Builder/Edit page, not the catalog.
 */

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "@/shared/lib/toast";
import Box from "@mui/material/Box";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import IconMaterialSymbolsLayers from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsLayers.mjs";
import IconMaterialSymbolsSearch from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsSearch.mjs";

import * as api from "@/back-office/eval-catalog/profile-catalog-fixtures";
import type { ProfileRead } from "@/back-office/eval-catalog/profile-catalog-fixtures";
import {
  renderProfileCard,
  renderProfileDetail,
} from "@/back-office/eval-catalog/components/profile-card";
import { CardGrid } from "@/shared/components/card-grid";
import { FacetedFilter } from "@/shared/components/faceted-filter";
import { pageBandSx } from "@/shared/components/page-band";
import { pageContentSx } from "@/shared/components/page-content";
import { Toolbar } from "@/shared/components/toolbar";
import { useSingleStatusFilter } from "@/shared/hooks/use-single-status-filter";

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
];

const PROFILE_CARD_HEIGHT = 200;

export function ProfilesPage() {
  return <ProfilesList />;
}

function ProfilesList() {
  // Status hits the server as a single `?status=` param.
  const { statusFilter, setStatusSingle, status } = useSingleStatusFilter();
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [, forceRerender] = useState(0);

  const navigate = useNavigate();

  const dimensions = useMemo(() => api.listDimensions(), []);
  const profiles = useMemo(() => api.listProfiles(status as "active" | "archived"), [status]);

  const restore = {
    mutate: (profileId: string) => {
      const profile = api.patchProfile(profileId, { status: "active" });
      toast.success(`"${profile.name}" restored`);
      forceRerender((n) => n + 1);
    },
  };

  // Three dimension maps: the weight bar resolves segments by `slug`, the
  // panel's eval groups resolve names by `dimensionId` and order/hue by `slug`
  // (so a dimension's color matches the weight bar).
  const dimensionNameBySlug = useMemo(() => {
    const map = new Map<string, string>();
    for (const d of dimensions) map.set(d.slug, d.name);
    return map;
  }, [dimensions]);

  const dimensionNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const d of dimensions) map.set(d.id, d.name);
    return map;
  }, [dimensions]);

  const dimensionSlugById = useMemo(() => {
    const map = new Map<string, string>();
    for (const d of dimensions) map.set(d.id, d.slug);
    return map;
  }, [dimensions]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return profiles.filter((p) => {
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q)
      );
    });
  }, [profiles, search]);

  // No backend: every profile's full detail (versions/entries) is already in
  // hand from the fixture, so there is no separate fetch/loading/error state
  // per card the way the real eager fan-out has.
  const profileDetailById = useMemo(() => {
    const byId = new Map<string, ProfileRead>();
    for (const p of filtered) byId.set(p.id, p);
    return byId;
  }, [filtered]);
  const loadingById = new Map<string, boolean>();
  const errorById = new Map<string, Error>();

  // Close the panel when its profile is filtered out of the visible set (§3.4).
  useEffect(() => {
    if (openId == null) return;
    if (!filtered.some((p) => p.id === openId)) setOpenId(null);
  }, [filtered, openId]);

  const goToEdit = (profile: ProfileRead) =>
    void navigate({
      to: "/evals/catalog/profiles/$profileId",
      params: { profileId: profile.id },
    });

  return (
    <Box
      sx={{
        display: "flex",
        height: "100%",
        minHeight: 0,
        flexDirection: "column",
      }}
    >
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
                  "aria-label": "Search profiles",
                  "data-testid": "search-profiles",
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
                {filtered.length} profile{filtered.length === 1 ? "" : "s"}
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
          getItemId={(p) => p.id}
          getItemTestId={(p) => `profile-card-${p.id}`}
          getItemLabel={(p) => p.name}
          minCardWidth={330}
          openId={openId}
          onToggle={setOpenId}
          cardHeight={PROFILE_CARD_HEIGHT}
          renderCard={(profile, isOpen) =>
            renderProfileCard(profile, isOpen, {
              detail: profileDetailById.get(profile.id),
              detailLoading: loadingById.get(profile.id) ?? false,
              dimensionNameBySlug,
              onEdit: () => goToEdit(profile),
            })
          }
          renderDetail={(profile) =>
            renderProfileDetail(profile, {
              detail: profileDetailById.get(profile.id),
              detailLoading: loadingById.get(profile.id) ?? false,
              detailError: errorById.get(profile.id) ?? null,
              dimensionNameById,
              dimensionNameBySlug,
              dimensionSlugById,
              onEdit: () => goToEdit(profile),
              onRestore: () => restore.mutate(profile.id),
            })
          }
          emptyState={{
            icon: IconMaterialSymbolsLayers,
            title: "No profiles found",
            description:
              search || status !== "active"
                ? "Try a different search term or filter."
                : "Create a profile to bundle evals.",
          }}
        />
      </Box>
    </Box>
  );
}
