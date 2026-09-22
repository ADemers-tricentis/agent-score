import { Slide } from "../components/Slide";
import { Bullets, HighlightBox } from "../components/visuals";
import { brand, surface } from "../theme/theme";

export const Slide08ValueProp: React.FC = () => (
  <Slide index={8} total={9} kicker="Value Prop" title="Why Customers Will Pay" subtitle="Value prop / overall value.">
    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-start", paddingTop: 28, gap: 22 }}>
      <Bullets
        size={20}
        items={[
          "A defensible verdict instead of a gut call — replaces “seems fine to me” with a number leadership can act on.",
          "Root-cause attribution, not just a score — turns debugging into a fix, not a re-run.",
          "A shared yardstick across fragmented ownership — the fleet-level ask we're already hearing (Wolters Kluwer, Freddie Mac).",
          "Coverage without in-house AI expertise — zero-setup auto-profiling means the buyer doesn't need to already know what to measure.",
          "Third-party evidence SIs can resell — a resale motion for partners like Tritusa, Capgemini, Accenture, Xebia.",
        ]}
      />
      <HighlightBox accent={brand.teal} label="Overall value:">
        The billing model is already proven by the category (eval-first competitors meter scoring runs at a premium,
        separate from ingestion) — and it maps to a real denominator: the average enterprise already eats 2.3
        significant AI-driven errors per quarter ($50K-$2.1M each) and $14K/employee/year verifying whether outputs
        are true. A subscription only has to prevent a fraction of one incident, or claw back a fraction of that
        time, to pay for itself many times over.
      </HighlightBox>
    </div>
    <div className="sl-text" style={{ marginTop: 18, fontSize: 14, fontStyle: "italic", color: surface.textOnDarkFaint }}>
      Tricentis-side revenue sizing isn't modeled yet — pricing isn't finalized and we have no beta usage data. See
      "What This Is Worth to Tricentis" in the one-pager.
    </div>
  </Slide>
);
