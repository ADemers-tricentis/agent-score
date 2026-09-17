import type { ReactNode } from "react";
import Box from "@mui/material/Box";

interface ToolbarProps {
  /** Search slot — typically a relative-positioned search `TextField`. */
  search?: ReactNode;
  /** Filter slot — a group of filter chips, Selects, Switches, etc. */
  filters?: ReactNode;
  /** Primary actions on the right (e.g. a "New tenant" button). */
  actions?: ReactNode;
  /** Right-side count / summary (e.g. "142 agents · 12 active"). */
  right?: ReactNode;
  className?: string;
}

/**
 * List-page toolbar: search + filters + actions + summary. All slots are
 * optional. Slot-only by design — no built-in search input, so each page
 * can evolve its search behavior independently.
 */
export function Toolbar({
  search,
  filters,
  actions,
  right,
  className,
}: ToolbarProps) {
  // Only render the filter row when it would hold something — an empty toolbar
  // (no slots) renders nothing meaningful inside, not a stray empty flex row.
  const hasFilterRow = Boolean(search || filters || actions);
  return (
    <Box
      data-slot="toolbar"
      className={className}
      sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}
    >
      {hasFilterRow ? (
      <Box
        sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1 }}
      >
        {search ? (
          <Box
            data-slot="toolbar-search"
            // Cap the search at ~1/3 of the row (no grow) so the filter buttons
            // sit right after it instead of being pushed to the far right.
            sx={{ flex: "0 1 33%", minWidth: "16rem" }}
          >
            {search}
          </Box>
        ) : null}
        {filters ? (
          <Box
            data-slot="toolbar-filters"
            sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 0.75 }}
          >
            {filters}
          </Box>
        ) : null}
        {actions ? (
          <Box
            data-slot="toolbar-actions"
            sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 1 }}
          >
            {actions}
          </Box>
        ) : null}
      </Box>
      ) : null}
      {right ? (
        // Count / summary on its own line below the search input, left-aligned.
        <Box
          data-slot="toolbar-right"
          sx={{ typography: "caption", color: "text.secondary" }}
        >
          {right}
        </Box>
      ) : null}
    </Box>
  );
}
