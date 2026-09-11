import { Slide, Title } from "../components/Slide";
import { StatTile } from "../components/visuals";
import { brand, surface } from "../theme/theme";

// Neutral (navy) register shows up in the stat tiles below, where it sits
// on light cards with real contrast. The header chrome (wordmark accent +
// kicker dot) needs to read against the dark canvas, so it follows the
// same convention as the deck's other dark slides (2, 24): orange.
const NEUTRAL = brand.navy;
const CHROME_ACCENT = brand.orange;

export const Slide17Positioning: React.FC = () => (
  <Slide index={17} kicker="Positioning Assessment" dark accentColor={CHROME_ACCENT}>
    <Title size={46} color={surface.textOnDark} style={{ maxWidth: 1600 }}>
      Where AgentScore sits
    </Title>

    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 40,
        minHeight: 0,
      }}
    >
      <h2
        style={{
          fontSize: 52,
          fontWeight: 800,
          lineHeight: 1.16,
          letterSpacing: -1,
          color: surface.textOnDark,
          margin: 0,
          maxWidth: 1620,
        }}
      >
        We do not win a feature-checklist war today. We win by being{" "}
        <span style={{ color: brand.orange }}>the grading layer no one else is</span>, delivered where no one else
        can reach <span style={{ color: brand.tealLight }}>(inside TAIS)</span>.
      </h2>

      <div
        style={{
          padding: "26px 32px",
          borderRadius: 16,
          background: "rgba(255,255,255,0.06)",
          border: "1.5px solid rgba(255,255,255,0.14)",
          maxWidth: 1620,
        }}
      >
        <p
          style={{
            fontSize: 21,
            fontWeight: 500,
            lineHeight: 1.5,
            color: surface.textOnDarkSecondary,
            margin: 0,
          }}
        >
          On the core scoring loop the technology is credible and in some ways differentiated (zero-setup,
          large-trace, evidence-backed verdicts). But with no external customers, no enterprise auth, cloud-only
          VPN-gated access, and no public pricing, AgentScore is{" "}
          <span style={{ color: surface.textOnDark, fontWeight: 800 }}>not yet a market participant</span> - it is a
          strong internal alpha with a defensible wedge.
        </p>
      </div>

      <div style={{ display: "flex", gap: 24, maxWidth: 1620, justifyContent: "space-between" }}>
        <StatTile value="$50-125M" label="Competitor funding rounds" accent={NEUTRAL} />
        <StatTile value="3 acquired" label="ClickHouse · Cisco · CoreWeave" accent={NEUTRAL} />
        <StatTile value="GA" label="Every competitor profiled, with marquee logos" accent={NEUTRAL} />
        <StatTile value="0" label="AgentScore: external customers" accent={brand.orange} />
      </div>
    </div>
  </Slide>
);
