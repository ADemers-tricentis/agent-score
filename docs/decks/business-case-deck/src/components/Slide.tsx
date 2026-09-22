import type { ReactNode } from "react";
import { SLIDE_W, SLIDE_H, brand, surface, font } from "../theme/theme";
import { FooterBar } from "./FooterBar";

export const PAD_X = 120;

type SlideProps = {
  index: number;
  total: number;
  kicker?: string;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  /** Suppress the standard kicker/title header and footer chrome (title slide uses its own). */
  bare?: boolean;
};

// Shared 1920x1080 dark canvas used by every slide: teal kicker + bold
// white title header, content area, diagonal footer status bar.
export const Slide: React.FC<SlideProps> = ({ index, total, kicker, title, subtitle, children, bare = false }) => {
  return (
    <div
      className="slide"
      style={{
        width: SLIDE_W,
        height: SLIDE_H,
        background: brand.pageBg,
        color: surface.textOnDark,
        fontFamily: font.family,
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {!bare && (
        <div style={{ padding: `56px ${PAD_X}px 0 ${PAD_X}px`, flexShrink: 0 }}>
          {kicker && (
            <div
              className="sl-text"
              style={{
                fontSize: 17,
                fontWeight: 800,
                letterSpacing: 4,
                textTransform: "uppercase",
                color: brand.teal,
                marginBottom: 14,
              }}
            >
              {kicker}
            </div>
          )}
          {title && (
            <h1
              className="sl-text"
              style={{
                fontSize: 46,
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: -0.5,
                color: surface.textOnDark,
                margin: 0,
                maxWidth: 1600,
              }}
            >
              {title}
            </h1>
          )}
          {subtitle && (
            <p
              className="sl-text"
              style={{
                fontSize: 21,
                fontWeight: 500,
                fontStyle: "italic",
                lineHeight: 1.4,
                color: surface.textOnDarkSecondary,
                margin: "12px 0 0 0",
                maxWidth: 1500,
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
      )}

      <div
        style={{
          flex: 1,
          padding: bare ? 0 : `32px ${PAD_X}px 0 ${PAD_X}px`,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        {children}
      </div>

      {!bare && (
        <div style={{ marginTop: 24 }}>
          <FooterBar page={index} total={total} />
        </div>
      )}
    </div>
  );
};
