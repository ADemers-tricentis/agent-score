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

export const Reveal: React.FC<{ durationInFrames: number }> = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoIn = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 24 });
  const lineIn = spring({ frame: frame - 20, fps, config: { damping: 200 }, durationInFrames: 26 });
  const subIn = spring({ frame: frame - 130, fps, config: { damping: 200 }, durationInFrames: 26 });

  // spans lighting up as the agent is "watched"
  const spans = [0, 1, 2, 3, 4, 5];

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${brand.primary} 0%, ${brand.teal} 100%)`,
        justifyContent: "center",
        alignItems: "center",
        fontFamily,
        gap: 50,
      }}
    >
      <div style={{ opacity: logoIn }}>
        <Wordmark fontFamily={fontFamily} fontSize={52} color={brand.white} accent={brand.orange} />
      </div>

      <div
        style={{
          fontSize: 58,
          fontWeight: 800,
          color: brand.white,
          textAlign: "center",
          maxWidth: 1200,
          lineHeight: 1.2,
          opacity: lineIn,
          transform: `translateY(${interpolate(lineIn, [0, 1], [24, 0])}px)`,
        }}
      >
        Figures out what to test by{" "}
        <span
          style={{
            color: brand.navyDeep,
            backgroundColor: brand.tealLight,
            padding: "0 14px",
            borderRadius: 10,
          }}
        >
          watching your agent work.
        </span>
      </div>

      <div style={{ display: "flex", gap: 18, marginTop: 20 }}>
        {spans.map((s) => {
          const on = spring({
            frame: frame - (40 + s * 8),
            fps,
            config: { damping: 200 },
            durationInFrames: 18,
          });
          const breathe = on >= 1 ? 0.85 + 0.15 * Math.sin(frame / 10 + s) : 1;
          return (
            <div
              key={s}
              style={{
                width: 120,
                height: 16,
                borderRadius: 8,
                backgroundColor: brand.white,
                opacity: interpolate(on, [0, 1], [0.25, 1]) * breathe,
                transform: `scaleY(${interpolate(on, [0, 1], [0.5, 1])})`,
              }}
            />
          );
        })}
      </div>

      <div
        style={{
          fontSize: 30,
          fontWeight: 600,
          color: brand.white,
          opacity: interpolate(subIn, [0, 1], [0, 0.85]),
          transform: `translateY(${interpolate(subIn, [0, 1], [16, 0])}px)`,
        }}
      >
        Reading the OpenTelemetry traces your agent already emits.
      </div>
    </AbsoluteFill>
  );
};
