import Box, { type BoxProps } from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";

/**
 * The shared page chrome band — the white strip that holds a page's header or
 * toolbar above the content. Single source of truth for that band: white
 * surface, standard 32px side inset, pinned (no shrink), and **no border**.
 *
 * Page bands are intentionally borderless (the old per-page `borderBottom`
 * divider lines were removed centrally by routing every band through here).
 * Header bands use the taller inset via `sx={{ pt: 4, pb: 2.5 }}`; toolbar bands
 * use the `py: 2` default. Toggling the band's border/inset is now a one-line
 * change here instead of an edit across every list/detail page.
 *
 * Prefer the `PageBand` component; use `pageBandSx` directly only where a
 * wrapper element already exists and adding a component would restructure JSX.
 */
// Shared band-style const beside its thin presentational wrapper; the style is
// reused by pages that already own a wrapper element. HMR fast-refresh of this
// module is irrelevant, so the react-refresh mixed-export hint doesn't apply.
// eslint-disable-next-line react-refresh/only-export-components
export const pageBandSx: SxProps<Theme> = {
  flexShrink: 0,
  bgcolor: "background.paper",
  px: 4,
  py: 2,
};

export function PageBand({ sx, children, ...rest }: BoxProps) {
  return (
    <Box
      data-slot="page-band"
      sx={[pageBandSx, ...(Array.isArray(sx) ? sx : [sx])]}
      {...rest}
    >
      {children}
    </Box>
  );
}
