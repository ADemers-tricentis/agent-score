import { Slide } from "../components/Slide";
import { DarkInfoCard } from "../components/visuals";
import { surface } from "../theme/theme";

const cards: { kicker: string; title: string; body: string }[] = [
  {
    kicker: "01",
    title: "Any trace, any agent",
    body: "Ingests an agent's OTel trace — any agent, any vendor, any orchestration framework, no proprietary SDK required.",
  },
  {
    kicker: "02",
    title: "A verdict, not a pass/fail",
    body: "Returns a 0-100 score and a ship/warn/block verdict.",
  },
  {
    kicker: "03",
    title: "Root-cause attribution",
    body: "Down to the span, paired with a suggested fix.",
  },
  {
    kicker: "04",
    title: "60+ evals, 11 dimensions",
    body: "Auto-selected via zero-setup profiling — the buyer doesn't need to know what to measure going in.",
  },
  {
    kicker: "05",
    title: "Tiered evidence model",
    body: "Deterministic checks, judge + confidence intervals, golden-dataset back-testing — audit-ready proof, not a black box.",
  },
  {
    kicker: "06",
    title: "Free inside AI Workspace",
    body: "AI Workspace agents get all of this free, without any extra setup or configuration, the moment the agent exists.",
  },
];

export const Slide05WhatAgentScoreIs: React.FC = () => (
  <Slide
    index={5}
    total={9}
    kicker="Product"
    title="What AgentScore Is"
    subtitle="“Point it at a trace, get back a defensible answer.”"
  >
    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-start", paddingTop: 28 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, alignItems: "start" }}>
        {cards.map((c) => (
          <DarkInfoCard key={c.kicker} kicker={c.kicker} title={c.title}>
            <p style={{ fontSize: 17, fontWeight: 500, lineHeight: 1.5, color: surface.textOnDarkSecondary, margin: 0 }}>
              {c.body}
            </p>
          </DarkInfoCard>
        ))}
      </div>
    </div>
  </Slide>
);
