import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Divider from "@mui/material/Divider";
import type { View } from "../../../view";
import type { JudgeInfo, ScoringProfileSummary, ScoringRun } from "../../../types";
import { getAgentJudge, getAgentProfile, listAgentScoringRuns } from "../../../data/mock";
import { DIMENSION_LABEL } from "../../../data/dimensionLabels";
import GradeChip from "../../../components/shared/GradeChip";
import { CompositeVerdictChip } from "../../../components/shared/VerdictChip";
import DescribeAgentPanel from "./DescribeAgentPanel";

function formatDate(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/**
 * Scoring tab (Milestone 2): the profile/judge this agent is scored against,
 * the "describe your agent" onboarding-without-traces affordance, and the
 * full scoring run history (no cap - that's the difference from the
 * Overview tab's "recent runs" table).
 */
export default function ScoringTab({ agentId, navigate }: { agentId: string; navigate: (v: View) => void }) {
  const [profile, setProfile] = useState<ScoringProfileSummary | null>(null);
  const [judge, setJudge] = useState<JudgeInfo | null>(null);
  const [runs, setRuns] = useState<ScoringRun[]>([]);
  const [describeOpen, setDescribeOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getAgentProfile(agentId), getAgentJudge(agentId), listAgentScoringRuns(agentId)]).then(
      ([nextProfile, nextJudge, nextRuns]) => {
        if (cancelled) return;
        setProfile(nextProfile);
        setJudge(nextJudge);
        setRuns(nextRuns);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [agentId]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button variant="outlined" size="small" onClick={() => setDescribeOpen(true)}>
          Describe agent
        </Button>
      </Box>

      {profile && (
        <Paper sx={{ p: 2.5, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", mb: 1.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {profile.name}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.disabled" }}>
              v{profile.version} · {profile.evalCount} evals
            </Typography>
          </Box>

          <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 600 }}>
            DIMENSIONS COVERED
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mt: 0.5, mb: 2 }}>
            {profile.dimensions.map((dim) => (
              <Chip key={dim} label={DIMENSION_LABEL[dim]} size="small" variant="outlined" />
            ))}
          </Box>

          <Divider sx={{ mb: 1.5 }} />

          <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 600 }}>
            VERDICT BANDS
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 0.5 }}>
            <Typography variant="body2">
              <strong style={{ color: "var(--mui-palette-success-main)" }}>Ship</strong> ≥{profile.verdictBands.ship}
            </Typography>
            <Typography variant="body2">
              <strong style={{ color: "var(--mui-palette-success-main)" }}>Ship with notes</strong> ≥
              {profile.verdictBands.shipWithNotes}
            </Typography>
            <Typography variant="body2">
              <strong style={{ color: "var(--mui-palette-warning-main)" }}>Review</strong> ≥{profile.verdictBands.review}
            </Typography>
            <Typography variant="body2">
              <strong style={{ color: "var(--mui-palette-error-main)" }}>Block</strong> &lt;{profile.verdictBands.block}
            </Typography>
          </Box>
        </Paper>
      )}

      {judge && (
        <Paper sx={{ p: 2.5, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {judge.name}
            </Typography>
            <Chip label={judge.provider} size="small" color="primary" variant="outlined" />
            <Typography variant="caption" sx={{ fontFamily: "monospace", color: "text.secondary" }}>
              {judge.model}
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {judge.rationale}
          </Typography>
        </Paper>
      )}

      <Paper sx={{ p: 2.5, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
          Scoring run history
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
                <TableRow
                  key={run.id}
                  hover
                  onClick={() => navigate({ name: "run-detail", agentId, runId: run.id })}
                  sx={{ cursor: "pointer", "&:last-child td": { borderBottom: 0 } }}
                >
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {run.label}
                      </Typography>
                      {run.inProgress && (
                        <Chip label="In progress" size="small" color="primary" sx={{ height: 18, fontSize: "0.62rem" }} />
                      )}
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

      <DescribeAgentPanel agentId={agentId} open={describeOpen} onClose={() => setDescribeOpen(false)} />
    </Box>
  );
}
