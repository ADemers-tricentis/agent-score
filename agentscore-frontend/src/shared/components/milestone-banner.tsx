import { useState } from "react";
import Alert from "@mui/material/Alert";
import IconButton from "@mui/material/IconButton";
import IconMaterialSymbolsClose from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsClose.mjs";

import { focusRing } from "@/shared/theme/focus-ring";

export interface MilestoneBannerProps {
  /** Agent the banner belongs to — scopes the localStorage dismissal key. */
  agentId: string;
  /**
   * When the agent first reached a confident (non-provisional) score
   * (spec §3.5). Null → the milestone has not been reached → renders nothing.
   */
  reachedAt: string | null;
}

function dismissKey(agentId: string): string {
  return `milestone-dismissed-${agentId}`;
}

/**
 * One-time celebratory banner shown when an agent first reaches a confident
 * score (spec §3.5 / F4). Dismissal is persisted per-agent in `localStorage`
 * so the banner never re-appears for that agent. Renders nothing when the
 * milestone has not been reached or has already been dismissed.
 */
export function MilestoneBanner({ agentId, reachedAt }: MilestoneBannerProps) {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return window.localStorage.getItem(dismissKey(agentId)) !== null;
  });

  if (reachedAt === null || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(dismissKey(agentId), reachedAt);
    }
    setDismissed(true);
  };

  return (
    <Alert
      data-slot="milestone-banner"
      severity="success"
      action={
        <IconButton
          aria-label="Dismiss milestone"
          data-testid="dismiss-score-milestone"
          size="small"
          color="inherit"
          onClick={handleDismiss}
          sx={focusRing}
        >
          <IconMaterialSymbolsClose fontSize="small" />
        </IconButton>
      }
    >
      First confident score reached — enough interactions collected for a non-provisional score.
    </Alert>
  );
}
