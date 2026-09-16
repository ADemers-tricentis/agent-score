import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import FormSection from "./FormSection";

interface DangerZoneRowProps {
  title: string;
  description: string;
  action: ReactNode;
}

function Row({ title, description, action }: DangerZoneRowProps) {
  return (
    <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2, py: 1.5 }}>
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>{title}</Typography>
        <Typography variant="caption" sx={{ color: "text.secondary", display: "block", maxWidth: 480 }}>
          {description}
        </Typography>
      </Box>
      <Box sx={{ flexShrink: 0 }}>{action}</Box>
    </Box>
  );
}

interface DangerZoneProps {
  children: ReactNode;
}

function DangerZone({ children }: DangerZoneProps) {
  return (
    <FormSection title="Danger zone" tone="destructive">
      {children}
    </FormSection>
  );
}

DangerZone.Row = Row;

export default DangerZone;
