/** Advisor run status label/tint — shared by `RecommendationList` (the
 * non-succeeded status alert) and `ImproveTab` (the history table's status
 * chip). Split out of `RecommendationList.tsx` so that component-only file
 * can keep `react-refresh/only-export-components` clean.
 */

const ADVISOR_STATUS_LABELS: Record<string, string> = {
  succeeded: "Succeeded",
  failed: "Failed",
  cancelled: "Cancelled",
  budget_exhausted: "Budget exhausted",
  bounds_exhausted: "Time or turn limit reached",
  interrupted: "Interrupted",
};

const REQUEST_STATE_LABELS: Record<string, string> = {
  queued: "Waiting to start",
  running: "Working",
  retry_scheduled: "Retry scheduled",
  succeeded: "Advice ready",
  failed: "Advice could not be completed",
  cancelled: "Advice request cancelled",
};

export function advisorStatusLabel(status: string): string {
  return ADVISOR_STATUS_LABELS[status] ?? "Unknown outcome";
}

export function advisorRequestStateLabel(state: string): string {
  return REQUEST_STATE_LABELS[state] ?? "Status unavailable";
}

export function advisorRequestTint(
  state: string,
): "info" | "success" | "destructive" | "warning" | "muted" {
  if (state === "succeeded") return "success";
  if (state === "failed") return "destructive";
  if (state === "cancelled") return "muted";
  if (state === "retry_scheduled") return "warning";
  return "info";
}

export function advisorStatusTint(
  status: string,
): "success" | "destructive" | "warning" | "muted" {
  if (status === "succeeded") return "success";
  if (status === "failed") return "destructive";
  if (status === "cancelled") return "muted";
  return "warning";
}
