import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { brand } from "../theme";
import { fontFamily } from "../font";

// Matches the real AgentScore product's score-color thresholds and
// ScoreMeter / GradeChip / ScoreBar hex values (src/components/*.tsx).
const GREEN = "#22c55e";
const AMBER = "#f59e0b";
const CARD_BG = "#141826";
const CARD_BORDER = "rgba(255,255,255,0.08)";
const TRACK = "#1a1f3a";

const DIMENSIONS = [
  { label: "Correctness", score: 94 },
  { label: "Efficiency", score: 88 },
  { label: "Relevance", score: 91 },
  { label: "Safety", score: 97 },
  { label: "Consistency", score: 79 },
  { label: "Tool Use", score: 68 },
];

const COMPOSITE = 92;
const GRADE = "A";

const colorFor = (score: number) => (score >= 75 ? GREEN : score >= 55 ? AMBER : "#ef4444");

export const Dimensions: React.FC<{ durationInFrames: number }> = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleIn = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 24 });
  const cardIn = spring({ frame: frame - 14, fps, config: { damping: 200 }, durationInFrames: 28 });
  const ringProgress = spring({ frame: frame - 26, fps, config: { damping: 200 }, durationInFrames: 46 });
  const chipIn = spring({ frame: frame - 60, fps, config: { damping: 200 }, durationInFrames: 22 });
  const verdictIn = spring({ frame: frame - 76, fps, config: { damping: 200 }, durationInFrames: 22 });
  const metaIn = spring({ frame: frame - 96, fps, config: { damping: 200 }, durationInFrames: 20 });
  const confIn = spring({ frame: frame - 330, fps, config: { damping: 200 }, durationInFrames: 24 });

  const ringSize = 170;
  const strokeWidth = 14;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const ringColor = colorFor(COMPOSITE);
  const compositeShown = Math.round(interpolate(ringProgress, [0, 1], [0, COMPOSITE]));

  const rowsDelay = 118;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: brand.navyDeep,
        justifyContent: "center",
        alignItems: "center",
        fontFamily,
        gap: 36,
      }}
    >
      <div
        style={{
          fontSize: 44,
          fontWeight: 800,
          color: brand.white,
          opacity: titleIn,
          transform: `translateY(${interpolate(titleIn, [0, 1], [-16, 0])}px)`,
          textAlign: "center",
        }}
      >
        What the grade <span style={{ color: brand.orange }}>actually looks like.</span>
      </div>

      <div
        style={{
          width: 1080,
          borderRadius: 20,
          backgroundColor: CARD_BG,
          border: `1px solid ${CARD_BORDER}`,
          padding: 40,
          boxSizing: "border-box",
          display: "flex",
          gap: 40,
          opacity: cardIn,
          transform: `translateY(${interpolate(cardIn, [0, 1], [40, 0])}px) scale(${interpolate(cardIn, [0, 1], [0.96, 1])})`,
          boxShadow: "0 30px 70px rgba(0,0,0,0.45)",
        }}
      >
        {/* Score meter + grade chip */}
        <div style={{ position: "relative", width: ringSize, height: ringSize, flexShrink: 0 }}>
          <svg width={ringSize} height={ringSize} style={{ transform: "rotate(-90deg)" }}>
            <circle cx={ringSize / 2} cy={ringSize / 2} r={radius} fill="none" stroke={TRACK} strokeWidth={strokeWidth} />
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
              fill="none"
              stroke={ringColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - ringProgress)}
            />
          </svg>
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ fontSize: 44, fontWeight: 700, color: brand.white }}>{compositeShown}</div>
            <div style={{ fontSize: 16, color: "rgba(255,255,255,0.45)" }}>/100</div>
          </div>
          <div
            style={{
              position: "absolute",
              bottom: -8,
              right: -8,
              width: 52,
              height: 52,
              borderRadius: 14,
              backgroundColor: "rgba(34,197,94,0.15)",
              border: "2px solid rgba(34,197,94,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 26,
              fontWeight: 800,
              color: GREEN,
              opacity: chipIn,
              transform: `scale(${interpolate(chipIn, [0, 1], [0.6, 1])})`,
            }}
          >
            {GRADE}
          </div>
        </div>

        {/* Verdict + scenario + dimension bars */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              opacity: verdictIn,
              transform: `translateY(${interpolate(verdictIn, [0, 1], [14, 0])}px)`,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 18px",
                borderRadius: 999,
                backgroundColor: "rgba(34,197,94,0.15)",
                color: GREEN,
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              ✓ Passed
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: GREEN }}>Ship</div>
          </div>

          <div
            style={{
              opacity: metaIn,
              transform: `translateY(${interpolate(metaIn, [0, 1], [12, 0])}px)`,
            }}
          >
            <div style={{ fontSize: 26, fontWeight: 600, color: brand.white }}>
              Refund request &mdash; policy exception
            </div>
            <div style={{ fontSize: 18, color: "rgba(255,255,255,0.45)", marginTop: 4 }}>
              Jul 21, 2026 &middot; 2.4s &middot; run #4021
            </div>
          </div>

          <div style={{ height: 1, backgroundColor: "rgba(255,255,255,0.1)", margin: "6px 0" }} />

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {DIMENSIONS.map((dim, i) => {
              const delay = rowsDelay + i * 16;
              const rowIn = spring({ frame: frame - delay, fps, config: { damping: 200 }, durationInFrames: 20 });
              const color = colorFor(dim.score);
              const shown = Math.round(interpolate(rowIn, [0, 1], [0, dim.score]));
              return (
                <div key={dim.label} style={{ display: "flex", alignItems: "center", gap: 16, opacity: rowIn }}>
                  <div style={{ width: 150, fontSize: 20, color: "rgba(255,255,255,0.75)", fontWeight: 500 }}>
                    {dim.label}
                  </div>
                  <div style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.08)" }}>
                    <div
                      style={{
                        width: `${interpolate(rowIn, [0, 1], [0, dim.score])}%`,
                        height: "100%",
                        borderRadius: 4,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                  <div style={{ width: 44, textAlign: "right", fontSize: 20, fontWeight: 700, color }}>
                    {shown}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div
        style={{
          fontSize: 22,
          fontWeight: 600,
          color: brand.white,
          opacity: interpolate(confIn, [0, 1], [0, 0.7]),
          transform: `translateY(${interpolate(confIn, [0, 1], [12, 0])}px)`,
        }}
      >
        92 ± 3 &middot; 240 sessions scored
      </div>
    </AbsoluteFill>
  );
};
