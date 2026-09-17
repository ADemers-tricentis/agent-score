import type { ReactNode } from "react";
import Box from "@mui/material/Box";

export interface ProvenanceItem {
  /** Eyebrow label rendered above the value (uppercase). */
  label: ReactNode;
  /** Value content. */
  value: ReactNode;
  /** Optional secondary line below the value (e.g. a relative-time or
   *  status caption) — muted, smaller than the value itself. */
  hint?: ReactNode;
  /** Force this row to span all columns. */
  full?: boolean;
  /** Test hook on the value cell — the browser e2e lane asserts individual
   *  provenance values (e.g. the four component costs on a usage call), which
   *  a shared `<dl>` otherwise exposes only by position. */
  testId?: string;
}

interface ProvenanceDlProps {
  items: ProvenanceItem[];
  /** Number of columns at sm+. Default 2. */
  columns?: 1 | 2 | 3;
  className?: string;
}

// Responsive column templates mirroring the original Tailwind breakpoints
// (`grid-cols-1 sm:grid-cols-2 md:grid-cols-3`).
const COLS_TEMPLATE = {
  1: "repeat(1, minmax(0, 1fr))",
  2: { xs: "repeat(1, minmax(0, 1fr))", sm: "repeat(2, minmax(0, 1fr))" },
  3: {
    xs: "repeat(1, minmax(0, 1fr))",
    sm: "repeat(2, minmax(0, 1fr))",
    md: "repeat(3, minmax(0, 1fr))",
  },
} as const;

/**
 * Multi-column metadata grid. Eyebrow label + value pairs. Used in Settings
 * provisioning panels, agent provenance, tenant overview details.
 */
export function ProvenanceDl({
  items,
  columns = 2,
  className,
}: ProvenanceDlProps) {
  return (
    <Box
      component="dl"
      data-slot="provenance-dl"
      className={className}
      sx={{
        display: "grid",
        columnGap: 3,
        rowGap: 1.5,
        m: 0,
        typography: "body1",
        gridTemplateColumns: COLS_TEMPLATE[columns],
      }}
    >
      {items.map((it, i) => (
        <Box key={i} sx={it.full ? { gridColumn: "1 / -1" } : undefined}>
          <Box
            component="dt"
            sx={{
              typography: "overline",
              color: "text.secondary",
            }}
          >
            {it.label}
          </Box>
          <Box component="dd" data-testid={it.testId} sx={{ mt: 0.25, ml: 0 }}>
            {it.value}
            {/* Inside `<dd>`, not a sibling — a `<dl>` only permits
             *  `<dt>`/`<dd>` groups as direct children of the wrapping
             *  `<div>` (WCAG/axe `definition-list`); a sibling `<div>` here
             *  would be flagged as a stray direct child. */}
            {it.hint != null ? (
              <Box sx={{ mt: 0.25, typography: "caption", color: "text.secondary" }}>
                {it.hint}
              </Box>
            ) : null}
          </Box>
        </Box>
      ))}
    </Box>
  );
}
