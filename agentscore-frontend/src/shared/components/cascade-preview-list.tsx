import type { ComponentType, ReactNode } from "react";
import Box from "@mui/material/Box";
import { alpha } from "@mui/material/styles";

export interface CascadePreviewItem {
  /** Lucide icon. */
  icon: ComponentType<{ className?: string }>;
  /** Item label (the thing being destroyed). */
  label: ReactNode;
  /** Muted sub-label for context (e.g. "(users themselves remain)"). */
  hint?: ReactNode;
}

interface CascadePreviewListProps {
  /** Headline above the list (e.g. "The following will be destroyed:"). */
  heading?: ReactNode;
  items: CascadePreviewItem[];
  className?: string;
}

/**
 * Red-tinted bulleted list. Used inside hard-purge confirmation dialogs to
 * preview the cascading effects of the destructive action.
 */
export function CascadePreviewList({
  heading,
  items,
  className,
}: CascadePreviewListProps) {
  return (
    <Box
      data-slot="cascade-preview-list"
      className={className}
      sx={(theme) => ({
        borderRadius: 1,
        border: 1,
        borderColor: alpha(theme.palette.error.main, 0.3),
        bgcolor: alpha(theme.palette.error.main, 0.1),
        px: 1.5,
        py: 1.25,
        typography: "caption",
        color: theme.palette.error.main,
      })}
    >
      {heading ? (
        <Box sx={{ mb: 0.75, fontWeight: 600 }}>{heading}</Box>
      ) : null}
      <Box
        component="ul"
        sx={{
          listStyle: "none",
          m: 0,
          p: 0,
          display: "flex",
          flexDirection: "column",
          gap: 0.5,
        }}
      >
        {items.map((it, i) => {
          const Icon = it.icon;
          return (
            <Box
              component="li"
              key={i}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.75,
                "& > svg": { width: 14, height: 14, flexShrink: 0 },
              }}
            >
              <Icon />
              <Box component="span" sx={{ flex: 1 }}>
                {it.label}
              </Box>
              {it.hint ? (
                <Box
                  component="span"
                  sx={(theme) => ({
                    color: alpha(theme.palette.error.main, 0.7),
                  })}
                >
                  {it.hint}
                </Box>
              ) : null}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

