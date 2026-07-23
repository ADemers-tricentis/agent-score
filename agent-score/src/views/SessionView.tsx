import { useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tag from "@tricentis/aura/components/Tag.js";
import ChipSubtle from "@tricentis/aura/components/ChipSubtle.js";
import Alert from "@mui/material/Alert";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import AuraTabPanel from "@tricentis/aura/components/TabPanel.js";
import type { View, Session, Attribution, ShipDecision } from "../types";
import { getProject, getRun, getSession, sessionCompositeScore, sessionGrade } from "../data/mock";
import VerdictBadge from "../components/VerdictBadge";
import ScoreBar from "../components/ScoreBar";
import ScoreMeter from "../components/ScoreMeter";
import GradeChip from "../components/GradeChip";

interface Props {
  projectId: string;
  runId: string;
  sessionId: string;
  navigate: (v: View) => void;
}

function fmtDur(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

function shipLabel(verdict: string) {
  if (verdict === "PASS") return { text: "Ship", color: "success.main" };
  if (verdict === "PARTIAL") return { text: "Review", color: "warning.main" };
  return { text: "Don't Ship", color: "error.main" };
}

export default function SessionView({ projectId, runId, sessionId, navigate }: Props) {
  const [reportTab, setReportTab] = useState(0);
  const [decisionOpen, setDecisionOpen] = useState(false);
  const [decisionChoice, setDecisionChoice] = useState<"Ship" | "Hold" | "Reject">("Ship");
  const [decisionRationale, setDecisionRationale] = useState("");
  const [recordedDecision, setRecordedDecision] = useState<ShipDecision | null>(null);

  const project = getProject(projectId);
  const run = getRun(projectId, runId);
  const session = getSession(projectId, runId, sessionId);

  if (!session || !run || !project) {
    return <Box sx={{ p: 3 }}><Typography>Session not found.</Typography></Box>;
  }

  const ship = shipLabel(session.verdict);
  const composite = sessionCompositeScore(session);
  const grade = sessionGrade(composite);
  const existingDecision = recordedDecision ?? session.shipDecision;

  function handleRecordDecision() {
    if (!decisionRationale.trim()) return;
    setRecordedDecision({
      decision: decisionChoice,
      rationale: decisionRationale,
      author: "a.demers@tricentis.com",
      ts: new Date().toISOString(),
      overridesVerdict: decisionChoice === "Ship" && session!.verdict !== "PASS" ||
                        decisionChoice === "Reject" && session!.verdict === "PASS",
    });
    setDecisionOpen(false);
    setDecisionRationale("");
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1100 }}>
      {/* Breadcrumb */}
      <Box sx={{ display: "flex", gap: 0.5, alignItems: "center", mb: 2 }}>
        <Button size="small" onClick={() => navigate({ name: "agents" })} sx={{ color: "text.disabled" }}>Agents</Button>
        <Typography sx={{ color: "text.disabled" }}>/</Typography>
        <Button size="small" onClick={() => navigate({ name: "project", projectId })} sx={{ color: "text.disabled" }}>
          {project.name}
        </Button>
        <Typography sx={{ color: "text.disabled" }}>/</Typography>
        <Button size="small" onClick={() => navigate({ name: "run", projectId, runId })} sx={{ color: "text.secondary" }}>
          {run.label}
        </Button>
      </Box>

      {/* ATC beta notice */}
      {session.atcBeta && (
        <Alert severity="info" sx={{ mb: 2, fontSize: "0.8rem" }}>
          <strong>ATC Beta:</strong> Verdict and dimension scores are informational signals only in Phase 2 — not CI gates. Use them to calibrate and improve the agent.
        </Alert>
      )}

      {/* Worst-dimension gate notice (Q2) */}
      {(() => {
        if (session.verdict === "PASS") return null;
        const dimScores = [
          { label: "Correctness", score: session.scores.benchmarkPerformance.score },
          { label: "Efficiency", score: session.scores.valueEfficiency?.score ?? null },
          { label: "Relevance", score: session.scores.uxSignal.score },
          { label: "Safety", score: session.scores.harmony?.score ?? null },
          { label: "Consistency", score: session.scores.stability?.score ?? null },
          { label: "Tool Use", score: session.scores.agency?.score ?? null },
        ].filter((d): d is { label: string; score: number } => d.score !== null && d.score < 55);
        if (dimScores.length === 0) return null;
        return (
          <Alert severity="warning" sx={{ mb: 2, fontSize: "0.8rem" }}>
            <strong>Verdict capped by worst-dimension gate:</strong>{" "}
            {dimScores.map((d) => `${d.label} (${d.score})`).join(", ")}{" "}
            {dimScores.length === 1 ? "scores" : "score"} below threshold - composite verdict cannot exceed Review regardless of overall score.
          </Alert>
        );
      })()}

      {/* Safety override alert */}
      {session.safetyOverride && (
        <Alert severity="error" sx={{ mb: 2 }} icon={false}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.25 }}>
            <Tag
              label={`Safety Override — ${session.safetyOverride.severity}`}
              sx={{ bgcolor: "error.main", fontWeight: 700, fontSize: "0.68rem", "& .MuiChip-label": { color: "white" } }}
            />
            <Typography variant="caption" sx={{ fontFamily: "monospace", color: "error.main", fontWeight: 600 }}>
              {session.safetyOverride.signal}
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ mt: 0.5 }}>{session.safetyOverride.detail}</Typography>
          <Typography variant="caption" sx={{ color: "error.light", mt: 0.25, display: "block" }}>
            {session.safetyOverride.severity === "Critical"
              ? "Verdict forced to FAIL regardless of dimension scores."
              : "Verdict forced to PARTIAL (FAIL preserved if already FAIL)."}
          </Typography>
        </Alert>
      )}

      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 2, alignItems: "start" }}>
        {/* Left column */}
        <Box>
          {/* Score card */}
          <Paper sx={{ p: 2.5, mb: 2, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 3 }}>
              <Box sx={{ position: "relative" }}>
                <ScoreMeter score={composite} size={112} />
                <Box sx={{ position: "absolute", bottom: -6, right: -6 }}>
                  <GradeChip grade={grade} size="medium" />
                </Box>
              </Box>

              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
                  <VerdictBadge verdict={session.verdict} size="medium" />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: ship.color }}>
                    {ship.text}
                  </Typography>
                  {session.baseline != null && (
                    <Typography variant="caption" sx={{ color: "text.disabled", ml: "auto" }}>
                      vs baseline {session.baseline}
                      {composite > session.baseline ? (
                        <Typography component="span" variant="caption" sx={{ color: "success.main", fontWeight: 600 }}>
                          {" "}(+{composite - session.baseline})
                        </Typography>
                      ) : composite < session.baseline ? (
                        <Typography component="span" variant="caption" sx={{ color: "error.main", fontWeight: 600 }}>
                          {" "}({composite - session.baseline})
                        </Typography>
                      ) : null}
                    </Typography>
                  )}
                </Box>

                <Typography variant="subtitle2" sx={{ mb: 0.25, fontWeight: 600 }}>
                  {session.scenario}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  {new Date(session.ts).toLocaleString()} · {fmtDur(session.dur)} · {session.id}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Dimension scores */}
            <ScoreBar label="Correctness" dimension={session.scores.benchmarkPerformance} />
            <ScoreBar label="Efficiency" dimension={session.scores.valueEfficiency} />
            <ScoreBar label="Relevance" dimension={session.scores.uxSignal} />
            {session.scores.harmony && (
              <ScoreBar label="Safety" dimension={session.scores.harmony} />
            )}
            {session.scores.stability && (
              <ScoreBar label="Consistency" dimension={session.scores.stability} />
            )}
            {session.scores.agency && (
              <ScoreBar label="Tool Use" dimension={session.scores.agency} />
            )}
            {session.scores.groundedness && (
              <ScoreBar label="Groundedness" dimension={session.scores.groundedness} />
            )}
            {session.scores.instructionFollowing && (
              <ScoreBar label="Instruction Following" dimension={session.scores.instructionFollowing} />
            )}
            {session.scores.transparency && (
              <ScoreBar label="Transparency" dimension={session.scores.transparency} />
            )}
            {session.scores.robustness && (
              <ScoreBar label="Robustness" dimension={session.scores.robustness} />
            )}
            {session.scores.communication && (
              <ScoreBar label="Communication" dimension={session.scores.communication} />
            )}
          </Paper>

          {/* Attribution */}
          {session.attr && <AttributionPanel attr={session.attr} />}

          {/* Decision log */}
          <Paper sx={{ p: 2.5, mt: 2, border: "1px solid", borderColor: existingDecision ? "primary.dark" : "divider", borderRadius: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: existingDecision || decisionOpen ? 2 : 0 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Shipping Decision
              </Typography>
              {!existingDecision && !decisionOpen && (
                <Button size="small" variant="outlined" onClick={() => setDecisionOpen(true)}>
                  Record decision
                </Button>
              )}
              {existingDecision && !decisionOpen && (
                <Button size="small" variant="text" sx={{ color: "text.secondary", fontSize: "0.7rem" }} onClick={() => { setDecisionOpen(true); setDecisionChoice(existingDecision.decision); setDecisionRationale(existingDecision.rationale); }}>
                  Edit
                </Button>
              )}
            </Box>

            {existingDecision && !decisionOpen && (
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
                  <Tag
                    label={existingDecision.decision}
                    sx={{
                      bgcolor: existingDecision.decision === "Ship" ? "success.dark" : existingDecision.decision === "Hold" ? "warning.dark" : "error.dark",
                      fontWeight: 700,
                      "& .MuiChip-label": { color: "white" },
                    }}
                  />
                  {existingDecision.overridesVerdict && (
                    <ChipSubtle label="overrides verdict" color="warning" sx={{ fontSize: "0.65rem" }} />
                  )}
                  <Typography variant="caption" sx={{ color: "text.disabled", ml: "auto" }}>
                    {new Date(existingDecision.ts).toLocaleString()} · {existingDecision.author}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: "text.secondary", fontStyle: "italic" }}>
                  "{existingDecision.rationale}"
                </Typography>
              </Box>
            )}

            {!existingDecision && !decisionOpen && (
              <Typography variant="body2" sx={{ color: "text.disabled" }}>
                No decision recorded. Record a shipping decision to document rationale for the team.
              </Typography>
            )}

            {decisionOpen && (
              <Box>
                <Typography variant="caption" sx={{ color: "text.disabled", display: "block", mb: 1, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Decision
                </Typography>
                <ToggleButtonGroup
                  value={decisionChoice}
                  exclusive
                  onChange={(_, v) => v && setDecisionChoice(v)}
                  size="small"
                  sx={{ mb: 2 }}
                >
                  <ToggleButton value="Ship" sx={{ fontSize: "0.75rem", px: 2, "&.Mui-selected": { bgcolor: "success.dark", color: "success.light" } }}>
                    Ship
                  </ToggleButton>
                  <ToggleButton value="Hold" sx={{ fontSize: "0.75rem", px: 2, "&.Mui-selected": { bgcolor: "warning.dark", color: "warning.light" } }}>
                    Hold
                  </ToggleButton>
                  <ToggleButton value="Reject" sx={{ fontSize: "0.75rem", px: 2, "&.Mui-selected": { bgcolor: "error.dark", color: "error.light" } }}>
                    Reject
                  </ToggleButton>
                </ToggleButtonGroup>

                <TextField
                  multiline
                  rows={3}
                  fullWidth
                  size="small"
                  placeholder="Rationale — why this decision was made, what the team considered, any caveats..."
                  value={decisionRationale}
                  onChange={(e) => setDecisionRationale(e.target.value)}
                  sx={{ mb: 1.5 }}
                />

                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button size="small" variant="contained" onClick={handleRecordDecision} disabled={!decisionRationale.trim()}>
                    Save decision
                  </Button>
                  <Button size="small" variant="outlined" color="inherit" sx={{ color: "text.secondary" }} onClick={() => { setDecisionOpen(false); setDecisionRationale(""); }}>
                    Cancel
                  </Button>
                </Box>
              </Box>
            )}
          </Paper>
        </Box>

        {/* Right column — report */}
        <Paper sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
          <Tabs
            value={reportTab}
            onChange={(_, v: number) => setReportTab(v)}
            sx={{ borderBottom: "1px solid", borderColor: "divider", minHeight: 40 }}
          >
            <Tab label="Markdown" sx={{ minHeight: 40, fontSize: "0.75rem" }} />
            <Tab label="JSON" sx={{ minHeight: 40, fontSize: "0.75rem" }} />
          </Tabs>
          <AuraTabPanel value={reportTab} index={0} sx={{ p: 2, maxHeight: 520, overflow: "auto" }}>
            <Typography
              component="pre"
              sx={{ fontFamily: "monospace", fontSize: "0.72rem", color: "text.secondary", whiteSpace: "pre-wrap", wordBreak: "break-word", m: 0 }}
            >
              {generateMarkdownReport(project.name, run.label, session, composite, grade)}
            </Typography>
          </AuraTabPanel>
          <AuraTabPanel value={reportTab} index={1} sx={{ p: 2, maxHeight: 520, overflow: "auto" }}>
            <Typography
              component="pre"
              sx={{ fontFamily: "monospace", fontSize: "0.72rem", color: "text.secondary", whiteSpace: "pre-wrap", m: 0 }}
            >
              {JSON.stringify(sessionToJson(session, composite, grade), null, 2)}
            </Typography>
          </AuraTabPanel>
          <Divider />
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="caption" sx={{ color: "text.disabled", fontFamily: "monospace" }}>
              ~/.evalclaw/projects/{project.service}/sessions/{session.id}/
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}

function AttributionPanel({ attr }: { attr: Attribution }) {
  return (
    <Paper sx={{ p: 2.5, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          Attribution
        </Typography>
        <ChipSubtle
          label={attr.rootCause.replace(/_/g, " ")}
          color="error"
          sx={{ fontWeight: 600, fontSize: "0.68rem", fontFamily: "monospace" }}
        />
        <Typography variant="caption" sx={{ color: "text.secondary", ml: "auto" }}>
          {Math.round(attr.confidence * 100)}% confidence · {attr.agentFault ? "agent fault" : "external factor"}
        </Typography>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", display: "block", mb: 1 }}>
          Evidence Chain
        </Typography>
        {attr.chain.map((step) => (
          <Box
            key={step.n}
            sx={{
              display: "flex",
              gap: 1.5,
              mb: 0.75,
              p: 1,
              borderRadius: 1,
              bgcolor: step.culprit ? "error.dark" + "22" : "transparent",
              border: step.culprit ? "1px solid" : "1px solid transparent",
              borderColor: step.culprit ? "error.dark" : "transparent",
            }}
          >
            <Typography
              variant="caption"
              sx={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                bgcolor: step.culprit ? "error.main" : "action.selected",
                color: step.culprit ? "error.contrastText" : "text.secondary",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                fontWeight: 700,
                fontSize: "0.65rem",
              }}
            >
              {step.n}
            </Typography>
            <Box>
              <Typography variant="caption" sx={{ fontFamily: "monospace", color: step.culprit ? "error.light" : "primary.light", fontWeight: 600 }}>
                {step.tool}
              </Typography>
              {step.culprit && (
                <Tag label="culprit" sx={{ ml: 1, height: 16, bgcolor: "error.main", fontSize: "0.6rem", fontWeight: 700, "& .MuiChip-label": { color: "white", px: 0.75 } }} />
              )}
              <Typography variant="caption" sx={{ display: "block", color: "text.secondary", mt: 0.25 }}>
                {step.desc}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>

      <Divider sx={{ mb: 1.5 }} />

      <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", display: "block", mb: 1 }}>
        Recommendations
      </Typography>
      {attr.recs.map((rec, i) => (
        <Box key={i} sx={{ display: "flex", gap: 1, mb: 0.75 }}>
          <Typography variant="caption" sx={{ color: "primary.main", fontWeight: 700, flexShrink: 0 }}>
            {i + 1}.
          </Typography>
          <Typography variant="body2" sx={{ color: "text.primary" }}>
            {rec}
          </Typography>
        </Box>
      ))}
    </Paper>
  );
}

function generateMarkdownReport(projectName: string, runLabel: string, s: Session, composite: number, grade: string): string {
  const lines = [
    `# Session Report`,
    ``,
    `**Project:** ${projectName}  `,
    `**Run:** ${runLabel}  `,
    `**Session ID:** ${s.id}  `,
    `**Scenario:** ${s.scenario}  `,
    `**Timestamp:** ${s.ts}  `,
    `**Duration:** ${Math.round(s.dur / 1000)}s  `,
    ``,
    `## Verdict: ${s.verdict}`,
    ``,
    `Composite score: **${composite}/100 · Grade ${grade}**`,
    ``,
    `| Dimension | Score |`,
    `|---|---|`,
    `| Correctness | ${s.scores.benchmarkPerformance.score} |`,
    `| Efficiency | ${s.scores.valueEfficiency?.score ?? "N/A"} |`,
    `| Relevance | ${s.scores.uxSignal.score} |`,
  ];

  if (s.scores.harmony) lines.push(`| Safety | ${s.scores.harmony.score} |`);
  if (s.scores.stability) lines.push(`| Consistency | ${s.scores.stability.score} |`);
  if (s.scores.agency) lines.push(`| Tool Use | ${s.scores.agency.score} |`);

  lines.push(``);

  if (s.safetyOverride) {
    lines.push(`## ⚠️ Safety Override`);
    lines.push(`**Signal:** \`${s.safetyOverride.signal}\`  `);
    lines.push(`**Severity:** ${s.safetyOverride.severity}  `);
    lines.push(s.safetyOverride.detail);
    lines.push(``);
  }

  if (s.attr) {
    lines.push(`## Attribution`);
    lines.push(`**Root Cause:** \`${s.attr.rootCause}\`  `);
    lines.push(`**Confidence:** ${Math.round(s.attr.confidence * 100)}%  `);
    lines.push(``);
    lines.push(`### Evidence Chain`);
    s.attr.chain.forEach((step) => {
      lines.push(`${step.n}. \`${step.tool}\`${step.culprit ? " ← **culprit**" : ""}: ${step.desc}`);
    });
    lines.push(``);
    lines.push(`### Recommendations`);
    s.attr.recs.forEach((rec, i) => {
      lines.push(`${i + 1}. ${rec}`);
    });
  }

  return lines.join("\n");
}

function sessionToJson(s: Session, composite: number, grade: string) {
  return {
    sessionId: s.id,
    ts: s.ts,
    dur: s.dur,
    scenario: s.scenario,
    verdict: s.verdict,
    compositeScore: composite,
    grade,
    baseline: s.baseline,
    safetyOverride: s.safetyOverride ?? null,
    scores: {
      benchmarkPerformance: s.scores.benchmarkPerformance,
      valueEfficiency: s.scores.valueEfficiency,
      uxSignal: s.scores.uxSignal,
      harmony: s.scores.harmony ?? null,
      stability: s.scores.stability ?? null,
      agency: s.scores.agency ?? null,
    },
    attribution: s.attr ?? null,
    shipDecision: s.shipDecision ?? null,
  };
}
