import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

function scoreColor(score: number): string {
  if (score >= 75) return "#22c55e";
  if (score >= 55) return "#f59e0b";
  return "#ef4444";
}

/**
 * Circular composite-score meter. Below the readiness threshold, pass
 * `locked` with trace progress instead of a score (REQ-065): the ring shows
 * trace-collection progress and the center shows "x/N" rather than a score.
 */
export default function ScoreRing({
  score,
  size = 96,
  label,
  locked,
}: {
  score: number | null;
  size?: number;
  label?: string;
  locked?: { captured: number; threshold: number };
}) {
  const r = (size - 10) / 2;
  const circumference = 2 * Math.PI * r;

  const pct = locked ? Math.min(100, (locked.captured / locked.threshold) * 100) : score != null ? Math.max(0, Math.min(100, score)) : 0;
  const dashOffset = circumference * (1 - pct / 100);
  const color = locked ? "#6b7280" : score != null ? scoreColor(score) : "#363d5c";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
      <Box sx={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1a1f3a" strokeWidth={8} />
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
        <Box sx={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          {locked ? (
            <>
              <Typography sx={{ fontSize: size >= 96 ? "1.1rem" : "0.85rem", fontWeight: 700, color: "text.secondary", lineHeight: 1 }}>
                {locked.captured}/{locked.threshold}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.disabled", fontSize: "0.6rem", mt: 0.25 }}>
                traces
              </Typography>
            </>
          ) : (
            <>
              <Typography sx={{ fontSize: size >= 96 ? "1.75rem" : "1.1rem", fontWeight: 700, color: score != null ? color : "text.disabled", lineHeight: 1 }}>
                {score != null ? score : "—"}
              </Typography>
              {size >= 96 && (
                <Typography variant="caption" sx={{ color: "text.disabled", fontSize: "0.65rem" }}>
                  /100
                </Typography>
              )}
            </>
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
