import { useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import type { AgentVersion } from "../../types";
import { bindableVersions, reassignBinding } from "../../data/mock";
import { useToast } from "../Toast";

interface Props {
  open: boolean;
  onClose: () => void;
  slotId: string;
  tenantId: string | null;
  currentVersionId: string | undefined;
}

interface VersionOption {
  id: string;
  label: string;
  description: string;
  disabled: boolean;
}

export default function ReassignBindingDialog({ open, onClose, slotId, tenantId, currentVersionId }: Props) {
  const toast = useToast();
  const [selected, setSelected] = useState<VersionOption | null>(null);

  const options: VersionOption[] = bindableVersions(slotId, tenantId).map((v: AgentVersion) => ({
    id: v.id,
    label: `v${v.versionNumber} · ${v.name}`,
    description: `${v.tenantId === null ? "global" : "tenant"}${v.revokedAt ? " · revoked" : ""}`,
    disabled: Boolean(v.revokedAt),
  }));

  function handleClose() {
    setSelected(null);
    onClose();
  }

  function handleConfirm() {
    if (!selected) return;
    reassignBinding(slotId, tenantId, selected.id);
    toast.success("Slot binding reassigned.");
    handleClose();
  }

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm" data-testid="reassign-dialog">
      <DialogTitle sx={{ fontWeight: 700 }}>Reassign slot binding</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
          Pick the version this slot should serve.
        </Typography>
        <Autocomplete
          options={options}
          getOptionLabel={(o) => o.label}
          getOptionDisabled={(o) => o.disabled}
          renderOption={(props, option) => (
            <li {...props} key={option.id}>
              <div>
                <div>{option.label}</div>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  {option.description}
                </Typography>
              </div>
            </li>
          )}
          value={selected}
          onChange={(_, value) => setSelected(value)}
          renderInput={(params) => (
            <TextField {...params} label="Version to bind" placeholder="Select a version…" size="small" data-testid="reassign-version-picker" />
          )}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="inherit" data-testid="reassign-cancel">
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={!selected || selected.id === currentVersionId}
          data-testid="reassign-confirm"
        >
          Reassign
        </Button>
      </DialogActions>
    </Dialog>
  );
}
