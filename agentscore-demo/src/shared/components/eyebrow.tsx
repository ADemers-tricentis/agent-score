import type { ReactNode } from "react";
import Typography from "@mui/material/Typography";

interface EyebrowProps {
  children: ReactNode;
  className?: string;
}

/**
 * Uppercase muted caption ("eyebrow") above a heading or section value. One
 * canonical treatment (TOK-3) so App / AgentOverview / ScoringRunResult stop
 * hand-rolling their own uppercase-caption sx.
 */
export function Eyebrow({ children, className }: EyebrowProps) {
  return (
    <Typography
      variant="overline"
      component="div"
      data-slot="eyebrow"
      className={className}
      sx={{ color: "text.secondary" }}
    >
      {children}
    </Typography>
  );
}
