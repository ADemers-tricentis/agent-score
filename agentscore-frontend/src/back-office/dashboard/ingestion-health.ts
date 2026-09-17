/** Pure derivation of the dashboard's ingestion-health fields — mirrors the
 * real `back-office/dashboard/ingestion-health.ts`. Kept as a plain function
 * (no React import) so it stays trivially unit-testable.
 */

import type { IngestionOverview, PointSummary } from "@/back-office/dashboard/fake-data";

export interface IngestionHealth {
  currentTps: number;
  tracesToday: number;
  errorRate: number;
  writeSuccessRate: number;
  activeAlertCount: number;
  /** sum(points[].tracesInFlight ?? 0) — the field is optional; absent = 0. */
  inFlight: number;
  disabledPoints: PointSummary[];
}

export function deriveIngestionHealth(overview: IngestionOverview): IngestionHealth {
  const points = overview.points;
  const inFlight = points.reduce((sum, p) => sum + (p.tracesInFlight ?? 0), 0);

  return {
    currentTps: overview.currentTps,
    tracesToday: overview.tracesToday,
    errorRate: overview.errorRate,
    writeSuccessRate: overview.writeSuccessRate,
    activeAlertCount: overview.activeAlertCount,
    inFlight,
    disabledPoints: points.filter((p) => !p.enabled),
  };
}
