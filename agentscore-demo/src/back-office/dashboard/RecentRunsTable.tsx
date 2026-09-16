/** RecentRunsTable — cross-tenant recent scoring runs. No "View all →" (no
 * global runs list page exists) — rows are the navigation, per the real
 * table's spec.
 */

import { useNavigate } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";

import type { DashboardRunRow } from "@/back-office/dashboard/fake-data";
import { fmtRelative, fmtScore } from "@/back-office/dashboard/format";
import { EmptyState } from "@/shared/components/empty-state";
import { VerdictBadge } from "@/shared/components/verdict-badge";
import { focusRing } from "@/shared/theme/focus-ring";

interface RecentRunsTableProps {
  recentRuns: DashboardRunRow[];
}

function RecentRow({
  row,
  onOpen,
}: {
  row: DashboardRunRow;
  onOpen: (row: DashboardRunRow) => void;
}) {
  const activate = () => onOpen(row);
  return (
    <TableRow
      hover
      role="button"
      tabIndex={0}
      aria-label={`Open run ${row.runId}`}
      onClick={activate}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          activate();
        }
      }}
      sx={[focusRing, { cursor: "pointer" }]}
    >
      <TableCell sx={{ fontFamily: "monospace", typography: "caption", color: "text.secondary" }}>
        {row.runId}
      </TableCell>
      <TableCell sx={{ fontWeight: 500 }}>{row.agentName}</TableCell>
      <TableCell sx={{ color: "text.secondary" }}>{row.tenantName}</TableCell>
      <TableCell align="right" sx={{ fontWeight: 600 }}>
        {fmtScore(row.compositeScore)}
      </TableCell>
      <TableCell>
        <VerdictBadge shipDecision={row.shipDecision} />
      </TableCell>
      <TableCell align="right" sx={{ color: "text.secondary" }}>
        {fmtRelative(row.createdAt)}
      </TableCell>
    </TableRow>
  );
}

export function RecentRunsTable({ recentRuns }: RecentRunsTableProps) {
  const navigate = useNavigate();
  const onOpen = (row: DashboardRunRow) =>
    void navigate({
      to: "/tenants/$tenantId/agents/$agentId/runs/$runId",
      params: { tenantId: row.tenantId, agentId: row.agentId, runId: row.runId },
      search: { panel: "overview" },
    });
  return (
    <Card>
      <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
        <Box sx={{ px: 2.5, py: 1.5 }}>
          <Box sx={{ typography: "body2", fontWeight: 600 }}>Recent scoring runs</Box>
          <Box sx={{ typography: "caption", color: "text.secondary" }}>Newest first · across all tenants</Box>
        </Box>

        {recentRuns.length === 0 ? (
          <EmptyState title="No scoring runs yet — configure an agent to start scoring" />
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Run</TableCell>
                <TableCell>Agent</TableCell>
                <TableCell>Tenant</TableCell>
                <TableCell align="right">Score</TableCell>
                <TableCell>Verdict</TableCell>
                <TableCell align="right">Triggered</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentRuns.map((row) => (
                <RecentRow key={row.runId} row={row} onOpen={onOpen} />
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
