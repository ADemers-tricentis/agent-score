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
  { label: "Connect", sub: "via OpenTelemetry", color: brand.primary },
  { label: "Gate", sub: "your CI pipeline", color: brand.teal },
  { label: "Track", sub: "quality over time", color: brand.orange },
];

export const Flow: React.FC<{ durationInFrames: number }> = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const dimsIn = spring({
    frame: frame - 110,
    fps,
    config: { damping: 200 },
    durationInFrames: 26,
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: brand.navyDeep,
        justifyContent: "center",
        alignItems: "center",
        fontFamily,
        gap: 70,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        {STEPS.map((step, i) => {
          const delay = i * 26;
          const stepIn = spring({
            frame: frame - delay,
            fps,
            config: { damping: 200 },
            durationInFrames: 22,
          });
          const connectorIn = interpolate(
            frame - (delay + 14),
            [0, 12],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          );
          return (
            <div key={step.label} style={{ display: "flex", alignItems: "center", gap: 24 }}>
              <div
                style={{
                  width: 260,
                  height: 200,
                  borderRadius: 22,
                  border: `3px solid ${step.color}`,
                  backgroundColor: "rgba(255,255,255,0.04)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 14,
                  opacity: stepIn,
                  transform: `translateY(${interpolate(stepIn, [0, 1], [50, 0])}px)`,
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    backgroundColor: step.color,
                    color: brand.white,
                    fontSize: 28,
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {i + 1}
                </div>
                <div style={{ fontSize: 32, fontWeight: 800, color: brand.white }}>
                  {step.label}
                </div>
                <div style={{ fontSize: 22, color: brand.tealLight }}>{step.sub}</div>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ width: 40, height: 4, backgroundColor: brand.navyMid, borderRadius: 2 }}>
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
          fontSize: 40,
          fontWeight: 700,
          color: brand.white,
          opacity: dimsIn,
          transform: `scale(${interpolate(dimsIn, [0, 1], [0.85, 1])})`,
        }}
      >
        One shared standard.{" "}
        <span style={{ color: brand.orange, fontWeight: 800 }}>Every agent, every team.</span>
      </div>
    </AbsoluteFill>
  );
};
