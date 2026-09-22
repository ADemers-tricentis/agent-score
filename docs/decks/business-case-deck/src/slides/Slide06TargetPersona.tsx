import { Slide } from "../components/Slide";
import { DarkTable } from "../components/visuals";
import { brand, surface } from "../theme/theme";

const PriorityBadge: React.FC<{ level: "Primary" | "Secondary" }> = ({ level }) => (
  <span
    style={{
      display: "inline-block",
      padding: "4px 12px",
      borderRadius: 999,
      fontSize: 13,
      fontWeight: 800,
      letterSpacing: 0.5,
      background: level === "Primary" ? brand.orange : "rgba(255,255,255,0.12)",
      color: level === "Primary" ? brand.navyText : surface.textOnDarkSecondary,
    }}
  >
    <span className="sl-text">{level}</span>
  </span>
);

export const Slide06TargetPersona: React.FC = () => (
  <Slide index={6} total={9} kicker="Target Persona" title="Who Actually Buys This" subtitle="Target persona breakdown.">
    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-start", paddingTop: 28 }}>
      <DarkTable
        columns={["Persona", "Why They Care", "Priority"]}
        rows={[
          {
            cells: [
              <span className="sl-text">QA/quality leader at an agent-deploying enterprise</span>,
              <span className="sl-text">
                Owns “is this agent safe to ship” but has no tooling built for agent behavior — wants a defensible
                score and root-cause attribution.
              </span>,
              <PriorityBadge level="Primary" />,
            ],
          },
          {
            cells: [
              <span className="sl-text">AI/platform program owner at scale</span>,
              <span className="sl-text">
                Owns dozens of agents shipping to prod with fragmented ownership — reacts most strongly to the single
                ship/warn/block verdict.
              </span>,
              <PriorityBadge level="Primary" />,
            ],
          },
          {
            cells: [
              <span className="sl-text">SI/consulting partner building agents for clients</span>,
              <span className="sl-text">
                Needs third-party evidence of quality to close their own client deals — a resale motion, not just
                internal use.
              </span>,
              <PriorityBadge level="Secondary" />,
            ],
          },
          {
            cells: [
              <span className="sl-text">Regulated-industry buyer</span>,
              <span className="sl-text">
                Compliance/audit sensitivity makes “how do you know it's accurate” a gating question before
                production.
              </span>,
              <PriorityBadge level="Secondary" />,
            ],
          },
        ]}
      />
    </div>
  </Slide>
);
