/** Report-grain formatters — money and counts summed over a whole window.
 *
 * Deliberately NOT `llm-catalog/usage-format.ts`'s `formatUsageCost`, which is
 * tuned for one call's cost (sub-cent friendly, up to 5dp) and would render a
 * monthly tenant total as `$1234.5678`. `costUsd` still arrives on the wire as
 * a decimal-pattern *string* for the same reason it does there — to avoid
 * float drift on money — so these formatters parse it the same way.
 */

const REPORT_CURRENCY = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const UNIT_CURRENCY = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 4,
  maximumFractionDigits: 4,
});

/** A window's total cost. `null` → "—" (never `$0.00` — absent is not zero). */
export function formatReportCost(usd: string | null): string {
  if (usd == null) return "—";
  const n = Number(usd);
  if (!Number.isFinite(n)) return "—";
  return REPORT_CURRENCY.format(n);
}

/** A per-job average cost. 4dp — a judge call is routinely sub-cent, and 2dp
 *  would round it to `$0.00`. `null` → "—" (no such job ran in this window). */
export function formatUnitCost(usd: string | null): string {
  if (usd == null) return "—";
  const n = Number(usd);
  if (!Number.isFinite(n)) return "—";
  return UNIT_CURRENCY.format(n);
}

/** A window's total count, with thousands separators. */
export function formatReportCount(n: number): string {
  return n.toLocaleString("en-US");
}

/** A per-agent average (e.g. traces per active agent). `null` → "—" (the
 *  tenant has no active agents in this window — never 0). */
export function formatAverage(n: number | null): string {
  if (n == null) return "—";
  return n.toFixed(1);
}
