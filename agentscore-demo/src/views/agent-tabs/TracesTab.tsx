import { useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import SvgIcon from "@mui/material/SvgIcon";
import Collapse from "@mui/material/Collapse";
import Alert from "@mui/material/Alert";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import type { Project } from "../../types";
import { projectVerdictBands, sessionVerdict } from "../../data/verdict";
import VerdictChip from "../../components/VerdictChip";
import { generateSpans, di, type MockSpan } from "./shared";

interface Props {
  project: Project;
  initialTraceId?: string;
}

export default function TracesTab({ project, initialTraceId }: Props) {
  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(initialTraceId ?? null);
  const [selectedSpanId, setSelectedSpanId] = useState<string | null>(null);
  const [metaOpen, setMetaOpen] = useState(false);

  const runs = project.runs ?? [];
  const bands = projectVerdictBands(project);

  if (selectedTraceId) {
    const allSessions = runs.flatMap((r) => r.sessions);
    const selectedSession = allSessions.find((s) => s.id === selectedTraceId);
    if (!selectedSession) return null;

    const spans = generateSpans(selectedSession, project);
    const activeSpanId = selectedSpanId ?? spans[0]?.id;
    const activeSpan = spans.find((sp) => sp.id === activeSpanId) ?? spans[0];
    const rootDur = selectedSession.dur;
    const totalTokens = spans.reduce((acc, sp) => acc + sp.inputTokens + sp.outputTokens, 0);
    const totalCost = spans.reduce((acc, sp) => acc + sp.costUsd, 0);
    const svcName = (project.service ?? project.name).toLowerCase().replace(/\s+/g, "-");

    const kindColor = (kind: MockSpan["kind"]) => (kind === "agent" ? "#1a1a1a" : kind === "llm" ? "#0070f3" : "#7c3aed");
    const kindBg = (kind: MockSpan["kind"]) => (kind === "agent" ? "#f0f0f0" : kind === "llm" ? "#e8f0fe" : "#f3e8ff");

    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
        <Box sx={{ mb: 2 }}>
          <Button
            size="small"
            startIcon={<SvgIcon sx={{ fontSize: "0.9rem !important" }}><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" /></SvgIcon>}
            onClick={() => { setSelectedTraceId(null); setSelectedSpanId(null); }}
            sx={{ color: "text.secondary", mb: 1.5, pl: 0, fontSize: "0.8rem" }}
          >
            Traces
          </Button>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>invoke_agent {svcName}</Typography>
          <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 1.5 }}>
            {new Date(selectedSession.ts).toLocaleString("en-US", { month: "numeric", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
            {[
              { icon: "M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z", label: rootDur >= 1000 ? `${(rootDur / 1000).toFixed(2)}s` : `${rootDur}ms` },
              { icon: "M11.5 2C6.81 2 3 5.81 3 10.5S6.81 19 11.5 19h.5v3c4.86-2.34 8-7 8-11.5C20 5.81 16.19 2 11.5 2zm1 14.5h-2v-2h2v2zm0-4h-2c0-3.25 3-3 3-5 0-1.1-.9-2-2-2s-2 .9-2 2h-2c0-2.21 1.79-4 4-4s4 1.79 4 4c0 2.5-3 2.75-3 5z", label: `# ${totalTokens} tokens` },
              { icon: "M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z", label: `$ ${totalCost < 0.001 ? `$${(totalCost * 1000).toFixed(4)}m` : `$${totalCost.toFixed(5)}`}` },
              { icon: "M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z", label: `${spans.length} span${spans.length !== 1 ? "s" : ""}` },
            ].map(({ icon, label }) => (
              <Box key={label} sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <SvgIcon sx={{ fontSize: "0.9rem", color: "text.disabled" }}><path d={icon} /></SvgIcon>
                <Typography variant="caption" sx={{ color: "text.secondary", fontFamily: "monospace" }}>{label}</Typography>
              </Box>
            ))}
          </Box>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 2, alignItems: "start" }}>
          <Paper variant="outlined" sx={{ borderRadius: 1.5, overflow: "hidden" }}>
            <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid", borderColor: "divider" }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Spans</Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {spans.length} span{spans.length !== 1 ? "s" : ""} · {spans.findIndex((sp) => sp.id === activeSpanId) + 1} selected
              </Typography>
            </Box>
            <Box>
              {spans.map((span) => {
                const isRoot = !span.parentId;
                const barLeft = rootDur > 0 ? (span.offsetMs / rootDur) * 100 : 0;
                const barWidth = rootDur > 0 ? Math.max(2, (span.durationMs / rootDur) * 100) : 4;
                const isActive = span.id === activeSpanId;
                return (
                  <Box key={span.id} onClick={() => setSelectedSpanId(span.id)}
                    sx={{
                      px: 2, py: 1.25, cursor: "pointer", display: "flex", flexDirection: "column", gap: 0.5,
                      bgcolor: isActive ? "action.selected" : "transparent",
                      borderLeft: isActive ? "2px solid" : "2px solid transparent",
                      borderColor: isActive ? "primary.main" : "transparent",
                      "&:hover": { bgcolor: isActive ? "action.selected" : "action.hover" },
                      "&:not(:last-child)": { borderBottom: "1px solid", borderBottomColor: "divider" },
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, pl: isRoot ? 0 : 2 }}>
                      {!isRoot && <Box sx={{ width: 8, height: 1, bgcolor: "divider", flexShrink: 0, mt: 0.25 }} />}
                      <Typography variant="caption" sx={{ fontFamily: "monospace", fontWeight: isRoot ? 700 : 500, fontSize: "0.72rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, minWidth: 0 }}>
                        {span.name}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, pl: isRoot ? 0 : 2, flexWrap: "wrap" }}>
                      <Box sx={{ px: 0.75, py: 0.1, borderRadius: 0.5, bgcolor: kindBg(span.kind), display: "inline-block" }}>
                        <Typography variant="caption" sx={{ fontSize: "0.62rem", fontWeight: 700, color: kindColor(span.kind) }}>{span.kind}</Typography>
                      </Box>
                      {span.model && span.kind !== "agent" && (
                        <Box sx={{ px: 0.75, py: 0.1, borderRadius: 0.5, bgcolor: "action.hover", display: "inline-block" }}>
                          <Typography variant="caption" sx={{ fontSize: "0.62rem", fontFamily: "monospace" }}>{span.model}</Typography>
                        </Box>
                      )}
                      {(span.inputTokens + span.outputTokens) > 0 && (
                        <Typography variant="caption" sx={{ fontSize: "0.62rem", color: "text.secondary", fontFamily: "monospace" }}>
                          {span.inputTokens + span.outputTokens} tok
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ height: 6, bgcolor: "action.hover", borderRadius: 0.5, position: "relative", overflow: "hidden", pl: isRoot ? 0 : 2 }}>
                      <Box sx={{ position: "absolute", top: 0, bottom: 0, left: `${barLeft}%`, width: `${barWidth}%`, bgcolor: kindColor(span.kind), borderRadius: 0.5 }} />
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Paper>

          {activeSpan && (() => {
            const durLabel = activeSpan.durationMs >= 1000 ? `${(activeSpan.durationMs / 1000).toFixed(2)}s` : `${activeSpan.durationMs}ms`;
            const endMs = activeSpan.offsetMs + activeSpan.durationMs;
            const endLabel = endMs >= 1000 ? `${(endMs / 1000).toFixed(2)}s` : `${endMs}ms`;
            const tok = activeSpan.inputTokens + activeSpan.outputTokens;
            return (
              <Paper variant="outlined" sx={{ borderRadius: 1.5, overflow: "hidden" }}>
                <Box sx={{ px: 2.5, py: 2, borderBottom: "1px solid", borderColor: "divider" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.75, flexWrap: "wrap" }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, fontFamily: "monospace", fontSize: "0.9rem" }}>{activeSpan.name}</Typography>
                    <Box sx={{ px: 0.75, py: 0.1, borderRadius: 0.5, bgcolor: kindBg(activeSpan.kind) }}>
                      <Typography variant="caption" sx={{ fontSize: "0.7rem", fontWeight: 700, color: kindColor(activeSpan.kind) }}>{activeSpan.kind}</Typography>
                    </Box>
                    {activeSpan.model && (
                      <Box sx={{ px: 0.75, py: 0.1, borderRadius: 0.5, bgcolor: "action.hover" }}>
                        <Typography variant="caption" sx={{ fontSize: "0.7rem", fontFamily: "monospace" }}>{activeSpan.model}</Typography>
                      </Box>
                    )}
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                    {[
                      { icon: "M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z", label: durLabel },
                      ...(tok > 0 ? [{ icon: "M11.5 2C6.81 2 3 5.81 3 10.5S6.81 19 11.5 19h.5v3c4.86-2.34 8-7 8-11.5C20 5.81 16.19 2 11.5 2zm1 14.5h-2v-2h2v2zm0-4h-2c0-3.25 3-3 3-5 0-1.1-.9-2-2-2s-2 .9-2 2h-2c0-2.21 1.79-4 4-4s4 1.79 4 4c0 2.5-3 2.75-3 5z", label: `${activeSpan.inputTokens} → ${activeSpan.outputTokens}` }] : []),
                      ...(activeSpan.costUsd > 0 ? [{ icon: "M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z", label: `$${activeSpan.costUsd.toFixed(5)}` }] : []),
                    ].map(({ icon, label }) => (
                      <Box key={label} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <SvgIcon sx={{ fontSize: "0.85rem", color: "text.disabled" }}><path d={icon} /></SvgIcon>
                        <Typography variant="caption" sx={{ fontFamily: "monospace", color: "text.secondary" }}>{label}</Typography>
                      </Box>
                    ))}
                  </Box>
                  <Typography variant="caption" sx={{ color: "text.disabled", display: "block", mt: 0.5 }}>
                    offset {activeSpan.offsetMs}ms · ended {endLabel}
                  </Typography>
                </Box>

                <Box sx={{ px: 2.5, py: 2, borderBottom: "1px solid", borderColor: "divider" }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.8, fontSize: "0.65rem", display: "block", mb: 1 }}>
                    Input{activeSpan.inputTokens > 0 ? ` · ${activeSpan.inputTokens} tokens` : ""}
                  </Typography>
                  <Box sx={{ bgcolor: "action.hover", borderRadius: 1, p: 1.5, border: "1px solid", borderColor: "divider", minHeight: 48 }}>
                    <Typography component="pre" sx={{ m: 0, fontFamily: "monospace", fontSize: "0.8rem", color: "success.main", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                      {activeSpan.input}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ px: 2.5, py: 2, borderBottom: "1px solid", borderColor: "divider" }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.8, fontSize: "0.65rem", display: "block", mb: 1 }}>
                    Output{activeSpan.outputTokens > 0 ? ` · ${activeSpan.outputTokens} tokens` : ""}
                  </Typography>
                  <Box sx={{ bgcolor: "action.hover", borderRadius: 1, p: 1.5, border: "1px solid", borderColor: "divider", minHeight: 48 }}>
                    <Typography component="pre" sx={{ m: 0, fontFamily: "monospace", fontSize: "0.8rem", color: "success.main", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                      {activeSpan.output}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ px: 2.5, py: 1.5 }}>
                  <Box onClick={() => setMetaOpen((v) => !v)} sx={{ display: "flex", alignItems: "center", gap: 0.75, cursor: "pointer", userSelect: "none" }}>
                    <SvgIcon sx={{ fontSize: "0.9rem", color: "text.secondary", transform: metaOpen ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}>
                      <path d="M10 17l5-5-5-5v10z" />
                    </SvgIcon>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.8, fontSize: "0.65rem" }}>Metadata</Typography>
                  </Box>
                  <Collapse in={metaOpen}>
                    <Box sx={{ mt: 1.5, bgcolor: "action.hover", borderRadius: 1, p: 1.5, border: "1px solid", borderColor: "divider" }}>
                      <Typography component="pre" sx={{ m: 0, fontFamily: "monospace", fontSize: "0.75rem", color: "text.secondary", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                        {JSON.stringify({
                          span_id: activeSpan.id.slice(-12),
                          parent_id: activeSpan.parentId?.slice(-12) ?? null,
                          service_name: project.service ?? project.name,
                          agent_score_project: project.id,
                          otel_version: "1.27.0",
                          instrumentation_scope: "agentscore-sdk",
                        }, null, 2)}
                      </Typography>
                    </Box>
                  </Collapse>
                </Box>
              </Paper>
            );
          })()}
        </Box>
      </Box>
    );
  }

  const allTraceSessions = runs.flatMap((r) => r.sessions.map((s) => ({ ...s, runLabel: r.label })));
  const svcName = (project.service ?? project.name).toLowerCase().replace(/\s+/g, "-");

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {project.runs.some((r) => r.regradedWithProfileVersion) && (() => {
        const rv = project.runs.find((r) => r.regradedWithProfileVersion)?.regradedWithProfileVersion;
        const re = project.events?.find((e) => e.kind === "profile_version_changed");
        return (
          <Alert severity="info" sx={{ borderRadius: 1.5 }}>
            Profile updated to v{rv}{re ? ` on ${new Date(re.ts).toLocaleDateString()}` : ""}. Earlier runs were re-evaluated against the new version so results stay comparable.
          </Alert>
        );
      })()}

      <Paper variant="outlined" sx={{ borderRadius: 1.5, overflow: "hidden" }}>
        <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid", borderColor: "divider" }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Traces</Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>{allTraceSessions.length} total</Typography>
        </Box>
        {allTraceSessions.length === 0 ? (
          <Box sx={{ py: 5, display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: "text.secondary" }}>No traces yet</Typography>
            <Typography variant="caption" sx={{ color: "text.disabled" }}>No OTel traces have been ingested for this agent.</Typography>
          </Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>Trace</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.secondary", width: 160 }}>Timestamp</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.secondary", width: 90 }}>Duration</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.secondary", width: 80 }}>Spans</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.secondary", width: 90 }}>Verdict</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {allTraceSessions.map((s) => {
                const spanCount = 2 + di(s.id, 4, 20);
                const dur = s.dur >= 1000 ? `${(s.dur / 1000).toFixed(2)}s` : `${s.dur}ms`;
                return (
                  <TableRow key={s.id} hover onClick={() => { setSelectedTraceId(s.id); setSelectedSpanId(null); }} sx={{ cursor: "pointer", "&:last-child td": { borderBottom: 0 } }}>
                    <TableCell>
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
                        <Typography variant="caption" sx={{ fontFamily: "monospace", fontWeight: 600, color: "primary.main" }}>invoke_agent {svcName}</Typography>
                        <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.72rem" }}>{s.scenario}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ color: "text.secondary", fontFamily: "monospace" }}>
                        {new Date(s.ts).toLocaleString("en-US", { month: "numeric", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </Typography>
                    </TableCell>
                    <TableCell><Typography variant="caption" sx={{ fontFamily: "monospace", color: "text.secondary" }}>{dur}</Typography></TableCell>
                    <TableCell><Typography variant="caption" sx={{ color: "text.secondary" }}>{spanCount}</Typography></TableCell>
                    <TableCell><VerdictChip band={sessionVerdict(s, bands).band} /></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Paper>
    </Box>
  );
}
