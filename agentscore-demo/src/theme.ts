/// <reference types="@tricentis/aura/themeAugmentation" />
import { extendTheme } from "@mui/material/styles";
import themeOptions from "@tricentis/aura/constants/themeOptions.js";

export const theme = extendTheme({
  ...themeOptions,
  colorSchemeSelector: "data",
  // The real back office is light-only (its theme disables the dark scheme
  // outright) — default this demo to light so the initial look matches.
  defaultColorScheme: "light",
});
