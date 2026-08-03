import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import type { Agent } from "../../types";
import AgentTypeTag from "../../components/shared/AgentTypeTag";

function formatCreatedDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** Agent identity header: name, type tag, kind, live status, creation date (REQ-067). */
export default function AgentHeader({ agent }: { agent: Agent }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {agent.name}
        </Typography>
        <AgentTypeTag type={agent.agentType} />
        <Chip
          label={agent.kind}
          size="small"
          variant="outlined"
          sx={{ height: 20, fontSize: "0.7rem", textTransform: "capitalize" }}
        />
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Box
            sx={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              bgcolor: agent.isLive ? "success.main" : "text.disabled",
              flexShrink: 0,
            }}
          />
          <Typography variant="caption" sx={{ color: agent.isLive ? "success.main" : "text.disabled", fontWeight: 600 }}>
            {agent.isLive ? "Live" : "Inactive"}
          </Typography>
        </Box>
      </Box>
      <Typography variant="caption" sx={{ color: "text.secondary" }}>
        Created {formatCreatedDate(agent.created_at)}
      </Typography>
    </Box>
  );
}
