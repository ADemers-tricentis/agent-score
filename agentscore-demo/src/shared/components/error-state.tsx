import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import type SvgIcon from "@mui/material/SvgIcon";
import IconMaterialSymbolsWarning from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsWarning.mjs";

interface ErrorStateProps {
  /** The envelope `message` — the human-readable failure reason. */
  message?: ReactNode;
  /** The envelope `code` — rendered in monospace when present. */
  code?: string;
  /** Heading line. Defaults to "Something went wrong". */
  title?: ReactNode;
  /** Override the default warning icon. */
  icon?: typeof SvgIcon;
  /** Optional stable hook for a caller embedding several error-capable
   *  sections on one page that needs to scope a query to just this one
   *  (mirrors `EmptyState`'s `testId`). Falls back to the default
   *  `"error-state"` hook when omitted, so existing e2e/component tests
   *  keying on the untagged default keep resolving. */
  testId?: string;
  className?: string;
}

/**
 * Compact, inline section-level load-error state — surfaces the `{code, message}`
 * envelope when a query path fails (per frontend-ux §"State & feedback": no silent
 * failures). Sits inside the failing section rather than taking over the page
 * (unlike `NotFoundState`). Carries `data-testid="error-state"` for e2e by
 * default, or the caller's own `testId` when one is passed.
 */
export function ErrorState({
  message,
  code,
  title = "Something went wrong",
  icon: Icon = IconMaterialSymbolsWarning,
  testId = "error-state",
  className,
}: ErrorStateProps) {
  return (
    <Box
      data-testid={testId}
      data-slot="error-state"
      className={className}
      sx={{ display: "flex", alignItems: "flex-start", gap: 1, color: "text.secondary" }}
    >
      <Box
        component="span"
        sx={{ display: "inline-flex", flexShrink: 0, color: "error.main", mt: 0.125 }}
      >
        <Icon sx={{ fontSize: 16 }} />
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25, minWidth: 0 }}>
        <Box sx={{ typography: "body1", fontWeight: 500, color: "error.main" }}>
          {title}
        </Box>
        {message ? (
          <Box sx={{ typography: "body2", lineHeight: 1.625, color: "text.secondary" }}>
            {message}
          </Box>
        ) : null}
        {code ? (
          <Box
            component="code"
            data-slot="error-state-code"
            sx={{
              fontFamily: "monospace",
              typography: "caption",
              color: "text.secondary",
            }}
          >
            {code}
          </Box>
        ) : null}
      </Box>
    </Box>
  );
}
