import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import { pageContentPaddingSx } from "@/shared/components/page-content";

interface TraceDetailShellProps {
  /** Pinned trace header (back arrow + title + chip strip). */
  header: ReactNode;
  /** Left pane: spans tree contents. */
  tree: ReactNode;
  /** Right pane: selected span detail (or an empty-state). */
  detail: ReactNode;
  /** Optional tree-pane header (title + count + density toggle). */
  treeHeader?: ReactNode;
  /** Optional detail-pane header (span name + meta + sub-tabs). */
  detailHeader?: ReactNode;
  /** Optional detail-pane footer (prev/next span navigation). */
  detailFooter?: ReactNode;
  className?: string;
}

/**
 * 2-pane layout for the trace detail screen. The pinned metadata header spans
 * full width; the body is a 12-col grid with a 4-col spans tree and an 8-col
 * selected-span panel, each scrolling independently.
 *
 * The shell fills the viewport-bounded entity-shell body; the `minHeight: 0`
 * cascade lets the panes' `overflowY: auto` engage instead of growing the
 * page. No JS height measurement needed — the app shell owns the height.
 */
export function TraceDetailShell({
  header,
  tree,
  detail,
  treeHeader,
  detailHeader,
  detailFooter,
  className,
}: TraceDetailShellProps) {
  return (
    <Box
      data-slot="trace-detail-shell"
      className={className}
      sx={{
        display: "flex",
        height: "100%",
        minHeight: 0,
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          flexShrink: 0,
          bgcolor: "background.paper",
          px: 4,
          pb: 2,
          pt: 3,
        }}
      >
        {header}
      </Box>
      <Grid
        container
        spacing={2.5}
        sx={{ minHeight: 0, flex: 1, ...pageContentPaddingSx }}
      >
        <Grid
          size={{ xs: 12, lg: 4 }}
          data-slot="trace-detail-tree"
          sx={{
            display: "flex",
            minHeight: 0,
            flexDirection: "column",
            overflow: "hidden",
            borderRadius: 1,
            border: 1,
            borderColor: "divider",
            bgcolor: "background.paper",
          }}
        >
          {treeHeader ? (
            <Box
              sx={{
                flexShrink: 0,
                borderBottom: 1,
                borderColor: "divider",
                px: 2,
                py: 1.25,
              }}
            >
              {treeHeader}
            </Box>
          ) : null}
          <Box
            sx={{
              minHeight: 0,
              flex: 1,
              overflowY: "auto",
              py: 0.5,
              typography: "caption",
            }}
          >
            {tree}
          </Box>
        </Grid>
        <Grid
          size={{ xs: 12, lg: 8 }}
          data-slot="trace-detail-pane"
          sx={{
            display: "flex",
            minHeight: 0,
            flexDirection: "column",
            overflow: "hidden",
            borderRadius: 1,
            border: 1,
            borderColor: "divider",
            bgcolor: "background.paper",
          }}
        >
          {detailHeader ? (
            <Box
              sx={{
                flexShrink: 0,
                borderBottom: 1,
                borderColor: "divider",
                px: 2.5,
                py: 1.5,
              }}
            >
              {detailHeader}
            </Box>
          ) : null}
          <Box sx={{ minHeight: 0, flex: 1, overflowY: "auto", p: 2.5 }}>
            {detail}
          </Box>
          {detailFooter ? (
            <Box
              sx={{
                flexShrink: 0,
                borderTop: 1,
                borderColor: "divider",
                bgcolor: "action.hover",
                px: 2.5,
                py: 1,
                typography: "caption",
              }}
            >
              {detailFooter}
            </Box>
          ) : null}
        </Grid>
      </Grid>
    </Box>
  );
}
