import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import ChipStatus from "@tricentis/aura/components/ChipStatus.js";
import { AGENT_REGISTRY_SLOTS } from "../data/mock";

export default function AgentRegistryView() {
  return (
    <Box sx={{ p: 3, maxWidth: 900 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
        Agent Registry
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 3, maxWidth: 620 }}>
        The AI task slots powering your scoring. AgentScore itself is an agentic system — these are
        the specialized tasks it runs behind the scenes, and which model is currently bound to each one.
      </Typography>

      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 2 }}>
        {AGENT_REGISTRY_SLOTS.map((slot) => (
          <Paper
            key={slot.id}
            sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 2 }}
          >
            <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, pr: 1 }}>
                {slot.name}
              </Typography>
              <ChipStatus status={slot.status === "live" ? "Active" : "Failed"} />
            </Box>
            <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 1.5 }}>
              {slot.description}
            </Typography>
            <Typography variant="caption" sx={{ fontFamily: "monospace", color: "text.disabled" }}>
              {slot.model}
            </Typography>
          </Paper>
        ))}
      </Box>
    </Box>
  );
}
