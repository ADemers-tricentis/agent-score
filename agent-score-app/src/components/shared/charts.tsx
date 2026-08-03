import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

/** Small inline sparkline for a KPI card sub-value. */
export function Sparkline({ points, color = "#4ade80", width = 80, height = 24 }: { points: number[]; color?: string; width?: number; height?: number }) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const pts = points
    .map((v, i) => {
      const x = (i / (points.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} />
    </svg>
  );
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** 7-day multi-series trend chart used by the verdict distribution panel (REQ-057). */
export function TrendChart({ series }: { series: { data: number[]; color: string }[] }) {
  const W = 360;
  const H = 100;
  const allVals = series.flatMap((s) => s.data);
  const max = Math.max(...allVals, 1);
  const padT = 8;
  const padB = 8;
  const chartH = H - padT - padB;

  function makePath(data: number[], color: string) {
    const d = data
      .map((v, i) => {
        const x = (i / (data.length - 1)) * W;
        const y = padT + chartH - (v / max) * chartH;
        return `${i === 0 ? "M" : "L"}${x},${y}`;
      })
      .join(" ");
    return <path key={color} d={d} fill="none" stroke={color} strokeWidth={1.5} />;
  }

  return (
    <Box>
      <svg width={W} height={H} style={{ display: "block", width: "100%", maxWidth: W }}>
        {series.map((s) => makePath(s.data, s.color))}
      </svg>
      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.5 }}>
        {DAY_LABELS.map((d) => (
          <Typography key={d} variant="caption" sx={{ color: "text.disabled", fontSize: "0.6rem" }}>
            {d}
          </Typography>
        ))}
      </Box>
    </Box>
  );
}
