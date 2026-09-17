/** Agent Card tab (spec `agent-card` §3.1 Features 2/3, §3.2, §3.5, §4.6,
 * §6.6) — a top-level agent tab landing between Score and Traces
 * Not a sub-tab of Scoring.
 *
 * The fetch / poll / regenerate shell around `AgentCardView`: this module
 * owns `cardQueryOptions` for the latest `agent_cards` row, `regenerateCard`
 * for the manual Regenerate action, the asynchronous regeneration poll, and
 * every state that reads the LLM-pipeline metadata the customer app never
 * sees — `cardPromptVersion`, `modelId`, `fitDecisionId`, `sampledTraceIds`,
 * `fallbackReason`, `generationSource`. The card's observed/inferred body is
 * shared with the customer app and lives in
 * `shared/components/agent-card-view.tsx`.
 */
import { useState } from "react";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import IconMaterialSymbolsKeyboardArrowDown from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsKeyboardArrowDown.mjs";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import { alpha } from "@mui/material/styles";
import IconMaterialSymbolsError from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsError.mjs";
import IconMaterialSymbolsRefresh from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsRefresh.mjs";
import IconMaterialSymbolsSmartToy from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsSmartToy.mjs";
import IconMaterialSymbolsWarning from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsWarning.mjs";
import { toast } from "@/shared/lib/toast";

import {
  asCardPayload,
  formatDate,
  formatPercent,
  MONO,
  type CardObserved,
} from "@/shared/components/agent-card-payload";
import { AgentCardView } from "@/shared/components/agent-card-view";
import { Chip } from "@/shared/components/chip";
import { EmptyState } from "@/shared/components/empty-state";
import { Eyebrow } from "@/shared/components/eyebrow";
import { ProvenanceDl, type ProvenanceItem } from "@/shared/components/provenance-dl";

// ---------------------------------------------------------------------------
// Fake data (no backend) — mirrors the real `AgentCardOut` shape exactly, one
// row per demo agent. Regenerate below just re-derives from this same fixture
// after a simulated delay; there is no worker job behind it.
// ---------------------------------------------------------------------------

export interface AgentCardOut {
  id: string;
  createdAt: string;
  generationSource: "auto" | "manual";
  generationStatus: "ok" | "failed" | "skipped_insufficient_evidence";
  cardPromptVersion: string;
  modelId?: string | null;
  fitDecisionId?: string | null;
  fitJobId?: string | null;
  fallbackReason?: string | null;
  sampledTraceIds?: string[] | null;
  payload?: Record<string, unknown> | null;
}

const ATA_REGRESSION_PAYLOAD = {
  agent_name: "ATA Regression Suite",
  observed: {
    window: { start: "2026-09-09T00:00:00Z", end: "2026-09-16T00:00:00Z", trace_count: 148 },
    tools: [
      { name: "run_test_suite", call_count: 84, success_rate: 0.94, origin: "mcp" },
      { name: "get_test_results", call_count: 60, success_rate: 0.99, origin: "mcp" },
      { name: "generate_test_case", call_count: 22, success_rate: 0.86, origin: "mcp" },
      { name: "compare_baselines", call_count: 15, success_rate: 1, origin: "mcp" },
    ],
    tool_schemas: [
      {
        tool_name: "run_test_suite",
        observed_from_n_calls: 84,
        input_fields: [
          { key: "suite", presence: "always" },
          { key: "timeout", presence: "sometimes" },
          { key: "filter", presence: "sometimes" },
        ],
        output_fields: [
          { key: "status", presence: "always" },
          { key: "passed", presence: "always" },
          { key: "failed", presence: "always" },
        ],
      },
    ],
    behavioral_sequences: [
      { pattern: "run_test_suite → get_test_results → generate_test_case", occurrences: 34, total: 84 },
      { pattern: "run_test_suite → compare_baselines", occurrences: 15, total: 84 },
    ],
    operational_stats: {
      latency_ms: { p50: 820, p90: 2400 },
      tokens: { p50: 1200, p90: 3100 },
      cost_usd: { p50: 0.008, p90: 0.021 },
    },
    example_trace: {
      trace_id: "trace-9f21ac",
      snapshot: { scenario: "Full regression – payment workflow", verdict: "REVIEW" },
    },
    fit_context: { chosen_profile: "ATA Regression Profile", confidence: 0.91, evaluated_under: "ATA Regression Profile v3" },
  },
  inferred: {
    purpose: "Runs the ATA regression suite against each release candidate, triages failing cases, and drafts new edge-case tests for gaps it finds.",
    tool_descriptions: {
      run_test_suite: "Executes the named regression suite and returns pass/fail per case.",
      get_test_results: "Fetches structured results for a prior run.",
      generate_test_case: "Drafts a new test case targeting an observed gap.",
      compare_baselines: "Diffs the current run against the last known-good baseline.",
    },
    behavioral_patterns: [
      "Runs the full suite before narrowing into a single failing case.",
      "Cross-checks flaky failures against the last two runs before flagging.",
    ],
    success_criteria: [
      "Every case in the targeted suite reaches a pass/fail verdict.",
      "New edge-case tests compile and run without manual fixup.",
    ],
    failure_modes: [
      "Occasionally reruns a suite that just ran, wasting a cycle, when result caching lags.",
      "Can miscategorize a flaky timeout as a hard failure under load.",
    ],
  },
};

function genericPayload(agentName: string, purpose: string) {
  return {
    agent_name: agentName,
    observed: {
      window: { start: "2026-09-09T00:00:00Z", end: "2026-09-16T00:00:00Z", trace_count: 62 },
      tools: [{ name: "primary_tool", call_count: 40, success_rate: 0.95, origin: "mcp" }],
      tool_schemas: [],
      behavioral_sequences: [{ pattern: "primary_tool → respond", occurrences: 30, total: 40 }],
      operational_stats: {
        latency_ms: { p50: 650, p90: 1800 },
        tokens: { p50: 900, p90: 2200 },
        cost_usd: { p50: 0.005, p90: 0.014 },
      },
      example_trace: null,
      fit_context: { chosen_profile: null, confidence: null, evaluated_under: null },
    },
    inferred: {
      purpose,
      tool_descriptions: {},
      behavioral_patterns: [],
      success_criteria: [],
      failure_modes: [],
    },
  };
}

const FAKE_CARDS: Record<string, AgentCardOut | null> = {
  "agent-1": {
    id: "card-agent-1-3",
    createdAt: "2026-09-15T02:00:00Z",
    generationSource: "auto",
    generationStatus: "ok",
    cardPromptVersion: "card-v2",
    modelId: "claude-sonnet-4-6",
    fitDecisionId: "fit-8841",
    fitJobId: "job-2291",
    sampledTraceIds: ["trace-9f21ac", "trace-7ab310"],
    payload: ATA_REGRESSION_PAYLOAD,
  },
  "agent-2": {
    id: "card-agent-2-1",
    createdAt: "2026-09-12T04:00:00Z",
    generationSource: "auto",
    generationStatus: "ok",
    cardPromptVersion: "card-v2",
    modelId: "claude-sonnet-4-6",
    fitDecisionId: "fit-5510",
    sampledTraceIds: ["trace-jira-1"],
    payload: genericPayload("jira epic poller", "Polls Jira for new epics and files a summarized ticket into the intake queue."),
  },
  "agent-3": {
    id: "card-agent-3-1",
    createdAt: "2026-09-10T04:00:00Z",
    generationSource: "auto",
    generationStatus: "ok",
    cardPromptVersion: "card-v2",
    modelId: "claude-haiku-4-5",
    fitDecisionId: "fit-3302",
    payload: genericPayload("invoice-reconciler", "Matches incoming invoices against purchase orders and flags mismatches for review."),
  },
  "agent-4": {
    id: "card-agent-4-2",
    createdAt: "2026-09-14T04:00:00Z",
    generationSource: "manual",
    generationStatus: "failed",
    cardPromptVersion: "card-v2",
    modelId: "claude-sonnet-4-6",
    fallbackReason: "judge call timed out after 2 retries",
    payload: null,
  },
  // agent-5 "code-review-assistant" is still provisioning — no card yet.
  "agent-5": null,
};

const DEFAULT_CARD: AgentCardOut = FAKE_CARDS["agent-2"]!;

// ---------------------------------------------------------------------------
// Header — title + generation-source/status chips + Regenerate. Rendered
// across every state (spec §3.2 story 3 — Regenerate is always available,
// including on a never-generated agent, to build the first card on demand).
// ---------------------------------------------------------------------------

function StatusChip({ status }: { status: AgentCardOut["generationStatus"] }) {
  if (status === "ok") return <Chip tint="success">generated</Chip>;
  if (status === "failed") return <Chip tint="destructive">generation failed</Chip>;
  return <Chip tint="muted">skipped · insufficient evidence</Chip>;
}

function CardHeader({
  card,
  onRegenerate,
  regenerating,
}: {
  card: AgentCardOut | null;
  onRegenerate: () => void;
  regenerating: boolean;
}) {
  return (
    <Card variant="outlined" sx={{ boxShadow: "none" }}>
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box sx={{ typography: "h5" }}>Agent Card</Box>
              {card ? <Chip tint="muted">{card.generationSource === "auto" ? "Automatically generated" : "Manually requested"}</Chip> : null}
              {card ? <StatusChip status={card.generationStatus} /> : null}
            </Box>
            <Box sx={{ typography: "caption", color: "text.secondary", mt: 0.5 }}>
              {card
                ? `A snapshot based on captured interactions · Generated ${new Date(card.createdAt).toLocaleString()}`
                : "A snapshot of this agent, based on captured interactions."}
            </Box>
          </Box>
          <Button
            variant={card?.generationStatus === "failed" ? "contained" : "outlined"}
            size="small"
            onClick={onRegenerate}
            disabled={regenerating}
            startIcon={<IconMaterialSymbolsRefresh />}
            data-testid="agent-card-regenerate"
          >
            {regenerating ? "Generating…" : "Regenerate card"}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// State bodies
// ---------------------------------------------------------------------------

function NoCardState() {
  return (
    <Card variant="outlined" sx={{ boxShadow: "none" }}>
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <EmptyState
          icon={IconMaterialSymbolsSmartToy}
          title="No agent card yet"
          description="This agent hasn't been through a full-fidelity profile-fit yet. A card is generated automatically on the next fit, or you can build one now from the latest fit's evidence."
          testId="agent-card-empty"
        />
      </CardContent>
    </Card>
  );
}

function SkippedState() {
  return (
    <Card data-testid="agent-card-skipped">
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <EmptyState
          icon={IconMaterialSymbolsWarning}
          title="Card unavailable — insufficient-fidelity evidence"
          description="The most recent fit ran on reduced/over-budget evidence (raw tool I/O was dropped under the token cap), so a card wasn't generated. A card will be produced on the next full-evidence fit."
        />
        <Box
          sx={(t) => ({
            mt: 1.5,
            border: "1px dashed",
            borderColor: alpha(t.palette.divider, 1),
            borderRadius: 1,
            p: 1.25,
            typography: "caption",
            color: "text.secondary",
            bgcolor: t.palette.action.hover,
          })}
        >
          Regenerate reuses the latest fit&apos;s evidence — it will also skip
          (422) while that evidence is insufficient.
        </Box>
      </CardContent>
    </Card>
  );
}

function FailedState({ card }: { card: AgentCardOut }) {
  const reason = card.fallbackReason ?? "unknown error";
  return (
    <Card data-testid="agent-card-failed">
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Alert severity="error" icon={<IconMaterialSymbolsError />}>
          <AlertTitle>Card generation failed</AlertTitle>
          <Box data-testid="agent-card-failed-message">
            Card generation failed: {reason}.
          </Box>
          <Box sx={{ mt: 0.5 }}>
            The agent&apos;s <b>profile-fit decision was unaffected</b> and
            remains adopted; only the card is missing. Retry with Regenerate.
          </Box>
        </Alert>
        <Box sx={{ mt: 1.5 }}>
          <Eyebrow>Provenance (last attempt)</Eyebrow>
        </Box>
        <Box sx={{ typography: "caption", color: "text.secondary", mt: 0.5 }}>
          Model{" "}
          <Box component="span" sx={{ fontFamily: MONO }}>
            {card.modelId ?? "—"}
          </Box>{" "}
          · card {card.cardPromptVersion} · fit decision{" "}
          <Box component="span" sx={{ fontFamily: MONO }}>
            {card.fitDecisionId ?? "—"}
          </Box>{" "}
          · {new Date(card.createdAt).toLocaleString()}
        </Box>
      </CardContent>
    </Card>
  );
}

function ProvenanceFooter({
  card,
  observed,
}: {
  card: AgentCardOut;
  observed: CardObserved;
}) {
  const items: ProvenanceItem[] = [
    { label: "Model", value: <Box sx={{ fontFamily: MONO }}>{card.modelId ?? "—"}</Box> },
    {
      label: "Prompt version",
      value: <Box sx={{ fontFamily: MONO }}>{card.cardPromptVersion}</Box>,
    },
    {
      label: "Fit decision",
      value: <Box sx={{ fontFamily: MONO }}>{card.fitDecisionId ?? "—"}</Box>,
    },
    {
      label: "Window",
      value: `${formatDate(observed.window.start)} – ${formatDate(observed.window.end)} · ${observed.window.trace_count} traces`,
    },
    {
      label: "Evaluated under",
      value:
        observed.fit_context.evaluated_under != null
          ? `${observed.fit_context.evaluated_under}${
              observed.fit_context.confidence != null
                ? ` · conf ${formatPercent(observed.fit_context.confidence)}`
                : ""
            }`
          : "—",
    },
  ];

  return (
    <Accordion disableGutters elevation={0} sx={{ border: 1, borderColor: "divider", borderRadius: 1, "&:before": { display: "none" } }}>
      <AccordionSummary expandIcon={<IconMaterialSymbolsKeyboardArrowDown fontSize="small" />} data-testid="agent-card-source-details"><Box sx={{ typography: "h6" }}>Sources and generation details</Box></AccordionSummary>
      <AccordionDetails sx={{ overflowWrap: "anywhere" }}>
        <ProvenanceDl items={items} columns={3} />
        {card.sampledTraceIds && card.sampledTraceIds.length > 0 ? (
          <Box sx={{ mt: 2 }}>
            <Eyebrow>Sampled traces</Eyebrow>
            <Box
              sx={{ typography: "caption", color: "text.secondary", fontFamily: MONO, mt: 0.5 }}
              data-testid="agent-card-sampled-traces"
            >
              {card.sampledTraceIds.join("   ")}
            </Box>
          </Box>
        ) : null}
      </AccordionDetails>
    </Accordion>
  );
}

function OkState({ card }: { card: AgentCardOut }) {
  const payload = asCardPayload(card.payload);
  return (
    <>
      <AgentCardView
        key={card.id}
        payload={card.payload}
        generationStatus={card.generationStatus}
        createdAt={card.createdAt}
        payloadMissingHint="Regenerate to rebuild it."
      />
      {payload ? <ProvenanceFooter card={card} observed={payload.observed} /> : null}
    </>
  );
}

// ---------------------------------------------------------------------------
// Tab entry point
// ---------------------------------------------------------------------------

export function AgentCardTab({
  agentId,
}: {
  tenantId: string;
  agentId: string;
}) {
  const [card, setCard] = useState<AgentCardOut | null>(() => FAKE_CARDS[agentId] ?? DEFAULT_CARD);
  const [waiting, setWaiting] = useState(false);
  const [gaveUpWaiting] = useState(false);

  function handleRegenerate() {
    setWaiting(true);
    setTimeout(() => {
      setCard((prev) => ({
        ...(prev ?? DEFAULT_CARD),
        id: `card-${agentId}-${Date.now()}`,
        createdAt: new Date().toISOString(),
        generationSource: "manual",
        generationStatus: "ok",
        payload: (prev ?? DEFAULT_CARD).payload ?? ATA_REGRESSION_PAYLOAD,
      }));
      setWaiting(false);
      toast.success("Agent card regenerated.");
    }, 1200);
  }

  return (
    <Stack spacing={3} sx={{ maxWidth: 1200, width: "100%" }}>
      <CardHeader
        card={card}
        onRegenerate={handleRegenerate}
        regenerating={waiting}
      />
      {waiting ? (
        <Alert severity="info" data-testid="agent-card-regenerating">
          <AlertTitle>Generating the agent card</AlertTitle>
          The card is drafted by a language model on a background worker and
          usually takes about a minute. This page updates itself when it lands —
          you can leave and come back.
        </Alert>
      ) : null}
      {gaveUpWaiting ? (
        <Alert severity="warning" data-testid="agent-card-regenerate-timeout">
          <AlertTitle>Still generating</AlertTitle>
          The card has not landed yet. It may still be queued behind other work —
          reload this page to check again.
        </Alert>
      ) : null}
      {card === null ? (
        <NoCardState />
      ) : card.generationStatus === "skipped_insufficient_evidence" ? (
        <SkippedState />
      ) : card.generationStatus === "failed" ? (
        <FailedState card={card} />
      ) : (
        <OkState card={card} />
      )}
    </Stack>
  );
}
