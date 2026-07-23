import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { brand } from "../theme";
import { fontFamily } from "../font";
import { Wordmark } from "../components/Wordmark";

export const Hook: React.FC<{ durationInFrames: number }> = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoIn = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 30 });
  const logoY = interpolate(logoIn, [0, 1], [40, 0]);

  const lineIn = spring({ frame: frame - 45, fps, config: { damping: 200 }, durationInFrames: 30 });
  const questionIn = spring({ frame: frame - 78, fps, config: { damping: 200 }, durationInFrames: 30 });

  // pulsing live dot
  const pulse = 0.5 + 0.5 * Math.sin(frame / 6);

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% 35%, ${brand.navyMid} 0%, ${brand.navyDeep} 70%)`,
        justifyContent: "center",
        alignItems: "center",
        fontFamily,
      }}
    >
      <div style={{ opacity: logoIn, transform: `translateY(${logoY}px)` }}>
        <Wordmark fontFamily={fontFamily} fontSize={72} />
      </div>

      <div
        style={{
          marginTop: 56,
          display: "flex",
          alignItems: "center",
          gap: 16,
          opacity: lineIn,
          transform: `translateY(${interpolate(lineIn, [0, 1], [20, 0])}px)`,
        }}
      >
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: "50%",
            backgroundColor: brand.tealLight,
            boxShadow: `0 0 ${12 + pulse * 18}px ${pulse * 6}px ${brand.tealLight}`,
          }}
        />
        <div style={{ fontSize: 40, color: brand.white, fontWeight: 600 }}>
          Your agents are already live.
        </div>
      </div>

      <div
        style={{
          marginTop: 28,
          fontSize: 46,
          fontWeight: 700,
          color: brand.tealLight,
          opacity: questionIn,
          transform: `translateY(${interpolate(questionIn, [0, 1], [20, 0])}px)`,
          textAlign: "center",
        }}
      >
        But is it actually working?
      </div>
    </AbsoluteFill>
  );
};
