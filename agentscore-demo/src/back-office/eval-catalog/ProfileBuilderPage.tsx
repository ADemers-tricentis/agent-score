/** ProfileBuilderPage — author a scoring profile, in one of two modes.
 *
 * Routes (superadmin only):
 *   - /evals/catalog/profiles/new            → CREATE a new profile + v1.
 *   - /evals/catalog/profiles/$profileId/version → publish a NEW VERSION
 *     of an existing profile. Identity (name/slug/description) is
 *     stable across versions (spec §3.1 F4), so in version mode it is rendered
 *     read-only and the reducer is prefilled from the latest version's
 *     `dimension_weights` + `entries`.
 *
 * Slice W7-S4 (spec §3.1 Feature 4, §3.2 story 3, §4.6). A profile is a
 * dimension-weighted, thresholded set of evals that pin an
 * exact `eval_version` id; profiles are versioned. The builder is the one
 * genuinely complex form in the catalog, so it uses a local `useReducer`
 * (spec §4.6) rather than a pile of `useState`s:
 *
 *   (a) General — name + slug + description.
 *   (b) Evals — pick active evals, pin a specific version per chosen eval, then
 *       set the entry's ONE dimension (Phase D §3.1 F6 partition), threshold
 *       (0–1) / weight / enabled → `ProfileEntryInput`. The dimension options
 *       are the intersection of the eval's m2m memberships
 *       (`eval.dimensionIds`) ∩ the weighted dimensions
 *       in (c); the sole option is auto-selected and submit is blocked while any
 *       entry has no satisfiable dimension (mirrors the BE's bidirectional
 *       partition, which 422s `invalid_profile_entry`).
 *   (c) Dimension weights — a key→number editor seeded from the dimensions the
 *       chosen evals belong to (free rows can be added/removed).
 *   (d) Verdict bands — the composite-score (0–100) floor per verdict, required
 *       on every profile version; seeded with
 *       `{ship:85,ship_note:70,review:55,block_rec:40}`.
 *
 * Create mode POSTs `createProfile({slug,name,description,
 * version:{dimensionWeights, verdictBands, entries}})`; version mode POSTs
 * `addProfileVersion(profileId, {dimensionWeights, verdictBands, entries})`.
 * Envelope errors (`slug_conflict`, `invalid_profile_entry`) surface via toast
 * (api.ts unwraps the `{detail:{code,message}}` 4xx envelope).
 */

import type { InputHTMLAttributes } from "react";
import { useEffect, useMemo, useReducer, useRef } from "react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { toast } from "@/shared/lib/toast";
import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Button from "@mui/material/Button";
import FormLabel from "@mui/material/FormLabel";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import BreadcrumbsItem from "@tricentis/aura/components/BreadcrumbsItem.js";
import IconMaterialSymbolsAdd from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsAdd.mjs";
import IconMaterialSymbolsDelete from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsDelete.mjs";
import IconMaterialSymbolsSave from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsSave.mjs";

import * as api from "@/back-office/eval-catalog/profile-catalog-fixtures";
import type {
  DimensionRead,
  EvalDefinitionRead,
  ProfileRead,
} from "@/back-office/eval-catalog/profile-catalog-fixtures";
import { FormSection } from "@/shared/components/form-section";
import { MultiSelect } from "@/shared/components/combobox";
import { NotFoundState } from "@/shared/components/not-found-state";
import { TermLabel } from "@/shared/components/term-label";

// ---------------------------------------------------------------------------
// Reducer state
// ---------------------------------------------------------------------------

/** One chosen eval, pinned to a specific version, with its scoring knobs. */
interface BuilderEntry {
  evalId: string;
  /** Pinned `eval_version` id (defaults to the eval's latest version). */
  evalVersionId: string;
  /**
   * The ONE dimension this eval rolls into (spec §3.1 F6). Required by the BE
   * (`profile_version_entry.dimension_id` NOT NULL); must be both an m2m
   * membership of the eval AND a weighted key in `dimension_weights`.
   */
  dimensionId: string;
  threshold: number;
  weight: number;
  enabled: boolean;
}

/**
 * Verdict bands authored on the profile version (spec §3 — now required on a
 * profile version). The composite (0–100) maps to a verdict by descending
 * threshold; the seeded default is the floor sent when untouched.
 */
const DEFAULT_VERDICT_BANDS: Record<string, number> = {
  ship: 85,
  ship_note: 70,
  review: 55,
  block_rec: 40,
};

/** Render order + labels for the four bands. */
const VERDICT_BAND_KEYS: { key: string; label: string }[] = [
  { key: "ship", label: "Ship" },
  { key: "ship_note", label: "Ship w/ note" },
  { key: "review", label: "Review" },
  { key: "block_rec", label: "Block (rec)" },
];

interface BuilderState {
  name: string;
  slug: string;
  /** True once the user edits the slug by hand — stops the name→slug autofill. */
  slugDirty: boolean;
  description: string;
  /** Eval ids the user has selected, in selection order. */
  evalIds: string[];
  /** Per-eval entry config, keyed by eval id. */
  entries: Record<string, BuilderEntry>;
  /** dimensionSlug → weight. */
  dimensionWeights: Record<string, number>;
  /** verdict-band name → composite floor (0–100). */
  verdictBands: Record<string, number>;
}

type BuilderAction =
  | { type: "setName"; value: string }
  | { type: "setSlug"; value: string }
  | { type: "setDescription"; value: string }
  | { type: "setEvalIds"; value: string[]; latestVersionByEval: Record<string, string> }
  | { type: "setEntryVersion"; evalId: string; evalVersionId: string }
  | { type: "setEntryDimension"; evalId: string; dimensionId: string }
  | { type: "setEntryThreshold"; evalId: string; value: number }
  | { type: "setEntryWeight"; evalId: string; value: number }
  | { type: "setEntryEnabled"; evalId: string; value: boolean }
  | { type: "setDimensionWeight"; slug: string; value: number }
  | { type: "addDimensionRow"; slug: string }
  | { type: "removeDimensionRow"; slug: string }
  | { type: "setVerdictBand"; key: string; value: number }
  // Version mode: seed entries + dimension weights from an existing version.
  // Identity fields are left untouched (they don't change across versions).
  | {
      type: "prefill";
      evalIds: string[];
      entries: Record<string, BuilderEntry>;
      dimensionWeights: Record<string, number>;
      verdictBands: Record<string, number>;
    };

const slugify = (s: string): string =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const initialState: BuilderState = {
  name: "",
  slug: "",
  slugDirty: false,
  description: "",
  evalIds: [],
  entries: {},
  dimensionWeights: {},
  verdictBands: { ...DEFAULT_VERDICT_BANDS },
};

function reducer(state: BuilderState, action: BuilderAction): BuilderState {
  switch (action.type) {
    case "setName":
      return {
        ...state,
        name: action.value,
        slug: state.slugDirty ? state.slug : slugify(action.value),
      };
    case "setSlug":
      return { ...state, slug: action.value, slugDirty: true };
    case "setDescription":
      return { ...state, description: action.value };
    case "setEvalIds": {
      const entries: Record<string, BuilderEntry> = {};
      for (const id of action.value) {
        entries[id] = state.entries[id] ?? {
          evalId: id,
          evalVersionId: action.latestVersionByEval[id] ?? "",
          dimensionId: "",
          threshold: 0.5,
          weight: 1,
          enabled: true,
        };
      }
      return { ...state, evalIds: action.value, entries };
    }
    case "setEntryVersion":
      return {
        ...state,
        entries: {
          ...state.entries,
          [action.evalId]: {
            ...state.entries[action.evalId],
            evalVersionId: action.evalVersionId,
          },
        },
      };
    case "setEntryDimension":
      return {
        ...state,
        entries: {
          ...state.entries,
          [action.evalId]: {
            ...state.entries[action.evalId],
            dimensionId: action.dimensionId,
          },
        },
      };
    case "setEntryThreshold":
      return {
        ...state,
        entries: {
          ...state.entries,
          [action.evalId]: {
            ...state.entries[action.evalId],
            threshold: action.value,
          },
        },
      };
    case "setEntryWeight":
      return {
        ...state,
        entries: {
          ...state.entries,
          [action.evalId]: {
            ...state.entries[action.evalId],
            weight: action.value,
          },
        },
      };
    case "setEntryEnabled":
      return {
        ...state,
        entries: {
          ...state.entries,
          [action.evalId]: {
            ...state.entries[action.evalId],
            enabled: action.value,
          },
        },
      };
    case "setDimensionWeight":
      return {
        ...state,
        dimensionWeights: {
          ...state.dimensionWeights,
          [action.slug]: action.value,
        },
      };
    case "addDimensionRow":
      if (!action.slug || action.slug in state.dimensionWeights) return state;
      return {
        ...state,
        dimensionWeights: { ...state.dimensionWeights, [action.slug]: 1 },
      };
    case "removeDimensionRow": {
      const next = { ...state.dimensionWeights };
      delete next[action.slug];
      return { ...state, dimensionWeights: next };
    }
    case "setVerdictBand":
      return {
        ...state,
        verdictBands: { ...state.verdictBands, [action.key]: action.value },
      };
    case "prefill":
      return {
        ...state,
        evalIds: action.evalIds,
        entries: action.entries,
        dimensionWeights: action.dimensionWeights,
        verdictBands: action.verdictBands,
      };
    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProfileBuilderPage() {
  // Version mode: route is /profiles/$profileId/version. Create mode:
  // /profiles/new (no profileId). `strict: false` matches EvalDetailPage's
  // handling of the pathless layout parent.
  const { profileId } = useParams({ strict: false }) as {
    profileId?: string;
  };
  const isVersionMode = Boolean(profileId);

  const [state, dispatch] = useReducer(reducer, initialState);
  const navigate = useNavigate();

  // No backend: evals/dimensions/profile are all synchronous fixture reads —
  // there's no separate loading state per query the way the real fan-out has.
  const evals = useMemo(() => api.listEvals("active"), []);
  const dimensions = useMemo(() => api.listDimensions(), []);
  const profile: ProfileRead | undefined = isVersionMode ? api.getProfile(profileId ?? "") : undefined;

  // Every chosen eval's version list, keyed by eval id (fixtures already
  // carry their versions inline, so this is a lookup, not a fetch).
  const versionsByEval = useMemo(() => {
    const map = new Map<string, EvalDefinitionRead["versions"]>();
    for (const id of state.evalIds) {
      const def = api.getEval(id);
      if (def) map.set(id, [...def.versions].sort((a, b) => b.version - a.version));
    }
    return map;
  }, [state.evalIds]);

  const evalNameById = useMemo(() => {
    const map = new Map<string, EvalDefinitionRead>();
    for (const e of evals) map.set(e.id, e);
    return map;
  }, [evals]);

  const dimensionBySlug = useMemo(() => {
    const map = new Map<string, DimensionRead>();
    for (const d of dimensions) map.set(d.slug, d);
    return map;
  }, [dimensions]);

  const dimensionById = useMemo(() => {
    const map = new Map<string, DimensionRead>();
    for (const d of dimensions) map.set(d.id, d);
    return map;
  }, [dimensions]);

  // Dimension ids whose slug is currently a weighted key — one half of the
  // bidirectional partition rule (spec §3.1 F6): an entry's dimension must be
  // BOTH an m2m membership of the eval AND a key in `dimension_weights`.
  const weightedDimensionIds = useMemo(() => {
    const ids = new Set<string>();
    for (const d of dimensions) {
      if (d.slug in state.dimensionWeights) ids.add(d.id);
    }
    return ids;
  }, [dimensions, state.dimensionWeights]);

  // Per-eval allowed dimension ids = (eval's m2m memberships) ∩ (weighted
  // dimensions). Empty → the entry cannot satisfy the BE partition, so the
  // selector is disabled and submit is blocked.
  const allowedDimensionIdsByEval = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const id of state.evalIds) {
      const def = evalNameById.get(id);
      const allowed = (def?.dimensionIds ?? []).filter((dimId) =>
        weightedDimensionIds.has(dimId),
      );
      map.set(id, allowed);
    }
    return map;
  }, [state.evalIds, evalNameById, weightedDimensionIds]);

  const latestVersionByEval = useMemo(() => {
    const map: Record<string, string> = {};
    for (const [evalId, versions] of versionsByEval) {
      if (versions && versions.length > 0) map[evalId] = versions[0].id;
    }
    return map;
  }, [versionsByEval]);

  // When a chosen eval's versions finish loading, pin its latest version if the
  // entry has none yet (the version dropdown was empty at selection time).
  useEffect(() => {
    for (const id of state.evalIds) {
      const entry = state.entries[id];
      if (entry && !entry.evalVersionId && latestVersionByEval[id]) {
        dispatch({
          type: "setEntryVersion",
          evalId: id,
          evalVersionId: latestVersionByEval[id],
        });
      }
    }
  }, [latestVersionByEval, state.evalIds, state.entries]);

  // Keep each entry's dimension within its allowed intersection (spec §3.1 F6).
  // Auto-select the sole option; clear a selection that fell out of the set
  // (e.g. its weight row was removed) so an obviously-invalid dimension can
  // never be submitted.
  useEffect(() => {
    for (const id of state.evalIds) {
      const entry = state.entries[id];
      if (!entry) continue;
      const allowed = allowedDimensionIdsByEval.get(id) ?? [];
      if (entry.dimensionId && !allowed.includes(entry.dimensionId)) {
        dispatch({ type: "setEntryDimension", evalId: id, dimensionId: "" });
      } else if (!entry.dimensionId && allowed.length === 1) {
        dispatch({
          type: "setEntryDimension",
          evalId: id,
          dimensionId: allowed[0],
        });
      }
    }
  }, [allowedDimensionIdsByEval, state.evalIds, state.entries]);

  // -- Version-mode prefill -------------------------------------------------
  // Fixtures already carry every eval-version → owning-eval mapping inline,
  // so this is a lookup built once, not a fetch.
  const evalIdByVersionId = useMemo(() => {
    const map = new Map<string, string>();
    for (const def of evals) {
      for (const v of def.versions ?? []) map.set(v.id, def.id);
    }
    return map;
  }, [evals]);

  // Prefill once, after the profile is resolved. `prefilledRef` guards
  // against re-seeding (which would clobber user edits) on subsequent renders.
  const prefilledRef = useRef(false);
  useEffect(() => {
    if (!isVersionMode || prefilledRef.current) return;
    if (!profile) return;

    const versions = [...(profile.versions ?? [])].sort(
      (a, b) => b.version - a.version,
    );
    const latest = versions[0];
    if (!latest) return;

    const evalIds: string[] = [];
    const entries: Record<string, BuilderEntry> = {};
    for (const e of latest.entries ?? []) {
      const evalId = evalIdByVersionId.get(e.evalVersionId);
      if (!evalId || entries[evalId]) continue;
      evalIds.push(evalId);
      entries[evalId] = {
        evalId,
        evalVersionId: e.evalVersionId,
        dimensionId: e.dimensionId,
        threshold: e.threshold,
        weight: e.weight,
        enabled: e.enabled,
      };
    }

    dispatch({
      type: "prefill",
      evalIds,
      entries,
      dimensionWeights: { ...latest.dimensionWeights },
      verdictBands:
        latest.verdictBands && Object.keys(latest.verdictBands).length > 0
          ? { ...latest.verdictBands }
          : { ...DEFAULT_VERDICT_BANDS },
    });
    prefilledRef.current = true;
  }, [isVersionMode, profile, evalIdByVersionId]);

  // Dimensions the chosen evals belong to — the suggested weight rows.
  const suggestedDimensionSlugs = useMemo(() => {
    const slugs = new Set<string>();
    for (const id of state.evalIds) {
      const def = evalNameById.get(id);
      for (const dimId of def?.dimensionIds ?? []) {
        const slug = dimensionById.get(dimId)?.slug;
        if (slug) slugs.add(slug);
      }
    }
    return Array.from(slugs);
  }, [state.evalIds, evalNameById, dimensionById]);

  const buildEntries = () =>
    state.evalIds.map((id) => {
      const e = state.entries[id];
      return {
        evalVersionId: e.evalVersionId,
        dimensionId: e.dimensionId,
        threshold: e.threshold,
        weight: e.weight,
        enabled: e.enabled,
      };
    });

  const create = {
    isPending: false,
    mutate: () => {
      const created = api.createProfile({
        slug: state.slug.trim(),
        name: state.name.trim(),
        description: state.description.trim() || null,
        version: {
          dimensionWeights: state.dimensionWeights,
          verdictBands: state.verdictBands,
          entries: buildEntries(),
        },
      });
      toast.success(`Profile "${created.name}" published`);
      void navigate({ to: "/evals/catalog/profiles" });
    },
  };

  // Version mode: identity is immutable, so we only publish the new
  // version's entries + weights and route back to the profile detail page.
  const addVersion = {
    isPending: false,
    mutate: () => {
      const version = api.addProfileVersion(profileId ?? "", {
        dimensionWeights: state.dimensionWeights,
        verdictBands: state.verdictBands,
        entries: buildEntries(),
      });
      toast.success(`Version v${version.version} published`);
      void navigate({
        to: "/evals/catalog/profiles/$profileId",
        params: { profileId: profileId ?? "" },
      });
    },
  };

  const submit = isVersionMode ? addVersion : create;

  // Version mode against a bogus/deleted profile id: not-found, never a
  // populated "New version" form for a profile the caller can't reach.
  if (isVersionMode && !profile) {
    return (
      <NotFoundState
        entity="Profile"
        action={
          <Button component={Link} to="/evals/catalog/profiles" variant="outlined">
            Back to profiles
          </Button>
        }
      />
    );
  }

  const evalOptions = evals.map((e) => ({
    value: e.id,
    label: e.name,
    description: e.slug,
    searchText: `${e.name} ${e.slug}`,
  }));

  const allEntriesPinned = state.evalIds.every(
    (id) => state.entries[id]?.evalVersionId,
  );

  // Each entry must map to exactly one dimension that is BOTH an m2m membership
  // of its eval AND a weighted key (spec §3.1 F6) — mirror the BE's bidirectional
  // partition rule enough to block an obviously-invalid submit (BE stays the
  // source of truth via 422 `invalid_profile_entry`).
  const allEntriesDimensioned = state.evalIds.every((id) => {
    const dimId = state.entries[id]?.dimensionId;
    if (!dimId) return false;
    return (allowedDimensionIdsByEval.get(id) ?? []).includes(dimId);
  });

  // In version mode the identity fields are read-only context (they don't
  // change across versions), so they're excluded from submit validation.
  const disabled =
    (!isVersionMode &&
      (state.name.trim().length === 0 || state.slug.trim().length === 0)) ||
    state.evalIds.length === 0 ||
    !allEntriesPinned ||
    !allEntriesDimensioned ||
    submit.isPending;

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: 0,
        flex: 1,
        flexDirection: "column",
        overflowY: "auto",
        px: 4,
        py: 3,
      }}
    >
      <Stack sx={{ width: "100%", maxWidth: 1024, gap: 3 }}>
        <Box>
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
              {isVersionMode
                ? `New version${profile ? ` — ${profile.name}` : ""}`
                : "New profile"}
            </Typography>
          </Breadcrumbs>
          <Typography
            component="h1"
            variant="h3"
            sx={{
              mt: 1.5,
              fontWeight: 600,
              letterSpacing: "-0.025em",
            }}
          >
            {isVersionMode
              ? `New version${profile ? ` — ${profile.name}` : ""}`
              : "New profile"}
          </Typography>
          <Typography variant="subtitle1" sx={{ mt: 1, color: "text.primary" }}>
            A profile defines how this agent gets scored: which checks run,
            how much each counts, and what result means ship, review, or
            block.
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5, color: "text.secondary" }}>
            {isVersionMode
              ? "Identity is fixed across versions. Adjust the pinned evals, thresholds, weights and dimension weights, then publish a new immutable version."
              : "Bundle evals, pin exact versions, and set thresholds and weights. Publishing creates the profile and its first version."}
          </Typography>
        </Box>

        {isVersionMode ? (
          <FormSection
            title="General"
            description="Stable identity of this profile — read-only. A new version changes only the evals and dimension weights."
          >
            <Box
              sx={{
                display: "grid",
                gap: 2,
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              }}
            >
              <Stack sx={{ gap: 0.75 }}>
                <Typography variant="subtitle2" sx={{ color: "text.secondary" }}>
                  Name
                </Typography>
                <Typography variant="body1">{profile?.name ?? "—"}</Typography>
              </Stack>
              <Stack sx={{ gap: 0.75 }}>
                <Typography variant="subtitle2" sx={{ color: "text.secondary" }}>
                  Slug
                </Typography>
                <Typography variant="body1" sx={{ fontFamily: "monospace" }}>
                  {profile?.slug ?? "—"}
                </Typography>
              </Stack>
              <Stack sx={{ gap: 0.75, gridColumn: { sm: "span 2" } }}>
                <Typography variant="subtitle2" sx={{ color: "text.secondary" }}>
                  Description
                </Typography>
                <Typography variant="body1">
                  {profile?.description ?? (
                    <Box component="span" sx={{ color: "text.secondary" }}>
                      No description.
                    </Box>
                  )}
                </Typography>
              </Stack>
            </Box>
          </FormSection>
        ) : (
          <FormSection
            title="General"
            description="Name + slug identify the profile."
          >
            <Stack sx={{ gap: 0.75 }}>
              <FormLabel htmlFor="profile-name">
                Name <Box component="span" sx={{ color: "error.main" }}>*</Box>
              </FormLabel>
              <TextField
                id="profile-name"
                autoComplete="off"
                placeholder="e.g. Support-agent baseline"
                value={state.name}
                onChange={(e) =>
                  dispatch({ type: "setName", value: e.target.value })
                }
                fullWidth
                slotProps={{ htmlInput: { "data-testid": "profile-name-input" } }}
              />
            </Stack>
            <Stack sx={{ gap: 0.75 }}>
              <FormLabel htmlFor="profile-slug">
                Slug <Box component="span" sx={{ color: "error.main" }}>*</Box>
              </FormLabel>
              <TextField
                id="profile-slug"
                autoComplete="off"
                placeholder="support-agent-baseline"
                value={state.slug}
                onChange={(e) =>
                  dispatch({ type: "setSlug", value: e.target.value })
                }
                fullWidth
                slotProps={{
                  htmlInput: {
                    "data-testid": "profile-slug-input",
                    sx: { fontFamily: "monospace" },
                  },
                }}
              />
            </Stack>
            <Stack sx={{ gap: 0.75 }}>
              <FormLabel htmlFor="profile-description">Description</FormLabel>
              <TextField
                id="profile-description"
                multiline
                minRows={2}
                placeholder="Optional — what this profile scores."
                value={state.description}
                onChange={(e) =>
                  dispatch({ type: "setDescription", value: e.target.value })
                }
                fullWidth
                slotProps={{
                  htmlInput: { "data-testid": "profile-description-input" },
                }}
              />
            </Stack>
          </FormSection>
        )}

        <FormSection
          title="Evals"
          description="Choose active evals, pin a version for each, then tune threshold, weight and enablement."
        >
          <Stack sx={{ gap: 0.75 }}>
            <FormLabel>
              Evals <Box component="span" sx={{ color: "error.main" }}>*</Box>
            </FormLabel>
            <MultiSelect
              options={evalOptions}
              values={state.evalIds}
              onChange={(ids) =>
                dispatch({ type: "setEvalIds", value: ids, latestVersionByEval })
              }
              placeholder="Select evals…"
              searchPlaceholder="Filter evals…"
              emptyLabel="No active evals."
            />
          </Stack>

          {state.evalIds.length > 0 ? (
            <Box sx={{ borderRadius: 1, border: 1, borderColor: "divider" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Eval</TableCell>
                    <TableCell sx={{ width: 128 }}>Version</TableCell>
                    <TableCell sx={{ width: 176 }}>
                      <TermLabel
                        label={
                          <>
                            Dimension{" "}
                            <Box component="span" sx={{ color: "error.main" }}>
                              *
                            </Box>
                          </>
                        }
                        tooltip="Only dimensions that also have a weight set below are selectable here. If the one you want is missing, add it as a weight first."
                      />
                    </TableCell>
                    <TableCell sx={{ width: 96 }}>
                      <TermLabel
                        label="Threshold"
                        tooltip="The minimum per-check score (0–1) an interaction needs to pass this eval."
                      />
                    </TableCell>
                    <TableCell sx={{ width: 80 }}>
                      <TermLabel
                        label="Weight"
                        tooltip="How much this eval counts toward the profile's overall score, relative to the other evals."
                      />
                    </TableCell>
                    <TableCell sx={{ width: 64 }}>Enabled</TableCell>
                    <TableCell sx={{ width: 40 }} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {state.evalIds.map((id) => {
                    const entry = state.entries[id];
                    const def = evalNameById.get(id);
                    const versions = versionsByEval.get(id) ?? [];
                    const allowedDims = allowedDimensionIdsByEval.get(id) ?? [];
                    const noDimChoices = allowedDims.length === 0;
                    return (
                      <TableRow key={id}>
                        <TableCell>
                          <Box sx={{ display: "flex", flexDirection: "column" }}>
                            <Box component="span" sx={{ fontWeight: 500 }}>
                              {def?.name ?? id}
                            </Box>
                            {def?.slug ? (
                              <Box
                                component="span"
                                sx={{
                                  fontFamily: "monospace",
                                  typography: "caption",
                                  color: "text.secondary",
                                }}
                              >
                                {def.slug}
                              </Box>
                            ) : null}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <TextField
                            select
                            size="small"
                            value={entry?.evalVersionId ?? ""}
                            onChange={(e) =>
                              dispatch({
                                type: "setEntryVersion",
                                evalId: id,
                                evalVersionId: e.target.value,
                              })
                            }
                            disabled={versions.length === 0}
                            fullWidth
                            slotProps={{
                              htmlInput: {
                                "aria-label": `Version for ${def?.name ?? id}`,
                              },
                              select: {
                                displayEmpty: true,
                                renderValue: (value) => {
                                  const v = value as string;
                                  const found = versions.find((x) => x.id === v);
                                  return found ? (
                                    `v${found.version}`
                                  ) : (
                                    <Box component="span" sx={{ color: "text.secondary" }}>
                                      Loading…
                                    </Box>
                                  );
                                },
                              },
                            }}
                          >
                            {versions.map((v) => (
                              <MenuItem key={v.id} value={v.id}>
                                v{v.version}
                              </MenuItem>
                            ))}
                          </TextField>
                        </TableCell>
                        <TableCell>
                          <TextField
                            select
                            size="small"
                            value={entry?.dimensionId ?? ""}
                            onChange={(e) =>
                              dispatch({
                                type: "setEntryDimension",
                                evalId: id,
                                dimensionId: e.target.value,
                              })
                            }
                            disabled={noDimChoices}
                            fullWidth
                            slotProps={{
                              htmlInput: {
                                "aria-label": `Dimension for ${def?.name ?? id}`,
                              },
                              select: {
                                displayEmpty: true,
                                renderValue: (value) => {
                                  const v = value as string;
                                  if (!v)
                                    return (
                                      <Box component="span" sx={{ color: "text.secondary" }}>
                                        {noDimChoices
                                          ? "No matching dimension"
                                          : "Select…"}
                                      </Box>
                                    );
                                  return dimensionById.get(v)?.name ?? v;
                                },
                              },
                            }}
                          >
                            {allowedDims.map((dimId) => {
                              const dim = dimensionById.get(dimId);
                              return (
                                <MenuItem key={dimId} value={dimId}>
                                  {dim?.name ?? dimId}
                                </MenuItem>
                              );
                            })}
                          </TextField>
                          {noDimChoices ? (
                            <Typography
                              variant="caption"
                              sx={{
                                mt: 0.5,
                                lineHeight: 1.2,
                                color: "error.main",
                              }}
                            >
                              Add one of this eval&apos;s dimensions to the
                              weights below.
                            </Typography>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            size="small"
                            value={entry?.threshold ?? 0.5}
                            onChange={(e) =>
                              dispatch({
                                type: "setEntryThreshold",
                                evalId: id,
                                value: Number(e.target.value),
                              })
                            }
                            slotProps={{
                              htmlInput: {
                                min: 0,
                                max: 1,
                                step: 0.05,
                                "aria-label": `Threshold for ${def?.name ?? id}`,
                              },
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            size="small"
                            value={entry?.weight ?? 1}
                            onChange={(e) =>
                              dispatch({
                                type: "setEntryWeight",
                                evalId: id,
                                value: Number(e.target.value),
                              })
                            }
                            slotProps={{
                              htmlInput: {
                                min: 0,
                                step: 0.5,
                                "aria-label": `Weight for ${def?.name ?? id}`,
                              },
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={entry?.enabled ?? true}
                            onChange={(e) =>
                              dispatch({
                                type: "setEntryEnabled",
                                evalId: id,
                                value: e.target.checked,
                              })
                            }
                            slotProps={{
                              input: {
                                "aria-label": `Enable ${def?.name ?? id}`,
                              } as InputHTMLAttributes<HTMLInputElement>,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            aria-label={`Remove ${def?.name ?? id}`}
                            onClick={() =>
                              dispatch({
                                type: "setEvalIds",
                                value: state.evalIds.filter((x) => x !== id),
                                latestVersionByEval,
                              })
                            }
                          >
                            <IconMaterialSymbolsDelete sx={{ fontSize: 16 }} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>
          ) : (
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              No evals selected yet.
            </Typography>
          )}
        </FormSection>

        <FormSection
          title="Dimension weights"
          description="Relative weight per dimension. Rows are seeded from the chosen evals' dimensions; add or remove as needed."
        >
          <DimensionWeights
            weights={state.dimensionWeights}
            suggestedSlugs={suggestedDimensionSlugs}
            dimensionBySlug={dimensionBySlug}
            allDimensions={dimensions}
            dispatch={dispatch}
          />
        </FormSection>

        <FormSection
          title={
            <TermLabel
              label="Verdict bands"
              tooltip="The score ranges that decide a run's outcome label — Ship, Ship w/ note, Review, or Block."
            />
          }
          description="Composite-score (0–100) floor for each verdict, highest first. The run's verdict is the first band the composite clears."
        >
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, 1fr)" },
            }}
          >
            {VERDICT_BAND_KEYS.map(({ key, label }) => (
              <Stack key={key} sx={{ gap: 0.75 }}>
                <FormLabel htmlFor={`verdict-band-${key}`}>
                  {key === "block_rec" ? (
                    <TermLabel
                      label={label}
                      tooltip="The recommended floor for blocking or escalating a run. Scores below this are labeled “Block”."
                    />
                  ) : (
                    label
                  )}
                </FormLabel>
                <TextField
                  id={`verdict-band-${key}`}
                  type="number"
                  size="small"
                  value={state.verdictBands[key] ?? DEFAULT_VERDICT_BANDS[key]}
                  onChange={(e) =>
                    dispatch({
                      type: "setVerdictBand",
                      key,
                      value: Number(e.target.value),
                    })
                  }
                  slotProps={{
                    htmlInput: {
                      min: 0,
                      max: 100,
                      step: 1,
                      "aria-label": `${label} band floor`,
                      sx: { fontFamily: "monospace" },
                    },
                  }}
                />
              </Stack>
            ))}
          </Box>
        </FormSection>

        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 1 }}>
          <Button
            variant="outlined"
            data-testid="cancel-profile"
            onClick={() =>
              void navigate(
                isVersionMode && profileId
                  ? {
                      to: "/evals/catalog/profiles/$profileId",
                      params: { profileId },
                    }
                  : { to: "/evals/catalog/profiles" },
              )
            }
            disabled={submit.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={disabled}
            onClick={() => submit.mutate()}
            data-testid="publish-profile-submit"
            startIcon={<IconMaterialSymbolsSave sx={{ fontSize: 16 }} />}
          >
            Publish version
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Dimension-weights editor
// ---------------------------------------------------------------------------

interface DimensionWeightsProps {
  weights: Record<string, number>;
  /** Dimension slugs implied by the chosen evals — offered as quick-add. */
  suggestedSlugs: string[];
  dimensionBySlug: Map<string, DimensionRead>;
  allDimensions: DimensionRead[];
  dispatch: React.Dispatch<BuilderAction>;
}

function DimensionWeights({
  weights,
  suggestedSlugs,
  dimensionBySlug,
  allDimensions,
  dispatch,
}: DimensionWeightsProps) {
  const rows = Object.keys(weights);

  const addableSuggestions = suggestedSlugs.filter((s) => !(s in weights));
  const addableOther = allDimensions
    .map((d) => d.slug)
    .filter((s) => !(s in weights) && !suggestedSlugs.includes(s));

  return (
    <Stack sx={{ gap: 1.5 }}>
      {rows.length > 0 ? (
        <Stack sx={{ gap: 1 }}>
          {rows.map((slug) => (
            <Box key={slug} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box sx={{ flex: 1 }}>
                <Box component="span" sx={{ typography: "body1" }}>
                  {dimensionBySlug.get(slug)?.name ?? slug}
                </Box>
                <Box
                  component="span"
                  sx={{
                    ml: 1,
                    fontFamily: "monospace",
                    typography: "caption",
                    color: "text.secondary",
                  }}
                >
                  {slug}
                </Box>
              </Box>
              <TextField
                type="number"
                size="small"
                value={weights[slug]}
                onChange={(e) =>
                  dispatch({
                    type: "setDimensionWeight",
                    slug,
                    value: Number(e.target.value),
                  })
                }
                sx={{ width: 112 }}
                slotProps={{
                  htmlInput: {
                    min: 0,
                    step: 0.5,
                    "aria-label": `Weight for ${slug}`,
                  },
                }}
              />
              <IconButton
                size="small"
                aria-label={`Remove ${slug}`}
                onClick={() => dispatch({ type: "removeDimensionRow", slug })}
              >
                <IconMaterialSymbolsDelete sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>
          ))}
        </Stack>
      ) : (
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          No dimension weights. Add one below — optional.
        </Typography>
      )}

      {addableSuggestions.length > 0 || addableOther.length > 0 ? (
        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1, pt: 0.5 }}>
          {addableSuggestions.map((slug) => (
            <Button
              key={slug}
              variant="outlined"
              size="small"
              onClick={() => dispatch({ type: "addDimensionRow", slug })}
              startIcon={<IconMaterialSymbolsAdd sx={{ fontSize: 16 }} />}
            >
              {dimensionBySlug.get(slug)?.name ?? slug}
            </Button>
          ))}
          {addableOther.length > 0 ? (
            <TextField
              select
              size="small"
              value=""
              onChange={(e) =>
                dispatch({ type: "addDimensionRow", slug: e.target.value })
              }
              sx={{ width: 176 }}
              slotProps={{
                htmlInput: { "aria-label": "Add dimension weight" },
                select: {
                  displayEmpty: true,
                  renderValue: () => (
                    <Box component="span" sx={{ color: "text.secondary" }}>
                      Add dimension…
                    </Box>
                  ),
                },
              }}
            >
              {addableOther.map((slug) => (
                <MenuItem key={slug} value={slug}>
                  {dimensionBySlug.get(slug)?.name ?? slug}
                </MenuItem>
              ))}
            </TextField>
          ) : null}
        </Box>
      ) : null}
    </Stack>
  );
}
