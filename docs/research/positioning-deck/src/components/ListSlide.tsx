import type { ReactNode } from "react";
import { Slide, Title } from "./Slide";
import { BigIndexMark } from "./visuals";
import { surface } from "../theme/theme";

// Shared layout for the Differentiator (7-10), Gap (11-16), and Strategic
// Recommendation (18-22) slides: title + bullets on the left, a concrete
// visual (never just more bullets) on the right, with a faint numeral
// watermark for wayfinding within the sub-sequence.
export const ListSlide: React.FC<{
  index: number;
  kicker: string;
  title: string;
  bullets: string[];
  visual: ReactNode;
  accent: string;
  bigNumber: number;
  visualAlign?: "center" | "flex-start";
}> = ({ index, kicker, title, bullets, visual, accent, bigNumber, visualAlign = "center" }) => (
  <Slide index={index} kicker={kicker} accentColor={accent}>
    <BigIndexMark n={bigNumber} color={accent} />
    <Title size={50} style={{ maxWidth: 1500 }}>
      {title}
    </Title>
    <div style={{ flex: 1, display: "flex", gap: 64, marginTop: 40, minHeight: 0, position: "relative", zIndex: 1 }}>
      <div style={{ flex: "0 0 42%", display: "flex", flexDirection: "column", gap: 26, paddingTop: 8 }}>
        {bullets.map((b) => (
          <div key={b} style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                background: accent,
                marginTop: 10,
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 23, fontWeight: 500, lineHeight: 1.45, color: surface.textPrimary }}>{b}</span>
          </div>
        ))}
      </div>
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: visualAlign,
          justifyContent: "center",
          minHeight: 0,
        }}
      >
        {visual}
      </div>
    </div>
  </Slide>
);
