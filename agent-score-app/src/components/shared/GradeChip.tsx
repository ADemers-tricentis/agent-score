import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { Grade } from "../../types";

const GRADE_COLORS: Record<Grade, { muiColor: string; hex: string }> = {
  A: { muiColor: "success", hex: "#4ade80" },
  B: { muiColor: "success", hex: "#86efac" },
  C: { muiColor: "warning", hex: "#fbbf24" },
  D: { muiColor: "warning", hex: "#fb923c" },
  F: { muiColor: "error", hex: "#f38080" },
};

/** A-F grade chip. `grade={null}` renders a neutral placeholder for locked/ungraded agents. */
export default function GradeChip({
  grade,
  size = "medium",
}: {
  grade: Grade | null;
  size?: "small" | "medium" | "large";
}) {
  const dim = size === "large" ? 48 : size === "small" ? 26 : 36;
  const fontSize = size === "large" ? "1.4rem" : size === "small" ? "0.75rem" : "1rem";

  if (!grade) {
    return (
      <Box
        sx={{
          width: dim,
          height: dim,
          borderRadius: 1.5,
          bgcolor: "action.selected",
          border: "1px solid",
          borderColor: "divider",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Typography sx={{ fontSize, fontWeight: 800, color: "text.disabled", lineHeight: 1 }}>—</Typography>
      </Box>
    );
  }

  const { muiColor, hex } = GRADE_COLORS[grade];
  return (
    <Box
      sx={{
        width: dim,
        height: dim,
        borderRadius: 1.5,
        bgcolor: `rgba(var(--mui-palette-${muiColor}-mainChannel) / 0.15)`,
        border: `1px solid rgba(var(--mui-palette-${muiColor}-mainChannel) / 0.3)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Typography sx={{ fontSize, fontWeight: 800, color: hex, lineHeight: 1 }}>{grade}</Typography>
    </Box>
  );
}
