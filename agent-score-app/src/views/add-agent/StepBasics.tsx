import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import ToggleButton from "@mui/material/ToggleButton";
import type { AgentKind, AgentType } from "../../types";

const AGENT_TYPES: AgentType[] = ["ATA", "ATC", "CURA", "AI_WORKSPACE", "CODING", "APT"];

const TYPE_COLORS: Record<AgentType, { muiColor: string; hex: string }> = {
  ATA: { muiColor: "primary", hex: "#818cf8" },
  ATC: { muiColor: "success", hex: "#4ade80" },
  CURA: { muiColor: "secondary", hex: "#c084fc" },
  AI_WORKSPACE: { muiColor: "info", hex: "#38bdf8" },
  CODING: { muiColor: "warning", hex: "#fbbf24" },
  APT: { muiColor: "error", hex: "#f87171" },
};

const TYPE_LABELS: Record<AgentType, string> = {
  ATA: "ATA",
  ATC: "ATC",
  CURA: "CURA",
  AI_WORKSPACE: "AI Workspace",
  CODING: "Coding",
  APT: "APT",
};

const TYPE_DESCRIPTIONS: Record<AgentType, string> = {
  ATA: "Automated Test Agent",
  ATC: "Test Case Generation",
  CURA: "Diagnostic Agent",
  AI_WORKSPACE: "AI Workspace Assistant",
  CODING: "Coding Assistant",
  APT: "Performance Testing",
};

/**
 * Step 1 of the Add Agent wizard: name, agent type (card grid), and kind
 * (external/internal toggle). "Next" on the parent is gated on name + type
 * both being set.
 */
export default function StepBasics({
  name,
  onNameChange,
  agentType,
  onAgentTypeChange,
  kind,
  onKindChange,
}: {
  name: string;
  onNameChange: (value: string) => void;
  agentType: AgentType | null;
  onAgentTypeChange: (value: AgentType) => void;
  kind: AgentKind;
  onKindChange: (value: AgentKind) => void;
}) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <TextField
        label="Agent name"
        placeholder="e.g. Checkout Flow Tester"
        fullWidth
        required
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
      />

      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
          Agent type
        </Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1.5 }}>
          {AGENT_TYPES.map((type) => {
            const selected = agentType === type;
            const { muiColor, hex } = TYPE_COLORS[type];
            return (
              <Paper
                key={type}
                onClick={() => onAgentTypeChange(type)}
                sx={{
                  p: 2,
                  cursor: "pointer",
                  border: "1px solid",
                  borderColor: selected ? hex : "divider",
                  borderRadius: 2,
                  bgcolor: selected ? `rgba(var(--mui-palette-${muiColor}-mainChannel) / 0.12)` : "background.paper",
                  transition: "border-color 0.15s, background-color 0.15s",
                  "&:hover": { borderColor: hex },
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 700, color: selected ? hex : "text.primary" }}>
                  {TYPE_LABELS[type]}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  {TYPE_DESCRIPTIONS[type]}
                </Typography>
              </Paper>
            );
          })}
        </Box>
      </Box>

      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
          Kind
        </Typography>
        <ToggleButtonGroup
          value={kind}
          exclusive
          size="small"
          onChange={(_, v: AgentKind | null) => v && onKindChange(v)}
        >
          <ToggleButton value="external" sx={{ textTransform: "none", px: 2 }}>
            External
          </ToggleButton>
          <ToggleButton value="internal" sx={{ textTransform: "none", px: 2 }}>
            Internal
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
    </Box>
  );
}
