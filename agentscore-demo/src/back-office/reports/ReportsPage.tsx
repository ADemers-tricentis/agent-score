/** Reports page — cross-tenant platform reports for superadmins. Today just
 * one report (Usage); the tab strip is here so a second report has somewhere
 * to land.
 *
 * `ReportsPage` is the superadmin guard-and-return; `<AccessDenied />`
 * returns before the shell ever mounts, so a member's report query never
 * fires. `ReportsShell` owns the persistent header, the `?tab=` strip
 * (`tab-params.ts`), and the single `ScrollRegion` the tab body renders into —
 * mirrors `LLMCatalogPage`'s guard-then-shell shape.
 */

import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import { useNavigate, useSearch } from "@tanstack/react-router";

import type { ReportsTab } from "@/back-office/reports/tab-params";
import { UsageReportTab } from "@/back-office/reports/UsageReportTab";
import { PageBand } from "@/shared/components/page-band";
import { pageContentPaddingSx } from "@/shared/components/page-content";
import { PageHeader } from "@/shared/components/page-header";
import { ScrollRegion } from "@/shared/components/scroll-region";

export function ReportsPage() {
  return <ReportsShell />;
}

function ReportsShell() {
  // validateSearch (tab-params.ts) guarantees a valid tab; strict:false is
  // loosely typed here (mirrors LLMCatalogShell) so a bare "/" harness route
  // in a test can mount this without carrying the real route's validateSearch.
  const search = useSearch({ strict: false }) as { tab?: ReportsTab };
  const tab = search.tab ?? "usage";
  const navigate = useNavigate();

  return (
    <Box sx={{ display: "flex", minHeight: 0, flex: 1, flexDirection: "column" }}>
      <PageBand sx={{ pt: 4, pb: 2.5 }}>
        <PageHeader
          title="Reports"
          description="Cross-tenant usage and spend, over a chosen window."
        />
      </PageBand>

      <PageBand sx={{ py: 0 }}>
        <Tabs
          value={tab}
          onChange={(_e, v) =>
            void navigate({ to: "/reports", search: { tab: v as ReportsTab } })
          }
        >
          <Tab
            label="Usage"
            value="usage"
            data-tab="usage"
            data-testid="reports-tab-usage"
          />
        </Tabs>
      </PageBand>

      {/* The shell owns the one ScrollRegion the tab body renders into — a tab
       *  body must never nest a second scroll container. */}
      <ScrollRegion>
        <Box sx={{ ...pageContentPaddingSx, pt: 3 }}>
          {tab === "usage" ? <UsageReportTab /> : null}
        </Box>
      </ScrollRegion>
    </Box>
  );
}
