/** Score-now button + active-run pill, rendered in the agent header's
 * `actions` slot by `AgentDetailLayout` (spec §3.1 Feature 5).
 *
 * The conflict `Alert` lives inside the `Dialog` body rather than beside the
 * button: the header's `actions` slot is an inline, `alignItems:center` cell
 * with no room for a full-width alert, and the dialog is already open when a
 * 409 lands (`setOpen(false)` fires only in `onSuccess`), so the alert stays
 * visible to the user.
 */

import type { HTMLAttributes } from "react";
import { useEffect, useState } from "react";
import { Link as RouterLink } from "@tanstack/react-router";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import IconMaterialSymbolsPlayArrow from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsPlayArrow.mjs";
import IconMaterialSymbolsRefresh from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsRefresh.mjs";

import type { ScoringRunOut } from "@/back-office/agents/scoring-api";
import {
  RUN_STATES_ACTIVE,
  stateLabel,
} from "@/back-office/agents/scoring/run-format";
import { createFakeRun, getRunById, settleFakeRun } from "@/back-office/agents/scoring/fake-runs";

// ---------------------------------------------------------------------------
// Active run pill (poll)
// ---------------------------------------------------------------------------

export function ActiveRunPill({
  run,
  tenantId,
  agentId,
}: {
  run: ScoringRunOut;
  tenantId: string;
  agentId: string;
}) {
  // Poll this run directly (2s cadence while active — runQueryOptions in
  // scoring-api.ts) so the label advances queued → running → complete
  // (or partial/failed/cancelled) without waiting on a window refocus to
  // refetch the runs list. Falls back to the `run` prop until the first poll
  // response lands.
  const runQuery = { data: getRunById(agentId, run.runId) };
  const state = runQuery.data?.state ?? run.state;

  return (
    <Box
      sx={(theme) => ({
        typography: "caption",
        "& a": {
          display: "flex",
          alignItems: "center",
          gap: 0.75,
          borderRadius: 1,
          border: 1,
          borderColor: alpha(theme.palette.warning.main, 0.4),
          bgcolor: alpha(theme.palette.warning.main, 0.1),
          px: 1.25,
          py: 0.5,
          color: theme.palette.warning.main,
          textDecoration: "none",
        },
        "& a:hover": { bgcolor: alpha(theme.palette.warning.main, 0.15) },
      })}
    >
      <RouterLink
        to="/tenants/$tenantId/agents/$agentId/runs/$runId"
        params={{ tenantId, agentId, runId: run.runId }}
        search={{ panel: "overview" }}
      >
        <IconMaterialSymbolsRefresh
          sx={{
            fontSize: 12,
            "@keyframes scoring-spin": {
              from: { transform: "rotate(0deg)" },
              to: { transform: "rotate(360deg)" },
            },
            animation: "scoring-spin 1s linear infinite",
          }}
        />
        {stateLabel(state)} · {run.mode}
      </RouterLink>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Run Now button + dialog (readiness gate removed, D1: always enabled).
// On 409 conflict, surfaces an inline alert inside the dialog body (§3.4).
// ---------------------------------------------------------------------------

export function RunNowButton({
  tenantId,
  agentId,
  runs,
  onTriggered,
  disabledReason = null,
  sampleSizeCap = null,
}: {
  tenantId: string;
  agentId: string;
  runs: ScoringRunOut[];
  onTriggered: (runId: string) => void;
  /** When non-null, the trigger button renders disabled with this reason
   * surfaced in a tooltip (e.g. the bound profile has no enabled
   *  checks). Null/absent renders exactly as before. */
  disabledReason?: string | null;
  /** The agent's benchmark sample-size cap, or null when the benchmark read
   * has not landed or failed. */
  sampleSizeCap?: number | null;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"population" | "golden_match">("population");
  const [sampleSize, setSampleSize] = useState<number>(20);
  // False until the operator edits the field by hand — gates both the
  // cap-resync effect below (never fight a value the operator chose) and
  // the request body (an unedited field with no known cap should let the
  // server apply the agent's own cap rather than submit our placeholder).
  const [sampleSizeTouched, setSampleSizeTouched] = useState(false);
  // Active run id captured at 409 time so the conflict link survives the
  // ensuing refetch (the parent re-renders to the active-run pill once the
  // runs query catches up, but the alert reads from this captured value).
  const [conflictRunId, setConflictRunId] = useState<string | null | "none">(
    "none",
  );
  const conflict = conflictRunId !== "none";

  const triggerMutation = {
    isPending: false,
    mutate: () => {
      const active = runs.find((r) => RUN_STATES_ACTIVE.has(r.state));
      if (active) {
        setConflictRunId(active.runId);
        return;
      }
      const { runId } = createFakeRun(
        agentId,
        mode,
        sampleSizeCap == null && !sampleSizeTouched ? undefined : sampleSize,
      );
      setTimeout(() => settleFakeRun(agentId, runId), 1500);
      setOpen(false);
      setConflictRunId("none");
      onTriggered(runId);
    },
  };

  const isDisabled = disabledReason != null;
  const invalidSampleSize =
    !Number.isFinite(sampleSize) ||
    !Number.isInteger(sampleSize) ||
    sampleSize < 1 ||
    sampleSize > 500;
  const aboveCap =
    sampleSizeCap != null && !invalidSampleSize && sampleSize > sampleSizeCap;

  // Re-applies the cap-derived default whenever it changes while the dialog
  // is open and the operator hasn't touched the field yet — the open handler
  // below only catches the cap as of the moment the button is clicked, so a
  // benchmark query that settles just after open would otherwise leave the
  // label ("agent cap 100") and the value (still 20) out of sync.
  useEffect(() => {
    if (!open || sampleSizeTouched) return;
    setSampleSize(Math.min(sampleSizeCap ?? 20, 500));
  }, [open, sampleSizeCap, sampleSizeTouched]);

  // A native `disabled` button drops out of the tab order, and MUI puts the
  // Tooltip's `aria-describedby` on a wrapping `<span>` rather than the
  // button itself in that case — so a keyboard or screen-reader user could
  // never reach the reason. `aria-disabled` keeps the same visual look and
  // blocks the action while leaving the control focusable and announced
  // (the Tooltip attaches straight to the Button, no `<span>` needed — it is
  // no longer natively disabled, so it fires pointer/focus events itself).
  // `data-testid` stays on the Button root either way.
  const triggerButton = isDisabled ? (
    <Button
      variant="outlined"
      size="small"
      startIcon={<IconMaterialSymbolsPlayArrow />}
      aria-disabled="true"
      tabIndex={0}
      data-testid="scoring-run-now"
      sx={{
        color: "action.disabled",
        borderColor: "action.disabledBackground",
        cursor: "not-allowed",
      }}
    >
      Score now
    </Button>
  ) : (
    <Button
      variant="outlined"
      size="small"
      onClick={() => {
        // A conflict captured on a prior open is stale by the time the
        // dialog reopens (the run it names may since have finished) —
        // clear it so a fresh open never shows a leftover alert.
        // Default sampleSize here too, rather than in the `useState`
        // initializer: this button mounts as soon as the runs query
        // settles, while the benchmark query (source of `sampleSizeCap`)
        // may still be in flight — a `useState` initializer would freeze
        // the 20 fallback even after the real cap later arrives. 20 is the
        // fallback because it's the same value the backend falls back to
        // for an agent with no benchmark row. Clamped to the 500 ceiling in
        // case a benchmark row was ever written with a larger cap (no DB
        // constraint enforces it) — an opening value the field itself would
        // reject is a dialog the operator can never submit. The resync
        // effect above re-applies this same clamp if the cap arrives later.
        setConflictRunId("none");
        setSampleSizeTouched(false);
        setSampleSize(Math.min(sampleSizeCap ?? 20, 500));
        setOpen(true);
      }}
      data-testid="scoring-run-now"
      startIcon={<IconMaterialSymbolsPlayArrow />}
    >
      Score now
    </Button>
  );

  return (
    <>
      {isDisabled ? (
        <Tooltip title={disabledReason}>{triggerButton}</Tooltip>
      ) : (
        triggerButton
      )}

      <Dialog
        open={open}
        onClose={() => {
          setOpen(false);
          setConflictRunId("none");
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Trigger scoring run</DialogTitle>
        <DialogContent sx={{ pb: 3 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            {conflict ? (
              <Alert severity="info" data-testid="run-conflict-alert">
                A run is already in progress —{" "}
                {conflictRunId ? (
                  <RouterLink
                    to="/tenants/$tenantId/agents/$agentId/runs/$runId"
                    params={{ tenantId, agentId, runId: conflictRunId }}
                    search={{ panel: "overview" }}
                    data-testid="run-conflict-link"
                  >
                    view it
                  </RouterLink>
                ) : (
                  "refresh to view it"
                )}
              </Alert>
            ) : null}
            <TextField
              select
              label="Mode"
              value={mode}
              onChange={(e) => setMode(e.target.value as typeof mode)}
              fullWidth
              size="small"
              slotProps={{
                select: {
                  SelectDisplayProps: {
                    "data-testid": "run-mode",
                  } as HTMLAttributes<HTMLDivElement>,
                },
              }}
            >
              <MenuItem value="population" data-testid="run-mode-option-population">
                Population — reference-free (sample of traces)
              </MenuItem>
              <MenuItem value="golden_match" data-testid="run-mode-option-golden-match">
                Golden match — reference-based (matched goldens)
              </MenuItem>
            </TextField>
            <Box>
              <TextField
                type="number"
                label={
                  sampleSizeCap != null
                    ? `Sample size (agent cap ${sampleSizeCap})`
                    : "Sample size"
                }
                value={sampleSize}
                onChange={(e) => {
                  setSampleSize(Number(e.target.value));
                  setSampleSizeTouched(true);
                }}
                fullWidth
                size="small"
                error={invalidSampleSize}
                helperText={
                  invalidSampleSize ? "Enter a value from 1 to 500" : undefined
                }
                slotProps={{
                  htmlInput: {
                    min: 1,
                    max: 500,
                    step: 1,
                    "data-testid": "run-sample-size",
                  },
                }}
              />
              {aboveCap ? (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  data-testid="run-sample-size-cap-hint"
                >
                  This run is above this agent's cap of {sampleSizeCap} and
                  will make more judge calls.
                </Typography>
              ) : null}
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => {
                  setOpen(false);
                  setConflictRunId("none");
                }}
                disabled={triggerMutation.isPending}
                data-testid="run-cancel"
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                disableElevation
                fullWidth
                onClick={() => triggerMutation.mutate()}
                disabled={triggerMutation.isPending || invalidSampleSize}
                data-testid="run-confirm"
              >
                {triggerMutation.isPending ? "Triggering…" : "Trigger run"}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}
