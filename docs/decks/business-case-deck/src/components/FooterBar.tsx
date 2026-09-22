import { brand } from "../theme/theme";
import tricentisMark from "../assets/tricentis-x-mark.png";

// Full-width diagonal-cut status bar - dark navy base, a skewed blue
// panel carrying a dot-pattern texture, and a skewed yellow panel
// carrying the page number, with the Tricentis mark anchored at left.
// Ported from the AIDA-status template reference (color-picked, not a
// literal asset trace).
export const FooterBar: React.FC<{ page: number; total: number }> = ({ page, total }) => {
  const dotRow = (top: number) => (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top,
        height: 8,
        display: "flex",
        gap: 14,
        paddingLeft: "52%",
        overflow: "hidden",
      }}
    >
      {Array.from({ length: 22 }, (_, i) => (
        <div
          key={i}
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: brand.footerNavy,
            flexShrink: 0,
            opacity: 0.85,
          }}
        />
      ))}
    </div>
  );

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: 52,
        background: brand.footerNavy,
        overflow: "hidden",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
      }}
    >
      {/* skewed blue panel */}
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: "56%",
          width: "30%",
          background: brand.footerBlue,
          transform: "skewX(-18deg)",
          transformOrigin: "bottom",
        }}
      />
      {/* skewed yellow panel */}
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: "84%",
          width: "20%",
          background: brand.footerYellow,
          transform: "skewX(-18deg)",
          transformOrigin: "bottom",
        }}
      />
      {/* dot texture over the blue/yellow seam */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        {dotRow(12)}
        {dotRow(30)}
      </div>

      <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 14, paddingLeft: 48, zIndex: 1 }}>
        <img src={tricentisMark} alt="" style={{ height: 22, filter: "brightness(0) invert(1)" }} />
        <span style={{ fontSize: 20, fontWeight: 700, color: brand.white, letterSpacing: 0.2 }}>Tricentis</span>
      </div>

      <div
        className="sl-text"
        style={{
          position: "absolute",
          right: 30,
          top: 0,
          bottom: 0,
          display: "flex",
          alignItems: "center",
          fontSize: 15,
          fontWeight: 700,
          color: brand.navyText,
          zIndex: 1,
        }}
      >
        {page} / {total}
      </div>
    </div>
  );
};
