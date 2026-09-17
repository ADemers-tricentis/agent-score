import type { ComponentType, ReactNode } from "react";
import Box from "@mui/material/Box";
import { alpha, type CSSObject, type SxProps, type Theme } from "@mui/material/styles";

type Tint =
  | "default"
  | "muted"
  | "info"
  | "success"
  | "warning"
  | "destructive"
  | "outline";

// Tint → fill + text, resolved against the active theme (stock semantic slots
// per spec §4.8; subtle neutral fill via `action.hover`).
function tintStyle(theme: Theme, tint: Tint): CSSObject {
  switch (tint) {
    case "default":
      return {
        backgroundColor: theme.palette.action.hover,
        color: theme.palette.text.primary,
      };
    case "muted":
      return {
        backgroundColor: theme.palette.action.hover,
        color: theme.palette.text.secondary,
      };
    case "info":
      return {
        backgroundColor: alpha(theme.palette.primary.main, 0.1),
        color: theme.palette.primary.main,
      };
    case "success":
      return {
        backgroundColor: alpha(theme.palette.success.main, 0.15),
        color: theme.palette.success.main,
      };
    case "warning":
      return {
        backgroundColor: alpha(theme.palette.warning.main, 0.15),
        color: theme.palette.warning.main,
      };
    case "destructive":
      return {
        backgroundColor: alpha(theme.palette.error.main, 0.15),
        color: theme.palette.error.main,
      };
    case "outline":
      return {
        border: `1px solid ${theme.palette.divider}`,
        color: theme.palette.text.primary,
      };
  }
}

interface ChipProps
  extends Omit<React.ComponentProps<"span">, "children" | "color"> {
  /** Optional Lucide-style icon component rendered at 12px before the label. */
  icon?: ComponentType<{ className?: string }>;
  tint?: Tint;
  /** Extra styles merged after the base + tint — e.g. a custom accent tint
   *  (`bgcolor`/`color`) or a one-off `fontSize`. Wins over the default tint. */
  sx?: SxProps<Theme>;
  children: ReactNode;
}

/**
 * Icon-prefixed metadata pill. Used in entity headers and span chip strips
 * per the back-office UI design reference. Pair with `<ChipStrip>` to group.
 */
export function Chip({
  icon: Icon,
  tint = "default",
  className,
  sx,
  children,
  ...rest
}: ChipProps) {
  return (
    <Box
      component="span"
      data-slot="chip"
      data-tint={tint}
      className={className}
      sx={[
        (theme) => ({
          display: "inline-flex",
          alignItems: "center",
          gap: 0.5,
          borderRadius: 1,
          px: 0.75,
          py: 0.25,
          typography: "caption",
          whiteSpace: "nowrap",
          "& svg": { width: 12, height: 12, flexShrink: 0 },
          ...tintStyle(theme, tint),
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...rest}
    >
      {Icon ? <Icon /> : null}
      <span>{children}</span>
    </Box>
  );
}

interface ChipStripProps extends React.ComponentProps<"div"> {
  /** Extra styles merged after the base — e.g. a margin or a wider gap. */
  sx?: SxProps<Theme>;
  children: ReactNode;
}

/**
 * Flex container that groups `<Chip>`s with consistent spacing + wrapping.
 */
export function ChipStrip({ className, sx, children, ...rest }: ChipStripProps) {
  return (
    <Box
      data-slot="chip-strip"
      className={className}
      sx={[
        { display: "flex", flexWrap: "wrap", alignItems: "center", gap: 0.75 },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...rest}
    >
      {children}
    </Box>
  );
}
