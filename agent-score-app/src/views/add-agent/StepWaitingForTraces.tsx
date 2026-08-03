import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import type { FingerprintMatch } from "../../types";
import { getFingerprintMatch, simulateTraces } from "../../data/mock";

type Phase = "idle" | "processing" | "done";

const CHECKLIST_STEPS = ["Waiting for first trace", "Trace received", "Agent recognized"];
const STEP_DELAY_MS = 550;

/**
 * Step 3 of the Add Agent wizard. The agent already exists in the store by
 * the time this step is shown (created once by the orchestrator). There is
 * no real trace pipeline in this mock UI, so the "Simulate first trace"
 * button is the actual gate that advances state - the checklist animation
 * below it is decorative only (REQ-042).
 */
export default function StepWaitingForTraces({
  agentId,
  fingerprintMatch,
  onFingerprintMatch,
}: {
  agentId: string;
  fingerprintMatch: FingerprintMatch | null;
  onFingerprintMatch: (match: FingerprintMatch) => void;
}) {
  const [phase, setPhase] = useState<Phase>(fingerprintMatch ? "done" : "idle");
  const [checklistIndex, setChecklistIndex] = useState(fingerprintMatch ? CHECKLIST_STEPS.length : 0);

  // Drives the sequential "Waiting for first trace" -> "Trace received" ->
  // "Agent recognized" checklist animation, then fetches the (real) match.
  useEffect(() => {
    if (phase !== "processing") return;

    if (checklistIndex >= CHECKLIST_STEPS.length) {
      let cancelled = false;
      getFingerprintMatch(agentId).then((match) => {
        if (cancelled || !match) return;
        onFingerprintMatch(match);
        setPhase("done");
      });
      return () => {
        cancelled = true;
      };
    }

    const t = setTimeout(() => setChecklistIndex((i) => i + 1), STEP_DELAY_MS);
    return () => clearTimeout(t);
  }, [phase, checklistIndex, agentId, onFingerprintMatch]);

  function handleSimulate() {
    simulateTraces(agentId, 1);
    setPhase("processing");
    setChecklistIndex(0);
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        Send a trace from your agent to finish setup. Since there's no live connection in this demo, use the button
        below to simulate one arriving.
      </Typography>

      <Paper sx={{ p: 2.5, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {CHECKLIST_STEPS.map((step, i) => (
            <Box key={step} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box sx={{ width: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {i < checklistIndex ? (
                  <Typography sx={{ color: "success.main", fontWeight: 700 }}>✓</Typography>
                ) : i === checklistIndex && phase === "processing" ? (
                  <CircularProgress size={14} thickness={5} />
                ) : (
                  <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "action.disabledBackground" }} />
                )}
              </Box>
              <Typography variant="body2" sx={{ color: i <= checklistIndex ? "text.primary" : "text.disabled" }}>
                {step}
              </Typography>
            </Box>
          ))}
        </Box>

        {phase !== "done" && (
          <Button
            variant="outlined"
            size="small"
            onClick={handleSimulate}
            disabled={phase === "processing"}
            sx={{ mt: 2.5 }}
          >
            Simulate first trace
          </Button>
        )}
      </Paper>

      {phase === "done" && fingerprintMatch && (
        <Alert severity="success" sx={{ borderRadius: 1.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.25 }}>
            Matched profile: {fingerprintMatch.profileName}
          </Typography>
          <Typography variant="caption">
            {fingerprintMatch.confidence}% confidence · based on {fingerprintMatch.sessionCount} session
            {fingerprintMatch.sessionCount === 1 ? "" : "s"}
          </Typography>
        </Alert>
      )}
    </Box>
  );
}
