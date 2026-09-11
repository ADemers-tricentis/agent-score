import { ListSlide } from "../components/ListSlide";
import { ChipRow, SplitPanel, CompareBars, StageStepper } from "../components/visuals";
import { brand } from "../theme/theme";

const ACCENT = brand.orange;

export const Slide11NoAuth: React.FC = () => (
  <ListSlide
    index={11}
    kicker="Gap 1 of 6"
    title="No enterprise auth"
    accent={ACCENT}
    bigNumber={1}
    bullets={[
      "RBAC and SSO/SAML are basic requirements for most enterprise customers",
      "AgentScore has separate superadmin and customer roles today, but they are extremely limited and do not provide true RBAC",
      "For a Tricentis-branded enterprise product, this is table stakes - we cannot sell without it",
    ]}
    visual={
      <ChipRow
        accent={ACCENT}
        items={[
          { label: "AgentScore: no true RBAC", status: "no", emphasis: true },
          { label: "Langfuse: RBAC (paid)", status: "partial" },
          { label: "Braintrust: RBAC (Ent)", status: "yes" },
          { label: "Arize: RBAC (Ent)", status: "yes" },
          { label: "Galileo: RBAC (Pro+)", status: "yes" },
          { label: "LangSmith: RBAC (Ent)", status: "partial" },
          { label: "W&B Weave: RBAC (Ent)", status: "partial" },
        ]}
      />
    }
  />
);

export const Slide12CloudOnly: React.FC = () => (
  <ListSlide
    index={12}
    kicker="Gap 2 of 6"
    title="Cloud-only"
    accent={ACCENT}
    bigNumber={2}
    bullets={[
      "Langfuse, Arize, Galileo, Braintrust, and Patronus all offer self-host, VPC, or on-prem deployment",
      "AgentScore today is cloud-only and VPN-gated",
      "A good portion of our users will require on-prem or self-host capabilities",
    ]}
    visual={
      <ChipRow
        accent={ACCENT}
        items={[
          { label: "AgentScore: cloud-only, VPN-gated", status: "no", emphasis: true },
          { label: "Langfuse: self-host", status: "yes" },
          { label: "Arize: self-host", status: "yes" },
          { label: "Galileo: SaaS/VPC/on-prem", status: "yes" },
          { label: "Braintrust: self-host (Ent)", status: "yes" },
          { label: "Patronus: self-host", status: "yes" },
        ]}
      />
    }
  />
);

export const Slide13NoSdk: React.FC = () => (
  <ListSlide
    index={13}
    kicker="Gap 3 of 6"
    title="No SDK or read API"
    accent={ACCENT}
    bigNumber={3}
    bullets={[
      "OTel-only ingest is elegant for zero-setup",
      "The reserved ck_ Read API and Python SDK are unimplemented",
      "Competitors expose programmatic read and eval access",
      "Limits CI integration and data-out use cases",
    ]}
    visual={
      <SplitPanel
        accent={ACCENT}
        left={{ title: "OTel ingest", body: "The only ingestion path today - elegant, zero-setup, live in production.", status: "yes" }}
        right={{ title: "Read API / SDK", body: "The reserved ck_ Read API and Python SDK remain unimplemented - no CI or data-out path yet.", status: "no" }}
      />
    }
  />
);

export const Slide14NoSimulation: React.FC = () => (
  <ListSlide
    index={14}
    kicker="Gap 4 of 6"
    title="No simulation capability"
    accent={ACCENT}
    bigNumber={4}
    bullets={[
      "The hottest adjacent subsegment - Arato, Patronus, Maxim - generates synthetic users to test pre-prod",
      "AgentScore only grades what already happened",
      "Not our lane today",
      "A strategic hole if buyers consolidate around \"test + grade\" as one purchase",
    ]}
    visual={
      <SplitPanel
        accent={ACCENT}
        left={{ title: "Grade what happened", body: "We score real production traces after the fact - credible, but reactive.", status: "yes" }}
        right={{ title: "Simulate before it happens", body: "Arato, Patronus, and Maxim generate synthetic users pre-prod - not our lane today.", status: "no" }}
      />
    }
  />
);

export const Slide15NoGuardrails: React.FC = () => (
  <ListSlide
    index={15}
    kicker="Gap 5 of 6"
    title="No runtime guardrails"
    accent={ACCENT}
    bigNumber={5}
    bullets={[
      "Galileo's inline Protect runs on proprietary SLM judges",
      "Those judges score sub-200ms and roughly 98% cheaper than frontier LLM-as-judge calls",
      "Our frontier-Bedrock judge stack does not meet that cost/latency bar for high-volume scoring",
    ]}
    visual={
      <CompareBars
        accent={ACCENT}
        items={[
          { label: "Galileo SLM judge", value: "<200ms · baseline cost", percent: 22 },
          { label: "AgentScore frontier-Bedrock judge", value: "slower · ~40x costlier", percent: 92, emphasis: true },
        ]}
      />
    }
  />
);

export const Slide16Maturity: React.FC = () => (
  <ListSlide
    index={16}
    kicker="Gap 6 of 6"
    title="Maturity"
    accent={ACCENT}
    bigNumber={6}
    bullets={[
      "Internal alpha moving to beta - no live external customers yet",
      "Agentic judge cutover incomplete: 2-3 PRs still pending",
      "The validation gate was redefined same-day to pass - a process concern, not just a feature gap",
      "Chat assistant and recommendations are built but dark, not yet live",
      "Every competitor in the comparison table is GA",
    ]}
    visual={
      <StageStepper
        accent={ACCENT}
        stages={["Internal alpha", "Beta", "GA"]}
        activeIndex={1}
        note="Every competitor profiled is already GA."
      />
    }
  />
);
