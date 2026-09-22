import { Slide } from "../components/Slide";
import { DarkInfoCard } from "../components/visuals";
import { surface } from "../theme/theme";

export const Slide04WhyTricentis: React.FC = () => (
  <Slide
    index={4}
    total={9}
    kicker="Why Tricentis"
    title="Why Tricentis Should Solve This"
    subtitle="Being right about the market isn't the same as being the right company to act on it — but here we are."
  >
    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-start", paddingTop: 28, gap: 22 }}>
      <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
        <DarkInfoCard kicker="Trust head start" title="We start where others earn from zero">
          <p style={{ fontSize: 18, fontWeight: 500, lineHeight: 1.55, color: surface.textOnDarkSecondary, margin: 0 }}>
            The buyer who owns "is this agent safe to ship" already trusts Tricentis for Tosca and qTest.
          </p>
        </DarkInfoCard>
        <DarkInfoCard kicker="Distribution advantage" title="A cost edge no outside vendor can match">
          <p style={{ fontSize: 18, fontWeight: 500, lineHeight: 1.55, color: surface.textOnDarkSecondary, margin: 0 }}>
            AI Workspace agents auto-provision a tenant and get graded with zero setup — every AIW customer is a warm
            lead, not a cold integration decision.
          </p>
        </DarkInfoCard>
        <DarkInfoCard kicker="Regulated-industry footprint" title="We already answer this question elsewhere">
          <p style={{ fontSize: 18, fontWeight: 500, lineHeight: 1.55, color: surface.textOnDarkSecondary, margin: 0 }}>
            Merck, Regeneron, McKesson, and Tritusa's bank/pharma clients already answer "how do you know it's
            accurate" in an adjacent product.
          </p>
        </DarkInfoCard>
      </div>
    </div>
    <div className="sl-text" style={{ marginTop: 18, fontSize: 14, fontStyle: "italic", color: surface.textOnDarkFaint }}>
      Caveat: doesn't guarantee we win the category — on-prem, RBAC/SSO, and compliance/PII gaps are real — but the
      odds beat a startup's, and beat sitting out.
    </div>
  </Slide>
);
