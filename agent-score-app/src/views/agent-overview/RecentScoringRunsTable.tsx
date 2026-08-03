import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Chip from "@mui/material/Chip";
import type { ScoringRun } from "../../types";
import GradeChip from "../../components/shared/GradeChip";
import { CompositeVerdictChip } from "../../components/shared/VerdictChip";

function formatDate(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** Agent-scoped recent scoring runs. Independent from any cross-agent Home dashboard variant. */
export default function RecentScoringRunsTable({ runs }: { runs: ScoringRun[] }) {
  return (
    <Paper sx={{ p: 2.5, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
        Recent scoring runs
      </Typography>
      {runs.length === 0 ? (
        <Box sx={{ py: 3, textAlign: "center" }}>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            No scoring runs yet.
          </Typography>
        </Box>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>Run</TableCell>
              <TableCell sx={{ fontWeight: 600, color: "text.secondary", width: 110 }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 600, color: "text.secondary", width: 90 }}>Sessions</TableCell>
              <TableCell sx={{ fontWeight: 600, color: "text.secondary", width: 90 }}>Pass rate</TableCell>
              <TableCell sx={{ fontWeight: 600, color: "text.secondary", width: 120 }}>Score</TableCell>
              <TableCell sx={{ fontWeight: 600, color: "text.secondary", width: 100 }}>Verdict</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {runs.map((run) => (
              <TableRow key={run.id} sx={{ "&:last-child td": { borderBottom: 0 } }}>
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {run.label}
                    </Typography>
                    {run.inProgress && <Chip label="In progress" size="small" color="primary" sx={{ height: 18, fontSize: "0.62rem" }} />}
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    {formatDate(run.completedAt ?? run.startedAt)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    {run.sessionCount}
                  </Typography>
                </TableCell>
                <TableCell>
                  {run.inProgress ? (
                    <Typography variant="body2" sx={{ color: "text.disabled" }}>
                      -
                    </Typography>
                  ) : (
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600, color: run.passRate >= 75 ? "success.main" : run.passRate >= 50 ? "warning.main" : "error.main" }}
                    >
                      {run.passRate}%
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <GradeChip grade={run.grade} size="small" />
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      {run.compositeScore != null ? `${run.compositeScore}/100` : "-"}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  {run.inProgress || !run.verdict ? (
                    <Typography variant="body2" sx={{ color: "text.disabled" }}>
                      -
                    </Typography>
                  ) : (
                    <CompositeVerdictChip verdict={run.verdict} />
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
