import Box from "@mui/material/Box";
import type { ReactNode } from "react";

export type Tint = "default" | "muted" | "info" | "success" | "warning" | "destructive" | "outline";

interface TintChipProps {
  label: ReactNode;
  tint?: Tint;
  icon?: ReactNode;
}

// Mirrors the production back office's `Chip` - a plain pill, not MUI's
// `Chip` - since every table in the registry/access-requests/reports areas
// is built against this tint vocabulary.
const TINT_SX: Record<Tint, { bgcolor: string; color: string; border?: string }> = {
  default: { bgcolor: "action.selected", color: "text.primary" },
  muted: { bgcolor: "action.hover", color: "text.secondary" },
  info: { bgcolor: "info.main", color: "info.contrastText" },
  success: { bgcolor: "success.main", color: "success.contrastText" },
  warning: { bgcolor: "warning.main", color: "warning.contrastText" },
  destructive: { bgcolor: "error.main", color: "error.contrastText" },
  outline: { bgcolor: "transparent", color: "text.secondary", border: "1px solid" },
};

export default function TintChip({ label, tint = "default", icon }: TintChipProps) {
  const sx = TINT_SX[tint];
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        px: 1,
        py: 0.25,
        borderRadius: 10,
        fontSize: "0.7rem",
        fontWeight: 600,
        lineHeight: 1.6,
        whiteSpace: "nowrap",
        borderColor: "divider",
        ...sx,
      }}
    >
      {icon}
      {label}
    </Box>
  );
}

export function ChipStrip({ children }: { children: ReactNode }) {
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
      {children}
    </Box>
  );
}
