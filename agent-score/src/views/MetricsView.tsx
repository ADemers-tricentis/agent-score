import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Tag from "@tricentis/aura/components/Tag.js";
import { PROJECTS, GUARD_LOG } from "../data/mock";
import { ROOT_CAUSE_LABEL } from "../data/dimensions";
import type { RootCause } from "../types";

export default function MetricsView() {
  const allSessions = PROJECTS.flatMap((p) => p.runs.flatMap((r) => r.sessions));
  const passCount = allSessions.filter((s) => s.verdict === "PASS").length;
  const partialCount = allSessions.filter((s) => s.verdict === "PARTIAL").length;
  const failCount = allSessions.filter((s) => s.verdict === "FAIL").length;
  const total = allSessions.length;

  const avgBP = avg(allSessions.map((s) => s.scores.benchmarkPerformance.score));
  const avgVE = avg(allSessions.filter((s) => s.scores.valueEfficiency).map((s) => s.scores.valueEfficiency!.score));
  const avgUX = avg(allSessions.map((s) => s.scores.uxSignal.score));
  const avgDur = avg(allSessions.map((s) => s.dur));

  const nonPassSessions = allSessions.filter((s) => s.verdict !== "PASS");
  const rootCauses = nonPassSessions.reduce<Record<string, number>>((acc, s) => {
    if (s.attr) {
      acc[s.attr.rootCause] = (acc[s.attr.rootCause] ?? 0) + 1;
    }
    return acc;
  }, {});

  const guardAllow = GUARD_LOG.filter((e) => e.dec === "allow").length;
  const guardWarn = GUARD_LOG.filter((e) => e.dec === "warn").length;
  const guardBlock = GUARD_LOG.filter((e) => e.dec === "block").length;

  return (
    <Box sx={{ p: 3, maxWidth: 900 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
        Metrics
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
        Aggregate OTLP metric catalog — all projects
      </Typography>

      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 2 }}>
        {/* evalclaw.eval.outcome */}
        <MetricCard
          name="evalclaw.eval.outcome"
          type="counter"
          description="Session count by raw eval outcome (PASS / PARTIAL / FAIL) — the per-session signal that feeds the Ship/Review/Block verdict shown elsewhere in the app"
        >
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <CountBadge label="PASS" value={passCount} color="success.main" />
            <CountBadge label="PARTIAL" value={partialCount} color="warning.main" />
            <CountBadge label="FAIL" value={failCount} color="error.main" />
            <CountBadge label="Total" value={total} color="text.secondary" />
          </Box>
        </MetricCard>

        {/* evalclaw.eval.metric_score */}
        <MetricCard
          name="evalclaw.eval.metric_score"
          type="gauge"
          description="Per-dimension score 0-100 for latest sessions"
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            <DimScore label="Correctness" value={avgBP} />
            <DimScore label="Efficiency" value={avgVE} />
            <DimScore label="Relevance" value={avgUX} />
          </Box>
        </MetricCard>

        {/* evalclaw.eval.root_cause */}
        <MetricCard
          name="evalclaw.eval.root_cause"
          type="counter"
          description="Attribution distribution — non-PASS sessions only"
        >
          {Object.entries(rootCauses).map(([cause, count]) => (
            <Box key={cause} sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
              <Typography variant="caption" sx={{ color: "error.light" }}>
                {ROOT_CAUSE_LABEL[cause as RootCause] ?? cause}
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 700, color: "text.primary" }}>
                {count}
              </Typography>
            </Box>
          ))}
          {Object.keys(rootCauses).length === 0 && (
            <Typography variant="caption" sx={{ color: "text.disabled" }}>No non-PASS sessions</Typography>
          )}
        </MetricCard>

        {/* evalclaw.session.duration */}
        <MetricCard
          name="evalclaw.session.duration"
          type="histogram"
          description="Session wall-clock latency in ms; primary Relevance input"
        >
          <Box sx={{ display: "flex", gap: 2 }}>
            <Box>
              <Typography variant="caption" sx={{ color: "text.disabled", display: "block" }}>avg</Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{Math.round(avgDur / 1000)}s</Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: "text.disabled", display: "block" }}>min</Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {Math.round(Math.min(...allSessions.map((s) => s.dur)) / 1000)}s
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: "text.disabled", display: "block" }}>max</Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {Math.round(Math.max(...allSessions.map((s) => s.dur)) / 1000)}s
              </Typography>
            </Box>
          </Box>
        </MetricCard>

        {/* gen_ai.client.token.usage */}
        <MetricCard
          name="gen_ai.client.token.usage"
          type="histogram"
          description="Token consumption per task; P95 tail cost input for Efficiency"
        >
          <Box sx={{ display: "flex", gap: 2 }}>
            <Box>
              <Typography variant="caption" sx={{ color: "text.disabled", display: "block" }}>median cost</Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>~$0.62</Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: "text.disabled", display: "block" }}>P95 tail</Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>~$1.12</Typography>
            </Box>
          </Box>
          <Typography variant="caption" sx={{ color: "text.disabled", mt: 0.5, display: "block" }}>
            Target: &lt;$1.00/session (Sonnet 4.5)
          </Typography>
        </MetricCard>

        {/* evalclaw.evaluator.llm_calls */}
        <MetricCard
          name="evalclaw.evaluator.llm_calls"
          type="counter"
          description="LLM judge call count; 3 for PASS, 4 for non-PASS (Attribution conditional)"
        >
          <Box sx={{ display: "flex", gap: 2 }}>
            <Box>
              <Typography variant="caption" sx={{ color: "text.disabled", display: "block" }}>PASS sessions</Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>3 calls × {passCount}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: "text.disabled", display: "block" }}>non-PASS</Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>4 calls × {partialCount + failCount}</Typography>
            </Box>
          </Box>
          <Divider sx={{ my: 1 }} />
          <Typography variant="caption" sx={{ fontWeight: 700 }}>
            Total: {passCount * 3 + (partialCount + failCount) * 4} LLM calls
          </Typography>
        </MetricCard>

        {/* evalclaw.guard.decisions */}
        <MetricCard
          name="evalclaw.guard.decisions"
          type="counter"
          description="Runtime guard decision stream — allow / warn / block (a tool-call gate, unrelated to the agent-level Ship/Review/Block verdict)"
        >
          <Box sx={{ display: "flex", gap: 1.5 }}>
            <CountBadge label="allow" value={guardAllow} color="success.main" />
            <CountBadge label="warn" value={guardWarn} color="warning.main" />
            <CountBadge label="block" value={guardBlock} color="error.main" />
          </Box>
          <Typography variant="caption" sx={{ color: "text.disabled", mt: 0.75, display: "block" }}>
            SLA: &lt;50ms P95 per decision
          </Typography>
        </MetricCard>
      </Box>
    </Box>
  );
}

function MetricCard({ name, type, description, children }: {
  name: string;
  type: "counter" | "gauge" | "histogram";
  description: string;
  children: React.ReactNode;
}) {
  const typeColors: Record<string, string> = {
    counter: "#818cf8",
    gauge: "#38bdf8",
    histogram: "#fbbf24",
  };

  return (
    <Paper sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 1 }}>
        <Typography
          variant="caption"
          sx={{ fontFamily: "monospace", color: "primary.light", fontWeight: 600, fontSize: "0.72rem", flex: 1, pr: 1 }}
        >
          {name}
        </Typography>
        <Tag
          label={type}
          sx={{
            height: 18,
            fontSize: "0.6rem",
            fontWeight: 600,
            bgcolor: typeColors[type] + "22",
            color: typeColors[type],
            flexShrink: 0,
          }}
        />
      </Box>
      <Typography variant="caption" sx={{ color: "text.disabled", display: "block", mb: 1.5 }}>
        {description}
      </Typography>
      {children}
    </Paper>
  );
}

function CountBadge({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <Typography variant="h6" sx={{ fontWeight: 700, color, lineHeight: 1 }}>{value}</Typography>
      <Typography variant="caption" sx={{ color: "text.disabled", fontSize: "0.65rem" }}>{label}</Typography>
    </Box>
  );
}

function DimScore({ label, value }: { label: string; value: number }) {
  const color = value >= 75 ? "success.main" : value >= 55 ? "warning.main" : "error.main";
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <Typography variant="caption" sx={{ color: "text.secondary" }}>{label}</Typography>
      <Typography variant="caption" sx={{ fontWeight: 700, color }}>{value}</Typography>
    </Box>
  );
}

function avg(nums: number[]): number {
  if (!nums.length) return 0;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}
