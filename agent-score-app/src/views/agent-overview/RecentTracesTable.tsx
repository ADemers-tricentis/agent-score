import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Chip from "@mui/material/Chip";
import type { Trace } from "../../types";
import { SessionVerdictChip } from "../../components/shared/VerdictChip";

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

function formatDuration(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`;
  return `${ms}ms`;
}

function formatCost(cost: number | null): string {
  if (cost == null) return "-";
  return `$${cost.toFixed(3)}`;
}

/** Last few ingested traces for this agent. */
export default function RecentTracesTable({ traces }: { traces: Trace[] }) {
  return (
    <Paper sx={{ p: 2.5, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
        Recent traces
      </Typography>
      {traces.length === 0 ? (
        <Box sx={{ py: 3, textAlign: "center" }}>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            No traces yet. Live ingestion will populate this table automatically.
          </Typography>
        </Box>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>Trace</TableCell>
              <TableCell sx={{ fontWeight: 600, color: "text.secondary", width: 110 }}>Time</TableCell>
              <TableCell sx={{ fontWeight: 600, color: "text.secondary", width: 90 }}>Duration</TableCell>
              <TableCell sx={{ fontWeight: 600, color: "text.secondary", width: 90 }}>Cost</TableCell>
              <TableCell sx={{ fontWeight: 600, color: "text.secondary", width: 100 }}>Verdict</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {traces.map((trace) => (
              <TableRow key={trace.id} sx={{ "&:last-child td": { borderBottom: 0 } }}>
                <TableCell>
                  <Typography variant="body2">{trace.name}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    {formatRelativeTime(trace.ts)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    {formatDuration(trace.durationMs)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    {formatCost(trace.tokenCostUsd)}
                  </Typography>
                </TableCell>
                <TableCell>
                  {trace.verdict ? (
                    <SessionVerdictChip verdict={trace.verdict} />
                  ) : (
                    <Chip
                      label={trace.status === "ok" ? "OK" : "Error"}
                      size="small"
                      color={trace.status === "ok" ? "success" : "error"}
                      sx={{ height: 20, fontSize: "0.68rem" }}
                    />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Paper>
  );
}
