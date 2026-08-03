import { Fragment, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import SvgIcon from "@mui/material/SvgIcon";
import Alert from "@mui/material/Alert";
import type { AgentInboxGroup, InboxItem, SessionVerdict } from "../../types";
import type { View } from "../../view";
import { submitLabel } from "../../data/mock";
import AgentTypeTag from "../../components/shared/AgentTypeTag";
import GradeChip from "../../components/shared/GradeChip";
import ShipDecisionPanel from "../session-detail/ShipDecisionPanel";
import LabelingCandidateCard from "../agent-overview/labeling/LabelingCandidateCard";

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <SvgIcon sx={{ fontSize: "1.1rem", color: "text.disabled", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>
      <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
    </SvgIcon>
  );
}

/** One flagged session inline: score + scenario, a safety alert if present, a trimmed root-cause line, and the ship decision control. */
function SessionItemCard({
  item,
  onActionTaken,
  navigate,
}: {
  item: Extract<InboxItem, { kind: "session" }>;
  onActionTaken: () => void;
  navigate: (v: View) => void;
}) {
  const { session } = item;
  return (
    <Paper sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <GradeChip grade={session.grade} size="small" />
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {session.scenario}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.disabled" }}>
            {item.runLabel} · {new Date(session.ts).toLocaleString()}
          </Typography>
        </Box>
      </Box>

      {session.safetyOverride && (
        <Alert severity={session.safetyOverride.severity === "Critical" ? "error" : "warning"} sx={{ borderRadius: 1.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            Safety override ({session.safetyOverride.severity})
          </Typography>
          {session.safetyOverride.detail}
        </Alert>
      )}

      {session.attribution && (
        <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, flexWrap: "wrap" }}>
          <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 700 }}>
            WHY:
          </Typography>
          <Typography variant="body2">{session.attribution.rootCause}</Typography>
          <Typography variant="caption" sx={{ color: "text.disabled" }}>
            ({session.attribution.confidence}% confidence)
          </Typography>
          <Button
            size="small"
            variant="text"
            onClick={(e) => {
              e.stopPropagation();
              navigate({ name: "session-detail", agentId: item.agentId, runId: item.runId, sessionId: session.id });
            }}
            sx={{ color: "primary.main", fontSize: "0.72rem", minWidth: 0, py: 0 }}
          >
            View trace →
          </Button>
        </Box>
      )}

      <ShipDecisionPanel
        agentId={item.agentId}
        runId={item.runId}
        sessionId={session.id}
        verdict={session.verdict}
        shipDecision={session.shipDecision}
        onSaved={onActionTaken}
      />
    </Paper>
  );
}

/** Thin wrapper closing LabelingCandidateCard's callbacks over this item's agentId. */
function LabelingItemCard({ item, onActionTaken }: { item: Extract<InboxItem, { kind: "labeling" }>; onActionTaken: () => void }) {
  async function handleConfirm() {
    await submitLabel(item.agentId, item.candidate.id, "confirm");
    onActionTaken();
  }
  async function handleOverride(verdict: SessionVerdict, note?: string) {
    void verdict;
    await submitLabel(item.agentId, item.candidate.id, "override", note);
    onActionTaken();
  }
  return <LabelingCandidateCard candidate={item.candidate} onConfirm={handleConfirm} onOverride={handleOverride} />;
}

/**
 * One row in the Home inbox: an agent with at least one thing needing a
 * decision. Collapsed shows severity + a one-line summary; expanded renders
 * every item inline with its action control, so a decision can be made
 * without leaving Home (REQ: agent-score-app Home redesign, see
 * plans/2026-08-03-agentscore-app-home-inbox.md).
 */
export default function InboxAgentRow({
  group,
  navigate,
  onActionTaken,
}: {
  group: AgentInboxGroup;
  navigate: (v: View) => void;
  onActionTaken: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const critical = group.severity === "critical";
  // A critical row always leads with the specific reason (nothing is more
  // scannable than "what's actually wrong"); a warning row with more than
  // one thing flagged collapses to a count instead, since there's no single
  // dominant reason worth privileging over the others.
  const summary = critical || group.items.length === 1 ? group.topReason : `${group.items.length} items flagged`;

  return (
    <Fragment>
      <Box
        onClick={() => setExpanded((e) => !e)}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          px: 2,
          py: 1.5,
          cursor: "pointer",
          "&:hover": { bgcolor: "action.hover" },
          bgcolor: expanded ? "action.selected" : undefined,
        }}
      >
        <Box
          sx={{
            width: 9,
            height: 9,
            borderRadius: "50%",
            bgcolor: critical ? "error.main" : "warning.main",
            flexShrink: 0,
          }}
        />
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {group.agentName}
            </Typography>
            <AgentTypeTag type={group.agentType} />
          </Box>
          <Typography variant="body2" sx={{ color: critical ? "error.main" : "text.secondary", fontWeight: critical ? 600 : 400 }}>
            {summary}
          </Typography>
        </Box>
        <ChevronIcon open={expanded} />
      </Box>

      {expanded && (
        <Box sx={{ px: 2, pb: 2.5, pt: 0.5, bgcolor: "action.hover", display: "flex", flexDirection: "column", gap: 1.5 }}>
          {group.items.map((item) =>
            item.kind === "session" ? (
              <SessionItemCard key={item.session.id} item={item} onActionTaken={onActionTaken} navigate={navigate} />
            ) : (
              <LabelingItemCard key={item.candidate.id} item={item} onActionTaken={onActionTaken} />
            ),
          )}

          {group.hiddenSessionCount > 0 && (
            <Typography variant="caption" sx={{ color: "text.disabled" }}>
              +{group.hiddenSessionCount} more flagged session{group.hiddenSessionCount > 1 ? "s" : ""} in this run — see the
              Scoring tab for full history.
            </Typography>
          )}

          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              size="small"
              variant="text"
              onClick={(e) => {
                e.stopPropagation();
                navigate({ name: "agent-overview", agentId: group.agentId });
              }}
              sx={{ color: "primary.main", fontSize: "0.72rem" }}
            >
              Open agent →
            </Button>
          </Box>
        </Box>
      )}
    </Fragment>
  );
}
