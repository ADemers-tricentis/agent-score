/** TenantSettingsPage — general / provisioning / danger zone for one tenant.
 *
 * Soft-delete stops ingest and can be reversed. Hard-purge removes the
 * tenant row and cascades to agents, keys, and memberships.
 */

import { useEffect, useState } from "react";
import { useFakeMutation as useMutation, useFakeQuery as useQuery, useFakeQueryClient as useQueryClient } from "@/back-office/agents/fake-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import FormLabel from "@mui/material/FormLabel";
import TextField from "@mui/material/TextField";
import IconMaterialSymbolsLocalFireDepartment from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsLocalFireDepartment.mjs";
import IconMaterialSymbolsLock from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsLock.mjs";
import IconMaterialSymbolsRestartAlt from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsRestartAlt.mjs";
import IconMaterialSymbolsSave from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsSave.mjs";
import IconMaterialSymbolsDelete from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsDelete.mjs";

import { toast } from "@/shared/lib/toast";
import * as api from "@/back-office/tenants/tenant-fixtures";
import { makeAdapter } from "@/back-office/tenants/api-keys-adapter";
import { ApiKeysPanel } from "@/shared/components/api-keys/ApiKeysPanel";
import { CascadePreviewList } from "@/shared/components/cascade-preview-list";
import { TENANT_PURGE_CASCADE } from "@/shared/components/purge-cascade";
import { Chip } from "@/shared/components/chip";
import { DangerZone } from "@/shared/components/danger-zone";
import { FormSection } from "@/shared/components/form-section";
import { ProvenanceDl } from "@/shared/components/provenance-dl";
import { TypedConfirmInput } from "@/shared/components/typed-confirm-input";

export function TenantSettingsPage() {
  const { tenantId } = useParams({ strict: false }) as { tenantId: string };
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const tenantQuery = useQuery({
    queryKey: ["tenant", tenantId],
    queryFn: () => api.getTenant(tenantId),
  });

  const [name, setName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmPurge, setConfirmPurge] = useState(false);

  useEffect(() => {
    if (tenantQuery.data) setName(tenantQuery.data.name);
  }, [tenantQuery.data]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["tenant", tenantId] });
    queryClient.invalidateQueries({ queryKey: ["tenants"] });
    queryClient.invalidateQueries({ queryKey: ["sidebar-counts", "tenants"] });
  };

  const save = useMutation({
    mutationFn: () => api.updateTenant(tenantId, name.trim()),
    onSuccess: () => {
      toast.success("Tenant updated");
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const softDelete = useMutation({
    mutationFn: () => api.softDeleteTenant(tenantId),
    onSuccess: () => {
      toast.success("Tenant deleted");
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const restore = useMutation({
    mutationFn: () => api.restoreTenant(tenantId),
    onSuccess: () => {
      toast.success("Tenant restored");
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const purge = useMutation({
    mutationFn: () => api.purgeTenant(tenantId),
    onSuccess: () => {
      toast.success("Tenant purged");
      void navigate({ to: "/tenants" });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const tenant = tenantQuery.data;
  const isDeleted = Boolean(tenant?.deleted_at);
  const dirty = tenant !== undefined && name.trim() !== tenant.name;

  return (
    <Box sx={{ px: 4, py: 3 }}>
      <Box
        sx={{
          maxWidth: 1024,
          display: "flex",
          flexDirection: "column",
          gap: 3,
        }}
      >
        <FormSection
          title="General"
          description="Customer-facing identity. Name is unique among live tenants. Kind is immutable."
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
            <TextField
              id="edit-tenant-name"
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isDeleted}
              fullWidth
              size="small"
              slotProps={{
                htmlInput: {
                  "data-testid": "tenant-name-input",
                  sx: { fontFamily: "monospace" },
                },
              }}
            />
            <Box
              component="p"
              sx={{ m: 0, typography: "caption", color: "text.secondary" }}
            >
              Convention:{" "}
              <Box component="span" sx={{ fontFamily: "monospace" }}>
                {"<customer>-<env>"}
              </Box>
              . Case-insensitive uniqueness across live tenants.
            </Box>
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
            <FormLabel
              sx={{ display: "flex", alignItems: "center", gap: 0.75 }}
            >
              Kind{" "}
              <IconMaterialSymbolsLock
                sx={{ fontSize: 12, color: "text.secondary" }}
              />
            </FormLabel>
            <TextField
              value={tenant?.kind ?? ""}
              disabled
              fullWidth
              size="small"
              slotProps={{
                htmlInput: {
                  sx: { fontFamily: "monospace", color: "text.secondary" },
                },
              }}
            />
            <Box
              component="p"
              sx={{ m: 0, typography: "caption", color: "text.secondary" }}
            >
              Cannot be changed — kind gates the tenant API key (external only).
            </Box>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="contained"
              disableElevation
              data-testid="save-general"
              disabled={!dirty || isDeleted || save.isPending}
              onClick={() => save.mutate()}
              startIcon={<IconMaterialSymbolsSave />}
            >
              Save changes
            </Button>
          </Box>
        </FormSection>

        <FormSection
          title="Grouping attributes"
          description="Free-form metadata used in filters and dashboards. Not auth-relevant."
        >
          <Box
            sx={{
              display: "grid",
              gap: 1.5,
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            }}
          >
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
              <FormLabel
                htmlFor="edit-tenant-env"
                sx={{ display: "flex", alignItems: "center", gap: 0.75 }}
              >
                Environment{" "}
                <IconMaterialSymbolsLock
                  sx={{ fontSize: 12, color: "text.secondary" }}
                />
              </FormLabel>
              <TextField
                id="edit-tenant-env"
                value={tenant?.env ?? ""}
                disabled
                placeholder="—"
                fullWidth
                size="small"
                slotProps={{
                  htmlInput: { "data-testid": "tenant-env-input" },
                }}
              />
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
              <FormLabel
                htmlFor="edit-tenant-region"
                sx={{ display: "flex", alignItems: "center", gap: 0.75 }}
              >
                Region{" "}
                <IconMaterialSymbolsLock
                  sx={{ fontSize: 12, color: "text.secondary" }}
                />
              </FormLabel>
              <TextField
                id="edit-tenant-region"
                value={tenant?.region ?? ""}
                disabled
                placeholder="—"
                fullWidth
                size="small"
                slotProps={{
                  htmlInput: { "data-testid": "tenant-region-input" },
                }}
              />
            </Box>
          </Box>
          <Box
            component="p"
            sx={{ m: 0, typography: "caption", color: "text.secondary" }}
          >
            Read-only here — mutate env / region / metadata via the BE admin API
            for now (PATCH wiring lands in a follow-up).
          </Box>
        </FormSection>

        <FormSection
          title="Provisioning"
          description="Kind is set at create and is read-only."
        >
          {tenant ? (
            <ProvenanceDl
              columns={2}
              items={[
                {
                  label: "Kind",
                  value: (
                    <Chip tint={tenant.kind === "internal" ? "info" : "muted"}>
                      {tenant.kind}
                    </Chip>
                  ),
                },
                {
                  label: "Created",
                  value: new Date(tenant.created_at).toLocaleString(),
                },
                {
                  label: "Updated",
                  value: new Date(tenant.updated_at).toLocaleString(),
                },
              ]}
            />
          ) : (
            <Box
              component="p"
              sx={{ m: 0, typography: "caption", color: "text.secondary" }}
            >
              Loading…
            </Box>
          )}
        </FormSection>

        {tenant?.kind === "external" ? (
          <FormSection
            title="Integrations"
            description="API keys authenticate the traces this tenant's agents send to AgentScore."
          >
            <ApiKeysPanel
              adapter={makeAdapter(tenantId)}
              queryKey={["tenant-api-keys", tenantId]}
              showSimulationBadge
            />
          </FormSection>
        ) : null}

        <FormSection
          title="Danger zone"
          description="Delete preserves data and can be reversed. Permanently deleting cascades to agents and keys and cannot be undone."
          tone="destructive"
          bare
        >
          <DangerZone>
            {isDeleted ? (
              <>
                <DangerZone.Row
                  title="Restore tenant"
                  description="Bring this tenant back to active. Agents must be re-activated manually."
                  action={
                    <Button
                      variant="outlined"
                      data-testid="tenant-restore"
                      onClick={() => restore.mutate()}
                      disabled={restore.isPending}
                      startIcon={<IconMaterialSymbolsRestartAlt />}
                    >
                      Restore
                    </Button>
                  }
                />
                <DangerZone.Row
                  title="Permanently delete tenant"
                  description="Removes the tenant and cascades to all memberships. Cannot be undone."
                  action={
                    <Button
                      variant="contained"
                      color="error"
                      disableElevation
                      data-testid="tenant-purge"
                      onClick={() => setConfirmPurge(true)}
                      startIcon={<IconMaterialSymbolsLocalFireDepartment />}
                    >
                      Permanently delete…
                    </Button>
                  }
                />
              </>
            ) : (
              <DangerZone.Row
                title="Delete tenant"
                description="Stops every agent from working. Permanently delete from the deleted view to remove the tenant for good."
                action={
                  <Button
                    variant="outlined"
                    color="error"
                    data-testid="tenant-delete"
                    onClick={() => setConfirmDelete(true)}
                    startIcon={<IconMaterialSymbolsDelete />}
                  >
                    Delete
                  </Button>
                }
              />
            )}
          </DangerZone>
        </FormSection>
      </Box>

      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <DialogTitle>Delete {tenant?.name}?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Reversible. All of its agents stop working immediately. Restore
            from "Show deleted" or permanently delete to remove for good.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            data-testid="delete-cancel"
            onClick={() => setConfirmDelete(false)}
          >
            Cancel
          </Button>
          <Button
            variant="outlined"
            color="error"
            data-testid="delete-confirm"
            onClick={() => {
              softDelete.mutate();
              setConfirmDelete(false);
            }}
            startIcon={<IconMaterialSymbolsDelete />}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={confirmPurge}
        onClose={() => setConfirmPurge(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Permanently delete {tenant?.name}?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "error.main" }}>
            This cannot be undone.
          </DialogContentText>
          <CascadePreviewList
            heading="The following will be destroyed:"
            items={TENANT_PURGE_CASCADE}
          />
          {tenant ? (
            <TypedConfirmInput
              confirmText={tenant.name}
              testId="purge"
              busy={purge.isPending}
              buttonLabel={
                <Box
                  component="span"
                  sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}
                >
                  <IconMaterialSymbolsLocalFireDepartment />
                  Permanently delete {tenant.name}
                </Box>
              }
              onConfirm={() => {
                purge.mutate();
                setConfirmPurge(false);
              }}
            />
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            data-testid="purge-cancel"
            onClick={() => setConfirmPurge(false)}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
