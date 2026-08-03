import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

/**
 * Small KPI tile. Below the readiness threshold, pass `locked` to show a
 * dash and the "Unlocks at N traces" label instead of a value (REQ-065/068).
 */
export default function StatCard({
  label,
  value,
  sub,
  locked,
}: {
  label: string;
  value?: ReactNode;
  sub?: ReactNode;
  locked?: { threshold: number };
}) {
  return (
    <Paper sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
      <Typography variant="overline" sx={{ color: "text.disabled", fontSize: "0.62rem", letterSpacing: 1, display: "block", mb: 0.75 }}>
        {label}
      </Typography>
      {locked ? (
        <>
          <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1, color: "text.disabled" }}>
            —
          </Typography>
          <Typography variant="caption" sx={{ color: "text.disabled", display: "block", mt: 0.75 }}>
            Unlocks at {locked.threshold} traces
          </Typography>
        </>
      ) : (
        <>
          <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1 }}>
              {value}
            </Typography>
          </Box>
          {sub && <Box sx={{ mt: 0.75 }}>{sub}</Box>}
        </>
      )}
    </Paper>
  );
}
