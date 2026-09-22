import { Slide } from "../components/Slide";
import { Bullets, HighlightBox } from "../components/visuals";
import { brand, surface } from "../theme/theme";

export const Slide07TargetICP: React.FC = () => (
  <Slide
    index={7}
    total={9}
    kicker="Target ICP"
    title="What Tells You an Account Is Worth Targeting"
    subtitle="If you're a sales rep, here's what to look for in an account."
  >
    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-start", paddingTop: 28, gap: 20 }}>
      <Bullets
        size={20}
        items={[
          "Already running agents in AI Workspace → zero-setup, warm lead, not a cold integration decision.",
          "Running multiple agents or workflows, not just one → more surface area, more manual grading pain.",
          "Risk-driven signals: talk of governance/spend concerns, “how do we know this is safe” before “how do we ship more,” or a token bill that's stopped tracking cleanly to work done.",
          "Efficiency-driven signals: already grading agents themselves — ad hoc scripts, spreadsheet rubrics, a homegrown eval harness — and want to cut the manual cost, or want more rigor than what they've built.",
          "Running external agents/tools/MCPs alongside AI Workspace (GitHub Copilot, Copilot Studio, homegrown frameworks, other vendors, MCP servers) that they can't currently score side-by-side with their sanctioned agents.",
        ]}
      />
      <HighlightBox accent={brand.orange} label="Bonus signal:">
        No dedicated AI engineers or existing eval tooling in-house → AgentScore isn't competing against a build
        option, it's the only realistic path to a rigorous eval.
      </HighlightBox>
    </div>
    <div className="sl-text" style={{ marginTop: 18, fontSize: 14, fontStyle: "italic", color: surface.textOnDarkFaint }}>
      Wolters Kluwer is the cleanest real match today (risk-driven, AIW + external agents). Tritusa fits 3 of 4. A
      hypothesis sharpened by two data points, not yet a validated segment.
    </div>
  </Slide>
);
