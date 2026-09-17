import { useRef } from "react";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Link as RouterLink } from "@tanstack/react-router";
import IconMaterialSymbolsLightbulb from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsLightbulb.mjs";
import IconMaterialSymbolsRefresh from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsRefresh.mjs";

import type {
  AdvisorRequestOut,
  AdvisorRunOut,
} from "@/back-office/agents/scoring-api";
import { AdvisorReadError } from "@/back-office/agents/scoring-api";
import {
  advisorRequestStateLabel,
  advisorRequestTint,
  advisorStatusLabel,
  advisorStatusTint,
} from "@/back-office/agents/scoring/advisor-status";
import { AdviceBasis, RecommendationList } from "@/back-office/agents/scoring/RecommendationList";
import {
  type AdviceMode,
  type AdviceSelection,
  useAdviceLifecycle,
} from "@/back-office/agents/scoring/useAdviceLifecycle";
import { Chip } from "@/shared/components/chip";
import { EmptyState } from "@/shared/components/empty-state";
import { Eyebrow } from "@/shared/components/eyebrow";

function formatTime(value: string | null | undefined): string | null {
  return value ? new Date(value).toLocaleString() : null;
}

function sourceLink(
  tenantId: string,
  agentId: string,
  scoringRunId: string,
  testId: string,
) {
  return (
    <Button
      component={RouterLink}
      to="/tenants/$tenantId/agents/$agentId/runs/$runId"
      params={{ tenantId, agentId, runId: scoringRunId } as never}
      variant="text"
      size="small"
      data-testid={testId}
    >
      Scoring run {scoringRunId.slice(0, 8)}…
    </Button>
  );
}

function requestCopy(request: AdvisorRequestOut): {
  title: string;
  detail: string | null;
} {
  if (request.state === "running") {
    if (request.stage === "preparing_evidence") {
      return {
        title: "Preparing evidence",
        detail: "Gathering scoring results and prior advice.",
      };
    }
    if (request.stage === "generating_recommendations") {
      return {
        title: "Generating recommendations",
        detail: "Reviewing the available evidence.",
      };
    }
    if (request.stage === "checking_citations") {
      return {
        title: "Checking citations",
        detail: "Checking recommendation references.",
      };
    }
    if (request.stage === "saving_advice") {
      return { title: "Saving advice", detail: null };
    }
    return { title: "Working", detail: null };
  }
  if (request.state === "queued") {
    return {
      title: "Waiting to start",
      detail: "Your request is saved. You can leave this page and return.",
    };
  }
  if (request.state === "retry_scheduled") {
    const retryAt = formatTime(request.nextRetryAt);
    const retryPending =
      request.nextRetryAt != null &&
      new Date(request.nextRetryAt).getTime() > Date.now();
    return {
      title: "Retry scheduled",
      detail: retryAt && retryPending
        ? `${request.errorMessage ?? "The last attempt did not finish."} Next attempt ${retryAt}.`
        : `${request.errorMessage ?? "The last attempt did not finish."} Waiting for a worker to retry.`,
    };
  }
  if (request.state === "failed") {
    return {
      title: "Advice could not be completed",
      detail: request.errorMessage,
    };
  }
  if (request.state === "cancelled") {
    return { title: "Advice request cancelled", detail: request.errorMessage };
  }
  return { title: "Advice ready", detail: null };
}

function RequestStatus({
  request,
  prefix,
  insufficientEvidence,
}: {
  request: AdvisorRequestOut;
  prefix: string;
  insufficientEvidence: boolean;
}) {
  const copy = requestCopy(request);
  if (insufficientEvidence && request.state === "succeeded") {
    copy.title = "Not enough evidence";
  }
  return (
    <Card variant="outlined" data-testid={`${prefix}-status`}>
      <CardContent>
        <Stack spacing={1}>
          <Typography
            variant="subtitle2"
            component="div"
            role="status"
            aria-live="polite"
            aria-atomic="true"
            data-testid={request.state === "running" ? `${prefix}-stage` : undefined}
          >
            {copy.title}
          </Typography>
          {copy.detail ? (
            <Typography variant="body2" color="text.secondary">
              {copy.detail}
            </Typography>
          ) : null}
          {request.errorCode ? (
            <Typography variant="caption" color="text.secondary">
              Error code: {request.errorCode}
            </Typography>
          ) : null}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            {request.stageUpdatedAt ? (
              <Typography variant="caption" color="text.secondary">
                Stage updated {formatTime(request.stageUpdatedAt)}
              </Typography>
            ) : null}
            {request.finishedAt ? (
              <Typography variant="caption" color="text.secondary">
                Completed {formatTime(request.finishedAt)}
              </Typography>
            ) : null}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

function RequestHistory({
  requests,
  runs,
  tenantId,
  agentId,
  prefix,
  onSelect,
  hasMore,
  onLoadMore,
  selectedJobId,
  compact,
}: {
  selectedJobId: string | null;
  compact: boolean;
  requests: AdvisorRequestOut[];
  runs: AdvisorRunOut[];
  tenantId: string;
  agentId: string;
  prefix: string;
  onSelect: (jobId: string) => void;
  hasMore: boolean;
  onLoadMore: () => void;
}) {
  if (requests.length === 0 && !hasMore) return null;
  const selectedIndex = requests.findIndex((request) => request.jobId === selectedJobId);
  return (
    <Stack spacing={1.5} data-testid={`${prefix}-history`}>
      <Typography variant="h6">Advice history</Typography>
      {compact ? (
        <TextField select fullWidth size="small" label="Advice request"
          value={selectedIndex >= 0 ? selectedJobId : ""}
          onChange={(event) => onSelect(event.target.value)}>
          <MenuItem value="" disabled>Select a request</MenuItem>
          {requests.map((request) => (
            <MenuItem key={request.jobId} value={request.jobId}>
              {formatTime(request.createdAt)} · {advisorRequestStateLabel(request.state)}
            </MenuItem>
          ))}
        </TextField>
      ) : null}
      {(compact ? requests.filter((request) => request.jobId === selectedJobId) : requests).map((request) => (
        <Card key={request.jobId} variant="outlined" sx={{ borderColor: request.jobId === selectedJobId ? "primary.main" : "divider", backgroundColor: request.jobId === selectedJobId ? "action.selected" : "background.paper" }}>
          <CardActionArea
            onClick={() => onSelect(request.jobId)}
            aria-pressed={request.jobId === selectedJobId}
            data-testid={`${prefix}-history-request-${request.jobId}`}
            sx={{ textAlign: "left" }}
          >
            <CardContent>
              <Stack spacing={1}>
                <Typography variant="caption" color="text.secondary">
                  Requested {formatTime(request.createdAt)}
                </Typography>
                <Box
                  data-testid={
                    request.jobId === selectedJobId &&
                    request.state === "succeeded"
                      ? `${prefix}-status`
                      : undefined
                  }
                >
                  <Chip tint={advisorRequestTint(request.state)}>
                    {request.state === "succeeded" &&
                    runs.some(
                      (run) =>
                        run.jobId === request.jobId &&
                        run.finalizationRecorded &&
                        run.insufficientEvidenceReason != null,
                    )
                      ? "Not enough evidence"
                      : advisorRequestStateLabel(request.state)}
                  </Chip>
                </Box>
                {request.finishedAt ? (
                  <Typography variant="caption" color="text.secondary">
                    Completed {formatTime(request.finishedAt)}
                  </Typography>
                ) : null}
                {runs
                  .filter(
                    (run) =>
                      run.jobId === request.jobId &&
                      run.finalizationRecorded &&
                      run.adviceFinalizedAt != null,
                  )
                  .slice(0, 1)
                  .map((run) => (
                    <AdviceBasis
                      key={run.id}
                      run={run}
                      tenantId={tenantId}
                      agentId={agentId}
                      showSourceLink={false}
                    />
                  ))}
              </Stack>
            </CardContent>
          </CardActionArea>
          <CardContent sx={{ pt: 0 }}>
            {sourceLink(
              tenantId,
              agentId,
              request.scoringRunId,
              `${prefix}-history-source-${request.jobId}`,
            )}
            {runs.filter((run) => run.jobId === request.jobId).length > 1 ? (
              <Box component="details" sx={{ mt: 1 }}>
                <Box
                  component="summary"
                  data-testid={`${prefix}-attempts-${request.jobId}`}
                  sx={{ typography: "body2" }}
                >
                  Attempt history
                </Box>
                <Stack spacing={0.5} sx={{ mt: 0.75 }}>
                  {runs
                    .filter((run) => run.jobId === request.jobId)
                    .map((run) => (
                      <Typography key={run.id} variant="caption" color="text.secondary">
                        {advisorStatusLabel(run.status)} · {formatTime(run.endedAt) ?? "time unavailable"}
                      </Typography>
                    ))}
                </Stack>
              </Box>
            ) : null}
          </CardContent>
        </Card>
      ))}
      {hasMore ? (
        <Button
          variant="text"
          onClick={onLoadMore}
          data-testid={`${prefix}-history-load-more`}
        >
          Load more requests
        </Button>
      ) : null}
    </Stack>
  );
}

function EarlierAdvice({
  runs,
  tenantId,
  agentId,
  prefix,
  hasMore,
  onLoadMore,
}: {
  runs: AdvisorRunOut[];
  tenantId: string;
  agentId: string;
  prefix: string;
  hasMore: boolean;
  onLoadMore: () => void;
}) {
  const legacy = runs.filter((run) => !run.finalizationRecorded && run.jobId == null);
  if (legacy.length === 0 && !hasMore) return null;
  return (
    <Stack spacing={1} data-testid={`${prefix}-earlier-advice`}>
      <Eyebrow>Earlier advice</Eyebrow>
      {legacy.map((run) => (
        <Box
          component="details"
          key={run.id}
          data-testid={`${prefix}-earlier-result-${run.id}`}
        >
          <Box component="summary" data-testid={`${prefix}-runtime-${run.id}`}>
            <Chip tint={advisorStatusTint(run.status)}>
              {advisorStatusLabel(run.status)}
            </Chip>{" "}
            <Typography component="span" variant="body2">
              Finalization not recorded · {formatTime(run.endedAt) ?? "time unavailable"}
            </Typography>
          </Box>
          <Alert severity="warning" sx={{ mt: 1 }}>
            This advice predates request finalization records. Its runtime outcome
            and citations are shown as retained.
          </Alert>
          <Box sx={{ mt: 1 }}>
            <RecommendationList run={run} tenantId={tenantId} agentId={agentId} />
          </Box>
        </Box>
      ))}
      {hasMore ? (
        <Button
          variant="text"
          onClick={onLoadMore}
          data-testid={`${prefix}-runtime-load-more`}
        >
          Load more earlier advice
        </Button>
      ) : null}
    </Stack>
  );
}

function RetainedAdvice({
  requests,
  runs,
  prefix,
  onSelect,
}: {
  requests: AdvisorRequestOut[];
  runs: AdvisorRunOut[];
  prefix: string;
  onSelect: (jobId: string) => void;
}) {
  const requestIds = new Set(requests.map((request) => request.jobId));
  const retained = runs.filter(
    (run) =>
      run.finalizationRecorded &&
      run.adviceFinalizedAt != null &&
      run.jobId != null &&
      !requestIds.has(run.jobId),
  );
  if (retained.length === 0) return null;
  return (
    <Stack spacing={1} data-testid={`${prefix}-retained-advice`}>
      <Eyebrow>Retained advice</Eyebrow>
      {retained.map((run) => (
        <Card key={run.id} variant="outlined">
          <CardContent>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              alignItems={{ xs: "flex-start", sm: "center" }}
              justifyContent="space-between"
              spacing={1}
            >
              <Box>
                <Chip tint={advisorStatusTint(run.status)}>
                  {advisorStatusLabel(run.status)}
                </Chip>
                <Typography variant="caption" color="text.secondary" display="block">
                  Completed {formatTime(run.adviceFinalizedAt)}
                </Typography>
              </Box>
              <Button
                variant="outlined"
                size="small"
                onClick={() => onSelect(run.jobId as string)}
                data-testid={`${prefix}-retained-result-${run.id}`}
              >
                View retained advice
              </Button>
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}

export function AdvicePanel({
  tenantId,
  agentId,
  mode,
  surface,
  canRequest = true,
  latestScoringRunId = null,
  selection,
  onSelectionChange,
}: {
  tenantId: string;
  agentId: string;
  mode: AdviceMode;
  surface: "improve" | "run";
  canRequest?: boolean;
  latestScoringRunId?: string | null;
  selection?: AdviceSelection;
  onSelectionChange?: (selection: AdviceSelection) => void;
}) {
  const theme = useTheme();
  const compactHistory = useMediaQuery(theme.breakpoints.down("md"));
  const prefix = `advisor-${surface}`;
  const lifecycle = useAdviceLifecycle({ tenantId, agentId, mode, selection, onSelectionChange });
  const resultRef = useRef<HTMLDivElement>(null);
  const selectRequest = (jobId: string) => {
    lifecycle.selectRequest(jobId);
    resultRef.current?.scrollIntoView?.({ behavior: "auto", block: "start" });
  };
  const activeForAnotherRun =
    mode.kind === "fixed" &&
    lifecycle.activeRequest != null &&
    lifecycle.activeRequest.scoringRunId !== mode.scoringRunId;
  const otherRunActiveRequest = activeForAnotherRun
    ? lifecycle.activeRequest
    : null;
  const fixedSelectedRequest =
    mode.kind === "fixed" &&
    lifecycle.selectedRequest?.scoringRunId === mode.scoringRunId
      ? lifecycle.selectedRequest
      : mode.kind === "fixed"
        ? (lifecycle.requests.find(
            (request) => request.scoringRunId === mode.scoringRunId,
          ) ?? null)
        : null;
  const hasExplicitSelection = lifecycle.selectedJobId != null || selection?.runtimeId != null;
  const currentRequest =
    hasExplicitSelection
      ? mode.kind === "latest" ||
        lifecycle.selectedRequest?.scoringRunId === mode.scoringRunId
        ? lifecycle.selectedRequest
        : fixedSelectedRequest
      : mode.kind === "fixed"
      ? lifecycle.activeRequest?.scoringRunId === mode.scoringRunId
        ? lifecycle.activeRequest
        : fixedSelectedRequest
      : lifecycle.activeRequest ?? lifecycle.selectedRequest;
  const backgroundActiveRequest =
    hasExplicitSelection &&
    lifecycle.activeRequest != null &&
    lifecycle.activeRequest.jobId !== currentRequest?.jobId &&
    (mode.kind === "latest" ||
      lifecycle.activeRequest.scoringRunId === mode.scoringRunId)
      ? lifecycle.activeRequest
      : null;
  const historyRequests = lifecycle.requests.filter(
    (request) =>
      request.jobId !== lifecycle.activeRequest?.jobId ||
      !["queued", "running", "retry_scheduled"].includes(request.state),
  );
  const hasHistory = historyRequests.length > 0 || lifecycle.hasMoreRequests || lifecycle.runs.some(
    (run) => run.finalizationRecorded && run.jobId != null && !lifecycle.requests.some((request) => request.jobId === run.jobId),
  );
  const requestInHistory = currentRequest != null && historyRequests.some((request) => request.jobId === currentRequest.jobId);
  const resultInHistory = lifecycle.selectedResult?.jobId != null && historyRequests.some((request) => request.jobId === lifecycle.selectedResult?.jobId);
  const requestStatus = currentRequest && !(requestInHistory && currentRequest.state === "succeeded") ? (
    <RequestStatus request={currentRequest} prefix={prefix}
      insufficientEvidence={lifecycle.selectedResult?.jobId === currentRequest.jobId && lifecycle.selectedResult.insufficientEvidenceReason != null} />
  ) : null;
  const sourceRunId =
    mode.kind === "fixed"
      ? mode.scoringRunId
      : currentRequest?.scoringRunId ??
        lifecycle.selectedResult?.scoringRunId ??
        null;
  const previousAdvice = ["queued", "running", "retry_scheduled"].includes(
    currentRequest?.state ?? "",
  )
    ? lifecycle.runs.find(
        (run) =>
          run.finalizationRecorded &&
          run.adviceFinalizedAt != null &&
          run.id !== lifecycle.selectedResult?.id,
      )
    : undefined;
  const unavailable = lifecycle.selectedRequestUnavailable;
  const missingTarget = [
    "advice_target_missing",
    "advice_target_not_found",
    "run_not_found",
  ].includes(currentRequest?.errorCode ?? "");
  const isStale =
    mode.kind === "latest" &&
    lifecycle.selectedResult?.scoringRunId != null &&
    latestScoringRunId != null &&
    lifecycle.selectedResult.scoringRunId !== latestScoringRunId;
  const hasReadCache =
    lifecycle.query.data != null ||
    lifecycle.requests.length > 0 ||
    lifecycle.runs.length > 0;

  const triggerLabel =
    lifecycle.submissionState === "submitting"
      ? "Submitting request"
      : lifecycle.submissionState === "unknown"
        ? "Retry submission"
        : currentRequest?.state === "failed" || currentRequest?.state === "cancelled"
          ? "Try again"
          : lifecycle.selectedResult
            ? "Get new advice"
            : "Get advice";
  const triggerDisabled =
    lifecycle.submissionState === "submitting" ||
    lifecycle.query.isFetching ||
    (lifecycle.activeRequest != null &&
      ["queued", "running", "retry_scheduled"].includes(
        lifecycle.activeRequest.state,
      ));

  if (lifecycle.query.isLoading && !hasReadCache) {
    return (
      <Stack spacing={1} data-testid={`${prefix}-skeleton`}>
        <Skeleton variant="rounded" sx={{ height: 40, width: "45%" }} />
        <Skeleton variant="rounded" sx={{ height: 128, width: "100%" }} />
      </Stack>
    );
  }

  if (lifecycle.query.isError && !hasReadCache) {
    return (
      <Alert severity="error" data-testid={`${prefix}-error`}>
        <AlertTitle>Could not load advice</AlertTitle>
        {(lifecycle.query.error as Error).message}
        {lifecycle.query.error instanceof AdvisorReadError &&
        lifecycle.query.error.code
          ? ` (${lifecycle.query.error.code})`
          : null}
        <Box sx={{ mt: 1 }}>
          <Button
            variant="outlined"
            startIcon={<IconMaterialSymbolsRefresh />}
            onClick={() => void lifecycle.refresh()}
            data-testid={`${prefix}-refresh-status`}
          >
            Refresh status
          </Button>
        </Box>
      </Alert>
    );
  }

  return (
    <Box sx={{ maxWidth: 1440, width: "100%", minWidth: 0, display: "grid", gap: 3,
      gridTemplateColumns: { xs: "minmax(0, 1fr)", md: hasHistory ? "280px minmax(0, 1fr)" : "minmax(0, 1fr)" },
      alignItems: "start" }} data-testid={`${prefix}-panel`}>
      {hasHistory ? (
        <Stack component="aside" aria-label="Advice history" spacing={2}
          sx={{ minWidth: 0, position: { md: "sticky" }, top: 3, maxHeight: { md: "calc(100vh - 240px)" }, overflowY: "auto" }}>
      {requestStatus}
      <RequestHistory
        selectedJobId={currentRequest?.jobId ?? lifecycle.selectedResult?.jobId ?? null}
        compact={compactHistory}
        requests={historyRequests}
        runs={lifecycle.selectedResult ? [lifecycle.selectedResult, ...lifecycle.runs.filter((run) => run.id !== lifecycle.selectedResult?.id)] : lifecycle.runs}
        tenantId={tenantId}
        agentId={agentId}
        prefix={prefix}
        onSelect={selectRequest}
        hasMore={lifecycle.hasMoreRequests}
        onLoadMore={lifecycle.loadMoreRequests}
      />
      <RetainedAdvice
        requests={lifecycle.requests}
        runs={lifecycle.runs}
        prefix={prefix}
        onSelect={selectRequest}
      />
        </Stack>
      ) : null}
      <Stack ref={resultRef} spacing={3} sx={{ minWidth: 0, scrollMarginTop: 24 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        spacing={1.5}
      >
        <Box>
          <Typography variant="h5">Improvement advice</Typography>
          {sourceRunId && !requestInHistory && !resultInHistory
            ? sourceLink(
                tenantId,
                agentId,
                sourceRunId,
                `${prefix}-source-link`,
              )
            : null}
        </Box>
        {!canRequest || missingTarget ? (
          <Button
            component={RouterLink}
            to="/tenants/$tenantId/agents/$agentId"
            params={{ tenantId, agentId } as never}
            variant="contained"
            data-testid={`${prefix}-score-first`}
          >
            Score this agent first
          </Button>
        ) : (
          <Button
            variant="contained"
            startIcon={<IconMaterialSymbolsLightbulb />}
            onClick={
              lifecycle.submissionState === "unknown"
                ? lifecycle.retrySubmission
                : lifecycle.submit
            }
            disabled={triggerDisabled}
            data-testid={`${prefix}-trigger`}
          >
            {triggerLabel}
          </Button>
        )}
      </Stack>


      {lifecycle.runtimeSelectionPending ? (
        <Alert severity="info" data-testid={`${prefix}-selection-loading`}>Loading the linked advice…</Alert>
      ) : lifecycle.runtimeSelectionMissing ? (
        <Alert severity="warning" data-testid={`${prefix}-selection-missing`}>The linked advice is no longer available in retained history.</Alert>
      ) : null}
      {lifecycle.submissionState === "submitting" ? (
        <Card variant="outlined" data-testid={`${prefix}-status`}>
          <CardContent>
            <Typography variant="subtitle2" aria-live="polite">
              Submitting request
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Saving your request before checking its progress.
            </Typography>
          </CardContent>
        </Card>
      ) : lifecycle.submissionState === "unknown" ? (
        <Alert severity="warning" data-testid={`${prefix}-submission-recovery`}>
          <AlertTitle>Request status unknown</AlertTitle>
          The connection ended before the request was confirmed. Refresh status or
          retry submission with the same request key.
          <Box sx={{ mt: 1 }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button
                variant="outlined"
                onClick={lifecycle.retrySubmission}
                data-testid={`${prefix}-retry-same-request`}
              >
                Retry same request
              </Button>
              <Button
                variant="outlined"
                startIcon={<IconMaterialSymbolsRefresh />}
                onClick={() => void lifecycle.refresh()}
                data-testid={`${prefix}-recovery-refresh`}
              >
                Refresh status
              </Button>
              <Button
                variant="text"
                onClick={lifecycle.startNewSubmission}
                data-testid={`${prefix}-start-new-request`}
              >
                Start a new request
              </Button>
            </Stack>
          </Box>
        </Alert>
      ) : unavailable ? (
        <Alert severity="info" data-testid={`${prefix}-request-unavailable`}>
          <AlertTitle>This request is no longer available</AlertTitle>
          Request history is retained for a limited period. Separately retained
          advice remains available below.
          <Box sx={{ mt: 1 }}>
            <Button
              variant="outlined"
              startIcon={<IconMaterialSymbolsRefresh />}
              onClick={() => void lifecycle.refresh()}
              data-testid={`${prefix}-unavailable-refresh`}
            >
              Refresh status
            </Button>
          </Box>
        </Alert>
      ) : currentRequest ? (
        hasHistory ? null : requestStatus
      ) : lifecycle.selectedResult ? null : (
        <EmptyState
          icon={IconMaterialSymbolsLightbulb}
          title={canRequest ? "No advice yet" : "Score this agent first"}
          description={
            canRequest
              ? "Get cited, evidence-bound recommendations from a scoring run."
              : "Advice needs a completed or partial scoring run with verdicts."
          }
          testId={`${prefix}-empty`}
        />
      )}

      {backgroundActiveRequest ? (
        <Stack spacing={1} data-testid={`${prefix}-active-progress`}>
          <Eyebrow>Current request progress</Eyebrow>
          <RequestStatus
            request={backgroundActiveRequest}
            prefix={`${prefix}-active`}
            insufficientEvidence={false}
          />
        </Stack>
      ) : null}

      {lifecycle.conflict ? (
        <Alert severity="info" data-testid={`${prefix}-conflict`}>
          <AlertTitle>
            {activeForAnotherRun
              ? "Advice is being prepared for another scoring run"
              : "Advice is already being prepared"}
          </AlertTitle>
          {lifecycle.conflict.scoringRunId
            ? sourceLink(
                tenantId,
                agentId,
                lifecycle.conflict.scoringRunId,
                `${prefix}-conflict-source`,
              )
            : null}
        </Alert>
      ) : null}

      {otherRunActiveRequest && !lifecycle.conflict ? (
        <Alert severity="info" data-testid={`${prefix}-other-run-active`}>
          <AlertTitle>Advice is being prepared for another scoring run</AlertTitle>
          {sourceLink(
            tenantId,
            agentId,
            otherRunActiveRequest.scoringRunId,
            `${prefix}-other-run-source`,
          )}
        </Alert>
      ) : null}

      {isStale ? (
        <Alert severity="info" data-testid={`${prefix}-stale`}>
          This advice is based on an earlier scoring run. Get new advice to use
          the latest scored evidence.
        </Alert>
      ) : null}

      {lifecycle.submissionError ? (
        <Alert severity="error" data-testid={`${prefix}-submission-error`}>
          <AlertTitle>Could not request advice</AlertTitle>
          {lifecycle.submissionError.message}
          {lifecycle.submissionError.code
            ? ` (${lifecycle.submissionError.code})`
            : null}
        </Alert>
      ) : null}

      {lifecycle.connectionInterrupted ? (
        <Alert severity="warning" data-testid={`${prefix}-reconnect`}>
          <AlertTitle>Connection interrupted</AlertTitle>
          Showing the last confirmed status.
          <Box sx={{ mt: 1 }}>
            <Button
              variant="outlined"
              startIcon={<IconMaterialSymbolsRefresh />}
              onClick={() => void lifecycle.refresh()}
              data-testid={`${prefix}-refresh-status`}
            >
              Refresh status
            </Button>
          </Box>
        </Alert>
      ) : null}

      {lifecycle.longWait ? (
        <Alert severity="warning" data-testid={`${prefix}-long-wait`}>
          <AlertTitle>This is taking longer than usual</AlertTitle>
          The request is still being checked. You can refresh its status.
          <Box sx={{ mt: 1 }}>
            <Button
              variant="outlined"
              startIcon={<IconMaterialSymbolsRefresh />}
              onClick={() => void lifecycle.refresh()}
              data-testid={`${prefix}-long-wait-refresh`}
            >
              Refresh status
            </Button>
          </Box>
        </Alert>
      ) : null}

      {lifecycle.connectionInterrupted && lifecycle.lastConfirmedAt ? (
        <Typography
          variant="caption"
          color="text.secondary"
          data-testid={`${prefix}-freshness`}
        >
          Last confirmed {new Date(lifecycle.lastConfirmedAt).toLocaleString()}
        </Typography>
      ) : null}

      {lifecycle.selectedResult ? (
        <Stack spacing={1.5} data-testid={`${prefix}-selected-advice`}>

          {!resultInHistory ? <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            {lifecycle.selectedResult.scoringRunId
              ? sourceLink(
                  tenantId,
                  agentId,
                  lifecycle.selectedResult.scoringRunId,
                  `${prefix}-selected-source`,
                )
              : null}
            {lifecycle.selectedResult.adviceFinalizedAt ? (
              <Typography variant="caption" color="text.secondary">
                Completed {formatTime(lifecycle.selectedResult.adviceFinalizedAt)}
              </Typography>
            ) : null}
          </Stack> : null}
          {!lifecycle.selectedResult.finalizationRecorded && lifecycle.selectedResult.jobId == null ? (
            <Alert severity="warning">This advice predates request finalization records. Its runtime outcome and citations are shown as retained.</Alert>
          ) : null}
          <RecommendationList
            run={lifecycle.selectedResult}
            showBasis={!resultInHistory}
            tenantId={tenantId}
            agentId={agentId}
          />
        </Stack>
      ) : previousAdvice ? (
        <Stack spacing={1.5} data-testid={`${prefix}-previous-advice`}>
          <Eyebrow>Previous advice</Eyebrow>
          <Typography variant="caption" color="text.secondary">
            Completed {formatTime(previousAdvice.adviceFinalizedAt)}
          </Typography>
          {previousAdvice.scoringRunId
            ? sourceLink(
                tenantId,
                agentId,
                previousAdvice.scoringRunId,
                `${prefix}-previous-source`,
              )
            : null}
          <RecommendationList run={previousAdvice} tenantId={tenantId} agentId={agentId} />
        </Stack>
      ) : null}

      <EarlierAdvice
        runs={lifecycle.runs}
        tenantId={tenantId}
        agentId={agentId}
        prefix={prefix}
        hasMore={lifecycle.hasMoreRuns}
        onLoadMore={lifecycle.loadMoreRuns}
      />
      </Stack>
    </Box>
  );
}
