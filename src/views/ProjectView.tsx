import { useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import ButtonBase from "@mui/material/ButtonBase";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Slider from "@mui/material/Slider";
import LinearProgress from "@mui/material/LinearProgress";
import Tooltip from "@mui/material/Tooltip";
import ChipStatus from "@tricentis/aura/components/ChipStatus.js";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import ChipSubtle from "@tricentis/aura/components/ChipSubtle.js";
import Alert from "@mui/material/Alert";
import type { View, Run, ActivityEventKind } from "../types";
import Chip from "@mui/material/Chip";
import { getProject, runPassRate, getEvalDesign, computePassK, projectCompositeScore, sessionGrade, getAdoptedProfile, updateProject, isScorePreliminary, addRunToProject } from "../data/mock";
import VerdictBadge from "../components/VerdictBadge";
import TypeTag from "../components/TypeTag";
import GradeChip from "../components/GradeChip";

const SCORE_STAGES = [
  "Fetching recent traces…",
  "Running eval suite…",
  "Aggregating dimension scores…",
  "Finalizing run report…",
];

const EVENT_KIND_CONFIG: Record<ActivityEventKind, { label: string; color: string }> = {
  profile_adopted:        { label: "Profile matched",    color: "primary.main" },
  run_completed:          { label: "Run completed",      color: "success.main" },
  milestone_reached:      { label: "Milestone",          color: "warning.main" },
  decision_override:      { label: "Override",           color: "error.main" },
  profile_version_changed:{ label: "Profile updated",    color: "info.main" },
  regrade_completed:      { label: "Regraded",           color: "text.secondary" },
};

interface Props {
  projectId: string;
  navigate: (v: View) => void;
}

export default function ProjectView({ projectId, navigate }: Props) {
  const project = getProject(projectId);
  const evalDesign = getEvalDesign(projectId);
  const adoptedProfileResult = project?.adoptedProfileId ? getAdoptedProfile(projectId) : null;
  const adoptedProfile = adoptedProfileResult?.profile ?? null;
  const adoptedProfileVersion = adoptedProfileResult?.version ?? null;

  const [sampleRate, setSampleRate] = useState<number>(project?.traceSampleRate ?? 100);
  const [sampleSaved, setSampleSaved] = useState(false);
  const [isScoringNow, setIsScoringNow] = useState(false);
  const [scoringStage, setScoringStage] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  if (!project) return <Box sx={{ p: 3 }}><Typography>Project not found.</Typography></Box>;

  // re-read after refresh
  void refreshKey;

  function handleSampleSave() {
    updateProject({ ...project!, traceSampleRate: sampleRate });
    setSampleSaved(true);
    setTimeout(() => setSampleSaved(false), 2000);
  }

  function handleScoreNow() {
    setIsScoringNow(true);
    setScoringStage(0);
    SCORE_STAGES.forEach((_, i) => {
      setTimeout(() => {
        setScoringStage(i);
        if (i === SCORE_STAGES.length - 1) {
          setTimeout(() => {
            const lastRun = project.runs[0];
            const now = new Date();
            const clamp = (v: number) => Math.max(20, Math.min(100, Math.round(v)));
            const newRun: Run = {
              id: `r-od-${Date.now()}`,
              label: `On-demand run · ${now.toLocaleDateString()}`,
              date: now.toISOString().slice(0, 10),
              sessions: (lastRun?.sessions ?? []).map((s, idx) => ({
                ...s,
                id: `s-od-${idx}-${Date.now()}`,
                ts: now.toISOString(),
                scores: {
                  ...s.scores,
                  benchmarkPerformance: { ...s.scores.benchmarkPerformance, score: clamp(s.scores.benchmarkPerformance.score + Math.round((Math.random() - 0.45) * 10)) },
                  uxSignal: { ...s.scores.uxSignal, score: clamp(s.scores.uxSignal.score + Math.round((Math.random() - 0.45) * 8)) },
                  ...(s.scores.valueEfficiency ? { valueEfficiency: { ...s.scores.valueEfficiency, score: clamp(s.scores.valueEfficiency.score + Math.round((Math.random() - 0.45) * 8)) } } : {}),
                },
              })),
            };
            addRunToProject(projectId, newRun);
            setIsScoringNow(false);
            setRefreshKey((k) => k + 1);
          }, 600);
        }
      }, i * 700);
    });
  }

  const passK = computePassK(project);
  const composite = projectCompositeScore(project);
  const grade = sessionGrade(composite);
  const canCompare = project.runs.length >= 2;
  const isPreliminary = isScorePreliminary(project);
  const confidenceDelta = Math.round(composite * 0.05);

  const evalStatusLabel = evalDesign?.status === "confirmed"
    ? "Confirmed"
    : evalDesign?.status === "observation_ready"
    ? "Recommendation Ready"
    : "No Design";

  const evalStatusColor = evalDesign?.status === "confirmed"
    ? "success"
    : evalDesign?.status === "observation_ready"
    ? "warning"
    : undefined;

  return (
    <Box sx={{ p: 3, maxWidth: 960 }}>
      {/* Back */}
      <Button size="small" onClick={() => navigate({ name: "fleet" })} sx={{ mb: 2, color: "text.secondary" }}>
        ← Fleet
      </Button>

      {/* ATC beta notice */}
      {project.type === "ATC" && (
        <Alert severity="info" sx={{ mb: 2, fontSize: "0.8rem" }}>
          <strong>ATC Beta:</strong> ATC sessions are surfaced as informational signals in Phase 2. Verdicts and scores help calibrate evaluation design but are not CI gates.
        </Alert>
      )}

      {/* Project header */}
      <Paper sx={{ p: 2.5, mb: 3, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 1 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.25 }}>
              {project.name}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.disabled", fontFamily: "monospace" }}>
              {project.service}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <TypeTag type={project.type} />
          </Box>
        </Box>
        <Divider sx={{ my: 1.5 }} />
        <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap", alignItems: "flex-start" }}>
          <Box>
            <Typography variant="caption" sx={{ color: "text.disabled", display: "block" }}>Score</Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 0.25, flexWrap: "wrap" }}>
              <GradeChip grade={grade} size="small" />
              <Typography variant="subtitle2" sx={{ fontWeight: 700, fontFamily: "monospace" }}>
                {composite}/100
              </Typography>
              {isPreliminary ? (
                <Tooltip title="Score is based on fewer than 30 sessions. Run more evals to reach a stable grade." arrow>
                  <Chip label="Preliminary" size="small" color="warning" sx={{ height: 18, fontSize: "0.62rem", cursor: "help" }} />
                </Tooltip>
              ) : (
                <Typography variant="caption" sx={{ color: "text.disabled", fontFamily: "monospace" }}>
                  ± {confidenceDelta}
                </Typography>
              )}
            </Box>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: "text.disabled", display: "block" }}>Runs</Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{project.runs.length}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: "text.disabled", display: "block" }}>Sessions</Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {project.runs.flatMap((r) => r.sessions).length}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: "text.disabled", display: "block" }}>Reliability</Typography>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                color:
                  project.reliability === "RELIABLE"
                    ? "success.main"
                    : project.reliability === "NEEDS_WORK"
                    ? "warning.main"
                    : "error.main",
              }}
            >
              {project.reliability.replace("_", " ")}
            </Typography>
          </Box>
          {passK >= 0 && (
            <Box>
              <Typography variant="caption" sx={{ color: "text.disabled", display: "block" }}>Pass^k (multi-run)</Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 0.25 }}>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 700, color: passK >= 75 ? "success.main" : passK >= 50 ? "warning.main" : "error.main" }}
                >
                  {passK}%
                </Typography>
                <ChipSubtle label="consistent" color="default" sx={{ fontSize: "0.6rem", height: 18 }} />
              </Box>
            </Box>
          )}
          <Box sx={{ ml: "auto", alignSelf: "center", display: "flex", gap: 1 }}>
            <Button
              size="small"
              variant="contained"
              onClick={handleScoreNow}
              disabled={isScoringNow}
            >
              {isScoringNow ? "Scoring…" : "Score now"}
            </Button>
            {canCompare && (
              <Button
                size="small"
                variant="outlined"
                color="inherit"
                sx={{ color: "text.secondary" }}
                onClick={() =>
                  navigate({
                    name: "compare-runs",
                    projectId,
                    runIdA: project.runs[0].id,
                    runIdB: project.runs[1].id,
                  })
                }
              >
                Compare runs
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Scoring profile / Evaluation Design card */}
      {adoptedProfile && adoptedProfileVersion ? (() => {
        const latestVersion = adoptedProfileVersion;
        const enabledEntries = latestVersion.entries.filter((e) => e.enabled);
        const dimensions = [...new Set(enabledEntries.map((e) => e.dimension))];
        return (
          <Paper
            sx={{
              p: 2,
              mb: 3,
              border: "1px solid",
              borderColor: "success.dark",
              borderRadius: 2,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2 }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    Scoring Profile
                  </Typography>
                  <Chip label={`v${latestVersion.version}`} size="small" sx={{ height: 18, fontSize: "0.65rem", fontFamily: "monospace" }} />
                  <ChipStatus status="Passed" />
                </Box>
                <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
                  {adoptedProfile.name} · {enabledEntries.length} evals across {dimensions.length} dimensions
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 1 }}>
                  {dimensions.map((d) => (
                    <Chip key={d} label={d} size="small" variant="outlined" sx={{ height: 20, fontSize: "0.68rem" }} />
                  ))}
                </Box>
                {project.fingerprintMatchedAt ? (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                    <Typography variant="caption" sx={{ color: "text.disabled" }}>
                      Auto-matched {new Date(project.fingerprintMatchedAt).toLocaleDateString()} · {Math.round((project.fingerprintConfidence ?? 0) * 100)}% confidence · {project.fingerprintSessionCount ?? 0} sessions analyzed
                    </Typography>
                    <Button size="small" variant="text" sx={{ fontSize: "0.68rem", p: 0, minWidth: 0, color: "text.secondary", textDecoration: "underline" }} onClick={() => navigate({ name: "profiles" })}>
                      Override
                    </Button>
                  </Box>
                ) : (
                  <Typography variant="caption" sx={{ color: "text.disabled" }}>Fingerprint not yet matched</Typography>
                )}
              </Box>
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1, flexShrink: 0 }}>
                <Box sx={{ display: "flex", gap: 0.75 }}>
                  {(["ship", "ship_note", "review", "block_rec"] as const).map((k) => (
                    <Typography key={k} variant="caption" sx={{ color: "text.disabled", whiteSpace: "nowrap" }}>
                      {k === "ship" ? "Ship" : k === "ship_note" ? "Ship†" : k === "review" ? "Review" : "Block"} ≥{latestVersion.verdictBands[k]}
                    </Typography>
                  ))}
                </Box>
              </Box>
            </Box>
          </Paper>
        );
      })() : (
        <Paper
          sx={{
            p: 2,
            mb: 3,
            border: "1px solid",
            borderColor: evalDesign?.status === "confirmed"
              ? "success.dark"
              : evalDesign?.status === "observation_ready"
              ? "warning.dark"
              : "divider",
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Evaluation Design
              </Typography>
              <ChipStatus
                status={
                  evalDesign?.status === "confirmed"
                    ? "Passed"
                    : evalDesign?.status === "observation_ready"
                    ? "Pending"
                    : "Draft"
                }
              />
            </Box>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {evalDesign?.status === "confirmed"
                ? `${evalDesign.confirmedDimensions.length} dimensions confirmed · ${evalDesign.calibrationSet.length} calibration scenarios`
                : evalDesign?.status === "observation_ready"
                ? `Observation-based recommendation ready — ${evalDesign.measurementRecommendation?.shadowSessionCount} shadow sessions analyzed`
                : "No evaluation design yet. Define what to measure before scoring begins."}
            </Typography>
          </Box>
          <Button
            variant={evalDesign?.status === "confirmed" ? "outlined" : "contained"}
            color={evalDesign?.status === "confirmed" ? "inherit" : "primary"}
            size="small"
            onClick={() => navigate({ name: "eval-design", projectId })}
            sx={evalDesign?.status === "confirmed" ? { color: "text.secondary" } : {}}
          >
            {evalDesign?.status === "confirmed" ? "View design" : evalDesign?.status === "observation_ready" ? "Review recommendation" : "Set up evaluation design"}
          </Button>
        </Paper>
      )}

      {/* Trace sampling */}
      <Paper sx={{ p: 2.5, mb: 3, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2, mb: 2 }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Trace sampling</Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.25 }}>
              Limit the percentage of incoming traces submitted for evaluation. Reduce to control cost; set to 100% for full coverage.
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
            <Typography
              variant="h5"
              sx={{ fontFamily: "monospace", fontWeight: 800, color: sampleRate < 50 ? "warning.main" : "text.primary", minWidth: 64, textAlign: "right" }}
            >
              {sampleRate}%
            </Typography>
          </Box>
        </Box>
        <Box sx={{ px: 1, mb: 2 }}>
          <Slider
            value={sampleRate}
            onChange={(_, v) => { setSampleRate(v as number); setSampleSaved(false); }}
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
        {sampleRate < 100 && (
          <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 1.5 }}>
            At {sampleRate}%, roughly {sampleRate} out of every 100 traces will be evaluated. The rest are ingested but not scored.
          </Typography>
        )}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Button
            variant="contained"
            size="small"
            onClick={handleSampleSave}
            disabled={sampleRate === (project.traceSampleRate ?? 100)}
          >
            Save
          </Button>
          {sampleSaved && (
            <Typography variant="caption" sx={{ color: "success.main" }}>Saved</Typography>
          )}
          {sampleRate !== (project.traceSampleRate ?? 100) && !sampleSaved && (
            <Typography variant="caption" sx={{ color: "text.disabled" }}>Unsaved changes</Typography>
          )}
        </Box>
      </Paper>

      {/* Scoring animation (Gap 5) */}
      {isScoringNow && (
        <Paper sx={{ p: 2.5, mb: 3, border: "1px solid", borderColor: "primary.main", borderRadius: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>Scoring in progress…</Typography>
          <LinearProgress sx={{ borderRadius: 1, height: 6, mb: 2 }} />
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
            {SCORE_STAGES.map((label, i) => (
              <Box key={label} sx={{ display: "flex", alignItems: "center", gap: 1.5, opacity: i <= scoringStage ? 1 : 0.3, transition: "opacity 0.3s" }}>
                <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: i < scoringStage ? "success.main" : i === scoringStage ? "primary.main" : "divider", flexShrink: 0, transition: "background-color 0.3s" }} />
                <Typography variant="caption" sx={{ color: i <= scoringStage ? "text.primary" : "text.disabled" }}>{label}</Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      )}

      {/* Runs */}
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
        Runs
      </Typography>

      {/* Regrade notice (Gap 8) */}
      {project.runs.some((r) => r.regradedWithProfileVersion) && (() => {
        const regradeVersion = project.runs.find((r) => r.regradedWithProfileVersion)?.regradedWithProfileVersion;
        const regradeEvent = project.events?.find((e) => e.kind === "profile_version_changed");
        return (
          <Alert severity="info" sx={{ mb: 1.5, borderRadius: 1.5 }}>
            Profile updated to v{regradeVersion}
            {regradeEvent ? ` on ${new Date(regradeEvent.ts).toLocaleDateString()}` : ""}. Earlier runs were re-evaluated against the new version so your trend stays a fair comparison.
          </Alert>
        );
      })()}

      <Paper sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>Run</TableCell>
              <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>Sessions</TableCell>
              <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>Pass Rate</TableCell>
              <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>Latest Verdict</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {project.runs.map((run) => {
              const passRate = runPassRate(run.sessions);
              const latestVerdict = run.sessions[0]?.verdict ?? "FAIL";
              return (
                <TableRow
                  key={run.id}
                  component={ButtonBase}
                  onClick={() => !run.inProgress && navigate({ name: "run", projectId, runId: run.id })}
                  sx={{
                    display: "table-row",
                    cursor: run.inProgress ? "default" : "pointer",
                    "&:hover": { bgcolor: run.inProgress ? undefined : "action.hover" },
                    "&:last-child td": { borderBottom: 0 },
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {run.label}
                      </Typography>
                      {run.inProgress && (
                        <Chip label="In progress" size="small" color="primary" sx={{ height: 18, fontSize: "0.62rem" }} />
                      )}
                      {run.regradedWithProfileVersion && (
                        <Chip label={`Regraded v${run.regradedWithProfileVersion}`} size="small" variant="outlined" sx={{ height: 18, fontSize: "0.62rem", color: "text.secondary" }} />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      {new Date(run.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: run.inProgress ? "text.disabled" : undefined }}>
                      {run.inProgress ? "—" : run.sessions.length}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {run.inProgress ? (
                      <Typography variant="body2" sx={{ color: "text.disabled" }}>—</Typography>
                    ) : (
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, color: passRate >= 75 ? "success.main" : passRate >= 50 ? "warning.main" : "error.main" }}
                      >
                        {passRate}%
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {run.inProgress ? (
                      <Typography variant="body2" sx={{ color: "text.disabled" }}>—</Typography>
                    ) : (
                      <VerdictBadge verdict={latestVerdict} />
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Paper>

      {/* Activity log (Gap 6) */}
      {project.events && project.events.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Activity</Typography>
          <Box sx={{ position: "relative" }}>
            {/* vertical connector line */}
            <Box sx={{ position: "absolute", left: 6, top: 12, bottom: 12, width: 1, bgcolor: "divider" }} />
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {[...project.events].sort((a, b) => b.ts.localeCompare(a.ts)).map((ev) => {
                const kindCfg = EVENT_KIND_CONFIG[ev.kind] ?? { label: ev.kind, color: "text.secondary" };
                return (
                  <Box key={ev.id} sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                    <Box sx={{ width: 13, height: 13, borderRadius: "50%", bgcolor: kindCfg.color, flexShrink: 0, mt: 0.4, zIndex: 1 }} />
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{ev.title}</Typography>
                        <Chip label={kindCfg.label} size="small" variant="outlined" sx={{ height: 16, fontSize: "0.6rem" }} />
                        {ev.author && ev.author !== "system" && (
                          <Typography variant="caption" sx={{ color: "text.disabled" }}>{ev.author}</Typography>
                        )}
                      </Box>
                      <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 0.25 }}>{ev.detail}</Typography>
                      <Typography variant="caption" sx={{ color: "text.disabled", display: "block", mt: 0.25 }}>
                        {new Date(ev.ts).toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}
