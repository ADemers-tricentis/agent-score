import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import { alpha, type CSSObject, type Theme } from "@mui/material/styles";

export type ChatRole = "system" | "user" | "assistant" | "tool" | "tool_call";

// Role → badge fill + text, resolved against the active theme (stock semantic
// slots per spec §4.8). `tool`/`tool_call` use success/warning tints.
function roleBadgeStyle(theme: Theme, role: ChatRole): CSSObject {
  switch (role) {
    case "user":
      return {
        backgroundColor: alpha(theme.palette.primary.main, 0.15),
        color: theme.palette.primary.main,
      };
    case "tool":
      return {
        backgroundColor: alpha(theme.palette.success.main, 0.15),
        color: theme.palette.success.main,
      };
    case "tool_call":
      return {
        backgroundColor: alpha(theme.palette.warning.main, 0.2),
        color: theme.palette.warning.main,
      };
    case "system":
    case "assistant":
      return {
        backgroundColor: theme.palette.action.hover,
        color: alpha(theme.palette.text.primary, 0.8),
      };
  }
}

interface RoleContentBlockProps {
  role: ChatRole;
  /** Token count or other muted metadata shown next to the role badge. */
  meta?: ReactNode;
  /** Secondary label after the role badge (e.g. tool name "lookup-order"). */
  subLabel?: ReactNode;
  /** Block body. When `mono` is true, content renders inside a `<pre>`. */
  children: ReactNode;
  /** Render the body as preformatted mono text (for JSON / tool args). */
  mono?: boolean;
  className?: string;
}

/**
 * Role-tagged content block for LLM call rendering. Header row carries the
 * role badge + meta; body holds the prompt / completion / tool call payload.
 */
export function RoleContentBlock({
  role,
  meta,
  subLabel,
  children,
  mono = false,
  className,
}: RoleContentBlockProps) {
  return (
    <Box
      data-slot="role-content-block"
      data-role={role}
      className={className}
      sx={{
        overflow: "hidden",
        borderRadius: 1,
        border: 1,
        borderColor: "divider",
      }}
    >
      <Box
        sx={(theme) => ({
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 1,
          borderBottom: 1,
          borderColor: alpha(theme.palette.divider, 0.6),
          bgcolor: alpha(theme.palette.action.hover, 0.4),
          px: 1.5,
          py: 0.75,
          typography: "caption",
        })}
      >
        <Box
          component="span"
          sx={(theme) => ({
            borderRadius: 0.5,
            px: 0.75,
            py: 0.25,
            typography: "overline",
            fontFamily: "monospace",
            ...roleBadgeStyle(theme, role),
          })}
        >
          {role}
        </Box>
        {subLabel ? (
          <Box
            component="span"
            sx={{ fontFamily: "monospace", color: "text.secondary" }}
          >
            {subLabel}
          </Box>
        ) : null}
        {meta !== undefined && meta !== null ? (
          <Box component="span" sx={{ color: "text.secondary" }}>
            {meta}
          </Box>
        ) : null}
      </Box>
      {mono ? (
        <Box
          component="pre"
          sx={{
            overflowX: "auto",
            whiteSpace: "pre-wrap",
            px: 1.5,
            py: 1,
            m: 0,
            fontFamily: "monospace",
            typography: "caption",
          }}
        >
          {children}
        </Box>
      ) : (
        <Box sx={{ px: 1.5, py: 1, typography: "caption" }}>{children}</Box>
      )}
    </Box>
  );
}
