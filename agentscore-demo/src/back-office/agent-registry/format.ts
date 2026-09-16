/** Agent-registry formatters.
 *
 * `dollarCeilingUsd` arrives on the wire as a decimal-pattern *string* (never a
 * JSON float, to avoid float drift on money), so the formatter parses it.
 */

const CEILING_CURRENCY = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

/** A version's spend ceiling. Rendered at 2dp — it is an operator-typed budget
 *  cap, and the raw wire value carries the column's full scale
 *  (`1.00000000`), which reads as noise in a table.
 *
 *  A sub-cent ceiling keeps its digits instead of rounding to `$0.00`: a
 *  ceiling of zero would mean "this version may not spend at all", which is a
 *  different and false claim about a version that is merely cheap. Same
 *  doctrine as `llm-catalog/usage-format.ts`, which refuses to collapse a
 *  fractional-cent cost into `$0`.
 *
 *  A value that will not parse is returned verbatim rather than swallowed —
 *  seeing the raw string beats a formatter silently inventing one. */
export function formatDollarCeiling(usd: string): string {
  const n = Number(usd);
  if (!Number.isFinite(n)) return usd;
  if (n > 0 && n < 0.01) return `$${n}`;
  return CEILING_CURRENCY.format(n);
}
