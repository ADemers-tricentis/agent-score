import type { TraceEvalResultOut } from "@/back-office/agents/fake-trace-data";

// `evalLabel` (dotted-prefix strip + de-snake) is shared verbatim with the
// run-result page's per-eval cards — re-exported here rather than
// re-implemented so the two surfaces can never drift on the same slug.
export { evalLabel } from "@/back-office/agents/scoring/run-format";

/**
 * True when this eval produced a score. A `null` score is an honest
 * "insufficient evidence" (`Verdict.score`'s own invariant) — never a zero
 * and never a failure. There is no third state to check: `skipped` came
 * from machinery the S8b cutover retires, and a trace that produces zero
 * verdicts halts the whole run instead of writing a per-eval failure row.
 */
export function isScored(result: { score: number | null }): boolean {
  return result.score != null;
}

/**
 * Reading order for a trace's eval cards: scored first, then insufficient
 * evidence — an operator scanning down reads results before absences
 * (mockup panel 1's own note).
 */
export function sortResults<T extends { score: number | null; evalSlug: string }>(
  results: T[],
): T[] {
  return [...results].sort((a, b) => {
    const byState = Number(isScored(a) ? 0 : 1) - Number(isScored(b) ? 0 : 1);
    if (byState !== 0) return byState;
    return a.evalSlug.localeCompare(b.evalSlug);
  });
}

/** "5 of 9 evals scored" — the score view's header caption. */
export function coverageLabel(scoredEvals: number, totalEvals: number): string {
  return `${scoredEvals} of ${totalEvals} evals scored`;
}

/** "5/9 evals" — the trace-list cell's compact form of the same fact. */
export function listCoverageLabel(scoredEvals: number, totalEvals: number): string {
  return `${scoredEvals}/${totalEvals} evals`;
}

/**
 * Explicit stand-in for a scored result with no recorded `reason`.
 *
 * A null reason is ambiguous on its own — the judge may have genuinely given
 * none, or the result may predate the column that stores it — but either way
 * a blank block would read as a rendering bug, not an absence. Naming the
 * absence keeps the two facts ("scored" and "no reason on file") both
 * visible instead of the second one silently disappearing.
 */
export const JUDGE_REASON_ABSENT = "No judge reason recorded for this result.";

/**
 * Operator-facing copy for an insufficient-evidence eval: how many of the
 * judge's samples came back null. `sampleCount`/`nullCount` are surfaced
 * here (not just the honest-null score) because they are what lets a reader
 * tell "the judge sampled and mostly got nothing" apart from "the judge
 * sampled once and got nothing" — the same evidence a silently-dropped-nulls
 * bug would otherwise hide.
 */
export function insufficientEvidenceCopy(result: TraceEvalResultOut): string {
  return `${result.nullCount} of ${result.sampleCount} sample${result.sampleCount === 1 ? "" : "s"} returned no verdict.`;
}
