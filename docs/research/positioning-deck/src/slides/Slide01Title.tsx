import { Slide } from "../components/Slide";
import { Wordmark } from "../components/Wordmark";
import { brand, surface, SLIDE_W, SLIDE_H } from "../theme/theme";

// Static adaptation of agent-score-video TitleSlide.tsx: orbiting rings +
// scattered particles behind the wordmark, minus animation.
const PARTICLES = Array.from({ length: 30 }, (_, i) => ({
  x: (i * 137.5) % 100,
  y: (i * 71.3) % 100,
  size: 2 + (i % 4),
}));

export const Slide01Title: React.FC = () => (
  <Slide index={1} bare>
    <div
      style={{
        width: SLIDE_W,
        height: SLIDE_H,
        position: "relative",
        background: `radial-gradient(circle at 50% 42%, ${brand.navyMid} 0%, ${brand.navyDeep} 68%)`,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {PARTICLES.map((p, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            background: brand.tealLight,
            opacity: 0.35,
          }}
        />
      ))}

      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 900,
          height: 900,
          marginLeft: -450,
          marginTop: -470,
          borderRadius: "50%",
          border: `1px solid rgba(255,255,255,0.14)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 660,
          height: 660,
          marginLeft: -330,
          marginTop: -370,
          borderRadius: "50%",
          border: `1px solid ${brand.orange}33`,
        }}
      />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 42,
          position: "relative",
          zIndex: 1,
        }}
      >
        <Wordmark fontSize={128} color={surface.textOnDark} accent={brand.orange} />

        <div style={{ width: 220, height: 1, background: "rgba(255,255,255,0.22)" }} />

        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 56, fontWeight: 800, color: surface.textOnDark, letterSpacing: -0.5 }}>
            AgentScore Competitive Positioning
          </div>
          <div style={{ fontSize: 30, fontWeight: 500, color: surface.textOnDarkSecondary }}>
            Where we stand in the agentic eval market
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginTop: 8,
          }}
        >
          <div
            style={{
              width: 9,
              height: 9,
              borderRadius: "50%",
              background: brand.orange,
            }}
          />
          <div
            style={{
              fontSize: 20,
              fontWeight: 600,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: surface.textOnDarkSecondary,
            }}
          >
            September 2026
          </div>
        </div>
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 1,
          textAlign: "center",
          paddingBottom: 56,
          fontSize: 15,
          color: "rgba(255,255,255,0.45)",
          letterSpacing: 0.4,
        }}
      >
        © Tricentis. All rights reserved.
      </div>
    </div>
  </Slide>
);
