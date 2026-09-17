import Box from "@mui/material/Box";
import { useParams } from "@tanstack/react-router";

import { AgentCardTab } from "@/back-office/agents/scoring/AgentCardTab";

/**
 * Agent Card — top-level agent tab (sits between Score and Traces).
 *
 * Thin route wrapper: pulls the tenant/agent route params and mounts the
 * self-contained `AgentCardTab`, which fetches its own card data and owns the
 * ok / skipped / failed / no-card states. The card documents the agent's
 * observed identity, so it lives at the agent level — not under Scoring (a
 * scoring RUN is a different concern). Mirrors the outer padding every other
 * agent tab page uses (`AgentLabelingPage`).
 */
export function AgentCardPage() {
  const { tenantId, agentId } = useParams({ strict: false }) as {
    tenantId: string;
    agentId: string;
  };
  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", gap: 3, px: { xs: 2, md: 4 }, py: 3 }}
    >
      <AgentCardTab key={`${tenantId}:${agentId}`} tenantId={tenantId} agentId={agentId} />
    </Box>
  );
}
