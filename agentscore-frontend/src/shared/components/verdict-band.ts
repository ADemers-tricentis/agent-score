/** The five-band verdict vocabulary, shared by both apps.
 *
 * One map, not two. The back-office and the customer app previously rendered
 * the same band with different words — the back-office said "Ship (note)"
 * while the customer app collapsed `ship_note` into a plain "Ship" through the
 * three-state `ship_decision`. A customer whose profile requires 85 to ship
 * then read "Ship" on a 70, which is the one reading the band exists to
 * prevent.
 *
 * Mirrors `verdict_for` in `services/platform/.../scoring/aggregate.py`, which
 * owns the thresholds. This module owns only the words.
 */

export type VerdictBand =
  | "ship"
  | "ship_note"
  | "review"
  | "block_rec"
  | "block"
  | "insufficient_sample";

/** All five bands stay distinct. `block_rec` and `block` are not merged: the
 *  profile card lists every band beside its threshold, so two bands sharing a
 *  label would render as a duplicated row. */
export const VERDICT_BAND_LABEL = {
  ship: "Ship",
  ship_note: "Ship with note",
  review: "Needs work",
  block_rec: "Don't ship (recommended)",
  block: "Don't ship",
  insufficient_sample: "Insufficient sample",
} as const satisfies Record<VerdictBand, string>;

export function verdictBandLabel(band: string | null | undefined): string | null {
  if (!band) return null;
  return VERDICT_BAND_LABEL[band as VerdictBand] ?? null;
}
