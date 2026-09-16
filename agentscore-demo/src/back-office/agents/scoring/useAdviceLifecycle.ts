/** Fake, in-memory stand-in for the real advisor lifecycle hook. The real
 * version polls a backend job queue (session-storage recovery, cursor
 * pagination, conflict/retry handling) — none of that exists without a
 * backend, so this keeps only the shape `AdvicePanel`/`ImproveTab` consume
 * (same field names) and fakes "submit" as a short local delay that appends
 * a new succeeded request+run.
 */
import { useCallback, useEffect, useMemo, useState } from "react";

import { AdvisorTriggerError, AdvisorReadError } from "@/back-office/agents/scoring-api";

// The stub `AdvisorTriggerError`/`AdvisorReadError` classes only extend
// `Error` - the real ones carry these extra fields, which `AdvicePanel`
// reads defensively. Never actually constructed here (this fake lifecycle
// has no error path), but the type needs the shape so those reads type-check.
type TriggerError = AdvisorTriggerError & { code?: string; jobId?: string; scoringRunId?: string };
type ReadError = AdvisorReadError & { code?: string };

export type AdviceSelection = { requestId?: string; runtimeId?: string };

export type AdviceMode =
  | { kind: "latest" }
  | { kind: "fixed"; scoringRunId: string };

interface FakeRecommendation {
  title: string;
  priority: "high" | "medium" | "low";
  recommendation: string;
  rationale: string;
  evidenceSpanIds: string[];
  verdictRefs: { interactionRef: string; evalSlug: string }[];
}

const RECOMMENDATION_POOL: Record<string, FakeRecommendation[]> = {
  "agent-1": [
    {
      title: "Tighten the groundedness threshold",
      priority: "high",
      recommendation: "Raise the groundedness eval's threshold from 0.6 to 0.75 - several review-band sessions cite tool output that isn't actually in the retrieved context.",
      rationale: "3 of the last 12 sessions scored below 0.7 on groundedness but still passed the profile's 0.6 gate, and all 3 landed in Review.",
      evidenceSpanIds: ["span-8f21a", "span-8f21b"],
      verdictRefs: [{ interactionRef: "int-4471", evalSlug: "groundedness_check" }],
    },
    {
      title: "Add a tool-selection-error check",
      priority: "medium",
      recommendation: "This agent occasionally calls compare_baselines before generate_test_case has produced anything to compare - add a decision-tree eval that flags call-order violations.",
      rationale: "2 sessions in the last 20 show the same ordering mistake; neither was caught by an existing eval.",
      evidenceSpanIds: ["span-19c3"],
      verdictRefs: [],
    },
  ],
  "agent-2": [
    {
      title: "Profile is already well-calibrated",
      priority: "low",
      recommendation: "No threshold changes recommended right now - pass rate and dimension scores have been stable for the last 5 runs.",
      rationale: "Composite score variance across the last 5 scored runs is under 2 points, and no eval is close to its threshold.",
      evidenceSpanIds: [],
      verdictRefs: [],
    },
  ],
  "agent-3": [
    {
      title: "Add a PII-exposure guard on invoice line items",
      priority: "high",
      recommendation: "Add a safety eval scanning tool outputs for unmasked account numbers before they reach the summary step.",
      rationale: "1 flagged session exposed a partial account number in a tool response that was echoed into the final summary.",
      evidenceSpanIds: ["span-inv-552"],
      verdictRefs: [{ interactionRef: "int-9012", evalSlug: "pii_exposure_guard" }],
    },
    {
      title: "Reduce reconciliation latency",
      priority: "medium",
      recommendation: "P95 latency is trending up (+18% over 2 weeks) - consider caching the vendor lookup step, which accounts for most of the added time.",
      rationale: "Span-level timing shows the vendor lookup tool call growing from ~1.2s to ~2.4s median over the same window.",
      evidenceSpanIds: [],
      verdictRefs: [],
    },
  ],
  "agent-4": [
    {
      title: "Escalation routing misses one queue",
      priority: "medium",
      recommendation: "Add coverage for the 'billing-disputes' queue to the escalation-routing eval - it's currently only checked against 3 of the 4 real queues.",
      rationale: "2 sessions routed a billing-dispute ticket to general support instead of escalating.",
      evidenceSpanIds: ["span-tri-118"],
      verdictRefs: [],
    },
  ],
};

function fakeRun(id: string, jobId: string, agentId: string, scoringRunId: string, createdAt: string, recs: FakeRecommendation[]) {
  return {
    id,
    jobId,
    status: "succeeded",
    finalizationRecorded: true,
    adviceFinalizedAt: createdAt,
    endedAt: createdAt,
    scoringRunId,
    agentVersionId: "improvement-advisor-v3",
    insufficientEvidenceReason: recs.length === 0 ? "Not enough labeled sessions yet to generate recommendations." : null,
    basis: {
      verdictsSelected: 8 + (recs.length * 3),
      verdictCount: 22,
      scoringRunId,
      verdictsTruncated: false,
      promptClippedSections: [],
    },
    recommendations: recs,
    citationVerification: [],
    errorCode: null,
    boundExhausted: null,
  };
}

function fakeRequest(jobId: string, scoringRunId: string, createdAt: string) {
  return {
    jobId,
    requestKey: jobId,
    state: "succeeded",
    stage: null,
    scoringRunId,
    createdAt,
    finishedAt: createdAt,
    stageUpdatedAt: createdAt,
    nextRetryAt: null,
    errorCode: null,
    errorMessage: null,
  };
}

function seedFor(agentId: string, scoringRunId: string) {
  const pool = RECOMMENDATION_POOL[agentId] ?? [];
  if (pool.length === 0) return { requests: [], runs: [] };
  const jobId = `adv-${agentId}-seed-1`;
  const createdAt = new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString();
  return {
    requests: [fakeRequest(jobId, scoringRunId, createdAt)],
    runs: [fakeRun(`res-${jobId}`, jobId, agentId, scoringRunId, createdAt, pool)],
  };
}

export function useAdviceLifecycle({
  tenantId: _tenantId,
  agentId,
  mode,
  selection,
  onSelectionChange,
}: {
  tenantId: string;
  agentId: string;
  mode: AdviceMode;
  selection?: AdviceSelection;
  onSelectionChange?: (selection: AdviceSelection) => void;
}) {
  const scoringRunId = mode.kind === "fixed" ? mode.scoringRunId : `run-${agentId}-latest`;
  const seed = useMemo(() => seedFor(agentId, scoringRunId), [agentId, scoringRunId]);
  const [requests, setRequests] = useState(seed.requests);
  const [runs, setRuns] = useState(seed.runs);
  const [submissionState, setSubmissionState] = useState<"idle" | "submitting" | "unknown">("idle");
  const submissionError: TriggerError | null = null;
  const conflict: TriggerError | null = null;
  const [selectedJobId, setSelectedJobId] = useState<string | null>(
    selection?.requestId ?? seed.requests[0]?.jobId ?? null,
  );

  useEffect(() => {
    setRequests(seed.requests);
    setRuns(seed.runs);
    setSubmissionState("idle");
    setSelectedJobId(selection?.requestId ?? seed.requests[0]?.jobId ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId]);

  const selectedRequest = selectedJobId ? requests.find((r) => r.jobId === selectedJobId) ?? null : null;
  const selectedResult = selectedJobId ? runs.find((r) => r.jobId === selectedJobId) ?? null : null;

  const submit = useCallback(() => {
    if (submissionState === "submitting") return;
    setSubmissionState("submitting");
    onSelectionChange?.({});
    window.setTimeout(() => {
      const pool = RECOMMENDATION_POOL[agentId] ?? [];
      const jobId = `adv-${agentId}-${Date.now()}`;
      const createdAt = new Date().toISOString();
      const request = fakeRequest(jobId, scoringRunId, createdAt);
      const run = fakeRun(`res-${jobId}`, jobId, agentId, scoringRunId, createdAt, pool);
      setRequests((prev) => [request, ...prev]);
      setRuns((prev) => [run, ...prev]);
      setSubmissionState("idle");
      setSelectedJobId(jobId);
      onSelectionChange?.({ requestId: jobId });
    }, 1400);
  }, [submissionState, agentId, scoringRunId, onSelectionChange]);

  return {
    query: { isLoading: false, isError: false, isFetching: false, data: undefined, error: null as ReadError | null },
    requests,
    runs,
    activeRequest: submissionState === "submitting"
      ? {
          jobId: `adv-${agentId}-pending`,
          requestKey: `adv-${agentId}-pending`,
          state: "running",
          stage: "generating_recommendations",
          scoringRunId,
          createdAt: new Date().toISOString(),
          finishedAt: null,
          stageUpdatedAt: new Date().toISOString(),
          nextRetryAt: null,
          errorCode: null,
          errorMessage: null,
        }
      : null,
    selectedRequest,
    selectedResult,
    selectedJobId,
    runtimeSelectionPending: false,
    runtimeSelectionMissing: false,
    selectedRequestUnavailable: false,
    submissionState,
    submissionError: submissionError as TriggerError | null,
    conflict: conflict as TriggerError | null,
    pending: null,
    lastConfirmedAt: Date.now(),
    connectionInterrupted: false,
    longWait: false,
    submit,
    startNewSubmission: submit,
    retrySubmission: submit,
    refresh: async () => {},
    selectRequest: (jobId: string) => {
      setSelectedJobId(jobId);
      onSelectionChange?.({ requestId: jobId });
    },
    loadMoreRequests: () => {},
    loadMoreRuns: () => {},
    hasMoreRequests: false,
    hasMoreRuns: false,
  };
}
