/** Reassign a slot's binding to a different version (spec S14a §2 "Reassign
 *  picker options in tenant scope"). In tenant scope `useBindableVersions`
 *  already merges the tenant lineage with the global lineage — the binding
 *  route accepts either, but no single route returns both.
 */

import { useEffect, useState } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Typography from "@mui/material/Typography";

import {
  useBindableVersions,
  useSetBinding,
  type AgentVersionRead,
} from "@/back-office/agent-registry/api";
import { Combobox, type ComboboxOption } from "@/shared/components/combobox";

import { RegistryErrorAlert } from "./RegistryErrorAlert";

interface ReassignBindingDialogProps {
  open: boolean;
  onClose: () => void;
  tenantId: string | null;
  slotSlug: string;
  currentVersionId: string | null;
}

function versionOption(version: AgentVersionRead): ComboboxOption {
  const revoked = version.revokedAt !== null;
  const scope = version.tenantId === null ? "global" : "tenant";
  return {
    value: version.id,
    label: `v${version.versionNumber} · ${version.name}`,
    description: revoked ? `${scope} · revoked` : scope,
    disabled: revoked,
  };
}

export function ReassignBindingDialog({
  open,
  onClose,
  tenantId,
  slotSlug,
  currentVersionId,
}: ReassignBindingDialogProps) {
  const { versions, tenant, global } = useBindableVersions({ tenantId, slotSlug });
  const setBinding = useSetBinding();
  const resetBinding = setBinding.reset;
  const [selectedVersionId, setSelectedVersionId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (open) {
      setSelectedVersionId(undefined);
      resetBinding();
    }
  }, [open, tenantId, slotSlug, resetBinding]);

  const canConfirm =
    selectedVersionId != null && selectedVersionId !== currentVersionId;

  const handleConfirm = () => {
    if (!selectedVersionId) return;
    setBinding.mutate(
      { tenantId, slotSlug, agentVersionId: selectedVersionId },
      { onSuccess: () => onClose() },
    );
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" data-testid="reassign-dialog">
      <DialogTitle>Reassign slot binding</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        <Typography variant="body2" color="text.secondary">
          Pick the version this slot should serve.
        </Typography>
        {tenant.isError ? (
          <RegistryErrorAlert
            error={tenant.error}
            fallback="Failed to load this tenant's version lineage"
          />
        ) : null}
        {global.isError ? (
          <RegistryErrorAlert
            error={global.error}
            fallback="Failed to load the global version lineage"
          />
        ) : null}
        <Combobox
          options={versions.map(versionOption)}
          value={selectedVersionId}
          onChange={setSelectedVersionId}
          testId="reassign-version-picker"
          ariaLabel="Version to bind"
          placeholder="Select a version…"
        />
        {([...(tenantId === null ? [] : ["tenant" as const]), "global" as const]).map((scope) => {
          const state = scope === "tenant" ? tenant : global;
          return (
            <div key={scope}>
              {state.isLoading ? (
                <Typography variant="body2" data-testid={`reassign-${scope}-loading`}>
                  Loading {scope} versions…
                </Typography>
              ) : null}
              {state.hasNextPage ? (
                <Typography variant="caption" data-testid={`reassign-${scope}-more-available`}>
                  More {scope} versions are available. Search covers loaded versions only.
                </Typography>
              ) : null}
              {state.isTruncated ? (
                <Typography variant="caption" data-testid={`reassign-${scope}-truncated`}>
                  {scope === "tenant" ? "Tenant" : "Global"} history is truncated at the server limit.
                  Search covers loaded versions only. Ask an administrator to increase the history limit to access older versions.
                </Typography>
              ) : null}
              {state.hasNextPage || state.isError ? (
                <Button
                  data-testid={`reassign-${scope}-load-more`}
                  disabled={state.isLoading || state.isFetchingNextPage}
                  onClick={() => void (state.hasNextPage ? state.fetchNextPage() : state.refetch())}
                >
                  {state.isFetchingNextPage ? "Loading…" : state.isError ? `Retry ${scope} versions` : `Load more ${scope} versions`}
                </Button>
              ) : null}
            </div>
          );
        })}
        <RegistryErrorAlert
          error={setBinding.error}
          fallback="Failed to reassign slot binding"
        />
      </DialogContent>
      <DialogActions>
        <Button
          data-testid="reassign-cancel"
          onClick={onClose}
          disabled={setBinding.isPending}
        >
          Cancel
        </Button>
        <Button
          data-testid="reassign-confirm"
          variant="contained"
          disabled={!canConfirm || setBinding.isPending}
          onClick={handleConfirm}
        >
          Reassign
        </Button>
      </DialogActions>
    </Dialog>
  );
}
