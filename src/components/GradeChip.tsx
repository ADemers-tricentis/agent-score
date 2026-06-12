import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

interface Props {
  grade: "A" | "B" | "C" | "D" | "F";
  size?: "small" | "medium" | "large";
}

const GRADE_COLORS: Record<string, { muiColor: string; hex: string }> = {
  A: { muiColor: "success", hex: "#4ade80" },
  B: { muiColor: "success", hex: "#86efac" },
  C: { muiColor: "warning", hex: "#fbbf24" },
  D: { muiColor: "warning", hex: "#fb923c" },
  F: { muiColor: "error", hex: "#f87171" },
};

export default function GradeChip({ grade, size = "medium" }: Props) {
  const { muiColor, hex } = GRADE_COLORS[grade];
  const dim = size === "large" ? 48 : size === "small" ? 26 : 36;
  const fontSize = size === "large" ? "1.4rem" : size === "small" ? "0.75rem" : "1rem";

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
      <Typography sx={{ fontSize, fontWeight: 800, color: hex, lineHeight: 1 }}>
        {grade}
      </Typography>
    </Box>
  );
}
