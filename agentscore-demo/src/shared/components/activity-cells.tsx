/** Activity + score cell renderers for the back-office agents list, plus the
 *  one score marker (`StaleScoreMarker`) also reused by the customer agents
 *  list/detail pages, which render their own cells against the customer
 *  model instead of these.
 *
 * Only the three cells that read nothing beyond trace count, last-seen and the
 * latest score live here. The back-office's `SourceCell`, `ProvisioningBadge`
 * and `FitStatusCell` stay in `back-office/agents/activity-cells.tsx` — they
 * read `kind`, `provisioning_status` and the agent-fit projection, none of
 * which the customer model carries.
 */

import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";

import { fmtRelative } from "@/shared/format/relative";
import { formatScore } from "@/shared/components/score-confidence";
import { VerdictBadge } from "@/shared/components/verdict-badge";

const EMPTY = "—";

/** The minimal shape these cells actually read — structural on purpose, so
 *  both the back-office `AgentProfile` and the customer list item satisfy it
 *  without either becoming a dependency of this module. */
export interface ActivityCellAgent {
  forwarded_trace_count: number;
  last_seen_at?: string | null;
  latest_score?: {
    composite_score?: number | null;
    ship_decision: "ship" | "needs_work" | "dont_ship" | "provisional";
    scored_at: string;
    superseded_by_unscored_run?: boolean;
  } | null;
}

/** "The displayed number predates a newer run that finished without scoring."
 *
 * One element rather than two copies: the customer detail page's score card
 * shows the same marker as the list cell below, and a wording or tint that
 * drifted between them would read as two different conditions.
 */
export function StaleScoreMarker() {
  return (
    <Tooltip title="A more recent run finished without producing a score — this number predates it.">
      <Box
        component="span"
        data-testid="score-stale-marker"
        sx={{ typography: "caption", color: "warning.main" }}
      >
        stale
      </Box>
    </Tooltip>
  );
}

/** "Nothing was newly scored in the latest run." Marker only, never a count,
 *  on the customer surface (D40): a `0 newly scored` chip would read as a
 *  failure on a perfectly healthy run. Distinct from `StaleScoreMarker` above
 *  — that one means the displayed number predates a newer run that finished
 *  without scoring (a real gap); this one means the number IS current but
 *  rests entirely on reused evidence (a normal outcome, not a problem), so it
 *  intentionally does NOT share that marker's warning tint.
 *
 *  The wording claims only that nothing was newly SCORED. It must not say
 *  "every evaluation reused a prior result": the backend flag is
 *  `newly_scored_count == 0 and reused_count > 0`, and those two counters are
 *  not complements — reused results include copied `skipped` rows, so a run
 *  can satisfy the flag while genuinely hydrating fresh traces whose
 *  evaluations all skipped. Its back-office twin is `NO_NEW_EVIDENCE_COPY` in
 *  `back-office/agents/scoring/run-format.ts`; the predicate itself is
 *  computed server-side in `api/customer/scoring.py`. All three must move
 *  together.
 */
export function NoNewEvidenceMarker() {
  return (
    <Tooltip title="Nothing was newly scored in this run — every result carrying a score was copied from an earlier run.">
      <Box
        component="span"
        data-testid="score-no-new-evidence-marker"
        sx={{ typography: "caption", color: "text.secondary" }}
      >
        no new evidence
      </Box>
    </Tooltip>
  );
}

export function TracesCell({ agent }: { agent: ActivityCellAgent }) {
  if (!agent.forwarded_trace_count) {
    return <Box component="span">{EMPTY}</Box>;
  }
  return <Box component="span">{agent.forwarded_trace_count}</Box>;
}

export function LastActiveCell({ agent }: { agent: ActivityCellAgent }) {
  if (!agent.last_seen_at) {
    return <Box component="span">{EMPTY}</Box>;
  }
  // Relative ("1m ago") for at-a-glance recency; absolute time in the tooltip
  // so exact last-seen precision is one hover away.
  return (
    <Tooltip title={new Date(agent.last_seen_at).toLocaleString()}>
      <Box component="span">{fmtRelative(agent.last_seen_at)}</Box>
    </Tooltip>
  );
}

export function ScoreCell({ agent }: { agent: ActivityCellAgent }) {
  const score = agent.latest_score;
  if (score == null || score.composite_score == null) {
    return (
      <Box component="span" sx={{ color: "text.secondary" }}>
        not scored
      </Box>
    );
  }
  // Staleness (audit P6). Surfacing the latest run that produced a score is
  // the correct semantics; the defect was that a displayed number could be
  // arbitrarily old with no signal. Show when it was produced, and mark it
  // when a newer run finished without scoring.
  const stale = score.superseded_by_unscored_run;
  return (
    // The verdict sits on its own line BELOW the number, the same shape the
    // Stage column uses for its reason: all three parts on one line measured
    // wider than the Score column's share of a fixed-layout table, so the
    // verdict printed over its neighbour. The number and its recency are both
    // short and stay together; the verdict is the wide part and gets the room.
    // `minWidth: 0` plus `nowrap` still guard the inner row — they let the
    // recency ellipsis rather than force the row wider.
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 0.5,
        minWidth: 0,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
        <Tooltip title={`Scored ${new Date(score.scored_at).toLocaleString()}`}>
          <Box component="span" sx={{ whiteSpace: "nowrap" }}>
            {formatScore(score.composite_score)}
          </Box>
        </Tooltip>
        {stale ? (
          <StaleScoreMarker />
        ) : (
          <Box
            component="span"
            sx={{
              typography: "caption",
              color: "text.secondary",
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {fmtRelative(score.scored_at)}
          </Box>
        )}
      </Box>
      <VerdictBadge shipDecision={score.ship_decision} />
    </Box>
  );
}
