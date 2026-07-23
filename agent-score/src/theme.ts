/// <reference types="@tricentis/aura/themeAugmentation" />
import { extendTheme } from "@mui/material/styles";
import themeOptions from "@tricentis/aura/constants/themeOptions.js";

export const theme = extendTheme({
  ...themeOptions,
  colorSchemeSelector: "data",
  defaultColorScheme: "dark",
});
