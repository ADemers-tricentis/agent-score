import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { auraLight } from "../auraTheme";
import { auraFontFamily } from "../auraFont";
import { Wordmark } from "../components/Wordmark";

// Fixed positions/phases for background particles — deterministic across frames.
const PARTICLES = Array.from({ length: 26 }, (_, i) => ({
  x: (i * 137.5) % 100,
  y: (i * 71.3) % 100,
  size: 2 + (i % 4),
  speed: 0.15 + (i % 5) * 0.05,
  phase: i * 0.7,
}));

export const TitleSlide: React.FC<{ durationInFrames: number }> = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sweepIn = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 40 });
  const ringIn = spring({ frame: frame - 6, fps, config: { damping: 200 }, durationInFrames: 40 });
  const logoIn = spring({ frame: frame - 18, fps, config: { damping: 26, mass: 0.9 }, durationInFrames: 34 });
  const dividerIn = spring({ frame: frame - 50, fps, config: { damping: 200 }, durationInFrames: 26 });
  const taglineIn = spring({ frame: frame - 64, fps, config: { damping: 200 }, durationInFrames: 30 });
  const kickerIn = spring({ frame: frame - 86, fps, config: { damping: 200 }, durationInFrames: 26 });

  const glow = 0.6 + 0.4 * Math.sin(frame / 18);
  const ringRotation = interpolate(frame, [0, 300], [0, 40]);

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% 42%, ${auraLight.backgroundRaised} 0%, ${auraLight.backgroundBase} 70%)`,
        fontFamily: auraFontFamily,
        overflow: "hidden",
      }}
    >
      {/* faint drifting particles */}
      {PARTICLES.map((p, i) => {
        const drift = (frame * p.speed + p.phase * 40) % 1200;
        const y = ((p.y * 10.8 + 1080 - drift) % 1080 + 1080) % 1080;
        const twinkle = 0.15 + 0.15 * Math.sin(frame / 14 + p.phase);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${p.x}%`,
              top: y,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              backgroundColor: auraLight.primary,
              opacity: twinkle,
            }}
          />
        );
      })}

      {/* diagonal light sweep */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: interpolate(sweepIn, [0, 1], [0, 1]) * 0.6,
          background: `linear-gradient(115deg, transparent 35%, hsla(210, 60%, 47%, 0.07) 50%, transparent 65%)`,
          transform: `translateX(${interpolate(sweepIn, [0, 1], [-400, 0])}px)`,
        }}
      />

      {/* orbiting rings behind the wordmark */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 760,
          height: 760,
          marginLeft: -380,
          marginTop: -420,
          borderRadius: "50%",
          border: `1px solid ${auraLight.divider}`,
          opacity: interpolate(ringIn, [0, 1], [0, 0.9]),
          transform: `scale(${interpolate(ringIn, [0, 1], [0.7, 1])}) rotate(${ringRotation}deg)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 560,
          height: 560,
          marginLeft: -280,
          marginTop: -320,
          borderRadius: "50%",
          border: `1px solid ${auraLight.primary}`,
          opacity: interpolate(ringIn, [0, 1], [0, 0.28]),
          transform: `scale(${interpolate(ringIn, [0, 1], [0.7, 1])}) rotate(${-ringRotation * 1.4}deg)`,
        }}
      />

      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        {/* soft ambient shadow beneath the wordmark — Aura's light scheme
            conveys elevation with shadows rather than tonal glows */}
        <div
          style={{
            position: "absolute",
            width: 640,
            height: 640,
            borderRadius: "50%",
            background: `radial-gradient(circle, rgba(0,0,0,${0.05 * glow}) 0%, transparent 70%)`,
            opacity: logoIn,
            filter: "blur(4px)",
          }}
        />

        <div
          style={{
            opacity: logoIn,
            transform: `scale(${interpolate(logoIn, [0, 1], [0.8, 1])}) translateY(${interpolate(logoIn, [0, 1], [24, 0])}px)`,
          }}
        >
          <Wordmark
            fontFamily={auraFontFamily}
            fontSize={128}
            color={auraLight.textPrimary}
            accent={auraLight.warning}
          />
        </div>

        <div
          style={{
            width: interpolate(dividerIn, [0, 1], [0, 220]),
            height: 1,
            marginTop: 40,
            marginBottom: 40,
            borderRadius: 9999,
            backgroundColor: auraLight.divider,
          }}
        />

        <div
          style={{
            fontSize: 44,
            fontWeight: 600,
            color: auraLight.textPrimary,
            textAlign: "center",
            opacity: taglineIn,
            transform: `translateY(${interpolate(taglineIn, [0, 1], [22, 0])}px)`,
          }}
        >
          Stop guessing whether your agents work.
        </div>

        <div
          style={{
            marginTop: 30,
            display: "flex",
            alignItems: "center",
            gap: 14,
            opacity: interpolate(kickerIn, [0, 1], [0, 0.9]),
            transform: `translateY(${interpolate(kickerIn, [0, 1], [14, 0])}px)`,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: auraLight.primary,
              boxShadow: `0 0 ${6 + glow * 6}px ${glow * 2}px hsla(210, 60%, 47%, 0.5)`,
            }}
          />
          <div
            style={{
              fontSize: 22,
              fontWeight: 500,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: auraLight.textSecondary,
            }}
          >
            AI Agent Scoring, Grounded in Real Traces
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
