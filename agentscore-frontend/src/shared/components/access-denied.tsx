import Box from "@mui/material/Box";
import { alpha } from "@mui/material/styles";
import IconMaterialSymbolsLock from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsLock.mjs";

interface AccessDeniedProps {
  /** Body copy. Defaults to the superadmin gate message. */
  message?: string;
  className?: string;
}

/**
 * Shared superadmin/authorization gate. Promotes the previously copy-pasted
 * inline `AccessRequired` boxes (LLM Catalog, Eval Catalog, Studio) into one tinted
 * lock-box treatment. Carries `data-testid="access-denied"` for e2e.
 */
export function AccessDenied({
  message = "You need superadmin access to view this page.",
  className,
}: AccessDeniedProps) {
  return (
    <Box
      data-testid="access-denied"
      data-slot="access-denied"
      className={className}
      sx={{ px: 4, py: 3 }}
    >
      <Box
        sx={(theme) => ({
          display: "flex",
          alignItems: "flex-start",
          gap: 1,
          borderRadius: 1,
          border: 1,
          borderColor: alpha(theme.palette.error.main, 0.3),
          bgcolor: alpha(theme.palette.error.main, 0.1),
          px: 2,
          py: 2,
          color: "error.main",
        })}
      >
        <Box component="span" sx={{ display: "inline-flex", flexShrink: 0, mt: 0.125 }}>
          <IconMaterialSymbolsLock sx={{ fontSize: 16 }} />
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25, minWidth: 0 }}>
          <Box sx={{ typography: "body1", fontWeight: 500 }}>
            Superadmin access required
          </Box>
          <Box sx={{ typography: "body2", lineHeight: 1.625 }}>{message}</Box>
        </Box>
      </Box>
    </Box>
  );
}
