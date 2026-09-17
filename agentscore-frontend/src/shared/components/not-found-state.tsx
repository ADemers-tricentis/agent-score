import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import IconMaterialSymbolsSearchOff from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsSearchOff.mjs";

import { EmptyState } from "@/shared/components/empty-state";

interface NotFoundStateProps {
  /** Entity label, e.g. "Tenant", "Agent", "Inference". */
  entity: string;
  /**
   * Optional back-to-list affordance — typically
   * `<Button component={Link} to="/list" variant="outlined">Back</Button>`.
   * Kept as a caller-supplied node so the typed router `<Link to>` stays literal.
   */
  action?: ReactNode;
  className?: string;
}

/**
 * Standard "entity not found" state for detail/settings pages reached with a
 * bogus, deleted, or unauthorized id (the entity GET throws → the query is in
 * `isError`). Replaces rendering empty chrome / an editable empty form / an
 * infinite skeleton. Carries `data-testid="not-found"` for e2e.
 */
export function NotFoundState({ entity, action, className }: NotFoundStateProps) {
  return (
    <Box
      data-testid="not-found"
      className={className}
      sx={className ? undefined : { px: 4, py: 6 }}
    >
      <EmptyState
        icon={IconMaterialSymbolsSearchOff}
        title={`${entity} not found`}
        description={`This ${entity.toLowerCase()} doesn’t exist, was deleted, or you don’t have access to it.`}
        action={action}
      />
    </Box>
  );
}
