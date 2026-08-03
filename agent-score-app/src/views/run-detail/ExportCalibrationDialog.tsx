import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Typography from "@mui/material/Typography";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Divider from "@mui/material/Divider";
import type { Session } from "../../types";
import { SessionVerdictChip } from "../../components/shared/VerdictChip";

/**
 * Demo-only export affordance: no real file write, just models the
 * calibration-case export flow (pick sessions, show a destination path,
 * confirm). Non-PASS sessions are pre-checked since those are the
 * interesting calibration material.
 */
export default function ExportCalibrationDialog({
  open,
  onClose,
  agentId,
  runId,
  sessions,
}: {
  open: boolean;
  onClose: () => void;
  agentId: string;
  runId: string;
  sessions: Session[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [exported, setExported] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelected(new Set(sessions.filter((s) => s.verdict !== "PASS").map((s) => s.id)));
    setExported(false);
  }, [open, sessions]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const destination = `~/.AgentScore/agents/${agentId}/calibration-cases/${runId}/`;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Export as calibration case</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 1.5 }}>
          Select the sessions to include. Non-passing sessions are pre-selected since those are usually the most
          useful for calibration.
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", maxHeight: 280, overflow: "auto", mb: 1.5 }}>
          {sessions.map((s) => (
            <FormControlLabel
              key={s.id}
              sx={{ mr: 0, justifyContent: "space-between", "& .MuiFormControlLabel-label": { flex: 1 } }}
              control={<Checkbox checked={selected.has(s.id)} onChange={() => toggle(s.id)} size="small" />}
              label={
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                  <Typography variant="body2">{s.scenario}</Typography>
                  <SessionVerdictChip verdict={s.verdict} />
                </Box>
              }
            />
          ))}
        </Box>

        <Divider sx={{ mb: 1.5 }} />

        <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 600 }}>
          DESTINATION
        </Typography>
        <Typography variant="body2" sx={{ fontFamily: "monospace", mt: 0.5 }}>
          {destination}
        </Typography>

        {exported && (
          <Alert severity="success" sx={{ borderRadius: 1.5, mt: 2 }}>
            Exported {selected.size} session{selected.size === 1 ? "" : "s"} to {destination}
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>{exported ? "Done" : "Cancel"}</Button>
        {!exported && (
          <Button variant="contained" disabled={selected.size === 0} onClick={() => setExported(true)}>
            Export
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
