import { brand, surface } from "../theme/theme";

/** Giant faint numeral used as a typographic watermark, not a decorative rule. */
export const BigIndexMark: React.FC<{ n: number; color: string }> = ({ n, color }) => (
  <div
    style={{
      position: "absolute",
      right: 96,
      bottom: 40,
      fontSize: 320,
      fontWeight: 800,
      color,
      opacity: 0.07,
      lineHeight: 1,
      letterSpacing: -8,
      userSelect: "none",
      pointerEvents: "none",
    }}
  >
    {String(n).padStart(2, "0")}
  </div>
);

export type ChipStatus = "yes" | "no" | "partial";

const statusGlyph: Record<ChipStatus, string> = { yes: "✓", no: "✕", partial: "•" };

export const StatusChip: React.FC<{ label: string; status: ChipStatus; accent: string; emphasis?: boolean }> = ({
  label,
  status,
  accent,
  emphasis,
}) => {
  const color = status === "yes" ? brand.teal : status === "no" ? accent : brand.orange;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "14px 22px",
        borderRadius: 999,
        background: emphasis ? `${accent}14` : surface.raised,
        border: `1.5px solid ${emphasis ? accent : surface.divider}`,
      }}
    >
      <span
        style={{
          width: 26,
          height: 26,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 15,
          fontWeight: 800,
          color: brand.white,
          background: color,
          flexShrink: 0,
        }}
      >
        {statusGlyph[status]}
      </span>
      <span style={{ fontSize: 20, fontWeight: emphasis ? 700 : 600, color: surface.textPrimary, whiteSpace: "nowrap" }}>
        {label}
      </span>
    </div>
  );
};

/** Horizontal row of who-has-it chips, used on Gap slides. */
export const ChipRow: React.FC<{ items: { label: string; status: ChipStatus; emphasis?: boolean }[]; accent: string }> = ({
  items,
  accent,
}) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
    {items.map((it) => (
      <StatusChip key={it.label} label={it.label} status={it.status} accent={accent} emphasis={it.emphasis} />
    ))}
  </div>
);

/** Simple left-to-right node flow diagram (e.g. OTel trace -> AgentScore -> score). */
export const FlowDiagram: React.FC<{
  nodes: { label: string; sub?: string }[];
  accent: string;
}> = ({ nodes, accent }) => (
  <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
    {nodes.map((n, i) => (
      <div key={n.label} style={{ display: "flex", alignItems: "center", flex: i === nodes.length - 1 ? 0 : 1 }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            minWidth: 260,
            padding: "28px 30px",
            borderRadius: 14,
            background: i === nodes.length - 1 ? accent : surface.raised,
            border: `2px solid ${accent}`,
            boxShadow: "0 2px 4px rgba(18,38,74,0.06)",
          }}
        >
          <div
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: i === nodes.length - 1 ? brand.white : surface.textPrimary,
              textAlign: "center",
            }}
          >
            {n.label}
          </div>
          {n.sub && (
            <div
              style={{
                fontSize: 15,
                fontWeight: 500,
                color: i === nodes.length - 1 ? "rgba(255,255,255,0.85)" : surface.textSecondary,
                textAlign: "center",
              }}
            >
              {n.sub}
            </div>
          )}
        </div>
        {i < nodes.length - 1 && (
          <svg width="64" height="24" viewBox="0 0 64 24" style={{ flexShrink: 0, margin: "0 8px" }}>
            <line x1="4" y1="12" x2="52" y2="12" stroke={accent} strokeWidth="3" />
            <polygon points="52,4 62,12 52,20" fill={accent} />
          </svg>
        )}
      </div>
    ))}
  </div>
);

/** Circular verdict gauge - reuses the Wordmark glyph idea at deck scale. */
export const VerdictGauge: React.FC<{ score: number; band: string; accent: string }> = ({ score, band, accent }) => {
  const r = 120;
  const c = 2 * Math.PI * r;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
      <svg width={280} height={280} viewBox="0 0 280 280">
        <circle cx="140" cy="140" r={r} fill="none" stroke={surface.divider} strokeWidth="20" />
        <circle
          cx="140"
          cy="140"
          r={r}
          fill="none"
          stroke={accent}
          strokeWidth="20"
          strokeLinecap="round"
          strokeDasharray={`${c * (score / 100)} ${c}`}
          transform="rotate(-90 140 140)"
        />
        <text x="140" y="130" textAnchor="middle" fontSize="64" fontWeight="800" fill={surface.textPrimary}>
          {score}
        </text>
        <text x="140" y="168" textAnchor="middle" fontSize="18" fontWeight="600" fill={surface.textSecondary}>
          / 100
        </text>
      </svg>
      <div
        style={{
          padding: "10px 24px",
          borderRadius: 999,
          background: accent,
          color: brand.white,
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: 1,
          textTransform: "uppercase",
        }}
      >
        {band}
      </div>
    </div>
  );
};

/** Proportion bar - used for the large-trace-grading differentiator. */
export const ProportionBar: React.FC<{ wholeLabel: string; partLabel: string; percent: number; accent: string }> = ({
  wholeLabel,
  partLabel,
  percent,
  accent,
}) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 18, width: "100%" }}>
    <div
      style={{
        position: "relative",
        height: 64,
        borderRadius: 12,
        background: surface.raised,
        border: `2px solid ${surface.divider}`,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: `${Math.max(percent, 1.2)}%`,
          background: accent,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          paddingLeft: 18,
          fontSize: 16,
          fontWeight: 700,
          color: surface.textPrimary,
        }}
      >
        {wholeLabel}
      </div>
    </div>
    <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
      <span style={{ fontSize: 56, fontWeight: 800, color: accent }}>{percent}%</span>
      <span style={{ fontSize: 22, fontWeight: 600, color: surface.textSecondary }}>{partLabel}</span>
    </div>
  </div>
);

/** Stage stepper for the maturity gap slide. */
export const StageStepper: React.FC<{ stages: string[]; activeIndex: number; accent: string; note?: string }> = ({
  stages,
  activeIndex,
  accent,
  note,
}) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%" }}>
    <div style={{ display: "flex", alignItems: "center" }}>
      {stages.map((s, i) => (
        <div key={s} style={{ display: "flex", alignItems: "center", flex: i === stages.length - 1 ? 0 : 1 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, minWidth: 140 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: i <= activeIndex ? accent : surface.raised,
                border: `3px solid ${i <= activeIndex ? accent : surface.divider}`,
              }}
            />
            <div
              style={{
                fontSize: 18,
                fontWeight: i === activeIndex ? 800 : 600,
                color: i === activeIndex ? accent : surface.textSecondary,
                whiteSpace: "nowrap",
              }}
            >
              {s}
            </div>
          </div>
          {i < stages.length - 1 && (
            <div style={{ flex: 1, height: 3, background: i < activeIndex ? accent : surface.divider, marginBottom: 26 }} />
          )}
        </div>
      ))}
    </div>
    {note && <div style={{ fontSize: 17, color: surface.textSecondary, marginTop: 4 }}>{note}</div>}
  </div>
);

/** A stat tile for numeric callouts (dimension counts, funding figures, etc.) */
export const StatTile: React.FC<{ value: string; label: string; accent: string }> = ({ value, label, accent }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      gap: 8,
      padding: "26px 30px",
      background: surface.raised,
      borderRadius: 14,
      border: `1.5px solid ${surface.divider}`,
      minWidth: 220,
    }}
  >
    <div style={{ fontSize: 46, fontWeight: 800, color: accent, letterSpacing: -1 }}>{value}</div>
    <div style={{ fontSize: 17, fontWeight: 600, color: surface.textSecondary, lineHeight: 1.35 }}>{label}</div>
  </div>
);

/** Two-column split panel - "what we do" vs "what we don't". */
export const SplitPanel: React.FC<{
  left: { title: string; body: string; status: ChipStatus };
  right: { title: string; body: string; status: ChipStatus };
  accent: string;
}> = ({ left, right, accent }) => {
  const Panel: React.FC<{ data: typeof left }> = ({ data }) => (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: 14,
        padding: "32px 34px",
        borderRadius: 16,
        background: data.status === "yes" ? `${brand.teal}0f` : `${accent}0f`,
        border: `2px solid ${data.status === "yes" ? brand.teal : accent}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            fontWeight: 800,
            color: brand.white,
            background: data.status === "yes" ? brand.teal : accent,
          }}
        >
          {data.status === "yes" ? "✓" : "✕"}
        </span>
        <div style={{ fontSize: 26, fontWeight: 800, color: surface.textPrimary }}>{data.title}</div>
      </div>
      <div style={{ fontSize: 19, fontWeight: 500, color: surface.textSecondary, lineHeight: 1.5 }}>{data.body}</div>
    </div>
  );
  return (
    <div style={{ display: "flex", gap: 28, width: "100%" }}>
      <Panel data={left} />
      <Panel data={right} />
    </div>
  );
};

/** Two-item horizontal bar comparison (e.g. judge latency / cost). */
export const CompareBars: React.FC<{
  items: { label: string; value: string; percent: number; emphasis?: boolean }[];
  accent: string;
}> = ({ items, accent }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 26, width: "100%" }}>
    {items.map((it) => (
      <div key={it.label} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontSize: 19, fontWeight: 700, color: surface.textPrimary }}>{it.label}</span>
          <span style={{ fontSize: 22, fontWeight: 800, color: it.emphasis ? accent : brand.teal }}>{it.value}</span>
        </div>
        <div style={{ height: 22, borderRadius: 6, background: surface.raised, border: `1.5px solid ${surface.divider}`, overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: `${it.percent}%`,
              background: it.emphasis ? accent : brand.teal,
            }}
          />
        </div>
      </div>
    ))}
  </div>
);

/** Layered stack diagram (dashboard layer vs verdict layer). */
export const LayerStack: React.FC<{ layers: { label: string; sub: string; emphasis?: boolean }[]; accent: string }> = ({
  layers,
  accent,
}) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%" }}>
    {layers.map((l) => (
      <div
        key={l.label}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "24px 32px",
          borderRadius: 14,
          background: l.emphasis ? accent : surface.raised,
          border: `2px solid ${l.emphasis ? accent : surface.divider}`,
        }}
      >
        <span style={{ fontSize: 24, fontWeight: 800, color: l.emphasis ? brand.white : surface.textPrimary }}>
          {l.label}
        </span>
        <span
          style={{
            fontSize: 17,
            fontWeight: 600,
            color: l.emphasis ? "rgba(255,255,255,0.85)" : surface.textSecondary,
            textAlign: "right",
          }}
        >
          {l.sub}
        </span>
      </div>
    ))}
  </div>
);
