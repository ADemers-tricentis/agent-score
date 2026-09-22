import { Slide } from "../components/Slide";
import { PastelStatCard, FunnelBars } from "../components/visuals";
import { surface } from "../theme/theme";

export const Slide02MarketSignal: React.FC = () => (
  <Slide
    index={2}
    total={9}
    kicker="Market Signal"
    title="The Market Signal"
    subtitle="“Agents are being built faster than anyone can validate them.”"
  >
    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-start", paddingTop: 28 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, alignItems: "start" }}>
        <PastelStatCard kind="mint" value="5% → 40%" label="Task-specific agents as share of enterprise apps, 2025 → end of 2026 (Gartner)" />
        <PastelStatCard kind="peach" value="150,000+" label="Agents projected across the Fortune 500 within two years (avg. enterprise already runs ~12, +67% projected)" />
        <PastelStatCard kind="sky" value="$7.8B → $11.5B" label="AI agent market size, 2025 → 2026 (49.6% CAGR through 2033)" />
        <PastelStatCard kind="lavender" value="1 in 5" label="Companies with a mature governance model for autonomous agents — 80% deploy without one" />
        <PastelStatCard kind="mint" value="40%+" label="Of agentic AI projects Gartner projects will be canceled by end of 2027 (cost, unclear value, weak risk controls)" />
        <PastelStatCard kind="peach">
          <div
            className="sl-text"
            style={{ fontSize: 13, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", color: "#B5651D", marginBottom: 4 }}
          >
            Demand isn't hypothetical
          </div>
          <FunnelBars
            onLight
            accent="#F08C2E"
            stages={[
              { value: "74", label: "Inbound-interested companies (6 wks)", widthPct: 100 },
              { value: "5", label: "Scheduled demos", widthPct: 62 },
              { value: "1", label: "Pending beta (Accenture, for Meta)", widthPct: 32 },
            ]}
          />
        </PastelStatCard>
      </div>
    </div>
    <div className="sl-text" style={{ marginTop: 18, fontSize: 14, fontStyle: "italic", color: surface.textOnDarkFaint }}>
      Sourced from Gartner and Digital Applied — see "Why Now" in the one-pager for links.
    </div>
  </Slide>
);
