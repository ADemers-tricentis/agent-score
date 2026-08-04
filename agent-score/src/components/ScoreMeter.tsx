import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { scoreHex } from "../data/verdict";

interface Props {
  score: number | null;
  size?: number;
  label?: string;
}

export default function ScoreMeter({ score, size = 96, label }: Props) {
  const r = (size - 10) / 2;
  const circumference = 2 * Math.PI * r;
  const pct = score != null ? Math.max(0, Math.min(100, score)) : 0;
  const dashOffset = circumference * (1 - pct / 100);
  const color = score != null ? scoreHex(score) : "#363d5c";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
      <Box sx={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="#1a1f3a"
            strokeWidth={8}
          />
          {/* Progress */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={8}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.6s ease, stroke 0.3s ease" }}
          />
        </svg>
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography
            sx={{
              fontSize: size >= 96 ? "1.75rem" : "1.1rem",
              fontWeight: 700,
              color: score != null ? color : "text.disabled",
              lineHeight: 1,
            }}
          >
            {score != null ? score : "—"}
          </Typography>
          {size >= 96 && (
            <Typography variant="caption" sx={{ color: "text.disabled", fontSize: "0.65rem" }}>
              /100
            </Typography>
          )}
        </Box>
      </Box>
      {label && (
        <Typography variant="caption" sx={{ color: "text.secondary", textAlign: "center" }}>
          {label}
        </Typography>
      )}
    </Box>
  );
}
