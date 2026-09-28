import { Slide } from "../components/Slide";
import { HighlightBox } from "../components/visuals";
import { brand, surface } from "../theme/theme";

/** One labeled line inside a metric card - keeps the three fields (measuring/
 * estimate/improves via) visually consistent instead of forcing every metric
 * into the same big-number stat tile. */
const MetricRow: React.FC<{ label: string; children: React.ReactNode; bold?: boolean }> = ({
  label,
  children,
  bold = false,
}) => (
  <div style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
    <span
      className="sl-text"
      style={{
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: 1.2,
        textTransform: "uppercase",
        color: brand.teal,
        flexShrink: 0,
        width: 108,
      }}
    >
      {label}
    </span>
    <span
      className="sl-text"
      style={{
        fontSize: 14,
        fontWeight: bold ? 700 : 500,
        color: bold ? surface.textOnDark : surface.textOnDarkSecondary,
        lineHeight: 1.45,
      }}
    >
      {children}
    </span>
  </div>
);

const MetricCard: React.FC<{ n: number; name: string; children: React.ReactNode }> = ({ n, name, children }) => (
  <div
    style={{
      background: brand.cardDarkAlt,
      borderRadius: 12,
      padding: "20px 24px",
      display: "flex",
      flexDirection: "column",
      gap: 10,
      flex: 1,
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span
        style={{
          width: 24,
          height: 24,
          borderRadius: "50%",
          background: brand.orange,
          color: brand.navyText,
          fontSize: 13,
          fontWeight: 800,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <span className="sl-text">{n}</span>
      </span>
      <span className="sl-text" style={{ fontSize: 18, fontWeight: 800, color: surface.textOnDark }}>
        {name}
      </span>
    </div>
    {children}
  </div>
);

export const Slide09ROIMetrics: React.FC = () => (
  <Slide
    index={9}
    total={9}
    kicker="ROI Metrics"
    title="Four ROI Metrics We Can Measure Today"
    subtitle="Computed from existing telemetry - no pilot required."
  >
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16, minHeight: 0 }}>
      <div style={{ display: "flex", gap: 16, flex: 1 }}>
        <MetricCard n={1} name="Catches per Agent">
          <MetricRow label="Measuring">
            Every ship/warn/block verdict AgentScore flags on an agent, counted per agent.
          </MetricRow>
          <MetricRow label="Estimate" bold>
            ??? catches/agent - no baseline exists yet; needs a telemetry pull once agents have run history.
          </MetricRow>
          <MetricRow label="Improves via">
            It doesn't reduce this number, it creates it. Today it's effectively zero because nothing catches
            these issues systematically - AgentScore turns invisible failures into a counted metric from day one.
          </MetricRow>
          <div
            style={{
              marginTop: 4,
              paddingTop: 10,
              borderTop: `1px solid ${surface.divider}`,
            }}
          >
            <MetricRow label="Cost avoided" bold>
              Catch count x the $50K-$2.1M-per-incident estimate already behind our value prop. Directional until
              a pilot validates the real per-incident number.
            </MetricRow>
          </div>
        </MetricCard>

        <MetricCard n={2} name="Regression Rate">
          <MetricRow label="Measuring">
            The rate at which an agent's verdict flips (e.g., ship to block) across its own run history over time.
          </MetricRow>
          <MetricRow label="Estimate" bold>
            ??? % - needs a few weeks of run history per agent; each agent is its own baseline, no cross-customer
            benchmark required.
          </MetricRow>
          <MetricRow label="Improves via">
            Continuous scoring flags regressions the moment they happen, so teams fix them before a customer
            finds them - that's what should trend the rate down over time.
          </MetricRow>
        </MetricCard>
      </div>

      <div style={{ display: "flex", gap: 16, flex: 1 }}>
        <MetricCard n={3} name="Root-Cause Coverage Rate">
          <MetricRow label="Measuring">
            The share of catches (non-ship verdicts) that come with a populated root cause.
          </MetricRow>
          <MetricRow label="Estimate" bold>
            ??? % - varies today by how many dimensions/evals are configured per agent.
          </MetricRow>
          <MetricRow label="Improves via">
            Root-cause attribution is generated automatically from eval/dimension results, not hand-logged, so
            coverage rises as agents onboard more evals - with zero added triage work.
          </MetricRow>
        </MetricCard>

        <MetricCard n={4} name="Evals & Dimensions Auto-Covered">
          <MetricRow label="Measuring">
            The count of evals and dimensions AgentScore automatically generates and scores for an agent from its
            first trace.
          </MetricRow>
          <MetricRow label="Estimate" bold>
            ??? evals/dimensions per agent, vs. the number a team would need to hand-author for equivalent
            coverage.
          </MetricRow>
          <MetricRow label="Improves via">
            Coverage exists automatically at onboarding - the improvement is entirely in hours saved vs.
            hand-building the same coverage manually.
          </MetricRow>
        </MetricCard>
      </div>

      <HighlightBox accent="#C0392B" label="Status:">
        Computed directly from existing telemetry - no pilot required. The cost-avoided dollar figure is
        directional until incident-cost estimates are validated with a customer.
      </HighlightBox>
    </div>
  </Slide>
);
