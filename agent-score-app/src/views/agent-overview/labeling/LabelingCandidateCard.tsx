import { useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import ToggleButton from "@mui/material/ToggleButton";
import type { LabelingCandidate, SessionVerdict } from "../../../types";
import { SessionVerdictChip } from "../../../components/shared/VerdictChip";

const VERDICT_OPTIONS: SessionVerdict[] = ["PASS", "PARTIAL", "FAIL"];

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString();
}

/**
 * One item in the labeling queue: shows the flagged trace and suggested
 * verdict, and lets a reviewer either accept it as-is or override it with a
 * different verdict plus an optional note.
 */
export default function LabelingCandidateCard({
  candidate,
  onConfirm,
  onOverride,
}: {
  candidate: LabelingCandidate;
  onConfirm: () => void;
  onOverride: (verdict: SessionVerdict, note?: string) => void;
}) {
  const [overriding, setOverriding] = useState(false);
  const [overrideVerdict, setOverrideVerdict] = useState<SessionVerdict>(candidate.suggestedVerdict);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleConfirm() {
    setSubmitting(true);
    await onConfirm();
  }

  async function handleSubmitOverride() {
    setSubmitting(true);
    await onOverride(overrideVerdict, note.trim() || undefined);
  }

  return (
    <Paper sx={{ p: 2.5, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2 }}>
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {candidate.traceName}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {formatTimestamp(candidate.ts)}
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
            {candidate.reason}
          </Typography>
        </Box>
        <SessionVerdictChip verdict={candidate.suggestedVerdict} />
      </Box>

      {overriding ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 2 }}>
          <ToggleButtonGroup
            value={overrideVerdict}
            exclusive
            size="small"
            onChange={(_, v: SessionVerdict | null) => v && setOverrideVerdict(v)}
          >
            {VERDICT_OPTIONS.map((v) => (
              <ToggleButton key={v} value={v} sx={{ textTransform: "none", px: 2 }}>
                {v === "PASS" ? "Passed" : v === "PARTIAL" ? "Pending" : "Failed"}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>

          <TextField
            label="Note (optional)"
            size="small"
            fullWidth
            multiline
            minRows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          <Box sx={{ display: "flex", gap: 1 }}>
            <Button variant="contained" size="small" disabled={submitting} onClick={handleSubmitOverride}>
              Submit override
            </Button>
            <Button size="small" disabled={submitting} onClick={() => setOverriding(false)}>
              Cancel
            </Button>
          </Box>
        </Box>
      ) : (
        <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
          <Button variant="contained" size="small" disabled={submitting} onClick={handleConfirm}>
            Confirm
          </Button>
          <Button variant="outlined" size="small" disabled={submitting} onClick={() => setOverriding(true)}>
            Override
          </Button>
        </Box>
      )}
    </Paper>
  );
}
