import { ListSlide } from "../components/ListSlide";
import { LayerStack, VerdictGauge, SplitPanel, ChipRow, FlowDiagram } from "../components/visuals";
import { brand } from "../theme/theme";

const ACCENT = brand.primary;

export const Slide19LeadWithFeatures: React.FC = () => (
  <ListSlide
    index={19}
    kicker="Recommendation 1 of 6"
    title="Lead with the features competitors can't easily copy"
    accent={ACCENT}
    bigNumber={1}
    bullets={[
      "\"Automatic grading with zero setup, inside your Tricentis stack.\" No other competitor offers this",
      "Don't position as another observability/eval dashboard - we lose that comparison to incumbents",
      "Position as the verdict layer (ship / don't ship + evidence) that plugs directly into AI Workspace with no instrumentation",
      "Also scores customers' existing/external agents",
      "Make large-trace grading and the evidence-backed 0-100 score the demo centerpiece",
    ]}
    visual={
      <LayerStack
        accent={ACCENT}
        layers={[
          { label: "Observability dashboards", sub: "Langfuse · LangSmith · Arize" },
          { label: "Eval frameworks", sub: "Braintrust · Galileo" },
          { label: "The verdict layer", sub: "ship / don't ship + evidence - AgentScore", emphasis: true },
        ]}
      />
    }
  />
);

export const Slide20WhatToMeasure: React.FC = () => (
  <ListSlide
    index={20}
    kicker="Recommendation 2 of 6"
    title="Knowing what to measure is the hardest part of evals"
    accent={ACCENT}
    bigNumber={2}
    bullets={[
      "Plenty of open-source eval frameworks already exist",
      "Actually evaluating an agent isn't the hard part",
      "Knowing what needs to be evaluated, and ensuring every relevant aspect is measured, is the hard part",
      "This is what gives users confidence their agent is actually ready to ship",
    ]}
    visual={<VerdictGauge score={82} band="Ship · ±4 confidence" accent={ACCENT} />}
  />
);

export const Slide21SimulationGuardrails: React.FC = () => (
  <ListSlide
    index={21}
    kicker="Recommendation 3 of 6"
    title="Make a call on simulation and guardrails capabilities"
    accent={ACCENT}
    bigNumber={3}
    bullets={[
      "Simulation testing is a fast-growing capability and a real gap for AgentScore today",
      "Only agents already in production, on traces real users emit, can be graded",
      "Specific situations are hard to test - there's no way to confirm all desired behavior has been exercised",
      "Tackling this makes AgentScore a well-rounded, complete AI agent testing platform",
    ]}
    visual={
      <SplitPanel
        accent={ACCENT}
        left={{ title: "Grade what happened", body: "Real production traces, after the fact - credible, but reactive.", status: "yes" }}
        right={{ title: "Simulate before it happens", body: "Synthetic users, pre-prod - a real gap and a decision point, not yet built.", status: "no" }}
      />
    }
  />
);

export const Slide22McpCapabilities: React.FC = () => (
  <ListSlide
    index={22}
    kicker="Recommendation 4 of 6"
    title="MCP capabilities"
    accent={ACCENT}
    bigNumber={4}
    bullets={[
      "Don't build MCP server conformance testing - already served (MCP Inspector, CLIs), no real moat there",
      "MCP tool calls are just tool-call spans on an OTel trace",
      "Ensure ingestion recognizes and labels MCP traces so a report can show \"how well did the agent use MCP tools\" as a first-class view",
      "Low-effort, fits the zero-setup story - but not a differentiator alone",
      "The real moat is pairing this with the AIW hook: AIW agents calling MCP tools get graded automatically",
    ]}
    visual={
      <ChipRow
        accent={ACCENT}
        items={[
          { label: "MCP conformance testing: skip", status: "no" },
          { label: "MCP trace labeling: low-effort, do it", status: "yes" },
          { label: "MCP + AIW hook: the real moat", status: "yes", emphasis: true },
        ]}
      />
    }
  />
);

export const Slide23EnterpriseReadiness: React.FC = () => (
  <ListSlide
    index={23}
    kicker="Recommendation 5 of 6"
    title="Fix enterprise readiness"
    accent={ACCENT}
    bigNumber={5}
    bullets={[
      "RBAC, SSO/SAML, and non-VPN access are actual blockers to any external design partner converting",
      "Demos and closed betas work fine today in the current state",
      "But these three are table stakes for any long-term engagement",
    ]}
    visual={
      <FlowDiagram
        accent={ACCENT}
        nodes={[
          { label: "RBAC", sub: "true role-based access" },
          { label: "SSO / SAML", sub: "enterprise identity" },
          { label: "Non-VPN access", sub: "reachable by design partners" },
        ]}
      />
    }
  />
);

export const Slide24FailureAttribution: React.FC = () => (
  <ListSlide
    index={24}
    kicker="Recommendation 6 of 6"
    title="Make the ingest-to-fix pipeline the story, not attribution alone"
    accent={ACCENT}
    bigNumber={6}
    bullets={[
      "Failure attribution alone isn't unique - Arize's Alyx and Patronus's Percival already do it",
      "What's harder to copy is the pipeline it sits inside, running end-to-end on zero-setup OTel traces",
      "Competitors hand you an explanation only after setup work; we hand you the explanation as a byproduct of the same zero-touch ingestion that produced the score",
      "Neither Alyx nor Percival is documented to close the loop from \"why it failed\" to \"what to do about it\"",
      "\"We don't just tell you it's broken, we tell you how to fix it\" - a claim none of the profiled competitors can make",
    ]}
    visual={
      <FlowDiagram
        accent={ACCENT}
        nodes={[
          { label: "Ingest", sub: "zero-setup OTel trace" },
          { label: "Auto-evaluate → auto-score", sub: "no instrumentation, no dataset curation" },
          { label: "Failure attribution → fix recommendation", sub: "no other profiled competitor closes this loop" },
        ]}
      />
    }
  />
);
