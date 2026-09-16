import "./mui-license";

import type { ReactNode } from "react";
import ScopedCssBaseline from "@mui/material/ScopedCssBaseline";
import { StyledEngineProvider, ThemeProvider } from "@mui/material/styles";
import { AdapterDayjs } from "@mui/x-date-pickers-pro/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers-pro/LocalizationProvider";
import { SnackbarProvider } from "notistack";

import { auraTheme } from "./aura-theme";

/**
 * Root styling/theming provider for both app entries (spec §4.1). Order is
 * load-bearing:
 *  - `StyledEngineProvider injectFirst` makes Emotion inject its styles before
 *    MUI's default component styles so the `sx` prop reliably wins.
 *  - `ScopedCssBaseline` applies a *scoped* reset (not global `CssBaseline`),
 *    keeping the baseline contained to the app subtree.
 *  - `LocalizationProvider` (dayjs) backs the MUI X Date Pickers (F7).
 *  - `SnackbarProvider` (notistack) backs the `toast()` shim (F6).
 *
 * MUI portals (Select/Menu/Dialog/Tooltip/notistack) render at document.body,
 * OUTSIDE the ScopedCssBaseline subtree — global theme styles still apply to
 * them via the ThemeProvider, but the scoped baseline reset does not.
 */
export function AppThemeProvider({ children }: { children: ReactNode }) {
  return (
    <StyledEngineProvider injectFirst>
      {/* defaultMode="light" — the app is light-only (Non-Goal #3). Aura's
          CSS-vars theme ships a dark scheme too and would otherwise follow the
          OS `prefers-color-scheme`; pin light since there is no mode toggle. */}
      <ThemeProvider theme={auraTheme} defaultMode="light">
        <ScopedCssBaseline>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <SnackbarProvider
              maxSnack={4}
              autoHideDuration={4000}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            >
              {children}
            </SnackbarProvider>
          </LocalizationProvider>
        </ScopedCssBaseline>
      </ThemeProvider>
    </StyledEngineProvider>
  );
}
