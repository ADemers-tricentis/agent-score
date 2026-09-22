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
        <SectionLabel n={1}>Incident-Investigation Time Saved</SectionLabel>
        <div style={{ display: "flex", gap: 16 }}>
          <MiniStat value="??? hrs/wk" label="Baseline unmeasured internally — externally reported at ~4.3 hrs/wk." />
          <MiniStat value="25%" label="Hypothesis: reduction in incident-investigation time if root-cause attribution works." />
          <MiniStat value="$3.5K/yr" label="Per-employee value reclaimed if the 25% hypothesis holds." />
        </div>
        <div className="sl-text" style={{ fontSize: 15, color: surface.textOnDarkSecondary, marginTop: 10 }}>
          <b style={{ color: surface.textOnDark }}>How we'll measure it:</b> a timed pilot comparing root-cause
          investigation time with vs. without AgentScore, per incident.
        </div>
      </div>

      <div style={{ background: brand.cardDarkAlt, borderRadius: 10, padding: "16px 22px" }}>
        <SectionLabel n={2}>Audit-Evidence Turnaround Time — Baseline: ???</SectionLabel>
        <div className="sl-text" style={{ fontSize: 15, color: surface.textOnDarkSecondary, lineHeight: 1.5 }}>
          "Time to produce audit-ready evidence that an agent is safe to ship" is currently unmeasured and ad hoc at
          every account we've talked to (Wolters Kluwer, Freddie Mac).{" "}
          <b style={{ color: surface.textOnDark }}>Hypothesis:</b> our tiered evidence model turns this into a
          reportable SLA metric. <b style={{ color: surface.textOnDark }}>How we'll measure it:</b> benchmark
          time-to-evidence at a pilot account before vs. after AgentScore.
        </div>
      </div>

      <div style={{ background: brand.cardDarkAlt, borderRadius: 10, padding: "16px 22px" }}>
        <SectionLabel n={3}>% of Token Spend Recovered as Waste — Baseline: ???</SectionLabel>
        <div className="sl-text" style={{ fontSize: 15, color: surface.textOnDarkSecondary, lineHeight: 1.5 }}>
          Gartner finds 40-60% of agentic token spend contributes nothing to the answer — we don't have a real
          customer token bill to benchmark against yet.{" "}
          <b style={{ color: surface.textOnDark }}>Hypothesis:</b> AgentScore's scoring could surface and quantify
          that waste. <b style={{ color: surface.textOnDark }}>How we'll measure it:</b> compare AgentScore-flagged
          low-value spend against a pilot customer's actual bill.
        </div>
      </div>

      <HighlightBox accent="#C0392B" label="Status:">
        All three are hypotheses, not yet validated by a paying customer. Each needs before/after pilot data before
        it goes in front of a buyer as a claim.
      </HighlightBox>
    </div>
  </Slide>
);
