import { useCallback, useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Collapse from "@mui/material/Collapse";
import Alert from "@mui/material/Alert";
import LinearProgress from "@mui/material/LinearProgress";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import TextField from "@mui/material/TextField";
import Switch from "@mui/material/Switch";
import Slider from "@mui/material/Slider";
import SvgIcon from "@mui/material/SvgIcon";
import type { Project, VerdictBandKey } from "../../types";
import { getAdoptedProfile, PROFILES, updateProject, useMockData } from "../../data/mock";
import { DEFAULT_VERDICT_BANDS, VERDICT_BAND_META } from "../../data/verdict";
import TypeTag from "../../components/TypeTag";
import TintChip from "../../components/TintChip";
import { EVENT_KIND_CONFIG, EVENT_KIND_ICON } from "./shared";

interface Props {
  project: Project;
}

const DESCRIBE_STAGES = ["Parsing agent spec…", "Matching against profile library…", "Comparing with current evals…", "Generating recommendations…"];

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

export default function ProfileTab({ project }: Props) {
  useMockData();
  const adoptedResult = project.adoptedProfileId ? getAdoptedProfile(project.id) : null;
  const adoptedProfile = adoptedResult?.profile ?? null;
  const adoptedVersion = adoptedResult?.version ?? null;

  const [changeOpen, setChangeOpen] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState(project.adoptedProfileId ?? "");

  const [describeOpen, setDescribeOpen] = useState(false);
  const [describeMode, setDescribeMode] = useState<"guided" | "expert">("guided");
  const [describePurpose, setDescribePurpose] = useState("");
  const [describeFailures, setDescribeFailures] = useState("");
  const [describeConcerns, setDescribeConcerns] = useState("");
  const [describeSpec, setDescribeSpec] = useState("");
  const [describePhase, setDescribePhase] = useState<"form" | "analyzing" | "result">("form");
  const [describeAnalysisStep, setDescribeAnalysisStep] = useState(0);

  const [evalEnabled, setEvalEnabled] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const e of adoptedVersion?.entries ?? []) init[e.id] = e.enabled;
    return init;
  });
  const [verdictBands, setVerdictBands] = useState(adoptedVersion?.verdictBands ?? DEFAULT_VERDICT_BANDS);

  const totalSessions = project.runs.flatMap((r) => r.sessions).length;
  const hasEnoughTraces = totalSessions >= 20;

  const handleDescribeAnalyze = useCallback(() => {
    setDescribePhase("analyzing");
    setDescribeAnalysisStep(0);
    DESCRIBE_STAGES.forEach((_, i) => {
      setTimeout(() => {
        setDescribeAnalysisStep(i);
        if (i === DESCRIBE_STAGES.length - 1) setTimeout(() => setDescribePhase("result"), 700);
      }, i * 900);
    });
  }, []);

  function applyProfile(profileId: string) {
    updateProject({ ...project, adoptedProfileId: profileId });
    setDescribeOpen(false);
    setDescribePhase("form");
  }

  const entries = adoptedVersion?.entries ?? [];
  const byDim = new Map<string, typeof entries>();
  for (const e of entries) {
    if (!byDim.has(e.dimension)) byDim.set(e.dimension, []);
    byDim.get(e.dimension)!.push(e);
  }

  const events = [...(project.events ?? [])].sort((a, b) => b.ts.localeCompare(a.ts));

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3, maxWidth: 960 }}>
      {/* Current profile */}
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 1.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Current profile</Typography>
        {adoptedProfile && adoptedVersion ? (
          <>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mt: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>{adoptedProfile.name}</Typography>
              <TintChip tint="muted" label={`Version ${adoptedVersion.version}`} />
              <TintChip tint="info" label={adoptedProfile.origin === "auto" ? "Automatically selected" : "Manually pinned"} />
            </Box>
            <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5, mb: 2 }}>{adoptedProfile.description}</Typography>
          </>
        ) : (
          <Typography variant="body2" sx={{ color: "text.secondary", my: 1.5 }}>No scoring profile adopted for this agent yet.</Typography>
        )}
        <Box sx={{ display: "flex", gap: 1.5 }}>
          <Button variant="outlined" onClick={() => { setDescribeOpen((o) => !o); setDescribePhase("form"); }}>
            Re-evaluate profile
          </Button>
          <Button variant="outlined" color="inherit" sx={{ color: "text.secondary" }} onClick={() => setChangeOpen((o) => !o)}>
            Change profile version
          </Button>
        </Box>
        <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 1 }}>
          Changing the version pins this agent to your selection and re-scores recent interactions.
        </Typography>

        <Collapse in={changeOpen}>
          <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 1 }}>
            {PROFILES.map((p) => {
              const latest = p.versions[p.versions.length - 1];
              const isSelected = selectedProfileId === p.id;
              return (
                <Paper
                  key={p.id}
                  variant="outlined"
                  onClick={() => setSelectedProfileId(p.id)}
                  sx={{ p: 1.5, borderRadius: 1.5, cursor: "pointer", borderColor: isSelected ? "primary.main" : "divider" }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{p.name}</Typography>
                    <Chip label={`v${latest?.version ?? 1}`} size="small" variant="outlined" sx={{ height: 18, fontSize: "0.62rem" }} />
                    <TypeTag type={p.agentType} />
                  </Box>
                </Paper>
              );
            })}
            <Button
              variant="contained"
              sx={{ alignSelf: "flex-start", mt: 0.5 }}
              disabled={!selectedProfileId}
              onClick={() => applyProfile(selectedProfileId)}
            >
              Adopt version
            </Button>
          </Box>
        </Collapse>

        <Collapse in={describeOpen}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 1.5, borderColor: "primary.light", mt: 2 }}>
            {describePhase === "form" && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Describe your agent</Typography>
                  <ToggleButtonGroup size="small" exclusive value={describeMode} onChange={(_, v) => v && setDescribeMode(v)} sx={{ "& .MuiToggleButton-root": { fontSize: "0.72rem", py: 0.5, px: 1.25, textTransform: "none" } }}>
                    <ToggleButton value="guided">Guided</ToggleButton>
                    <ToggleButton value="expert">Expert</ToggleButton>
                  </ToggleButtonGroup>
                </Box>
                {describeMode === "guided" ? (
                  <>
                    <TextField label="What does this agent do?" multiline rows={2} fullWidth size="small" value={describePurpose} onChange={(e) => setDescribePurpose(e.target.value)} />
                    <TextField label="What should it never do?" multiline rows={2} fullWidth size="small" value={describeFailures} onChange={(e) => setDescribeFailures(e.target.value)} />
                    <TextField label="What are you most concerned about?" multiline rows={2} fullWidth size="small" value={describeConcerns} onChange={(e) => setDescribeConcerns(e.target.value)} />
                  </>
                ) : (
                  <TextField label="Agent spec (YAML, JSON, or Markdown)" multiline rows={8} fullWidth size="small" value={describeSpec} onChange={(e) => setDescribeSpec(e.target.value)} inputProps={{ style: { fontFamily: "monospace", fontSize: "0.78rem" } }} />
                )}
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button variant="contained" size="small" disabled={describeMode === "guided" ? !describePurpose.trim() : !describeSpec.trim()} onClick={handleDescribeAnalyze}>
                    Analyze
                  </Button>
                  <Button variant="text" size="small" color="inherit" sx={{ color: "text.secondary" }} onClick={() => setDescribeOpen(false)}>Cancel</Button>
                </Box>
              </Box>
            )}

            {describePhase === "analyzing" && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, py: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Analyzing your agent…</Typography>
                {DESCRIBE_STAGES.map((stage, i) => (
                  <Box key={stage} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    {i < describeAnalysisStep ? (
                      <Box sx={{ width: 16, height: 16, borderRadius: "50%", bgcolor: "success.main", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <SvgIcon sx={{ fontSize: "0.7rem", color: "#fff" }}><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></SvgIcon>
                      </Box>
                    ) : i === describeAnalysisStep ? (
                      <Box sx={{ width: 16, height: 16, flexShrink: 0 }}><LinearProgress sx={{ borderRadius: 4, height: 4, mt: 0.75 }} /></Box>
                    ) : (
                      <Box sx={{ width: 16, height: 16, borderRadius: "50%", border: "1.5px solid", borderColor: "divider", flexShrink: 0 }} />
                    )}
                    <Typography variant="caption" sx={{ color: i <= describeAnalysisStep ? "text.primary" : "text.disabled" }}>{stage}</Typography>
                  </Box>
                ))}
              </Box>
            )}

            {describePhase === "result" && (() => {
              const matchedProfile = PROFILES.find((p) => p.agentType === project.type) ?? PROFILES[0];
              const matchedVersion = matchedProfile.versions[matchedProfile.versions.length - 1];
              const confidence = 87 + (project.id.charCodeAt(project.id.length - 1) % 10);
              const currentEntries = adoptedVersion?.entries ?? [];
              const proposedEntries = matchedVersion.entries;
              const toAdd = proposedEntries.filter((p) => !currentEntries.some((c) => c.evalSlug === p.evalSlug));
              const toRemove = currentEntries.filter((c) => !proposedEntries.some((p) => p.evalSlug === c.evalSlug));
              const toAdjust = proposedEntries.filter((p) => {
                const cur = currentEntries.find((c) => c.evalSlug === p.evalSlug);
                return cur && Math.abs(cur.weight - p.weight) > 0.1;
              });
              const noChanges = toAdd.length === 0 && toRemove.length === 0 && toAdjust.length === 0;

              return (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{matchedProfile.name}</Typography>
                    <Chip label={`${confidence}% match`} size="small" color="success" variant="outlined" sx={{ height: 20, fontSize: "0.65rem" }} />
                  </Box>
                  {noChanges ? (
                    <Alert severity="success" sx={{ py: 0.5 }}>Your current evals already match the recommended profile. No changes needed.</Alert>
                  ) : (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
                      {toAdd.map((entry) => (
                        <Box key={entry.id} sx={{ display: "flex", alignItems: "center", gap: 1, p: 1, borderRadius: 1, border: "1px solid", borderColor: "success.light" }}>
                          <Typography variant="caption" sx={{ color: "success.dark", fontWeight: 700, width: 56, flexShrink: 0 }}>Add</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>{entry.evalName}</Typography>
                        </Box>
                      ))}
                      {toRemove.map((entry) => (
                        <Box key={entry.id} sx={{ display: "flex", alignItems: "center", gap: 1, p: 1, borderRadius: 1, border: "1px solid", borderColor: "error.light" }}>
                          <Typography variant="caption" sx={{ color: "error.dark", fontWeight: 700, width: 56, flexShrink: 0 }}>Remove</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>{entry.evalName}</Typography>
                        </Box>
                      ))}
                      {toAdjust.map((entry) => {
                        const cur = currentEntries.find((c) => c.evalSlug === entry.evalSlug)!;
                        return (
                          <Box key={entry.id} sx={{ display: "flex", alignItems: "center", gap: 1, p: 1, borderRadius: 1, border: "1px solid", borderColor: "warning.light" }}>
                            <Typography variant="caption" sx={{ color: "warning.dark", fontWeight: 700, width: 56, flexShrink: 0 }}>Adjust</Typography>
                            <Typography variant="caption" sx={{ fontWeight: 600 }}>{entry.evalName}</Typography>
                            <Typography variant="caption" sx={{ color: "text.secondary", ml: "auto" }}>weight {cur.weight} → {entry.weight}</Typography>
                          </Box>
                        );
                      })}
                    </Box>
                  )}
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Button variant="contained" size="small" disabled={noChanges} onClick={() => applyProfile(matchedProfile.id)}>
                      Apply changes
                    </Button>
                    <Button variant="text" size="small" color="inherit" sx={{ color: "text.secondary" }} onClick={() => setDescribePhase("form")}>Back</Button>
                  </Box>
                </Box>
              );
            })()}
          </Paper>
        </Collapse>
      </Paper>

      {/* What gets scored */}
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 1.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>What gets scored</Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>Toggle individual evals on or off. Changes apply to the next run.</Typography>
        {entries.length === 0 ? (
          <Typography variant="body2" sx={{ color: "text.disabled" }}>No evals configured. Adopt a profile above.</Typography>
        ) : (
          [...byDim.entries()].map(([dim, evals]) => (
            <Box key={dim} sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: "text.disabled", textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 1 }}>{dim}</Typography>
              <Paper variant="outlined" sx={{ borderRadius: 1.5, overflow: "hidden" }}>
                {evals.map((entry, idx) => {
                  const enabled = evalEnabled[entry.id] ?? entry.enabled;
                  return (
                    <Box key={entry.id} sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2, py: 1.25, opacity: enabled ? 1 : 0.5, borderBottom: idx < evals.length - 1 ? "1px solid" : "none", borderColor: "divider" }}>
                      <Switch checked={enabled} onChange={() => setEvalEnabled((prev) => ({ ...prev, [entry.id]: !enabled }))} size="small" />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>{entry.evalName}</Typography>
                          <Chip label={EVAL_KIND_LABEL[entry.evalKind] ?? entry.evalKind} size="small" color={EVAL_KIND_COLOR[entry.evalKind] ?? "default"} variant="outlined" sx={{ height: 16, fontSize: "0.6rem" }} />
                          <Chip label={`weight ${entry.weight}x`} size="small" variant="outlined" sx={{ height: 16, fontSize: "0.6rem" }} />
                        </Box>
                      </Box>
                      <Typography variant="caption" sx={{ color: "text.secondary", flexShrink: 0, fontFamily: "monospace" }}>≥{Math.round(entry.threshold * 100)}%</Typography>
                    </Box>
                  );
                })}
              </Paper>
            </Box>
          ))
        )}
      </Paper>

      {/* Verdict bands */}
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 1.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>Verdict bands</Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2.5 }}>
          The score cutoffs that decide whether a result is labeled Ship, Review, or Block.
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          {(["ship", "review", "block"] as VerdictBandKey[]).map((key) => (
            <Box key={key} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: VERDICT_BAND_META[key].token, minWidth: 100 }}>{VERDICT_BAND_META[key].label}</Typography>
              <Box sx={{ flex: 1 }}>
                <Slider value={verdictBands[key]} onChange={(_, v) => setVerdictBands((prev) => ({ ...prev, [key]: v as number }))} min={0} max={100} step={1} valueLabelDisplay="auto" size="small" />
              </Box>
              <Typography variant="body2" sx={{ fontFamily: "monospace", minWidth: 36, textAlign: "right", color: "text.secondary" }}>≥{verdictBands[key]}</Typography>
            </Box>
          ))}
        </Box>
      </Paper>

      {!hasEnoughTraces && (
        <Typography variant="caption" sx={{ color: "text.disabled" }}>
          Auto-fit activates once {20 - totalSessions} more traces are collected.
        </Typography>
      )}

      {/* Activity */}
      <Box data-testid="profile-activity-section">
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>Activity</Typography>
        <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 2 }}>Profile changes, run triggers, schedule edits</Typography>
        {events.length > 0 ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {events.map((ev, i) => {
              const kindCfg = EVENT_KIND_CONFIG[ev.kind] ?? { label: ev.kind, color: "text.secondary" };
              return (
                <Box key={ev.id} sx={{ display: "flex", gap: 2, pb: i < events.length - 1 ? 2.5 : 0 }}>
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                    <Box sx={{ width: 32, height: 32, borderRadius: "50%", bgcolor: "action.hover", border: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <SvgIcon sx={{ fontSize: "0.9rem", color: "text.secondary" }}><path d={EVENT_KIND_ICON[ev.kind] ?? EVENT_KIND_ICON.run_completed} /></SvgIcon>
                    </Box>
                    {i < events.length - 1 && <Box sx={{ width: 1, flex: 1, bgcolor: "divider", mt: 0.5 }} />}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0, pt: 0.5 }}>
                    <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, flexWrap: "wrap", mb: 0.25 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{ev.title}</Typography>
                      <Chip label={kindCfg.label} size="small" variant="outlined" sx={{ height: 16, fontSize: "0.6rem" }} />
                      <Typography variant="caption" sx={{ color: "text.disabled" }}>
                        {new Date(ev.ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}
                        {ev.author && ev.author !== "system" ? ` · ${ev.author}` : ""}
                      </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>{ev.detail}</Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>
        ) : (
          <Typography variant="body2" sx={{ color: "text.disabled" }}>Scoring runs and profile changes will appear here.</Typography>
        )}
      </Box>
    </Box>
  );
}
