/** Profile configuration, selection evidence, and scoring activity. */

import { useState } from "react";
import { useParams } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { getFixture, type BenchmarkConfigOut } from "@/back-office/agents/scoring/profile-fixtures";
import { ActivityTab } from "@/back-office/agents/scoring/ActivityTab";
import { ProfileFitTab } from "@/back-office/agents/scoring/ProfileFitTab";
import { useAutoFit } from "@/back-office/agents/use-auto-fit";
import { DriftNudgeAlert } from "@/shared/components/drift-nudge-alert";
import { toast } from "@/shared/lib/toast";

export function AgentProfilePage() {
  const { tenantId, agentId } = useParams({ strict: false }) as {
    tenantId: string;
    agentId: string;
  };

  const [benchmark, setBenchmark] = useState<BenchmarkConfigOut>(() => getFixture(agentId).benchmark);

  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", gap: 3, px: { xs: 2, md: 4 }, py: 3 }}
    >
      {/* Drift nudge for pinned agents (§3.2) */}
      <DriftNudgeSection
        tenantId={tenantId}
        agentId={agentId}
        benchmark={benchmark}
        onBenchmarkChange={setBenchmark}
      />

      <ProfileFitTab
        tenantId={tenantId}
        agentId={agentId}
        benchmark={benchmark}
        onBenchmarkChange={setBenchmark}
      />

      {/* Activity — always mounted (not lazy, not an accordion); the
          scoring-domain audit log (§3.1 Feature 2). */}
      <Box sx={{ maxWidth: 1200, boxSizing: "border-box", width: "100%", border: 1, borderColor: "divider", borderRadius: 1, p: { xs: 2, md: 3 } }} data-testid="profile-activity-section">
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6">Activity</Typography>
            <Box sx={{ typography: "body2", color: "text.secondary" }}>
              Profile changes, run triggers, schedule edits
            </Box>
          </Box>
          <ActivityTab key={`${tenantId}:${agentId}`} tenantId={tenantId} agentId={agentId} />
      </Box>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Drift nudge (§3.2) — pinned-agent re-fit / dismiss. No backend: re-fit
// clears the nudge and nudges bindingSource/profile toward the "would adopt"
// profile; dismiss just clears `active` locally.
// ---------------------------------------------------------------------------

function DriftNudgeSection({
  tenantId,
  agentId,
  benchmark,
  onBenchmarkChange,
}: {
  tenantId: string;
  agentId: string;
  benchmark: BenchmarkConfigOut;
  onBenchmarkChange: (b: BenchmarkConfigOut) => void;
}) {
  // Shared with the Profile Fit tab's `RefitButton` (F4) — the busy-state
  // lifecycle lives once in `useAutoFit`, not duplicated here.
  const { refit, isBusy } = useAutoFit(tenantId, agentId, () => {
    const nudge = benchmark.driftNudge;
    onBenchmarkChange({
      ...benchmark,
      bindingSource: "pinned",
      profileVersionId: nudge?.wouldAdoptProfileVersionId ?? benchmark.profileVersionId,
      profileName: nudge?.wouldAdoptProfileName ?? benchmark.profileName,
      driftNudge: null,
    });
  });

  return (
    <DriftNudgeAlert
      driftNudge={benchmark.driftNudge ?? null}
      onRefit={refit}
      onDismiss={() => {
        onBenchmarkChange({ ...benchmark, driftNudge: benchmark.driftNudge ? { ...benchmark.driftNudge, active: false } : null });
        toast.success("Drift nudge dismissed.");
      }}
      refitBusy={isBusy}
    />
  );
}
