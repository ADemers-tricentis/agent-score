import { LicenseInfo } from "@mui/x-license";
import muiXLicenseKey from "@tricentis/aura/constants/muiXLicenseKey.js";

// Side-effect: register the MUI X Pro license before any X component (the
// DataGridPro that `themeOptionsDataGrid` composes, Date Pickers Pro) mounts,
// or they render with a watermark. Imported first by AppThemeProvider.
LicenseInfo.setLicenseKey(muiXLicenseKey);
