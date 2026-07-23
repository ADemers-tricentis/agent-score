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

export const CTA: React.FC<{ durationInFrames: number }> = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoIn = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 26 });
  const taglineIn = spring({ frame: frame - 24, fps, config: { damping: 200 }, durationInFrames: 26 });
  const urlIn = spring({ frame: frame - 48, fps, config: { damping: 200 }, durationInFrames: 24 });

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% 45%, ${brand.navyMid} 0%, ${brand.navyDeep} 70%)`,
        justifyContent: "center",
        alignItems: "center",
        fontFamily,
        gap: 48,
      }}
    >
      <div style={{ opacity: logoIn, transform: `scale(${interpolate(logoIn, [0, 1], [0.85, 1])})` }}>
        <Wordmark fontFamily={fontFamily} fontSize={96} />
      </div>

      <div
        style={{
          fontSize: 52,
          fontWeight: 800,
          color: brand.tealLight,
          opacity: taglineIn,
          transform: `translateY(${interpolate(taglineIn, [0, 1], [24, 0])}px)`,
        }}
      >
        Stop guessing whether it works.
      </div>

      <div
        style={{
          marginTop: 8,
          padding: "18px 44px",
          borderRadius: 999,
          backgroundColor: brand.orange,
          color: brand.white,
          fontSize: 34,
          fontWeight: 700,
          opacity: urlIn,
          transform: `translateY(${interpolate(urlIn, [0, 1], [20, 0])}px)`,
        }}
      >
        Request access →
      </div>
    </AbsoluteFill>
  );
};
