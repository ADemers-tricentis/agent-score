import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import { alpha } from "@mui/material/styles";

interface DangerZoneProps extends React.ComponentProps<"div"> {
  children: ReactNode;
}

/**
 * Red-bordered card body used for destructive actions at the end of Settings
 * tabs. Wrap with `<FormSection title="Danger zone" tone="destructive">` for
 * the standard label-on-left / actions-on-right layout.
 *
 * Each child should be a `<DangerZone.Row>`.
 */
function DangerZoneRoot({ className, children, ...rest }: DangerZoneProps) {
  return (
    <Box
      data-slot="danger-zone"
      className={className}
      sx={(theme) => ({
        borderRadius: 1,
        border: 1,
        borderColor: alpha(theme.palette.error.main, 0.3),
        bgcolor: "background.paper",
        "& > [data-slot='danger-zone-row'] + [data-slot='danger-zone-row']": {
          borderTop: 1,
          borderColor: alpha(theme.palette.error.main, 0.15),
        },
      })}
      {...rest}
    >
      {children}
    </Box>
  );
}

interface DangerZoneRowProps extends Omit<React.ComponentProps<"div">, "title"> {
  /** Action title (e.g. "Soft-delete tenant"). */
  title: ReactNode;
  /** Short description below the title. */
  description?: ReactNode;
  /** Right-aligned action button (typically destructive). */
  action: ReactNode;
}

function DangerZoneRow({
  title,
  description,
  action,
  className,
  ...rest
}: DangerZoneRowProps) {
  return (
    <Box
      data-slot="danger-zone-row"
      className={className}
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1.5,
        px: 2,
        py: 1.5,
      }}
      {...rest}
    >
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Box
          sx={{ typography: "body1", fontWeight: 500, color: "text.primary" }}
        >
          {title}
        </Box>
        {description ? (
          <Box
            component="p"
            sx={{
              mt: 0.25,
              mb: 0,
              typography: "caption",
              lineHeight: 1.625,
              color: "text.secondary",
            }}
          >
            {description}
          </Box>
        ) : null}
      </Box>
      <Box sx={{ flexShrink: 0 }}>{action}</Box>
    </Box>
  );
}

export const DangerZone = Object.assign(DangerZoneRoot, { Row: DangerZoneRow });
