import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import LinearProgress from "@mui/material/LinearProgress";
import SvgIcon from "@mui/material/SvgIcon";
import type { View, DimensionScore, Session } from "../types";
import { getProject, getRun, getSession, sessionCompositeScore, sessionGrade } from "../data/mock";
import { DIMENSION_QUESTION, SIG_LABEL } from "../components/ScoreBar";
import { projectVerdictBands, sessionVerdict, scoreColor } from "../data/verdict";
import VerdictChip from "../components/VerdictChip";
import GradeChip from "../components/GradeChip";

interface Props {
  projectId: string;
  runId: string;
  sessionId: string;
  navigate: (v: View) => void;
}

// Order mirrors the weighting used by sessionCompositeScore — most heavily
// weighted dimensions first.
const DIMENSIONS: { key: keyof Session["scores"]; label: string }[] = [
  { key: "benchmarkPerformance", label: "Correctness" },
  { key: "valueEfficiency", label: "Efficiency" },
  { key: "uxSignal", label: "Relevance" },
  { key: "harmony", label: "Safety" },
  { key: "stability", label: "Consistency" },
  { key: "agency", label: "Tool Use" },
  { key: "groundedness", label: "Groundedness" },
  { key: "instructionFollowing", label: "Instruction Following" },
  { key: "transparency", label: "Transparency" },
  { key: "robustness", label: "Robustness" },
  { key: "communication", label: "Communication" },
];

function DimensionCard({ label, dimension }: { label: string; dimension: DimensionScore | null }) {
  const explanation = DIMENSION_QUESTION[label] ?? "";

  if (!dimension) {
    return (
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 1.5, opacity: 0.6 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, width: "fit-content" }}>{label}</Typography>
          <Typography variant="body2" sx={{ color: "text.disabled" }}>N/A</Typography>
        </Box>
        {explanation && (
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>{explanation}</Typography>
        )}
        <LinearProgress variant="determinate" value={0} sx={{ height: 7, borderRadius: 4, opacity: 0.3 }} />
      </Paper>
    );
  }

  const color = scoreColor(dimension.score);

  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 1.5 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, width: "fit-content" }}>{label}</Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {dimension.rawDeltaPct !== undefined && (
            <Typography variant="caption" sx={{ color: dimension.rawDeltaPct >= 0 ? "success.main" : "error.main", fontWeight: 500 }}>
              {dimension.rawDeltaPct >= 0 ? "+" : ""}{dimension.rawDeltaPct}%
            </Typography>
          )}
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: `${color}.main` }}>
            {dimension.score}
          </Typography>
        </Box>
      </Box>
      {explanation && (
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>{explanation}</Typography>
      )}
      <LinearProgress variant="determinate" value={dimension.score} color={color} sx={{ height: 7, borderRadius: 4, mb: dimension.sigs.length > 0 ? 1.5 : 0 }} />
      {dimension.sigs.length > 0 && (
        <>
          <Divider sx={{ my: 1.5 }} />
          <Typography variant="overline" sx={{ color: "text.disabled", letterSpacing: 0.8, fontSize: "0.65rem", display: "block", mb: 1 }}>
            Evals
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
            {dimension.sigs.map((sig) => {
              const colonIdx = sig.indexOf(": ");
              const key = colonIdx >= 0 ? sig.slice(0, colonIdx) : sig;
              const val = colonIdx >= 0 ? sig.slice(colonIdx + 2) : "";
              return (
                <Box key={sig} sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>{SIG_LABEL[key] ?? key}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: "monospace" }}>{val}</Typography>
                </Box>
              );
            })}
          </Box>
        </>
      )}
    </Paper>
  );
}

export default function ScoreBreakdownView({ projectId, runId, sessionId, navigate }: Props) {
  const project = getProject(projectId);
  const run = getRun(projectId, runId);
  const session = getSession(projectId, runId, sessionId);

  if (!project || !run || !session) {
    return <Box sx={{ p: 3 }}><Typography>Score breakdown not found.</Typography></Box>;
  }

  const composite = sessionCompositeScore(session);
  const grade = sessionGrade(composite);
  const bands = projectVerdictBands(project);

  return (
    <Box sx={{ p: 3, maxWidth: 760 }}>
      <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
        <Button size="small" onClick={() => navigate({ name: "agents" })} sx={{ color: "text.disabled" }}>
          Agents
        </Button>
        <Typography sx={{ color: "text.disabled", alignSelf: "center" }}>/</Typography>
        <Button size="small" onClick={() => navigate({ name: "project", projectId })} sx={{ color: "text.secondary" }}>
          {project.name}
        </Button>
        <Typography sx={{ color: "text.disabled", alignSelf: "center" }}>/</Typography>
        <Typography variant="body2" sx={{ alignSelf: "center", color: "text.secondary" }}>Score Breakdown</Typography>
      </Box>

      <Paper variant="outlined" sx={{ p: 2.5, mb: 3, borderRadius: 1.5 }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>{session.scenario}</Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {run.label} · {new Date(session.ts).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </Typography>
          </Box>
          <VerdictChip band={sessionVerdict(session, bands).band} size="medium" />
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 2 }}>
          <GradeChip grade={grade} size="small" />
          <Typography variant="subtitle1" sx={{ fontWeight: 700, fontFamily: "monospace" }}>{composite}/100</Typography>
          <Typography variant="caption" sx={{ color: "text.disabled" }}>composite score</Typography>
        </Box>
      </Paper>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
        <SvgIcon sx={{ fontSize: "1rem", color: "text.disabled" }}>
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
        </SvgIcon>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          Each dimension below shows what it measures. Evals show the raw signals feeding its score.
        </Typography>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {DIMENSIONS.map(({ key, label }) => {
          const dimension = session.scores[key];
          if (key !== "benchmarkPerformance" && key !== "valueEfficiency" && key !== "uxSignal" && !dimension) return null;
          return <DimensionCard key={key} label={label} dimension={dimension ?? null} />;
        })}
      </Box>
    </Box>
  );
}
