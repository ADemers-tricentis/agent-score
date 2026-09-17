/** AgentScorePage — the agent's landing tab (`agent-ia` spec §3.1 Feature 1,
 * §4.1). A single scrollable page composed of the Scorecard and Runs bodies.
 * The "Score now" action and the active-run pill live in the agent header's
 * `actions` slot, owned by `AgentDetailLayout`.
 *
 * Owns the `benchmark` / `runs` queries and passes them down as props;
 * `ScorecardTab`/`RunsTab` stay prop-driven so their existing suites keep
 * working. The `runsQueryOptions` call shares a cache key with the layout's
 * header query, so mounting this page costs no extra request (spec §5.1) — the
 * first page is `cursor: null`, which the factory normalizes to the identical
 * key the layout builds, so paging adds cache entries beside that hit rather
 * than displacing it.
 *
 * The run pager lives here rather than in `RunsTab` because the runs endpoint
 * takes an opaque keyset cursor: "Previous" cannot be derived from one, so it
 * needs the cursor stack, and the stack belongs with the query it parameterizes.
 */

import { useMemo, useState } from "react";
import { useParams } from "@tanstack/react-router";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";

import { RunsTab } from "@/back-office/agents/scoring/RunsTab";
import { ScorecardTab } from "@/back-office/agents/scoring/ScorecardTab";
import { getBenchmarkForAgent, getRunsForAgent, getScoreAnchorRun } from "@/back-office/agents/scoring/fake-runs";
import type { PaginationConfig } from "@/shared/components/data-table";
import { MilestoneBanner } from "@/shared/components/milestone-banner";

export function AgentScorePage() {
  const { tenantId, agentId } = useParams({ strict: false }) as {
    tenantId: string;
    agentId: string;
  };

  const benchmarkQuery = { data: getBenchmarkForAgent(agentId), isLoading: false, isError: false, error: null as Error | null };
  // Cursor stack: index 0 is always `null` (the first page); the current
  // cursor is the last element. Next pushes the server's `nextCursor`,
  // Previous pops. Same shape as `AgentTracesPage`, for the same reason — an
  // opaque cursor is only meaningful to the query that produced it.
  const [cursorStack, setCursorStack] = useState<(string | null)[]>([null]);
  const cursor = cursorStack[cursorStack.length - 1];
  const allRuns = useMemo(() => getRunsForAgent(agentId), [agentId]);
  const runsQuery = {
    data: { runs: allRuns, nextCursor: null as string | null, total: allRuns.length, scoreAnchorRun: getScoreAnchorRun(agentId) },
    isLoading: false,
    error: null as Error | null,
  };
  void cursor;

  const runs = useMemo(() => runsQuery.data?.runs ?? [], [runsQuery.data]);
  const benchmark = benchmarkQuery.data;
  const nextCursor = runsQuery.data?.nextCursor ?? null;

  // `total` is the agent's whole run count, not the page's length — the pager
  // said nothing at all before, and a page length in its place would have read
  // as a grand total.
  const runsPagination: PaginationConfig = {
    mode: "cursor",
    hasNext: nextCursor !== null,
    hasPrev: cursorStack.length > 1,
    total: runsQuery.data?.total ?? 0,
    onNext: () => setCursorStack((stack) => [...stack, nextCursor]),
    onPrev: () =>
      setCursorStack((stack) => (stack.length > 1 ? stack.slice(0, -1) : stack)),
  };

  // Latest run that can anchor the Scorecard — complete/partial, or a
  // GENUINE collapse resolved to `failed`. Resolved server-side
  // (`ScoringStore.latest_score_anchor_run`), independent of the bounded
  // `runs` page: a first page whose newest runs are all non-anchor must
  // still surface the real anchor rather than silently falling back to
  // "No scores yet". The server's rule checks `isCollapsedRun` (the
  // 3-literal `failureReason` set), NOT a bare `state === "failed"` — an
  // unrelated failure (e.g. a restart-orphaned run with `failureReason:
  // "interrupted"`) must not anchor and get handed collapse-shaped UI that
  // doesn't apply to it. `ScorecardTab` renders its own collapsed branch
  // when handed a genuinely collapsed anchor run.
  const scoreAnchorRun = runsQuery.data?.scoreAnchorRun ?? null;

  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", gap: 3, px: { xs: 2, md: 4 }, py: 3 }}
    >
      <Box sx={{ maxWidth: 1200, width: "100%", display: "flex", flexDirection: "column", gap: 3 }}>
      {benchmark ? (
        <MilestoneBanner
          agentId={agentId}
          reachedAt={benchmark.firstRealScoreReachedAt ?? null}
        />
      ) : null}

      {benchmarkQuery.isError ? (
        <Alert severity="warning" data-testid="benchmark-load-warning">
          Couldn&apos;t load the benchmark configuration — some context
          (profile-attention and provisional-sample notes) may be missing
          below. The score itself is unaffected.
        </Alert>
      ) : null}

      <ScorecardTab
        tenantId={tenantId}
        agentId={agentId}
        run={scoreAnchorRun}
        benchmark={benchmark ?? null}
        loading={runsQuery.isLoading}
        error={runsQuery.error}
      />

      {/* Both bodies read the SAME `runs` query, so with no runs they each
       * render their own empty state and the page says "nothing here" twice
       * under one heading — and on a query failure, "Failed to load scores"
       * stacked on "Failed to load runs" for a single failed request. The
       * Scorecard's copy already tells the whole story ("Score now to see
       * results"), so it is the one that speaks. Suppressed only once the
       * query has settled: during load `RunsTab` still owns its skeleton. */}
      {runs.length > 0 || runsQuery.isLoading ? (
        <RunsTab
          runs={runs}
          tenantId={tenantId}
          agentId={agentId}
          loading={runsQuery.isLoading}
          error={runsQuery.error}
          pagination={runsPagination}
        />
      ) : null}
      </Box>
    </Box>
  );
}
