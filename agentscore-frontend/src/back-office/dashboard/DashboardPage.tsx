/** DashboardPage — the back-office landing page.
 *
 * Product-wide operator overview: KPI row → 2-col (ScoringPanel ~7/12 +
 * IngestionPanel ~5/12) → full-width RecentRunsTable. No backend, no
 * superadmin gate — every other section in this clone dropped that gate too
 * (no AuthProvider mounted); `AutoRefreshControl` is cosmetic here, same as
 * `AgentsSearchPage`. The demo-mode "blank" toggle (`useDemoMode`) swaps in
 * the zeroed `*_BLANK` fixtures to preview a brand-new tenant.
 */

import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import IconMaterialSymbolsTour from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsTour.mjs";

import { toast } from "@/shared/lib/toast";
import {
  DASHBOARD_OVERVIEW,
  DASHBOARD_OVERVIEW_BLANK,
  INGESTION_OVERVIEW,
  INGESTION_OVERVIEW_BLANK,
} from "@/back-office/dashboard/fake-data";
import { GettingStartedChecklist } from "@/back-office/dashboard/GettingStartedChecklist";
import { IngestionPanel } from "@/back-office/dashboard/IngestionPanel";
import { KpiRow } from "@/back-office/dashboard/KpiRow";
import { RecentRunsTable } from "@/back-office/dashboard/RecentRunsTable";
import { ScoringPanel } from "@/back-office/dashboard/ScoringPanel";
import { AutoRefreshControl } from "@/shared/components/auto-refresh-control";
import { PageBand } from "@/shared/components/page-band";
import { PageHeader } from "@/shared/components/page-header";
import { useDemoMode } from "@/shared/demo-mode/demo-mode-context";
import { useTour } from "@/shared/tour/tour-context";

export function DashboardPage() {
  const [intervalId, setIntervalId] = useState("30s");
  const { blank } = useDemoMode();
  const { start: startTour } = useTour();
  const overview = blank ? DASHBOARD_OVERVIEW_BLANK : DASHBOARD_OVERVIEW;
  const ingestion = blank ? INGESTION_OVERVIEW_BLANK : INGESTION_OVERVIEW;
  const handleRefresh = () => toast.info("Nothing new — this demo's dashboard data is fixed.");

  return (
    <Box sx={{ display: "flex", minHeight: 0, flex: 1, flexDirection: "column" }}>
      <PageBand sx={{ pt: 4, pb: 2.5 }}>
        <PageHeader
          title="Home"
          description={
            blank ? "No activity yet · get started by connecting your first agent" : "Overview of activity across all of your tenants"
          }
          actions={
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<IconMaterialSymbolsTour sx={{ fontSize: 16 }} />}
                onClick={startTour}
                data-testid="start-tour-button"
              >
                Take a tour
              </Button>
              <AutoRefreshControl
                intervalId={intervalId}
                onIntervalChange={setIntervalId}
                onRefresh={handleRefresh}
                isRefreshing={false}
              />
            </Box>
          }
        />
      </PageBand>

      <Box sx={{ minHeight: 0, flex: 1, overflowY: "auto" }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, px: 4, py: 3 }}>
          {blank ? <GettingStartedChecklist /> : null}
          <KpiRow overview={overview} ingestion={ingestion} />

          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, lg: 7 }}>
              <ScoringPanel scoring={overview.scoring} />
            </Grid>
            <Grid size={{ xs: 12, lg: 5 }}>
              <IngestionPanel ingestion={ingestion} />
            </Grid>
          </Grid>

          <RecentRunsTable recentRuns={overview.scoring.recentRuns} />
        </Box>
      </Box>
    </Box>
  );
}
