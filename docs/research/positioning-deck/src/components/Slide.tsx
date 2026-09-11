import type { ReactNode } from "react";
import { SLIDE_W, SLIDE_H, brand, surface, font } from "../theme/theme";
import { Wordmark } from "./Wordmark";

export const PAD_X = 120;
export const PAD_TOP = 96;
export const PAD_BOTTOM = 88;

type SlideProps = {
  index: number;
  kicker?: string;
  dark?: boolean;
  accentColor?: string;
  bg?: string;
  children: ReactNode;
  /** Suppress the standard header/footer chrome (title slide, thesis, closing use their own). */
  bare?: boolean;
};

// Shared 1920x1080 canvas + chrome (wordmark, kicker breadcrumb, footer)
// used by every slide except the ones that intentionally go bare
// (title / thesis / closing bold-typographic slides).
export const Slide: React.FC<SlideProps> = ({
  index,
  kicker,
  dark = false,
  accentColor = brand.primary,
  bg,
  children,
  bare = false,
}) => {
  const background = bg ?? (dark ? brand.navyDeep : surface.base);
  const textColor = dark ? surface.textOnDark : surface.textPrimary;

  return (
    <div
      className="slide"
      style={{
        width: SLIDE_W,
        height: SLIDE_H,
        background,
        color: textColor,
        fontFamily: font.family,
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {!bare && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: `${PAD_TOP - 40}px ${PAD_X}px 0 ${PAD_X}px`,
            flexShrink: 0,
          }}
        >
          <Wordmark
            fontSize={26}
            color={dark ? surface.textOnDark : brand.navyDeep}
            accent={accentColor}
          />
          {kicker && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 2,
                  background: accentColor,
                  display: "inline-block",
                }}
              />
              <span
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  letterSpacing: 3,
                  textTransform: "uppercase",
                  color: dark ? surface.textOnDarkSecondary : surface.textSecondary,
                }}
              >
                {kicker}
              </span>
            </div>
          )}
        </div>
      )}

      <div
        style={{
          flex: 1,
          padding: bare ? 0 : `36px ${PAD_X}px 0 ${PAD_X}px`,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        {children}
      </div>

      {!bare && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: `0 ${PAD_X}px ${PAD_BOTTOM - 44}px ${PAD_X}px`,
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: 14,
              color: dark ? surface.textOnDarkSecondary : surface.textSecondary,
              letterSpacing: 0.4,
            }}
          >
            © Tricentis. All rights reserved.
          </span>
          <span
            style={{
              fontSize: 14,
              color: dark ? surface.textOnDarkSecondary : surface.textSecondary,
              fontWeight: 600,
            }}
          >
            {String(index).padStart(2, "0")} / 24
          </span>
        </div>
      )}
    </div>
  );
};

export const Title: React.FC<{ children: ReactNode; size?: number; color?: string; style?: React.CSSProperties }> = ({
  children,
  size = 64,
  color,
  style,
}) => (
  <h1
    style={{
      fontSize: size,
      fontWeight: 800,
      lineHeight: 1.08,
      letterSpacing: -1,
      color: color ?? surface.textPrimary,
      margin: 0,
      maxWidth: 1500,
      ...style,
    }}
  >
    {children}
  </h1>
);

export const Subtitle: React.FC<{ children: ReactNode; color?: string; style?: React.CSSProperties }> = ({
  children,
  color,
  style,
}) => (
  <p
    style={{
      fontSize: 26,
      fontWeight: 500,
      lineHeight: 1.4,
      color: color ?? surface.textSecondary,
      margin: 0,
      maxWidth: 1200,
      ...style,
    }}
  >
    {children}
  </p>
);
