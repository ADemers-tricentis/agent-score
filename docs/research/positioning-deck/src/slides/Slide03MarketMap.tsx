import { Slide, Title } from "../components/Slide";
import { brand, surface } from "../theme/theme";

const CAMPS = [
  {
    name: "Observability / tracing-first",
    desc: "Focus on capturing traces, then add evals on top.",
    players: "Langfuse · LangSmith · Arize · W&B Weave",
    icon: (c: string) => (
      <svg width="52" height="52" viewBox="0 0 52 52">
        <path d="M4 40 L16 24 L26 32 L48 8" fill="none" stroke={c} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="16" cy="24" r="4" fill={c} />
        <circle cx="26" cy="32" r="4" fill={c} />
        <circle cx="48" cy="8" r="4" fill={c} />
      </svg>
    ),
  },
  {
    name: "Eval / scoring-first",
    desc: "Quality gates and judge models are the main offering.",
    players: "Braintrust · Galileo · Confident AI / DeepEval · Comet Opik",
    icon: (c: string) => (
      <svg width="52" height="52" viewBox="0 0 52 52">
        <rect x="6" y="6" width="40" height="40" rx="4" fill="none" stroke={c} strokeWidth="4" />
        <path d="M15 27 L22 35 L38 17" fill="none" stroke={c} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    name: "Simulation-first",
    desc: "Generate synthetic users and scenarios to stress-test before prod.",
    players: "Arato · Patronus · Maxim",
    icon: (c: string) => (
      <svg width="52" height="52" viewBox="0 0 52 52">
        <circle cx="16" cy="18" r="7" fill="none" stroke={c} strokeWidth="4" />
        <circle cx="36" cy="18" r="7" fill="none" stroke={c} strokeWidth="4" />
        <circle cx="26" cy="38" r="7" fill="none" stroke={c} strokeWidth="4" />
      </svg>
    ),
  },
  {
    name: "AI TRiSM / runtime guardrails",
    desc: "Intercept and gate agent outputs at runtime rather than grade behavior.",
    players: "int4 TrustGate · NeuralTrust · Guardrails AI",
    icon: (c: string) => (
      <svg width="52" height="52" viewBox="0 0 52 52">
        <path d="M26 4 L46 12 V26 C46 38 37 46 26 48 C15 46 6 38 6 26 V12 Z" fill="none" stroke={c} strokeWidth="4" strokeLinejoin="round" />
        <path d="M18 26 L24 32 L35 19" fill="none" stroke={c} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export const Slide03MarketMap: React.FC = () => (
  <Slide index={3} kicker="Market Map">
    <Title>The agentic eval market splits into four camps</Title>
    <div
      style={{
        flex: 1,
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gridTemplateRows: "1fr 1fr",
        gap: 28,
        marginTop: 44,
        marginBottom: 24,
      }}
    >
      {CAMPS.map((camp) => (
        <div
          key={camp.name}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 18,
            padding: "34px 38px",
            borderRadius: 18,
            background: surface.raised,
            border: `1.5px solid ${surface.divider}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div
              style={{
                width: 76,
                height: 76,
                borderRadius: 16,
                background: `${brand.primary}12`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {camp.icon(brand.primary)}
            </div>
            <div style={{ fontSize: 27, fontWeight: 800, color: surface.textPrimary, lineHeight: 1.2 }}>{camp.name}</div>
          </div>
          <div style={{ fontSize: 19, fontWeight: 500, color: surface.textSecondary, lineHeight: 1.4 }}>{camp.desc}</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: brand.primary, marginTop: "auto" }}>{camp.players}</div>
        </div>
      ))}
    </div>
  </Slide>
);
