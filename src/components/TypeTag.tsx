import Tag from "@tricentis/aura/components/Tag.js";
import type { ProjectType } from "../types";

const COLORS: Record<ProjectType, { bg: string; color: string }> = {
  ATA: { bg: "#1a1b3a", color: "#818cf8" },
  ATC: { bg: "#1a2e1a", color: "#4ade80" },
  CURA: { bg: "#2e1a2e", color: "#c084fc" },
  AI_WORKSPACE: { bg: "#1a2a2e", color: "#38bdf8" },
  CODING: { bg: "#2e2a1a", color: "#fbbf24" },
  APT: { bg: "#2e1a1a", color: "#f87171" },
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
  const { bg, color } = COLORS[type];
  return (
    <Tag
      label={LABELS[type]}
      sx={{
        bgcolor: bg,
        color,
        fontWeight: 600,
        fontSize: "0.68rem",
        letterSpacing: "0.03em",
        height: 20,
        border: `1px solid ${color}22`,
      }}
    />
  );
}
