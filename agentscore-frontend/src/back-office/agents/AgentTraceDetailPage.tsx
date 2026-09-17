/** AgentTraceDetailPage — pinned trace header + 2-pane (tree + span detail).
 *
 * Built on `TraceDetailShell` + `SpansTreeRow` + `RoleContentBlock`. The BE
 * detail endpoint requires `?timestamp=` for ClickHouse partition lookup;
 * the list-row navigation always threads that through.
 */

import { useMemo, useState } from "react";
import { useFakeQuery as useQuery } from "@/back-office/agents/fake-query";
import { useNavigate, useParams, useSearch } from "@tanstack/react-router";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Skeleton from "@mui/material/Skeleton";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import IconMaterialSymbolsArrowBack from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsArrowBack.mjs";
import IconMaterialSymbolsSchedule from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsSchedule.mjs";
import IconMaterialSymbolsContentCopy from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsContentCopy.mjs";
import IconMaterialSymbolsAttachMoney from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsAttachMoney.mjs";
import IconMaterialSymbolsTag from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsTag.mjs";
import IconMaterialSymbolsLayers from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsLayers.mjs";
import IconMaterialSymbolsSync from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsSync.mjs";
import IconMaterialSymbolsArrowDownward from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsArrowDownward.mjs";
import IconMaterialSymbolsArrowUpward from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsArrowUpward.mjs";
import IconMaterialSymbolsSave from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsSave.mjs";
import IconMaterialSymbolsPsychology from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsPsychology.mjs";
import IconMaterialSymbolsList from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsList.mjs";
import IconMaterialSymbolsGrade from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsGrade.mjs";

import * as api from "@/back-office/agents/fake-trace-data";
import type { ObservationNode, TraceDetail } from "@/back-office/agents/fake-trace-data";
import { TraceScorePanel } from "@/back-office/agents/TraceScorePanel";
import { Chip, ChipStrip } from "@/shared/components/chip";
import { EmptyState } from "@/shared/components/empty-state";
import { ErrorState } from "@/shared/components/error-state";
import { JsonViewer } from "@/shared/components/json-viewer";
import { buildTree, SYNTHETIC_ROOT_ID } from "@/shared/trace/build-tree";
import { ProvenanceDl } from "@/shared/components/provenance-dl";
import { RoleContentBlock } from "@/shared/components/role-content-block";
import { Spinner } from "@/shared/components/spinner";
import { SpansTreeRow } from "@/shared/components/spans-tree-row";
import { type SpanType } from "@/shared/components/span-type-meta";
import { TraceDetailShell } from "@/shared/components/trace-detail-shell";
import { formatCostUsd, formatDuration } from "@/shared/lib/format";

export function AgentTraceDetailPage() {
  const { tenantId, agentId, traceId } = useParams({ strict: false }) as {
    tenantId: string;
    agentId: string;
    traceId: string;
  };
  const { timestamp } = useSearch({ strict: false }) as { timestamp?: string };

  const traceQuery = useQuery({
    queryKey: ["agent-trace", tenantId, agentId, traceId, timestamp],
    queryFn: () =>
      api.getAgentTrace(tenantId, agentId, traceId, timestamp ?? ""),
    enabled: !!timestamp,
  });
  // For the breadcrumb label. Cached under the same key the layout uses, so
  // it's already warm — no extra request in practice.
  const agentQuery = useQuery({
    queryKey: ["agent", tenantId, agentId],
    queryFn: () => api.getAgent(tenantId, agentId),
  });
  const agentName = agentQuery.data?.name ?? agentId;

  if (!timestamp) {
    return (
      <Box sx={{ px: 4, py: 3 }}>
        <Alert severity="error">
          <AlertTitle>Missing timestamp</AlertTitle>
          The detail endpoint requires{" "}
          <Box component="span" sx={{ fontFamily: "monospace" }}>
            ?timestamp=
          </Box>{" "}
          for ClickHouse partition lookup. Navigate here from the Traces list to
          get a valid timestamp.
        </Alert>
      </Box>
    );
  }

  if (traceQuery.isLoading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, px: 4, py: 3 }}>
        <Skeleton sx={{ height: 48, width: "33%" }} />
        <Skeleton variant="rounded" sx={{ height: 256, width: "100%" }} />
      </Box>
    );
  }

  if (traceQuery.isError || !traceQuery.data) {
    return (
      <Box sx={{ px: 4, py: 3 }}>
        <Alert severity="error">
          <AlertTitle>Failed to load trace</AlertTitle>
          {(traceQuery.error as Error | undefined)?.message ??
            "Trace not found or backend unavailable."}
        </Alert>
      </Box>
    );
  }

  return (
    <TraceDetailBody
      trace={traceQuery.data}
      traceId={traceId}
      tenantId={tenantId}
      agentId={agentId}
      agentName={agentName}
    />
  );
}

function TraceDetailBody({
  trace,
  traceId,
  tenantId,
  agentId,
  agentName,
}: {
  trace: TraceDetail;
  traceId: string;
  tenantId: string;
  agentId: string;
  agentName: string;
}) {
  const observations = useMemo(
    () => trace.observations ?? [],
    [trace.observations],
  );
  const tree = useMemo(() => buildTree(observations), [observations]);
  const traceStartMs = new Date(trace.timestamp).getTime();
  const totalMs = trace.total_latency_ms ?? computeTotal(observations, traceStartMs);

  const [selectedId, setSelectedId] = useState<string | null>(
    tree.flat.find((t) => t.node.observation_id !== SYNTHETIC_ROOT_ID)?.node
      .observation_id ?? null,
  );
  const selected = observations.find((o) => o.observation_id === selectedId);

  // Detail-pane view toggle — URL state (`?view=`) beside the existing
  // `?timestamp=`, defaulted/validated by `router.tsx`'s
  // `agentTraceDetailRoute.validateSearch`. `replace: true` mirrors every
  // other in-page sub-tab toggle in this app (`RunsTab`'s By-run/By-version,
  // `FitTab`'s sub-tabs) — a toggle click updates the URL without spamming
  // history, at the cost of back/forward not stepping between the two
  // views; back/forward still move to whatever the browser history held
  // before this page, which is the same trade-off every other toggle here
  // already makes. Switching views never resets `selectedId`: it's state on
  // this same component instance, untouched by a search-param navigate.
  const { view } = useSearch({ strict: false }) as { view?: "spans" | "scores" };
  const activeView: "spans" | "scores" = view === "scores" ? "scores" : "spans";
  const navigate = useNavigate();

  return (
    <TraceDetailShell
      header={
        <TraceHeader
          trace={trace}
          traceId={traceId}
          totalMs={totalMs}
          tenantId={tenantId}
          agentId={agentId}
          agentName={agentName}
        />
      }
      treeHeader={
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box>
            <Box sx={{ typography: "caption", fontWeight: 600 }}>Spans</Box>
            <Box sx={{ typography: "caption", color: "text.secondary" }}>
              {observations.length} span{observations.length === 1 ? "" : "s"}
              {selected ? " · 1 selected" : ""}
            </Box>
          </Box>
        </Box>
      }
      tree={
        observations.length === 0 ? (
          <EmptyState
            icon={IconMaterialSymbolsLayers}
            title="No spans"
            description="This trace has no observations."
          />
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            {tree.incompleteness ? (
              <IncompletenessBanner incompleteness={tree.incompleteness} />
            ) : null}
            {tree.flat.map(({ node, depth }) => {
              if (node.observation_id === SYNTHETIC_ROOT_ID) {
                return (
                  <SyntheticRootRow key={node.observation_id} depth={depth} />
                );
              }
              const offsetMs =
                new Date(node.start_time).getTime() - traceStartMs;
              const duration = node.latency_ms ?? 0;
              return (
                <SpansTreeRow
                  key={node.observation_id}
                  testId={`span-row-${node.observation_id}`}
                  name={node.name ?? "(unnamed)"}
                  type={observationType(node, node.observation_id === tree.roots[0]?.observation_id)}
                  depth={depth}
                  offsetMs={offsetMs}
                  durationMs={duration}
                  totalMs={totalMs || 1}
                  durationLabel={formatDuration(duration)}
                  selected={selectedId === node.observation_id}
                  onClick={() => setSelectedId(node.observation_id)}
                  chips={
                    <>
                      <Box
                        component="span"
                        sx={(theme) => ({
                          borderRadius: 0.5,
                          bgcolor: theme.palette.action.hover,
                          px: 0.5,
                          py: 0.25,
                        })}
                      >
                        {node.type.toLowerCase()}
                      </Box>
                      {node.model ? (
                        <Box
                          component="span"
                          sx={(theme) => ({
                            borderRadius: 0.5,
                            bgcolor: theme.palette.action.hover,
                            px: 0.5,
                            py: 0.25,
                          })}
                        >
                          {node.model}
                        </Box>
                      ) : null}
                      {node.total_tokens ? (
                        <Box
                          component="span"
                          sx={(theme) => ({
                            borderRadius: 0.5,
                            bgcolor: theme.palette.action.hover,
                            px: 0.5,
                            py: 0.25,
                          })}
                        >
                          {node.total_tokens} tok
                        </Box>
                      ) : null}
                    </>
                  }
                />
              );
            })}
          </Box>
        )
      }
      detailHeader={
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={activeView}
            onChange={(_e, v: "spans" | "scores" | null) => {
              // ToggleButtonGroup emits `null` on re-click of the already-
              // selected option — the guard keeps `view` from being wiped
              // out of the URL.
              if (v) {
                void navigate({
                  to: ".",
                  search: (prev: Record<string, unknown>) => ({
                    ...prev,
                    view: v,
                  }),
                  replace: true,
                });
              }
            }}
            aria-label="Detail view"
            data-testid="trace-view-toggle"
          >
            <ToggleButton value="spans" data-testid="trace-view-spans">
              <IconMaterialSymbolsList sx={{ fontSize: 14, mr: 0.75 }} />
              Span details
            </ToggleButton>
            <ToggleButton value="scores" data-testid="trace-view-scores">
              <IconMaterialSymbolsGrade sx={{ fontSize: 14, mr: 0.75 }} />
              Score details
            </ToggleButton>
          </ToggleButtonGroup>
          {activeView === "spans" && selected ? (
            <SpanHeader observation={selected} traceStartMs={traceStartMs} />
          ) : null}
        </Box>
      }
      detail={
        activeView === "scores" ? (
          <TraceScorePanel
            tenantId={tenantId}
            agentId={agentId}
            traceId={traceId}
            traceTimestamp={trace.timestamp}
          />
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {selected ? (
              <SpanDetailBody
                key={selected.observation_id}
                observation={selected}
                traceInput={trace.input}
                traceOutput={trace.output}
                isRoot={
                  selected.observation_id === tree.roots[0]?.observation_id
                }
                tenantId={tenantId}
                agentId={agentId}
                traceId={traceId}
              />
            ) : (
              <EmptyState
                icon={IconMaterialSymbolsLayers}
                title="No span selected"
                description="Pick a span from the tree to inspect its input, output, and metadata."
              />
            )}
          </Box>
        )
      }
    />
  );
}

/** Above-the-waterfall marker for an incomplete trace (spec §3.1 Feature 2).
 * MUI `Alert` does not spread arbitrary `data-*` to its leaf, so the e2e hook
 * is placed on the `Alert` itself via `data-slot`/`data-testid` (mirrors
 * `milestone-banner.tsx`). */
function IncompletenessBanner({
  incompleteness,
}: {
  incompleteness: NonNullable<ReturnType<typeof buildTree>["incompleteness"]>;
}) {
  const { kind, reRootedCount, total } = incompleteness;
  const message =
    kind === "no_root"
      ? `Trace root not captured — showing ${total} spans re-rooted under a placeholder. The upstream root span was not ingested.`
      : `Incomplete trace — ${reRootedCount} of ${total} spans could not be linked to the trace root and were re-rooted under a placeholder.`;

  return (
    <Alert
      data-slot="trace-incompleteness-banner"
      data-testid="trace-incompleteness-banner"
      severity="info"
      sx={{ mb: 1 }}
    >
      {message}
    </Alert>
  );
}

/** Placeholder row for the synthetic root sentinel (spec §4.2 — never reads
 * `start_time`/`latency_ms`/`type`/`model`/`total_tokens` off the sentinel).
 * Non-interactive (a `div`, not a button) so keyboard users can't focus a
 * dead control; `role="note"` + `aria-label` describe it for screen readers. */
function SyntheticRootRow({ depth }: { depth: number }) {
  return (
    <Box
      data-testid={`span-row-${SYNTHETIC_ROOT_ID}`}
      role="note"
      aria-label="Synthetic root — original root span not captured"
      style={{ paddingLeft: 12 + depth * 16 }}
      sx={(theme) => ({
        py: 1,
        pr: 1.5,
        typography: "caption",
        fontStyle: "italic",
        color: "text.secondary",
        bgcolor: theme.palette.action.hover,
      })}
    >
      Synthetic root (original root not captured)
    </Box>
  );
}

/** The counters the trace strip always shows, in reading order.
 *
 * Every one keeps its slot whether or not this trace reported it, so the strip
 * has the same shape on every trace and a missing number is visibly missing
 * rather than silently absent. Reading a token profile means comparing these
 * against each other — a strip that drops the counters a trace happens not to
 * carry makes two traces impossible to compare at a glance. */
const TRACE_STRIP_COUNTERS = [
  { key: "input_tokens", label: "input", icon: IconMaterialSymbolsArrowDownward },
  { key: "output_tokens", label: "output", icon: IconMaterialSymbolsArrowUpward },
  { key: "cache_read_tokens", label: "cache read", icon: IconMaterialSymbolsSync },
  { key: "cache_write_tokens", label: "cache write", icon: IconMaterialSymbolsSave },
  { key: "reasoning_tokens", label: "reasoning", icon: IconMaterialSymbolsPsychology },
] as const;

/** A strip counter's value: the number, or an em dash when no span reported it.
 *
 * `0` and "not reported" are different facts and must not render alike — a
 * provider that says it served no cached tokens has told us something, and a
 * trace whose spans never mentioned caching has not. Printing `0` for the
 * second would invent a measurement. */
function formatCounter(value: number | null | undefined): string {
  return value == null ? "—" : value.toLocaleString();
}


function TraceHeader({
  trace,
  traceId,
  totalMs,
  tenantId,
  agentId,
  agentName,
}: {
  trace: TraceDetail;
  traceId: string;
  totalMs: number;
  tenantId: string;
  agentId: string;
  agentName: string;
}) {
  const observations = trace.observations ?? [];
  const tokenUsage = trace.token_usage;
  // Traces written before this change never got a `token_usage` rollup, and a
  // post-change trace can carry the rollup with `total_tokens` itself `null`
  // (no span in it reported a total) — both fall back to the client-side span
  // sum so a "we do not know" aggregate never renders as a reported zero.
  const tokens =
    tokenUsage?.total_tokens != null
      ? tokenUsage.total_tokens
      : observations.reduce((sum, o) => sum + (o.total_tokens ?? 0), 0);
  const cost = observations.reduce((sum, o) => sum + (o.cost_usd ?? 0), 0);
  const spans = observations.length;
  const navigate = useNavigate();

  return (
    <Box>
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.25 }}>
        <IconButton
          size="small"
          aria-label={`Back to ${agentName} traces`}
          onClick={() =>
            void navigate({
              to: "/tenants/$tenantId/agents/$agentId/traces",
              params: { tenantId, agentId },
            })
          }
          sx={{ ml: -1 }}
        >
          <IconMaterialSymbolsArrowBack sx={{ fontSize: 20 }} />
        </IconButton>
        <Box
          component="h1"
          sx={{
            m: 0,
            fontFamily: "monospace",
            typography: "h5",
            fontWeight: 600,
          }}
        >
          {trace.name ?? traceId}
        </Box>
        <Chip tint="muted">{new Date(trace.timestamp).toLocaleString()}</Chip>
      </Box>

      <Box sx={{ mt: 1.25 }}>
        <ChipStrip>
          <Chip icon={IconMaterialSymbolsSchedule}>
            {formatDuration(totalMs)}
          </Chip>
          {tokens > 0 ? (
            <Chip icon={IconMaterialSymbolsTag}>
              {tokens.toLocaleString()} tokens
            </Chip>
          ) : null}
          {tokenUsage
            ? TRACE_STRIP_COUNTERS.map(({ key, label, icon }) => (
                <Chip key={key} icon={icon} data-testid={`trace-token-${key}`}>
                  {formatCounter(tokenUsage[key])} {label}
                </Chip>
              ))
            : null}
          {tokenUsage?.cache_semantics_mixed ? (
            <Chip tint="warning" data-testid="trace-token-mixed">
              mixed token dialects
            </Chip>
          ) : null}
          {cost > 0 ? (
            <Chip icon={IconMaterialSymbolsAttachMoney}>
              {formatCostUsd(cost)}
            </Chip>
          ) : null}
          <Chip icon={IconMaterialSymbolsLayers}>
            {spans} span{spans === 1 ? "" : "s"}
          </Chip>
          {trace.session_id ? (
            <Chip tint="info">session {trace.session_id}</Chip>
          ) : null}
        </ChipStrip>
      </Box>
    </Box>
  );
}

function SpanHeader({
  observation,
  traceStartMs,
}: {
  observation: ObservationNode;
  traceStartMs: number;
}) {
  const offsetMs = new Date(observation.start_time).getTime() - traceStartMs;
  const endMs =
    observation.end_time != null
      ? new Date(observation.end_time).getTime() - traceStartMs
      : offsetMs + (observation.latency_ms ?? 0);

  return (
    <Box>
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1 }}>
        <Box
          component="span"
          sx={{ fontFamily: "monospace", typography: "body1", fontWeight: 600 }}
        >
          {observation.name ?? "(unnamed)"}
        </Box>
        <Chip tint="info">{observation.type.toLowerCase()}</Chip>
        {observation.model ? (
          <Chip tint="muted">
            <Box component="span" sx={{ fontFamily: "monospace" }}>
              {observation.model}
            </Box>
          </Chip>
        ) : null}
      </Box>
      <Box sx={{ mt: 0.75 }}>
        <ChipStrip>
          <Chip icon={IconMaterialSymbolsSchedule}>
            {formatDuration(observation.latency_ms)}
          </Chip>
          {observation.total_tokens ? (
            <Chip icon={IconMaterialSymbolsTag}>
              {observation.total_tokens.toLocaleString()} tokens
              {observation.input_tokens != null &&
              observation.output_tokens != null
                ? ` (${observation.input_tokens} → ${observation.output_tokens})`
                : null}
            </Chip>
          ) : null}
          {observation.cost_usd != null ? (
            <Chip icon={IconMaterialSymbolsAttachMoney}>
              {formatCostUsd(observation.cost_usd)}
            </Chip>
          ) : null}
        </ChipStrip>
      </Box>
      <Box sx={{ mt: 0.5, typography: "caption", color: "text.secondary" }}>
        offset {formatDuration(offsetMs)} · ended {formatDuration(endMs)}
      </Box>
    </Box>
  );
}

function SpanDetailBody({
  observation,
  traceInput,
  traceOutput,
  isRoot,
  tenantId,
  agentId,
  traceId,
}: {
  observation: ObservationNode;
  traceInput?: unknown;
  traceOutput?: unknown;
  isRoot: boolean;
  tenantId: string;
  agentId: string;
  traceId: string;
}) {
  // Trace-detail returns observation I/O nulled by design — the bodies live on
  // a per-observation lookup we fire lazily here, on span-expand. TanStack
  // Query caches per observation_id (staleTime: Infinity), so collapsing and
  // re-selecting a span doesn't refetch. A 404 (observation not found) falls
  // through to the trace-level fallback / "No input".
  const ioQuery = useQuery({
    queryKey: [
      "agent-observation",
      tenantId,
      agentId,
      traceId,
      observation.observation_id,
      observation.start_time,
    ],
    queryFn: () =>
      api.getAgentObservation(
        tenantId,
        agentId,
        traceId,
        observation.observation_id,
        observation.start_time,
      ),
    staleTime: Infinity,
    retry: false,
  });

  const full = ioQuery.data;
  const ownInput = full?.input ?? observation.input;
  const ownOutput = full?.output ?? observation.output;
  const toolCalls = full?.tool_calls ?? observation.tool_calls;
  const toolCallNames = full?.tool_call_names ?? observation.tool_call_names;

  // Fall back to trace-level I/O on the root span (these traces attach the
  // prompt/response to the trace, not the root span).
  const inputValue = ownInput != null ? ownInput : isRoot ? traceInput : null;
  const outputValue =
    ownOutput != null ? ownOutput : isRoot ? traceOutput : null;
  const inputFromTrace = ownInput == null && inputValue != null;
  const outputFromTrace = ownOutput == null && outputValue != null;
  const loading = ioQuery.isLoading;
  // A failed lookup must not read as an empty span: "No input." below is
  // reserved for a lookup that succeeded and found nothing.
  const loadError = ioQuery.isError ? (ioQuery.error as Error).message : null;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {observation.status_message ? (
        <Alert severity="error">
          <AlertTitle>Status</AlertTitle>
          {observation.status_message}
        </Alert>
      ) : null}

      {loadError ? (
        <ErrorState
          title="Could not load this span's input and output"
          message={loadError}
        />
      ) : null}

      {observation.token_usage ? (
        <SpanTokenBreakdown
          tokenUsage={observation.token_usage}
          observationId={observation.observation_id}
        />
      ) : null}

      <Box component="details" open>
        <Box
          component="summary"
          sx={{
            mb: 1,
            display: "flex",
            cursor: "pointer",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.75,
              typography: "caption",
              fontWeight: 600,
            }}
          >
            <span>Input</span>
            {inputFromTrace ? (
              <Chip tint="muted">trace-level</Chip>
            ) : observation.input_tokens ? (
              <Box
                component="span"
                sx={{
                  fontFamily: "monospace",
                  typography: "caption",
                  color: "text.secondary",
                }}
              >
                {observation.input_tokens} tokens
              </Box>
            ) : null}
          </Box>
          <IconMaterialSymbolsContentCopy
            sx={{ fontSize: 12, color: "text.secondary" }}
          />
        </Box>
        {inputValue != null ? (
          <JsonViewer value={inputValue} />
        ) : loading ? (
          <LoadingLine />
        ) : loadError ? null : (
          <Box sx={{ typography: "caption", color: "text.secondary" }}>
            No input.
          </Box>
        )}
      </Box>

      <Box component="details" open>
        <Box
          component="summary"
          sx={{
            mb: 1,
            display: "flex",
            cursor: "pointer",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.75,
              typography: "caption",
              fontWeight: 600,
            }}
          >
            <span>Output</span>
            {outputFromTrace ? (
              <Chip tint="muted">trace-level</Chip>
            ) : observation.output_tokens ? (
              <Box
                component="span"
                sx={{
                  fontFamily: "monospace",
                  typography: "caption",
                  color: "text.secondary",
                }}
              >
                {observation.output_tokens} tokens
              </Box>
            ) : null}
          </Box>
          <IconMaterialSymbolsContentCopy
            sx={{ fontSize: 12, color: "text.secondary" }}
          />
        </Box>
        {outputValue != null ? (
          <JsonViewer value={outputValue} />
        ) : loading ? (
          <LoadingLine />
        ) : loadError ? null : (
          <Box sx={{ typography: "caption", color: "text.secondary" }}>
            No output.
          </Box>
        )}
        {toolCalls && toolCalls.length > 0
          ? toolCalls.map((tc, i) => (
              <Box key={i} sx={{ mt: 1 }}>
                <RoleContentBlock
                  role="tool_call"
                  subLabel={toolCallNames?.[i] ?? `tool_call_${i + 1}`}
                  mono
                >
                  {JSON.stringify(tc, null, 2)}
                </RoleContentBlock>
              </Box>
            ))
          : null}
      </Box>

      <Box component="details">
        <Box
          component="summary"
          sx={{ mb: 1, cursor: "pointer", typography: "caption", fontWeight: 600 }}
        >
          Metadata
        </Box>
        <ProvenanceDl
          columns={2}
          items={[
            {
              label: "Observation id",
              value: (
                <Box
                  component="span"
                  sx={{ fontFamily: "monospace", typography: "caption" }}
                >
                  {observation.observation_id}
                </Box>
              ),
            },
            { label: "Type", value: observation.type },
            { label: "Model", value: observation.model ?? "—" },
            { label: "Level", value: observation.level ?? "—" },
            {
              label: "Started",
              value: new Date(observation.start_time).toLocaleString(),
            },
            {
              label: "Ended",
              value: observation.end_time
                ? new Date(observation.end_time).toLocaleString()
                : "—",
            },
          ]}
        />
      </Box>
    </Box>
  );
}

type SpanTokenUsage = NonNullable<ObservationNode["token_usage"]>;

// The headline six — per-modality counters are stored but intentionally not
// rendered here (spec: "Which counters are visible?").
const TOKEN_BREAKDOWN_ROWS: Array<{
  key:
    | "input_tokens"
    | "output_tokens"
    | "total_tokens"
    | "cache_read_tokens"
    | "cache_write_tokens"
    | "reasoning_tokens";
  label: string;
}> = [
  { key: "input_tokens", label: "Input" },
  { key: "output_tokens", label: "Output" },
  { key: "total_tokens", label: "Total" },
  { key: "cache_read_tokens", label: "Cache read" },
  { key: "cache_write_tokens", label: "Cache write" },
  { key: "reasoning_tokens", label: "Reasoning" },
];

function SpanTokenBreakdown({
  tokenUsage,
  observationId,
}: {
  tokenUsage: SpanTokenUsage;
  observationId: string;
}) {
  const rows = TOKEN_BREAKDOWN_ROWS.filter(
    ({ key }) => tokenUsage[key] != null,
  );
  if (rows.length === 0) return null;

  return (
    <Box data-testid={`span-token-breakdown-${observationId}`}>
      <Box
        sx={{
          mb: 0.5,
          typography: "caption",
          fontWeight: 600,
          color: "text.secondary",
        }}
      >
        Token usage
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
        {rows.map(({ key, label }) => (
          <Box
            key={key}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              typography: "caption",
            }}
          >
            <span>{label}</span>
            <Box component="span" sx={{ fontFamily: "monospace" }}>
              {(tokenUsage[key] as number).toLocaleString()}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function LoadingLine() {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        typography: "caption",
        color: "text.secondary",
      }}
    >
      <Spinner />
      Loading…
    </Box>
  );
}

function computeTotal(observations: ObservationNode[], traceStartMs: number) {
  let maxEnd = 0;
  for (const o of observations) {
    const start = new Date(o.start_time).getTime() - traceStartMs;
    const end = start + (o.latency_ms ?? 0);
    if (end > maxEnd) maxEnd = end;
  }
  return maxEnd || 1;
}

function observationType(obs: ObservationNode, isRoot: boolean): SpanType {
  if (isRoot) return "root";
  const type = obs.type.toUpperCase();
  if (type === "GENERATION") return "generation";
  if (obs.tool_calls && obs.tool_calls.length > 0) return "tool";
  const name = obs.name?.toLowerCase() ?? "";
  if (name.includes("retriev") || name.includes("vector") || name.includes("search")) {
    return "retriever";
  }
  if (type === "EVENT") return "external";
  return "generic";
}

