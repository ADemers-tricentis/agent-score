import { useState, Fragment } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import LinearProgress from "@mui/material/LinearProgress";
import SvgIcon from "@mui/material/SvgIcon";
import type { View } from "../types";
import { PROJECTS, projectCompositeScore, sessionGrade, projectPassRate } from "../data/mock";
import GradeChip from "../components/GradeChip";
import TypeTag from "../components/TypeTag";
import ScoreBar from "../components/ScoreBar";
import VerdictBadge from "../components/VerdictBadge";

interface Props {
  navigate: (v: View) => void;
}

function compositeVerdict(score: number): "Ship" | "Review" | "Block" {
  if (score >= 85) return "Ship";
  if (score >= 55) return "Review";
  return "Block";
}

function verdictColor(verdict: "Ship" | "Review" | "Block"): "success" | "warning" | "error" {
  if (verdict === "Ship") return "success";
  if (verdict === "Review") return "warning";
  return "error";
}

function scoreColor(score: number): string {
  if (score >= 80) return "success.main";
  if (score >= 60) return "warning.main";
  return "error.main";
}

function reliabilityConfig(r: string) {
  if (r === "RELIABLE") return { label: "Reliable", color: "success" as const };
  if (r === "NEEDS_WORK") return { label: "Needs Work", color: "warning" as const };
  return { label: "Unstable", color: "error" as const };
}

const SPARKLINE_POINTS = [18, 28, 22, 35, 30, 42, 48];

function Sparkline() {
  const max = Math.max(...SPARKLINE_POINTS);
  const min = Math.min(...SPARKLINE_POINTS);
  const range = max - min || 1;
  const W = 80;
  const H = 24;
  const pts = SPARKLINE_POINTS.map((v, i) => {
    const x = (i / (SPARKLINE_POINTS.length - 1)) * W;
    const y = H - ((v - min) / range) * H;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={W} height={H} style={{ display: "block" }}>
      <polyline points={pts} fill="none" stroke="#4ade80" strokeWidth={1.5} />
    </svg>
  );
}

const TREND_SHIP = [18, 20, 22, 24, 25, 27, 28];
const TREND_REVIEW = [8, 7, 8, 9, 8, 8, 8];
const TREND_BLOCK = [4, 3, 2, 3, 2, 3, 2];
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function TrendChart() {
  const W = 360;
  const H = 100;
  const allVals = [...TREND_SHIP, ...TREND_REVIEW, ...TREND_BLOCK];
  const max = Math.max(...allVals);
  const PAD_T = 8;
  const PAD_B = 8;
  const chartH = H - PAD_T - PAD_B;

  function makePath(data: number[], color: string) {
    const d = data
      .map((v, i) => {
        const x = (i / (data.length - 1)) * W;
        const y = PAD_T + chartH - (v / max) * chartH;
        return `${i === 0 ? "M" : "L"}${x},${y}`;
      })
      .join(" ");
    return <path key={color} d={d} fill="none" stroke={color} strokeWidth={1.5} />;
  }

  return (
    <Box>
      <svg width={W} height={H} style={{ display: "block", width: "100%", maxWidth: W }}>
        {makePath(TREND_SHIP, "#4ade80")}
        {makePath(TREND_REVIEW, "#fbbf24")}
        {makePath(TREND_BLOCK, "#f87171")}
      </svg>
      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.5 }}>
        {DAY_LABELS.map((d) => (
          <Typography key={d} variant="caption" sx={{ color: "text.disabled", fontSize: "0.6rem" }}>
            {d}
          </Typography>
        ))}
      </Box>
    </Box>
  );
}

export default function HomeView({ navigate }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const phase1 = PROJECTS.filter((p) => p.phase === 1).length;
  const phase2 = PROJECTS.filter((p) => p.phase === 2).length;

  const totalTraces = PROJECTS.reduce(
    (sum, p) => sum + p.runs.reduce((rs, r) => rs + r.sessions.length, 0),
    0
  );

  const allRuns = PROJECTS.flatMap((p) => p.runs.map((r) => ({ ...r, project: p })));
  const totalRuns = allRuns.length;

  const projectScores = PROJECTS.map((p) => ({ project: p, score: projectCompositeScore(p) }));
  const verdictCounts = { Ship: 0, Review: 0, Block: 0 };
  for (const { score } of projectScores) {
    verdictCounts[compositeVerdict(score)]++;
  }
  const needsReview = projectScores.filter(({ score }) => score < 80);
  const blockCount = projectScores.filter(({ score }) => score < 60).length;

  const attentionAgents = needsReview
    .slice()
    .sort((a, b) => a.score - b.score);

  const recentRuns = allRuns
    .slice()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  const total = PROJECTS.length;

  const kpiCards = [
    {
      label: "ACTIVE AGENTS",
      main: <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1 }}>{PROJECTS.length}</Typography>,
      sub: (
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          {phase1} Phase 1 · {phase2} Phase 2
        </Typography>
      ),
    },
    {
      label: "TRACES (7D)",
      main: (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1 }}>{totalTraces}</Typography>
          <Chip label="▲ 12%" size="small" sx={{ bgcolor: "rgba(74,222,128,0.15)", color: "success.main", fontWeight: 700, fontSize: "0.65rem" }} />
        </Box>
      ),
      sub: <Sparkline />,
    },
    {
      label: "SCORING RUNS (7D)",
      main: <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1 }}>{totalRuns}</Typography>,
      sub: (
        <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", mt: 0.25 }}>
          <Chip label={`${verdictCounts.Ship} Ship`} size="small" color="success" sx={{ height: 18, fontSize: "0.62rem" }} />
          <Chip label={`${verdictCounts.Review} Review`} size="small" color="warning" sx={{ height: 18, fontSize: "0.62rem" }} />
          <Chip label={`${verdictCounts.Block} Block`} size="small" color="error" sx={{ height: 18, fontSize: "0.62rem" }} />
        </Box>
      ),
    },
    {
      label: "NEEDS REVIEW",
      main: <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1 }}>{needsReview.length}</Typography>,
      sub: blockCount > 0 ? (
        <Chip label={`${blockCount} blocked`} size="small" color="error" sx={{ height: 18, fontSize: "0.62rem" }} />
      ) : (
        <Typography variant="caption" sx={{ color: "text.secondary" }}>All agents passing</Typography>
      ),
    },
  ];

  return (
    <Box sx={{ p: 3, maxWidth: 1200 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5, flexWrap: "wrap" }}>
        <Typography variant="h5" fontWeight={700}>Home</Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Activity across all agents · last 7 days
      </Typography>

      {/* KPI cards */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2, mb: 3 }}>
        {kpiCards.map((card) => (
          <Paper key={card.label} sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
            <Typography variant="overline" sx={{ color: "text.disabled", fontSize: "0.62rem", letterSpacing: 1, display: "block", mb: 0.75 }}>
              {card.label}
            </Typography>
            {card.main}
            <Box sx={{ mt: 0.75 }}>{card.sub}</Box>
          </Paper>
        ))}
      </Box>

      {/* Middle row */}
      <Box sx={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 2, mb: 3 }}>
        {/* Left - Agents needing attention */}
        <Paper sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
          <Box sx={{ px: 2, pt: 2, pb: 1.5, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Agents needing attention</Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>Latest run is Review or Block</Typography>
            </Box>
            <Button size="small" onClick={() => navigate({ name: "agents" })} sx={{ color: "text.secondary", flexShrink: 0 }}>
              View all →
            </Button>
          </Box>

          {attentionAgents.length === 0 ? (
            <Box sx={{ px: 2, pb: 2.5, pt: 1 }}>
              <Typography variant="body2" sx={{ color: "text.disabled" }}>All agents are shipping</Typography>
            </Box>
          ) : (
            <Box>
              {/* Table header */}
              <Box sx={{ display: "grid", gridTemplateColumns: "2fr 80px 90px 90px 80px", px: 2, pb: 0.5, gap: 1 }}>
                {["Agent", "Type", "Score", "Verdict", "Last run"].map((h) => (
                  <Typography key={h} variant="caption" sx={{ color: "text.disabled", fontWeight: 700, fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: 0.5 }}>
                    {h}
                  </Typography>
                ))}
              </Box>
              <Divider />
              {attentionAgents.map(({ project, score }, idx) => {
                const grade = sessionGrade(score);
                const verdict = compositeVerdict(score);
                const latestRun = project.runs[0];
                const latestSession = latestRun?.sessions[0];
                const totalSessions = project.runs.flatMap((r) => r.sessions).length;
                const passRate = projectPassRate(project);
                const rel = reliabilityConfig(project.reliability);
                const isExpanded = expandedId === project.id;
                const criticalSafety = project.runs.flatMap((r) => r.sessions).find((s) => s.safetyOverride?.severity === "Critical");
                return (
                  <Fragment key={project.id}>
                    <Box
                      onClick={() => setExpandedId(isExpanded ? null : project.id)}
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "2fr 80px 90px 90px 80px",
                        px: 2,
                        py: 1.25,
                        gap: 1,
                        alignItems: "center",
                        cursor: "pointer",
                        borderTop: idx > 0 ? "1px solid" : "none",
                        borderColor: "divider",
                        "&:hover": { bgcolor: "action.hover" },
                        bgcolor: isExpanded ? "action.selected" : undefined,
                      }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {project.service}
                          </Typography>
                          {criticalSafety && (
                            <SvgIcon sx={{ fontSize: "0.85rem", color: "error.main", flexShrink: 0 }}>
                              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-1 6h2v2h-2V7zm0 4h2v4h-2v-4z" />
                            </SvgIcon>
                          )}
                        </Box>
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>{project.name}</Typography>
                      </Box>
                      <Box><TypeTag type={project.type} /></Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                        <GradeChip grade={grade} size="small" />
                        <Typography variant="body2" sx={{ fontWeight: 700, color: scoreColor(score) }}>{score}</Typography>
                      </Box>
                      <Chip
                        label={verdict}
                        size="small"
                        color={verdictColor(verdict)}
                        sx={{ height: 20, fontSize: "0.68rem", fontWeight: 600 }}
                      />
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        {latestRun?.date ?? "-"}
                      </Typography>
                    </Box>
                    {isExpanded && (
                      <Box sx={{ px: 2, pt: 1, pb: 1.5, borderTop: "1px solid", borderColor: "divider", bgcolor: "action.hover" }}>
                        <Paper sx={{ p: 2, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
                          <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 1.5 }}>
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.25 }}>{project.name}</Typography>
                              <Typography variant="caption" sx={{ color: "text.disabled", fontFamily: "monospace" }}>{project.service}</Typography>
                            </Box>
                            <TypeTag type={project.type} />
                          </Box>
                          <Divider sx={{ mb: 1.5 }} />
                          {criticalSafety && (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5, px: 1.25, py: 0.75, borderRadius: 1, border: "1px solid", borderColor: "error.light", bgcolor: "rgba(var(--mui-palette-error-mainChannel) / 0.06)" }}>
                              <SvgIcon sx={{ fontSize: "0.95rem", color: "error.main", flexShrink: 0 }}>
                                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-1 6h2v2h-2V7zm0 4h2v4h-2v-4z" />
                              </SvgIcon>
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="caption" sx={{ fontWeight: 700, color: "error.dark", display: "block" }}>
                                  Safety issue · {criticalSafety.safetyOverride!.signal.replace(/_/g, " ")}
                                </Typography>
                                <Typography variant="caption" sx={{ color: "text.secondary", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {criticalSafety.safetyOverride!.detail}
                                </Typography>
                              </Box>
                            </Box>
                          )}
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5, flexWrap: "wrap" }}>
                            <GradeChip grade={grade} size="small" />
                            <Typography variant="caption" sx={{ fontWeight: 700, fontFamily: "monospace" }}>{score}/100</Typography>
                            {latestSession && <VerdictBadge verdict={latestSession.verdict} />}
                            <Chip label={rel.label} size="small" color={rel.color} variant="outlined" sx={{ height: 20, fontSize: "0.65rem" }} />
                            <Typography variant="caption" sx={{ color: "text.secondary", ml: "auto" }}>
                              {passRate}% pass · {totalSessions} sessions
                            </Typography>
                          </Box>
                          {latestSession && (
                            <Box>
                              <ScoreBar label="Correctness" dimension={latestSession.scores.benchmarkPerformance} compact />
                              <ScoreBar label="Efficiency" dimension={latestSession.scores.valueEfficiency} compact />
                              <ScoreBar label="Relevance" dimension={latestSession.scores.uxSignal} compact />
                              <ScoreBar label="Safety" dimension={latestSession.scores.harmony ?? null} compact />
                              <ScoreBar label="Consistency" dimension={latestSession.scores.stability ?? null} compact />
                              <ScoreBar label="Tool Use" dimension={latestSession.scores.agency ?? null} compact />
                            </Box>
                          )}
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 0.5 }}>
                            <Typography variant="caption" sx={{ color: "text.disabled" }}>
                              {project.runs.length} run{project.runs.length !== 1 ? "s" : ""} · latest {latestRun?.date}
                            </Typography>
                            <Button
                              size="small"
                              variant="text"
                              onClick={(e) => { e.stopPropagation(); navigate({ name: "project", projectId: project.id }); }}
                              sx={{ color: "primary.main", fontSize: "0.72rem", minWidth: 0 }}
                            >
                              Open agent →
                            </Button>
                          </Box>
                        </Paper>
                      </Box>
                    )}
                  </Fragment>
                );
              })}
            </Box>
          )}
        </Paper>

        {/* Right - Verdict distribution */}
        <Paper sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.25 }}>Verdict distribution</Typography>
          <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 2 }}>
            Last 7 days · across all agents
          </Typography>

          {(["Ship", "Review", "Block"] as const).map((v) => {
            const count = verdictCounts[v];
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            const color = verdictColor(v);
            return (
              <Box key={v} sx={{ mb: 1.5 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: `${color}.main` }}>{v}</Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>{count} ({pct}%)</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={pct}
                  color={color}
                  sx={{ height: 8, borderRadius: 4, bgcolor: `rgba(var(--mui-palette-${color}-mainChannel) / 0.12)` }}
                />
              </Box>
            );
          })}

          <Divider sx={{ my: 2 }} />

          <Typography variant="overline" sx={{ color: "text.disabled", fontSize: "0.62rem", letterSpacing: 1, display: "block", mb: 1.5 }}>
            TREND (7 DAYS)
          </Typography>
          <TrendChart />

          <Box sx={{ display: "flex", gap: 2, mt: 1.5 }}>
            {(["Ship", "Review", "Block"] as const).map((v) => {
              const colors = { Ship: "#4ade80", Review: "#fbbf24", Block: "#f87171" };
              return (
                <Box key={v} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: colors[v] }} />
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>{v}</Typography>
                </Box>
              );
            })}
          </Box>
        </Paper>
      </Box>

      {/* Bottom - Recent scoring runs */}
      <Paper sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
        <Box sx={{ px: 2, pt: 2, pb: 1.5, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Recent scoring runs</Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>Across all agents</Typography>
          </Box>
          <Button size="small" onClick={() => navigate({ name: "agents" })} sx={{ color: "text.secondary", flexShrink: 0 }}>
            View all →
          </Button>
        </Box>

        {/* Table header */}
        <Box sx={{ display: "grid", gridTemplateColumns: "130px 2fr 90px 90px 140px", px: 2, pb: 0.5, gap: 1 }}>
          {["Run", "Agent", "Score", "Verdict", "Date"].map((h) => (
            <Typography key={h} variant="caption" sx={{ color: "text.disabled", fontWeight: 700, fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: 0.5 }}>
              {h}
            </Typography>
          ))}
        </Box>
        <Divider />

        {recentRuns.map(({ project, id, label, date, sessions }, idx) => {
          const totalScore = sessions.length > 0
            ? Math.round(sessions.reduce((sum, s) => {
                const dims = [
                  s.scores.benchmarkPerformance.score * 35,
                  (s.scores.valueEfficiency?.score ?? s.scores.benchmarkPerformance.score) * 20,
                  s.scores.uxSignal.score * 15,
                  ...(s.scores.harmony ? [s.scores.harmony.score * 15] : []),
                  ...(s.scores.stability ? [s.scores.stability.score * 10] : []),
                  ...(s.scores.agency ? [s.scores.agency.score * 5] : []),
                ];
                const weightSum = 35 + 20 + 15 + (s.scores.harmony ? 15 : 0) + (s.scores.stability ? 10 : 0) + (s.scores.agency ? 5 : 0);
                return sum + dims.reduce((a, b) => a + b, 0) / weightSum;
              }, 0) / sessions.length)
            : 0;
          const verdict = compositeVerdict(totalScore);
          const shortId = id.length > 10 ? id.slice(0, 10) + "..." : id;
          return (
            <Box
              key={`${project.id}-${id}`}
              onClick={() => navigate({ name: "project", projectId: project.id })}
              sx={{
                display: "grid",
                gridTemplateColumns: "130px 2fr 90px 90px 140px",
                px: 2,
                py: 1.25,
                gap: 1,
                alignItems: "center",
                cursor: "pointer",
                borderTop: idx > 0 ? "1px solid" : "none",
                borderColor: "divider",
                "&:hover": { bgcolor: "action.hover" },
              }}
            >
              <Typography variant="caption" sx={{ fontFamily: "monospace", color: "text.secondary", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {shortId}
              </Typography>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {project.service}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>Phase {project.phase}</Typography>
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 700, color: scoreColor(totalScore) }}>
                {totalScore}
              </Typography>
              <Chip
                label={verdict}
                size="small"
                color={verdictColor(verdict)}
                sx={{ height: 20, fontSize: "0.68rem", fontWeight: 600 }}
              />
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" sx={{ color: "text.secondary", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {label}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.disabled" }}>{date}</Typography>
              </Box>
            </Box>
          );
        })}
      </Paper>
    </Box>
  );
}
