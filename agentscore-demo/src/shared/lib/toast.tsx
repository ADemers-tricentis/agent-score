import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import type { SnackbarKey, VariantType } from "notistack";
// Namespace import (not named): notistack assigns the standalone
// `enqueueSnackbar`/`closeSnackbar` lazily — they are `undefined` at module
// load and only bound once a SnackbarProvider mounts. A named import snapshots
// that initial `undefined` under CJS interop (e.g. vitest); reading through the
// namespace at call time always reflects the live, post-mount binding.
import * as notistack from "notistack";

/**
 * Thin imperative `toast()` shim over notistack, preserving the sonner call
 * surface so the ~30 mutation call sites change only their import path
 * (spec F6 / §5.6 cross-cutting override). The `<SnackbarProvider>` is mounted
 * once per app entry in `AppThemeProvider`.
 */
type ToastOptions = {
  description?: string;
  action?: { label: string; onClick: () => void };
};

function show(
  variant: VariantType,
  message: string,
  options?: ToastOptions,
): SnackbarKey {
  const content = options?.description ? (
    <Box>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {message}
      </Typography>
      <Typography variant="caption" sx={{ opacity: 0.85 }}>
        {options.description}
      </Typography>
    </Box>
  ) : (
    message
  );
  const action = options?.action;
  return notistack.enqueueSnackbar(content, {
    variant,
    action: action
      ? (id) => (
          <Button
            color="inherit"
            size="small"
            onClick={() => {
              action.onClick();
              notistack.closeSnackbar(id);
            }}
          >
            {action.label}
          </Button>
        )
      : undefined,
  });
}

export const toast = {
  success: (message: string, options?: ToastOptions) =>
    show("success", message, options),
  error: (message: string, options?: ToastOptions) =>
    show("error", message, options),
  info: (message: string, options?: ToastOptions) =>
    show("info", message, options),
  warning: (message: string, options?: ToastOptions) =>
    show("warning", message, options),
  message: (message: string, options?: ToastOptions) =>
    show("default", message, options),
};
