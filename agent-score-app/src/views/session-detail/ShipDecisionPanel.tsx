import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import ToggleButton from "@mui/material/ToggleButton";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";
import type { SessionVerdict, ShipDecision } from "../../types";
import { recordShipDecision } from "../../data/mock";

type DecisionValue = ShipDecision["decision"];

const DECISION_COLOR: Record<DecisionValue, "success" | "warning" | "error"> = {
  Ship: "success",
  Hold: "warning",
  Reject: "error",
};

/** Whether the computed verdict, on its own, would suggest shipping. */
function verdictImpliesShip(verdict: SessionVerdict): boolean {
  return verdict === "PASS";
}

/**
 * Human ship/hold/reject call for a session, with a free-text rationale and
 * author. Editable after being recorded - re-opens pre-filled rather than
 * becoming permanently read-only.
 */
export default function ShipDecisionPanel({
  agentId,
  runId,
  sessionId,
  verdict,
  shipDecision,
  onSaved,
}: {
  agentId: string;
  runId: string;
  sessionId: string;
  verdict: SessionVerdict;
  shipDecision?: ShipDecision;
  onSaved: (decision: ShipDecision) => void;
}) {
  const [editing, setEditing] = useState(!shipDecision);
  const [decision, setDecision] = useState<DecisionValue>(shipDecision?.decision ?? (verdict === "PASS" ? "Ship" : "Hold"));
  const [rationale, setRationale] = useState(shipDecision?.rationale ?? "");
  const [author, setAuthor] = useState(shipDecision?.author ?? "");
  const [saving, setSaving] = useState(false);

  // Re-seed the form from the existing decision each time editing (re)starts.
  useEffect(() => {
    if (!editing) return;
    setDecision(shipDecision?.decision ?? (verdict === "PASS" ? "Ship" : "Hold"));
    setRationale(shipDecision?.rationale ?? "");
    setAuthor(shipDecision?.author ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-seed when editing starts, not on every keystroke
  }, [editing]);

  const overridesVerdict = (decision === "Ship") !== verdictImpliesShip(verdict);
  const canSave = rationale.trim() !== "" && author.trim() !== "";

  async function handleSave() {
    setSaving(true);
    const next: ShipDecision = {
      decision,
      rationale: rationale.trim(),
      author: author.trim(),
      ts: new Date().toISOString(),
      overridesVerdict,
    };
    await recordShipDecision(agentId, runId, sessionId, next);
    setSaving(false);
    setEditing(false);
    onSaved(next);
  }

  return (
    <Paper sx={{ p: 2.5, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
        Ship decision
      </Typography>

      {!editing && shipDecision ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
            <Chip label={shipDecision.decision} size="small" color={DECISION_COLOR[shipDecision.decision]} />
            {shipDecision.overridesVerdict && (
              <Chip label="Overrides computed verdict" size="small" variant="outlined" color="warning" />
            )}
            <Typography variant="caption" sx={{ color: "text.disabled" }}>
              {shipDecision.author} · {new Date(shipDecision.ts).toLocaleString()}
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {shipDecision.rationale}
          </Typography>
          <Button size="small" variant="outlined" onClick={() => setEditing(true)} sx={{ alignSelf: "flex-start", mt: 1 }}>
            Edit decision
          </Button>
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <ToggleButtonGroup
            value={decision}
            exclusive
            size="small"
            onChange={(_, v: DecisionValue | null) => v && setDecision(v)}
          >
            <ToggleButton value="Ship" sx={{ textTransform: "none", px: 2 }}>
              Ship
            </ToggleButton>
            <ToggleButton value="Hold" sx={{ textTransform: "none", px: 2 }}>
              Hold
            </ToggleButton>
            <ToggleButton value="Reject" sx={{ textTransform: "none", px: 2 }}>
              Reject
            </ToggleButton>
          </ToggleButtonGroup>

          {overridesVerdict && (
            <Alert severity="warning" sx={{ borderRadius: 1.5 }}>
              This overrides the computed verdict for this session.
            </Alert>
          )}

          <TextField
            label="Rationale"
            multiline
            minRows={2}
            fullWidth
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
          />
          <TextField label="Author" fullWidth value={author} onChange={(e) => setAuthor(e.target.value)} />

          <Box sx={{ display: "flex", gap: 1 }}>
            <Button variant="contained" disabled={!canSave || saving} onClick={handleSave}>
              Save decision
            </Button>
            {shipDecision && <Button onClick={() => setEditing(false)}>Cancel</Button>}
          </Box>
        </Box>
      )}
    </Paper>
  );
}
