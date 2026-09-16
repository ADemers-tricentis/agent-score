import { Slide, Title } from "../components/Slide";
import { brand, surface } from "../theme/theme";

const ACCENT = brand.orange;

const TIERS = [
  {
    label: "Low effort - near-term",
    color: brand.teal,
    items: [
      { name: "RBAC (Gap 1)", body: "Mechanically straightforward once identity is unified - blocked on Tosca SSO landing, then it's a policy layer on endpoints we already have." },
      { name: "SDK / Read API (Gap 3)", body: "The ck_ Read API and SDK are reserved, not missing. Mostly docs, client generation, and auth scoping." },
      { name: "Maturity (Gap 6)", body: "An execution problem, not a feature gap - resolves as design partners onboard and built-but-dark features go live." },
    ],
  },
  {
    label: "Medium/high effort - roadmap",
    color: brand.orange,
    items: [
      { name: "On-prem / self-host (Gap 2)", body: "Every cloud-only capability today would need to run disconnected from Tricentis infra - provably buildable, but a multi-quarter investment." },
      { name: "User/synthetic simulation (Gap 4)", body: "Requires a scenario-generation engine, a genuinely different capability from grading what already happened." },
    ],
  },
  {
    label: "Not recommended now",
    color: surface.textSecondary,
    items: [
      { name: "Runtime guardrails (Gap 5)", body: "Only viable at sub-200ms inline-judge cost/latency. Our frontier-Bedrock stack isn't built for that regime - revisit only if demand or a cheap-judge capability emerges." },
    ],
  },
];

export const Slide17EffortSequencing: React.FC = () => (
  <Slide index={17} kicker="Capability Gaps · Effort & Sequencing" accentColor={ACCENT}>
    <Title size={46} style={{ maxWidth: 1600 }}>
      Not all gaps cost the same to close
    </Title>
    <div style={{ flex: 1, display: "flex", gap: 24, marginTop: 36, minHeight: 0 }}>
      {TIERS.map((tier) => (
        <div
          key={tier.label}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 16,
            padding: "26px 26px",
            borderRadius: 16,
            background: surface.raised,
            border: `1.5px solid ${surface.divider}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: tier.color, flexShrink: 0 }} />
            <div style={{ fontSize: 20, fontWeight: 800, color: surface.textPrimary }}>{tier.label}</div>
          </div>
          {tier.items.map((item) => (
            <div key={item.name} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: tier.color }}>{item.name}</div>
              <div style={{ fontSize: 16, fontWeight: 500, lineHeight: 1.45, color: surface.textSecondary }}>{item.body}</div>
            </div>
          ))}
        </div>
      ))}
    </div>
    <div
      style={{
        marginTop: 24,
        marginBottom: 8,
        padding: "20px 32px",
        borderRadius: 12,
        background: brand.navyDeep,
        color: surface.textOnDark,
        fontSize: 19,
        fontWeight: 600,
        lineHeight: 1.4,
      }}
    >
      Net sequencing: ship RBAC and API/SDK exposure opportunistically as SSO lands, treat maturity as an execution
      problem to close this quarter, and hold on-prem and simulation as deliberate roadmap decisions - real gaps, but
      the wrong ones to rush.
    </div>
  </Slide>
);
