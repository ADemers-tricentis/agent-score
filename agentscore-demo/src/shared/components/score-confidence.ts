/** How a composite score and its uncertainty are worded, shared by both apps.
 *
 * Replaces the `±5.3 SE (59–80)` readout, which stated the same fact twice in
 * notation nobody outside statistics reads. Two runs of the same agent scored
 * 70.43 and 69.87 — a 0.56 gap that flipped the verdict across the 70.0 band
 * edge — and the page offered no way to tell that apart from the agent getting
 * worse.
 *
 * Three rules come out of that:
 *   1. Show one decimal, so two different scores never render as the same
 *      number on opposite sides of a band edge.
 *   2. State the interval as the thing the reader would actually do — run it
 *      again — rather than as a standard error.
 *   3. Warn only when the interval crosses a band edge. Most runs sit well
 *      inside one band and the caveat would be noise.
 */

import { verdictBandLabel } from "@/shared/components/verdict-band";

/** One decimal, always. The gauge previously rounded to an integer while the
 *  verdict was computed on the unrounded value, so a displayed `70` could sit
 *  on either side of a band edge that is itself exactly 70. */
export function formatScore(value: number): string {
  return value.toFixed(1);
}

/** "Score another sample and you'd likely get 59–80." — the 95% interval said
 *  as an outcome rather than a statistic. Null when the run carries no
 *  interval (a provisional run, or no composite to bound). */
export function confidenceSentence(
  lower: number | null | undefined,
  upper: number | null | undefined,
): string | null {
  if (lower == null || upper == null) return null;
  return `Score another sample and you'd likely get ${lower.toFixed(0)}–${upper.toFixed(0)}.`;
}

/** The band edge the interval straddles, if any — the edge nearest the score.
 *
 * Bands arrive as `{ship: 85, ship_note: 70, review: 55, block_rec: 40}`: each
 * value is the floor of the band it names. An edge strictly inside the
 * interval means a rerun could plausibly land on the other side of it.
 */
function straddledBand(
  composite: number,
  lower: number,
  upper: number,
  bands: Record<string, number>,
): string | null {
  let nearest: { band: string; distance: number } | null = null;
  for (const [band, edge] of Object.entries(bands)) {
    if (edge <= lower || edge >= upper) continue;
    const distance = Math.abs(composite - edge);
    if (nearest === null || distance < nearest.distance) {
      nearest = { band, distance };
    }
  }
  return nearest?.band ?? null;
}

/** "Close to the Ship with note line. Another sample could land on either
 *  side." — rendered only when the interval actually crosses a band edge.
 *
 * This is the sentence that explains a verdict flip before the reader has to
 * ask why the same agent scored 70 twice and got two different answers.
 */
export function boundaryCaveat({
  composite,
  lower,
  upper,
  bands,
}: {
  composite: number | null | undefined;
  lower: number | null | undefined;
  upper: number | null | undefined;
  bands: Record<string, number> | null | undefined;
}): string | null {
  if (composite == null || lower == null || upper == null || !bands) return null;
  const band = straddledBand(composite, lower, upper, bands);
  const label = verdictBandLabel(band);
  if (label === null) return null;
  return `Close to the ${label} line. Another sample could land on either side.`;
}
