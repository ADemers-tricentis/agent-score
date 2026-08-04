import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import SvgIcon from "@mui/material/SvgIcon";
import Tooltip from "@mui/material/Tooltip";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import type { Run, ProfileVersion } from "../types";
import { DIMENSION_ORDER, DIMENSION_DOT_COLOR, averageDimensionScore, SAFETY_SIGNAL_LABEL } from "../data/dimensions";
import type { AgentVerdict } from "../data/verdict";
import GradeChip from "./GradeChip";
import VerdictChip from "./VerdictChip";

interface Props {
  run: Run | undefined;
  profileVersion: ProfileVersion | null;
  composite: number;
  grade: "A" | "B" | "C" | "D" | "F";
  verdict: AgentVerdict;
  isPreliminary: boolean;
  confidenceDelta: number;
  isScoringNow: boolean;
  hasEnoughTraces: boolean;
  tracesNeeded: number;
  totalSessions: number;
}

type EvalStatus = "pass" | "fail" | "skip";

function StatusIcon({ status }: { status: EvalStatus }) {
  if (status === "pass") {
    return (
      <SvgIcon sx={{ fontSize: "1.1rem", color: "success.main" }}>
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
      </SvgIcon>
    );
  }
  if (status === "fail") {
    return (
      <SvgIcon sx={{ fontSize: "1.1rem", color: "error.main" }}>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
      </SvgIcon>
    );
  }
  return <Typography sx={{ color: "text.disabled" }}>—</Typography>;
}

export default function ScorecardPanel({ run, profileVersion, composite, grade, verdict, isPreliminary, confidenceDelta, isScoringNow, hasEnoughTraces, tracesNeeded, totalSessions }: Props) {
  const sessions = run?.sessions ?? [];
  const enabledEntries = (profileVersion?.entries ?? []).filter((e) => e.enabled);

  const evalStatus = new Map<string, { status: EvalStatus; mean: number | null }>();
  enabledEntries.forEach((entry) => {
    const mean = averageDimensionScore(entry.dimension, sessions);
    const status: EvalStatus = mean == null ? "skip" : mean / 100 >= entry.threshold ? "pass" : "fail";
    evalStatus.set(entry.id, { status, mean });
  });

  const scoredCount = [...evalStatus.values()].filter((v) => v.status === "pass").length;
  const failedCount = [...evalStatus.values()].filter((v) => v.status === "fail").length;
  const skippedCount = [...evalStatus.values()].filter((v) => v.status === "skip").length;
  const failRate = enabledEntries.length > 0 ? failedCount / enabledEntries.length : 0;

  const dimensionsPresent = DIMENSION_ORDER.filter((d) => enabledEntries.some((e) => e.dimension === d));

  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 1.5 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Scorecard</Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>Headline grade and per-point scores from the latest run</Typography>
        </Box>
        {isScoringNow ? (
          <Chip label="Running" size="small" color="warning" variant="outlined" sx={{ fontSize: "0.68rem" }} />
        ) : run ? (
          <Chip label={run.label} size="small" variant="outlined" sx={{ fontSize: "0.68rem", color: "text.secondary" }} />
        ) : null}
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 2.5, mb: 2 }}>
        {hasEnoughTraces ? (
          <GradeChip grade={grade} size="large" />
        ) : (
          <Box sx={{ width: 48, height: 48, borderRadius: "50%", border: "2px dashed", borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "center", color: "text.disabled", fontSize: "1.3rem", flexShrink: 0 }}>
            ?
          </Box>
        )}
        <Box>
          {hasEnoughTraces && verdict.band && <VerdictChip band={verdict.band} size="medium" />}
          <Chip
            label={isPreliminary ? `Provisional · ${Math.max(0, 30 - totalSessions)} more sessions for a final score` : "Final"}
            size="small"
            sx={{ height: 20, fontSize: "0.65rem", mb: 0.5, mt: hasEnoughTraces && verdict.band ? 0.5 : 0, display: "block", width: "fit-content" }}
          />
          {hasEnoughTraces ? (
            <Tooltip title={`With more sessions, this score could reasonably land anywhere from ${Math.max(0, composite - confidenceDelta)} to ${Math.min(100, composite + confidenceDelta)}. More sessions narrow this range.`} arrow placement="top">
              <Typography variant="body2" sx={{ color: "text.secondary", width: "fit-content", cursor: "help" }}>
                {composite}/100 · ± {confidenceDelta}
              </Typography>
            </Tooltip>
          ) : (
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Score will be provisional until {tracesNeeded - totalSessions} more traces are collected.
            </Typography>
          )}
        </Box>
      </Box>

      {hasEnoughTraces && (
        <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
          <Chip label={`${scoredCount} scored`} size="small" color="success" variant="outlined" sx={{ fontSize: "0.68rem" }} />
          <Chip label={`${skippedCount} skipped`} size="small" variant="outlined" sx={{ fontSize: "0.68rem", color: "text.secondary" }} />
          <Chip label={`${failedCount} failed`} size="small" color="error" variant="outlined" sx={{ fontSize: "0.68rem" }} />
        </Box>
      )}

      {hasEnoughTraces && verdict.safety && (
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.25, p: 1.5, mb: 2, borderRadius: 1.5, border: "1px solid", borderColor: "error.light", bgcolor: "rgba(var(--mui-palette-error-mainChannel) / 0.08)" }}>
          <SvgIcon sx={{ fontSize: "1.1rem", color: "error.main", mt: 0.15, flexShrink: 0 }}>
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-1 6h2v2h-2V7zm0 4h2v4h-2v-4z" />
          </SvgIcon>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              Safety {verdict.safety.severity === "Critical" ? "override" : "warning"} · {SAFETY_SIGNAL_LABEL[verdict.safety.signal] ?? verdict.safety.signal}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>{verdict.safety.detail}</Typography>
          </Box>
        </Box>
      )}

      {hasEnoughTraces && !verdict.safety && failedCount > 0 && (
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.25, p: 1.5, mb: 2, borderRadius: 1.5, border: "1px solid", borderColor: "warning.light", bgcolor: "rgba(var(--mui-palette-warning-mainChannel) / 0.08)" }}>
          <SvgIcon sx={{ fontSize: "1.1rem", color: "warning.main", mt: 0.15, flexShrink: 0 }}>
            <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
          </SvgIcon>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>{verdict.band ? `${verdict.band.toUpperCase()} · ` : ""}{Math.round(failRate * 100)}% of evals are failing</Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>{verdict.reason}</Typography>
          </Box>
        </Box>
      )}

      {hasEnoughTraces && dimensionsPresent.length === 0 && (
        <Typography variant="body2" sx={{ color: "text.disabled" }}>No scoring profile adopted — adopt one to see per-eval results.</Typography>
      )}

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
        {hasEnoughTraces && dimensionsPresent.map((dim) => {
          const entries = enabledEntries.filter((e) => e.dimension === dim);
          return (
            <Box key={dim}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: DIMENSION_DOT_COLOR[dim], flexShrink: 0 }} />
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{dim}</Typography>
              </Box>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, color: "text.secondary", fontSize: "0.72rem" }}>Eval</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: "text.secondary", fontSize: "0.72rem", width: 60 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: "text.secondary", fontSize: "0.72rem", width: 70 }}>Score</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: "text.secondary", fontSize: "0.72rem", width: 70 }}>Target</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {entries.map((entry) => {
                    const result = evalStatus.get(entry.id)!;
                    return (
                      <TableRow key={entry.id} sx={{ "&:last-child td": { borderBottom: 0 } }}>
                        <TableCell sx={{ fontSize: "0.8rem" }}>{entry.evalName}</TableCell>
                        <TableCell><StatusIcon status={result.status} /></TableCell>
                        <TableCell sx={{ fontSize: "0.8rem", fontFamily: "monospace" }}>{result.mean != null ? `${Math.round(result.mean)}%` : "—"}</TableCell>
                        <TableCell sx={{ fontSize: "0.8rem", fontFamily: "monospace", color: "text.secondary" }}>{Math.round(entry.threshold * 100)}%</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
}
