import Box from "@mui/material/Box";
import { useNavigate, useParams, useSearch } from "@tanstack/react-router";

import { ImproveTab } from "@/back-office/agents/scoring/ImproveTab";

export function AgentImprovePage() {
  const { tenantId, agentId } = useParams({ strict: false }) as {
    tenantId: string;
    agentId: string;
  };
  const search = useSearch({ strict: false }) as { advice?: string; request?: string };
  const navigate = useNavigate();
  return (
    <Box sx={{ px: { xs: 2, md: 4 }, py: 3 }}>
      <ImproveTab
        key={`${tenantId}:${agentId}`}
        tenantId={tenantId}
        agentId={agentId}
        selection={{ requestId: search.request, runtimeId: search.request ? undefined : search.advice }}
        onSelectionChange={(selection) => void navigate({
          to: "/tenants/$tenantId/agents/$agentId/improve",
          params: { tenantId, agentId },
          search: { request: selection.requestId, advice: selection.runtimeId },
          resetScroll: false,
        })}
      />
    </Box>
  );
}
