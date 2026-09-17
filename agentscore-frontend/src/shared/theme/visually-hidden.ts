/** The one screen-reader-only style object. Import it; do not re-type it.
 *
 * **Why this is shared rather than inlined per use: the obvious hand-rolled
 * version is broken in `sx`, invisibly.** The recipe everyone copies from the
 * web writes `width: 1, height: 1` meaning one pixel — but MUI's `sx` maps a
 * unitless number in `(0, 1]` for `width`/`height` to a **percentage**, so
 * `width: 1` is `width: 100%`. The element stays invisible (`clip` hides it), so
 * nothing looks wrong; it is simply 100% wide and `position: absolute`, which
 * inflates the document's scroll area.
 *
 * That produced a real bug: the "Your position" cell label in the customer
 * Profile tab's verdict-band table measured 1265px wide on a 1265px viewport,
 * pushing `document.scrollWidth` to 2030 and giving the page a second,
 * document-level scrollbar beside the shell's own — three hand-rolled copies of
 * the object all had it.
 *
 * `margin: -1` is the same trap one axis over: MUI's spacing scale would read it
 * as `-8px`. Both are strings here so `sx` passes them through verbatim.
 *
 * Keep in step with the values MUI's own `visuallyHidden` uses. It is not
 * imported from `@mui/utils` because that package is only a transitive
 * dependency of this workspace, and pnpm's strict layout would make the import
 * resolve today and break on any hoisting change.
 *
 * **The same `position: absolute` shape bit a second time, vertically.** An
 * element using this recipe inside a `overflow: auto` scroll container whose
 * OWN `position` is left at the default `static` is not clipped by that
 * container at all — a `static` box is not a containing block, so the hidden
 * element positions against the page's initial containing block instead,
 * landing wherever it sits in document flow and stretching
 * `document.scrollHeight` out to it, the same way the horizontal bug above
 * stretched `scrollWidth`. This is what made the whole app shell scroll
 * instead of just the assistant transcript: each turn's visually-hidden
 * "Assistant's answer" label reported `offsetParent: BODY`, and the last
 * one's document offset matched `documentElement.scrollHeight` exactly. The
 * fix belongs on the scroll container (`ScrollRegion`'s own `position:
 * "relative"`, so it becomes a containing block and clips its
 * absolutely-positioned descendants again), not on this recipe — but any
 * future use of `visuallyHidden` inside a NEW, non-`ScrollRegion` scroll
 * container should give that container `position: "relative"` too.
 */
export const visuallyHidden = {
  position: "absolute",
  width: "1px",
  height: "1px",
  padding: 0,
  margin: "-1px",
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
  border: 0,
} as const;
