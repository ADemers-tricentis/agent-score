import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import type { ReactNode } from "react";
import type { AgentKind, AgentType, FingerprintMatch } from "../../types";
import AgentTypeTag from "../../components/shared/AgentTypeTag";

const KIND_LABELS: Record<AgentKind, string> = {
  external: "External",
  internal: "Internal",
};

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", py: 1 }}>
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        {label}
      </Typography>
      <Box>{value}</Box>
    </Box>
  );
}

/**
 * Step 4 of the Add Agent wizard: a summary of what's about to be launched.
 * The agent record itself was already created back in StepWaitingForTraces,
 * so "Launch" here is just navigation.
 */
export default function StepReviewLaunch({
  name,
  agentType,
  kind,
  fingerprintMatch,
}: {
  name: string;
  agentType: AgentType;
  kind: AgentKind;
  fingerprintMatch: FingerprintMatch | null;
}) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        Review your agent's setup before launching it into AgentScore.
      </Typography>

      <Paper sx={{ p: 2.5, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
        <Row label="Name" value={<Typography variant="body2" sx={{ fontWeight: 600 }}>{name}</Typography>} />
        <Divider />
        <Row label="Type" value={<AgentTypeTag type={agentType} />} />
        <Divider />
        <Row label="Kind" value={<Typography variant="body2">{KIND_LABELS[kind]}</Typography>} />
        <Divider />
        <Row
          label="Fingerprint match"
          value={
            fingerprintMatch ? (
              <Typography variant="body2">
                {fingerprintMatch.profileName} ({fingerprintMatch.confidence}%)
              </Typography>
            ) : (
              <Typography variant="body2" sx={{ color: "text.disabled" }}>
                Not yet matched
              </Typography>
            )
          }
        />
      </Paper>
    </Box>
  );
}
