import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import SvgIcon from "@mui/material/SvgIcon";
import type { View } from "../types";
import { usageReport, formatReportCost, formatUnitCost, formatReportCount, formatAverage, RANGE_PRESETS, RANGE_LABELS, DEFAULT_RANGE } from "../data/reports";
import type { UsageTenantRow } from "../types";
import EntityShell from "../components/EntityShell";
import DataTable from "../components/DataTable";
import TintChip from "../components/TintChip";
import EmptyState from "../components/EmptyState";
import { useToast } from "../components/Toast";

interface Props {
  tab?: "usage";
  range?: string;
  navigate: (v: View) => void;
}

const REFRESH_ICON = "M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08a5.99 5.99 0 01-5.65 4c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L14 11h7V4l-3.35 2.35z";
const DOWNLOAD_ICON = "M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z";

export default function ReportsView({ tab = "usage", range, navigate }: Props) {
  const toast = useToast();
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [rangeMenuAnchor, setRangeMenuAnchor] = useState<HTMLElement | null>(null);

  const activeRange = (range && (RANGE_PRESETS as readonly string[]).includes(range) ? range : DEFAULT_RANGE) as (typeof RANGE_PRESETS)[number];

  const report = useMemo(() => usageReport(activeRange), [activeRange, refreshNonce]);

  function handleExport() {
    toast.info("This demo doesn't generate a real file.");
  }

  return (
    <EntityShell
      title="Reports"
      meta="Cross-tenant usage and spend, over a chosen window."
      tabs={{ value: tab, items: [{ label: "Usage", value: "usage" }], onChange: () => undefined }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
        <Button
          variant="outlined"
          size="small"
          onClick={(e) => setRangeMenuAnchor(e.currentTarget)}
          data-testid="filter-range"
          sx={{ gap: 0.75 }}
        >
          <Typography component="span" sx={{ fontFamily: "monospace", fontWeight: 700, fontSize: "0.75rem" }}>{activeRange}</Typography>
          {RANGE_LABELS[activeRange]}
        </Button>
        <Menu anchorEl={rangeMenuAnchor} open={Boolean(rangeMenuAnchor)} onClose={() => setRangeMenuAnchor(null)}>
          {RANGE_PRESETS.map((preset) => (
            <MenuItem
              key={preset}
              selected={preset === activeRange}
              onClick={() => { navigate({ name: "reports", tab: "usage", range: preset }); setRangeMenuAnchor(null); }}
            >
              {RANGE_LABELS[preset]}
            </MenuItem>
          ))}
        </Menu>
        <IconButton size="small" onClick={() => setRefreshNonce((n) => n + 1)} title="Refresh usage report" data-testid="refresh-usage-report">
          <SvgIcon fontSize="small"><path d={REFRESH_ICON} /></SvgIcon>
        </IconButton>
        <Button variant="outlined" size="small" startIcon={<SvgIcon fontSize="small"><path d={DOWNLOAD_ICON} /></SvgIcon>} onClick={handleExport} data-testid="export-usage-report" sx={{ ml: "auto" }}>
          Export to Excel
        </Button>
      </Box>

      <DataTable
        enableSorting
        getRowId={(row: UsageTenantRow) => row.tenantId}
        getRowTestId={(row) => `usage-tenant-row-${row.tenantId}`}
        onRowClick={(row) => navigate({ name: "tenant-usage", tenantId: row.tenantId, range: activeRange })}
        data={report.tenants}
        emptyState={<EmptyState icon={DOWNLOAD_ICON} title="No usage recorded" description="No tenant activity in this window yet." testId="usage-tenant-empty" />}
        columns={[
          {
            id: "tenant", header: "Tenant", width: "16%",
            render: (row) => (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <Typography variant="body2" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.tenantName}</Typography>
                {row.isDeleted && <TintChip tint="destructive" label="Deleted" />}
              </Box>
            ),
          },
          { id: "activeAgents", header: "Active agents", width: "6%", align: "right", sortValue: (r) => r.activeAgents, render: (r) => tabularNum(formatReportCount(r.activeAgents)) },
          { id: "traces", header: "Traces", width: "6%", align: "right", sortValue: (r) => r.traces, render: (r) => tabularNum(formatReportCount(r.traces)) },
          { id: "avgTraces", header: "Avg traces/active agent", width: "6%", align: "right", sortValue: (r) => r.avgTracesPerActiveAgent ?? -Infinity, render: (r) => tabularNum(formatAverage(r.avgTracesPerActiveAgent)) },
          { id: "evalResults", header: "Evaluation results", width: "6%", align: "right", sortValue: (r) => r.evalResults, render: (r) => tabularNum(formatReportCount(r.evalResults)) },
          { id: "profileFits", header: "Profile fits", width: "6%", align: "right", sortValue: (r) => r.profileFits, render: (r) => tabularNum(formatReportCount(r.profileFits)) },
          { id: "agentCards", header: "Agent cards", width: "6%", align: "right", sortValue: (r) => r.agentCards, render: (r) => tabularNum(formatReportCount(r.agentCards)) },
          { id: "totalCost", header: "Total cost", width: "6%", align: "right", sortValue: (r) => moneyValue(r.costUsd), render: (r) => tabularNum(formatReportCost(r.costUsd)) },
          { id: "scoring", header: "Scoring", width: "6%", align: "right", sortValue: (r) => moneyValue(r.costScoringUsd), render: (r) => tabularNum(formatReportCost(r.costScoringUsd)) },
          { id: "profileFit", header: "Profile fit", width: "6%", align: "right", sortValue: (r) => moneyValue(r.costProfileFitUsd), render: (r) => tabularNum(formatReportCost(r.costProfileFitUsd)) },
          { id: "agentCard", header: "Agent card", width: "6%", align: "right", sortValue: (r) => moneyValue(r.costAgentCardUsd), render: (r) => tabularNum(formatReportCost(r.costAgentCardUsd)) },
          { id: "other", header: "Other", width: "6%", align: "right", sortValue: (r) => moneyValue(r.costOtherUsd), render: (r) => tabularNum(formatReportCost(r.costOtherUsd)) },
          { id: "avgResult", header: "Avg cost/result", width: "6%", align: "right", sortValue: (r) => moneyValue(r.avgCostPerEvalResult), render: (r) => tabularNum(formatUnitCost(r.avgCostPerEvalResult)) },
          { id: "avgFit", header: "Avg cost/fit", width: "6%", align: "right", sortValue: (r) => moneyValue(r.avgCostPerProfileFit), render: (r) => tabularNum(formatUnitCost(r.avgCostPerProfileFit)) },
          { id: "avgCard", header: "Avg cost/card", width: "6%", align: "right", sortValue: (r) => moneyValue(r.avgCostPerAgentCard), render: (r) => tabularNum(formatUnitCost(r.avgCostPerAgentCard)) },
        ]}
      />
    </EntityShell>
  );
}

function moneyValue(usd: string | null): number {
  if (usd == null) return Number.NEGATIVE_INFINITY;
  const n = parseFloat(usd);
  return isNaN(n) ? Number.NEGATIVE_INFINITY : n;
}

function tabularNum(value: string) {
  return <Box component="span" sx={{ fontVariantNumeric: "tabular-nums" }}>{value}</Box>;
}
