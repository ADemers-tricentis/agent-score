import { useState, type ReactNode } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import IconMaterialSymbolsClose from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsClose.mjs";

import { focusRing } from "@/shared/theme/focus-ring";

export interface OnboardingCalloutProps {
  title: ReactNode;
  children: ReactNode;
  action?: ReactNode;
  testId?: string;
}

/**
 * Info banner a page renders while `useDemoMode().blank` is on, orienting a
 * brand-new viewer. Unlike `MilestoneBanner`, dismissal is local component
 * state, not persisted to localStorage - a presenter who dismisses it
 * mid-demo should see it again on reload or on re-toggling blank mode, not
 * lose it for good.
 */
export function OnboardingCallout({ title, children, action, testId }: OnboardingCalloutProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <Alert
      data-slot="onboarding-callout"
      data-testid={testId}
      severity="info"
      sx={{ alignItems: "flex-start" }}
      action={
        <IconButton
          aria-label="Dismiss"
          size="small"
          color="inherit"
          onClick={() => setDismissed(true)}
          sx={focusRing}
        >
          <IconMaterialSymbolsClose fontSize="small" />
        </IconButton>
      }
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Box>
          <Box sx={{ fontWeight: 600 }}>{title}</Box>
          <Box sx={{ typography: "body2" }}>{children}</Box>
        </Box>
        {action}
      </Box>
    </Alert>
  );
}
