import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { PreviewRole } from "../types";

interface Props {
  tenantId: string;
  previewRole: PreviewRole;
}

export default function ReportsView({ tenantId: _tenantId, previewRole: _previewRole }: Props) {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>Reports</Typography>
      <Typography variant="body2" sx={{ color: "text.secondary" }}>TODO</Typography>
    </Box>
  );
}
