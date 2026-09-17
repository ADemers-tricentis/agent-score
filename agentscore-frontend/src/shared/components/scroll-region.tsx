import { forwardRef, type ReactNode } from "react";
import Box from "@mui/material/Box";

/**
 * The one scroll container a page should use for its body. `flex: 1` +
 * `minHeight: 0` lets it shrink inside a viewport-bounded flex column (the
 * `minHeight: 0` is the flexbox-overflow gotcha — without it the region grows
 * instead of scrolling), and `overflowY: 'auto'` scrolls the content. Pair
 * with `flex-shrink: 0` headers.
 *
 * `position: "relative"` makes this region a CSS containing block for its
 * absolutely-positioned descendants — without it (the default `static`), an
 * `overflow: auto` box does NOT clip a `position: absolute` child; the child
 * positions against the initial containing block (the viewport/document)
 * instead, extending `document.scrollHeight` to wherever it sits and scrolling
 * the whole page along with it. This bit for real: the assistant transcript's
 * visually-hidden per-turn labels (`visually-hidden.ts`'s own doc comment
 * records the story) were each reporting `offsetParent: BODY` and stretching
 * the document to the last one's offset. Every other call site already wraps
 * its own absolutely-positioned children in a closer `position: "relative"`
 * ancestor of their own, so this does not change what any of them clip
 * against — checked before making this the shared default.
 *
 * Forwards its ref to the scrollable `<div>` itself — a caller that needs to
 * read `scrollTop`/`scrollHeight` (e.g. an autoscroll-when-pinned-to-bottom
 * behavior) or set `scrollTop` directly needs the real DOM node, not a
 * `scrollIntoView` call: jsdom stubs that to a no-op in tests, which would
 * make the behavior untestable.
 */
export const ScrollRegion = forwardRef<HTMLDivElement, { children: ReactNode } & React.ComponentProps<"div">>(
  function ScrollRegion({ children, className, ...rest }, ref) {
    return (
      <Box
        ref={ref}
        data-slot="scroll-region"
        className={className}
        sx={{ position: "relative", minHeight: 0, flex: 1, overflowY: "auto" }}
        {...rest}
      >
        {children}
      </Box>
    );
  },
);
