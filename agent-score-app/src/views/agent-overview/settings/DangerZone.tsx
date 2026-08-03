import { useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import type { View } from "../../../view";
import { archiveAgent, removeAgent } from "../../../data/mock";

/**
 * Archive/remove actions for the Settings tab. Both are destructive-ish and
 * gated behind a confirmation dialog (REQ: no bare browser confirm()).
 * Remove is the more serious of the two — it's permanent, so its confirm
 * button uses the destructive/error color to make that visually obvious.
 */
export default function DangerZone({ agentId, navigate }: { agentId: string; navigate: (v: View) => void }) {
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [removing, setRemoving] = useState(false);

  async function handleArchive() {
    setArchiving(true);
    await archiveAgent(agentId);
    setArchiving(false);
    setArchiveOpen(false);
  }

  async function handleRemove() {
    setRemoving(true);
    await removeAgent(agentId);
    // The agent record no longer exists after this — navigate away immediately.
    navigate({ name: "home" });
  }

  return (
    <Paper sx={{ p: 2.5, border: "1px solid", borderColor: "error.main", borderRadius: 2 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "error.main", mb: 1.5 }}>
        Danger Zone
      </Typography>

      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 1 }}>
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Archive this agent
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Pauses trace ingest but keeps all existing history. Can be reversed later.
          </Typography>
        </Box>
        <Button variant="outlined" color="warning" onClick={() => setArchiveOpen(true)}>
          Archive
        </Button>
      </Box>

      <Divider sx={{ my: 1 }} />

      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 1 }}>
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Remove this agent
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Permanently deletes this agent and its history. This cannot be undone.
          </Typography>
        </Box>
        <Button variant="outlined" color="error" onClick={() => setRemoveOpen(true)}>
          Remove
        </Button>
      </Box>

      <Dialog open={archiveOpen} onClose={() => setArchiveOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Archive this agent?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Trace ingest will pause immediately. Existing history, scoring runs, and settings are kept, and you can
            reactivate this agent later.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setArchiveOpen(false)} disabled={archiving}>
            Cancel
          </Button>
          <Button variant="contained" color="warning" onClick={handleArchive} disabled={archiving}>
            {archiving ? "Archiving..." : "Archive"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={removeOpen} onClose={() => setRemoveOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: "error.main" }}>Permanently remove this agent?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This deletes the agent and all of its traces, scoring runs, and settings. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRemoveOpen(false)} disabled={removing}>
            Cancel
          </Button>
          <Button variant="contained" color="error" onClick={handleRemove} disabled={removing}>
            {removing ? "Removing..." : "Delete permanently"}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
