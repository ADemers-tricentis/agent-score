import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { brand } from "../theme";
import { fontFamily } from "../font";

const STEPS = [
  { label: "Session fails", culprit: false },
  { label: "Agent calls wrong tool", culprit: true },
  { label: "Bad data returned", culprit: false },
  { label: "Response sent to user", culprit: false },
];

export const Attribution: React.FC<{ durationInFrames: number }> = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleIn = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 24 });
  const chainDelay = 28;
  const rootCauseDelay = chainDelay + STEPS.length * 16 + 16;
  const rootCauseIn = spring({
    frame: frame - rootCauseDelay,
    fps,
    config: { damping: 200 },
    durationInFrames: 24,
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: brand.navyDeep,
        justifyContent: "center",
        alignItems: "center",
        fontFamily,
        gap: 60,
      }}
    >
      <div
        style={{
          fontSize: 52,
          fontWeight: 800,
          color: brand.white,
          opacity: titleIn,
          transform: `translateY(${interpolate(titleIn, [0, 1], [-20, 0])}px)`,
          textAlign: "center",
        }}
      >
        Know <span style={{ color: brand.orange }}>why</span>, not just what.
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {STEPS.map((step, i) => {
          const delay = chainDelay + i * 16;
          const stepIn = spring({
            frame: frame - delay,
            fps,
            config: { damping: 200 },
            durationInFrames: 20,
          });
          const connectorIn = interpolate(
            frame - (delay + 10),
            [0, 12],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          );
          return (
            <div key={step.label} style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div
                style={{
                  width: 220,
                  padding: "24px 20px",
                  borderRadius: 16,
                  backgroundColor: step.culprit ? brand.orange : "rgba(255,255,255,0.06)",
                  border: step.culprit ? `3px solid ${brand.orangeDark}` : "3px solid transparent",
                  color: brand.white,
                  fontSize: 22,
                  fontWeight: 700,
                  textAlign: "center",
                  opacity: stepIn,
                  transform: `translateY(${interpolate(stepIn, [0, 1], [30, 0])}px) scale(${interpolate(stepIn, [0, 1], [0.92, 1])})`,
                }}
              >
                {step.label}
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ width: 30, height: 4, backgroundColor: brand.navyMid, borderRadius: 2 }}>
                  <div
                    style={{
                      width: `${connectorIn * 100}%`,
                      height: "100%",
                      backgroundColor: brand.orange,
                      borderRadius: 2,
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 24,
          opacity: rootCauseIn,
          transform: `translateY(${interpolate(rootCauseIn, [0, 1], [24, 0])}px)`,
        }}
      >
        <div
          style={{
            padding: "14px 28px",
            borderRadius: 999,
            backgroundColor: brand.blockBg,
            color: "#a53125",
            fontSize: 26,
            fontWeight: 800,
          }}
        >
          Root cause: Tool misuse
        </div>
        <div style={{ fontSize: 26, fontWeight: 700, color: brand.tealLight }}>
          92% confidence
        </div>
      </div>
    </AbsoluteFill>
  );
};
