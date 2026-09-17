/**
 * Human-readable duration. Sub-second → `ms`; sub-minute → `s` with 2dp;
 * then `{m}m{ss}s`; then `{h}h{mm}m`. e.g. 96_000 → "1m36s",
 * 657_660 → "10m58s", 3_661_000 → "1h01m".
 */
export function formatDuration(ms?: number | null): string {
  if (ms == null) return "—";
  if (ms < 1000) return `${Math.round(ms)}ms`;

  const totalSec = ms / 1000;
  if (totalSec < 60) return `${totalSec.toFixed(2)}s`;

  const rounded = Math.round(totalSec);
  const h = Math.floor(rounded / 3600);
  const m = Math.floor((rounded % 3600) / 60);
  const s = rounded % 60;
  if (h > 0) return `${h}h${String(m).padStart(2, "0")}m`;
  return `${m}m${String(s).padStart(2, "0")}s`;
}

/** Compact USD cost. `$0` when zero, 5dp under a cent, else 4dp. */
export function formatCostUsd(usd?: number | null): string {
  if (usd == null) return "—";
  if (usd === 0) return "$0";
  if (usd < 0.01) return `$${usd.toFixed(5)}`;
  return `$${usd.toFixed(4)}`;
}
