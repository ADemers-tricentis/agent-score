import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";

import { focusRing } from "@/shared/theme/focus-ring";
import type { components } from "@/shared/api/generated";

type DriftNudgeOut = components["schemas"]["DriftNudgeOut"];

export interface DriftNudgeAlertProps {
  /** Lazily-computed drift nudge from the benchmark response (spec §3.2). */
  driftNudge: DriftNudgeOut | null;
  /** "Re-fit to X" CTA → POST …/benchmark/auto-fit. */
  onRefit: () => void;
  /** "Dismiss" CTA → POST …/benchmark/dismiss-drift (re-arms the 7-day throttle). */
  onDismiss: () => void;
  /** Gates the re-fit button while a 202 async fit is enqueued/polling (S5
   *  spec §3.1 Feature 5, F3) — optional/default `false` so existing callers
   *  are unaffected. */
  refitBusy?: boolean;
}

/**
 * Drift nudge for pinned agents (spec §3.2). When the live fit matcher finds a
 * profile that would now grade the (drifted) agent better than its pinned
 * profile, this surfaces an info alert offering to re-fit. Renders nothing when
 * the nudge is inactive. Both CTAs carry the shared focus ring.
 */
export function DriftNudgeAlert({
  driftNudge,
  onRefit,
  onDismiss,
  refitBusy = false,
}: DriftNudgeAlertProps) {
  if (!driftNudge?.active) {
    return null;
  }

  const profileName = driftNudge.wouldAdoptProfileName ?? "a better profile";

  return (
    <Alert data-slot="drift-nudge-alert" data-testid="drift-nudge-alert" severity="info">
      <AlertTitle>Your agent changed</AlertTitle>
      Auto-fit would now grade it on <strong>{profileName}</strong>.
      <Box sx={{ mt: 1, display: "flex", gap: 1 }}>
        <Button
          size="small"
          variant="contained"
          color="primary"
          onClick={onRefit}
          disabled={refitBusy}
          data-testid="drift-refit"
          sx={focusRing}
        >
          Re-fit to {profileName}
        </Button>
        <Button
          size="small"
          variant="text"
          onClick={onDismiss}
          data-testid="drift-dismiss"
          sx={focusRing}
        >
          Dismiss
        </Button>
      </Box>
    </Alert>
  );
}
