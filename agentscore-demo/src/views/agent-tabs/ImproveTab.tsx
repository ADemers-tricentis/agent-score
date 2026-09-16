import { useState } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import type { Project, AdvicePriority } from "../../types";
import { getAdviceHistory, requestAdvice, useMockData } from "../../data/mock";
import EmptyState from "../../components/EmptyState";
import TintChip from "../../components/TintChip";

interface Props {
  project: Project;
}

const LIGHTBULB_ICON = "M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z";

const PRIORITY_TINT: Record<AdvicePriority, "destructive" | "warning" | "muted"> = {
  high: "destructive",
  medium: "warning",
  low: "muted",
};

export default function ImproveTab({ project }: Props) {
  useMockData();
  const [submitting, setSubmitting] = useState(false);

  const hasScoredRun = project.runs.some((r) => r.status === "scored");
  const history = getAdviceHistory(project.id);
  const latest = history[0];

  function handleRequest() {
    setSubmitting(true);
    setTimeout(() => {
      requestAdvice(project.id);
      setSubmitting(false);
    }, 1100);
  }

  if (!hasScoredRun) {
    return (
      <EmptyState
        icon={LIGHTBULB_ICON}
        title="No advice yet"
        description="Advice needs a completed or partial scoring run with verdicts."
      />
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3, maxWidth: 900 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Improvement advice</Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Prioritized recommendations grounded in this agent's trace evidence.
          </Typography>
        </Box>
        <Button variant="contained" disabled={submitting} onClick={handleRequest}>
          {submitting ? "Working…" : latest ? "Get new advice" : "Get advice"}
        </Button>
      </Box>

      {submitting && (
        <Typography variant="body2" sx={{ color: "text.secondary" }}>Submitting request…</Typography>
      )}

      {!submitting && !latest && (
        <EmptyState icon={LIGHTBULB_ICON} title="No advice yet" description="Get cited, evidence-bound recommendations from a scoring run." action={<Button variant="contained" onClick={handleRequest}>Get advice</Button>} />
      )}

      {!submitting && latest && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {latest.recommendations.map((rec, i) => (
            <Card key={rec.title} variant="outlined">
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2, mb: 1 }}>
                  <Box>
                    <Typography variant="overline" sx={{ color: "text.disabled" }}>Recommendation {i + 1}</Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{rec.title}</Typography>
                  </Box>
                  <TintChip tint={PRIORITY_TINT[rec.priority]} label={`${rec.priority} priority`} />
                </Box>
                <Typography variant="body2" sx={{ mb: 1, maxWidth: "85ch" }}>{rec.recommendation}</Typography>
                <Divider sx={{ my: 1 }} />
                <Typography variant="caption" sx={{ color: "text.secondary" }}>{rec.rationale}</Typography>
                <Typography variant="caption" sx={{ color: "text.disabled", display: "block", mt: 0.5 }}>
                  Evidence: {rec.evidenceCount} trace references
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {history.length > 1 && (
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Advice history</Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
            {history.slice(1).map((h) => (
              <Typography key={h.id} variant="caption" sx={{ color: "text.secondary" }}>
                {new Date(h.createdAt).toLocaleString()} · {h.recommendations.length} recommendations
              </Typography>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}
