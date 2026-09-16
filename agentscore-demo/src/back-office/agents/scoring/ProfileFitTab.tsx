/** Adopted scoring profile (read-only) + reversible pin/unpin + fit
 * provenance (why this profile was chosen, plus its history). Rendered as a
 * section on the agent Profile page, above the Activity log.
 *
 * `ProfileFitTab` is the shell-facing wrapper: it renders the "Scoring
 * profile" section header + the adopted-version chip, then
 * `ScoringProfilePanel` for the rest.
 *
 * No backend: all data comes from `profile-fixtures.ts`; pin/unpin/re-fit
 * mutate the fixture-shaped `benchmark` + local fit-history state directly.
 */

import { createContext, useContext, useState, type HTMLAttributes } from "react";
import { Link as RouterLink } from "@tanstack/react-router";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Collapse from "@mui/material/Collapse";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import MuiTooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import IconMaterialSymbolsSpeed from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsSpeed.mjs";
import IconMaterialSymbolsRefresh from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsRefresh.mjs";
import IconMaterialSymbolsKeyboardArrowDown from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsKeyboardArrowDown.mjs";
import IconMaterialSymbolsLinkOff from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsLinkOff.mjs";
import { toast } from "@/shared/lib/toast";

import {
  PROFILE_CATALOG,
  getFixture,
  profileLabelFor,
  type BenchmarkConfigOut,
  type DiscriminationOut,
  type EvalDiscriminationOut,
  type FitDecisionDetailOut,
  type FitDecisionOut,
  type ProfileEntryOut,
  type ReadinessOut,
} from "@/back-office/agents/scoring/profile-fixtures";
import { useAutoFit } from "@/back-office/agents/use-auto-fit";
import { Chip } from "@/shared/components/chip";
import { EmptyState } from "@/shared/components/empty-state";
import { ProvenanceDl, type ProvenanceItem } from "@/shared/components/provenance-dl";

// ---------------------------------------------------------------------------
// Shell-facing wrapper — "Scoring profile" section header + adopted-version
// chip, then the panel body.
// ---------------------------------------------------------------------------

export function ProfileFitTab({
  tenantId,
  agentId,
  benchmark,
  onBenchmarkChange,
}: {
  tenantId: string;
  agentId: string;
  benchmark: BenchmarkConfigOut;
  onBenchmarkChange: (b: BenchmarkConfigOut) => void;
}) {
  return (
    <Box sx={{ maxWidth: 1200, width: "100%" }}>
      <ScoringProfilePanel key={`${tenantId}:${agentId}`} tenantId={tenantId} agentId={agentId} benchmark={benchmark} onBenchmarkChange={onBenchmarkChange} />
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Scoring-profile panel — read-only adopted profile + reversible pin/unpin.
// ---------------------------------------------------------------------------

const ProfileLabels = createContext<Record<string, string>>({});

function ProfileLabel({ id }: { id: string | null | undefined }) {
  const labels = useContext(ProfileLabels);
  return <>{id ? labels[id] ?? `Unavailable profile (${id})` : "Profile not recorded"}</>;
}

function readableName(value: string): string {
  const words = value.replaceAll("_", " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function fitOutcome(value: string): string {
  return ({ no_change: "Unchanged", adopted: "Selected", fallback: "Fallback", superseded: "Superseded" } as Record<string, string>)[value] ?? readableName(value);
}

const PROFILE_SECTION_SX = { border: 1, borderColor: "divider", borderRadius: 1, p: { xs: 2, md: 3 }, minWidth: 0 };

/** Stable display order: dimensions in their dimension_weights order, then any
 *  extras present only in evalsByDimension (defensive — should not happen). */
function dimensionOrder(benchmark: BenchmarkConfigOut): string[] {
  const weighted = Object.keys(benchmark.dimensionWeights);
  const extras = Object.keys(benchmark.evalsByDimension).filter(
    (d) => !weighted.includes(d),
  );
  return [...weighted, ...extras];
}

export function ScoringProfilePanel({
  tenantId,
  agentId,
  benchmark,
  onBenchmarkChange,
}: {
  tenantId: string;
  agentId: string;
  benchmark: BenchmarkConfigOut;
  onBenchmarkChange: (b: BenchmarkConfigOut) => void;
}) {
  // Profile version pending confirmation in the pin dialog (null = closed).
  const [pendingVersionId, setPendingVersionId] = useState<string | null>(null);
  const [changingVersion, setChangingVersion] = useState(false);
  const [pinning, setPinning] = useState(false);

  // Fit provenance + history — no backend, seeded from the fixture and then
  // mutated locally as re-fits/pins happen.
  const [fitHistory, setFitHistory] = useState<FitDecisionDetailOut[]>(() => getFixture(agentId).fitHistory);
  const latest = fitHistory[0] ?? null;

  const readiness: ReadinessOut | undefined = getFixture(agentId).readiness;

  function recordDecision(decision: FitDecisionDetailOut) {
    setFitHistory((prev) => [decision, ...prev]);
  }

  const autoFit = useAutoFit(tenantId, agentId, () => {
    const ranked = PROFILE_CATALOG.flatMap((p) => p.versions.map((v) => ({ profileVersionId: v.profileVersionId, label: `${p.name} · v${v.version}` })));
    const chosen = ranked.find((r) => r.profileVersionId === benchmark.profileVersionId) ?? ranked[0];
    const decision: FitDecisionDetailOut = {
      id: `fit-${Date.now()}`,
      createdAt: new Date().toISOString(),
      fitMethod: "llm",
      outcome: "no_change",
      chosenProfileVersionId: chosen.profileVersionId,
      trigger: "manual",
      confidence: 0.85,
      rationale: `${chosen.label} remains the strongest match for this agent's current traffic.`,
      fallbackClass: null,
      fallbackReason: null,
      shadowHeuristicProfileVersionId: null,
      detectedSignals: ["stable pass-rate trend"],
      perCandidate: ranked.slice(0, 3).map((r) => ({ profileVersionId: r.profileVersionId, score: r === chosen ? 0.85 : 0.6, reason: r === chosen ? "Best current match." : "Lower coverage of enabled evals." })),
      modelId: "claude-sonnet-4-6",
      fitterPromptVersion: "profile-fit-v3",
      configVersion: benchmark.configVersion,
      inputHash: Date.now().toString(16).slice(0, 10),
      runId: `run-${Date.now().toString(16).slice(0, 8)}`,
      tokenUsage: { prompt_tokens: 910, completion_tokens: 190 },
      sampledTraceIds: [],
      fallbackDiagnostic: null,
    };
    recordDecision(decision);
    onBenchmarkChange({ ...benchmark, needsProfileAttention: false, attentionReason: null, driftNudge: benchmark.driftNudge ? { ...benchmark.driftNudge, active: false } : null });
  });

  const order = dimensionOrder(benchmark);
  const hasEvals = order.some(
    (d) => (benchmark.evalsByDimension[d] ?? []).length > 0,
  );
  const isPinned = benchmark.bindingSource === "pinned";

  const extraVersions = PROFILE_CATALOG.flatMap((profile) =>
    profile.versions
      .filter((v) => v.profileVersionId !== benchmark.profileVersionId)
      .map((v) => ({ id: v.profileVersionId, label: v.label })),
  );

  const pendingLabel =
    extraVersions.find((v) => v.id === pendingVersionId)?.label ??
    "this profile version";

  /** Selecting a *different* version stages it for pin confirmation. */
  function requestPin(profileVersionId: string) {
    if (profileVersionId === benchmark.profileVersionId) return;
    setPendingVersionId(profileVersionId);
  }

  function confirmPin() {
    if (!pendingVersionId) return;
    setPinning(true);
    setTimeout(() => {
      const label = profileLabelFor(pendingVersionId) ?? "Selected profile";
      const [profileName, versionPart] = label.split(" · v");
      recordDecision({
        id: `fit-${Date.now()}`,
        createdAt: new Date().toISOString(),
        fitMethod: "heuristic",
        outcome: "adopted",
        chosenProfileVersionId: pendingVersionId,
        trigger: "manual",
        confidence: null,
        rationale: `Manually pinned to ${label}.`,
        fallbackClass: null,
        fallbackReason: null,
        shadowHeuristicProfileVersionId: null,
        detectedSignals: [],
        perCandidate: [{ profileVersionId: pendingVersionId, score: 1, reason: "Manually selected." }],
        sampledTraceIds: [],
      });
      onBenchmarkChange({
        ...benchmark,
        bindingSource: "pinned",
        profileVersionId: pendingVersionId,
        profileName,
        profileVersion: versionPart ? Number(versionPart) : benchmark.profileVersion,
        driftNudge: null,
        needsProfileAttention: false,
        attentionReason: null,
      });
      setPinning(false);
      setPendingVersionId(null);
      toast.success("Pinned profile version.");
    }, 400);
  }

  function unpin() {
    setPinning(true);
    setTimeout(() => {
      onBenchmarkChange({ ...benchmark, bindingSource: "auto" });
      setPinning(false);
      toast.success("Unpinned — auto-fit will manage this profile.");
    }, 300);
  }

  const profileLabels = Object.fromEntries(PROFILE_CATALOG.flatMap((profile) => profile.versions.map((version) => [version.profileVersionId, `${profile.name} · v${version.version}`])));
  profileLabels[benchmark.profileVersionId] = `${benchmark.profileName ?? "Current profile"}${benchmark.profileVersion != null ? ` · v${benchmark.profileVersion}` : ""}`;

  return (
    <ProfileLabels.Provider value={profileLabels}>
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Archived / invalid pinned profile (§3.2/§3.8) */}
      {benchmark.bindingInvalid ? (
        <Alert severity="warning" data-testid="binding-invalid">
          The pinned profile version is archived. Re-fit to a current profile.
        </Alert>
      ) : null}

      {/* Needs-profile-attention chip (F4/F11) + check-quality info chip
          (informational-only `degenerate` state) + manual re-fit (F5). The
          two chips are keyed off INDEPENDENT signals — a version can be
          both attention-worthy (a different reason) and unassessable — so
          both may render together. */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <AttentionChip
          needsAttention={benchmark.needsProfileAttention}
          attentionReason={benchmark.attentionReason}
          latest={latest}
          discriminationAssessedAt={benchmark.discriminationAssessedAt}
        />
        {benchmark.checkQualityState === "unassessable_no_labels" ? (
          <CheckQualityInfoChip
            tenantId={tenantId}
            agentId={agentId}
            discriminationAssessedAt={benchmark.discriminationAssessedAt}
          />
        ) : null}
      </Box>

      {/* Readiness visibility for a default-bound, not-yet-ready agent
          (R3a) — never shown once auto-fitted or pinned. */}
      <ReadinessSection benchmark={benchmark} readiness={readiness} />

      <Box sx={PROFILE_SECTION_SX} data-testid="profile-current-section">
        <Typography variant="h6" sx={{ mb: 2 }}>Current profile</Typography>
        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 3, flexWrap: "wrap" }}>
          <Box>
            <Typography variant="h4">{benchmark.profileName ?? "Adopted profile"}</Typography>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1 }}>
              <Chip tint="muted">{benchmark.profileVersion != null ? `Version ${benchmark.profileVersion}` : "Version unavailable"}</Chip>
              <Chip tint="info">{isPinned ? "Manually pinned" : benchmark.bindingSource === "auto" ? "Automatically selected" : "Default profile"}</Chip>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
              {latest ? `Last reviewed ${new Date(latest.createdAt).toLocaleString()} · ${fitOutcome(latest.outcome)}` : "No selection review recorded"}
            </Typography>
          </Box>
          <Box sx={{ maxWidth: 520 }}>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <RefitButton onRefit={autoFit.refit} disabled={autoFit.isBusy} />
              <Button variant="outlined" disabled={pinning} onClick={() => setChangingVersion((value) => !value)} aria-expanded={changingVersion} data-testid="profile-change-version">Change profile version</Button>
              {isPinned ? <Button disabled={pinning} onClick={unpin} data-testid="scoring-unpin" startIcon={<IconMaterialSymbolsLinkOff fontSize="small" />}>Use automatic selection</Button> : null}
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>Changing the version pins this agent to your selection and re-scores recent interactions.</Typography>
          </Box>
        </Box>
        <Collapse in={changingVersion}>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Choose a profile version</Typography>
            <ProfileVersionSelect currentVersionId={benchmark.profileVersionId} currentLabel={benchmark.profileVersion != null ? `v${benchmark.profileVersion} (adopted)` : "Adopted version"} extraVersions={extraVersions} disabled={pinning} onSelect={requestPin} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>To change evaluations or thresholds, publish a new profile version in the catalog, then select it here.</Typography>
          </Box>
        </Collapse>
      </Box>

      <Box sx={PROFILE_SECTION_SX}>
        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, mb: 2 }}>
          <Typography variant="h6">What gets scored</Typography>
          <Button component={RouterLink} to="/evals/catalog/profiles" data-testid="profile-view-catalog">View in catalog</Button>
        </Box>
      {/* Evals grouped by dimension (read-only) */}
      {!hasEvals ? (
        <EmptyState
          icon={IconMaterialSymbolsSpeed}
          title="No evals in this profile version"
          description="The adopted profile version pins no evals."
        />
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {order.map((dimensionSlug) => {
            const entries = benchmark.evalsByDimension[dimensionSlug] ?? [];
            if (entries.length === 0) return null;
            const weight = benchmark.dimensionWeights[dimensionSlug];
            return (
              <DimensionEntries
                key={dimensionSlug}
                dimensionSlug={dimensionSlug}
                weight={weight}
                entries={entries}
              />
            );
          })}
        </Box>
      )}

      </Box>
      <Box sx={PROFILE_SECTION_SX}>
        <FitProvenancePanel latest={latest} />
        <Box sx={{ mt: 2 }}><EvidenceDiversitySection benchmark={benchmark} /><Typography variant="caption" color="text.secondary">Variety represented in the fitting evidence</Typography></Box>
      </Box>

      {/* Pooled per-profile-version discrimination (spec §4.3). */}
      {benchmark.discrimination ? (
        <DiscriminationSection
          discrimination={benchmark.discrimination}
          discriminationAssessedAt={benchmark.discriminationAssessedAt}
        />
      ) : benchmark.attentionReason === "profile_quality" &&
        benchmark.discriminationAssessedAt ? (
        <DiscriminationProvenanceNote
          assessedAt={benchmark.discriminationAssessedAt}
        />
      ) : null}

      <Box sx={PROFILE_SECTION_SX}>
        <FitHistorySection history={latest ? [latest, ...fitHistory.filter((item) => item.id !== latest.id)] : fitHistory} />
      </Box>

      {/* Reversible-pin confirmation dialog (§3.2) */}
      <Dialog
        open={pendingVersionId !== null}
        onClose={() => setPendingVersionId(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Pin to {pendingLabel}?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Pinning overrides auto-fit and re-scores the recent window under the
            selected version. You can unpin later to hand it back to auto-fit.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setPendingVersionId(null)}
            disabled={pinning}
            data-testid="pin-cancel"
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disableElevation
            onClick={confirmPin}
            disabled={pinning}
            data-testid="pin-confirm"
          >
            {pinning ? "Pinning…" : "Pin profile"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
    </ProfileLabels.Provider>
  );
}

// ---------------------------------------------------------------------------
// Needs-profile-attention chip.
// ---------------------------------------------------------------------------

function discriminationProvenanceClause(
  discriminationAssessedAt: string | null | undefined,
): string {
  if (!discriminationAssessedAt) return "";
  const stamp = new Date(discriminationAssessedAt).toLocaleString();
  return ` As of ${stamp}, every check behind this verdict is at least this current — measured across all agents using this profile version.`;
}

function attentionTooltipText(
  attentionReason: string | null | undefined,
  latest: FitDecisionOut | null | undefined,
  discriminationAssessedAt: string | null | undefined,
): string {
  const provenance = discriminationProvenanceClause(discriminationAssessedAt);
  switch (attentionReason) {
    case "inverted":
      return `A check in this profile scores run backwards — higher score, worse outcome, as scored by this judge.${provenance}`;
    case "not_discriminating":
      return `This profile's checks don't separate labeled good from labeled bad better than chance, as scored by this judge.${provenance}`;
    case "profile_quality":
      return `This profile has a discrimination issue. Ask a superadmin for the detail.${provenance}`;
    default:
      break;
  }
  if (!latest) return "Needs profile attention.";
  if (latest.outcome === "fallback") {
    return `Last fit fell back to the heuristic (${latest.fallbackReason ?? "unknown"}).`;
  }
  if (latest.fitMethod === "llm" && latest.confidence != null) {
    return "LLM fit confidence below the attention threshold.";
  }
  return "Automatic fitting is paused for this agent.";
}

function AttentionChip({
  needsAttention,
  attentionReason,
  latest,
  discriminationAssessedAt,
}: {
  needsAttention: boolean;
  attentionReason: string | null | undefined;
  latest: FitDecisionOut | null | undefined;
  discriminationAssessedAt: string | null | undefined;
}) {
  if (!needsAttention) return null;
  return (
    <MuiTooltip
      title={attentionTooltipText(attentionReason, latest, discriminationAssessedAt)}
    >
      <Box component="span" data-testid="attention-chip">
        <Chip tint="warning">Needs attention</Chip>
      </Box>
    </MuiTooltip>
  );
}

// ---------------------------------------------------------------------------
// Check-quality-unassessable info chip.
// ---------------------------------------------------------------------------

const CHECK_QUALITY_UNASSESSABLE_TOOLTIP =
  "This profile's check quality can't be assessed yet — no check has earned a labeled verdict. Enabling it needs labeled interactions covering both outcomes (good and bad), from more than one agent using this profile version.";

function CheckQualityInfoChip({
  tenantId,
  agentId,
  discriminationAssessedAt,
}: {
  tenantId: string;
  agentId: string;
  discriminationAssessedAt: string | null | undefined;
}) {
  const tooltipText =
    CHECK_QUALITY_UNASSESSABLE_TOOLTIP +
    discriminationProvenanceClause(discriminationAssessedAt);
  return (
    <MuiTooltip title={tooltipText}>
      <Box
        component="span"
        data-testid="check-quality-info-chip"
        sx={{ "& a": { textDecoration: "none" } }}
      >
        <RouterLink
          to="/tenants/$tenantId/agents/$agentId/labeling"
          params={{ tenantId, agentId }}
        >
          <Chip tint="outline">Check quality not yet assessable</Chip>
        </RouterLink>
      </Box>
    </MuiTooltip>
  );
}

// ---------------------------------------------------------------------------
// Evidence diversity of the latest fit.
// ---------------------------------------------------------------------------

function formatTwoSigFigs(value: number): string {
  return value.toPrecision(2);
}

function evidenceDiversityText(benchmark: BenchmarkConfigOut): string {
  if (benchmark.evidenceState === "recorded" && benchmark.evidenceDiversity != null) {
    const value = formatTwoSigFigs(benchmark.evidenceDiversity);
    return benchmark.provisionalFit ? `${value} (provisional)` : value;
  }
  if (benchmark.evidenceState === "not_computed") return "not computed (error)";
  return "not recorded";
}

function evidenceDiversityTint(
  benchmark: BenchmarkConfigOut,
): "warning" | "outline" | "muted" {
  if (benchmark.evidenceState !== "recorded") return "muted";
  return benchmark.provisionalFit ? "warning" : "outline";
}

function EvidenceDiversitySection({ benchmark }: { benchmark: BenchmarkConfigOut }) {
  return (
    <Box
      sx={{ display: "flex", alignItems: "center", gap: 1 }}
      data-testid="evidence-diversity"
    >
      <Box sx={{ typography: "caption", color: "text.secondary" }}>
        Evidence diversity
      </Box>
      <Chip tint={evidenceDiversityTint(benchmark)}>
        {evidenceDiversityText(benchmark)}
      </Chip>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Readiness visibility.
// ---------------------------------------------------------------------------

function ReadinessSection({
  benchmark,
  readiness,
}: {
  benchmark: BenchmarkConfigOut;
  readiness: ReadinessOut | undefined;
}) {
  if (benchmark.bindingSource !== "default") return null;
  if (!readiness || readiness.ready) return null;

  const recheckText = readiness.nextRecheckAt
    ? `next re-check at ${new Date(readiness.nextRecheckAt).toLocaleString()}`
    : "pending first check";

  return (
    <Box
      sx={{ display: "flex", alignItems: "center", gap: 1 }}
      data-testid="fit-readiness-section"
    >
      <Chip tint="outline">
        {readiness.captured}/{readiness.threshold} traces
      </Chip>
      <Box sx={{ typography: "caption", color: "text.secondary" }}>
        {recheckText}
      </Box>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Manual re-fit button.
// ---------------------------------------------------------------------------

function RefitButton({
  onRefit,
  disabled,
}: {
  onRefit: () => void;
  disabled: boolean;
}) {
  return (
    <Button
      variant="outlined"
      size="small"
      onClick={onRefit}
      disabled={disabled}
      data-testid="scoring-refit"
      startIcon={<IconMaterialSymbolsRefresh fontSize="small" />}
    >
      Re-evaluate profile
    </Button>
  );
}

// ---------------------------------------------------------------------------
// Pooled per-profile-version discrimination.
// ---------------------------------------------------------------------------

const MIN_LABELED_INTERACTIONS = 20;
const MIN_MINORITY_CLASS_COUNT = 5;
const MIN_COMPARABLE_PAIRS = 50;
const MIN_CONTRIBUTING_AGENTS = 2;

type DiscriminationTint = "info" | "warning" | "destructive" | "muted" | "outline";

const DISCRIMINATION_VERDICT_CHIP: Record<string, { label: string; tint: DiscriminationTint }> = {
  discriminating: { label: "Discriminating", tint: "info" },
  not_discriminating: { label: "Not discriminating", tint: "warning" },
  inverted: { label: "Inverted", tint: "destructive" },
  degenerate: { label: "Degenerate", tint: "outline" },
  inconclusive: { label: "Inconclusive", tint: "muted" },
  insufficient_evidence: { label: "Insufficient evidence", tint: "muted" },
};

const FALLBACK_CLASS_LABELS: Record<"bug" | "expected", string> = {
  bug: "BUG-class",
  expected: "Expected",
};

function fallbackClassTint(cls: string | null | undefined): "destructive" | "warning" | "muted" {
  switch (cls) {
    case "bug":
      return "destructive";
    case "expected":
      return "warning";
    default:
      return "muted";
  }
}

function discriminationVerdictTint(verdict: string): DiscriminationTint {
  return DISCRIMINATION_VERDICT_CHIP[verdict]?.tint ?? "outline";
}

function discriminationVerdictLabel(verdict: string): string {
  return DISCRIMINATION_VERDICT_CHIP[verdict]?.label ?? "Unrecognized verdict";
}

function evalShortfallText(row: EvalDiscriminationOut): string {
  const clauses: string[] = [];
  if (row.labeledInteractions < MIN_LABELED_INTERACTIONS) {
    clauses.push(`${row.labeledInteractions} of ${MIN_LABELED_INTERACTIONS} labeled interactions`);
  }
  if (row.minorityClassCount < MIN_MINORITY_CLASS_COUNT) {
    clauses.push(`${row.minorityClassCount} of ${MIN_MINORITY_CLASS_COUNT} minority-class labels`);
  }
  if (row.comparablePairs < MIN_COMPARABLE_PAIRS) {
    clauses.push(`${row.comparablePairs} of ${MIN_COMPARABLE_PAIRS} comparable pairs`);
  }
  if (row.contributingAgents < MIN_CONTRIBUTING_AGENTS) {
    clauses.push(`labels from ${row.contributingAgents} of ${MIN_CONTRIBUTING_AGENTS} required agents`);
  }
  return clauses.join("; ");
}

function profileDiscriminationDetail(verdict: string): string {
  switch (verdict) {
    case "discriminating":
      return "At least one check separates labeled good from labeled bad, as scored by this judge, better than chance.";
    case "inverted":
      return "At least one check's scores run backwards — higher score, worse outcome.";
    case "not_discriminating":
      return "Every assessed check fails to separate labeled good from labeled bad better than chance, as scored by this judge.";
    case "degenerate":
      return "Scores are too collapsed to tell good outcomes from bad yet.";
    case "inconclusive":
    case "insufficient_evidence":
      return "Not yet assessed.";
    default:
      return "";
  }
}

function evalDiscriminationDetail(row: EvalDiscriminationOut): string {
  const auc =
    row.auc != null && row.aucLower != null && row.aucUpper != null
      ? `AUC ${formatTwoSigFigs(row.auc)} (${formatTwoSigFigs(row.aucLower)}–${formatTwoSigFigs(row.aucUpper)})`
      : null;
  const counts = `${row.labeledInteractions} labeled interactions across ${row.contributingAgents} agents`;
  const evidence = auc ? `${auc}, ${counts}` : counts;
  switch (row.verdict) {
    case "discriminating":
      return `Separates labeled good from labeled bad, as scored by this judge, better than chance — ${evidence}.`;
    case "inverted":
      return `Scores run backwards — higher score, worse outcome, as scored by this judge — ${evidence}.`;
    case "not_discriminating":
      return `Does not separate labeled good from labeled bad better than chance, as scored by this judge — ${evidence}.`;
    case "degenerate":
      return `Scores are too collapsed to tell good outcomes from bad — ${row.scoredInteractions} scored interactions.`;
    case "insufficient_evidence": {
      const shortfall = evalShortfallText(row);
      return shortfall ? `Not yet assessed — ${shortfall}.` : "Not yet assessed.";
    }
    case "inconclusive":
      return "Not yet assessed.";
    default:
      return "";
  }
}

function DiscriminationEvalRow({ evalRow }: { evalRow: EvalDiscriminationOut }) {
  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", gap: 0.5, py: 0.75 }}
      data-testid={`discrimination-eval-${evalRow.evalVersionId}`}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Box component="span" sx={{ fontFamily: "monospace", typography: "caption" }}>
          {evalRow.evalSlug}
        </Box>
        <Chip tint={discriminationVerdictTint(evalRow.verdict)} data-testid={`discrimination-eval-verdict-${evalRow.evalVersionId}`}>
          {discriminationVerdictLabel(evalRow.verdict)}
        </Chip>
      </Box>
      <Box sx={{ typography: "caption", color: "text.secondary" }}>
        {evalDiscriminationDetail(evalRow)}
      </Box>
    </Box>
  );
}

function DiscriminationSection({
  discrimination,
  discriminationAssessedAt,
}: {
  discrimination: DiscriminationOut;
  discriminationAssessedAt: string | null | undefined;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Box
      sx={(theme) => ({
        display: "flex",
        flexDirection: "column",
        gap: 1,
        borderRadius: 1,
        border: 1,
        borderColor: alpha(theme.palette.divider, 0.6),
        px: 1.5,
        py: 1.25,
      })}
      data-testid="discrimination-section"
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box sx={{ typography: "body2", fontWeight: 600 }}>Profile quality across agents</Box>
          <Chip tint={discriminationVerdictTint(discrimination.verdict)} data-testid="discrimination-verdict">
            {discriminationVerdictLabel(discrimination.verdict)}
          </Chip>
        </Box>
        <IconButton
          size="small"
          aria-label="Toggle discrimination detail"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          data-testid="discrimination-toggle"
        >
          <IconMaterialSymbolsKeyboardArrowDown
            fontSize="small"
            sx={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 150ms" }}
          />
        </IconButton>
      </Box>
      <Box sx={{ typography: "caption", color: "text.secondary" }} data-testid="discrimination-detail">
        {profileDiscriminationDetail(discrimination.verdict)}
      </Box>
      <Box sx={{ typography: "caption", color: "text.secondary" }} data-testid="discrimination-assessed-at">
        as of {new Date(discriminationAssessedAt ?? discrimination.computedAt).toLocaleString()}, every check behind this verdict is at least this current — measured across all agents using this profile version
      </Box>
      <Collapse in={open} unmountOnExit>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mt: 0.5 }} data-testid="discrimination-evals">
          {discrimination.evals.map((row) => (
            <DiscriminationEvalRow key={row.evalVersionId} evalRow={row} />
          ))}
        </Box>
      </Collapse>
    </Box>
  );
}

function DiscriminationProvenanceNote({ assessedAt }: { assessedAt: string }) {
  return (
    <Box sx={{ typography: "caption", color: "text.secondary" }} data-testid="discrimination-provenance-note">
      This profile version has a discrimination assessment, as of {new Date(assessedAt).toLocaleString()} — every check behind it is at
      least this current, measured across all agents using this profile version.
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Fit provenance panel — "why this profile": the latest fit decision in full.
// ---------------------------------------------------------------------------

function outcomeTint(outcome: string): "success" | "warning" | "muted" | "info" {
  switch (outcome) {
    case "adopted":
      return "success";
    case "fallback":
      return "warning";
    case "no_change":
    case "superseded":
      return "muted";
    default:
      return "info";
  }
}

function formatConfidencePercent(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}

function candidateProfileVersionId(candidate: Record<string, unknown>): string {
  const v = candidate.profile_version_id ?? candidate.profileVersionId;
  return typeof v === "string" ? v : "—";
}

function candidateScore(candidate: Record<string, unknown>): string {
  const v = candidate.score;
  return typeof v === "number" ? v.toFixed(2) : "—";
}

function candidateReason(candidate: Record<string, unknown>): string | null {
  const v = candidate.reason;
  return typeof v === "string" ? v : null;
}

const PER_CANDIDATE_CAP = 5;

function PerCandidateRow({ candidate }: { candidate: Record<string, unknown> }) {
  const reason = candidateReason(candidate);
  const pvid = candidateProfileVersionId(candidate);
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1.5 }}>
      <Box sx={{ minWidth: 0 }}>
        <Box component="span" sx={{ fontFamily: "monospace", typography: "caption" }}>
          <ProfileLabel id={pvid === "—" ? null : pvid} />
        </Box>
        {reason ? (
          <Box sx={{ typography: "caption", color: "text.secondary" }} data-slot="fit-candidate-reason">
            {reason}
          </Box>
        ) : null}
      </Box>
      <Box component="span" sx={{ typography: "caption", fontWeight: 600 }}>
        {candidateScore(candidate)}
      </Box>
    </Box>
  );
}

function PerCandidateList({ candidates }: { candidates: Record<string, unknown>[] }) {
  const [expanded, setExpanded] = useState(false);
  const top = candidates.slice(0, PER_CANDIDATE_CAP);
  const rest = candidates.slice(PER_CANDIDATE_CAP);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }} data-testid="fit-per-candidate">
      <Box sx={{ typography: "overline", color: "text.secondary" }}>Ranked candidates</Box>
      {top.map((c, i) => (
        <PerCandidateRow key={i} candidate={c} />
      ))}
      {rest.length > 0 ? (
        <>
          <Collapse in={expanded} unmountOnExit>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
              {rest.map((c, i) => (
                <PerCandidateRow key={PER_CANDIDATE_CAP + i} candidate={c} />
              ))}
            </Box>
          </Collapse>
          <Button size="small" variant="text" onClick={() => setExpanded((v) => !v)} data-testid="fit-per-candidate-toggle" sx={{ alignSelf: "flex-start" }}>
            {expanded ? "Show fewer" : `Show ${rest.length} more`}
          </Button>
        </>
      ) : null}
    </Box>
  );
}

function formatTokenUsage(usage: Record<string, unknown> | null | undefined): string {
  if (!usage) return "—";
  const parts = Object.entries(usage).map(([k, v]) => `${k}: ${v}`);
  return parts.length > 0 ? parts.join(", ") : "—";
}

function SampledTraceIds({ traceIds }: { traceIds: string[] | null | undefined }) {
  if (!traceIds || traceIds.length === 0) {
    return <Box sx={{ typography: "caption", color: "text.secondary" }}>no sampled traces</Box>;
  }
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }} data-testid="fit-sampled-traces">
      {traceIds.map((traceId) => (
        <Box key={traceId} component="span" sx={{ fontFamily: "monospace", typography: "caption", color: "text.secondary", userSelect: "all" }}>
          {traceId}
        </Box>
      ))}
    </Box>
  );
}

const FALLBACK_DIAGNOSTIC_LABELS: Record<string, string> = {
  finish_reason: "Finish reason",
  output_tokens: "Output tokens",
  estimated_tokens: "Estimated tokens",
  max_output_tokens: "Max output tokens",
  candidate_count: "Candidate count",
  error_class: "Error class",
  model_id: "Model",
  provider: "Provider",
};

function fallbackDiagnosticItems(diagnostic: Record<string, unknown>): ProvenanceItem[] {
  return Object.keys(FALLBACK_DIAGNOSTIC_LABELS)
    .filter((key) => key in diagnostic)
    .map((key) => {
      const value = diagnostic[key];
      return { label: FALLBACK_DIAGNOSTIC_LABELS[key], value: value == null ? "—" : String(value) };
    });
}

function FitFallbackDiagnosticBlock({ diagnostic }: { diagnostic: Record<string, unknown> | null | undefined }) {
  if (!diagnostic) return null;
  const items = fallbackDiagnosticItems(diagnostic);
  if (items.length === 0) return null;

  return (
    <Box data-testid="fit-fallback-diagnostic">
      <Box sx={{ typography: "overline", color: "text.secondary" }}>Fallback diagnostic</Box>
      <ProvenanceDl items={items} columns={3} />
    </Box>
  );
}

/** Drill-through detail — no query, `decision` already carries every field
 *  (fixtures are pre-populated with the full detail shape). */
function FitDecisionDetailPanel({ decision }: { decision: FitDecisionDetailOut }) {
  const items: ProvenanceItem[] = [
    { label: "Model", value: decision.modelId ?? "—" },
    { label: "Prompt version", value: decision.fitterPromptVersion ?? "—" },
    { label: "Config version", value: decision.configVersion ?? "—" },
    { label: "Input hash", value: decision.inputHash ?? "—" },
    { label: "Run", value: decision.runId ?? "—" },
    { label: "Token usage", value: formatTokenUsage(decision.tokenUsage) },
  ];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }} data-testid="fit-decision-detail">
      <ProvenanceDl items={items} columns={3} />

      {decision.rationale ? (
        <Typography variant="body2" color="text.secondary" data-testid="fit-decision-detail-rationale">
          {decision.rationale}
        </Typography>
      ) : null}

      <FitFallbackDiagnosticBlock diagnostic={decision.fallbackDiagnostic} />

      <Box>
        <Box sx={{ typography: "overline", color: "text.secondary" }}>Detected signals</Box>
        <Box sx={{ typography: "caption" }} data-testid="fit-decision-detail-signals">
          {decision.detectedSignals && decision.detectedSignals.length > 0 ? decision.detectedSignals.join(", ") : "—"}
        </Box>
      </Box>

      {decision.perCandidate && decision.perCandidate.length > 0 ? (
        <PerCandidateList candidates={decision.perCandidate as Record<string, unknown>[]} />
      ) : null}

      <Box>
        <Box sx={{ typography: "overline", color: "text.secondary" }}>Sampled traces</Box>
        <SampledTraceIds traceIds={decision.sampledTraceIds} />
      </Box>
    </Box>
  );
}

function FitHistoryRow({ decision }: { decision: FitDecisionDetailOut }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Accordion
      expanded={expanded}
      onChange={(_e, isExpanded) => setExpanded(isExpanded)}
      disableGutters
      elevation={0}
      square
      data-testid={`fit-history-row-${decision.id}`}
      sx={{ "&:before": { display: "none" }, border: 1, borderColor: "divider", borderRadius: 1, "&.Mui-expanded": { margin: 0 } }}
    >
      <AccordionSummary expandIcon={<IconMaterialSymbolsKeyboardArrowDown fontSize="small" />} data-testid={`fit-history-row-toggle-${decision.id}`}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", typography: "body2", width: "100%", pr: 1 }}>
          <Chip tint={decision.fitMethod === "llm" ? "info" : "muted"}>{decision.fitMethod}</Chip>
          <Chip tint={outcomeTint(decision.outcome)}>{fitOutcome(decision.outcome)}</Chip>
          <Box component="span"><ProfileLabel id={decision.chosenProfileVersionId} /></Box>
          <Box component="span" sx={{ color: "text.secondary" }}>{readableName(decision.trigger)}</Box>
          {decision.fallbackReason ? (
            <Chip tint={fallbackClassTint(decision.fallbackClass)} data-testid={`fit-history-fallback-${decision.id}`}>
              {decision.fallbackReason}
              {decision.fallbackClass ? ` · ${FALLBACK_CLASS_LABELS[decision.fallbackClass]}` : ""}
            </Chip>
          ) : null}
          <Box component="span" sx={{ color: "text.secondary", ml: "auto" }}>
            {new Date(decision.createdAt).toLocaleString()}
          </Box>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <FitDecisionDetailPanel decision={decision} />
      </AccordionDetails>
    </Accordion>
  );
}

function FitHistorySection({ history }: { history: FitDecisionDetailOut[] }) {
  const [open, setOpen] = useState(false);
  if (history.length === 0) return <Typography variant="body2" color="text.secondary">No selection history yet.</Typography>;

  return (
    <Box data-testid="fit-history-section">
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <Box sx={{ typography: "h6" }}>Selection history</Box>
        <IconButton
          size="small"
          aria-label="Toggle fit history"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          data-testid="fit-history-toggle"
        >
          <IconMaterialSymbolsKeyboardArrowDown fontSize="small" sx={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 150ms" }} />
        </IconButton>
      </Box>
      <Collapse in={open} unmountOnExit>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75, mt: 0.5 }} data-testid="fit-history-list">
          {history.map((d) => (
            <FitHistoryRow key={d.id} decision={d} />
          ))}
        </Box>
      </Collapse>
    </Box>
  );
}

function FitProvenancePanel({ latest }: { latest: FitDecisionOut | null }) {
  if (!latest) {
    return (
      <EmptyState
        icon={IconMaterialSymbolsSpeed}
        title="No fit decisions yet"
        description="This agent hasn't been through an auto-fit or re-fit yet."
        testId="fit-provenance-empty"
      />
    );
  }

  const items: ProvenanceItem[] = [
    { label: "Method", value: <Chip tint={latest.fitMethod === "llm" ? "info" : "muted"}>{latest.fitMethod}</Chip> },
    { label: "Outcome", value: <Chip tint={outcomeTint(latest.outcome)}>{fitOutcome(latest.outcome)}</Chip> },
    { label: "Confidence", value: latest.confidence != null ? formatConfidencePercent(latest.confidence) : "—" },
    { label: "Chosen profile", value: <ProfileLabel id={latest.chosenProfileVersionId} /> },
    { label: "Trigger", value: latest.trigger },
    { label: "Timestamp", value: new Date(latest.createdAt).toLocaleString() },
  ];

  const showShadow =
    latest.shadowHeuristicProfileVersionId != null &&
    latest.shadowHeuristicProfileVersionId !== latest.chosenProfileVersionId;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }} data-testid="fit-provenance-panel">
      <Typography variant="h6">Why this profile</Typography>
      {latest.rationale ? <Typography variant="body1" sx={{ maxWidth: "85ch", lineHeight: 1.7, overflowWrap: "anywhere" }} data-testid="profile-reason-preview">{latest.rationale.length > 240 ? `${latest.rationale.slice(0, 240)}…` : latest.rationale}</Typography> : <Typography variant="body2" color="text.secondary">No selection explanation recorded.</Typography>}
      <Box sx={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        <Box><Typography variant="subtitle2">Selection confidence</Typography><Typography variant="h5">{latest.confidence != null ? formatConfidencePercent(latest.confidence) : "Not recorded"}</Typography><Typography variant="caption" color="text.secondary">Confidence reported by the profile fitter</Typography></Box>
      </Box>
      <Accordion disableGutters elevation={0}>
        <AccordionSummary expandIcon={<IconMaterialSymbolsKeyboardArrowDown fontSize="small" />} data-testid="profile-selection-reasoning"><Typography variant="subtitle2">View selection reasoning and candidate comparison</Typography></AccordionSummary>
        <AccordionDetails>
      <ProvenanceDl items={items} columns={3} />

      {latest.outcome === "fallback" ? (
        <Chip tint={fallbackClassTint(latest.fallbackClass)} data-testid="fit-fallback-reason">
          Fallback: {latest.fallbackReason ?? "unknown"}
          {latest.fallbackClass ? ` · ${FALLBACK_CLASS_LABELS[latest.fallbackClass]}` : ""}
        </Chip>
      ) : null}

      {latest.rationale ? (
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: "85ch", lineHeight: 1.7, my: 2, overflowWrap: "anywhere" }} data-testid="fit-rationale">
          {latest.rationale}
        </Typography>
      ) : null}

      {showShadow ? (
        <Box sx={{ typography: "caption", color: "text.secondary" }} data-testid="fit-shadow-divergence">
          Shadow heuristic would have chosen {latest.shadowHeuristicProfileVersionId}.
        </Box>
      ) : null}

      {latest.perCandidate && latest.perCandidate.length > 0 ? (
        <PerCandidateList candidates={latest.perCandidate as Record<string, unknown>[]} />
      ) : null}

        </AccordionDetails>
      </Accordion>
    </Box>
  );
}

function DimensionEntries({
  dimensionSlug,
  weight,
  entries,
}: {
  dimensionSlug: string;
  weight: unknown;
  entries: ProfileEntryOut[];
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Box
      sx={(theme) => ({ display: "flex", flexDirection: "column", gap: 0.75, borderRadius: 1, border: 1, borderColor: alpha(theme.palette.divider, 0.6), px: 1.5, py: 1 })}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box component="span" sx={{ typography: "caption", fontWeight: 500 }}>{readableName(dimensionSlug)}</Box>
        {weight != null ? <Chip tint="outline">Dimension weight: {String(weight)}</Chip> : <Chip tint="warning">unweighted</Chip>}
      </Box>
      <Box sx={{ overflowX: "auto" }}><Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ typography: "subtitle2" }}>Evaluation</TableCell>
            <TableCell sx={{ width: 80, textAlign: "right", typography: "subtitle2" }}>Threshold</TableCell>
            <TableCell sx={{ width: 80, textAlign: "right", typography: "subtitle2" }}>Weight</TableCell>
            <TableCell sx={{ width: 96, typography: "subtitle2" }}>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {(expanded ? entries : entries.slice(0, 4)).map((entry) => (
            <TableRow key={entry.evalVersionId}>
              <TableCell><Box component="span" sx={{ fontFamily: "monospace", typography: "caption" }}>{readableName(entry.evalSlug)}</Box></TableCell>
              <TableCell sx={{ textAlign: "right", fontFamily: "monospace", typography: "caption" }}>{entry.threshold}</TableCell>
              <TableCell sx={{ textAlign: "right", fontFamily: "monospace", typography: "caption" }}>{entry.weight}</TableCell>
              <TableCell>{entry.enabled ? <Chip tint="success">Enabled</Chip> : <Chip tint="muted">Disabled</Chip>}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table></Box>
      {entries.length > 4 ? <Button onClick={() => setExpanded((value) => !value)} aria-expanded={expanded} data-testid={`profile-evaluations-toggle-${dimensionSlug}`} sx={{ alignSelf: "flex-start" }}>{expanded ? "Show fewer evaluations" : `Show all ${entries.length} evaluations`}</Button> : null}
    </Box>
  );
}

export function ProfileVersionSelect({
  currentVersionId,
  currentLabel,
  extraVersions = [],
  disabled,
  onSelect,
}: {
  currentVersionId: string;
  currentLabel: string;
  extraVersions?: { id: string; label: string }[];
  disabled?: boolean;
  onSelect: (profileVersionId: string) => void;
}) {
  return (
    <Select
      size="small"
      value={currentVersionId}
      onChange={(e) => onSelect(e.target.value)}
      disabled={disabled}
      SelectDisplayProps={{ "aria-label": "Profile version", "data-testid": "profile-version-select" } as HTMLAttributes<HTMLDivElement>}
      sx={{ width: 176 }}
    >
      <MenuItem value={currentVersionId} data-testid={`profile-version-option-${currentVersionId}`}>{currentLabel}</MenuItem>
      {extraVersions.filter((v) => v.id !== currentVersionId).map((v) => (
        <MenuItem key={v.id} value={v.id} data-testid={`profile-version-option-${v.id}`}>{v.label}</MenuItem>
      ))}
    </Select>
  );
}
