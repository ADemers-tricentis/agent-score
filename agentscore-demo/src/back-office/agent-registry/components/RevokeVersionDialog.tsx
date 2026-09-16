/** Revoke a version, showing its blast radius twice (spec S14a §2 "Revoke
 *  confirmation shape", decision D21). Before the mutation runs: the
 *  bindings the current scope can see plus a removable note that other
 *  tenants' bindings aren't knowable yet (finding F2). After: the
 *  authoritative `affectedBindings` panel, global entries first, acknowledged
 *  before the dialog can close — revocation is unconditional and permanent,
 *  so the operator cannot miss what it hit.
 */

import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Typography from "@mui/material/Typography";

import {
  useRevokeVersion,
  type AgentVersionRead,
  type SlotBindingImpact,
  type VersionRevokeRead,
} from "@/back-office/agent-registry/api";
import { TypedConfirmInput } from "@/shared/components/typed-confirm-input";

import { RegistryErrorAlert } from "./RegistryErrorAlert";

interface RevokeVersionDialogProps {
  open: boolean;
  onClose: () => void;
  tenantId: string | null;
  version: AgentVersionRead;
  visibleBindings: SlotBindingImpact[];
}

function orderGlobalFirst(bindings: SlotBindingImpact[]): SlotBindingImpact[] {
  return [...bindings].sort((a, b) => Number(b.isGlobal) - Number(a.isGlobal));
}

function BindingRow({ binding }: { binding: SlotBindingImpact }) {
  return (
    <Box
      data-testid={`revoke-impact-row-${binding.id}`}
      sx={{
        display: "flex",
        justifyContent: "space-between",
        gap: 1,
        py: 0.5,
        typography: "body2",
      }}
    >
      <span>{binding.slotSlug}</span>
      <span>{binding.isGlobal ? "global" : binding.tenantId}</span>
    </Box>
  );
}

export function RevokeVersionDialog({
  open,
  onClose,
  tenantId,
  version,
  visibleBindings,
}: RevokeVersionDialogProps) {
  const revokeVersion = useRevokeVersion();
  const [result, setResult] = useState<VersionRevokeRead | null>(null);

  useEffect(() => {
    if (open) {
      setResult(null);
      revokeVersion.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (result) {
    const ordered = orderGlobalFirst(result.affectedBindings);
    return (
      <Dialog
        open={open}
        disableEscapeKeyDown
        fullWidth
        maxWidth="sm"
        data-testid="revoke-dialog"
      >
        <DialogTitle>Version revoked</DialogTitle>
        <DialogContent
          data-testid="revoke-impact-panel"
          sx={{ display: "flex", flexDirection: "column", gap: 1 }}
        >
          <Typography variant="body2" color="text.secondary">
            {result.affectedBindingCount} slot binding
            {result.affectedBindingCount === 1 ? "" : "s"} still point at this version and will
            refuse every run until reassigned.
          </Typography>
          {ordered.map((binding) => (
            <BindingRow key={binding.id} binding={binding} />
          ))}
        </DialogContent>
        <DialogActions>
          <Button data-testid="revoke-impact-ack" variant="contained" onClick={onClose}>
            Acknowledge
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  const orderedVisible = orderGlobalFirst(visibleBindings);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" data-testid="revoke-dialog">
      <DialogTitle>Revoke version</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        <Typography variant="body2" color="text.secondary">
          Revoking is permanent — <Box component="strong">{version.name}</Box>{" "}
          can never be un-revoked. Recovery means publishing a new version and
          rebinding every slot that used this one.
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          {orderedVisible.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No bindings visible from this scope currently point at this
              version.
            </Typography>
          ) : (
            orderedVisible.map((binding) => (
              <BindingRow key={binding.id} binding={binding} />
            ))
          )}
        </Box>
        <Alert severity="warning" data-testid="revoke-unknown-impact-note">
          Bindings held by other tenants aren't knowable from this scope until
          the revoke completes.
        </Alert>
        <TypedConfirmInput
          confirmText={version.name}
          buttonLabel="Revoke version"
          busy={revokeVersion.isPending}
          testId="revoke-version"
          onConfirm={() =>
            revokeVersion.mutate(
              { tenantId, versionId: version.id },
              { onSuccess: (data) => setResult(data) },
            )
          }
        />
        <RegistryErrorAlert
          error={revokeVersion.error}
          fallback="Failed to revoke version"
        />
      </DialogContent>
      <DialogActions>
        <Button
          data-testid="revoke-cancel"
          onClick={onClose}
          disabled={revokeVersion.isPending}
        >
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
}
