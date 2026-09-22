import { Slide } from "../components/Slide";
import { Wordmark } from "../components/Wordmark";
import { brand, surface, SLIDE_W, SLIDE_H } from "../theme/theme";
import { FooterBar } from "../components/FooterBar";
import tricentisMark from "../assets/tricentis-x-mark.png";

export const Slide01Title: React.FC = () => (
  <Slide index={1} total={9} bare>
    <div
      style={{
        width: SLIDE_W,
        height: SLIDE_H,
        position: "relative",
        background: `radial-gradient(circle at 50% 40%, ${brand.pageBg} 0%, ${brand.pageBgDeep} 70%)`,
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
          alignItems: "center",
          justifyContent: "center",
          gap: 36,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <img src={tricentisMark} alt="" style={{ height: 56 }} />
          <div style={{ width: 1, height: 56, background: "rgba(255,255,255,0.25)" }} />
          <Wordmark fontSize={64} color={surface.textOnDark} accent={brand.orange} />
        </div>

        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 16, marginTop: 10 }}>
          <div className="sl-text" style={{ fontSize: 42, fontWeight: 800, color: surface.textOnDark, letterSpacing: -0.5 }}>
            Business Case for Tricentis Leadership
          </div>
          <div
            className="sl-text"
            style={{ fontSize: 24, fontWeight: 500, fontStyle: "italic", color: surface.textOnDarkSecondary }}
          >
            "Point it at a trace, get back a defensible answer."
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 8 }}>
          <div style={{ width: 9, height: 9, borderRadius: "50%", background: brand.orange }} />
          <div
            className="sl-text"
            style={{
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: surface.textOnDarkSecondary,
            }}
          >
            September 2026
          </div>
        </div>
      </div>

      <FooterBar page={1} total={9} />
    </div>
  </Slide>
);
