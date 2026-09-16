import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import SvgIcon from "@mui/material/SvgIcon";
import type { View, UsageAgentRow } from "../types";
import { usageReport, formatReportCost, formatUnitCost, formatReportCount } from "../data/reports";
import EntityShell from "../components/EntityShell";
import DataTable from "../components/DataTable";
import TintChip from "../components/TintChip";
import { NotFoundState } from "../components/EmptyState";
import { useToast } from "../components/Toast";

interface Props {
  tenantId: string;
  range?: string;
  navigate: (v: View) => void;
}

const REFRESH_ICON = "M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08a5.99 5.99 0 01-5.65 4c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L14 11h7V4l-3.35 2.35z";
const DOWNLOAD_ICON = "M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z";

export default function TenantUsageDetailView({ tenantId, range, navigate }: Props) {
  const toast = useToast();
  const [refreshNonce, setRefreshNonce] = useState(0);

  const report = useMemo(() => usageReport(range ?? "30d"), [range, refreshNonce]);
  const tenantRow = report.tenants.find((t) => t.tenantId === tenantId);
  const agents = report.agents.filter((a) => a.tenantId === tenantId);

  if (!tenantRow) {
    return (
      <Box sx={{ p: 3 }}>
        <NotFoundState
          entity="Tenant"
          description="This tenant doesn't exist, was deleted, or you don't have access to it."
          testId="not-found"
          action={
            <Button variant="outlined" data-testid="tenant-usage-not-found-back" onClick={() => navigate({ name: "reports", tab: "usage", range })}>
              Back to Reports
            </Button>
          }
        />
      </Box>
    );
  }

  return (
    <EntityShell
      title={tenantRow.tenantName}
      badges={tenantRow.isDeleted ? <TintChip tint="destructive" label="Deleted" /> : undefined}
      meta={`${new Date(report.windowFrom).toLocaleString()} – ${new Date(report.windowTo).toLocaleString()}`}
      actions={
        <>
          <IconButton size="small" onClick={() => setRefreshNonce((n) => n + 1)} title="Refresh tenant usage" data-testid="refresh-tenant-usage">
            <SvgIcon fontSize="small"><path d={REFRESH_ICON} /></SvgIcon>
          </IconButton>
          <Button
            variant="outlined"
            size="small"
            startIcon={<SvgIcon fontSize="small"><path d={DOWNLOAD_ICON} /></SvgIcon>}
            onClick={() => toast.info("This demo doesn't generate a real file.")}
            data-testid="export-tenant-usage"
          >
            Export to Excel
          </Button>
        </>
      }
    >
      <Box data-testid="tenant-usage-detail">
        <DataTable
          getRowId={(row: UsageAgentRow) => row.agentId}
          getRowTestId={(row) => `usage-agent-row-${row.agentId}`}
          data={agents}
          emptyState={<Box sx={{ py: 3, textAlign: "center", color: "text.secondary" }}>No agent activity for this tenant in this window.</Box>}
          columns={[
            { id: "agent", header: "Agent", width: "16%", render: (r) => r.agentName },
            { id: "traces", header: "Traces", width: "7%", align: "right", render: (r) => tabularNum(formatReportCount(r.traces)) },
            { id: "evalResults", header: "Evaluation results", width: "7%", align: "right", render: (r) => tabularNum(formatReportCount(r.evalResults)) },
            { id: "profileFits", header: "Profile fits", width: "7%", align: "right", render: (r) => tabularNum(formatReportCount(r.profileFits)) },
            { id: "agentCards", header: "Agent cards", width: "7%", align: "right", render: (r) => tabularNum(formatReportCount(r.agentCards)) },
            { id: "totalCost", header: "Total cost", width: "7%", align: "right", render: (r) => tabularNum(formatReportCost(r.costUsd)) },
            { id: "scoring", header: "Scoring", width: "7%", align: "right", render: (r) => tabularNum(formatReportCost(r.costScoringUsd)) },
            { id: "profileFit", header: "Profile fit", width: "7%", align: "right", render: (r) => tabularNum(formatReportCost(r.costProfileFitUsd)) },
            { id: "agentCard", header: "Agent card", width: "7%", align: "right", render: (r) => tabularNum(formatReportCost(r.costAgentCardUsd)) },
            { id: "other", header: "Other", width: "7%", align: "right", render: (r) => tabularNum(formatReportCost(r.costOtherUsd)) },
            { id: "avgResult", header: "Avg cost/result", width: "7%", align: "right", render: (r) => tabularNum(formatUnitCost(r.avgCostPerEvalResult)) },
            { id: "avgFit", header: "Avg cost/fit", width: "7%", align: "right", render: (r) => tabularNum(formatUnitCost(r.avgCostPerProfileFit)) },
            { id: "avgCard", header: "Avg cost/card", width: "7%", align: "right", render: (r) => tabularNum(formatUnitCost(r.avgCostPerAgentCard)) },
          ]}
        />
      </Box>
    </EntityShell>
  );
}

function tabularNum(value: string) {
  return <Box component="span" sx={{ fontVariantNumeric: "tabular-nums" }}>{value}</Box>;
}
