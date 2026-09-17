/** ScoringPanel — scoring-outcomes card. No backend: reads straight off the
 * fixture `DashboardScoring`, so there's no loading/error branch to render
 * (unlike the real, query-backed ScoringPanel).
 *
 * (a) "Agents needing attention" compact table (worst-first) with a
 * "View all →" link to `/agents`.
 * (b) Verdict-distribution bars (Ship/Review/Block, % excludes `noVerdict`)
 * plus a muted "No verdict yet" aside.
 * (c) A 7-day trend of three sparklines with a `StatusDot` legend.
 */

import { Link, useNavigate } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";

import type { DashboardRunRow, DashboardScoring, ShipDecision } from "@/back-office/dashboard/fake-data";
import { fmtCount, fmtRelative, fmtScore } from "@/back-office/dashboard/format";
import { EmptyState } from "@/shared/components/empty-state";
import { Sparkline } from "@/shared/components/sparkline";
import { StatusDot } from "@/shared/components/status-dot";
import { VerdictBadge } from "@/shared/components/verdict-badge";
import { focusRing } from "@/shared/theme/focus-ring";

interface ScoringPanelProps {
  scoring: DashboardScoring;
}

function AttentionRow({
  row,
  onOpen,
}: {
  row: DashboardRunRow;
  onOpen: (row: DashboardRunRow) => void;
}) {
  const activate = () => onOpen(row);
  return (
    <TableRow
      hover
      role="button"
      tabIndex={0}
      aria-label={`Open scoring for ${row.agentName}`}
      onClick={activate}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          activate();
        }
      }}
      sx={[focusRing, { cursor: "pointer" }]}
    >
      <TableCell sx={{ fontWeight: 500 }}>{row.agentName}</TableCell>
      <TableCell sx={{ color: "text.secondary" }}>{row.tenantName}</TableCell>
      <TableCell align="right" sx={{ fontWeight: 600 }}>
        {fmtScore(row.compositeScore)}
      </TableCell>
      <TableCell>
        <VerdictBadge shipDecision={row.shipDecision} />
      </TableCell>
      <TableCell align="right" sx={{ color: "text.secondary" }}>
        {fmtRelative(row.createdAt)}
      </TableCell>
    </TableRow>
  );
}

function AttentionTable({ attention }: { attention: DashboardRunRow[] }) {
  const navigate = useNavigate();
  if (attention.length === 0) {
    return <EmptyState title="No agents need attention — all latest runs are Ship" />;
  }
  const onOpen = (row: DashboardRunRow) =>
    void navigate({
      to: "/tenants/$tenantId/agents/$agentId",
      params: { tenantId: row.tenantId, agentId: row.agentId },
      search: { sub: "run" },
    });
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Agent</TableCell>
          <TableCell>Tenant</TableCell>
          <TableCell align="right">Score</TableCell>
          <TableCell>Verdict</TableCell>
          <TableCell align="right">Last run</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {attention.map((row) => (
          <AttentionRow key={row.agentId} row={row} onOpen={onOpen} />
        ))}
      </TableBody>
    </Table>
  );
}

function CollapsedLine({
  scoring,
  captionVariant,
}: {
  scoring: DashboardScoring;
  captionVariant: "windowed" | "isolated";
}) {
  const { collapsed, collapsedByClass, runsTotal } = scoring;
  if (collapsed === 0) return null;
  const backpressure = collapsedByClass.backpressure ?? 0;
  const infrastructure = collapsedByClass.infrastructure ?? 0;
  const profileFit = collapsedByClass.profile_attributable ?? 0;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
      <StatusDot status="muted">
        Collapsed · {fmtCount(collapsed)} {collapsed === 1 ? "run" : "runs"} (
        {fmtCount(backpressure)} backpressure · {fmtCount(infrastructure)} infrastructure ·{" "}
        {fmtCount(profileFit)} profile fit)
      </StatusDot>
      <Box sx={{ pl: 1.75, typography: "caption", color: "text.secondary" }}>
        {captionVariant === "windowed" ? (
          <>Not counted in the {fmtCount(runsTotal)} runs total above — a collapsed run recorded no result at all.</>
        ) : (
          <>Every run in the window collapsed — none reached a result to score.</>
        )}
      </Box>
    </Box>
  );
}

function VerdictDistribution({ scoring }: { scoring: DashboardScoring }) {
  const { buckets, noVerdict } = scoring;
  const bucketTotal = buckets.ship + buckets.review + buckets.block;

  if (bucketTotal === 0 && noVerdict === 0) {
    const { collapsed } = scoring;
    return (
      <Box sx={{ px: 2.5, pb: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
        <Box sx={{ typography: "body2", color: "text.secondary" }}>
          {collapsed > 0
            ? `No run produced a verdict in the last 24h — ${fmtCount(collapsed)} ${collapsed === 1 ? "run" : "runs"} collapsed`
            : "No scoring runs in the last 24h"}
        </Box>
        <CollapsedLine scoring={scoring} captionVariant="isolated" />
      </Box>
    );
  }

  const rows: {
    key: ShipDecision;
    label: string;
    count: number;
    tone: "success.main" | "warning.main" | "error.main";
  }[] = [
    { key: "ship", label: "Ship", count: buckets.ship, tone: "success.main" },
    { key: "needs_work", label: "Review", count: buckets.review, tone: "warning.main" },
    { key: "dont_ship", label: "Block", count: buckets.block, tone: "error.main" },
  ];

  return (
    <Box sx={{ px: 2.5, pb: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
      {rows.map((r) => {
        const pct = bucketTotal > 0 ? Math.round((r.count / bucketTotal) * 100) : 0;
        return (
          <Box key={r.key}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", typography: "caption" }}>
              <Box component="span" sx={{ color: r.tone }}>
                {r.label}
              </Box>
              <Box component="span">
                <Box component="span" sx={{ fontWeight: 500 }}>
                  {fmtCount(r.count)}
                </Box>{" "}
                <Box component="span" sx={{ color: "text.secondary" }}>
                  ({pct}%)
                </Box>
              </Box>
            </Box>
            <Box sx={{ mt: 0.5, height: 8, overflow: "hidden", borderRadius: 0.5, bgcolor: "action.hover" }}>
              <Box sx={{ height: "100%", width: `${pct}%`, bgcolor: r.tone }} />
            </Box>
          </Box>
        );
      })}
      <Box
        sx={{
          mt: 0.5,
          pt: 1.5,
          borderTop: 1,
          borderColor: "divider",
          display: "flex",
          flexDirection: "column",
          gap: 1,
          typography: "caption",
          color: "text.secondary",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          <StatusDot status="muted">
            No verdict yet · {fmtCount(noVerdict)} {noVerdict === 1 ? "run" : "runs"} (provisional / insufficient
            sample) — excluded from the bars
          </StatusDot>
        </Box>
        <CollapsedLine scoring={scoring} captionVariant="windowed" />
      </Box>
    </Box>
  );
}

function TrendChart({ scoring }: { scoring: DashboardScoring }) {
  const trend = scoring.trend7D;
  const hasSeries = trend.length >= 2;

  const series: {
    key: ShipDecision;
    label: string;
    tone: "success" | "warning" | "destructive";
    values: number[];
  }[] = [
    { key: "ship", label: "Ship", tone: "success", values: trend.map((t) => t.ship) },
    { key: "needs_work", label: "Review", tone: "warning", values: trend.map((t) => t.review) },
    { key: "dont_ship", label: "Block", tone: "destructive", values: trend.map((t) => t.block) },
  ];

  return (
    <Box sx={{ px: 2.5, pb: 2.5, pt: 2, borderTop: 1, borderColor: "divider" }}>
      <Box sx={{ typography: "overline", color: "text.secondary", mb: 1 }}>Trend · last 7 days</Box>
      {hasSeries ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {series.map((s) => (
            <Box key={s.key} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box sx={{ width: 56, flexShrink: 0, typography: "caption", color: "text.secondary" }}>{s.label}</Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Sparkline values={s.values} tone={s.tone} stretch height={24} ariaLabel={`${s.label} trend, last 7 days`} />
              </Box>
            </Box>
          ))}
        </Box>
      ) : (
        <Box sx={{ typography: "body2", color: "text.secondary" }}>Not enough days of data yet</Box>
      )}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 1.5 }}>
        <StatusDot status="success">Ship</StatusDot>
        <StatusDot status="warning">Review</StatusDot>
        <StatusDot status="destructive">Block</StatusDot>
      </Box>
    </Box>
  );
}

export function ScoringPanel({ scoring }: ScoringPanelProps) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <Card>
        <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2.5, py: 1.5 }}>
            <Box>
              <Box sx={{ typography: "body2", fontWeight: 600 }}>Agents needing attention</Box>
              <Box sx={{ typography: "caption", color: "text.secondary" }}>
                Latest completed run is Review or Block · worst first
              </Box>
            </Box>
            <Link to="/agents" search={{ view: "list", by: "tenant" }} style={{ textDecoration: "none" }}>
              <Box component="span" sx={{ typography: "caption", color: "primary.main" }}>
                View all →
              </Box>
            </Link>
          </Box>
          <AttentionTable attention={scoring.attention} />
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
          <Box sx={{ px: 2.5, pt: 1.5, pb: 0.5 }}>
            <Box sx={{ typography: "body2", fontWeight: 600 }}>Verdict distribution</Box>
            <Box sx={{ typography: "caption", color: "text.secondary" }}>Last 24h · across all agents</Box>
          </Box>
          <VerdictDistribution scoring={scoring} />
          <TrendChart scoring={scoring} />
        </CardContent>
      </Card>
    </Box>
  );
}
