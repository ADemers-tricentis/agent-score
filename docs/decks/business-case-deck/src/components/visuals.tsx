import type { ReactNode } from "react";
import { brand, pastel, surface, type PastelKind } from "../theme/theme";

/** Small folded-corner triangle used at the top-left of dark info cards. */
const CornerFold: React.FC<{ color?: string }> = ({ color = brand.orange }) => (
  <div
    style={{
      position: "absolute",
      top: 0,
      left: 0,
      width: 30,
      height: 30,
      background: color,
      clipPath: "polygon(0 0, 100% 0, 0 100%)",
    }}
  />
);

/** Dark card with a folded-corner accent, teal kicker, and bold white title - the
 * deck's primary content-block pattern (mirrors the AIDA "Current Position" cards). */
export const DarkInfoCard: React.FC<{
  kicker: string;
  title?: string;
  children: ReactNode;
  accent?: string;
  style?: React.CSSProperties;
}> = ({ kicker, title, children, accent = brand.orange, style }) => (
  <div
    style={{
      position: "relative",
      flex: 1,
      background: brand.cardDark,
      borderRadius: 12,
      padding: "48px 44px 46px 44px",
      overflow: "hidden",
      border: "1px solid rgba(255,255,255,0.06)",
      display: "flex",
      flexDirection: "column",
      gap: 18,
      minHeight: 300,
      ...style,
    }}
  >
    <CornerFold color={accent} />
    <div
      className="sl-text"
      style={{ fontSize: 16, fontWeight: 800, letterSpacing: 2.5, textTransform: "uppercase", color: brand.teal }}
    >
      {kicker}
    </div>
    {title && (
      <div className="sl-text" style={{ fontSize: 30, fontWeight: 800, color: surface.textOnDark, marginTop: -6 }}>
        {title}
      </div>
    )}
    <div style={{ flex: 1, minHeight: 0 }}>{children}</div>
  </div>
);

/** Bulleted list styled for dark cards. */
export const Bullets: React.FC<{ items: ReactNode[]; size?: number }> = ({ items, size = 18 }) => (
  <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 18 }}>
    {items.map((it, i) => (
      <li key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <span className="sl-text" style={{ color: brand.orange, fontSize: size, lineHeight: 1.5, flexShrink: 0 }}>
          •
        </span>
        <span
          className="sl-text"
          style={{ fontSize: size, fontWeight: 500, lineHeight: 1.5, color: surface.textOnDarkSecondary }}
        >
          {it}
        </span>
      </li>
    ))}
  </ul>
);

/** Pastel stat card - big value + caption, colored per category like the
 * AIDA phase cards (mint/peach/sky/lavender rotation). */
export const PastelStatCard: React.FC<{
  kind: PastelKind;
  value?: string;
  label?: string;
  children?: ReactNode;
}> = ({ kind, value, label, children }) => {
  const p = pastel[kind];
  return (
    <div
      style={{
        flex: 1,
        background: p.bg,
        borderRadius: 12,
        padding: "42px 40px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        minHeight: 0,
      }}
    >
      {children ?? (
        <>
          <div className="sl-text" style={{ fontSize: 40, fontWeight: 800, color: p.text, letterSpacing: -0.5 }}>
            {value}
          </div>
          <div
            className="sl-text"
            style={{ fontSize: 17, fontWeight: 500, color: "#33261a", lineHeight: 1.5, opacity: 0.85 }}
          >
            {label}
          </div>
        </>
      )}
    </div>
  );
};

/** Highlighted callout box (status lines, bonus signals) - solid accent fill. */
export const HighlightBox: React.FC<{ children: ReactNode; accent?: string; label?: string }> = ({
  children,
  accent = brand.orange,
  label,
}) => (
  <div
    style={{
      background: `${accent}1c`,
      border: `1.5px solid ${accent}`,
      borderRadius: 10,
      padding: "26px 32px",
      display: "flex",
      gap: 10,
      alignItems: "baseline",
      flexWrap: "wrap",
    }}
  >
    {label && (
      <span className="sl-text" style={{ fontSize: 17, fontWeight: 800, color: accent }}>
        {label}
      </span>
    )}
    <span className="sl-text" style={{ fontSize: 17, fontWeight: 500, color: surface.textOnDark, lineHeight: 1.5 }}>
      {children}
    </span>
  </div>
);

/** Three-stage descending funnel bar (74 -> 5 -> 1 style drop-off). */
export const FunnelBars: React.FC<{
  stages: { value: string; label: string; widthPct: number }[];
  accent?: string;
  onLight?: boolean;
}> = ({ stages, accent = brand.orange, onLight = false }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
    {stages.map((s, i) => (
      <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div
          style={{
            width: `${s.widthPct}%`,
            background: accent,
            borderRadius: 6,
            padding: "10px 18px",
            fontSize: 22,
            fontWeight: 800,
            color: brand.navyText,
          }}
        >
          <span className="sl-text">{s.value}</span>
        </div>
        <div
          className="sl-text"
          style={{
            fontSize: 15,
            fontWeight: 500,
            color: onLight ? "#33261a" : surface.textOnDarkSecondary,
            opacity: onLight ? 0.85 : 1,
          }}
        >
          {s.label}
        </div>
      </div>
    ))}
  </div>
);

/** Dark-themed table for persona / use-case rows. */
export const DarkTable: React.FC<{
  columns: string[];
  rows: { cells: ReactNode[]; emphasis?: boolean }[];
}> = ({ columns, rows }) => (
  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 17 }}>
    <thead>
      <tr>
        {columns.map((c, i) => (
          <th
            key={i}
            style={{
              textAlign: "left",
              padding: "12px 18px",
              background: brand.footerNavy,
              color: brand.teal,
              fontSize: 14,
              fontWeight: 800,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              borderTopLeftRadius: i === 0 ? 10 : 0,
              borderTopRightRadius: i === columns.length - 1 ? 10 : 0,
            }}
          >
            <span className="sl-text">{c}</span>
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      {rows.map((row, ri) => (
        <tr key={ri} style={{ background: ri % 2 === 0 ? brand.cardDark : brand.cardDarkAlt }}>
          {row.cells.map((cell, ci) => (
            <td
              key={ci}
              style={{
                padding: "16px 18px",
                color: ci === 0 || row.emphasis ? surface.textOnDark : surface.textOnDarkSecondary,
                fontWeight: ci === 0 ? 700 : 500,
                lineHeight: 1.4,
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                verticalAlign: "top",
              }}
            >
              {cell}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);

/** Compact stat tile for a dark card row (no corner-fold, denser than DarkInfoCard). */
export const MiniStat: React.FC<{ value: string; label: string }> = ({ value, label }) => (
  <div
    style={{
      flex: 1,
      background: brand.cardDarkAlt,
      borderRadius: 10,
      padding: "18px 22px",
      display: "flex",
      flexDirection: "column",
      gap: 8,
    }}
  >
    <div className="sl-text" style={{ fontSize: 26, fontWeight: 800, color: surface.textOnDark }}>
      {value}
    </div>
    <div className="sl-text" style={{ fontSize: 14, fontWeight: 500, color: surface.textOnDarkSecondary, lineHeight: 1.4 }}>
      {label}
    </div>
  </div>
);

/** Numbered section label used above a stack of cards ("1 - Incident-Investigation..."). */
export const SectionLabel: React.FC<{ n: number; children: ReactNode }> = ({ n, children }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
    <span
      style={{
        width: 26,
        height: 26,
        borderRadius: "50%",
        background: brand.orange,
        color: brand.navyText,
        fontSize: 14,
        fontWeight: 800,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <span className="sl-text">{n}</span>
    </span>
    <span className="sl-text" style={{ fontSize: 20, fontWeight: 800, color: surface.textOnDark }}>
      {children}
    </span>
  </div>
);
