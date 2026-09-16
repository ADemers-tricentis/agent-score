/** Eval card + detail renderers for the catalog `CardGrid`.
 *
 *  Two render functions wired by `EvalCatalogPage` into `CardGrid`'s
 *  `renderCard(item, isOpen)` / `renderDetail(item)` props (the page wraps them
 *  in closures that supply the `opts` — dimension name/accent maps, derived
 *  sibling data, and the Restore callback). The collapsed card renders from
 *  the **list** response (`EvalDefinitionRead` with `versions=[]`); the panel
 *  reads version-level data from the lazily-fetched GET-by-id detail.
 *
 * The detail panel is **comprehension-first**: identity → quiet
 *  provenance → a per-kind **"how it scores"** visual → what it needs → where it
 *  applies, with Restore as the only top-right header action (when archived;
 *  eval create/edit is API-only). The per-kind tints come from
 *  the documented `eval-detail-palette.ts` constant module; sizes are Aura
 * variants only (no raw px) and radii are the uniform 4px base.
 */

import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type SvgIcon from "@mui/material/SvgIcon";
import { alpha, type CSSObject, type Theme } from "@mui/material/styles";

import IconMaterialSymbolsRestartAlt from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsRestartAlt.mjs";
import IconMaterialSymbolsLibraryBooks from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsLibraryBooks.mjs";
import IconMaterialSymbolsPsychology from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsPsychology.mjs";
import IconMaterialSymbolsHub from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsHub.mjs";
import IconMaterialSymbolsCheckCircle from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsCheckCircle.mjs";
import IconMaterialSymbolsManageSearch from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsManageSearch.mjs";
import IconMaterialSymbolsDataObject from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsDataObject.mjs";
import IconMaterialSymbolsChatBubble from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsChatBubble.mjs";
import IconMaterialSymbolsDescription from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsDescription.mjs";
import IconMaterialSymbolsImage from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsImage.mjs";
import IconMaterialSymbolsBuild from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsBuild.mjs";
import IconMaterialSymbolsCheckBox from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsCheckBox.mjs";
import IconMaterialSymbolsHistory from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsHistory.mjs";
import IconMaterialSymbolsUpdate from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsUpdate.mjs";
import IconMaterialSymbolsDashboard from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsDashboard.mjs";
import IconMaterialSymbolsSchema from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsSchema.mjs";
import IconMaterialSymbolsInput from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsInput.mjs";
import IconMaterialSymbolsCategory from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsCategory.mjs";
import IconMaterialSymbolsLink from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsLink.mjs";
import IconMaterialSymbolsSubject from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsSubject.mjs";
import IconMaterialSymbolsGavel from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsGavel.mjs";
import IconMaterialSymbolsFunctions from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsFunctions.mjs";
import IconMaterialSymbolsChevronRight from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsChevronRight.mjs";

import type {
  EvalDefinitionRead,
  EvalVersionRead,
  ProfileRead,
} from "@/back-office/eval-catalog/api";
import type { components } from "@/shared/api/generated";
import { Chip, ChipStrip } from "@/shared/components/chip";
import { ErrorState } from "@/shared/components/error-state";
import { dimensionAccent } from "@/shared/components/dimension-palette";
import {
  kindRamp,
  HYBRID_FORMULA_TEXT,
  VERDICT,
} from "@/shared/components/eval-detail-palette";

type LibraryEngineRef = components["schemas"]["LibraryEngineRef"];
type GEvalEngineRef = components["schemas"]["GEvalEngineRef"];
type HybridEngineRef = components["schemas"]["HybridEngineRef"];
type AnyEngineRef = EvalVersionRead["engineRef"];
type InputRequirements = components["schemas"]["InputRequirements"];
type HybridReduceConfig = components["schemas"]["HybridReduceConfig"];

/** Kind → display label (matches the Studio/catalog vocabulary). */
export const KIND_LABELS: Record<string, string> = {
  library: "Library",
  g_eval: "G-Eval",
  hybrid: "Hybrid",
};

/** Kind → badge icon. `library` books, `g_eval` reasoning, `hybrid` a hub.
 *  Unknown kinds fall back to the library glyph. */
export const KIND_ICONS: Record<string, typeof SvgIcon> = {
  library: IconMaterialSymbolsLibraryBooks,
  g_eval: IconMaterialSymbolsPsychology,
  hybrid: IconMaterialSymbolsHub,
};

/** Kind → accent color picker, keyed off the `kind` axis (not category labels).
 *  This maps each kind to a distinct hue: `library` → the brand primary; the
 *  other two to documented dimension-palette accents (a constant module, so
 *  no raw hex enters `sx`). */
export function kindAccent(kind: string, theme: Theme): string {
  switch (kind) {
    case "library":
      return theme.palette.primary.main;
    case "g_eval":
      return dimensionAccent(8); // violet
    case "hybrid":
      return dimensionAccent(7); // fuchsia
    default:
      return theme.palette.text.secondary;
  }
}

/** Calm tinted-fill + solid-text `sx` for the collapsed-card kind badge. */
function kindTintSx(kind: string): (theme: Theme) => CSSObject {
  return (theme) => {
    const color = kindAccent(kind, theme);
    return { bgcolor: alpha(color, 0.12), color };
  };
}

/** Input-requirement flag → icon + label for the panel requirement strip.
 *  Order matches the Studio's `INPUT_REQ_LABELS` so the catalog reads the same. */
const REQUIREMENT_META: {
  key: keyof InputRequirements;
  label: string;
  icon: typeof SvgIcon;
}[] = [
  { key: "needsRetrievalContext", label: "Retrieval context", icon: IconMaterialSymbolsManageSearch },
  { key: "needsTurnRetrievalContext", label: "Turn retrieval context", icon: IconMaterialSymbolsManageSearch },
  { key: "needsContext", label: "Context", icon: IconMaterialSymbolsDataObject },
  { key: "needsExpectedOutput", label: "Expected output", icon: IconMaterialSymbolsCheckBox },
  { key: "needsExpectedOutcome", label: "Expected outcome", icon: IconMaterialSymbolsCheckCircle },
  { key: "needsConversation", label: "Conversation", icon: IconMaterialSymbolsChatBubble },
  { key: "needsTools", label: "Tools", icon: IconMaterialSymbolsBuild },
  { key: "needsMcp", label: "MCP", icon: IconMaterialSymbolsDescription },
  { key: "needsImage", label: "Image", icon: IconMaterialSymbolsImage },
];

const TWO_LINE_CLAMP = {
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
} as const;

/** Monospace inline-code `sx` (Aura `caption` + the OS mono stack — docs/10). */
const MONO_CODE = {
  fontFamily: "monospace",
  typography: "caption",
  bgcolor: "action.hover",
  border: 1,
  borderColor: "divider",
  borderRadius: 1,
  px: 0.75,
  py: 0.25,
} as const;

/**
 * Pure 2-row dimension-chip clamp. jsdom cannot measure layout, so the live
 * per-row fill is a browser-smoke concern; this fixed-`cap` fallback keeps the
 * `+N` overflow deterministic and unit-testable. `cap` is the max number of
 * chips shown before the rest collapse into a single `+N` badge. A non-positive
 * cap shows nothing and counts everything as overflow.
 */
export function clampDimensions(
  ids: string[],
  cap: number,
): { visible: string[]; overflow: number } {
  if (cap <= 0) return { visible: [], overflow: ids.length };
  if (ids.length <= cap) return { visible: ids, overflow: 0 };
  return { visible: ids.slice(0, cap), overflow: ids.length - cap };
}

/** The latest version of an eval = the max `version` number. `versions ?? []`
 *  guards the list-response shape (`versions` omitted/empty). */
function latestVersion(versions: EvalVersionRead[] | undefined): EvalVersionRead | null {
  const list = versions ?? [];
  if (list.length === 0) return null;
  return list.reduce((best: EvalVersionRead, v: EvalVersionRead) => (v.version > best.version ? v : best), list[0]);
}

function latestProfileVersion(
  profile: ProfileRead,
): NonNullable<ProfileRead["versions"]>[number] | null {
  const list = profile.versions ?? [];
  if (list.length === 0) return null;
  type Version = NonNullable<ProfileRead["versions"]>[number];
  return list.reduce((best: Version, v: Version) => (v.version > best.version ? v : best), list[0]);
}

/**
 * "Used in N profiles" — count profile details whose latest version's
 * `entries[]` pins this eval `slug` (`ProfileVersionEntryRead.evalSlug`). Entries
 * live on `versions[]`, so callers must pass eagerly-fetched profile **details**,
 * not the profiles list (whose `versions` is empty). Guards `versions ?? []`.
 */
export function usedInProfilesCount(
  slug: string,
  profileDetails: ProfileRead[],
): number {
  let count = 0;
  for (const profile of profileDetails) {
    const latest = latestProfileVersion(profile);
    const entries = latest?.entries ?? [];
    if (entries.some((entry: { evalSlug: string }) => entry.evalSlug === slug)) count += 1;
  }
  return count;
}

interface CardOpts {
  dimensionNameById: Map<string, string>;
}

/**
 * Collapsed eval card body (header content only — `CardGrid` owns the outer
 * `Paper` + the card-root `eval-card-${id}` testid). Kind badge + name +
 * `slug · kind` + 2-line description + 2-row-clamped dimension chips. Archived
 * evals render muted.
 */
export function renderEvalCard(
  ev: EvalDefinitionRead,
  _isOpen: boolean,
  opts: CardOpts,
): ReactNode {
  const isArchived = ev.status === "archived";
  const KindIcon = KIND_ICONS[ev.kind] ?? IconMaterialSymbolsLibraryBooks;
  const kindLabel = KIND_LABELS[ev.kind] ?? ev.kind;
  const { visible, overflow } = clampDimensions(ev.dimensionIds, 6);

  return (
    <Box
      sx={{
        p: 2,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 1,
        opacity: isArchived ? 0.6 : 1,
        color: isArchived ? "text.disabled" : "text.primary",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
        <Box
          aria-hidden
          sx={[
            kindTintSx(ev.kind),
            {
              flexShrink: 0,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 36,
              height: 36,
              borderRadius: 1,
            },
          ]}
        >
          <KindIcon sx={{ fontSize: 20 }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <Typography
              variant="h6"
              component="div"
              sx={{ ...TWO_LINE_CLAMP, flex: 1, fontWeight: 600, lineHeight: 1.3 }}
            >
              {ev.name}
            </Typography>
            {ev.isTemplate ? <Chip tint="info">Template</Chip> : null}
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.25 }}>
            <Typography
              variant="caption"
              sx={{
                fontFamily: "monospace",
                color: "text.secondary",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                minWidth: 0,
              }}
            >
              {ev.slug}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.disabled" }}>
              ·
            </Typography>
            <Chip tint="outline">{kindLabel}</Chip>
          </Box>
        </Box>
      </Box>

      {ev.description ? (
        <Typography
          variant="body2"
          sx={{ ...TWO_LINE_CLAMP, color: "text.secondary" }}
        >
          {ev.description}
        </Typography>
      ) : null}

      {ev.dimensionIds.length > 0 ? (
        <ChipStrip sx={{ mt: "auto" }}>
          {visible.map((id) => (
            <Chip key={id} tint="muted">
              {opts.dimensionNameById.get(id) ?? id}
            </Chip>
          ))}
          {overflow > 0 ? (
            <Chip tint="muted" data-testid={`eval-dim-overflow-${ev.id}`}>
              +{overflow}
            </Chip>
          ) : null}
        </ChipStrip>
      ) : null}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Detail panel — comprehension-first, kind-specific scoring visuals
// ---------------------------------------------------------------------------

interface DetailOpts {
  detail: EvalDefinitionRead | undefined;
  detailLoading: boolean;
  detailError: Error | null;
  profileDetails: ProfileRead[];
  profileDetailsError: Error | null;
  dimensionNameById: Map<string, string>;
  dimensionAccentById: Map<string, string>;
  onRestore: () => void;
}

function isLibraryRef(ref: AnyEngineRef): ref is LibraryEngineRef {
  return ref.kind === "library";
}
function isGEvalRef(ref: AnyEngineRef): ref is GEvalEngineRef {
  return ref.kind === "g_eval";
}
function isHybridRef(ref: AnyEngineRef): ref is HybridEngineRef {
  return ref.kind === "hybrid";
}

/** Illustrative reduce formula + pipeline labels per reduce type. NOT a mirror
 *  of the runtime reducer (which uses a `denominator_source` basis absent from
 *  the config) — a config-level gloss for comprehension. */
export function reduceFormula(reduce: HybridReduceConfig): {
  formula: string;
  claim: string;
  reduceLabel: string;
} {
  const num = reduce.numeratorRole ?? "numerator";
  const den = reduce.denominatorRole ?? "denominator";
  switch (reduce.type) {
    case "num_over_den":
      return { formula: `score = ${num} ÷ ${den}`, claim: `${num} · ${den}`, reduceLabel: reduce.type };
    case "one_minus_num_over_den":
      return { formula: `score = 1 − ( ${num} ÷ ${den} )`, claim: `${num} · ${den}`, reduceLabel: reduce.type };
    case "findings_list":
      return { formula: "score = severity-weighted findings", claim: "severity-tagged findings", reduceLabel: reduce.type };
    case "global_judgment":
      return { formula: "score = single holistic 0–1 judgment", claim: "one holistic judgment", reduceLabel: reduce.type };
    case "classification":
      return { formula: "score = class label → band", claim: "a class label", reduceLabel: reduce.type };
    default:
      return { formula: `score = code reduce (${reduce.type})`, claim: "claims", reduceLabel: String(reduce.type) };
  }
}

/** An overline section label with a leading icon. */
function SectionLabel({ icon: Icon, children }: { icon: typeof SvgIcon; children: ReactNode }) {
  return (
    <Typography
      variant="overline"
      sx={{ color: "text.secondary", display: "flex", alignItems: "center", gap: 0.75, mb: 1.5 }}
    >
      <Icon aria-hidden sx={{ fontSize: 16 }} />
      {children}
    </Typography>
  );
}

/** Calm tinted score-card surface wrapping each kind's "how it scores" body. */
function ScoreCard({ children }: { children: ReactNode }) {
  return (
    <Box sx={{ bgcolor: "background.default", border: 1, borderColor: "divider", borderRadius: 1, p: 2 }}>
      {children}
    </Box>
  );
}

/** Horizontal 0–1 threshold gauge: a pass zone (≥ threshold) + a marker + the
 *  "Pass when score ≥ X" rule. */
function ThresholdGauge({ value }: { value: number }) {
  const t = Math.max(0, Math.min(1, value));
  const pct = Math.round(t * 100);
  return (
    <Box sx={{ mt: 0.5 }}>
      <Box sx={{ position: "relative", height: 16, borderRadius: 1, bgcolor: "action.hover", overflow: "hidden", border: 1, borderColor: "divider" }}>
        {/* Below the threshold = fail tint, at/above = pass tint — the same
            verdict-ladder palette so the eval gauge reads like the profile bar. */}
        <Box aria-hidden sx={{ position: "absolute", top: 0, bottom: 0, left: 0, width: `${pct}%`, bgcolor: VERDICT.failTint }} />
        <Box aria-hidden sx={{ position: "absolute", top: 0, bottom: 0, right: 0, width: `${100 - pct}%`, bgcolor: VERDICT.passTint }} />
        <Box aria-hidden sx={{ position: "absolute", top: -3, bottom: -3, left: `${pct}%`, width: 2, bgcolor: "text.primary" }} />
      </Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1 }}>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>0.00</Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <IconMaterialSymbolsCheckCircle aria-hidden sx={{ fontSize: 16, color: "success.main" }} />
          <Typography variant="caption" sx={{ fontWeight: 500 }}>
            Pass when score ≥ {t.toFixed(2)}
          </Typography>
        </Box>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>1.00</Typography>
      </Box>
    </Box>
  );
}

/** A labelled config row (`label: value`) for the Library knob grid + Hybrid reduce rows. */
function ConfigRow({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "148px 1fr", gap: 2, alignItems: "baseline" }}>
      <Typography variant="caption" sx={{ color: "text.secondary" }}>{label}</Typography>
      <Box sx={{ minWidth: 0, typography: "body2" }}>{value}</Box>
    </Box>
  );
}

/** Library "how it scores" — metric identity + rubric + config grid, read
 *  straight off `engine_ref`: the combined single-call judge scores every eval
 *  from `rubric`, with `metricId` retained as provenance only (no DeepEval
 *  metric registry to look descriptions up in anymore). */
function LibraryScoring({
  version,
  evalId,
}: {
  version: EvalVersionRead;
  evalId: string;
}) {
  const ref = version.engineRef as LibraryEngineRef;
  const ramp = kindRamp("library");
  const arrayKnobs: [keyof LibraryEngineRef, string][] = [
    ["relevantTopics", "Relevant topics"],
    ["adviceTypes", "Advice types"],
    ["availableTools", "Available tools"],
  ];
  const stringKnobs: [keyof LibraryEngineRef, string][] = [
    ["domain", "Domain"],
    ["role", "Role"],
    ["chatbotRole", "Chatbot role"],
  ];
  return (
    <ScoreCard>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.25, flexWrap: "wrap" }}>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          Derived from library metric
        </Typography>
        <Box component="code" sx={MONO_CODE} data-testid={`eval-metric-provenance-${evalId}`}>
          {ref.metricId}
        </Box>
      </Box>
      {ref.rubric ? (
        <Box
          data-testid={`eval-rubric-${evalId}`}
          sx={{ borderLeft: 3, borderColor: ramp.border, pl: 1.75, py: 1, mb: 1.5, color: "text.secondary", typography: "body2", lineHeight: 1.6 }}
        >
          <Box component="b" sx={{ color: "text.primary", fontWeight: 600 }}>Rubric. </Box>
          {ref.rubric}
        </Box>
      ) : null}
      <ThresholdGauge value={version.defaultThreshold} />
      <Stack spacing={1} sx={{ mt: 1.75 }}>
        {stringKnobs.map(([key, label]) =>
          ref[key] ? <ConfigRow key={String(key)} label={label} value={String(ref[key])} /> : null,
        )}
        {arrayKnobs.map(([key, label]) => {
          const arr = ref[key] as string[] | null | undefined;
          return arr && arr.length > 0 ? (
            <ConfigRow
              key={String(key)}
              label={label}
              value={
                <ChipStrip>
                  {arr.map((v: string) => (
                    <Chip key={v} tint="muted">{v}</Chip>
                  ))}
                </ChipStrip>
              }
            />
          ) : null;
        })}
        {ref.expectedSchema ? (
          <ConfigRow
            label="Expected schema"
            value={
              <Box
                component="pre"
                sx={{ ...MONO_CODE, display: "block", whiteSpace: "pre-wrap", overflowX: "auto", m: 0, py: 1 }}
              >
                {JSON.stringify(ref.expectedSchema, null, 2)}
              </Box>
            }
          />
        ) : null}
      </Stack>
    </ScoreCard>
  );
}

/** G-Eval "how it scores" — criteria + numbered evaluation-step stepper + strict mode.
 *  When `engine === "combined"`, the combined single-call judge scored this from
 *  the version's `rubric` instead of running DeepEval's `GEval` metric against the
 *  authored criteria/steps — the stepper depicts that metric's own multi-step
 *  procedure, so it's replaced by the rubric. Strict mode still applies either way:
 *  the combined engine carries it and applies the same post-hoc gate. */
function GEvalScoring({ version, evalId }: { version: EvalVersionRead; evalId: string }) {
  const ref = version.engineRef as GEvalEngineRef;
  const ramp = kindRamp("g_eval");
  const isCombined = ref.engine === "combined";
  const steps = ref.evaluationSteps ?? [];
  return (
    <ScoreCard>
      {isCombined ? (
        <Box
          data-testid={`eval-rubric-${evalId}`}
          sx={{ borderLeft: 3, borderColor: ramp.border, pl: 1.75, py: 1, mb: 1.5, color: "text.secondary", typography: "body2", lineHeight: 1.6 }}
        >
          <Box component="b" sx={{ color: "text.primary", fontWeight: 600 }}>Rubric. </Box>
          {ref.rubric}
        </Box>
      ) : (
        <>
          {ref.criteria ? (
            <Box sx={{ borderLeft: 3, borderColor: ramp.border, pl: 1.75, py: 1, mb: 1.5, color: "text.secondary", typography: "body2", lineHeight: 1.6 }}>
              {ref.criteria}
            </Box>
          ) : null}
          {steps.length > 0 ? (
            <Stack spacing={0} sx={{ mb: 1 }}>
              {steps.map((step: string, idx: number) => (
                <Box key={idx} sx={{ display: "flex", gap: 1.5, pb: idx === steps.length - 1 ? 0 : 1.75, position: "relative" }}>
                  <Box
                    aria-hidden
                    sx={{ flexShrink: 0, width: 22, height: 22, borderRadius: "50%", bgcolor: ramp.tint, color: ramp.text, display: "grid", placeItems: "center", typography: "caption", fontWeight: 600 }}
                  >
                    {idx + 1}
                  </Box>
                  <Typography variant="body2" sx={{ pt: 0.25 }}>{step}</Typography>
                </Box>
              ))}
            </Stack>
          ) : null}
        </>
      )}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1, mb: 0.5, flexWrap: "wrap" }}>
        <Chip tint="outline" icon={IconMaterialSymbolsGavel} sx={{ color: ramp.text, borderColor: ramp.border, bgcolor: ramp.tint }}>
          Strict mode {ref.strictMode ? "on" : "off"}
        </Chip>
        <Typography variant="caption" sx={{ color: "text.secondary", fontStyle: "italic" }}>
          {ref.strictMode ? "strict ⇒ score gated to a binary pass / fail" : "lenient ⇒ continuous 0–1 score"}
        </Typography>
      </Box>
      <ThresholdGauge value={version.defaultThreshold} />
    </ScoreCard>
  );
}

/** One stage box in the Hybrid map→reduce pipeline. */
function PipeStage({ label, icon: Icon, body, accent }: { label: string; icon?: typeof SvgIcon; body: ReactNode; accent: boolean }) {
  const ramp = kindRamp("hybrid");
  return (
    <Box sx={{ flex: 1, minWidth: 120, borderRadius: 1, p: 1.25, border: 1, borderColor: accent ? ramp.border : "divider", bgcolor: accent ? ramp.tint : "background.paper" }}>
      <Typography variant="overline" sx={{ display: "flex", alignItems: "center", gap: 0.5, color: accent ? ramp.text : "text.secondary", mb: 0.5 }}>
        {Icon ? <Icon aria-hidden sx={{ fontSize: 14 }} /> : null}
        {label}
      </Typography>
      <Box sx={{ typography: "caption", color: "text.primary" }}>{body}</Box>
    </Box>
  );
}

/** Hybrid "how it scores" — map→reduce pipeline + formula + reduce config + rubric. */
function HybridScoring({ version }: { version: EvalVersionRead }) {
  const ref = version.engineRef as HybridEngineRef;
  const ramp = kindRamp("hybrid");
  const reduce = ref.reduce;
  const rf = reduceFormula(reduce);
  const gate = reduce.severityGate ?? [];
  const chev = (
    <Box aria-hidden sx={{ display: "grid", placeItems: "center", px: 0.5, color: ramp.border }}>
      <IconMaterialSymbolsChevronRight sx={{ fontSize: 22 }} />
    </Box>
  );
  return (
    <ScoreCard>
      <Box sx={{ display: "flex", alignItems: "stretch", flexWrap: "wrap" }}>
        <PipeStage accent label="Map · LLM" icon={IconMaterialSymbolsPsychology} body="Marks claims from the trace" />
        {chev}
        <PipeStage accent={false} label="Claims" body={rf.claim} />
        {chev}
        <PipeStage accent label="Reduce · code" icon={IconMaterialSymbolsFunctions} body={rf.reduceLabel} />
      </Box>
      <Box sx={{ mt: 1.75, borderRadius: 1, p: 1.5, textAlign: "center", fontFamily: "monospace", typography: "body2", bgcolor: ramp.tint, border: 1, borderColor: ramp.border, color: HYBRID_FORMULA_TEXT }}>
        {rf.formula}
      </Box>
      <Stack spacing={1} sx={{ mt: 1.75 }}>
        {reduce.numeratorRole ? <ConfigRow label="Numerator" value={reduce.numeratorRole} /> : null}
        {reduce.denominatorRole ? <ConfigRow label="Denominator" value={reduce.denominatorRole} /> : null}
        {gate.length > 0 ? (
          <ConfigRow
            label="Severity gate"
            value={
              <ChipStrip>
                {gate.map((sev: string) => (
                  <Chip key={sev} tint="destructive">{sev}</Chip>
                ))}
              </ChipStrip>
            }
          />
        ) : null}
        {reduce.severityRule ? <ConfigRow label="Severity rule" value={<Box component="code" sx={MONO_CODE}>{reduce.severityRule}</Box>} /> : null}
        {reduce.reconcile ? <ConfigRow label="Reconcile" value={<Box component="code" sx={MONO_CODE}>{reduce.reconcile}</Box>} /> : null}
      </Stack>
      <Box sx={{ mt: 1.75, borderLeft: 3, borderColor: ramp.border, pl: 1.75, py: 1, color: "text.secondary", typography: "body2", lineHeight: 1.6 }}>
        <Box component="b" sx={{ color: "text.primary", fontWeight: 600 }}>Map rubric. </Box>
        {ref.mapRubric}
      </Box>
      <Box sx={{ mt: 1.75 }}>
        <ThresholdGauge value={version.defaultThreshold} />
      </Box>
    </ScoreCard>
  );
}

/** Engine "how it scores" view keyed off the engine ref's discriminated `kind`. */
function EngineScoring({
  version,
  evalId,
}: {
  version: EvalVersionRead;
  evalId: string;
}) {
  const ref = version.engineRef;
  if (isLibraryRef(ref)) {
    return <LibraryScoring version={version} evalId={evalId} />;
  }
  if (isGEvalRef(ref)) return <GEvalScoring version={version} evalId={evalId} />;
  if (isHybridRef(ref)) return <HybridScoring version={version} />;
  return null;
}

/** Input-requirement chips from the `inputRequirements` flags. */
function RequirementStrip({ reqs }: { reqs: InputRequirements }) {
  const active = REQUIREMENT_META.filter((meta) => reqs[meta.key]);
  if (active.length === 0) {
    return (
      <Typography variant="caption" sx={{ color: "text.secondary", fontStyle: "italic" }}>
        Runs on the basic input / output — no special trace data required.
      </Typography>
    );
  }
  return (
    <ChipStrip>
      {active.map((meta) => (
        <Chip key={String(meta.key)} tint="outline" icon={meta.icon}>{meta.label}</Chip>
      ))}
    </ChipStrip>
  );
}

/** Evidence-capability row: `refs` cites span/turn/doc refs; `reason_only` is prose. */
function EvidenceRow({ capability }: { capability: string }) {
  const refs = capability === "refs";
  const Icon = refs ? IconMaterialSymbolsLink : IconMaterialSymbolsSubject;
  return (
    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.25 }}>
      <Icon aria-hidden sx={{ fontSize: 20, color: "primary.main", flexShrink: 0 }} />
      <Box>
        <Typography variant="body2">{refs ? "Cites evidence" : "Explains in prose"}</Typography>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          {refs
            ? "Links each verdict to spans, turns, or documents in the trace."
            : "Justifies its verdict in natural language — no machine-checkable refs."}
        </Typography>
      </Box>
    </Box>
  );
}

/** A panel section: an icon'd overline label + a divider above (except the first). */
function PanelSection({ icon, label, first, children }: { icon: typeof SvgIcon; label: string; first?: boolean; children: ReactNode }) {
  return (
    <Box sx={{ pt: first ? 0 : 2, mt: first ? 0 : 2, borderTop: first ? 0 : 1, borderColor: "divider" }}>
      <SectionLabel icon={icon}>{label}</SectionLabel>
      {children}
    </Box>
  );
}

/**
 * Expanded eval detail panel content (rendered inside the `CardGrid` Popper,
 * Reads version-level data from the lazily-fetched `opts.detail`;
 * a skeleton while in flight, an explicit `ErrorState` on `detailError`. Archived
 * evals render muted with a Restore action; Archive is not in this panel.
 */
export function renderEvalDetail(ev: EvalDefinitionRead, opts: DetailOpts): ReactNode {
  return (
    <Box data-testid={`eval-detail-${ev.id}`} sx={{ p: 3 }}>
      <EvalDetailBody ev={ev} opts={opts} />
    </Box>
  );
}

function EvalDetailBody({ ev, opts }: { ev: EvalDefinitionRead; opts: DetailOpts }) {
  const { detail, detailLoading, detailError } = opts;

  if (detailError) {
    return <ErrorState title="Details unavailable" message={detailError.message} />;
  }

  const versions = detail?.versions ?? [];
  const latest = latestVersion(versions);

  if (detailLoading || !detail || !latest) {
    return (
      <Stack spacing={1.5}>
        <Skeleton variant="rounded" height={24} width="40%" />
        <Skeleton variant="rounded" height={64} />
        <Skeleton variant="rounded" height={24} width="60%" />
        <Skeleton variant="rounded" height={40} />
      </Stack>
    );
  }

  const isArchived = ev.status === "archived";
  const kindLabel = KIND_LABELS[ev.kind] ?? ev.kind;
  const KindIcon = KIND_ICONS[ev.kind] ?? IconMaterialSymbolsLibraryBooks;
  const ramp = kindRamp(ev.kind);

  const usedIn = opts.profileDetailsError
    ? "unavailable"
    : usedInProfilesCount(ev.slug, opts.profileDetails);

  return (
    <Box sx={{ opacity: isArchived ? 0.72 : 1 }}>
      {/* Header — identity + top-right actions (pr clears the dialog's close ✕). */}
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.75, pr: 4.5 }}>
        <Box
          aria-hidden
          sx={{ flexShrink: 0, width: 42, height: 42, borderRadius: 1, display: "grid", placeItems: "center", color: "common.white", bgcolor: (theme) => kindAccent(ev.kind, theme) }}
        >
          <KindIcon sx={{ fontSize: 24 }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>{ev.name}</Typography>
            {ev.isTemplate ? <Chip tint="info">Template</Chip> : null}
            {isArchived ? <Chip tint="muted">Archived</Chip> : null}
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 0.25 }}>
            <Typography variant="caption" sx={{ fontFamily: "monospace", color: "text.secondary" }}>{ev.slug}</Typography>
            <Typography variant="caption" sx={{ color: "text.disabled" }}>·</Typography>
            <Chip tint="outline" sx={{ color: ramp.text, borderColor: ramp.text }}>{kindLabel}</Chip>
          </Box>
        </Box>
        <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
          {isArchived ? (
            <Button
              variant="outlined"
              size="small"
              startIcon={<IconMaterialSymbolsRestartAlt sx={{ fontSize: 18 }} />}
              data-testid={`eval-detail-restore-${ev.id}`}
              onClick={opts.onRestore}
            >
              Restore
            </Button>
          ) : null}
        </Stack>
      </Box>

      {ev.description ? (
        <Typography variant="body2" sx={{ color: "text.secondary", mt: 1.5, maxWidth: "64ch" }}>
          {ev.description}
        </Typography>
      ) : null}

      {/* Provenance — quiet meta line */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 1.5, flexWrap: "wrap", color: "text.disabled", typography: "caption" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          <IconMaterialSymbolsHistory aria-hidden sx={{ fontSize: 14 }} />
          <Box component="span"><Box component="span" sx={{ color: "text.secondary", fontWeight: 500 }}>v{latest.version}</Box> · latest</Box>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          <IconMaterialSymbolsUpdate aria-hidden sx={{ fontSize: 14 }} />
          Updated {new Date(ev.updatedAt).toLocaleDateString()}
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }} data-testid={`eval-used-in-${ev.id}`}>
          <IconMaterialSymbolsDashboard aria-hidden sx={{ fontSize: 14 }} />
          {usedIn === "unavailable"
            ? "Used in — profiles (counts unavailable)"
            : <>Used in <Box component="span" sx={{ color: "text.secondary", fontWeight: 500 }}>{usedIn}</Box> profile{usedIn === 1 ? "" : "s"}</>}
        </Box>
      </Box>

      <PanelSection icon={IconMaterialSymbolsSchema} label="How it scores">
        <EngineScoring version={latest} evalId={ev.id} />
      </PanelSection>

      <PanelSection icon={IconMaterialSymbolsInput} label="What it needs from the trace">
        <RequirementStrip reqs={latest.inputRequirements} />
        <Box sx={{ mt: 1.5 }}>
          <EvidenceRow capability={latest.evidenceCapability} />
        </Box>
      </PanelSection>

      {ev.dimensionIds.length > 0 ? (
        <PanelSection icon={IconMaterialSymbolsCategory} label="Where it applies">
          <ChipStrip>
            {ev.dimensionIds.map((id: string) => (
              <Box
                key={id}
                sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, px: 1, py: 0.5, borderRadius: 1, bgcolor: "action.hover", typography: "caption" }}
              >
                <Box aria-hidden sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: opts.dimensionAccentById.get(id) ?? dimensionAccent(0) }} />
                {opts.dimensionNameById.get(id) ?? id}
              </Box>
            ))}
          </ChipStrip>
        </PanelSection>
      ) : null}
    </Box>
  );
}
