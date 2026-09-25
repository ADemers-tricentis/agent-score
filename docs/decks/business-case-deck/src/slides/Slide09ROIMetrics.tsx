import { Slide } from "../components/Slide";
import { SectionLabel, MiniStat, HighlightBox } from "../components/visuals";
import { brand, surface } from "../theme/theme";

export const Slide09ROIMetrics: React.FC = () => (
  <Slide
    index={9}
    total={9}
    kicker="ROI Metrics"
    title="The ROI Metrics We Can Measure"
    subtitle="Three candidate metrics — none validated by a paying customer yet."
  >
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 18, minHeight: 0 }}>
      <div>
        <SectionLabel n={1}>Time Saved on Evals (per Agent per Week)</SectionLabel>
        <div style={{ display: "flex", gap: 16 }}>
          <MiniStat value="??? hrs/wk" label="Baseline unmeasured — no pilot customer has tracked eval-authoring time yet." />
          <MiniStat value="40%" label="Hypothesis: time saved per agent per week if AgentScore auto-generates eval scaffolding vs. manual authoring." />
          <MiniStat value="???/yr" label="Per-employee value reclaimed if the 40% hypothesis holds." />
        </div>
        <div className="sl-text" style={{ fontSize: 15, color: surface.textOnDarkSecondary, marginTop: 10 }}>
          <b style={{ color: surface.textOnDark }}>How we'll measure it:</b> time from onboarding an agent to its
          first passing eval, with vs. without AgentScore's auto-generated scaffolding.
        </div>
      </div>

      <div style={{ background: brand.cardDarkAlt, borderRadius: 10, padding: "16px 22px" }}>
        <SectionLabel n={2}>% of Token Spend Reduction — Baseline: ???</SectionLabel>
        <div className="sl-text" style={{ fontSize: 15, color: surface.textOnDarkSecondary, lineHeight: 1.5 }}>
          Gartner finds 40-60% of agentic token spend contributes nothing to the answer — we don't have a real
          customer token bill to benchmark against yet.{" "}
          <b style={{ color: surface.textOnDark }}>Hypothesis:</b> flagging that waste translates into an actual
          drop in billed spend, not just a flagged amount.{" "}
          <b style={{ color: surface.textOnDark }}>How we'll measure it:</b> compare a pilot customer's token bill
          before vs. after AgentScore, net of usage growth.
        </div>
      </div>

      <div style={{ background: brand.cardDarkAlt, borderRadius: 10, padding: "16px 22px" }}>
        <SectionLabel n={3}>Reduction in AI-Related Incidents — Baseline: ???</SectionLabel>
        <div className="sl-text" style={{ fontSize: 15, color: surface.textOnDarkSecondary, lineHeight: 1.5 }}>
          Incident counts tied to agent behavior (bad outputs, safety violations, compliance failures) aren't
          tracked as a discrete category at any account we've talked to.{" "}
          <b style={{ color: surface.textOnDark }}>Hypothesis:</b> continuous scoring catches regressions before
          they reach production, reducing incident volume.{" "}
          <b style={{ color: surface.textOnDark }}>How we'll measure it:</b> compare AI-related incident counts at
          a pilot account before vs. after AgentScore, over a matched time window.
        </div>
      </div>

      <HighlightBox accent="#C0392B" label="Status:">
        All three are hypotheses, not yet validated by a paying customer. Each needs before/after pilot data before
        it goes in front of a buyer as a claim.
      </HighlightBox>
    </div>
  </Slide>
);
