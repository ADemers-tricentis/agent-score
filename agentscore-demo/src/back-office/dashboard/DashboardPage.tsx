/** DashboardPage — the back-office landing page.
 *
 * Product-wide operator overview: KPI row → 2-col (ScoringPanel ~7/12 +
 * IngestionPanel ~5/12) → full-width RecentRunsTable. No backend, no
 * superadmin gate — every other section in this clone dropped that gate too
 * (no AuthProvider mounted); `AutoRefreshControl` is cosmetic here, same as
 * `AgentsSearchPage`.
 */

import { useState } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";

import { toast } from "@/shared/lib/toast";
import { DASHBOARD_OVERVIEW, INGESTION_OVERVIEW } from "@/back-office/dashboard/fake-data";
import { IngestionPanel } from "@/back-office/dashboard/IngestionPanel";
import { KpiRow } from "@/back-office/dashboard/KpiRow";
import { RecentRunsTable } from "@/back-office/dashboard/RecentRunsTable";
import { ScoringPanel } from "@/back-office/dashboard/ScoringPanel";
import { AutoRefreshControl } from "@/shared/components/auto-refresh-control";
import { PageBand } from "@/shared/components/page-band";
import { PageHeader } from "@/shared/components/page-header";

export function DashboardPage() {
  const [intervalId, setIntervalId] = useState("30s");
  const handleRefresh = () => toast.info("Nothing new — this demo's dashboard data is fixed.");

  return (
    <Box sx={{ display: "flex", minHeight: 0, flex: 1, flexDirection: "column" }}>
      <PageBand sx={{ pt: 4, pb: 2.5 }}>
        <PageHeader
          title="Home"
          description="Product-wide overview · activity across every tenant"
          actions={
            <AutoRefreshControl
              intervalId={intervalId}
              onIntervalChange={setIntervalId}
              onRefresh={handleRefresh}
              isRefreshing={false}
            />
          }
        />
      </PageBand>

      <Box sx={{ minHeight: 0, flex: 1, overflowY: "auto" }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, px: 4, py: 3 }}>
          <KpiRow overview={DASHBOARD_OVERVIEW} ingestion={INGESTION_OVERVIEW} />

          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, lg: 7 }}>
              <ScoringPanel scoring={DASHBOARD_OVERVIEW.scoring} />
            </Grid>
            <Grid size={{ xs: 12, lg: 5 }}>
              <IngestionPanel ingestion={INGESTION_OVERVIEW} />
            </Grid>
          </Grid>

          <RecentRunsTable recentRuns={DASHBOARD_OVERVIEW.scoring.recentRuns} />
        </Box>
      </Box>
    </Box>
  );
}
