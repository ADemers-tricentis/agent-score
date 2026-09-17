import type { AdviceSelection } from "@/back-office/agents/scoring/useAdviceLifecycle";
import { AdvicePanel } from "@/back-office/agents/scoring/AdvicePanel";

// Fake stand-in for a real "does this agent have a scored run yet" check -
// every agent except the still-provisioning one has a completed run to hang
// advice off of.
const NOT_YET_SCORED = new Set(["agent-5"]);

export function ImproveTab({
  tenantId,
  agentId,
  selection,
  onSelectionChange,
}: {
  tenantId: string;
  agentId: string;
  selection?: AdviceSelection;
  onSelectionChange?: (selection: AdviceSelection) => void;
}) {
  const latestScoringRunId = NOT_YET_SCORED.has(agentId) ? null : `run-${agentId}-latest`;

  return (
    <AdvicePanel
      selection={selection}
      onSelectionChange={onSelectionChange}
      tenantId={tenantId}
      agentId={agentId}
      mode={{ kind: "latest" }}
      surface="improve"
      canRequest={latestScoringRunId != null}
      latestScoringRunId={latestScoringRunId}
    />
  );
}
