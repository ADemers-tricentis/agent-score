import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import SvgIcon from "@mui/material/SvgIcon";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: string; // an SVG path
  title: string;
  description?: string;
  action?: ReactNode;
  testId?: string;
}

export default function EmptyState({ icon, title, description, action, testId }: EmptyStateProps) {
  return (
    <Box
      data-testid={testId}
      sx={{ py: 5, display: "flex", flexDirection: "column", alignItems: "center", gap: 1.25, textAlign: "center" }}
    >
      {icon && (
        <SvgIcon sx={{ fontSize: "2.25rem", color: "text.disabled" }}>
          <path d={icon} />
        </SvgIcon>
      )}
      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "text.secondary" }}>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" sx={{ color: "text.disabled", maxWidth: 420 }}>
          {description}
        </Typography>
      )}
      {action}
    </Box>
  );
}

interface NotFoundStateProps {
  entity: string;
  description?: string;
  action?: ReactNode;
  testId?: string;
}

const NOT_FOUND_ICON =
  "M11 2a9 9 0 1 0 5.29 16.29l4.7 4.7 1.41-1.41-4.7-4.7A9 9 0 0 0 11 2zm0 2a7 7 0 1 1 0 14 7 7 0 0 1 0-14z";

export function NotFoundState({ entity, description, action, testId = "not-found" }: NotFoundStateProps) {
  return (
    <EmptyState
      icon={NOT_FOUND_ICON}
      title={`${entity} not found`}
      description={description}
      action={action}
      testId={testId}
    />
  );
}
