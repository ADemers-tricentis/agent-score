export interface RefreshInterval {
  id: string;
  label: string;
  /** Poll period in ms. `null` = auto-refresh off. */
  ms: number | null;
}

export const REFRESH_INTERVALS: RefreshInterval[] = [
  { id: "off", label: "Auto-refresh off", ms: null },
  { id: "30s", label: "Every 30s", ms: 30_000 },
  { id: "1m", label: "Every 1m", ms: 60_000 },
  { id: "5m", label: "Every 5m", ms: 300_000 },
  { id: "15m", label: "Every 15m", ms: 900_000 },
];
