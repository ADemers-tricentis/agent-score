import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { PageTitleIcon } from "@/shared/components/page-title-icon";

interface PageHeaderProps {
  /** Primary page or entity title — rendered as an `<h1>`. */
  title: ReactNode;
  /** Optional subtitle below the title. */
  description?: ReactNode;
  /** Optional breadcrumb element rendered above the title. Pair with MUI `Breadcrumbs`. */
  breadcrumb?: ReactNode;
  /** Optional action slot rendered to the right (e.g. primary button). */
  actions?: ReactNode;
  className?: string;
}

/**
 * Page-level header. Sits above the page body (above a list `<Card>`, above an
 * entity shell). Composes breadcrumb + title + description + actions.
 *
 * Per the back-office UI design reference at
 * `docs/03-backoffice-ui-design.html`, every list page and every entity detail
 * page uses this shape.
 */
export function PageHeader({
  title,
  description,
  breadcrumb,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <Box
      data-slot="page-header"
      className={className}
      sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
    >
      {breadcrumb ? <Box data-slot="page-header-breadcrumb">{breadcrumb}</Box> : null}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 1.5,
        }}
      >
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <PageTitleIcon />
            <Typography
              variant="h3"
              component="h1"
              data-slot="page-header-title"
              sx={{ m: 0, minWidth: 0, color: "text.primary" }}
            >
              {title}
            </Typography>
          </Box>
          {description ? (
            <Box
              component="p"
              data-slot="page-header-description"
              sx={{ mt: 0.5, mb: 0, typography: "body1", color: "text.secondary" }}
            >
              {description}
            </Box>
          ) : null}
        </Box>
        {actions ? (
          <Box
            data-slot="page-header-actions"
            sx={{ display: "flex", flexShrink: 0, alignItems: "center", gap: 1 }}
          >
            {actions}
          </Box>
        ) : null}
      </Box>
    </Box>
  );
}
