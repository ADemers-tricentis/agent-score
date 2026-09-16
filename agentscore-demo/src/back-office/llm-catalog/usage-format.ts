/** LLM usage formatters (build-plan S9) — token, cost and latency.
 *
 * `costUsd` arrives on the wire as a decimal-pattern *string* (never a JSON
 * float, to avoid float drift on money), so the cost formatter parses it.
 *
 * A `null` cost renders as an explicit "unpriced", never as `$0.00` — absent
 * is not zero: a model with no row
 * in `model_prices` is unpriced, and Bedrock models are routinely unpriced by
 * the bundled table. Collapsing "unpriced" into "$0" would read as a free
 * call, which is a different, false claim.
 */

/** Compact USD cost. `null` → "unpriced" (never `$0.00`). `0` → "$0". Sub-cent
 *  amounts get 5dp so a fractional-cent judge call doesn't round to zero. */
export function formatUsageCost(costUsd: string | null): string {
  if (costUsd == null) return "unpriced";
  const n = Number(costUsd);
  if (!Number.isFinite(n)) return "unpriced";
  if (n === 0) return "$0";
  if (n < 0.01) return `$${n.toFixed(5)}`;
  return `$${n.toFixed(4)}`;
}

/** Token count with thousands separators. `null` → "—" (a call that returned
 * no usage block at all, distinct from a genuine 0). */
export function formatUsageTokens(tokens: number | null): string {
  if (tokens == null) return "—";
  return tokens.toLocaleString("en-US");
}

/** Wall-time duration. Sub-second → whole ms; sub-minute → seconds at 2dp;
 *  else `{m}m{ss}s`. `null` → "—" (never fetched / not applicable). */
export function formatUsageLatencyMs(ms: number | null): string {
  if (ms == null) return "—";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  const totalSec = ms / 1000;
  if (totalSec < 60) return `${totalSec.toFixed(2)}s`;
  const rounded = Math.round(totalSec);
  const m = Math.floor(rounded / 60);
  const s = rounded % 60;
  return `${m}m${String(s).padStart(2, "0")}s`;
}
