import { ListSlide } from "../components/ListSlide";
import { FlowDiagram, VerdictGauge, ProportionBar } from "../components/visuals";
import { brand } from "../theme/theme";

const ACCENT = brand.teal;

export const Slide07ZeroSetup: React.FC = () => (
  <ListSlide
    index={7}
    kicker="Differentiator 1 of 4"
    title="Zero-setup automatic grading"
    accent={ACCENT}
    bigNumber={1}
    bullets={[
      "No SDK, no labeled data, no test authoring, no AI expertise needed",
      "Auto agent recognition plus automatic profile-fitting",
      "None of the other competitors we profiled offer this combination",
      "Alternatives all require instrumentation choices, dataset curation, or scorer configuration - or some mix of all three",
    ]}
    visual={
      <FlowDiagram
        accent={ACCENT}
        nodes={[
          { label: "OTel trace", sub: "no SDK required" },
          { label: "Auto-profile fit", sub: "agent recognized automatically" },
          { label: "0-100 score", sub: "zero setup" },
        ]}
      />
    }
  />
);

export const Slide08DefensibleAnswer: React.FC = () => (
  <ListSlide
    index={8}
    kicker="Differentiator 2 of 4"
    title="One defensible answer, with evidence"
    accent={ACCENT}
    bigNumber={2}
    bullets={[
      "A single 0-100 score",
      "Five-band verdict, spanning ship, review, and don't-ship outcomes - with a confidence interval",
      "Every number is evidence-backed",
      "Built as a decision-maker artifact, not a dashboard",
    ]}
    visual={<VerdictGauge score={82} band="Ship · ±4 confidence" accent={ACCENT} />}
  />
);

export const Slide09LargeTrace: React.FC = () => (
  <ListSlide
    index={9}
    kicker="Differentiator 3 of 4"
    title="Grading traces too large for a model's context window"
    accent={ACCENT}
    bigNumber={3}
    bullets={[
      "Grades 30-50 MB traces - large enough to exceed a typical LLM context window",
      "The agentic orchestrator fetches only the relevant parts - about 0.2% of trace data in testing",
      "A concrete, demoable edge",
      "None of the profiled products advertise this capability",
    ]}
    visual={
      <ProportionBar
        wholeLabel="30-50 MB trace, exceeds a typical LLM context window"
        partLabel="of trace data fetched to grade it"
        percent={0.2}
        accent={ACCENT}
      />
    }
    visualAlign="center"
  />
);

export const Slide10EcosystemHook: React.FC = () => (
  <ListSlide
    index={10}
    kicker="Differentiator 4 of 4"
    title="The TAIS and AI Workspace ecosystem hook"
    accent={ACCENT}
    bigNumber={4}
    bullets={[
      "AIW agents auto-provision a tenant and get graded with zero setup",
      "A distribution channel inside Tricentis that no external vendor can replicate",
      "This is the moat: no outside vendor can reach agents through TAIS / AI Workspace the way we can",
    ]}
    visual={
      <FlowDiagram
        accent={ACCENT}
        nodes={[
          { label: "AIW agent", sub: "created inside Tricentis" },
          { label: "Tenant auto-provisioned", sub: "no setup step" },
          { label: "Graded automatically", sub: "no outside vendor can reach this" },
        ]}
      />
    }
  />
);
