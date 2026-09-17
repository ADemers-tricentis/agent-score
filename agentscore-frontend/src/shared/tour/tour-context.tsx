/** Cross-page product tour - presenter-triggered, no persistence.
 *
 * Must mount INSIDE the router (it navigates), unlike `DemoModeProvider`
 * which wraps `RouterProvider` in `main.tsx`. See `router.tsx`'s
 * `protectedLayoutRoute`, which never unmounts across client-side
 * navigation - that's what lets the tour survive route changes without
 * persisting anything to localStorage. A hard reload simply ends it.
 */
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";

import { useDemoMode } from "@/shared/demo-mode/demo-mode-context";
import { TourOverlay } from "@/shared/tour/TourOverlay";
import { tourStepsFor, type TourStep } from "@/shared/tour/tour-steps";

type TourPhase =
  | { phase: "idle" }
  // Navigating to the step's route and/or waiting for its target to mount.
  | { phase: "seeking"; index: number }
  | { phase: "ready"; index: number };

interface TourContextValue {
  active: boolean;
  seeking: boolean;
  step: TourStep | null;
  stepIndex: number;
  stepCount: number;
  start: () => void;
  next: () => void;
  back: () => void;
  end: () => void;
}

const TourContext = createContext<TourContextValue | null>(null);

/** `useFakeQuery`-backed pages can lag a navigation before their target
 * mounts; give up and end cleanly rather than stalling the presenter. */
const RESOLVE_TIMEOUT_MS = 2500;

export function TourProvider({ children }: { children: ReactNode }) {
  const { blank } = useDemoMode();
  const steps = tourStepsFor(blank);
  const [state, setState] = useState<TourPhase>({ phase: "idle" });
  const navigate = useNavigate();
  const location = useLocation();
  // Bumped on every start/goTo/end so a stale async resolver (from a prior
  // step, or from a StrictMode double-invoked effect) can recognize itself as
  // stale and bail instead of writing state for the wrong step.
  const runIdRef = useRef(0);
  const triggerElRef = useRef<HTMLElement | null>(null);
  const stepIndex = state.phase === "idle" ? 0 : state.index;

  const end = () => {
    runIdRef.current += 1;
    setState({ phase: "idle" });
    triggerElRef.current?.focus?.();
    triggerElRef.current = null;
  };

  const goTo = (index: number) => {
    if (index < 0 || index >= steps.length) {
      end();
      return;
    }
    runIdRef.current += 1;
    setState({ phase: "seeking", index });
  };

  const start = () => {
    triggerElRef.current = document.activeElement as HTMLElement | null;
    goTo(0);
  };
  const next = () => {
    if (state.phase === "ready") goTo(state.index + 1);
  };
  const back = () => {
    if (state.phase === "ready") goTo(state.index - 1);
  };

  // Resolve the current "seeking" step: navigate if needed, then poll for
  // its target to mount at a usable size.
  useEffect(() => {
    if (state.phase !== "seeking") return;
    const myRunId = runIdRef.current;
    const index = state.index;
    const targetStep = steps[index];
    if (!targetStep) {
      end();
      return;
    }

    if (location.pathname !== targetStep.to) {
      void navigate({ to: targetStep.to, params: targetStep.params, search: targetStep.search } as never);
    }

    let raf = 0;
    const deadline = Date.now() + RESOLVE_TIMEOUT_MS;

    const tick = () => {
      if (runIdRef.current !== myRunId) return;
      if (!targetStep.target) {
        setState({ phase: "ready", index });
        return;
      }
      const el = document.querySelector(`[data-tour="${targetStep.target}"]`);
      const rect = el?.getBoundingClientRect();
      if (el && rect && rect.width > 0 && rect.height > 0) {
        el.scrollIntoView({ block: "center", inline: "nearest", behavior: "auto" });
        setState({ phase: "ready", index });
        return;
      }
      if (Date.now() > deadline) {
        end();
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // navigate/end/steps are stable enough for this effect's purpose - what
    // actually drives re-resolution is the phase/index/pathname triad.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, stepIndex, location.pathname]);

  const step = state.phase === "idle" ? null : steps[stepIndex] ?? null;

  const value: TourContextValue = {
    active: state.phase !== "idle",
    seeking: state.phase === "seeking",
    step,
    stepIndex,
    stepCount: steps.length,
    start,
    next,
    back,
    end,
  };

  return (
    <TourContext.Provider value={value}>
      {children}
      <TourOverlay />
    </TourContext.Provider>
  );
}

export function useTour(): TourContextValue {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error("useTour must be used within a TourProvider");
  return ctx;
}
