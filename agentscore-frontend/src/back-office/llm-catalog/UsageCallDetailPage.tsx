/** UsageCallDetailPage — one LLM call's full ledger row + payload, at
 * `/llm-catalog/usage/$callId`.
 *
 * Replaces the 460px right-anchored drawer this content used to live in. The
 * drawer rendered five of the ledger row's fields and dropped the rest; a page
 * has room for every field the row already carries — the attribution ids, the
 * provider's request id, the queue wait the summary reports a p50 for, the
 * reasoning/cache token split, and the schema path — plus prompt and response
 * text in something wider than a three-word column.
 *
 * `EntityShell` + a breadcrumb back to the Usage log tab, matching every other
 * entity detail page (`LLMInferenceEditPage` in this folder is the exemplar). The tab
 * keeps its filters in component state, as every other list page here does, so
 * navigating back lands on the tab's default window rather than the filtered
 * view the row was clicked from.
 *
 * Renders all six wire `state` values, each distinguishable from the others —
 * collapsing any two is a defect (`PAYLOAD_STATE_COPY` below, and
 * `llm-catalog-usage-call-detail.test.tsx` for the pairwise-distinctness assertion).
 * Truncation is a flag on the *captured* state, not a state of its own.
 *
 * Both queries are pinned to the path param and never poll: a ledger row is
 * written once and never mutated, while a payload is immutable only *until
 * blanked* by expiry or a purge — `api.ts`'s `usagePayloadQueryOptions` carries
 * why that one must not cache beyond the mount.
 */

import { Link, useParams, useSearch } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Button from "@mui/material/Button";
import MuiLink from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import BreadcrumbsItem from "@tricentis/aura/components/BreadcrumbsItem.js";

import {
  formatUsageCost,
  formatUsageLatencyMs,
  formatUsageTokens,
} from "@/back-office/llm-catalog/usage-format";
import {
  getUsagePayload,
  getUsageRow,
  type FakeUsagePayload,
  type FakeUsageRow,
} from "@/back-office/llm-catalog/usage-pricing-fixtures";
import { Chip } from "@/shared/components/chip";
import { CodeBlock } from "@/shared/components/code-block";
import { EntityShell } from "@/shared/components/entity-shell";
import { FormSection } from "@/shared/components/form-section";
import { NotFoundState } from "@/shared/components/not-found-state";
import type { UsageViewSearch } from "@/back-office/llm-catalog/usage-view-params";
import { ProvenanceDl, type ProvenanceItem } from "@/shared/components/provenance-dl";

type LlmUsagePayloadOut = FakeUsagePayload;
type LlmUsageRowOut = FakeUsageRow;

type PayloadState = LlmUsagePayloadOut["state"];

const STATE_TINT: Record<
  PayloadState,
  "success" | "muted" | "warning" | "destructive"
> = {
  captured: "success",
  nothing_to_capture: "muted",
  redaction_failed: "warning",
  expired: "muted",
  purged: "destructive",
  never_captured: "muted",
};

/** One label + description per wire state — exported so the test suite can
 *  assert the six descriptions are pairwise distinct (mechanically, not by
 *  eyeballing six separate `getByText` calls). HMR fast-refresh of this
 *  module is irrelevant, so the react-refresh mixed-export hint doesn't apply
 *  (mirrors `page-band.tsx`'s `pageBandSx`). */
// eslint-disable-next-line react-refresh/only-export-components
export const PAYLOAD_STATE_COPY: Record<
  PayloadState,
  { label: string; description: string }
> = {
  captured: {
    label: "Captured",
    description: "This call's prompt and/or response text was captured.",
  },
  nothing_to_capture: {
    label: "Nothing to capture",
    // Deliberately does NOT say "a successful probe". This state is reached by
    // any call with no text at all, and a FAILED one lands here whenever the
    // failure produced no provider message — a Bedrock `NoCredentialsError`
    // never reaches the provider, so there is no prose to store. Describing
    // those rows as successful misreports the outcome in an audit log, beside
    // the row's own "failure" outcome and failure code.
    description:
      "This call recorded no prompt or response text — a connectivity probe, or a failure that returned no provider message.",
  },
  redaction_failed: {
    label: "Redaction failed",
    description:
      "This call's text was captured but could not be sanitized safely, so it was never stored.",
  },
  expired: {
    label: "Expired",
    description:
      "This payload's text aged out under the retention window and was cleared.",
  },
  purged: {
    label: "Purged",
    description: "This payload's text was deleted on request.",
  },
  never_captured: {
    label: "Never captured",
    description:
      "This call predates payload capture — no payload row was ever recorded for it.",
  },
};

/** Monospace value for an id-shaped field; `null` renders as an explicit
 *  em-dash so an absent id never reads as a blank cell. */
function Id({ value }: { value: string | null }) {
  if (value == null) {
    return (
      <Box component="span" sx={{ color: "text.secondary" }}>
        —
      </Box>
    );
  }
  return (
    <Box
      component="span"
      sx={{ fontFamily: "monospace", typography: "body2", wordBreak: "break-all" }}
    >
      {value}
    </Box>
  );
}

/** The initiating agent. The Usage log's Agent column resolves ids to names, so
 *  landing here on a bare uuid right after clicking a row that read
 *  "checkout-copilot" would take the same operator backwards in one click.
 *
 *  The id stays on screen — this is an audit record and the id is the precise
 *  fact — but it links through to the agent, which is one click to the name and
 *  costs no extra request (labelling it here would mean fetching an agent list
 *  to name a single row). `tenantName` on the ledger row holds the tenant
 *  **id**, which is exactly the `$tenantId` the agent route expects; with no
 *  tenant there is no route to build, so the id renders plain rather than as a
 *  dead link.
 *
 *  An em-dash for a null agent — the app-wide convention for an absent value,
 *  matching the Usage log's Agent column and every other id field on this page.
 *
 *  All three branches carry the same `usage-call-agent` hook, so a test (or an
 *  operator's eye) can find the agent value without knowing which branch it took;
 *  whether it linked is then read off the element itself. */
const AGENT_VALUE_TEST_ID = "usage-call-agent";

function AgentValue({
  agentId,
  tenantId,
}: {
  agentId: string | null;
  tenantId: string | null;
}) {
  if (agentId == null) {
    return (
      <Box
        component="span"
        data-testid={AGENT_VALUE_TEST_ID}
        sx={{ color: "text.secondary" }}
      >
        —
      </Box>
    );
  }
  if (tenantId == null) {
    return (
      <Box
        component="span"
        data-testid={AGENT_VALUE_TEST_ID}
        sx={{
          fontFamily: "monospace",
          typography: "body2",
          wordBreak: "break-all",
        }}
      >
        {agentId}
      </Box>
    );
  }
  return (
    <MuiLink
      component={Link}
      to="/tenants/$tenantId/agents/$agentId"
      params={{ tenantId, agentId } as never}
      data-testid={AGENT_VALUE_TEST_ID}
      sx={{
        fontFamily: "monospace",
        typography: "body2",
        wordBreak: "break-all",
      }}
    >
      {agentId}
    </MuiLink>
  );
}

const TRACE_VALUE_TEST_ID = "usage-trace-id";

/** The trace this call judged, linked to its detail page when — and only when —
 *  every part of that route is in hand.
 *
 *  The route is `/tenants/$tenantId/agents/$agentId/traces/$traceId` AND it
 *  needs `?timestamp=` to pick a store partition: without one the trace page
 *  renders an error and never issues a request. So a link is offered only with
 *  all four values, and the id renders as plain text otherwise — a link that
 *  lands on an error page is worse than no link, because the reader cannot tell
 *  a missing timestamp from a missing trace.
 *
 *  `trace_ts` comes from the run's scoring task and goes null once the run is
 *  pruned, so old rows degrade to text on their own.
 */
function TraceValue({
  traceId,
  traceTs,
  agentId,
  tenantId,
}: {
  traceId: string | null;
  traceTs: string | null;
  agentId: string | null;
  tenantId: string | null;
}) {
  if (traceId == null) {
    return (
      <Box
        component="span"
        data-testid={TRACE_VALUE_TEST_ID}
        sx={{ color: "text.secondary" }}
      >
        —
      </Box>
    );
  }
  const linkable = traceTs != null && agentId != null && tenantId != null;
  if (!linkable) {
    return (
      <Box
        component="span"
        data-testid={TRACE_VALUE_TEST_ID}
        sx={{
          fontFamily: "monospace",
          typography: "body2",
          wordBreak: "break-all",
        }}
      >
        {traceId}
      </Box>
    );
  }
  return (
    <MuiLink
      component={Link}
      to="/tenants/$tenantId/agents/$agentId/traces/$traceId"
      params={{ tenantId, agentId, traceId } as never}
      search={{ timestamp: traceTs } as never}
      data-testid={TRACE_VALUE_TEST_ID}
      sx={{
        fontFamily: "monospace",
        typography: "body2",
        wordBreak: "break-all",
      }}
    >
      {traceId}
    </MuiLink>
  );
}

/** The search that returns to the Usage log tab showing the same filtered view
 *  the row was clicked from. This route carries the list's view params
 *  (`usage-view-params.ts`) precisely so it can hand them back — the tab
 *  unmounted when this page rendered, so its state is gone and the URL is the
 *  only thing that remembers.
 *
 *  `as never`: MUI's `component` prop widens the router link's own props and
 *  drops TanStack's typed `to` → `search` dependency, so the search object has
 *  to be cast at each MUI-hosted link (same cast, same reason, as
 *  `RunDetailPage.tsx`). */
function useUsageLogSearch() {
  const view = useSearch({ strict: false }) as UsageViewSearch;
  return { tab: "usage", ...view } as never;
}

/** Back-to-list affordance for the not-found branch, so a bogus `callId` is
 *  never a dead end (the breadcrumb only renders once a row resolves). */
function BackToUsageLog() {
  const search = useUsageLogSearch();
  return (
    <Button
      component={Link}
      to="/llm-catalog"
      search={search}
      variant="outlined"
      data-testid="usage-call-not-found-back"
    >
      Back to Usage log
    </Button>
  );
}

function PayloadBody({ payload }: { payload: LlmUsagePayloadOut }) {
  const copy = PAYLOAD_STATE_COPY[payload.state];
  return (
    <Stack sx={{ gap: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Chip tint={STATE_TINT[payload.state]} data-testid="usage-payload-state">
          {copy.label}
        </Chip>
      </Box>
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        {copy.description}
      </Typography>

      {payload.state === "purged" && payload.purgeReason ? (
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          Reason: {payload.purgeReason}
        </Typography>
      ) : null}

      {payload.state === "captured" ? (
        <Stack sx={{ gap: 2 }}>
          {payload.promptText != null ? (
            <CodeBlock
              label={payload.promptTruncated ? "Prompt (truncated)" : "Prompt"}
              testId="usage-payload-prompt-copy"
            >
              {payload.promptText}
            </CodeBlock>
          ) : null}
          {payload.responseText != null ? (
            <CodeBlock
              label={payload.responseTruncated ? "Response (truncated)" : "Response"}
              testId="usage-payload-response-copy"
            >
              {payload.responseText}
            </CodeBlock>
          ) : null}
          {payload.providerErrorText != null ? (
            <CodeBlock label="Provider error" testId="usage-payload-error-copy">
              {payload.providerErrorText}
            </CodeBlock>
          ) : null}
        </Stack>
      ) : null}
    </Stack>
  );
}

/** The ledger row's own fields, grouped so each section answers one question:
 *  who the call belongs to, which model actually served it, and what it cost.
 *  Every non-derived column on `LlmUsageRowOut` appears in exactly one group —
 *  a field the row carries but no section renders is invisible to the audit,
 *  which is what the drawer did to nine of them. */
function RowSections({ row }: { row: LlmUsageRowOut }) {
  const attribution: ProvenanceItem[] = [
    { label: "Purpose", value: row.purpose },
    { label: "Created", value: new Date(row.createdAt).toLocaleString() },
    { label: "Outcome", value: row.failureCode ? "failure" : "success" },
    // The ledger's `tenantName` column holds a tenant **id**, not a name — the
    // list tab resolves it against the tenant picker for its Tenant column.
    // Resolving it here would mean fetching up to 200 tenants for one label, so
    // the id is labelled as an id rather than mislabelled as a name.
    { label: "Tenant id", value: <Id value={row.tenantName} /> },
    {
      label: "Agent",
      value: <AgentValue agentId={row.agentId} tenantId={row.tenantName} />,
    },
    { label: "Run id", value: <Id value={row.runId} /> },
    {
      label: "Trace",
      value: (
        <TraceValue
          traceId={row.traceId}
          traceTs={row.traceTs ?? null}
          agentId={row.agentId}
          tenantId={row.tenantName}
        />
      ),
      // Null for every purpose that is not a per-interaction scoring call, and
      // that is the honest answer rather than a gap: an agent card summarises a
      // SAMPLE of traces, guide generation and the connectivity probe read
      // none, and a preview runs against a request payload.
      hint: row.traceId
        ? undefined
        : "This call was not made about a single trace.",
    },
    { label: "Job id", value: <Id value={row.jobId} /> },
    { label: "Ledger row id", value: <Id value={row.id} /> },
  ];
  if (row.failureCode) {
    attribution.splice(3, 0, {
      label: "Failure code",
      value: <Id value={row.failureCode} />,
    });
  }

  const model: ProvenanceItem[] = [
    { label: "Provider", value: row.provider },
    { label: "Model requested", value: <Id value={row.modelId} /> },
    {
      label: "Model resolved",
      value: <Id value={row.modelIdResolved} />,
      // `modelDiffers` is the row's own comparison, not ours to recompute.
      hint: row.modelDiffers
        ? "Differs from the requested model — an alias or a provider-side substitution."
        : undefined,
    },
    {
      label: "Inference",
      value: row.inferenceName ?? <Id value={null} />,
      hint: row.inferenceId
        ? undefined
        : "No catalog row recorded for this call — either it predates the ledger storing one, or it was a connectivity probe against an unsaved form.",
      testId: "usage-inference-name",
    },
    { label: "Provider request id", value: <Id value={row.providerRequestId} /> },
    { label: "Schema path", value: <Id value={row.schemaPath} />, full: true },
  ];

  const cost: ProvenanceItem[] = [
    { label: "Input tokens", value: formatUsageTokens(row.inputTokens) },
    { label: "Output tokens", value: formatUsageTokens(row.outputTokens) },
    { label: "Reasoning tokens", value: formatUsageTokens(row.reasoningTokens) },
    { label: "Cache read tokens", value: formatUsageTokens(row.cacheReadTokens) },
    { label: "Cache write tokens", value: formatUsageTokens(row.cacheWriteTokens) },
    {
      label: "Cost",
      value: formatUsageCost(row.costUsd),
      testId: "usage-cost-total",
    },
    // The four components that sum to Cost above, formatted through the SAME
    // `formatUsageCost` the total uses — a null component renders "unpriced",
    // never "$0.00" and never a bare dash. A null component means this token
    // class had no rate on file, not that it was free; reusing the total's
    // own formatter is what keeps that word consistent between the two.
    {
      label: "Input cost",
      value: formatUsageCost(row.inputCostUsd),
      testId: "usage-cost-input",
    },
    {
      label: "Output cost",
      value: formatUsageCost(row.outputCostUsd),
      testId: "usage-cost-output",
    },
    {
      label: "Cache read cost",
      value: formatUsageCost(row.cacheReadCostUsd),
      testId: "usage-cost-cache-read",
    },
    {
      label: "Cache write cost",
      value: formatUsageCost(row.cacheWriteCostUsd),
      testId: "usage-cost-cache-write",
    },
    { label: "Latency", value: formatUsageLatencyMs(row.latencyMs) },
    {
      label: "Queue wait",
      value: formatUsageLatencyMs(row.queueWaitMs),
      hint: "Time spent waiting for a provider concurrency slot — excluded from Latency.",
    },
  ];

  return (
    <>
      <FormSection
        title="Call"
        description="What this call was for, when it ran, and the tenant, agent, run and job it is attributed to."
      >
        <ProvenanceDl items={attribution} columns={2} />
      </FormSection>

      <FormSection
        title="Model"
        description="The model the caller asked for, the one the provider actually served, and the provider's own identifiers for the request."
      >
        <ProvenanceDl items={model} columns={2} />
      </FormSection>

      <FormSection
        title="Cost & timing"
        description="Token counts as the provider reported them, the priced cost, and the two timings the usage summary rolls up."
      >
        <ProvenanceDl items={cost} columns={3} />
      </FormSection>
    </>
  );
}

// No backend, no auth gate — every other section in this clone dropped the
// superadmin gate for the same reason (no AuthProvider mounted).
export function UsageCallDetailPage() {
  return <UsageCallDetail />;
}

function UsageCallDetail() {
  // `strict: false` avoids brittleness around how TanStack Router computes the
  // route ID under the pathless layout parent.
  const { callId } = useParams({ strict: false }) as { callId: string };
  const usageLogSearch = useUsageLogSearch();

  const row = getUsageRow(callId);
  const payload = row ? getUsagePayload(callId) : null;

  if (!row) {
    return <NotFoundState entity="LLM call" action={<BackToUsageLog />} />;
  }

  return (
    <EntityShell
      breadcrumb={
        <Breadcrumbs data-slot="breadcrumb" aria-label="breadcrumb">
          <BreadcrumbsItem
            data-slot="breadcrumb-link"
            component={Link}
            to="/llm-catalog"
            label="LLM Catalog"
          />
          <BreadcrumbsItem
            data-slot="breadcrumb-link"
            data-testid="usage-call-breadcrumb-usage-log"
            component={Link}
            to="/llm-catalog"
            search={usageLogSearch}
            label="Usage log"
          />
          <Typography
            data-slot="breadcrumb-page"
            component="span"
            variant="body2"
            color="text.primary"
            aria-current="page"
            sx={{ fontFamily: "monospace", wordBreak: "break-all" }}
          >
            {row.callId}
          </Typography>
        </Breadcrumbs>
      }
      title={
        <Box component="span" sx={{ fontFamily: "monospace", wordBreak: "break-all" }}>
          {row.callId}
        </Box>
      }
      badges={
        <>
          <Chip tint="muted">{row.purpose}</Chip>
          <Chip tint="muted">
            {row.provider} · {row.modelId}
          </Chip>
          <Chip tint={row.failureCode ? "destructive" : "success"}>
            {row.failureCode ?? "success"}
          </Chip>
        </>
      }
      meta={
        <>
          <Box component="span">{new Date(row.createdAt).toLocaleString()}</Box>
          <Box component="span">·</Box>
          <Box component="span">{formatUsageCost(row.costUsd)}</Box>
          <Box component="span">·</Box>
          <Box component="span">{formatUsageLatencyMs(row.latencyMs)}</Box>
        </>
      }
    >
      <Box sx={{ px: 4, py: 3 }} data-testid="usage-call-detail">
        {/* Override (CLAUDE.md "Overrides" — cross-cutting readability): the
            design language caps detail/read bodies at ~1024px because form
            fields and prose have a bounded readable line length. Captured
            prompt and response text is neither — it is monospace payload, and
            rendering it narrow is the specific complaint this page replaces a
            drawer to fix. 1280 keeps the metadata grids comfortable and gives
            the code blocks a usable line. */}
        <Stack sx={{ maxWidth: 1280, gap: 3 }}>
          <RowSections row={row} />

          <FormSection
            title="Payload"
            description="The prompt and response text captured for this call. Superadmin-only, retained for a bounded window, and blanked in place when it expires or is purged."
          >
            {payload ? <PayloadBody payload={payload} /> : null}
          </FormSection>
        </Stack>
      </Box>
    </EntityShell>
  );
}
