/** Dashboard display formatters — mirrors the real
 * `back-office/dashboard/format.ts`. `fmtRelative` is re-exported from
 * `shared/format/relative.ts`, same as the real module does.
 */

/** Compact integer with thousands separators (e.g. 12,405). */
export function fmtCount(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString();
}

/** 0–1 ratio → one-decimal percent (e.g. 0.0432 → "4.3%"). */
export function fmtPercent1(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `${(value * 100).toFixed(1)}%`;
}

export { fmtRelative } from "@/shared/format/relative";

/** Composite score → display string. `null`/`undefined` → "—", NEVER "0"
 * (a null score is not a zero score). */
export function fmtScore(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return Math.round(value).toString();
}
