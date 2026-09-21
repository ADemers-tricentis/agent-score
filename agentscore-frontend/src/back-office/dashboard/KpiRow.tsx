/** KpiRow — the 5-tile KPI strip. No backend: every tile reads straight off
 * the fixture `DashboardOverview`/`IngestionOverview`, so there's no
 * loading/error branch to render (unlike the real, query-backed KpiRow).
 *
 * `StatCard` does not spread arbitrary props (no `onClick`), so each
 * navigable tile is wrapped in a clickable `Box`. The "Traces" tile has
 * nowhere to navigate — this clone doesn't build the ingestion admin page —
 * so it renders as a plain, non-interactive tile instead of a dead link.
 */

import type { ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import IconMaterialSymbolsBolt from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsBolt.mjs";
import IconMaterialSymbolsMonitoring from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsMonitoring.mjs";
import IconMaterialSymbolsSmartToy from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsSmartToy.mjs";
import IconMaterialSymbolsWarning from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsWarning.mjs";

import type { DashboardOverview, IngestionOverview } from "@/back-office/dashboard/fake-data";
import { fmtCount } from "@/back-office/dashboard/format";
import { Sparkline } from "@/shared/components/sparkline";
import { StatCard } from "@/shared/components/stat-card";
import { focusRing } from "@/shared/theme/focus-ring";

interface KpiRowProps {
  overview: DashboardOverview;
  ingestion: IngestionOverview;
}

function KpiTile({ to, children }: { to?: string; children: ReactNode }) {
  const navigate = useNavigate();
  if (!to) {
    return (
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <Box sx={{ height: "100%" }}>{children}</Box>
      </Grid>
    );
  }
  return (
    <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
      <Box
        component="button"
        type="button"
        onClick={() => void navigate({ to })}
        sx={[focusRing, {
          display: "block",
          width: "100%",
          height: "100%",
          p: 0,
          border: "none",
          background: "none",
          textAlign: "inherit",
          font: "inherit",
          color: "inherit",
          cursor: "pointer",
        }]}
      >
        {children}
      </Box>
    </Grid>
  );
}

export function KpiRow({ overview, ingestion }: KpiRowProps) {
  const { counts, scoring } = overview;

  return (
    <Grid container spacing={2}>
      <KpiTile to="/agents">
        <StatCard
          label="Active agents"
          icon={IconMaterialSymbolsSmartToy}
          value={fmtCount(counts.agentsActive)}
          hint={`of ${fmtCount(counts.agentsTotal)} total`}
          sx={{ height: "100%" }}
        />
      </KpiTile>

      <KpiTile>
        <StatCard
          label="Traces (24h)"
          icon={IconMaterialSymbolsMonitoring}
          value={fmtCount(ingestion.tracesToday)}
          hint={`${fmtCount(ingestion.currentTps)}/s now`}
          chart={
            <Sparkline
              values={[
                Math.max(0, ingestion.tracesToday - ingestion.currentTps * 60),
                ingestion.tracesToday,
              ]}
              tone="accent"
              stretch
            />
          }
          sx={{ height: "100%" }}
        />
      </KpiTile>

      <KpiTile to="/agents">
        <StatCard
          label="Scoring runs (24h)"
          icon={IconMaterialSymbolsBolt}
          value={fmtCount(scoring.runsTotal)}
          hint={
            <Box component="span">
              <Box component="span" sx={{ color: "success.main" }}>
                {scoring.buckets.ship} Ship
              </Box>
              {" · "}
              <Box component="span" sx={{ color: "warning.main" }}>
                {scoring.buckets.review} Review
              </Box>
              {" · "}
              <Box component="span" sx={{ color: "error.main" }}>
                {scoring.buckets.block} Block
              </Box>
            </Box>
          }
          sx={{ height: "100%" }}
        />
      </KpiTile>

      <KpiTile to="/agents">
        <StatCard
          label="Needs attention"
          icon={IconMaterialSymbolsWarning}
          value={
            <Box
              component="span"
              sx={{
                color: scoring.needsAttentionAgents > 0 ? "error.main" : "text.primary",
              }}
            >
              {fmtCount(scoring.needsAttentionAgents)}
            </Box>
          }
          hint={`${fmtCount(scoring.needsReviewAgents)} scoring · ${fmtCount(scoring.profileAttentionAgents)} profile fit`}
          sx={{ height: "100%" }}
        />
      </KpiTile>
    </Grid>
  );
}
