/** AgentSettingsPage — full identity / trace store / provenance / danger zone.
 *
 * Layout mirrors the tenant settings page: stacked FormSections, name is
 * immutable, and lifecycle actions use the cascade preview +
 * typed-confirm pattern.
 */

import type { ReactNode } from "react";
import { useState } from "react";
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
import Tooltip from "@mui/material/Tooltip";
import { alpha } from "@mui/material/styles";
import IconMaterialSymbolsLocalFireDepartment from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsLocalFireDepartment.mjs";
import IconMaterialSymbolsLock from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsLock.mjs";
import IconMaterialSymbolsRestartAlt from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsRestartAlt.mjs";
import IconMaterialSymbolsDelete from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsDelete.mjs";
import IconMaterialSymbolsPowerOff from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsPowerOff.mjs";
import IconMaterialSymbolsToggleOn from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsToggleOn.mjs";

import { toast } from "@/shared/lib/toast";
import { ScheduleSection } from "@/back-office/agents/scoring/ScheduleSection";
import { CascadePreviewList } from "@/shared/components/cascade-preview-list";
import { AGENT_PURGE_CASCADE } from "@/shared/components/purge-cascade";
import { Chip } from "@/shared/components/chip";
import { DangerZone } from "@/shared/components/danger-zone";
import { FormSection } from "@/shared/components/form-section";
import { ProvenanceDl } from "@/shared/components/provenance-dl";
import { StatusDot } from "@/shared/components/status-dot";
import { TypedConfirmInput } from "@/shared/components/typed-confirm-input";

// Fake agent-profile roster (no backend) - canonical ids shared with the
// other agent-tab clones so the same agent looks consistent across tabs.
type FakeAgentProfile = {
  agent_id: string;
  tenant_id: string;
  name: string;
  kind: string;
  provisioning_status: "active" | "provisioning" | "failed";
  created_at: string;
  created_by_user_id: string | null;
  failure_reason: string | null;
  deactivated_at: string | null;
  deleted_at: string | null;
  drop_pressure: { dropped_recently: boolean; dropped_count: number };
};

const FAKE_AGENT_PROFILES: Record<string, FakeAgentProfile> = {
  "agent-1": { agent_id: "agent-1", tenant_id: "tenant-tais", name: "ATA Regression Suite", kind: "external", provisioning_status: "active", created_at: "2026-05-14T09:00:00Z", created_by_user_id: "a.demers@tricentis.com", failure_reason: null, deactivated_at: null, deleted_at: null, drop_pressure: { dropped_recently: false, dropped_count: 0 } },
  "agent-2": { agent_id: "agent-2", tenant_id: "tenant-tar", name: "jira epic poller", kind: "internal", provisioning_status: "active", created_at: "2026-04-02T14:00:00Z", created_by_user_id: "s.patel@tricentis.com", failure_reason: null, deactivated_at: null, deleted_at: null, drop_pressure: { dropped_recently: false, dropped_count: 0 } },
  "agent-3": { agent_id: "agent-3", tenant_id: "tenant-acme", name: "invoice-reconciler", kind: "external", provisioning_status: "active", created_at: "2026-03-11T11:30:00Z", created_by_user_id: "ops@acmefinancial.com", failure_reason: null, deactivated_at: null, deleted_at: null, drop_pressure: { dropped_recently: true, dropped_count: 12 } },
  "agent-4": { agent_id: "agent-4", tenant_id: "tenant-northwind", name: "support-triage-bot", kind: "external", provisioning_status: "active", created_at: "2026-06-20T08:00:00Z", created_by_user_id: "it@northwindretail.com", failure_reason: null, deactivated_at: null, deleted_at: null, drop_pressure: { dropped_recently: false, dropped_count: 0 } },
  "agent-5": { agent_id: "agent-5", tenant_id: "tenant-globex", name: "code-review-assistant", kind: "external", provisioning_status: "provisioning", created_at: "2026-09-10T16:45:00Z", created_by_user_id: "eng@globex.com", failure_reason: null, deactivated_at: null, deleted_at: null, drop_pressure: { dropped_recently: false, dropped_count: 0 } },
};

function fakeBenchmark(): any {
  return {
    refreshCadenceMinutes: 360,
    refreshLookbackDays: 14,
    autonomousScoringEnabled: true,
    bindingSource: "auto",
    profileName: "Standard Agent Profile",
    profileVersion: 3,
  };
}

export function AgentSettingsPage() {
  const { tenantId, agentId } = useParams({ strict: false }) as {
    tenantId: string;
    agentId: string;
  };
  const navigate = useNavigate();

  const [agent, setAgent] = useState<FakeAgentProfile>(
    () => FAKE_AGENT_PROFILES[agentId] ?? { ...FAKE_AGENT_PROFILES["agent-1"], agent_id: agentId, tenant_id: tenantId },
  );
  const [benchmark] = useState(() => fakeBenchmark());
  const [purgePending, setPurgePending] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmPurge, setConfirmPurge] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  const deactivate = {
    mutate: () => {
      setAgent((a) => ({ ...a, deactivated_at: new Date().toISOString() }));
      toast.success("Agent deactivated");
    },
    isPending: false,
  };

  const activate = {
    mutate: () => {
      setAgent((a) => ({ ...a, deactivated_at: null }));
      toast.success("Agent activated");
    },
    isPending: false,
  };

  const softDelete = {
    mutate: () => {
      setAgent((a) => ({ ...a, deleted_at: new Date().toISOString() }));
      toast.success("Agent soft-deleted");
    },
    isPending: false,
  };

  const restore = {
    mutate: () => {
      setAgent((a) => ({ ...a, deleted_at: null, deactivated_at: a.deactivated_at ?? new Date().toISOString() }));
      toast.success("Agent restored");
    },
    isPending: false,
  };

  const purge = {
    mutate: () => {
      setPurgePending(true);
      toast.success("Agent purged");
      setTimeout(() => {
        setPurgePending(false);
        void navigate({ to: "/tenants/$tenantId", params: { tenantId } });
      }, 300);
    },
    isPending: purgePending,
  };
  // Every ladder row is gated on this. `isActive`/`isDeleted` below are
  // meaningless while `agent` is undefined (nothing has loaded yet), so every
  // reason computation is short-circuited to `null` until `agentLoaded` —
  // never a guessed default — and `isPending={!agentLoaded}` on each
  // `LadderActionButton` turns that `null` into a native `disabled` (no
  // tooltip claiming a precondition nobody has confirmed yet) rather than
  // leaving the row looking interactive.
  const agentLoaded = Boolean(agent);
  const isDeleted = Boolean(agent?.deleted_at);
  // A soft-deleted agent is always also inactive (the DB CHECK
  // `agents_deleted_implies_deactivated` makes deleted-but-active
  // unrepresentable), so this alone covers both the deleted and the
  // deactivated-but-live states.
  const isActive = !agent?.deactivated_at;

  // The four-plus-one ladder rows disable independently of each other — an
  // operator can be shown the whole ladder and told exactly which single
  // step is missing, rather than one either/or branch that hides the rest.
  const deactivateReason =
    agentLoaded && !isActive ? "already inactive" : null;
  const activateReason = !agentLoaded
    ? null
    : isDeleted
      ? "restore first"
      : isActive
        ? "already active"
        : null;
  const softDeleteReason = !agentLoaded
    ? null
    : isDeleted
      ? "already deleted"
      : isActive
        ? "deactivate first"
        : null;
  const restoreReason = agentLoaded && !isDeleted ? "soft-delete first" : null;
  const purgeReason = agentLoaded && !isDeleted ? "soft-delete first" : null;

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
          description="Identity of the agent within its tenant. Name is immutable once created."
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
            <FormLabel
              sx={{ display: "flex", alignItems: "center", gap: 0.75 }}
            >
              Name{" "}
              <IconMaterialSymbolsLock
                sx={{ fontSize: 12, color: "text.secondary" }}
              />
            </FormLabel>
            <TextField
              value={agent?.name ?? ""}
              disabled
              fullWidth
              size="small"
              slotProps={{
                htmlInput: {
                  "data-testid": "agent-name",
                  sx: { fontFamily: "monospace", color: "text.secondary" },
                },
              }}
            />
            <Box
              component="p"
              sx={{ m: 0, typography: "caption", color: "text.secondary" }}
            >
              Cannot be changed. Create a new agent to use a different name.
            </Box>
          </Box>
        </FormSection>

        <FormSection
          title="Provisioning"
          description={
            <>
              State machine:{" "}
              <Box component="span" sx={{ fontFamily: "monospace" }}>
                provisioning → active
              </Box>
              , or{" "}
              <Box component="span" sx={{ fontFamily: "monospace" }}>
                failed
              </Box>{" "}
              with a retry action.
            </>
          }
        >
          {agent ? (
            <>
              <ProvenanceDl
                columns={2}
                items={[
                  {
                    label: "Provisioning status",
                    value: <ProvisioningChip agent={agent} />,
                  },
                  {
                    label: "Kind",
                    value: <Chip tint="muted">{agent.kind}</Chip>,
                  },
                  {
                    label: "Provisioned at",
                    value: new Date(agent.created_at).toLocaleString(),
                  },
                ]}
              />
              {agent.failure_reason ? (
                <Box
                  sx={(theme) => ({
                    borderRadius: 1,
                    border: 1,
                    borderColor: alpha(theme.palette.warning.main, 0.3),
                    bgcolor: alpha(theme.palette.warning.main, 0.1),
                    px: 1.5,
                    py: 1.25,
                    typography: "caption",
                  })}
                >
                  <Box sx={{ fontWeight: 600 }}>Provisioning failed</Box>
                  <Box
                    sx={{
                      mt: 0.25,
                      fontFamily: "monospace",
                      color: "text.secondary",
                    }}
                  >
                    failure_reason: {agent.failure_reason}
                  </Box>
                </Box>
              ) : null}
            </>
          ) : (
            <Box
              component="p"
              sx={{ m: 0, typography: "caption", color: "text.secondary" }}
            >
              Loading…
            </Box>
          )}
        </FormSection>

        <FormSection
          title="Provenance"
          description="Who created this agent and when. Read-only."
        >
          {agent ? (
            <ProvenanceDl
              columns={2}
              items={[
                {
                  label: "Created by",
                  value: agent.created_by_user_id ?? "—",
                },
                {
                  label: "Created at",
                  value: new Date(agent.created_at).toLocaleString(),
                },
                {
                  label: "Agent id",
                  value: (
                    <Box
                      component="span"
                      sx={{ fontFamily: "monospace", typography: "caption" }}
                    >
                      {agent.agent_id}
                    </Box>
                  ),
                },
                {
                  label: "Tenant id",
                  value: (
                    <Box
                      component="span"
                      sx={{ fontFamily: "monospace", typography: "caption" }}
                    >
                      {agent.tenant_id}
                    </Box>
                  ),
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

        <FormSection
          title="Scoring schedule"
          description="Override the global cadence & lookback; disable autonomous scoring for this agent."
        >
          <ScheduleSection
            tenantId={tenantId}
            agentId={agentId}
            benchmark={benchmark ?? null}
          />
        </FormSection>

        <FormSection
          title="Danger zone"
          description="Deactivate stops work non-destructively. Soft-delete preserves traces and can be undone. Hard-purge cascades to all keys and is irreversible."
          tone="destructive"
          bare
        >
          <DangerZone>
            <DangerZone.Row
              title="Deactivate agent"
              description="Stops new scoring/fit/card/discovery work and hides the agent from customers. Reversible via Activate."
              action={
                <LadderActionButton
                  testId="agent-deactivate"
                  label="Deactivate…"
                  icon={<IconMaterialSymbolsPowerOff />}
                  color="error"
                  disabledReason={deactivateReason}
                  isPending={!agentLoaded}
                  onClick={() => setConfirmDeactivate(true)}
                />
              }
            />
            <DangerZone.Row
              title="Activate agent"
              description="Resumes scoring/fit/card/discovery work and unhides the agent from customers."
              action={
                <LadderActionButton
                  testId="agent-activate"
                  label="Activate"
                  icon={<IconMaterialSymbolsToggleOn />}
                  disabledReason={activateReason}
                  isPending={!agentLoaded || activate.isPending}
                  onClick={() => activate.mutate()}
                />
              }
            />
            <DangerZone.Row
              title="Soft-delete agent"
              description="Traces remain in the trace store. Requires deactivate first — ingest already stopped by then."
              action={
                <LadderActionButton
                  testId="agent-delete"
                  label="Soft-delete"
                  icon={<IconMaterialSymbolsDelete />}
                  color="error"
                  disabledReason={softDeleteReason}
                  isPending={!agentLoaded}
                  onClick={() => setConfirmDelete(true)}
                />
              }
            />
            <DangerZone.Row
              title="Restore agent"
              description="Brings the agent back from soft-delete. It lands inactive — ingest stays off until you also activate it."
              action={
                <LadderActionButton
                  testId="agent-restore"
                  label="Restore"
                  icon={<IconMaterialSymbolsRestartAlt />}
                  disabledReason={restoreReason}
                  isPending={!agentLoaded || restore.isPending}
                  onClick={() => restore.mutate()}
                />
              }
            />
            <DangerZone.Row
              title="Hard-purge agent"
              description="Removes the agent row and its stored trace payloads. Cannot be undone."
              action={
                <LadderActionButton
                  testId="agent-purge"
                  label="Hard-purge…"
                  icon={<IconMaterialSymbolsLocalFireDepartment />}
                  variant="contained"
                  color="error"
                  disabledReason={purgeReason}
                  isPending={!agentLoaded}
                  onClick={() => setConfirmPurge(true)}
                />
              }
            />
          </DangerZone>
        </FormSection>
      </Box>

      <Dialog open={confirmDeactivate} onClose={() => setConfirmDeactivate(false)}>
        <DialogTitle>Deactivate {agent?.name}?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 1.5 }}>
            Reversible — activate this agent again to resume work.
          </DialogContentText>
          <DialogContentText component="div" data-testid="deactivate-contract">
            Queued work of every kind is cancelled now. A scoring run already
            in progress stops at its next checkpoint. A profile fit, agent
            card or discovery job a worker has already claimed will finish.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            onClick={() => setConfirmDeactivate(false)}
            data-testid="deactivate-cancel"
          >
            Cancel
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={() => {
              deactivate.mutate();
              setConfirmDeactivate(false);
            }}
            data-testid="deactivate-confirm"
            startIcon={<IconMaterialSymbolsPowerOff />}
          >
            Deactivate
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <DialogTitle>Soft-delete {agent?.name}?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Reversible via Restore. Trace ingest already stopped when this
            agent was deactivated — soft-delete does not change that. Traces
            remain in the trace store.
          </DialogContentText>
          {agent?.drop_pressure?.dropped_recently ? (
            <Box
              data-testid="delete-drop-warning"
              sx={(theme) => ({
                mt: 1.5,
                borderRadius: 1,
                border: 1,
                borderColor: alpha(theme.palette.warning.main, 0.3),
                bgcolor: alpha(theme.palette.warning.main, 0.1),
                px: 1.5,
                py: 1,
                typography: "caption",
              })}
            >
              Still receiving traffic — {agent.drop_pressure.dropped_count}{" "}
              dropped in the last 7 days.
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            onClick={() => setConfirmDelete(false)}
            data-testid="delete-cancel"
          >
            Cancel
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={() => {
              softDelete.mutate();
              setConfirmDelete(false);
            }}
            data-testid="delete-confirm"
            startIcon={<IconMaterialSymbolsDelete />}
          >
            Soft-delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={confirmPurge}
        onClose={() => setConfirmPurge(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Hard-purge {agent?.name}?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "error.main" }}>
            This cannot be undone.
          </DialogContentText>
          <CascadePreviewList
            heading="The following will be destroyed:"
            items={AGENT_PURGE_CASCADE}
          />
          {agent ? (
            <TypedConfirmInput
              testId="purge"
              confirmText={agent.name}
              busy={purge.isPending}
              buttonLabel={
                <Box
                  component="span"
                  sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}
                >
                  <IconMaterialSymbolsLocalFireDepartment />
                  Hard-purge {agent.name}
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
            onClick={() => setConfirmPurge(false)}
            data-testid="purge-cancel"
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

/**
 * One ladder row's action button. A `disabledReason` renders the button
 * `aria-disabled` (not native `disabled`) so the tooltip naming the missing
 * precondition stays reachable by keyboard/screen-reader — a natively
 * disabled button drops the Tooltip's `aria-describedby` onto a wrapping
 * `<span>` instead of the control itself (same technique as `RunNowButton`).
 * `isPending` stays a native `disabled` — a transient in-flight state needs
 * no explanation.
 */
function LadderActionButton({
  testId,
  label,
  icon,
  disabledReason,
  isPending = false,
  onClick,
  color,
  variant = "outlined",
}: {
  testId: string;
  label: string;
  icon: ReactNode;
  disabledReason: string | null;
  isPending?: boolean;
  onClick: () => void;
  color?: "error";
  variant?: "outlined" | "contained";
}) {
  const blocked = disabledReason != null;
  const button = (
    <Button
      variant={variant}
      color={blocked ? undefined : color}
      disableElevation={variant === "contained"}
      disabled={!blocked && isPending}
      aria-disabled={blocked || undefined}
      tabIndex={blocked ? 0 : undefined}
      onClick={blocked ? undefined : onClick}
      data-testid={testId}
      startIcon={icon}
      sx={
        blocked
          ? {
              color: "action.disabled",
              borderColor: "action.disabledBackground",
              cursor: "not-allowed",
            }
          : undefined
      }
    >
      {label}
    </Button>
  );
  return blocked ? <Tooltip title={disabledReason}>{button}</Tooltip> : button;
}

function ProvisioningChip({ agent }: { agent: FakeAgentProfile }) {
  if (agent.deleted_at) {
    return <StatusDot status="destructive">deleted</StatusDot>;
  }
  if (agent.provisioning_status === "active") {
    return <StatusDot status="success">active</StatusDot>;
  }
  if (agent.provisioning_status === "provisioning") {
    return (
      <StatusDot status="warning" pulse>
        provisioning
      </StatusDot>
    );
  }
  return <StatusDot status="destructive">failed</StatusDot>;
}
