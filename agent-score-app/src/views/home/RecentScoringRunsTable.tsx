import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import type { Agent, ScoringRun } from "../../types";
import type { View } from "../../view";
import GradeChip from "../../components/shared/GradeChip";
import { CompositeVerdictChip } from "../../components/shared/VerdictChip";

const ROW_COLUMNS = "2fr 1.4fr 90px 90px 100px";

function formatDate(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** Recent scoring runs table for the Home dashboard (REQ-058). */
export default function RecentScoringRunsTable({
  runs,
  agents,
  navigate,
}: {
  runs: ScoringRun[];
  agents: Agent[];
  navigate: (v: View) => void;
}) {
  const agentName = (agentId: string) => agents.find((a) => a.agent_id === agentId)?.name ?? agentId;

  const recent = runs
    .slice()
    .sort((a, b) => {
      const aTime = new Date(a.completedAt ?? a.startedAt).getTime();
      const bTime = new Date(b.completedAt ?? b.startedAt).getTime();
      return bTime - aTime;
    })
    .slice(0, 6);

  return (
    <Paper sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
      <Box sx={{ px: 2, pt: 2, pb: 1.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Recent scoring runs
        </Typography>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          Across all agents
        </Typography>
      </Box>

      {recent.length === 0 ? (
        <Box sx={{ px: 2, pb: 2.5, pt: 1 }}>
          <Typography variant="body2" sx={{ color: "text.disabled" }}>
            No scoring runs yet.
          </Typography>
        </Box>
      ) : (
        <Box>
          <Box sx={{ display: "grid", gridTemplateColumns: ROW_COLUMNS, px: 2, pb: 0.5, gap: 1 }}>
            {["Agent", "Run", "Score", "Verdict", "Date"].map((h) => (
              <Typography key={h} variant="caption" sx={{ color: "text.disabled", fontWeight: 700, fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: 0.5 }}>
                {h}
              </Typography>
            ))}
          </Box>
          <Divider />
          {recent.map((run, idx) => (
            <Box
              key={run.id}
              onClick={() => navigate({ name: "agent-overview", agentId: run.agentId })}
              sx={{
                display: "grid",
                gridTemplateColumns: ROW_COLUMNS,
                px: 2,
                py: 1.25,
                gap: 1,
                alignItems: "center",
                cursor: "pointer",
                borderTop: idx > 0 ? "1px solid" : "none",
                borderColor: "divider",
                "&:hover": { bgcolor: "action.hover" },
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {agentName(run.agentId)}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {run.label}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <GradeChip grade={run.grade} size="small" />
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {run.compositeScore ?? "-"}
                </Typography>
              </Box>
              <Box>{run.verdict && <CompositeVerdictChip verdict={run.verdict} />}</Box>
              <Typography variant="caption" sx={{ color: "text.disabled" }}>
                {formatDate(run.completedAt)}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  );
}
