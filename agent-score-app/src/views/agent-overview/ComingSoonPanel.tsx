import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

/** Placeholder for tabs not built this milestone (Traces, Scoring, Labeling, Settings). */
export default function ComingSoonPanel({ tabName }: { tabName: string }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 10, gap: 1 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "text.secondary" }}>
        {tabName} is coming soon
      </Typography>
      <Typography variant="caption" sx={{ color: "text.disabled" }}>
        This tab isn't built yet in this milestone.
      </Typography>
    </Box>
  );
}
