import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import IconMaterialSymbolsInfo from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsInfo.mjs";

/** Inline label + info glyph, for a term that isn't self-explanatory to
 *  someone who didn't build the scoring pipeline. */
export function TermLabel({
  label,
  tooltip,
}: {
  label: ReactNode;
  tooltip: string;
}) {
  return (
    <Tooltip title={tooltip}>
      <Box
        component="span"
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0.4,
          cursor: "help",
        }}
      >
        {label}
        <IconMaterialSymbolsInfo
          sx={{ fontSize: 14, color: "text.disabled", flexShrink: 0 }}
        />
      </Box>
    </Tooltip>
  );
}
