import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import { alpha, keyframes, type Theme } from "@mui/material/styles";

const pulseKeyframes = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
`;

type Status = "success" | "warning" | "destructive" | "muted" | "info";

function dotColor(theme: Theme, status: Status): string {
  switch (status) {
    case "success":
      return theme.palette.success.main;
    case "warning":
      return theme.palette.warning.main;
    case "destructive":
      return theme.palette.error.main;
    case "info":
      return theme.palette.primary.main;
    case "muted":
      // ≥3:1 against the surface (WCAG 1.4.11 non-text contrast). With the
      // AA-corrected #52525B secondary, alpha 0.7 lands ~3.5:1 while
      // still reading as a de-emphasized/inactive gray dot.
      return alpha(theme.palette.text.secondary, 0.7);
  }
}

function labelColor(status: Status): string {
  switch (status) {
    case "destructive":
      return "error.main";
    case "muted":
      return "text.secondary";
    case "success":
    case "warning":
    case "info":
      return "text.primary";
  }
}

interface StatusDotProps
  extends Omit<React.ComponentProps<"span">, "children"> {
  status?: Status;
  /** The label rendered after the dot. */
  children: ReactNode;
  /** Animate the dot (for transient states like `provisioning`). */
  pulse?: boolean;
}

/**
 * Tiny colored dot + label. Used everywhere we surface a row-level status
 * (Active / Dormant / Disabled, provisioning_status, trace status, etc.).
 */
export function StatusDot({
  status = "muted",
  children,
  pulse,
  className,
  ...rest
}: StatusDotProps) {
  return (
    <Box
      component="span"
      data-slot="status-dot"
      data-status={status}
      className={className}
      sx={{ display: "inline-flex", alignItems: "center", gap: 0.75 }}
      {...rest}
    >
      <Box
        component="span"
        aria-hidden
        data-pulse={pulse || undefined}
        sx={(theme) => ({
          width: 6,
          height: 6,
          flexShrink: 0,
          borderRadius: 9999,
          bgcolor: dotColor(theme, status),
          ...(pulse
            ? { animation: `${pulseKeyframes} 2s ease-in-out infinite` }
            : {}),
        })}
      />
      <Box
        component="span"
        sx={{ typography: "caption", lineHeight: 1.625, color: labelColor(status) }}
      >
        {children}
      </Box>
    </Box>
  );
}
