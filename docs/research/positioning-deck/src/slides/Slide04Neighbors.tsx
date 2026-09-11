import { Slide, Title } from "../components/Slide";
import { brand, surface } from "../theme/theme";

const NEIGHBORS = [
  {
    name: "Galileo",
    valueProp: "Continuous eval + guardrails via proprietary Luna-2 SLM judges - sub-200ms, ~98% cheaper than frontier LLM-as-judge.",
    pricing: "Free (5k traces/mo); Pro $100/mo; Enterprise custom.",
    eval: "Continuous production scoring; LLM-as-judge + SLM judges; agent/safety metrics.",
    signal: "~$68M raised. Acquired by Cisco (May 2026) -> Splunk. Customers: Verizon, Comcast, HP.",
  },
  {
    name: "Braintrust",
    valueProp: "Eval-first observability: capture traces, score with scorers, turn failures into CI.",
    pricing: "Free (1GB/10k scores); Pro $249/mo; Enterprise custom (SSO, RBAC, self-host).",
    eval: "Real-time + batch scoring; configurable LLM-as-judge; “Loop” AI assistant.",
    signal: "$36M Series A + $80M Series B (~$800M val.). Customers: Notion, Stripe, Vercel, Ramp.",
  },
];

const ROW_LABELS = ["Value prop", "Pricing", "Eval / scoring", "Key signal"];

export const Slide04Neighbors: React.FC = () => (
  <Slide index={4} kicker="Closest Neighbors">
    <Title>Our closest neighbors: Galileo and Braintrust</Title>
    <div style={{ flex: 1, display: "flex", gap: 32, marginTop: 40, minHeight: 0 }}>
      {NEIGHBORS.map((n) => (
        <div
          key={n.name}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            borderRadius: 18,
            background: surface.raised,
            border: `1.5px solid ${surface.divider}`,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "26px 36px",
              background: brand.navyDeep,
              fontSize: 32,
              fontWeight: 800,
              color: surface.textOnDark,
            }}
          >
            {n.name}
          </div>
          <div style={{ display: "flex", flexDirection: "column", padding: "8px 36px" }}>
            {[n.valueProp, n.pricing, n.eval, n.signal].map((val, i) => (
              <div
                key={ROW_LABELS[i]}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  padding: "20px 0",
                  borderBottom: i < 3 ? `1px solid ${surface.divider}` : "none",
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    letterSpacing: 2,
                    textTransform: "uppercase",
                    color: brand.primary,
                  }}
                >
                  {ROW_LABELS[i]}
                </div>
                <div style={{ fontSize: 20, fontWeight: 500, color: surface.textPrimary, lineHeight: 1.45 }}>{val}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
    <div
      style={{
        marginTop: 24,
        marginBottom: 16,
        padding: "20px 32px",
        borderRadius: 12,
        background: brand.navyDeep,
        color: surface.textOnDark,
        fontSize: 22,
        fontWeight: 700,
        textAlign: "center",
      }}
    >
      Bottom line: neither leads with "zero-setup automatic grading."
    </div>
  </Slide>
);
