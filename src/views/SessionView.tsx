import { useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Alert from "@mui/material/Alert";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import type { View, Session, Attribution } from "../types";
import { getProject, getRun, getSession } from "../data/mock";
import VerdictBadge from "../components/VerdictBadge";
import ScoreBar from "../components/ScoreBar";
import ScoreMeter from "../components/ScoreMeter";

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

function compositeScore(s: Session): number {
  const bp = s.scores.benchmarkPerformance.score;
  const ve = s.scores.valueEfficiency?.score ?? bp;
  const ux = s.scores.uxSignal.score;
  return Math.round((bp * 0.5 + ve * 0.25 + ux * 0.25));
}

export default function SessionView({ projectId, runId, sessionId, navigate }: Props) {
  const [reportTab, setReportTab] = useState(0);
  const project = getProject(projectId);
  const run = getRun(projectId, runId);
  const session = getSession(projectId, runId, sessionId);

  if (!session || !run || !project) {
    return <Box sx={{ p: 3 }}><Typography>Session not found.</Typography></Box>;
  }

  const ship = shipLabel(session.verdict);
  const composite = compositeScore(session);

  return (
    <Box sx={{ p: 3, maxWidth: 1100 }}>
      {/* Breadcrumb nav */}
      <Box sx={{ display: "flex", gap: 0.5, alignItems: "center", mb: 2 }}>
        <Button size="small" onClick={() => navigate({ name: "fleet" })} sx={{ color: "text.disabled" }}>Fleet</Button>
        <Typography sx={{ color: "text.disabled" }}>/</Typography>
        <Button size="small" onClick={() => navigate({ name: "project", projectId })} sx={{ color: "text.disabled" }}>
          {project.name}
        </Button>
        <Typography sx={{ color: "text.disabled" }}>/</Typography>
        <Button size="small" onClick={() => navigate({ name: "run", projectId, runId })} sx={{ color: "text.secondary" }}>
          {run.label}
        </Button>
      </Box>

      {/* Safety override alert */}
      {session.safetyOverride && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          icon={false}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.25 }}>
            <Chip
              label={`Safety Override — ${session.safetyOverride.severity}`}
              color="error"
              size="small"
              sx={{ fontWeight: 700, fontSize: "0.68rem" }}
            />
            <Typography variant="caption" sx={{ fontFamily: "monospace", color: "error.main", fontWeight: 600 }}>
              {session.safetyOverride.signal}
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            {session.safetyOverride.detail}
          </Typography>
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
              {/* Meter */}
              <ScoreMeter score={composite} size={112} />

              {/* Verdict + meta */}
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
                  <VerdictBadge verdict={session.verdict} size="medium" />
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 700, color: ship.color }}
                  >
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
            <ScoreBar label="Benchmark Performance" dimension={session.scores.benchmarkPerformance} />
            <ScoreBar label="Value Efficiency" dimension={session.scores.valueEfficiency} />
            <ScoreBar label="UX Signal" dimension={session.scores.uxSignal} />
          </Paper>

          {/* Attribution */}
          {session.attr && <AttributionPanel attr={session.attr} />}
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
          <Box sx={{ p: 2, maxHeight: 520, overflow: "auto" }}>
            {reportTab === 0 ? (
              <Typography
                component="pre"
                sx={{
                  fontFamily: "monospace",
                  fontSize: "0.72rem",
                  color: "text.secondary",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  m: 0,
                }}
              >
                {generateMarkdownReport(project.name, run.label, session, composite)}
              </Typography>
            ) : (
              <Typography
                component="pre"
                sx={{
                  fontFamily: "monospace",
                  fontSize: "0.72rem",
                  color: "text.secondary",
                  whiteSpace: "pre-wrap",
                  m: 0,
                }}
              >
                {JSON.stringify(sessionToJson(session, composite), null, 2)}
              </Typography>
            )}
          </Box>
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
        <Chip
          label={attr.rootCause.replace(/_/g, " ")}
          color="error"
          size="small"
          variant="outlined"
          sx={{ fontWeight: 600, fontSize: "0.68rem", fontFamily: "monospace" }}
        />
        <Typography variant="caption" sx={{ color: "text.secondary", ml: "auto" }}>
          {Math.round(attr.confidence * 100)}% confidence · {attr.agentFault ? "agent fault" : "external factor"}
        </Typography>
      </Box>

      {/* Chain */}
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
                <Chip label="culprit" color="error" size="small" sx={{ ml: 1, height: 16, fontSize: "0.6rem", fontWeight: 700 }} />
              )}
              <Typography variant="caption" sx={{ display: "block", color: "text.secondary", mt: 0.25 }}>
                {step.desc}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>

      <Divider sx={{ mb: 1.5 }} />

      {/* Recommendations */}
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

function generateMarkdownReport(projectName: string, runLabel: string, s: Session, composite: number): string {
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
    `Composite score: **${composite}/100**`,
    ``,
    `| Dimension | Score |`,
    `|---|---|`,
    `| Benchmark Performance | ${s.scores.benchmarkPerformance.score} |`,
    `| Value Efficiency | ${s.scores.valueEfficiency?.score ?? "N/A"} |`,
    `| UX Signal | ${s.scores.uxSignal.score} |`,
    ``,
  ];

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

function sessionToJson(s: Session, composite: number) {
  return {
    sessionId: s.id,
    ts: s.ts,
    dur: s.dur,
    scenario: s.scenario,
    verdict: s.verdict,
    compositeScore: composite,
    baseline: s.baseline,
    safetyOverride: s.safetyOverride ?? null,
    scores: {
      benchmarkPerformance: s.scores.benchmarkPerformance,
      valueEfficiency: s.scores.valueEfficiency,
      uxSignal: s.scores.uxSignal,
    },
    attribution: s.attr ?? null,
  };
}
