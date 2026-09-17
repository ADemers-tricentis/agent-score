/** Human review of captured interactions, with per-item drafts and explicit verdicts. */
import { useEffect, useRef, useState } from "react";
import { Link as RouterLink, useParams } from "@tanstack/react-router";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ListItemButton from "@mui/material/ListItemButton";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import IconMaterialSymbolsKeyboardArrowDown from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsKeyboardArrowDown.mjs";
import IconMaterialSymbolsCheck from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsCheck.mjs";
import { Chip } from "@/shared/components/chip";
import { EmptyState } from "@/shared/components/empty-state";
import { JsonViewer } from "@/shared/components/json-viewer";
import { RadioCards } from "@/shared/components/radio-cards";
import { toast } from "@/shared/lib/toast";
import { labelingFixtureFor, type LabelDecisionIn, type LabelingProposal } from "./labeling-fixtures";

const QUEUE_BATCH_SIZE = 10;
const MAX_LOADED = 200;
type Draft = {
  verdict: "correct" | "incorrect" | "";
  expectedOutput: string;
  expectedOutcome: string;
  expectedTools: string;
  note: string;
  expanded: boolean;
};
const EMPTY_DRAFT: Draft = { verdict: "", expectedOutput: "", expectedOutcome: "", expectedTools: "", note: "", expanded: false };

function readableValue(value: unknown): unknown {
  if (value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === 1 && "_raw" in value) {
    return readableValue(value._raw);
  }
  if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value);
      if (parsed !== null && typeof parsed === "object") return parsed;
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error;
    }
  }
  return value;
}

function inputPreview(value: unknown): string {
  const readable = readableValue(value);
  return typeof readable === "string" ? readable : JSON.stringify(readable) ?? "Input unavailable";
}

function InteractionContent({ label, value }: { label: string; value: unknown }) {
  const readable = readableValue(value);
  const structured = readable !== null && typeof readable === "object";
  return (
    <Paper variant="outlined" sx={{ p: 2.5, minWidth: 0 }}>
      <Typography variant="subtitle2" sx={{ mb: 1.5 }}>{label}</Typography>
      {structured ? (
        <Accordion disableGutters elevation={0} sx={{ "&:before": { display: "none" } }}>
          <AccordionSummary expandIcon={<IconMaterialSymbolsKeyboardArrowDown fontSize="small" />} data-testid={`label-${label.toLowerCase()}-structured`}>
            <Typography variant="body2">View structured {label.toLowerCase()}</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ px: 0, overflowWrap: "anywhere", minWidth: 0 }}><JsonViewer value={readable} /></AccordionDetails>
        </Accordion>
      ) : (
        <Typography variant="body1" sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", lineHeight: 1.7, maxWidth: "85ch" }}>
          {readable === null || readable === undefined || readable === "" ? `No ${label.toLowerCase()}` : String(readable)}
        </Typography>
      )}
    </Paper>
  );
}

export function AgentLabelingPage() {
  const { tenantId, agentId } = useParams({ strict: false }) as { tenantId: string; agentId: string };
  return <LabelingWorkspace key={`${tenantId}:${agentId}`} tenantId={tenantId} agentId={agentId} />;
}

function LabelingWorkspace({ tenantId, agentId }: { tenantId: string; agentId: string }) {
  const fixture = labelingFixtureFor(agentId);
  const [limit, setLimit] = useState(QUEUE_BATCH_SIZE);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [goldensCount, setGoldensCount] = useState(fixture.goldensCount);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const shouldFocus = useRef(false);
  const readiness = fixture.readiness;
  const allItems = fixture.queue.slice(0, limit);
  const queue = allItems.filter((item) => !savedIds.has(item.traceId));
  const selected = queue.find((item) => item.traceId === selectedId) ?? queue[0];
  const index = queue.findIndex((item) => item.traceId === selected?.traceId);
  const draft = (selected && drafts[selected.traceId]) || EMPTY_DRAFT;
  const changeDraft = (patch: Partial<Draft>) => {
    if (!selected) return;
    setDrafts((previous) => ({ ...previous, [selected.traceId]: { ...(previous[selected.traceId] ?? EMPTY_DRAFT), ...patch } }));
  };
  const choose = (id: string) => {
    shouldFocus.current = true;
    setSelectedId(id);
    setSaveError(null);
  };
  useEffect(() => {
    if (shouldFocus.current && selected) {
      detailRef.current?.scrollIntoView?.({ block: "start", behavior: "instant" });
      detailRef.current?.focus({ preventScroll: true });
      shouldFocus.current = false;
    }
  }, [selected]);

  const submitLabel = (body: LabelDecisionIn) => {
    setIsSaving(true);
    setSaveError(null);
    setTimeout(() => {
      const savedIndex = queue.findIndex((item) => item.traceId === body.traceId);
      setSavedIds((previous) => new Set([...previous, body.traceId]));
      setDrafts((previous) => {
        const next = { ...previous };
        delete next[body.traceId];
        return next;
      });
      shouldFocus.current = true;
      setSelectedId(queue[savedIndex + 1]?.traceId ?? queue[savedIndex - 1]?.traceId ?? null);
      setGoldensCount((n) => n + 1);
      setIsSaving(false);
      toast.success("Label saved. Moving to the next interaction.");
    }, 350);
  };
  const submit = () => {
    if (!selected || !draft.verdict || isSaving) return;
    const tools = draft.expectedTools.split(",").map((tool) => tool.trim()).filter(Boolean);
    submitLabel({
      traceId: selected.traceId,
      decision: draft.verdict === "correct" ? "confirm" : "override",
      ...(draft.verdict === "incorrect" ? { verdict: "incorrect" as const } : {}),
      expectedOutput: draft.expectedOutput.trim() || undefined,
      expectedOutcome: draft.expectedOutcome.trim() || undefined,
      expectedTools: tools.length ? tools : undefined,
      note: draft.note.trim() || undefined,
    });
  };
  const canLoadMore = allItems.length >= limit && limit < MAX_LOADED && limit < fixture.queue.length;
  const loadMore = (surface: string) => canLoadMore ? <Button onClick={() => setLimit((n) => Math.min(n + QUEUE_BATCH_SIZE, MAX_LOADED))} disabled={isSaving} data-testid={`label-load-more-${surface}`}>Load more interactions</Button> : null;

  return (
    <Stack spacing={3} sx={{ px: { xs: 2, md: 4 }, py: 3 }}>
      <Box>
        <Typography variant="h6">Labeling queue</Typography>
        <Typography variant="body2" color="text.secondary" data-testid="label-queue-count">
          {readiness.ready ? `${queue.length} loaded for review` : "Waiting for more captured interactions"}
          {` · ${goldensCount} reference labels saved`}
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary">
        Review the interaction, choose whether the response is correct, then save.
        Labels also apply to other interactions with the same resolved input, including conversations with the same final user message.
      </Typography>
      {!readiness.ready ? (
        <Alert severity="info">Labeling unlocks at {readiness.threshold} captured interactions — currently {readiness.captured}.</Alert>
      ) : !selected ? (
        <EmptyState
          icon={IconMaterialSymbolsCheck} title="No interactions available for review"
          description="No unlabeled interactions were returned. Refresh to check for more."
          action={<Button onClick={() => setSavedIds(new Set())} data-testid="label-refresh-empty">Refresh queue</Button>}
          testId="label-empty"
        />
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "260px minmax(0, 1fr)" }, gap: 3, alignItems: "start" }}>
          <Paper component="nav" aria-label="Labeling queue" variant="outlined" sx={{ display: { xs: "none", md: "block" }, position: "sticky", top: 16, maxHeight: "75vh", overflowY: "auto" }}>
            {queue.map((item, itemIndex) => <ListItemButton component="button" key={item.traceId} selected={item.traceId === selected.traceId} aria-current={item.traceId === selected.traceId ? "true" : undefined}
              disabled={isSaving} onClick={() => choose(item.traceId)} data-testid={`label-queue-item-${item.traceId}`}
              sx={{ width: "100%", textAlign: "left", p: 2, borderBottom: 1, borderColor: "divider" }}>
              <Stack spacing={1} sx={{ minWidth: 0 }}>
                <Typography variant="caption" color="text.secondary">Interaction {itemIndex + 1}</Typography>
                <Typography variant="body2" sx={{ overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflowWrap: "anywhere" }}>{inputPreview(item.input)}</Typography>
                <Box><Chip tint={drafts[item.traceId] ? "warning" : "muted"}>{drafts[item.traceId] ? "Draft" : "To review"}</Chip></Box>
              </Stack>
            </ListItemButton>)}
            {loadMore("desktop")}
          </Paper>
          <Box sx={{ minWidth: 0 }}>
            <Box sx={{ display: { xs: "block", md: "none" }, mb: 2 }}>
              <TextField select label="Interaction to review" fullWidth value={selected.traceId} disabled={isSaving} onChange={(e) => choose(e.target.value)}
                slotProps={{ select: { native: true }, htmlInput: { "data-testid": "label-queue-select" } }}>
                {queue.map((item, itemIndex) => <option key={item.traceId} value={item.traceId}>{itemIndex + 1}. {inputPreview(item.input).slice(0, 100)}</option>)}
              </TextField>
              {loadMore("mobile")}
            </Box>
            <Stack spacing={2.5} ref={detailRef} tabIndex={-1} data-testid="label-selected-detail" sx={{ scrollMarginTop: 24 }}>
              <Typography variant="h6">Interaction {index + 1} of {queue.length} loaded</Typography>
              <TraceLink item={selected} tenantId={tenantId} agentId={agentId} />
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", lg: "repeat(2, minmax(0, 1fr))" }, gap: 2 }}>
                <InteractionContent key={`${selected.traceId}-input`} label="Input" value={selected.input} />
                <InteractionContent key={`${selected.traceId}-output`} label="Output" value={selected.output} />
              </Box>
              {selected.proposedVerdict || selected.proposedReason ? <Alert severity="info">
                Suggested judgment: {selected.proposedVerdict ?? "Not provided"}. {selected.proposedReason}
              </Alert> : null}
              <Paper component="form" variant="outlined" onSubmit={(e) => { e.preventDefault(); submit(); }} sx={{ p: { xs: 2, md: 3 }, maxWidth: 1024 }}>
                <Box component="fieldset" disabled={isSaving} sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}>
                  <Typography component="legend" variant="h6" sx={{ mb: 2 }}>Your judgment</Typography>
                  <RadioCards items={[{ value: "correct", label: "Mark correct", description: "The response is acceptable for this input." }, { value: "incorrect", label: "Mark incorrect", description: "The response needs correction." }]}
                    value={draft.verdict || undefined} disabled={isSaving} testIdPrefix="label-verdict"
                    onValueChange={(verdict) => changeDraft({ verdict: verdict as Draft["verdict"], expanded: verdict === "incorrect" || draft.expanded })} />
                  <Accordion expanded={draft.expanded} onChange={(_event, expanded) => changeDraft({ expanded })} disableGutters elevation={0} sx={{ mt: 2, "&:before": { display: "none" } }}>
                    <AccordionSummary expandIcon={<IconMaterialSymbolsKeyboardArrowDown fontSize="small" />} data-testid="label-expectations-toggle"><Typography variant="subtitle2">Expected behavior and note (optional)</Typography></AccordionSummary>
                    <AccordionDetails>
                      <Stack spacing={2}>
                        <Typography variant="body2" color="text.secondary">Describe the reference answer or outcome yourself. The agent’s output is never copied into these fields automatically.</Typography>
                        <TextField label="Expected output (optional)" multiline minRows={3} fullWidth value={draft.expectedOutput} onChange={(e) => changeDraft({ expectedOutput: e.target.value })} slotProps={{ htmlInput: { "data-testid": "label-expected-output" } }} />
                        <TextField label="Expected outcome (optional)" helperText="What should happen beyond the response wording?" multiline minRows={2} fullWidth value={draft.expectedOutcome} onChange={(e) => changeDraft({ expectedOutcome: e.target.value })} slotProps={{ htmlInput: { "data-testid": "label-expected-outcome" } }} />
                        <TextField label="Expected tools (optional)" helperText="Separate tool names with commas." fullWidth value={draft.expectedTools} onChange={(e) => changeDraft({ expectedTools: e.target.value })} slotProps={{ htmlInput: { "data-testid": "label-expected-tools" } }} />
                        <TextField label="Note (optional)" multiline minRows={2} fullWidth value={draft.note} onChange={(e) => changeDraft({ note: e.target.value })} slotProps={{ htmlInput: { "data-testid": "label-note" } }} />
                      </Stack>
                    </AccordionDetails>
                  </Accordion>
                </Box>
                {saveError ? <Alert severity="error" data-testid="label-save-error" sx={{ mt: 2 }}>{saveError} Your draft has been kept.</Alert> : null}
                <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 2, mt: 2 }}>
                  <Button type="submit" variant="contained" disabled={!draft.verdict || isSaving} data-testid="label-save-next">{isSaving ? "Saving…" : "Save and next"}</Button>
                  <Typography variant="caption" color="text.secondary">Drafts are kept while switching between interactions on this page.</Typography>
                </Box>
              </Paper>
            </Stack>
          </Box>
        </Box>
      )}
    </Stack>
  );
}

function TraceLink({ item, tenantId, agentId }: { item: LabelingProposal; tenantId: string; agentId: string }) {
  return item.timestamp ? <Button component={RouterLink} to={`/tenants/${tenantId}/agents/${agentId}/traces/${item.traceId}`} search={{ timestamp: item.timestamp } as never} data-testid="label-view-trace" sx={{ alignSelf: "flex-start" }}>View full trace</Button>
    : <Typography variant="caption" color="text.secondary">Full trace link unavailable: capture time is missing.</Typography>;
}
