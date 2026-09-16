export interface TimeRangePreset {
  id: string;
  /** Short badge shown in the trigger (e.g. "7d"). */
  badge: string;
  /** Menu label (e.g. "Past 7 days"). */
  label: string;
  /** Window length in minutes. */
  minutes: number;
}

export const TIME_RANGE_PRESETS: TimeRangePreset[] = [
  { id: "30m", badge: "30m", label: "Past 30 min", minutes: 30 },
  { id: "1h", badge: "1h", label: "Past 1 hour", minutes: 60 },
  { id: "6h", badge: "6h", label: "Past 6 hours", minutes: 360 },
  { id: "1d", badge: "1d", label: "Past 1 day", minutes: 1440 },
  { id: "3d", badge: "3d", label: "Past 3 days", minutes: 4320 },
  { id: "7d", badge: "7d", label: "Past 7 days", minutes: 10080 },
  { id: "14d", badge: "14d", label: "Past 14 days", minutes: 20160 },
  { id: "30d", badge: "30d", label: "Past 30 days", minutes: 43200 },
  { id: "90d", badge: "90d", label: "Past 90 days", minutes: 129600 },
];

export type TimeRangeValue =
  | { kind: "preset"; preset: string }
  | { kind: "custom"; from: Date; to: Date };

/**
 * Resolve a `TimeRangeValue` to a concrete `{ from, to }` window. For presets
 * this is relative to `now`, so call it at fetch time (not render time) to
 * keep the window fresh — see `AgentTracesPage` for the nonce pattern.
 */
export function resolveTimeRange(value: TimeRangeValue): {
  from: Date;
  to: Date;
} {
  if (value.kind === "custom") return { from: value.from, to: value.to };
  const preset =
    TIME_RANGE_PRESETS.find((p) => p.id === value.preset) ??
    TIME_RANGE_PRESETS.find((p) => p.id === "7d")!;
  const to = new Date();
  const from = new Date(to.getTime() - preset.minutes * 60_000);
  return { from, to };
}
