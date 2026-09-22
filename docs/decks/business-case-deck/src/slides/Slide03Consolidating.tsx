import { Slide } from "../components/Slide";
import { DarkInfoCard, Bullets, HighlightBox } from "../components/visuals";
import { brand, surface } from "../theme/theme";

const deals = [
  "Braintrust — $80M Series B at ~$800M valuation (Feb 2026) · $116M total raised",
  "Galileo — $68M total raised, acquired by Cisco → folded into Splunk Observability (May 2026)",
  "Langfuse — $4.5M total raised (seed), acquired by ClickHouse (Jan 2026)",
  "Patronus AI — $70M total raised ($50M Series B, Jun 2026)",
];

export const Slide03Consolidating: React.FC = () => (
  <Slide
    index={3}
    total={9}
    kicker="Desk Research"
    title="The Category Is Consolidating Fast"
    subtitle="— and validating our model along the way."
  >
    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-start", paddingTop: 28, gap: 22 }}>
      <div style={{ display: "flex", gap: 28, alignItems: "flex-start" }}>
        <div style={{ flex: 1.1, display: "flex", flexDirection: "column", gap: 16 }}>
          <Bullets items={deals} size={19} />
          <div style={{ marginTop: 8 }}>
            <HighlightBox accent={brand.orange}>
              Combined: ~$258.5M raised across these four — two already acquired (acquisition prices undisclosed).
            </HighlightBox>
          </div>
        </div>
        <DarkInfoCard kicker="What This Validates" style={{ flex: 1 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 6 }}>
            <div>
              <Bullets
                items={[
                  "Every eval-first competitor (Braintrust, PromptLayer, Humanloop, Patronus) already meters “scoring/eval runs” as a distinct, premium-priced line, separate from ingestion.",
                ]}
              />
              <div style={{ fontSize: 18, fontWeight: 800, color: surface.textOnDark, marginTop: 8 }}>
                Validates our own billing direction.
              </div>
            </div>
            <div>
              <Bullets items={["No competitor leads with zero-setup automatic grading straight from an OTel trace."]} />
              <div style={{ fontSize: 18, fontWeight: 800, color: surface.textOnDark, marginTop: 8 }}>
                Our clearest structural differentiator today.
              </div>
            </div>
          </div>
        </DarkInfoCard>
      </div>
    </div>
    <div className="sl-text" style={{ marginTop: 18, fontSize: 14, fontStyle: "italic", color: surface.textOnDarkFaint }}>
      Full detail in competitive-analysis-report.md and billing-model-research.md.
    </div>
  </Slide>
);
