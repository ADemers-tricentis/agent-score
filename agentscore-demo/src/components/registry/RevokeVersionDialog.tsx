import { useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import type { AgentVersion, SlotBindingImpact } from "../../types";
import { bindingsForVersion, revokeAgentVersion } from "../../data/mock";
import TypedConfirmInput from "../TypedConfirmInput";

interface Props {
  open: boolean;
  onClose: () => void;
  version: AgentVersion;
}

export default function RevokeVersionDialog({ open, onClose, version }: Props) {
  const [result, setResult] = useState<{ affectedBindingCount: number; affectedBindings: SlotBindingImpact[] } | null>(null);

  const visibleBindings = bindingsForVersion(version.id);

  function handleClose() {
    setResult(null);
    onClose();
  }

  function handleConfirm() {
    setResult(revokeAgentVersion(version.id));
  }

  if (result) {
    return (
      <Dialog open={open} disableEscapeKeyDown maxWidth="sm" fullWidth data-testid="revoke-impact-panel">
        <DialogTitle sx={{ fontWeight: 700 }}>Version revoked</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {result.affectedBindingCount} slot binding{result.affectedBindingCount === 1 ? "" : "s"} still point at
            this version and will refuse every run until reassigned.
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {result.affectedBindings.map((b) => (
              <Box key={b.id} sx={{ display: "flex", justifyContent: "space-between", py: 0.5, borderBottom: "1px solid", borderColor: "divider" }}>
                <Typography variant="body2" sx={{ fontFamily: "monospace" }}>{b.slotSlug}</Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>{b.isGlobal ? "global" : b.tenantId}</Typography>
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={handleClose} data-testid="revoke-impact-ack">
            Acknowledge
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Revoke version</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Revoking is permanent — <strong>{version.name}</strong> can never be un-revoked. Recovery means
          publishing a new version and rebinding every slot that used this one.
        </Typography>

        {visibleBindings.length > 0 ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 2 }}>
            {visibleBindings.map((b) => (
              <Box key={b.id} data-testid={`revoke-impact-row-${b.id}`} sx={{ display: "flex", justifyContent: "space-between", py: 0.5, borderBottom: "1px solid", borderColor: "divider" }}>
                <Typography variant="body2" sx={{ fontFamily: "monospace" }}>{b.slotSlug}</Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>{b.isGlobal ? "global" : b.tenantId}</Typography>
              </Box>
            ))}
          </Box>
        ) : (
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
            No bindings visible from this scope currently point at this version.
          </Typography>
        )}

        <Alert severity="warning" sx={{ mb: 2 }} data-testid="revoke-unknown-impact-note">
          Bindings held by other tenants aren't knowable from this scope until the revoke completes.
        </Alert>

        <TypedConfirmInput
          confirmText={version.name}
          buttonLabel="Revoke version"
          testId="revoke-version"
          onConfirm={handleConfirm}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
}
