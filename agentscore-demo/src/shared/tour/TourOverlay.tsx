/** Spotlight + callout renderer for the cross-page tour. Rendered once by
 * `TourProvider`; renders nothing while idle. See `tour-context.tsx` for the
 * state machine and `use-tour-rect.ts` for measurement.
 */
import { useEffect, useRef } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Popper from "@mui/material/Popper";
import Portal from "@mui/material/Portal";
import Typography from "@mui/material/Typography";

import { useTour } from "@/shared/tour/tour-context";
import { useTourRect } from "@/shared/tour/use-tour-rect";
import type { TourStep } from "@/shared/tour/tour-steps";

const SPOTLIGHT_PADDING = 8;
// Clears MUI's modal (1300) and notistack's snackbar (1400) stacking.
const Z_SPOTLIGHT = 1510;
const Z_CARD = 1511;

function TourCard({
  step,
  stepIndex,
  stepCount,
  onBack,
  onNext,
  onEnd,
}: {
  step: TourStep;
  stepIndex: number;
  stepCount: number;
  onBack: () => void;
  onNext: () => void;
  onEnd: () => void;
}) {
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === stepCount - 1;
  const primaryRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    primaryRef.current?.focus();
  }, [stepIndex]);

  return (
    <Paper
      data-testid="tour-card"
      role="dialog"
      aria-modal={false}
      aria-labelledby="tour-step-title"
      elevation={8}
      sx={{ p: 2.5, width: 320, display: "flex", flexDirection: "column", gap: 1 }}
    >
      <Typography id="tour-step-title" variant="subtitle2" sx={{ fontWeight: 600 }}>
        {step.title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {step.body}
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 1 }}>
        <Button size="small" color="inherit" data-testid="tour-skip" onClick={onEnd}>
          Skip tour
        </Button>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Step {stepIndex + 1} of {stepCount}
          </Typography>
          {!isFirst ? (
            <Button size="small" data-testid="tour-back" onClick={onBack}>
              Back
            </Button>
          ) : null}
          <Button
            ref={primaryRef}
            size="small"
            variant="contained"
            data-testid="tour-next"
            onClick={isLast ? onEnd : onNext}
          >
            {isLast ? "Done" : "Next"}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}

export function TourOverlay() {
  const { active, seeking, step, stepIndex, stepCount, next, back, end } = useTour();
  const selector = active && !seeking && step?.target ? `[data-tour="${step.target}"]` : null;
  const rect = useTourRect(selector);

  useEffect(() => {
    if (!active) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.isContentEditable || /^(input|textarea)$/i.test(target.tagName))) return;
      if (e.key === "Escape") {
        e.preventDefault();
        end();
      } else if (e.key === "ArrowRight" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        back();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active, next, back, end]);

  if (!active || !step) return null;

  // Only render the callout once the target (if any) is actually measured -
  // during `seeking` this shows just the dimmed backdrop, never a card
  // anchored to a stale or missing rect.
  const showCard = !seeking;
  // A target that fills most of the viewport (e.g. a whole scrollable content
  // pane) leaves `flip`/`preventOverflow` no side with room to place the
  // callout - top and bottom both overflow by roughly the same amount, so
  // popper.js has no better option to flip to. Rather than let the card land
  // off-screen, fall back to the centered layout once the target is too big
  // to anchor against sensibly.
  const isAnchorable =
    rect != null && rect.width < window.innerWidth * 0.7 && rect.height < window.innerHeight * 0.7;
  // popper.js needs `contextElement` on a virtual element to resolve
  // viewport/boundary clipping for its `flip`/`preventOverflow` modifiers -
  // without it, `flip` silently no-ops and an anchor near a viewport edge
  // can position the callout off-screen.
  const contextElement = isAnchorable && selector ? document.querySelector(selector) : null;
  const virtualAnchor =
    rect && contextElement ? { getBoundingClientRect: () => rect, contextElement } : null;

  return (
    <Portal>
      <Box
        data-testid="tour-backdrop"
        onClick={end}
        sx={{
          position: "fixed",
          inset: 0,
          zIndex: Z_SPOTLIGHT,
          bgcolor: rect ? "transparent" : "rgba(0, 0, 0, 0.55)",
        }}
      />
      {rect ? (
        <Box
          sx={{
            position: "fixed",
            top: rect.top - SPOTLIGHT_PADDING,
            left: rect.left - SPOTLIGHT_PADDING,
            width: rect.width + SPOTLIGHT_PADDING * 2,
            height: rect.height + SPOTLIGHT_PADDING * 2,
            borderRadius: 1,
            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.55)",
            pointerEvents: "none",
            zIndex: Z_SPOTLIGHT,
            transition: "top 180ms ease, left 180ms ease, width 180ms ease, height 180ms ease",
          }}
        />
      ) : null}
      {showCard ? (
        virtualAnchor ? (
          <Popper
            open
            anchorEl={virtualAnchor}
            placement={step.placement ?? "bottom"}
            modifiers={[
              { name: "offset", options: { offset: [0, 12] } },
              { name: "preventOverflow", options: { padding: 16 } },
              { name: "flip", options: { fallbackPlacements: ["bottom", "top", "right", "left"], padding: 16 } },
            ]}
            sx={{ zIndex: Z_CARD }}
          >
            <TourCard step={step} stepIndex={stepIndex} stepCount={stepCount} onBack={back} onNext={next} onEnd={end} />
          </Popper>
        ) : (
          <Box
            sx={{
              position: "fixed",
              inset: 0,
              zIndex: Z_CARD,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            <Box sx={{ pointerEvents: "auto" }} onClick={(e) => e.stopPropagation()}>
              <TourCard step={step} stepIndex={stepIndex} stepCount={stepCount} onBack={back} onNext={next} onEnd={end} />
            </Box>
          </Box>
        )
      ) : null}
    </Portal>
  );
}
