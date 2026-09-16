/** The Agent Card's presentational body — the observed (Tier A,
 *  deterministic) and inferred (Tier B, LLM-drafted) sections, shared by the
 *  back-office card tab and the customer agent detail page.
 *
 * Observed and inferred content is hard-separated in both the payload and
 * this render: every inferred section sits under a warning-tinted "Inferred"
 * chip and the "Inferred — draft, not verified" banner, so a reviewer can
 * never mistake a drafted `success_criteria`/`behavioral_patterns` for a
 * measured fact. `payload.observed.example_trace.snapshot` is rendered as a
 * plain-text JSON dump — no HTML/markdown execution.
 *
 * The props are the raw `payload` plus `generationStatus` and `createdAt` as
 * scalars, and that boundary is load-bearing: the back-office `AgentCardOut`
 * is camelCase and carries six LLM-pipeline fields the customer
 * `CustomerAgentCard` drops, so no single wrapper shape serves both callers.
 * The payload is un-aliased JSONB and identical in both. Everything reading
 * `cardPromptVersion` / `modelId` / `fitDecisionId` / `sampledTraceIds` /
 * `fallbackReason` / `generationSource` stays in the back-office wrapper.
 */
import { useState, type ReactNode } from "react";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Button from "@mui/material/Button";
import IconMaterialSymbolsKeyboardArrowDown from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsKeyboardArrowDown.mjs";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { alpha } from "@mui/material/styles";
import IconMaterialSymbolsWarning from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsWarning.mjs";

import {
  asCardPayload,
  formatCompactNumber,
  formatCost,
  formatDate,
  formatPercent,
  MONO,
  type CardPercentiles,
} from "@/shared/components/agent-card-payload";
import { Chip } from "@/shared/components/chip";
import { EmptyState } from "@/shared/components/empty-state";
import { Eyebrow } from "@/shared/components/eyebrow";

function SectionCard({
  title,
  subtitle,
  right,
  children,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card variant="outlined" sx={{ boxShadow: "none", minWidth: 0 }}>
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Box
          sx={{
            mb: 1.5,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 1.5,
            flexWrap: "wrap",
          }}
        >
          <Box>
            <Box sx={{ typography: "h6" }}>{title}</Box>
            {subtitle ? (
              <Box sx={{ typography: "caption", color: "text.secondary", mt: 0.25 }}>
                {subtitle}
              </Box>
            ) : null}
          </Box>
          {right}
        </Box>
        {children}
      </CardContent>
    </Card>
  );
}

function DetailSection({ title, testId, children, defaultExpanded = false }: { title: string; testId: string; children: ReactNode; defaultExpanded?: boolean }) {
  return <Accordion slotProps={{ transition: { unmountOnExit: true } }} defaultExpanded={defaultExpanded} disableGutters elevation={0} sx={{ "&:before": { display: "none" }, border: 1, borderColor: "divider", borderRadius: 1 }}>
    <AccordionSummary expandIcon={<IconMaterialSymbolsKeyboardArrowDown fontSize="small" />} data-testid={testId}><Box sx={{ typography: "subtitle2" }}>{title}</Box></AccordionSummary>
    <AccordionDetails sx={{ minWidth: 0, overflowWrap: "anywhere" }}>{children}</AccordionDetails>
  </Accordion>;
}

function InterpretationList({ title, values, testId, hint }: { title: string; values: string[]; testId: string; hint?: string }) {
  return <DetailSection title={`${title} · ${values.length} items`} testId={testId}>
    {hint ? <Box sx={{ typography: "body2", color: "text.secondary", mb: 1 }}>{hint}</Box> : null}
    {values.length ? <Box component="ul" sx={{ pl: 3, m: 0 }}>{values.map((value, index) => <Box component="li" key={index} sx={{ typography: "body1", mb: 1, maxWidth: "85ch", lineHeight: 1.7 }}>{value}</Box>)}</Box> : <Box sx={{ typography: "body2", color: "text.secondary" }}>None drafted.</Box>}
  </DetailSection>;
}

function Bullet({ children }: { children: ReactNode }) {
  return (
    <Box sx={{ display: "flex", gap: 1, my: 0.75, typography: "body2" }}>
      <Box
        sx={(t) => ({
          flex: "0 0 6px",
          height: 6,
          mt: "8px",
          borderRadius: "50%",
          bgcolor: t.palette.text.disabled,
        })}
      />
      <Box>{children}</Box>
    </Box>
  );
}

function Stat({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <Box
      sx={(t) => ({
        border: 1,
        borderColor: alpha(t.palette.divider, 0.6),
        borderRadius: 1,
        px: 1.5,
        py: 1.25,
      })}
    >
      <Eyebrow>{label}</Eyebrow>
      <Box sx={{ typography: "h5", mt: 0.5 }}>{value}</Box>
    </Box>
  );
}

function PercentileValue({
  stats,
  unit = "",
  format = (n: number) => String(Math.round(n)),
}: {
  stats: CardPercentiles;
  unit?: string;
  format?: (n: number) => string;
}) {
  if (stats.p50 == null && stats.p90 == null) return <>—</>;
  return (
    <>
      {stats.p50 != null ? format(stats.p50) : "—"}
      <Box component="span" sx={{ typography: "caption", color: "text.secondary" }}>
        {unit} median
      </Box>{" "}
      ·{" "}
      {stats.p90 != null ? format(stats.p90) : "—"}
      <Box component="span" sx={{ typography: "caption", color: "text.secondary" }}>
        {unit} 90th percentile
      </Box>
    </>
  );
}

export function AgentCardView({
  payload,
  generationStatus,
  createdAt,
  payloadMissingHint,
  showObservedBehavior = true,
}: {
  /** The raw `payload` JSONB, un-aliased and identical across both callers. */
  payload: unknown;
  generationStatus: "ok" | "failed" | "skipped_insufficient_evidence";
  createdAt: string;
  /** Appended to the unreadable-payload alert. The back-office passes the
   *  Regenerate hint, because it has a Regenerate button to act on it; the
   *  customer app has no such control, so telling a customer to regenerate
   *  would name an action they cannot take. */
  payloadMissingHint?: ReactNode;
  /** Render the "Observed behavior & operations" section. Back-office only:
   *  it exposes internal tool-sequence names and an operational envelope whose
   *  cost percentiles are our model spend, which is not a customer's to read.
   *  Defaults to showing it, so the back-office caller passes nothing and the
   *  customer opts out explicitly. */
  showObservedBehavior?: boolean;
}) {
  const [allTools, setAllTools] = useState(false);
  // The non-ok states carry no payload, so this is everything either caller
  // can say about them from the shared shape alone. The back-office wrapper
  // renders its own richer variants (last-attempt provenance, the regenerate
  // hint) and only calls this view for `ok`; the customer app has neither and
  // calls it for all three.
  if (generationStatus === "skipped_insufficient_evidence") {
    return (
      <Card data-testid="agent-card-view-skipped">
        <CardContent>
          <EmptyState
            icon={IconMaterialSymbolsWarning}
            title="Card unavailable — insufficient evidence"
            description="The most recent profile-fit ran on reduced evidence, so no card was generated. One is produced on the next full-evidence fit."
          />
          <Box sx={{ typography: "caption", color: "text.secondary", mt: 1.5 }}>
            Last attempt {formatDate(createdAt)}
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (generationStatus === "failed") {
    return (
      <Card data-testid="agent-card-view-failed">
        <CardContent>
          <EmptyState
            icon={IconMaterialSymbolsWarning}
            title="Card generation failed"
            description="The card could not be drafted on the last attempt. The agent's profile-fit and scores are unaffected; a new card is attempted on the next fit."
          />
          <Box sx={{ typography: "caption", color: "text.secondary", mt: 1.5 }}>
            Last attempt {formatDate(createdAt)}
          </Box>
        </CardContent>
      </Card>
    );
  }

  const parsed = asCardPayload(payload);
  if (!parsed) {
    // Defensive — the app-level invariant is payload non-null iff
    // status="ok"; a malformed/legacy row still degrades to a readable
    // message rather than crashing the page.
    return (
      <Alert severity="warning" data-testid="agent-card-payload-missing">
        This card&apos;s content could not be read.
        {payloadMissingHint ? <> {payloadMissingHint}</> : null}
      </Alert>
    );
  }

  const { observed, inferred } = parsed;

  return (
    <Stack spacing={3} data-testid="agent-card-ok">
      <Alert severity="info" icon={false} data-testid="agent-card-evidence-snapshot">
        <Box sx={{ typography: "subtitle2" }}>Evidence snapshot</Box>
        <Box sx={{ typography: "body2" }}>{observed.window.trace_count} sampled traces · {observed.tools.length} observed tools</Box>
        <Box sx={{ typography: "caption", mt: 0.5 }}>{formatDate(observed.window.start)} – {formatDate(observed.window.end)}. Statistics describe this sample, not all activity.</Box>
      </Alert>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", lg: "minmax(0, 0.85fr) minmax(0, 1.15fr)" }, gap: 2, alignItems: "start" }}>
      <SectionCard title="Purpose" subtitle="Synthesized by the model — a draft, not a verified declaration" right={<Chip tint="warning">Generated interpretation</Chip>}>
        <Box sx={{ typography: "body1", maxWidth: "85ch", lineHeight: 1.7, overflowWrap: "anywhere" }}>{inferred.purpose}</Box>
      </SectionCard>

      <SectionCard
        title="Observed tool activity"
        subtitle="Measured from traces. Tool-call success does not establish task success."
        right={<Chip tint="outline">observed · {observed.tools.length} tools</Chip>}
      >
        {observed.tools.length === 0 ? (
          // Audit P3: "No tools observed" reads as "this agent has no tools",
          // which is wrong for tool-driven agents (git code fetcher, tabnine
          // services agent) whose traces simply carry no tool_calls. The
          // observed-builder has nothing to read — an upstream instrumentation
          // gap, not an absence of tools. Say which, so a blank section is
          // never mistaken for a measured zero.
          <Box
            data-testid="agent-card-no-tool-calls"
            sx={{ typography: "body2", color: "text.secondary" }}
          >
            No tool calls captured in the sampled traces. This means none were
            recorded on these traces — not that the agent has no tools.
          </Box>
        ) : (
          <Box sx={{ overflowX: "auto" }}><Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ typography: "subtitle2" }}>Tool</TableCell>
                <TableCell sx={{ typography: "subtitle2", textAlign: "right", width: 80 }}>
                  Calls
                </TableCell>
                <TableCell sx={{ typography: "subtitle2", textAlign: "right", width: 90 }}>
                  Successful calls
                </TableCell>

              </TableRow>
            </TableHead>
            <TableBody>
              {(allTools ? observed.tools : observed.tools.slice(0, 4)).map((tool) => (
                <TableRow key={tool.name}>
                  <TableCell>
                    <Box sx={{ fontFamily: MONO }}>{tool.name}</Box>
                  </TableCell>
                  <TableCell sx={{ textAlign: "right", fontFamily: MONO }}>
                    {tool.call_count}
                  </TableCell>
                  <TableCell sx={{ textAlign: "right", fontFamily: MONO }}>
                    {formatPercent(tool.success_rate)}
                  </TableCell>

                </TableRow>
              ))}
            </TableBody>
          </Table></Box>
        )}

        {observed.tools.length > 4 ? <Button onClick={() => setAllTools((value) => !value)} aria-expanded={allTools} data-testid="agent-card-tools-toggle" sx={{ mt: 1 }}>{allTools ? "Show fewer tools" : `Show all ${observed.tools.length} tools`}</Button> : null}
        {observed.tools.length ? <Box sx={{ mt: 2 }}><DetailSection title="View generated tool descriptions" testId="agent-card-tool-descriptions">
          <Box sx={{ typography: "body2", color: "text.secondary", mb: 2 }}>These descriptions are generated interpretations, not measured facts.</Box>
          {observed.tools.map((tool) => <Box key={tool.name} sx={{ mb: 2 }}><Box sx={{ typography: "subtitle2", overflowWrap: "anywhere" }}>{tool.name}</Box><Box sx={{ typography: "body1", maxWidth: "85ch" }}>{inferred.tool_descriptions[tool.name] ?? "No description generated."}</Box></Box>)}
        </DetailSection></Box> : null}

      </SectionCard>

      </Box>
      <SectionCard title="Generated interpretation" right={<Chip tint="warning">Draft · not verified</Chip>}>
        <Stack spacing={1.5}>
          <InterpretationList title="Typical behavior" values={inferred.behavioral_patterns} testId="agent-card-behavior-toggle" />
          <InterpretationList title="Suggested success criteria" values={inferred.success_criteria} testId="agent-card-success-toggle" />
          <InterpretationList title="Potential failure modes" values={inferred.failure_modes} testId="agent-card-failure-toggle" hint="Possible risks described by the model; not confirmed incidents." />
        </Stack>
      </SectionCard>

      {showObservedBehavior ? (
      <DetailSection title="Measured operations" testId="agent-card-operations-toggle">
        <Box sx={{ typography: "body2", color: "text.secondary", mb: 2 }}>Measured tool sequences, duration and usage from the sampled traces.</Box>
        <Eyebrow>Tool sequences</Eyebrow>
        {observed.behavioral_sequences.length === 0 ? (
          <Box sx={{ typography: "body2", color: "text.secondary", mt: 0.5 }}>
            {observed.tools.length === 0
              ? "No tool calls were captured, so no sequences could be derived."
              : "No repeated tool sequences observed."}
          </Box>
        ) : (
          observed.behavioral_sequences.map((seq) => (
            <Bullet key={seq.pattern}>
              <Box component="span" sx={{ fontFamily: MONO }}>
                {seq.pattern}
              </Box>{" "}
              · <b>{seq.occurrences} / {seq.total}</b> traces
            </Bullet>
          ))
        )}

        <Box sx={{ mt: 2 }}>
          <Eyebrow>
            Operational envelope{" "}
            <Box
              component="span"
              sx={{ textTransform: "none", letterSpacing: 0, color: "text.secondary" }}
            >
              (real numbers — not budgets/targets)
            </Box>
          </Eyebrow>
        </Box>
        <Box sx={{ mt: 1, display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "repeat(3, minmax(0, 1fr))" }, gap: 1.5 }}>
          <Stat
            label="Latency"
            value={<PercentileValue stats={observed.operational_stats.latency_ms} unit="ms" />}
          />
          <Stat
            label="Tokens"
            value={
              <PercentileValue
                stats={observed.operational_stats.tokens}
                format={formatCompactNumber}
              />
            }
          />
          <Stat
            label="Cost"
            value={
              <PercentileValue stats={observed.operational_stats.cost_usd} format={formatCost} />
            }
          />
        </Box>
      </DetailSection>
      ) : null}

      <Box
        sx={{ typography: "caption", color: "text.secondary" }}
        data-testid="agent-card-generated-at"
      >
        Card generated {formatDate(createdAt)}
      </Box>
    </Stack>
  );
}
