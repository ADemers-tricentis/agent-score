import type { SxProps, Theme } from "@mui/material/styles";

/**
 * Page-body content insets — 32px sides, 24px bottom, and **no top padding** so
 * the content sits flush under the toolbar/header band. Single source of truth
 * for the top = 0, used everywhere a page pads its body:
 *  - `DataTable` list pages wrap their table in a separate `ScrollRegion`, so
 *    they apply these insets directly: `<Box sx={pageContentPaddingSx}>`.
 *  - Card-grid pages use `pageContentSx` below (scroll container + these insets
 *    in one element).
 */
export const pageContentPaddingSx = { px: 4, pt: 0, pb: 3 } satisfies SxProps<Theme>;

/**
 * The full scrollable content region (scroll container + the shared insets) for
 * pages whose body is a single element. Apply via `<Box sx={pageContentSx}>`.
 */
export const pageContentSx: SxProps<Theme> = {
  minHeight: 0,
  flex: 1,
  overflowY: "auto",
  ...pageContentPaddingSx,
};
