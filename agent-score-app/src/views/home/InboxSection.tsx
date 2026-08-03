import { Fragment, useCallback, useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import type { AgentInboxGroup, RestingAgentSummary } from "../../types";
import type { View } from "../../view";
import { listInboxGroups, listRestingAgents } from "../../data/mock";
import InboxAgentRow from "./InboxAgentRow";
import RestingAgentsSection from "./RestingAgentsSection";

/**
 * The Home page's triage inbox: every agent with something needing a human
 * decision, most severe first, followed by a collapsed summary of agents
 * with nothing to review. Replaces the old "agents needing attention" +
 * verdict distribution + recent-runs dashboard — see
 * plans/2026-08-03-agentscore-app-home-inbox.md for the reasoning.
 */
export default function InboxSection({ navigate }: { navigate: (v: View) => void }) {
  const [groups, setGroups] = useState<AgentInboxGroup[] | null>(null);
  const [resting, setResting] = useState<RestingAgentSummary[]>([]);

  const refresh = useCallback(async () => {
    const [nextGroups, nextResting] = await Promise.all([listInboxGroups(), listRestingAgents()]);
    setGroups(nextGroups);
    setResting(nextResting);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (groups === null) return null;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Paper sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
        <Box sx={{ px: 2, pt: 2, pb: 1.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Needs your attention
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Sessions and traces flagged for a decision, across every agent
          </Typography>
        </Box>

        {groups.length === 0 ? (
          <Box sx={{ px: 2, pb: 2.5, pt: 1 }}>
            <Typography variant="body2" sx={{ color: "text.disabled" }}>
              Nothing needs your attention right now.
            </Typography>
          </Box>
        ) : (
          groups.map((group, idx) => (
            <Fragment key={group.agentId}>
              {idx > 0 && <Divider />}
              <InboxAgentRow group={group} navigate={navigate} onActionTaken={refresh} />
            </Fragment>
          ))
        )}
      </Paper>

      <RestingAgentsSection agents={resting} navigate={navigate} />
    </Box>
  );
}
