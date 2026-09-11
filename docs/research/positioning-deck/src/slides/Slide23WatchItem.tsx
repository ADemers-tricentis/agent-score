import { Slide, Title } from "../components/Slide";
import { brand, surface } from "../theme/theme";

const ACCENT = brand.navy;

const IMPLICATIONS = [
  {
    label: "A",
    body: "A plausible integration/partner surface - grade the agent's behavior, gate its write - more than a rival.",
  },
  {
    label: "B",
    body: "If enterprise buyers start expecting \"AI trust for my ERP agents,\" decide whether AgentScore's verdict layer plugs into that story via Tosca.",
  },
];

export const Slide23WatchItem: React.FC = () => (
  <Slide index={23} kicker="Watch List · SAP / Enterprise-App Angle" accentColor={ACCENT}>
    <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
      <Title size={44} style={{ maxWidth: 1300 }}>
        Watch item: int4 TrustGate
      </Title>
      <span
        style={{
          padding: "10px 20px",
          borderRadius: 999,
          background: surface.raised,
          border: `1.5px solid ${surface.dividerStrong}`,
          fontSize: 15,
          fontWeight: 800,
          letterSpacing: 2,
          textTransform: "uppercase",
          color: surface.textSecondary,
          whiteSpace: "nowrap",
        }}
      >
        Low urgency - track, don't chase
      </span>
    </div>

    <div style={{ flex: 1, display: "flex", gap: 56, marginTop: 40, minHeight: 0 }}>
      <div style={{ flex: "0 0 46%", display: "flex", flexDirection: "column", gap: 22, paddingTop: 8 }}>
        <p style={{ fontSize: 22, fontWeight: 500, lineHeight: 1.5, color: surface.textPrimary, margin: 0 }}>
          int4 TrustGate is not a head-to-head evaluator, but it's the first to plant an{" "}
          <span style={{ fontWeight: 800 }}>"AI trust for SAP" flag</span> - runtime guardrails on agents writing to
          S/4HANA - inside enterprise accounts Tricentis already sells Tosca into.
        </p>
        <p style={{ fontSize: 22, fontWeight: 500, lineHeight: 1.5, color: surface.textPrimary, margin: 0 }}>
          It validates the <span style={{ fontWeight: 800 }}>business outcome</span> (the SAP document itself) - a
          framing our behavior-grading doesn't cover - landing right where Tosca's SAP testing strength lives.
        </p>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20, minHeight: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: surface.textSecondary }}>
          Two implications
        </div>
        {IMPLICATIONS.map((imp) => (
          <div
            key={imp.label}
            style={{
              display: "flex",
              gap: 20,
              padding: "24px 28px",
              borderRadius: 14,
              background: surface.raised,
              border: `1.5px solid ${surface.divider}`,
            }}
          >
            <span
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                fontWeight: 800,
                color: brand.white,
                background: ACCENT,
              }}
            >
              {imp.label}
            </span>
            <span style={{ fontSize: 19, fontWeight: 500, lineHeight: 1.5, color: surface.textPrimary }}>{imp.body}</span>
          </div>
        ))}
        <div
          style={{
            marginTop: "auto",
            padding: "20px 28px",
            borderRadius: 14,
            background: brand.navyDeep,
            color: surface.textOnDark,
            fontSize: 19,
            fontWeight: 700,
            lineHeight: 1.45,
          }}
        >
          Brand-new, bootstrapped, unproven - but the most Tricentis-adjacent move in the field. Flag for Tosca / SAP
          GTM.
        </div>
      </div>
    </div>
  </Slide>
);
