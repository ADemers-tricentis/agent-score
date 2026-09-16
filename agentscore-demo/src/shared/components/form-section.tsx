import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";

interface FormSectionProps {
  /** Section heading (e.g. "General", "Identity provisioning", "Danger zone"). */
  title: ReactNode;
  /** Optional description rendered under the title on the left column. */
  description?: ReactNode;
  /** Visual tone — `destructive` styles the title in destructive color. */
  tone?: "default" | "destructive";
  /** The body of the section. Renders inside a `<Card>` on the right. */
  children: ReactNode;
  /**
   * When `true`, the body is rendered raw (no surrounding Card). Use for
   * cases like `DangerZone` that bring their own bordered card wrapper.
   */
  bare?: boolean;
  className?: string;
}

/**
 * 12-col Settings-page form section. Label + description on the left
 * (col-span-4), body on the right (col-span-8) inside a `<Card>`.
 *
 * Per the back-office UI design reference, every Settings tab (Tenant,
 * Agent, User, Project) is a stack of these.
 */
export function FormSection({
  title,
  description,
  tone = "default",
  children,
  bare = false,
  className,
}: FormSectionProps) {
  return (
    <Grid
      container
      data-slot="form-section"
      data-tone={tone}
      className={className}
      columns={12}
      spacing={3}
    >
      <Grid size={{ xs: 12, md: 4 }}>
        <Typography
          variant="subtitle1"
          component="div"
          sx={{
            fontWeight: 500,
            color: tone === "destructive" ? "error.main" : "text.primary",
          }}
        >
          {title}
        </Typography>
        {description ? (
          <Box
            component="p"
            sx={{
              mt: 0.5,
              mb: 0,
              typography: "caption",
              lineHeight: 1.625,
              color: "text.secondary",
            }}
          >
            {description}
          </Box>
        ) : null}
      </Grid>
      <Grid size={{ xs: 12, md: 8 }}>
        {bare ? (
          children
        ) : (
          <Card
            data-slot="card"
            variant="outlined"
            sx={{ overflow: "hidden", borderRadius: 1.5 }}
          >
            <CardContent
              data-slot="card-content"
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                py: 2,
                "&:last-child": { pb: 2 },
              }}
            >
              {children}
            </CardContent>
          </Card>
        )}
      </Grid>
    </Grid>
  );
}
