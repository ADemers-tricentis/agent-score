import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SLIDES, SLIDE_COUNT } from "../data/slideRegistry";
import { SLIDE_W, SLIDE_H, brand } from "../theme/theme";

function useViewportSize() {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return size;
}

// Full-viewport interactive deck: one slide at a time, scaled to fit the
// window while preserving the 1920x1080 aspect ratio, navigable by arrow
// keys or click, with the current slide reflected in the URL so any slide
// is directly linkable (/deck/7).
export const DeckViewer: React.FC = () => {
  const { n } = useParams<{ n: string }>();
  const navigate = useNavigate();
  const { w, h } = useViewportSize();

  const current = useMemo(() => {
    const parsed = Number(n);
    if (!Number.isFinite(parsed)) return 1;
    return Math.min(Math.max(1, Math.round(parsed)), SLIDE_COUNT);
  }, [n]);

  useEffect(() => {
    if (String(current) !== n) {
      navigate(`/deck/${current}`, { replace: true });
    }
  }, [current, n, navigate]);

  const goTo = useCallback(
    (target: number) => {
      const clamped = Math.min(Math.max(1, target), SLIDE_COUNT);
      navigate(`/deck/${clamped}`);
    },
    [navigate],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        goTo(current + 1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        goTo(current - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, goTo]);

  const scale = Math.min(w / SLIDE_W, h / SLIDE_H);
  const CurrentSlide = SLIDES[current - 1];

  const onStageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const x = e.clientX;
    if (x < w / 2) {
      goTo(current - 1);
    } else {
      goTo(current + 1);
    }
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: brand.navyDeep,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        cursor: "pointer",
      }}
      onClick={onStageClick}
    >
      <div
        style={{
          width: SLIDE_W,
          height: SLIDE_H,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
          flexShrink: 0,
          boxShadow: "0 24px 80px rgba(0,0,0,0.45)",
        }}
      >
        <CurrentSlide />
      </div>

      <div
        style={{
          position: "fixed",
          bottom: 18,
          right: 24,
          fontFamily: "'Inter', sans-serif",
          fontSize: 13,
          fontWeight: 600,
          color: "rgba(255,255,255,0.55)",
          letterSpacing: 0.4,
          userSelect: "none",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {current} / {SLIDE_COUNT} &middot; ←/→ to navigate
      </div>
    </div>
  );
};
