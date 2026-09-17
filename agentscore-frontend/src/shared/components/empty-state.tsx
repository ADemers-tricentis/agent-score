import type { ComponentType, ReactNode } from "react";
import Box from "@mui/material/Box";
import ZeroState from "@tricentis/aura/components/ZeroState.js";

interface EmptyStateProps {
  /** Optional icon rendered in the muted media slot. */
  icon?: ComponentType<{ className?: string }>;
  /** Required short title (e.g. "No agents in this tenant yet"). */
  title: ReactNode;
  /** Optional supporting description. */
  description?: ReactNode;
  /** Optional action area (e.g. a "Create tenant" button). */
  action?: ReactNode;
  /** Optional stable hook for e2e — lands as `data-testid` on the root. */
  testId?: string;
  className?: string;
}

/**
 * Standardized empty / no-data state. Composition over the Aura `ZeroState`
 * primitive with our default icon-bubble + title + description + action shape.
 *
 * Also works for error / 404 / 403 surfaces — just pass a destructive-ish icon
 * and an appropriate title.
 *
 * The `data-slot` hooks (`empty-state`/`empty-icon`/`empty-content`) are
 * preserved node-for-node from the prior shadcn composition so the e2e +
 * component suites keep resolving; `ZeroState` does not emit them itself, so we
 * stamp them on the wrapper + the nodes we hand it.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  testId,
  className,
}: EmptyStateProps) {
  return (
    <Box data-slot="empty-state" data-testid={testId} className={className}>
      <ZeroState
        // ZeroState types `title` as `string`; our contract is `ReactNode`
        // (callers pass styled fragments). `<Typography>` renders any node, so
        // the wider type is safe at runtime. Override: the Aura re-skin keeps
        // our existing `ReactNode` title API rather than narrowing it.
        title={title as string}
        illustration={
          Icon ? (
            <Box
              data-slot="empty-icon"
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 32,
                height: 32,
                borderRadius: 1,
                bgcolor: "action.hover",
                color: "text.primary",
                "& svg": { fontSize: 16 },
              }}
            >
              <Icon />
            </Box>
          ) : undefined
        }
        actions={
          action ? (
            <Box
              data-slot="empty-content"
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 1,
                width: "100%",
              }}
            >
              {action}
            </Box>
          ) : undefined
        }
        titleProps={{ variant: "subtitle2", component: "div" }}
        containerSx={{ alignItems: "center", textAlign: "center", gap: 2 }}
      >
        {description ?? null}
      </ZeroState>
    </Box>
  );
}
