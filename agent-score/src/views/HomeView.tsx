import { useState, Fragment } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import LinearProgress from "@mui/material/LinearProgress";
import SvgIcon from "@mui/material/SvgIcon";
import type { View, VerdictBandKey } from "../types";
import { PROJECTS, projectPassRate, projectDimensionAverages, sessionsCompositeScore } from "../data/mock";
import { agentVerdict, criticalSafety, projectVerdictBands, bandForScore, scoreToken, VERDICT_BAND_META, RUN_STATE_META } from "../data/verdict";
import GradeChip from "../components/GradeChip";
import TypeTag from "../components/TypeTag";
import ScoreBar from "../components/ScoreBar";
import VerdictChip from "../components/VerdictChip";

interface Props {
  navigate: (v: View) => void;
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

  const projectVerdicts = PROJECTS.map((p) => ({ project: p, verdict: agentVerdict(p) }));
  const verdictCounts = { Ship: 0, Review: 0, Block: 0 };
  for (const { verdict } of projectVerdicts) {
    if (verdict.band === "ship") verdictCounts.Ship++;
    else if (verdict.band === "review") verdictCounts.Review++;
    else if (verdict.band === "block") verdictCounts.Block++;
  }
  const needsReview = projectVerdicts.filter(({ verdict }) => verdict.band === "review" || verdict.band === "block" || verdict.state === "error");
  const blockCount = projectVerdicts.filter(({ verdict }) => verdict.band === "block").length;

  const attentionAgents = needsReview
    .slice()
    .sort((a, b) => (a.verdict.score ?? -1) - (b.verdict.score ?? -1));

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
              {attentionAgents.map(({ project, verdict }, idx) => {
                const latestRun = project.runs[0];
                const latestSession = latestRun?.sessions[0];
                const totalSessions = project.runs.flatMap((r) => r.sessions).length;
                const passRate = projectPassRate(project);
                const isExpanded = expandedId === project.id;
                const critical = criticalSafety(project);
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
                          {critical && (
                            <SvgIcon sx={{ fontSize: "0.85rem", color: "error.main", flexShrink: 0 }}>
                              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-1 6h2v2h-2V7zm0 4h2v4h-2v-4z" />
                            </SvgIcon>
                          )}
                        </Box>
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>{project.name}</Typography>
                      </Box>
                      <Box><TypeTag type={project.type} /></Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                        {verdict.grade ? (
                          <>
                            <GradeChip grade={verdict.grade} size="small" />
                            <Typography variant="body2" sx={{ fontWeight: 700, color: scoreToken(verdict.score ?? 0) }}>{verdict.score}</Typography>
                          </>
                        ) : (
                          <Typography variant="body2" sx={{ color: "text.disabled" }}>-</Typography>
                        )}
                      </Box>
                      {verdict.band ? (
                        <VerdictChip band={verdict.band} />
                      ) : (
                        <Chip
                          label={RUN_STATE_META[verdict.state].label}
                          size="small"
                          color={RUN_STATE_META[verdict.state].muiColor}
                          variant="outlined"
                          sx={{ height: 20, fontSize: "0.62rem", fontWeight: 700 }}
                        />
                      )}
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
                          {critical && (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5, px: 1.25, py: 0.75, borderRadius: 1, border: "1px solid", borderColor: "error.light", bgcolor: "rgba(var(--mui-palette-error-mainChannel) / 0.06)" }}>
                              <SvgIcon sx={{ fontSize: "0.95rem", color: "error.main", flexShrink: 0 }}>
                                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-1 6h2v2h-2V7zm0 4h2v4h-2v-4z" />
                              </SvgIcon>
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="caption" sx={{ fontWeight: 700, color: "error.dark", display: "block" }}>
                                  Safety issue · {critical.signal.replace(/_/g, " ")}
                                </Typography>
                                <Typography variant="caption" sx={{ color: "text.secondary", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {critical.detail}
                                </Typography>
                              </Box>
                            </Box>
                          )}
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5, flexWrap: "wrap" }}>
                            {verdict.grade ? (
                              <>
                                <GradeChip grade={verdict.grade} size="small" />
                                <Typography variant="caption" sx={{ fontWeight: 700, fontFamily: "monospace" }}>{verdict.score}/100</Typography>
                              </>
                            ) : (
                              <Chip
                                label={RUN_STATE_META[verdict.state].label}
                                size="small"
                                color={RUN_STATE_META[verdict.state].muiColor}
                                variant="outlined"
                                sx={{ height: 20, fontSize: "0.65rem", fontWeight: 700 }}
                              />
                            )}
                            <Typography variant="caption" sx={{ color: "text.secondary", ml: "auto" }}>
                              {passRate}% pass · {totalSessions} sessions
                            </Typography>
                          </Box>
                          <Typography variant="caption" sx={{ color: verdict.band ? VERDICT_BAND_META[verdict.band].token : "text.secondary", fontWeight: 600, display: "block", mb: 1.5 }}>
                            {verdict.reason}
                          </Typography>
                          {latestSession && (() => {
                            const dims = projectDimensionAverages(project);
                            return (
                              <Box>
                                <ScoreBar label="Correctness" dimension={dims.correctness} compact />
                                <ScoreBar label="Efficiency" dimension={dims.efficiency} compact />
                                <ScoreBar label="Relevance" dimension={dims.relevance} compact />
                                <ScoreBar label="Safety" dimension={dims.safety} compact />
                                <ScoreBar label="Consistency" dimension={dims.consistency} compact />
                                <ScoreBar label="Tool Use" dimension={dims.toolUse} compact />
                              </Box>
                            );
                          })()}
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

          {(["ship", "review", "block"] as const).map((band) => {
            const meta = VERDICT_BAND_META[band];
            const count = verdictCounts[meta.label as "Ship" | "Review" | "Block"];
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <Box key={band} sx={{ mb: 1.5 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: meta.token }}>{meta.label}</Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>{count} ({pct}%)</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={pct}
                  color={meta.muiColor}
                  sx={{ height: 8, borderRadius: 4, bgcolor: `rgba(var(--mui-palette-${meta.muiColor}-mainChannel) / 0.12)` }}
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
            {(["ship", "review", "block"] as const).map((band) => {
              const meta = VERDICT_BAND_META[band];
              return (
                <Box key={band} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: meta.hex }} />
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>{meta.label}</Typography>
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

        {recentRuns.map(({ project, id, label, date, sessions, status }, idx) => {
          const scored = status === "scored";
          const totalScore = scored ? sessionsCompositeScore(sessions) : null;
          let band: VerdictBandKey | null = null;
          if (scored && totalScore != null) {
            const bands = projectVerdictBands(project);
            const criticalSession = sessions.find((s) => s.safetyOverride?.severity === "Critical");
            const highSession = sessions.find((s) => s.safetyOverride?.severity === "High");
            band = criticalSession ? "block" : bandForScore(totalScore, bands);
            if (!criticalSession && highSession && band === "ship") band = "review";
          }
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
              {totalScore != null ? (
                <Typography variant="body2" sx={{ fontWeight: 700, color: scoreToken(totalScore) }}>
                  {totalScore}
                </Typography>
              ) : (
                <Typography variant="body2" sx={{ color: "text.disabled" }}>-</Typography>
              )}
              {band ? (
                <VerdictChip band={band} />
              ) : (
                <Chip
                  label={RUN_STATE_META[status].label}
                  size="small"
                  color={RUN_STATE_META[status].muiColor}
                  variant="outlined"
                  sx={{ height: 20, fontSize: "0.62rem", fontWeight: 700 }}
                />
              )}
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
