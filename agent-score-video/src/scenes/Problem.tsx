import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { brand } from "../theme";
import { fontFamily } from "../font";

const CARDS = [
  {
    title: "The blank-page problem",
    body: "You don't even know what to test.",
    bg: brand.reviewBg,
    accent: brand.orange,
    icon: "?",
  },
  {
    title: "Testing the wrong things",
    body: "Generic checks miss what actually matters.",
    bg: brand.blockBg,
    accent: "#c0392b",
    icon: "✕",
  },
  {
    title: "No signal once you do",
    body: "A pass/fail tells you nothing about why.",
    bg: brand.bgMid,
    accent: brand.primary,
    icon: "—",
  },
];

export const Problem: React.FC<{ durationInFrames: number }> = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleIn = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 25 });
  const closerIn = spring({ frame: frame - 620, fps, config: { damping: 200 }, durationInFrames: 26 });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: brand.navyDeep,
        justifyContent: "center",
        alignItems: "center",
        fontFamily,
      }}
    >
      <div
        style={{
          fontSize: 56,
          fontWeight: 800,
          color: brand.white,
          opacity: titleIn,
          transform: `translateY(${interpolate(titleIn, [0, 1], [-20, 0])}px)`,
          marginBottom: 64,
        }}
      >
        Evaluating AI agents is <span style={{ color: brand.orange }}>hard.</span>
      </div>

      <div style={{ display: "flex", gap: 40 }}>
        {CARDS.map((card, i) => {
          const delay = 30 + i * 30;
          const cardIn = spring({
            frame: frame - delay,
            fps,
            config: { damping: 200 },
            durationInFrames: 28,
          });
          const breathe = cardIn >= 1 ? 1 + 0.012 * Math.sin(frame / 40 + i * 2) : 1;
          return (
            <div
              key={card.title}
              style={{
                width: 420,
                height: 340,
                borderRadius: 24,
                backgroundColor: card.bg,
                padding: 40,
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                gap: 20,
                opacity: cardIn,
                transform: `translateY(${interpolate(cardIn, [0, 1], [60, 0])}px) scale(${interpolate(cardIn, [0, 1], [0.94, 1]) * breathe})`,
                boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
              }}
            >
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 18,
                  backgroundColor: card.accent,
                  color: brand.white,
                  fontSize: 40,
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {card.icon}
              </div>
              <div style={{ fontSize: 34, fontWeight: 800, color: brand.navy }}>
                {card.title}
              </div>
              <div style={{ fontSize: 26, color: brand.navyMid, lineHeight: 1.4 }}>
                {card.body}
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          marginTop: 48,
          fontSize: 34,
          fontWeight: 700,
          color: brand.tealLight,
          opacity: closerIn,
          transform: `translateY(${interpolate(closerIn, [0, 1], [20, 0])}px)`,
        }}
      >
        No objective basis for shipping the next update.
      </div>
    </AbsoluteFill>
  );
};
