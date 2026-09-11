import { Slide } from "../components/Slide";
import { Wordmark } from "../components/Wordmark";
import { brand, surface, SLIDE_W, SLIDE_H } from "../theme/theme";

export const Slide24Closing: React.FC = () => (
  <Slide index={24} bare>
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
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          gap: 48,
          padding: "0 120px",
          maxWidth: 1680,
        }}
      >
        <Wordmark fontSize={40} color={surface.textOnDark} accent={brand.orange} />

        <h1
          style={{
            fontSize: 78,
            fontWeight: 800,
            lineHeight: 1.12,
            letterSpacing: -1.5,
            color: surface.textOnDark,
            margin: 0,
            maxWidth: 1560,
          }}
        >
          We are the <span style={{ color: brand.orange }}>verdict layer</span> competitors aren't building.
        </h1>

        <p
          style={{
            fontSize: 30,
            fontWeight: 600,
            lineHeight: 1.5,
            color: surface.textOnDarkSecondary,
            margin: 0,
            maxWidth: 1400,
          }}
        >
          We win by being the grading layer no one else is,{" "}
          <span style={{ color: surface.textOnDark, fontWeight: 800 }}>
            delivered where no one else can reach.
          </span>
        </p>
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 120px 56px 120px",
          fontSize: 15,
          color: "rgba(255,255,255,0.45)",
          letterSpacing: 0.4,
        }}
      >
        <span>© Tricentis. All rights reserved.</span>
        <span style={{ fontWeight: 600 }}>24 / 24</span>
      </div>
    </div>
  </Slide>
);
