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
import FormControlLabel from "@mui/material/FormControlLabel";
import type { View, VerdictBandKey } from "../types";
import {
  getProject,
  getAdoptedProfile,
  PROFILES,
  LLM_JUDGES,
  updateProject,
} from "../data/mock";
import TypeTag from "../components/TypeTag";

interface Props {
  projectId: string;
  navigate: (v: View) => void;
}

const VERDICT_BANDS: { key: VerdictBandKey; label: string; color: string }[] = [
  { key: "ship", label: "Ship", color: "success.main" },
  { key: "ship_note", label: "Ship with notes", color: "success.dark" },
  { key: "review", label: "Review", color: "warning.main" },
  { key: "block_rec", label: "Block", color: "error.main" },
];

const EVAL_KIND_COLOR: Record<string, "default" | "primary" | "info" | "secondary"> = {
  library_metric: "default",
  llm_judge: "primary",
  hybrid: "info",
  decision_tree: "secondary",
};

const EVAL_KIND_LABEL: Record<string, string> = {
  library_metric: "Library",
  llm_judge: "LLM Judge",
  hybrid: "Hybrid",
  decision_tree: "Decision Tree",
};

export default function AgentSettingsView({ projectId, navigate }: Props) {
  const project = getProject(projectId);
  const adoptedResult = project?.adoptedProfileId ? getAdoptedProfile(projectId) : null;
  const adoptedProfile = adoptedResult?.profile ?? null;
  const adoptedVersion = adoptedResult?.version ?? null;

  const [selectedProfileId, setSelectedProfileId] = useState(project?.adoptedProfileId ?? "");
  const [selectedJudgeId, setSelectedJudgeId] = useState(project?.llmJudgeId ?? LLM_JUDGES[0]?.id ?? "");
  const [sampleRate, setSampleRate] = useState(project?.traceSampleRate ?? 100);

  const [verdictBands, setVerdictBands] = useState(
    adoptedVersion?.verdictBands ?? { ship: 85, ship_note: 70, review: 55, block_rec: 40 }
  );

  const [evalEnabled, setEvalEnabled] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const e of adoptedVersion?.entries ?? []) {
      init[e.id] = e.enabled;
    }
    return init;
  });

  const [saved, setSaved] = useState(false);

  if (!project) return <Box sx={{ p: 3 }}><Typography>Project not found.</Typography></Box>;

  const selectedProfile = PROFILES.find((p) => p.id === selectedProfileId);
  const latestVersion = selectedProfile?.versions[selectedProfile.versions.length - 1];
  const entries = latestVersion?.entries ?? adoptedVersion?.entries ?? [];

  function handleSave() {
    updateProject({
      ...project!,
      adoptedProfileId: selectedProfileId || undefined,
      llmJudgeId: selectedJudgeId || undefined,
      traceSampleRate: sampleRate,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <Box sx={{ p: 3, maxWidth: 860 }}>
      <Button
        size="small"
        onClick={() => navigate({ name: "project", projectId })}
        sx={{ mb: 2, color: "text.secondary" }}
      >
        ← Agent
      </Button>

      <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>Agent Settings</Typography>
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
        {project.name} - {project.service}
      </Typography>

      {saved && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 1.5 }}>Settings saved.</Alert>
      )}

      {/* Scoring Profile */}
      <Paper sx={{ p: 2.5, mb: 3, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>Scoring Profile</Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
          The profile defines which dimensions are measured and how they are weighted into a composite score.
        </Typography>
        <RadioGroup value={selectedProfileId} onChange={(e) => setSelectedProfileId(e.target.value)}>
          {PROFILES.map((p) => {
            const latest = p.versions[p.versions.length - 1];
            const isActive = p.id === adoptedProfile?.id;
            const dimCount = new Set(latest?.entries.map((e) => e.dimension)).size;
            const evalCount = latest?.entries.filter((e) => e.enabled).length ?? 0;
            return (
              <Paper
                key={p.id}
                variant="outlined"
                sx={{
                  mb: 1,
                  borderRadius: 1.5,
                  borderColor: selectedProfileId === p.id ? "primary.main" : "divider",
                  bgcolor: selectedProfileId === p.id ? "rgba(var(--mui-palette-primary-mainChannel) / 0.04)" : undefined,
                  cursor: "pointer",
                  transition: "border-color 0.15s",
                }}
                onClick={() => setSelectedProfileId(p.id)}
              >
                <Box sx={{ display: "flex", alignItems: "center", px: 2, py: 1.5, gap: 1 }}>
                  <Radio value={p.id} size="small" sx={{ p: 0.5 }} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{p.name}</Typography>
                      <Chip label={`v${latest?.version ?? 1}`} size="small" variant="outlined" sx={{ height: 18, fontSize: "0.62rem" }} />
                      <TypeTag type={p.agentType} />
                      {isActive && (
                        <Chip label="Active" size="small" color="success" sx={{ height: 18, fontSize: "0.62rem" }} />
                      )}
                    </Box>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      {evalCount} evals across {dimCount} dimensions
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            );
          })}
        </RadioGroup>
      </Paper>

      {/* LLM Judge */}
      <Paper sx={{ p: 2.5, mb: 3, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>LLM Judge</Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
          The model that scores each session against your eval criteria.
        </Typography>
        <RadioGroup value={selectedJudgeId} onChange={(e) => setSelectedJudgeId(e.target.value)}>
          {LLM_JUDGES.map((j) => (
            <Paper
              key={j.id}
              variant="outlined"
              sx={{
                mb: 1,
                borderRadius: 1.5,
                borderColor: selectedJudgeId === j.id ? "primary.main" : "divider",
                bgcolor: selectedJudgeId === j.id ? "rgba(var(--mui-palette-primary-mainChannel) / 0.04)" : undefined,
                cursor: "pointer",
                transition: "border-color 0.15s",
              }}
              onClick={() => setSelectedJudgeId(j.id)}
            >
              <Box sx={{ display: "flex", alignItems: "center", px: 2, py: 1.5, gap: 1 }}>
                <Radio value={j.id} size="small" sx={{ p: 0.5 }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{j.name}</Typography>
                    <Chip label={j.provider} size="small" variant="outlined" sx={{ height: 18, fontSize: "0.62rem" }} />
                    <Chip
                      label={j.status === "live" ? "Live" : "Error"}
                      size="small"
                      color={j.status === "live" ? "success" : "error"}
                      sx={{ height: 18, fontSize: "0.62rem" }}
                    />
                  </Box>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontFamily: "monospace" }}>{j.model}</Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>{j.description}</Typography>
                </Box>
              </Box>
            </Paper>
          ))}
        </RadioGroup>
      </Paper>

      {/* Evaluation Metrics */}
      <Paper sx={{ p: 2.5, mb: 3, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 0.5 }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Evaluation Metrics</Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.25 }}>
              Toggle individual evals on or off. Changes apply to the next run.
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ color: "text.secondary", flexShrink: 0, mt: 0.5 }}>
            {Object.values(evalEnabled).filter(Boolean).length} of {entries.length} enabled
          </Typography>
        </Box>

        {entries.length === 0 ? (
          <Typography variant="body2" sx={{ color: "text.disabled", mt: 2 }}>
            No evals configured. Select a scoring profile above.
          </Typography>
        ) : (
          <Box sx={{ mt: 2 }}>
            {(() => {
              const byDim = new Map<string, typeof entries>();
              for (const e of entries) {
                if (!byDim.has(e.dimension)) byDim.set(e.dimension, []);
                byDim.get(e.dimension)!.push(e);
              }
              return [...byDim.entries()].map(([dim, evals]) => (
                <Box key={dim} sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "text.disabled", textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 1 }}>
                    {dim}
                  </Typography>
                  <Paper variant="outlined" sx={{ borderRadius: 1.5, overflow: "hidden" }}>
                    {evals.map((entry, idx) => {
                      const enabled = evalEnabled[entry.id] ?? entry.enabled;
                      return (
                        <Box
                          key={entry.id}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                            px: 2,
                            py: 1.25,
                            opacity: enabled ? 1 : 0.5,
                            borderBottom: idx < evals.length - 1 ? "1px solid" : "none",
                            borderColor: "divider",
                          }}
                        >
                          <Switch
                            checked={enabled}
                            onChange={() =>
                              setEvalEnabled((prev) => ({ ...prev, [entry.id]: !enabled }))
                            }
                            size="small"
                            sx={{ flexShrink: 0 }}
                          />
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
                              <Typography variant="caption" sx={{ fontWeight: 600 }}>{entry.evalName}</Typography>
                              <Chip
                                label={EVAL_KIND_LABEL[entry.evalKind] ?? entry.evalKind}
                                size="small"
                                color={EVAL_KIND_COLOR[entry.evalKind] ?? "default"}
                                variant="outlined"
                                sx={{ height: 16, fontSize: "0.6rem" }}
                              />
                              <Chip
                                label={`weight ${entry.weight}x`}
                                size="small"
                                variant="outlined"
                                sx={{ height: 16, fontSize: "0.6rem" }}
                              />
                            </Box>
                            <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 0.25 }}>
                              {entry.question.length > 100 ? entry.question.slice(0, 100) + "…" : entry.question}
                            </Typography>
                          </Box>
                          <Typography variant="caption" sx={{ color: "text.secondary", flexShrink: 0, fontFamily: "monospace" }}>
                            ≥{Math.round(entry.threshold * 100)}%
                          </Typography>
                        </Box>
                      );
                    })}
                  </Paper>
                </Box>
              ));
            })()}
          </Box>
        )}
      </Paper>

      {/* Verdict Bands */}
      <Paper sx={{ p: 2.5, mb: 3, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>Verdict Bands</Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2.5 }}>
          Composite score thresholds that map to verdict labels. Each band must be lower than the one above it.
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          {VERDICT_BANDS.map(({ key, label, color }) => (
            <Box key={key} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color, minWidth: 120 }}>{label}</Typography>
              <Box sx={{ flex: 1 }}>
                <Slider
                  value={verdictBands[key]}
                  onChange={(_, v) => setVerdictBands((prev) => ({ ...prev, [key]: v as number }))}
                  min={0}
                  max={100}
                  step={1}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(v) => `≥${v}`}
                  size="small"
                />
              </Box>
              <Typography variant="body2" sx={{ fontFamily: "monospace", minWidth: 36, textAlign: "right", color: "text.secondary" }}>
                ≥{verdictBands[key]}
              </Typography>
            </Box>
          ))}
        </Box>
      </Paper>

      {/* Trace Sampling */}
      <Paper sx={{ p: 2.5, mb: 4, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 2 }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Trace Sampling</Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.25 }}>
              Percentage of incoming traces submitted for evaluation.
            </Typography>
          </Box>
          <Typography variant="h5" sx={{ fontFamily: "monospace", fontWeight: 800, color: sampleRate < 50 ? "warning.main" : "text.primary" }}>
            {sampleRate}%
          </Typography>
        </Box>
        <Box sx={{ px: 1 }}>
          <Slider
            value={sampleRate}
            onChange={(_, v) => setSampleRate(v as number)}
            min={1}
            max={100}
            step={1}
            marks={[
              { value: 10, label: "10%" },
              { value: 25, label: "25%" },
              { value: 50, label: "50%" },
              { value: 75, label: "75%" },
              { value: 100, label: "100%" },
            ]}
            valueLabelDisplay="auto"
            valueLabelFormat={(v) => `${v}%`}
          />
        </Box>
      </Paper>

      <Divider sx={{ mb: 3 }} />

      <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
        <Button variant="contained" onClick={handleSave}>
          Save settings
        </Button>
        <Button variant="outlined" color="inherit" onClick={() => navigate({ name: "project", projectId })} sx={{ color: "text.secondary" }}>
          Cancel
        </Button>
        {saved && (
          <Typography variant="caption" sx={{ color: "success.main" }}>Settings saved.</Typography>
        )}
      </Box>
    </Box>
  );
}
