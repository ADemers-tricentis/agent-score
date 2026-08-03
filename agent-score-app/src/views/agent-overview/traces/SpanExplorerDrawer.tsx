import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import SvgIcon from "@mui/material/SvgIcon";
import Chip from "@mui/material/Chip";
import type { SpanKind, SpanNode, TraceDetail } from "../../../types";
import { getTraceDetail } from "../../../data/mock";
import { SessionVerdictChip } from "../../../components/shared/VerdictChip";

const DRAWER_WIDTH = 600;

const KIND_COLOR: Record<SpanKind, string> = {
  agent: "primary.main",
  llm: "info.main",
  tool: "warning.main",
};

const KIND_LABEL: Record<SpanKind, string> = {
  agent: "Agent",
  llm: "LLM",
  tool: "Tool",
};

function formatDuration(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`;
  return `${ms}ms`;
}

function formatCost(cost?: number): string {
  if (cost == null) return "-";
  return `$${cost.toFixed(3)}`;
}

function CloseIcon() {
  return (
    <SvgIcon fontSize="small">
      <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
    </SvgIcon>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <SvgIcon
      sx={{
        fontSize: "1rem",
        color: "text.disabled",
        transform: open ? "rotate(180deg)" : "none",
        transition: "transform 0.15s",
        flexShrink: 0,
      }}
    >
      <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
    </SvgIcon>
  );
}

function SpanTextBlock({ label, text }: { label: string; text: string }) {
  return (
    <Box sx={{ mb: 1, "&:last-child": { mb: 0 } }}>
      <Typography
        variant="caption"
        sx={{ color: "text.disabled", fontWeight: 700, textTransform: "uppercase", fontSize: "0.6rem", letterSpacing: 0.5 }}
      >
        {label}
      </Typography>
      <Box
        component="pre"
        sx={{
          m: 0,
          mt: 0.5,
          p: 1,
          bgcolor: "action.hover",
          borderRadius: 1,
          fontSize: "0.72rem",
          fontFamily: "monospace",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {text}
      </Box>
    </Box>
  );
}

/** One span row, rendered recursively over `children` (the mock tree is shallow, but this stays correct if it ever isn't). */
function SpanRow({
  span,
  depth,
  totalDurationMs,
  expanded,
  onToggle,
}: {
  span: SpanNode;
  depth: number;
  totalDurationMs: number;
  expanded: Set<string>;
  onToggle: (id: string) => void;
}) {
  const isExpanded = expanded.has(span.id);
  const hasDetail = Boolean(span.input || span.output);
  const leftPct = totalDurationMs > 0 ? (span.startOffsetMs / totalDurationMs) * 100 : 0;
  const widthPct = totalDurationMs > 0 ? Math.max((span.durationMs / totalDurationMs) * 100, 0.5) : 0;
  const hasTokensOrCost = span.tokens != null || span.costUsd != null;

  return (
    <Box>
      <Box
        onClick={() => hasDetail && onToggle(span.id)}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          py: 1,
          pl: 1 + depth * 2.5,
          pr: 1,
          cursor: hasDetail ? "pointer" : "default",
          borderRadius: 1,
          "&:hover": hasDetail ? { bgcolor: "action.hover" } : undefined,
        }}
      >
        <Box sx={{ width: 16, display: "flex", justifyContent: "center", flexShrink: 0 }}>
          {hasDetail && <ChevronIcon open={isExpanded} />}
        </Box>
        <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: KIND_COLOR[span.kind], flexShrink: 0 }} />
        <Box sx={{ width: 130, flexShrink: 0, minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {span.name}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.disabled", fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: 0.5 }}>
            {KIND_LABEL[span.kind]}
          </Typography>
        </Box>

        <Box sx={{ flex: 1, position: "relative", height: 8, minWidth: 80, bgcolor: "action.hover", borderRadius: 1 }}>
          <Box
            sx={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: `${leftPct}%`,
              width: `${widthPct}%`,
              bgcolor: KIND_COLOR[span.kind],
              borderRadius: 1,
            }}
          />
        </Box>

        <Box sx={{ width: 70, flexShrink: 0, textAlign: "right" }}>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {formatDuration(span.durationMs)}
          </Typography>
        </Box>

        <Box sx={{ width: 120, flexShrink: 0, textAlign: "right" }}>
          {hasTokensOrCost ? (
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {span.tokens != null ? `${span.tokens} tok` : ""}
              {span.tokens != null && span.costUsd != null ? " · " : ""}
              {span.costUsd != null ? formatCost(span.costUsd) : ""}
            </Typography>
          ) : (
            <Typography variant="caption" sx={{ color: "text.disabled" }}>
              -
            </Typography>
          )}
        </Box>
      </Box>

      {isExpanded && hasDetail && (
        <Box sx={{ pl: `${1 + depth * 2.5 + 3}rem`, pr: 1, pb: 1.5 }}>
          {span.input && <SpanTextBlock label="Input" text={span.input} />}
          {span.output && <SpanTextBlock label="Output" text={span.output} />}
        </Box>
      )}

      {span.children.map((child) => (
        <SpanRow key={child.id} span={child} depth={depth + 1} totalDurationMs={totalDurationMs} expanded={expanded} onToggle={onToggle} />
      ))}
    </Box>
  );
}

const COLUMN_HEADERS: { label: string; sx: object }[] = [
  { label: "", sx: { width: 16 } },
  { label: "", sx: { width: 8 } },
  { label: "Span", sx: { width: 130 } },
  { label: "Timeline", sx: { flex: 1, minWidth: 80 } },
  { label: "Duration", sx: { width: 70, textAlign: "right" } },
  { label: "Tokens / Cost", sx: { width: 120, textAlign: "right" } },
];

/** REQ-022: full agent/llm/tool span tree with timing bars, token counts, cost, and input/output per span. */
export default function SpanExplorerDrawer({
  open,
  onClose,
  agentId,
  traceId,
}: {
  open: boolean;
  onClose: () => void;
  agentId: string;
  traceId: string | null;
}) {
  const [detail, setDetail] = useState<TraceDetail | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open || !traceId) return;
    let cancelled = false;
    setDetail(null);
    setExpanded(new Set());
    getTraceDetail(agentId, traceId).then((result) => {
      if (!cancelled) setDetail(result);
    });
    return () => {
      cancelled = true;
    };
  }, [open, agentId, traceId]);

  function toggleSpan(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <Drawer anchor="right" open={open} onClose={onClose} sx={{ "& .MuiDrawer-paper": { width: DRAWER_WIDTH } }}>
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", p: 2.5, pb: 2 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {detail?.name ?? "Trace"}
            </Typography>
            {detail && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  {formatDuration(detail.durationMs)}
                </Typography>
                {detail.verdict ? (
                  <SessionVerdictChip verdict={detail.verdict} />
                ) : (
                  <Chip
                    label={detail.status === "ok" ? "OK" : "Error"}
                    size="small"
                    color={detail.status === "ok" ? "success" : "error"}
                    sx={{ height: 18, fontSize: "0.62rem" }}
                  />
                )}
              </Box>
            )}
          </Box>
          <IconButton size="small" onClick={onClose} aria-label="Close span explorer">
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider />

        <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
          {!traceId ? null : !detail ? (
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Loading…
            </Typography>
          ) : detail.spans.length === 0 ? (
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              No spans recorded for this trace.
            </Typography>
          ) : (
            <>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, pl: 1, pr: 1, pb: 1 }}>
                {COLUMN_HEADERS.map((col, i) => (
                  <Box key={i} sx={col.sx}>
                    <Typography
                      variant="caption"
                      sx={{ color: "text.disabled", fontWeight: 700, fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: 0.5 }}
                    >
                      {col.label}
                    </Typography>
                  </Box>
                ))}
              </Box>
              <Divider sx={{ mb: 1 }} />
              {detail.spans.map((span) => (
                <SpanRow key={span.id} span={span} depth={0} totalDurationMs={detail.durationMs} expanded={expanded} onToggle={toggleSpan} />
              ))}
            </>
          )}
        </Box>
      </Box>
    </Drawer>
  );
}
