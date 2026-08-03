import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Divider from "@mui/material/Divider";
import type { View } from "../view";
import type { Session, ShipDecision } from "../types";
import { getSession } from "../data/mock";
import ScoreRing from "../components/shared/ScoreRing";
import GradeChip from "../components/shared/GradeChip";
import { SessionVerdictChip } from "../components/shared/VerdictChip";
import DimensionScoreBar from "../components/shared/DimensionScoreBar";
import { DIMENSION_LABEL, DIMENSION_ORDER } from "../data/dimensionLabels";
import AttributionPanel from "./session-detail/AttributionPanel";
import ShipDecisionPanel from "./session-detail/ShipDecisionPanel";

const WORST_DIMENSION_GATE = 55;

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function formatDuration(ms: number): string {
  if (ms >= 60_000) return `${Math.floor(ms / 60_000)}m ${Math.round((ms % 60_000) / 1000)}s`;
  return `${(ms / 1000).toFixed(1)}s`;
}

/** Session detail: the score, the dimension breakdown, why it happened, and the ship call. */
export default function SessionDetailView({
  agentId,
  runId,
  sessionId,
  navigate,
}: {
  agentId: string;
  runId: string;
  sessionId: string;
  navigate: (v: View) => void;
}) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    setSession(undefined);
    getSession(agentId, runId, sessionId).then((s) => {
      if (!cancelled) setSession(s);
    });
    return () => {
      cancelled = true;
    };
  }, [agentId, runId, sessionId]);

  function handleBack() {
    navigate({ name: "run-detail", agentId, runId });
  }

  if (session === undefined) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Loading session...
        </Typography>
      </Box>
    );
  }

  if (session === null) {
    return (
      <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2 }}>
        <Typography>Session not found.</Typography>
        <Button variant="outlined" size="small" onClick={handleBack} sx={{ alignSelf: "flex-start" }}>
          ← Back to Run
        </Button>
      </Box>
    );
  }

  const lowDimensions = DIMENSION_ORDER.filter((key) => {
    const d = session.dimensionScores[key];
    return d != null && d.score < WORST_DIMENSION_GATE;
  });

  function handleShipDecisionSaved(decision: ShipDecision) {
    setSession((prev) => (prev ? { ...prev, shipDecision: decision } : prev));
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Button size="small" onClick={handleBack} sx={{ alignSelf: "flex-start", textTransform: "none", pl: 0 }}>
        ← Back to Run
      </Button>

      {session.verdict !== "PASS" && lowDimensions.length > 0 && (
        <Alert severity="warning" sx={{ borderRadius: 1.5 }}>
          Scored below the minimum threshold ({WORST_DIMENSION_GATE}) on:{" "}
          {lowDimensions.map((key) => DIMENSION_LABEL[key]).join(", ")}.
        </Alert>
      )}

      {session.safetyOverride && (
        <Alert severity={session.safetyOverride.severity === "Critical" ? "error" : "warning"} sx={{ borderRadius: 1.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            Safety override ({session.safetyOverride.severity}): {session.safetyOverride.severity === "Critical" ? "forced FAIL" : "forced Pending"}
          </Typography>
          <Typography variant="caption">{session.safetyOverride.detail}</Typography>
        </Alert>
      )}

      <Paper sx={{ p: 2.5, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
        <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
          <ScoreRing score={session.compositeScore} size={100} />
          <Box sx={{ flex: 1, minWidth: 220 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5, flexWrap: "wrap" }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {session.scenario}
              </Typography>
              <GradeChip grade={session.grade} size="small" />
              <SessionVerdictChip verdict={session.verdict} />
            </Box>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {formatDateTime(session.ts)} · {formatDuration(session.durationMs)}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 2.5 }} />

        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", columnGap: 4 }}>
          {DIMENSION_ORDER.filter((key) => session.dimensionScores[key]).map((key) => (
            <DimensionScoreBar key={key} dimension={key} data={session.dimensionScores[key]} />
          ))}
        </Box>
      </Paper>

      {session.attribution && <AttributionPanel attribution={session.attribution} />}

      <ShipDecisionPanel
        agentId={agentId}
        runId={runId}
        sessionId={sessionId}
        verdict={session.verdict}
        shipDecision={session.shipDecision}
        onSaved={handleShipDecisionSaved}
      />
    </Box>
  );
}
