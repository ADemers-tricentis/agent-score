import Tag from "@tricentis/aura/components/Tag.js";
import type { ProjectType } from "../types";

const COLORS: Record<ProjectType, { muiColor: string; hex: string }> = {
  ATA: { muiColor: "primary", hex: "#818cf8" },
  ATC: { muiColor: "success", hex: "#4ade80" },
  CURA: { muiColor: "secondary", hex: "#c084fc" },
  AI_WORKSPACE: { muiColor: "info", hex: "#38bdf8" },
  CODING: { muiColor: "warning", hex: "#fbbf24" },
  APT: { muiColor: "error", hex: "#f87171" },
};

const LABELS: Record<ProjectType, string> = {
  ATA: "ATA",
  ATC: "ATC",
  CURA: "CURA",
  AI_WORKSPACE: "AI Workspace",
  CODING: "Coding",
  APT: "APT",
};

interface Props {
  type: ProjectType;
}

export default function TypeTag({ type }: Props) {
  const { muiColor, hex } = COLORS[type];
  return (
    <Tag
      label={LABELS[type]}
      sx={{
        bgcolor: `rgba(var(--mui-palette-${muiColor}-mainChannel) / 0.12)`,
        border: `1px solid rgba(var(--mui-palette-${muiColor}-mainChannel) / 0.3)`,
        fontWeight: 600,
        fontSize: "0.68rem",
        letterSpacing: "0.03em",
        height: 20,
        "& .MuiChip-label": { color: hex },
      }}
    />
  );
}
