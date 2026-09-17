import { useEffect, useState } from "react";

/**
 * Tracks the live `getBoundingClientRect()` of the element matching
 * `selector`, re-measuring on resize and on scroll from ANY scroller.
 *
 * Capture-phase is the key detail: the app's scroll container is an inner
 * `Box` in `MinimalShell`, not the window, and a capture-phase listener on
 * `window` still sees scroll events bubbling up from any nested scroller
 * without having to locate it. `position: fixed` overlays (the spotlight and
 * the callout's virtual anchor) only need rects in viewport coordinates, so
 * there's no scroll-offset math to do beyond re-measuring.
 */
export function useTourRect(selector: string | null): DOMRect | null {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!selector) {
      setRect(null);
      return;
    }
    const el = document.querySelector(selector);
    if (!el) {
      setRect(null);
      return;
    }

    const measure = () => setRect(el.getBoundingClientRect());
    measure();

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(el);
    resizeObserver.observe(document.documentElement);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, { capture: true, passive: true });

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, { capture: true });
    };
  }, [selector]);

  return rect;
}
