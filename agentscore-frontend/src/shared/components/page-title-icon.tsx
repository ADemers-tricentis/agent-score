import { useLocation } from "@tanstack/react-router";
import Box from "@mui/material/Box";

import { resolveActiveNavItem } from "@/shared/components/sidebar-nav";

/**
 * Leading page-title glyph — the icon of the sidebar nav item that owns the
 * current route, so a page's title carries the same mark as its nav entry.
 * Derived from `resolveActiveNavItem` (the exact matcher the sidebar uses) so
 * the two can never drift; renders nothing on routes with no nav entry (e.g.
 * the login screen, the dev gallery), never a broken or guessed icon.
 *
 * Sized at 24px — proportional to the `h3` page title (docs/10 icon scale: one
 * step above the title text, the "large" step, matching the sidebar). Neutral
 * `text.primary` so it reads as part of the heading. Decorative (`aria-hidden`):
 * the title text already names the page, so the icon must not double-announce it.
 */
export function PageTitleIcon() {
  const { pathname } = useLocation();
  const Icon = resolveActiveNavItem(pathname)?.icon;
  if (!Icon) return null;
  return (
    <Box
      component="span"
      data-slot="page-title-icon"
      aria-hidden
      sx={{ display: "inline-flex", flexShrink: 0, color: "text.primary" }}
    >
      <Icon sx={{ fontSize: 24 }} />
    </Box>
  );
}
