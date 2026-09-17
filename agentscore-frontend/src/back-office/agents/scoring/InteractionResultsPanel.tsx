import { useMemo, useState } from "react";
import { useFakeQuery as useQuery, type FakeQueryResult as UseQueryResult } from "@/back-office/agents/fake-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Link as RouterLink } from "@tanstack/react-router";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Skeleton from "@mui/material/Skeleton";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import IconMaterialSymbolsKeyboardArrowDown from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsKeyboardArrowDown.mjs";
import IconMaterialSymbolsOpenInNew from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsOpenInNew.mjs";

import * as scoringApi from "@/back-office/agents/fake-trace-data";
import type {
  RunInteractionEvidenceFilter,
  RunInteractionSummaryOut,
} from "@/back-office/agents/fake-trace-data";
import { RunEvaluationDetail } from "./RunEvaluationDetail";
import { evaluationResultLabel } from "./result-format";
import { evalLabel } from "./run-format";
import { Chip } from "@/shared/components/chip";
import { DataTable } from "@/shared/components/data-table";
import { ErrorState } from "@/shared/components/error-state";
import { FacetedFilter } from "@/shared/components/faceted-filter";
import { JsonViewer } from "@/shared/components/json-viewer";
import { Toolbar } from "@/shared/components/toolbar";

const EVIDENCE_OPTIONS = [
  { value: "available", label: "All results available" },
  { value: "insufficient", label: "Some lack evidence" },
  { value: "missing", label: "Some results missing" },
];

const INTERACTIONS_PAGE_LIMIT = 10;

export function InteractionResultsPanel({
  tenantId,
  agentId,
  runId,
  isActive,
  interactionCount,
  evaluationResultCount,
  evaluationCount,
  evalSlugs,
  selectedInteractionRef,
  selectedVerdictId,
  onSelect,
}: {
  tenantId: string;
  agentId: string;
  runId: string;
  isActive: boolean;
  interactionCount: number;
  evaluationResultCount: number;
  evaluationCount: number;
  evalSlugs: string[];
  selectedInteractionRef?: string;
  selectedVerdictId?: string;
  onSelect: (interactionRef: string, verdictId?: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [evalSlug, setEvalSlug] = useState("");
  const [evidence, setEvidence] =
    useState<RunInteractionEvidenceFilter>("all");
  const [cursor, setCursor] = useState<string | null>(null);
  const [scannedBefore, setScannedBefore] = useState(0);
  const [previousPages, setPreviousPages] = useState<
    { cursor: string | null; scannedBefore: number }[]
  >([]);

  const resetPagination = () => {
    setCursor(null);
    setScannedBefore(0);
    setPreviousPages([]);
  };

  const interactionsQuery = useQuery({
    queryKey: ["run-interactions", tenantId, agentId, runId, cursor, search, evalSlug, evidence],
    queryFn: () =>
      scoringApi.listRunInteractions(runId, {
        cursor,
        limit: INTERACTIONS_PAGE_LIMIT,
        search: search.trim(),
        evalSlug: evalSlug || undefined,
        evidence,
      }),
    refetchInterval: isActive ? 2000 : false,
  });
  const interactions = interactionsQuery.data?.items ?? [];
  const effectiveInteractionRef =
    selectedInteractionRef ?? interactions[0]?.interactionRef ?? null;
  const detailQuery = useQuery({
    queryKey: ["run-interaction", tenantId, agentId, runId, effectiveInteractionRef],
    queryFn: () => scoringApi.getRunInteraction(runId, effectiveInteractionRef ?? ""),
    enabled: effectiveInteractionRef != null,
    refetchInterval: isActive ? 2000 : false,
  });

  const columns = useMemo<ColumnDef<RunInteractionSummaryOut, unknown>[]>(
    () => [
      {
        id: "interaction",
        header: "Interaction",
        meta: { headerSx: { width: "64%" }, cellSx: { width: "64%" } },
        cell: ({ row }) => {
          const item = row.original;
          return (
            <Button
              variant="text"
              aria-pressed={item.interactionRef === effectiveInteractionRef}
              onClick={(event) => {
                event.stopPropagation();
                onSelect(item.interactionRef);
              }}
              data-testid={`run-interaction-select-${item.id}`}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                minWidth: 0,
                maxWidth: "100%",
                textAlign: "left",
                textTransform: "none",
                bgcolor:
                  item.interactionRef === effectiveInteractionRef
                    ? "action.selected"
                    : undefined,
              }}
            >
              <Box
                component="span"
                sx={{
                  typography: "body2",
                  color: "text.primary",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: "100%",
                }}
              >
                {item.inputPreview.availability === "missing"
                  ? "Input unavailable"
                  : item.inputPreview.value === null
                    ? "Input recorded as null"
                    : item.inputPreview.value}
              </Box>
              <Box
                component="span"
                sx={{ typography: "caption", color: "text.secondary", fontFamily: "monospace" }}
              >
                {item.interactionRef}
                {item.inputPreview.truncated ? " · preview truncated" : ""}
              </Box>
            </Button>
          );
        },
      },
      {
        id: "coverage",
        header: "Results available",
        meta: { headerSx: { width: "36%" }, cellSx: { width: "36%" } },
        cell: ({ row }) => (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
            <Typography variant="body2">
              {row.original.verdictCount} of {row.original.expectedCount}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {row.original.scoredCount} scored ·{" "}
              {row.original.insufficientEvidenceCount} insufficient evidence
            </Typography>
          </Box>
        ),
      },
    ],
    [effectiveInteractionRef, onSelect],
  );

  const page = interactionsQuery.data;
  const isSearching = search.trim().length > 0;
  const examinedCount = scannedBefore + (page?.scannedCount ?? 0);
  const goNext = () => {
    if (!page?.nextCursor) return;
    setPreviousPages((current) => [...current, { cursor, scannedBefore }]);
    setScannedBefore(examinedCount);
    setCursor(page.nextCursor);
  };
  const goPrevious = () => {
    setPreviousPages((current) => {
      const next = [...current];
      const previous = next.pop();
      setCursor(previous?.cursor ?? null);
      setScannedBefore(previous?.scannedBefore ?? 0);
      return next;
    });
  };
  const pagination = {
    mode: "cursor" as const,
    total: page?.total ?? 0,
    hasNext: page?.nextCursor != null,
    hasPrev: previousPages.length > 0,
    onNext: goNext,
    onPrev: goPrevious,
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }} data-testid="run-interaction-results">
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
          border: 1,
          borderColor: "divider",
          borderRadius: 1,
          overflow: "hidden",
        }}
        data-testid="run-interaction-summary"
      >
        <SummaryStat
          value={interactionCount}
          label={interactionCount === 1 ? "interaction" : "interactions"}
          divider
          testId="run-interaction-summary-count"
        />
        <SummaryStat
          value={evaluationResultCount}
          label="evaluation results"
          divider
          testId="run-interaction-summary-results"
        />
        <SummaryStat
          value={evaluationCount}
          label={evaluationCount === 1 ? "evaluation" : "evaluations"}
          suffix="per interaction"
          testId="run-interaction-summary-evaluations"
        />
      </Box>
      <Typography variant="body2" color="text.secondary">
        Each row is one interaction included in this scoring run.
      </Typography>
      <Toolbar
        search={
          <TextField
            fullWidth
            size="small"
            label="Search interactions"
            placeholder="Search input or interaction ID"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              resetPagination();
            }}
            slotProps={{ htmlInput: { "data-testid": "search-run-interactions" } }}
          />
        }
        filters={
          <>
            <FacetedFilter
              title="Evaluation"
              testId="filter-run-interaction-evaluation"
              options={evalSlugs.map((slug) => ({
                value: slug,
                label: evalLabel(slug),
              }))}
              values={evalSlug ? [evalSlug] : []}
              onChange={(values) => {
                setEvalSlug(values.at(-1) ?? "");
                resetPagination();
              }}
            />
            <FacetedFilter
              title="Result"
              testId="filter-run-interaction-result"
              options={EVIDENCE_OPTIONS}
              values={evidence === "all" ? [] : [evidence]}
              onChange={(values) => {
                setEvidence(
                  (values.at(-1) as RunInteractionEvidenceFilter | undefined) ?? "all",
                );
                resetPagination();
              }}
            />
          </>
        }
      />

      {interactionsQuery.isError && interactionsQuery.data ? (
        <Alert severity="warning" data-testid="run-interactions-stale">
          Showing previously loaded interactions. Refreshing the list failed.
        </Alert>
      ) : null}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "minmax(0, 1fr)", lg: "minmax(0, 3fr) minmax(20rem, 2fr)" },
          gap: 2,
          alignItems: "start",
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          {isSearching &&
          !interactionsQuery.isLoading &&
          !interactionsQuery.isError &&
          interactions.length === 0 ? (
            <SearchScanState
              examinedCount={examinedCount}
              hasNext={page?.nextCursor != null}
              hasPrevious={previousPages.length > 0}
              onNext={goNext}
              onPrevious={goPrevious}
            />
          ) : (
            <DataTable
              columns={columns}
              data={interactions}
              isLoading={interactionsQuery.isLoading}
              error={
                interactionsQuery.isError && !interactionsQuery.data
                  ? (interactionsQuery.error as Error)
                  : null
              }
              emptyState={{
                title: "No interactions found",
                description: "Change the search or filters to broaden the result set.",
                testId: "run-interactions-empty",
              }}
              pagination={isSearching ? undefined : pagination}
              onRowClick={(item) => onSelect(item.interactionRef)}
              getRowId={(item) => item.id}
              getRowTestId={(item) => `run-interaction-row-${item.id}`}
              tableSx={{
                tableLayout: "fixed",
                "& .MuiTableCell-root": { py: 0.5 },
              }}
            />
          )}
          {isSearching && interactions.length > 0 ? (
            <SearchScanPagination
              examinedCount={examinedCount}
              hasNext={page?.nextCursor != null}
              hasPrevious={previousPages.length > 0}
              onNext={goNext}
              onPrevious={goPrevious}
            />
          ) : null}
        </Box>
        <InteractionDetail
          query={detailQuery}
          hasSelection={effectiveInteractionRef != null}
          tenantId={tenantId}
          agentId={agentId}
          selectedVerdictId={selectedVerdictId}
          onSelectVerdict={(verdictId) =>
            effectiveInteractionRef && onSelect(effectiveInteractionRef, verdictId)
          }
          onClearVerdict={() =>
            effectiveInteractionRef && onSelect(effectiveInteractionRef)
          }
        />
      </Box>
    </Box>
  );
}

function InteractionDetail({
  query,
  hasSelection,
  tenantId,
  agentId,
  selectedVerdictId,
  onSelectVerdict,
  onClearVerdict,
}: {
  query: UseQueryResult<scoringApi.RunInteractionDetailOut>;
  hasSelection: boolean;
  tenantId: string;
  agentId: string;
  selectedVerdictId?: string;
  onSelectVerdict: (verdictId: string) => void;
  onClearVerdict: () => void;
}) {
  if (!hasSelection) return null;
  if (query.isLoading) {
    return <Skeleton variant="rounded" sx={{ height: 384 }} data-testid="run-interaction-detail-loading" />;
  }
  if (query.isError || !query.data) {
    return (
      <Card variant="outlined">
        <CardContent>
          <ErrorState
            title="Failed to load interaction"
            message={(query.error as Error | null)?.message ?? "Select an interaction to inspect it."}
          />
        </CardContent>
      </Card>
    );
  }

  const detail = query.data;
  const selectedEvaluation = selectedVerdictId
    ? detail.evaluations.find((evaluation) => evaluation.id === selectedVerdictId) ??
      null
    : detail.evaluations[0] ?? null;
  const selectedVerdictUnavailable =
    selectedVerdictId != null && selectedEvaluation == null;
  const evaluationColumns: ColumnDef<scoringApi.RunInteractionEvaluationOut, unknown>[] = [
    {
      id: "evaluation",
      header: "Evaluation",
      cell: ({ row }) => (
        <Button
          variant="text"
          aria-pressed={row.original.id === selectedEvaluation?.id}
          onClick={(event) => {
            event.stopPropagation();
            onSelectVerdict(row.original.id);
          }}
          data-testid={`run-interaction-evaluation-${row.original.id}`}
          sx={{
            textTransform: "none",
            textAlign: "left",
            bgcolor:
              row.original.id === selectedEvaluation?.id
                ? "action.selected"
                : undefined,
          }}
        >
          {evalLabel(row.original.evalSlug)}
        </Button>
      ),
    },
    {
      id: "result",
      header: "Result",
      cell: ({ row }) => <Chip tint="default">{evaluationResultLabel(row.original.score)}</Chip>,
    },
    {
      id: "score",
      header: "Score",
      cell: ({ row }) => (row.original.score == null ? "—" : row.original.score.toFixed(2)),
    },
  ];

  return (
    <Card variant="outlined" data-testid="run-interaction-detail">
      <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Box
          sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography component="h3" variant="h5">
              Interaction details
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }}>
              {detail.interactionRef}
            </Typography>
          </Box>
          {detail.traceNavigationRef.timestamp ? (
            <Button
              component={RouterLink}
              to="/tenants/$tenantId/agents/$agentId/traces/$traceId"
              params={{
                tenantId,
                agentId,
                traceId: detail.traceNavigationRef.traceId,
              } as never}
              search={{ timestamp: detail.traceNavigationRef.timestamp } as never}
              size="small"
              variant="text"
              endIcon={<IconMaterialSymbolsOpenInNew sx={{ fontSize: 14 }} />}
              data-testid="run-interaction-open-trace"
            >
              Open trace
            </Button>
          ) : null}
        </Box>

        <InteractionValue label="Input" content={detail.input} />
        <Accordion disableGutters elevation={0} variant="outlined">
          <AccordionSummary
            expandIcon={<IconMaterialSymbolsKeyboardArrowDown sx={{ fontSize: 16 }} />}
            data-testid="run-interaction-output-toggle"
          >
            <Typography variant="subtitle2">Output</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <InteractionValue label="Output" content={detail.output} hideLabel />
          </AccordionDetails>
        </Accordion>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
          <Typography component="h4" variant="h6">
            Evaluation results
          </Typography>
          <DataTable
            columns={evaluationColumns}
            data={detail.evaluations}
            enableSorting={false}
            getRowId={(evaluation) => evaluation.id}
            getRowTestId={(evaluation) => `run-interaction-evaluation-row-${evaluation.id}`}
            emptyState={{
              title: "No evaluation results",
              description: "No evaluation result was recorded for this interaction.",
              testId: "run-interaction-evaluations-empty",
            }}
            tableSx={{
              tableLayout: "fixed",
              "& .MuiTableCell-root": { py: 0.5 },
            }}
          />
        </Box>

        {selectedVerdictUnavailable ? (
          <Alert
            severity="warning"
            action={
              <Button
                color="inherit"
                size="small"
                onClick={onClearVerdict}
                data-testid="run-evaluation-selection-clear"
              >
                Show available result
              </Button>
            }
            data-testid="run-evaluation-selection-unavailable"
          >
            The selected evaluation result is unavailable for this interaction.
          </Alert>
        ) : null}

        {selectedEvaluation ? (
          <RunEvaluationDetail
            evaluation={selectedEvaluation}
            interactionRef={detail.interactionRef}
            traceNavigationRef={detail.traceNavigationRef}
            tenantId={tenantId}
            agentId={agentId}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}

function InteractionValue({
  label,
  content,
  hideLabel = false,
}: {
  label: string;
  content: scoringApi.RunInteractionValueOut;
  hideLabel?: boolean;
}) {
  const structuredValue =
    content.availability === "available" && content.value != null
      ? parseStructuredValue(content.value)
      : null;
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
      {hideLabel ? null : <Typography variant="subtitle2">{label}</Typography>}
      {content.availability === "missing" ? (
        <Typography variant="body2" color="text.secondary" data-testid={`run-interaction-${label.toLowerCase()}-missing`}>
          {label} is unavailable for this scoring run.
        </Typography>
      ) : content.value === null ? (
        <Typography variant="body2" color="text.secondary" data-testid={`run-interaction-${label.toLowerCase()}-null`}>
          {label} was recorded as null.
        </Typography>
      ) : structuredValue != null ? (
        <JsonViewer value={structuredValue} defaultExpandDepth={2} />
      ) : (
        <Typography
          variant="body2"
          sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
          data-testid={`run-interaction-${label.toLowerCase()}-value`}
        >
          {content.value}
        </Typography>
      )}
    </Box>
  );
}

function parseStructuredValue(value: string): object | unknown[] | null {
  const trimmed = value.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return null;
  try {
    const parsed: unknown = JSON.parse(trimmed);
    return typeof parsed === "object" && parsed !== null ? parsed : null;
  } catch {
    return null;
  }
}

function SummaryStat({
  value,
  label,
  suffix,
  divider = false,
  testId,
}: {
  value: number;
  label: string;
  suffix?: string;
  divider?: boolean;
  testId: string;
}) {
  return (
    <Box
      sx={{
        px: 2,
        py: 1.5,
        borderRight: { xs: 0, md: divider ? 1 : 0 },
        borderBottom: { xs: divider ? 1 : 0, md: 0 },
        borderColor: "divider",
      }}
      data-testid={testId}
    >
      <Typography component="span" variant="h6">
        {value}
      </Typography>{" "}
      <Typography component="span" variant="body2">
        {label}
        {suffix ? ` ${suffix}` : ""}
      </Typography>
    </Box>
  );
}

function SearchScanState({
  examinedCount,
  hasNext,
  hasPrevious,
  onNext,
  onPrevious,
}: {
  examinedCount: number;
  hasNext: boolean;
  hasPrevious: boolean;
  onNext: () => void;
  onPrevious: () => void;
}) {
  return (
    <Card variant="outlined" data-testid="run-interactions-search-scan-empty">
      <CardContent sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        <Typography component="h3" variant="h6">
          {hasNext ? "No matches in this batch" : "No matching interactions"}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {hasNext
            ? `${examinedCount} interactions examined so far. Continue searching the remaining interactions.`
            : `Search complete after examining ${examinedCount} interactions.`}
        </Typography>
        <SearchScanPagination
          examinedCount={examinedCount}
          hasNext={hasNext}
          hasPrevious={hasPrevious}
          onNext={onNext}
          onPrevious={onPrevious}
        />
      </CardContent>
    </Card>
  );
}

function SearchScanPagination({
  examinedCount,
  hasNext,
  hasPrevious,
  onNext,
  onPrevious,
}: {
  examinedCount: number;
  hasNext: boolean;
  hasPrevious: boolean;
  onNext: () => void;
  onPrevious: () => void;
}) {
  return (
    <Box
      sx={{
        mt: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1,
      }}
    >
      <Typography variant="caption" color="text.secondary" aria-live="polite">
        {examinedCount} interactions examined
      </Typography>
      <Box sx={{ display: "flex", gap: 1 }}>
        <Button
          size="small"
          variant="outlined"
          disabled={!hasPrevious}
          onClick={onPrevious}
          data-testid="run-interactions-search-previous"
        >
          Previous batch
        </Button>
        <Button
          size="small"
          variant="outlined"
          disabled={!hasNext}
          onClick={onNext}
          data-testid="run-interactions-continue-search"
        >
          Continue search
        </Button>
      </Box>
    </Box>
  );
}
