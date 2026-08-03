import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Slider from "@mui/material/Slider";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import type { View } from "../../../view";
import type { AgentSettingsData, ProvisioningStatus } from "../../../types";
import { getAgentSettings, updateAgentSettings } from "../../../data/mock";
import { useAgent } from "../../../data/useAgents";
import DangerZone from "./DangerZone";

type VerdictBandsDraft = AgentSettingsData["verdictBands"];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const PROVISIONING_COLOR: Record<ProvisioningStatus, "success" | "warning" | "error"> = {
  active: "success",
  pending: "warning",
  failed: "error",
};

const PROVISIONING_LABEL: Record<ProvisioningStatus, string> = {
  active: "Active",
  pending: "Paused / pending",
  failed: "Failed",
};

/**
 * Settings tab (Milestone 2): a domain-practitioner-friendly view over the
 * per-agent AgentSettingsData record — verdict thresholds, trace sampling,
 * read-only provenance/connection info, and archive/remove actions.
 *
 * Fetched settings and the editable draft are kept as two separate pieces of
 * state so "Save" is a deliberate action rather than every slider drag
 * silently persisting.
 */
export default function SettingsTab({ agentId, navigate }: { agentId: string; navigate: (v: View) => void }) {
  const agent = useAgent(agentId);
  const [settings, setSettings] = useState<AgentSettingsData | null>(null);
  const [verdictBands, setVerdictBands] = useState<VerdictBandsDraft>({ ship: 85, review: 55, block: 40 });
  const [traceSamplingRatePct, setTraceSamplingRatePct] = useState(25);
  const [saving, setSaving] = useState(false);
  const [savedOpen, setSavedOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getAgentSettings(agentId).then((next) => {
      if (cancelled) return;
      setSettings(next);
      setVerdictBands(next.verdictBands);
      setTraceSamplingRatePct(next.traceSamplingRatePct);
    });
    return () => {
      cancelled = true;
    };
  }, [agentId]);

  if (!agent || !settings) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography sx={{ color: "text.secondary" }}>Loading settings...</Typography>
      </Box>
    );
  }

  const isDirty =
    verdictBands.ship !== settings.verdictBands.ship ||
    verdictBands.review !== settings.verdictBands.review ||
    verdictBands.block !== settings.verdictBands.block ||
    traceSamplingRatePct !== settings.traceSamplingRatePct;

  async function handleSave() {
    setSaving(true);
    await updateAgentSettings(agentId, { verdictBands, traceSamplingRatePct });
    setSettings((prev) => (prev ? { ...prev, verdictBands, traceSamplingRatePct } : prev));
    setSaving(false);
    setSavedOpen(true);
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button variant="contained" onClick={handleSave} disabled={!isDirty || saving}>
          {saving ? "Saving..." : "Save changes"}
        </Button>
      </Box>

      <Paper sx={{ p: 2.5, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
          Verdict bands
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2.5 }}>
          The minimum composite score an agent needs to land in each verdict.
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: "success.main" }}>
                Ship — safe to use as-is
              </Typography>
              <Chip label={`≥ ${verdictBands.ship}`} size="small" color="success" variant="outlined" />
            </Box>
            <Slider
              value={verdictBands.ship}
              min={0}
              max={100}
              onChange={(_, v) => setVerdictBands((b) => ({ ...b, ship: v as number }))}
              sx={{ color: "success.main" }}
            />
          </Box>

          <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: "warning.main" }}>
                Review — needs a human look before shipping
              </Typography>
              <Chip label={`≥ ${verdictBands.review}`} size="small" color="warning" variant="outlined" />
            </Box>
            <Slider
              value={verdictBands.review}
              min={0}
              max={100}
              onChange={(_, v) => setVerdictBands((b) => ({ ...b, review: v as number }))}
              sx={{ color: "warning.main" }}
            />
          </Box>

          <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: "error.main" }}>
                Block — do not ship below this score
              </Typography>
              <Chip label={`< ${verdictBands.block}`} size="small" color="error" variant="outlined" />
            </Box>
            <Slider
              value={verdictBands.block}
              min={0}
              max={100}
              onChange={(_, v) => setVerdictBands((b) => ({ ...b, block: v as number }))}
              sx={{ color: "error.main" }}
            />
          </Box>
        </Box>
      </Paper>

      <Paper sx={{ p: 2.5, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
          Trace sampling
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2.5 }}>
          Percentage of sessions that get fully evaluated by the judge.
        </Typography>

        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: traceSamplingRatePct < 50 ? "warning.main" : "text.primary" }}>
            Sampling rate
          </Typography>
          <Chip
            label={`${traceSamplingRatePct}%`}
            size="small"
            color={traceSamplingRatePct < 50 ? "warning" : "default"}
            variant="outlined"
          />
        </Box>
        <Slider
          value={traceSamplingRatePct}
          min={1}
          max={100}
          onChange={(_, v) => setTraceSamplingRatePct(v as number)}
          sx={{ color: traceSamplingRatePct < 50 ? "warning.main" : "primary.main" }}
        />

        <Typography variant="caption" sx={{ color: "text.disabled", display: "block", mt: 1 }}>
          Sessions with errors, timeouts, or Runtime Guard triggers are always evaluated at 100% regardless of this
          setting.
        </Typography>
      </Paper>

      <Paper sx={{ p: 2.5, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
          Provenance
        </Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
          <Box>
            <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 600 }}>
              CREATED BY
            </Typography>
            <Typography variant="body2">{settings.createdByEmail}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 600 }}>
              CREATED
            </Typography>
            <Typography variant="body2">{formatDate(agent.created_at)}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 600 }}>
              AGENT ID
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
              {agent.agent_id}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 600 }}>
              WORKSPACE ID
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
              {settings.workspaceId}
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Paper sx={{ p: 2.5, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
          Connection status
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
          <Box>
            <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 600, display: "block" }}>
              LANGFUSE PROVISIONING
            </Typography>
            <Chip
              label={PROVISIONING_LABEL[settings.provisioningStatus]}
              size="small"
              color={PROVISIONING_COLOR[settings.provisioningStatus]}
              sx={{ mt: 0.5 }}
            />
          </Box>
          <Divider orientation="vertical" flexItem />
          <Box>
            <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 600, display: "block" }}>
              PROJECT ID
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: "monospace", mt: 0.5 }}>
              {settings.langfuseProjectId ?? "—"}
            </Typography>
          </Box>
        </Box>
      </Paper>

      <DangerZone agentId={agentId} navigate={navigate} />

      <Snackbar
        open={savedOpen}
        autoHideDuration={2500}
        onClose={() => setSavedOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" variant="filled" onClose={() => setSavedOpen(false)} sx={{ borderRadius: 1.5 }}>
          Saved
        </Alert>
      </Snackbar>
    </Box>
  );
}
