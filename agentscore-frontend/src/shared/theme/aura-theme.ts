/// <reference types="@mui/material/themeCssVarsAugmentation" />
import { extendTheme } from "@mui/material/styles";
import themeOptions from "@tricentis/aura/constants/themeOptions.js";
import themeOptionsDataGrid from "@tricentis/aura/constants/themeOptionsDataGrid.js";

import { appTokens } from "./app-tokens";

/**
 * The single app theme: Aura's base theme + DataGrid composition, with our
 * mapped app tokens merged last (spec F1). `extendTheme` deep-merges its
 * arguments, so `appTokens` overrides only the slots it names and inherits all
 * of Aura's components/typography/surfaces otherwise.
 */
export const auraTheme = extendTheme(themeOptions, themeOptionsDataGrid, appTokens);
