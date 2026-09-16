import { useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Switch from "@mui/material/Switch";
import Divider from "@mui/material/Divider";
import Alert from "@mui/material/Alert";
import Slider from "@mui/material/Slider";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import TextField from "@mui/material/TextField";
import SvgIcon from "@mui/material/SvgIcon";
import type { Project } from "../../types";
import { LLM_JUDGES, updateProject, useMockData } from "../../data/mock";
import { useToast } from "../../components/Toast";
import FormSection from "../../components/FormSection";
import DangerZone from "../../components/DangerZone";

interface Props {
  project: Project;
}

export default function SettingsTab({ project }: Props) {
  useMockData();
  const toast = useToast();

  const [selectedJudgeId, setSelectedJudgeId] = useState(project.llmJudgeId ?? LLM_JUDGES[0]?.id ?? "");
  const [sampleRate, setSampleRate] = useState(project.traceSampleRate ?? 100);
  const [autonomous, setAutonomous] = useState(project.autonomousScoringEnabled ?? true);
  const [cadence, setCadence] = useState(project.refreshCadenceMinutes != null ? String(project.refreshCadenceMinutes) : "");
  const [lookback, setLookback] = useState(project.refreshLookbackDays != null ? String(project.refreshLookbackDays) : "");

  function handleSave() {
    updateProject({ ...project, llmJudgeId: selectedJudgeId || undefined, traceSampleRate: sampleRate });
    toast.success("Settings saved.");
  }

  function handleSaveSchedule() {
    updateProject({
      ...project,
      autonomousScoringEnabled: autonomous,
      refreshCadenceMinutes: cadence === "" ? null : parseInt(cadence, 10),
      refreshLookbackDays: lookback === "" ? null : parseInt(lookback, 10),
    });
    toast.success("Schedule updated.");
  }

  const cadenceValid = cadence === "" || (/^\d+$/.test(cadence) && parseInt(cadence, 10) >= 60);
  const lookbackValid = lookback === "" || (/^\d+$/.test(lookback) && parseInt(lookback, 10) >= 1 && parseInt(lookback, 10) <= 90);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3, maxWidth: 860 }}>
      <Paper sx={{ p: 2.5, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>LLM Judge</Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
          The model that scores each session against your eval criteria.
        </Typography>
        <RadioGroup value={selectedJudgeId} onChange={(e) => setSelectedJudgeId(e.target.value)}>
          {LLM_JUDGES.map((j) => (
            <Paper
              key={j.id}
              variant="outlined"
              sx={{ mb: 1, borderRadius: 1.5, borderColor: selectedJudgeId === j.id ? "primary.main" : "divider", cursor: "pointer" }}
              onClick={() => setSelectedJudgeId(j.id)}
            >
              <Box sx={{ display: "flex", alignItems: "center", px: 2, py: 1.5, gap: 1 }}>
                <Radio value={j.id} size="small" sx={{ p: 0.5 }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{j.name}</Typography>
                    <Chip label={j.provider} size="small" variant="outlined" sx={{ height: 18, fontSize: "0.62rem" }} />
                    <Chip label={j.status === "live" ? "Live" : "Error"} size="small" color={j.status === "live" ? "success" : "error"} sx={{ height: 18, fontSize: "0.62rem" }} />
                  </Box>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontFamily: "monospace" }}>{j.model}</Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>{j.description}</Typography>
                </Box>
              </Box>
            </Paper>
          ))}
        </RadioGroup>
      </Paper>

      <Paper sx={{ p: 2.5, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 2 }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Trace Sampling</Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.25 }}>Percentage of incoming traces submitted for evaluation.</Typography>
          </Box>
          <Typography variant="h5" sx={{ fontFamily: "monospace", fontWeight: 800, color: sampleRate < 50 ? "warning.main" : "text.primary" }}>{sampleRate}%</Typography>
        </Box>
        <Box sx={{ px: 1 }}>
          <Slider
            value={sampleRate}
            onChange={(_, v) => setSampleRate(v as number)}
            min={1}
            max={100}
            step={1}
            marks={[{ value: 10, label: "10%" }, { value: 25, label: "25%" }, { value: 50, label: "50%" }, { value: 75, label: "75%" }, { value: 100, label: "100%" }]}
            valueLabelDisplay="auto"
          />
        </Box>
        <Alert severity="info" sx={{ mt: 2, fontSize: "0.78rem" }}>
          <strong>Smart override:</strong> Sessions with errors, timeouts, or Runtime Guard triggers are always evaluated at 100% regardless of this setting.
        </Alert>
      </Paper>

      <Box sx={{ display: "flex", gap: 1.5 }}>
        <Button variant="contained" onClick={handleSave}>Save settings</Button>
      </Box>

      <FormSection title="Refresh schedule" description="Override the global default. Leave blank to inherit the global cadence and lookback window.">
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, maxWidth: 360 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid", borderColor: "divider", borderRadius: 1.5, px: 1.5, py: 1 }}>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Autonomous scoring</Typography>
              <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                Disabling stops first-run discovery and cadence scoring for this agent. Score now stays available.
              </Typography>
            </Box>
            <Switch checked={autonomous} onChange={(e) => setAutonomous(e.target.checked)} />
          </Box>
          <TextField
            label="Cadence (minutes)"
            size="small"
            value={cadence}
            onChange={(e) => setCadence(e.target.value)}
            error={!cadenceValid}
            helperText={!cadenceValid ? "Minimum 60 minutes" : "Minimum 60 minutes"}
          />
          <TextField
            label="Lookback (days)"
            size="small"
            value={lookback}
            onChange={(e) => setLookback(e.target.value)}
            error={!lookbackValid}
            helperText={!lookbackValid ? "1–90 days" : "1–90 days"}
          />
          <Button variant="contained" disabled={!cadenceValid || !lookbackValid} onClick={handleSaveSchedule} sx={{ alignSelf: "flex-start" }}>
            Save schedule
          </Button>
        </Box>
      </FormSection>

      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 3 }}>
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>General</Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>Identity of the agent within AgentScore. Name is immutable once created.</Typography>
        </Box>
        <Paper sx={{ p: 2.5, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.75 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>Name</Typography>
          </Box>
          <TextField value={project.name} disabled fullWidth variant="outlined" size="small" />
          <Typography variant="caption" sx={{ color: "text.disabled", display: "block", mt: 0.75 }}>Cannot be changed. Create a new agent to use a different name.</Typography>
        </Paper>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 3 }}>
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>Provenance</Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>Who created this agent and when. Read-only.</Typography>
        </Box>
        <Paper sx={{ p: 2.5, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <Box>
              <Typography variant="overline" sx={{ color: "text.disabled", fontSize: "0.62rem", letterSpacing: 1, display: "block" }}>CREATED BY</Typography>
              <Typography variant="body2" sx={{ mt: 0.25 }}>a.demers@tricentis.com</Typography>
            </Box>
            <Box>
              <Typography variant="overline" sx={{ color: "text.disabled", fontSize: "0.62rem", letterSpacing: 1, display: "block" }}>AGENT ID</Typography>
              <Typography variant="body2" sx={{ fontFamily: "monospace", mt: 0.25 }}>{`AGT-${project.id.toUpperCase()}-${project.service.slice(0, 4).toUpperCase()}`}</Typography>
            </Box>
          </Box>
        </Paper>
      </Box>

      <DangerZone>
        <DangerZone.Row
          title="Archive agent"
          description="Pauses trace ingest. Traces and runs are preserved."
          action={
            <Button
              variant="outlined"
              color="error"
              startIcon={<SvgIcon fontSize="small"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" /></SvgIcon>}
            >
              Archive
            </Button>
          }
        />
        <Divider />
        <DangerZone.Row
          title="Remove agent"
          description="Permanently deletes this agent and all associated data."
          action={
            <Button
              variant="contained"
              color="error"
              onClick={() => {
                if (window.confirm("This will permanently delete the agent and all associated data. This cannot be undone. Continue?")) {
                  // Demo placeholder - no real deletion.
                }
              }}
            >
              Remove
            </Button>
          }
        />
      </DangerZone>
    </Box>
  );
}
