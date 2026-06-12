import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

interface Props {
  grade: "A" | "B" | "C" | "D" | "F";
  size?: "small" | "medium" | "large";
}

const GRADE_COLORS: Record<string, { bg: string; color: string }> = {
  A: { bg: "#14532d", color: "#4ade80" },
  B: { bg: "#1c3a1c", color: "#86efac" },
  C: { bg: "#422006", color: "#fbbf24" },
  D: { bg: "#431407", color: "#fb923c" },
  F: { bg: "#450a0a", color: "#f87171" },
};

export default function GradeChip({ grade, size = "medium" }: Props) {
  const cfg = GRADE_COLORS[grade];
  const dim = size === "large" ? 48 : size === "small" ? 26 : 36;
  const fontSize = size === "large" ? "1.4rem" : size === "small" ? "0.75rem" : "1rem";

  return (
    <Box
      sx={{
        width: dim,
        height: dim,
        borderRadius: 1.5,
        bgcolor: cfg.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Typography sx={{ fontSize, fontWeight: 800, color: cfg.color, lineHeight: 1 }}>
        {grade}
      </Typography>
    </Box>
  );
}
