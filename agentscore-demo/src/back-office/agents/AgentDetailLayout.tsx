/** AgentDetailLayout — shell for the agent detail sub-app.
 *
 * Loads the agent and renders an AgentShell with the URL-segment top-level
 * tabs (Score / Agent Card / Traces / Profile / Labeling / Settings — no
 * nested sub-tab strip). Each subroute renders into `<Outlet />` below the
 * shell chrome. Subpages re-query the same agent via TanStack Query — the
 * cache dedupes the fetch.
 *
 * Also owns the header run-actions: fetches the shared `runsQuery` and
 * passes "Score now" / the active-run pill into AgentShell's `actions`
 * slot, present on every tab and hidden once the agent is soft-deleted.
 */

import { useState } from "react";
import { Link, Outlet, useParams } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconMaterialSymbolsHub from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsHub.mjs";

import { getFakeAgent, getFakeTenant, type FakeAgent } from "@/back-office/agents/fake-data";
import {
  ActiveRunPill,
  RunNowButton,
} from "@/back-office/agents/scoring/run-actions";
import { NO_ENABLED_CHECKS_COPY } from "@/back-office/agents/scoring/run-format";
import { AgentShell } from "@/shared/components/agent-shell";
import { Chip } from "@/shared/components/chip";
import { LifecycleChip } from "@/shared/components/lifecycle-chip";
import { NotFoundState } from "@/shared/components/not-found-state";
import { StatusDot } from "@/shared/components/status-dot";
import { toast } from "@/shared/lib/toast";

export function AgentDetailLayout() {
  const { tenantId, agentId } = useParams({ strict: false }) as {
    tenantId: string;
    agentId: string;
  };
  const [startingSession, setStartingSession] = useState(false);

  // No backend: resolve straight from the fake roster instead of a query.
  const agent = getFakeAgent(agentId);
  const tenantName = getFakeTenant(tenantId)?.name ?? tenantId;
  const runs: never[] = [];
  const activeRun = undefined;
  // Every fake agent ships with enabled checks - nothing here disables
  // "Score now".
  const noEnabledChecks = false;

  // No assistant backend in this clone yet - surface the same UX shape
  // (a brief pending state, then a toast) without a real session.
  const askAssistant = async () => {
    setStartingSession(true);
    await new Promise((r) => setTimeout(r, 400));
    toast.info("The assistant isn't wired up in this demo yet.");
    setStartingSession(false);
  };

  if (!agent) {
    return (
      <NotFoundState
        entity="Agent"
        action={
          <Button
            component={Link}
            to="/agents"
            variant="outlined"
            data-testid="agent-not-found-back"
          >
            Back to agents
          </Button>
        }
      />
    );
  }

  return (
    <AgentShell
      tenantId={tenantId}
      agentId={agentId}
      agentName={agent.name}
      badges={<AgentBadges agent={agent} />}
      actions={
        <>
          {
            // Soft-deleted agents get no header action here either — the create
            // route 404s `agent_not_found` for one (same guard the run action below
            // uses).
            agent.deleted_at ? null : (
              <Button
                variant="outlined"
                data-testid="agent-ask-assistant"
                disabled={startingSession}
                onClick={() => void askAssistant()}
              >
                Ask the assistant
              </Button>
            )
          }
          {
            // Soft-deleted agents get no header action (spec §3.4); a failed
            // runs fetch also renders nothing rather than guess at active-run
            // state (spec §3.4 table, "runsQuery fails in the layout").
            //
            // `isPending` is part of the same guard, not a nicety: until the page
            // lands, both `runs` and `activeRun` are `undefined`/`[]`, and we
            // would offer "Score now" for an agent that already has a run in
            // flight. The BE 409s, and `RunNowButton` resolves the conflicting
            // run out of that same empty `runs` array — so the alert loses its
            // `run-conflict-link` and the user is told to "refresh to view it"
            // with nowhere to go.
            agent.deleted_at ? null : activeRun ? (
              <ActiveRunPill run={activeRun} tenantId={tenantId} agentId={agentId} />
            ) : (
              <RunNowButton
                tenantId={tenantId}
                agentId={agentId}
                runs={runs}
                disabledReason={
                  noEnabledChecks ? NO_ENABLED_CHECKS_COPY.buttonReason : null
                }
                sampleSizeCap={null}
                onTriggered={() => {
                  toast.info("Scoring runs aren't wired up in this demo yet.");
                }}
              />
            )
          }
        </>
      }
      meta={
        <>
          {/* Tenants section isn't cloned yet (Agents-only pass) - plain text
              instead of a Link until that route exists. */}
          <Box component="span">{tenantName}</Box>
          <span>·</span>
          <span>Created {new Date(agent.created_at).toLocaleDateString()}</span>
          <AgentDropPressureNote dropPressure={agent.drop_pressure} />
        </>
      }
    >
      <Outlet />
    </AgentShell>
  );
}

/** The meta-row line naming trace-drop pressure on a deactivated agent
 *  (agent activation gate) — `null` on every list read, populated only on
 *  the detail read this layout drives. Exported (like `AgentBadges`) so a
 *  component test can assert on it without mounting the whole routed layout.
 *  The 7-day wording is load-bearing: both tombstone tables prune at 7 days,
 *  so `dropped_count` is a 7-day figure, not a lifetime total, and must not
 *  read as one. */
export function AgentDropPressureNote({
  dropPressure,
}: {
  dropPressure: FakeAgent["drop_pressure"];
}) {
  if (!dropPressure || dropPressure.dropped_count <= 0) {
    return null;
  }
  return (
    <>
      <span>·</span>
      <Box
        component="span"
        data-testid="agent-drop-pressure"
        sx={{ color: "warning.main" }}
      >
        Still receiving traffic — {dropPressure.dropped_count} dropped in the
        last 7 days
        {dropPressure.last_dropped_at
          ? `, last at ${new Date(dropPressure.last_dropped_at).toLocaleString()}`
          : null}
      </Box>
    </>
  );
}

export function AgentBadges({ agent }: { agent: FakeAgent }) {
  return (
    <>
      {/* Beside the provisioning badge, not instead of it — the two answer
          different questions here. The badge says whether the agent record is
          alive (`deleted`/`active`/`provisioning`/`failed`); the stage says
          what the pipeline is doing with it, and is the only one of the two
          that can say "Scoring…". They cannot contradict each other, because
          `connecting` is derived from the same `provisioning_status` the badge
          renders. On the LIST the badge is gone and the stage absorbs it,
          because a row has no space for two. */}
      <LifecycleChip
        lifecycle={agent.lifecycle}
        voice="operator"
        testId="agent-lifecycle-chip"
        // A deactivated agent's stage keeps computing server-side (nothing
        // here recomputes it) — this only stops it from sitting beside the
        // Inactive dot below and reading as a contradiction ("Up to date"
        // next to "Inactive").
        suppressed={Boolean(agent.deactivated_at)}
      />
      <Chip tint="muted">{agent.kind}</Chip>
      {agent.kind === "internal" ? (
        <Chip tint="outline" icon={IconMaterialSymbolsHub}>
          {agent.source_service}
        </Chip>
      ) : null}
      {agent.deleted_at ? (
        <StatusDot status="destructive">deleted</StatusDot>
      ) : agent.deactivated_at ? (
        // Ahead of the provisioning-derived states below: `deactivated_at`
        // overrides whatever `provisioning_status` says, otherwise a
        // deactivated-but-provisioned-active agent would read "active" here
        // — the exact bug this badge exists to fix.
        <StatusDot status="muted" data-testid="agent-inactive-badge">
          Inactive
        </StatusDot>
      ) : agent.provisioning_status === "active" ? (
        <StatusDot status="success">active</StatusDot>
      ) : agent.provisioning_status === "provisioning" ? (
        <StatusDot status="warning" pulse>
          provisioning
        </StatusDot>
      ) : (
        <StatusDot status="destructive">failed</StatusDot>
      )}
    </>
  );
}
