/** DocsPage — customer-facing docs, native to the demo shell.
 *
 * Structure (sections/pages/blurbs) mirrors the real docs site
 * (`agent-score-marketing/docs-src`) so the nav reads as the real product;
 * page bodies are placeholders — content to be filled in later, per the
 * user's explicit "don't worry about content" instruction (2026-09-16).
 * Not wired into `sidebar-nav.ts`/`destination-tiers.ts`: there's no
 * production back-office equivalent to mirror, so this is demo-only, always
 * visible regardless of role (see `MinimalShell.tsx`).
 */

import { useParams, Link as RouterLink } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import IconMaterialSymbolsMenuBook from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsMenuBook.mjs";

import { DOCS_NAV, findDocsPage } from "@/back-office/docs/nav";
import { NotFoundState } from "@/shared/components/not-found-state";
import { ScrollRegion } from "@/shared/components/scroll-region";

function DocsNavRail({ activeSlug }: { activeSlug: string }) {
  return (
    <Box
      sx={{
        width: 260,
        flexShrink: 0,
        borderRight: 1,
        borderColor: "divider",
        overflowY: "auto",
        px: 2,
        py: 3,
      }}
    >
      {DOCS_NAV.map((section) => (
        <Box key={section.id} sx={{ mb: 2.5 }}>
          <Box
            sx={{
              typography: "caption",
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              color: "text.secondary",
              px: 1,
              mb: 0.5,
            }}
          >
            {section.title}
          </Box>
          {section.pages.map((page) => {
            const active = page.slug === activeSlug;
            return (
              <Link
                key={page.slug}
                component={RouterLink}
                to="/docs/$slug"
                params={{ slug: page.slug } as never}
                underline="none"
                sx={{
                  display: "block",
                  color: active ? "text.primary" : "text.secondary",
                  bgcolor: active ? "action.selected" : "transparent",
                  fontWeight: active ? 600 : 400,
                  borderRadius: 1,
                  px: 1,
                  py: 0.75,
                  typography: "body2",
                  "&:hover": { bgcolor: "action.hover", color: "text.primary" },
                }}
              >
                {page.title}
              </Link>
            );
          })}
        </Box>
      ))}
    </Box>
  );
}

export function DocsPage() {
  const { slug } = useParams({ strict: false }) as { slug: string };
  const page = findDocsPage(slug);

  return (
    <Box sx={{ display: "flex", minHeight: 0, flex: 1 }}>
      <DocsNavRail activeSlug={slug} />
      <ScrollRegion>
        {page ? (
          <Box sx={{ px: 5, py: 4, maxWidth: 720 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <IconMaterialSymbolsMenuBook sx={{ fontSize: 22, color: "text.secondary" }} />
              <Box component="h1" sx={{ typography: "h3", fontWeight: 600, m: 0 }}>
                {page.title}
              </Box>
            </Box>
            <Box sx={{ typography: "body1", color: "text.secondary", mb: 3 }}>{page.blurb}</Box>
            <Box
              sx={{
                border: 1,
                borderColor: "divider",
                borderRadius: 1.5,
                bgcolor: "action.hover",
                px: 2.5,
                py: 2,
                typography: "body2",
                color: "text.secondary",
              }}
            >
              This page is a placeholder — content coming soon.
            </Box>
          </Box>
        ) : (
          <NotFoundState entity="Doc page" />
        )}
      </ScrollRegion>
    </Box>
  );
}
