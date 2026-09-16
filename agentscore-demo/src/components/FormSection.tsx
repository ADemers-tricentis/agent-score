import type { ReactNode } from "react";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

interface FormSectionProps {
  title: string;
  description?: string;
  tone?: "default" | "destructive";
  bare?: boolean;
  children: ReactNode;
}

export default function FormSection({ title, description, tone = "default", bare = false, children }: FormSectionProps) {
  const body = (
    <>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: tone === "destructive" ? "error.main" : "text.primary" }}>
        {title}
      </Typography>
      {description && (
        <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 2, mt: 0.25 }}>
          {description}
        </Typography>
      )}
      <Box sx={{ mt: description ? 0 : 1.5 }}>{children}</Box>
    </>
  );

  if (bare) return <Box>{body}</Box>;

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.5,
        borderRadius: 1.5,
        borderColor: tone === "destructive" ? "error.main" : "divider",
      }}
    >
      {body}
    </Paper>
  );
}
