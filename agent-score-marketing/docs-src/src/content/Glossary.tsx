import { Dek, Eyebrow } from "../components/PageChrome";

const terms: { term: string; def: string }[] = [
  {
    term: "Trace",
    def: "One recorded agent interaction - a request and everything the agent did to handle it (model calls, tool calls, the final output).",
  },
  {
    term: "OpenTelemetry (OTel)",
    def: "The open telemetry standard most agent frameworks already export. Agent Score reads it directly - no proprietary SDK required.",
  },
  {
    term: "Tenant",
    def: "Your isolated Agent Score workspace - every agent, trace, and API key you own lives under it. Provisioned by the Agent Score team when you're onboarded, not something you self-serve today.",
  },
  {
    term: "Eval",
    def: "One focused quality question, scored automatically from a trace - for example, \"was this grounded in its context?\" Comes in three flavors: Library (deterministic), G-Eval (LLM judged against plain-English criteria), and Hybrid (both).",
  },
  {
    term: "Judge model",
    def: "The LLM that reads an interaction and produces an eval's score and reason. Agent Score picks the provider on your behalf today - not yet a self-serve choice.",
  },
  {
    term: "Dimension",
    def: "A category of evaluation made up of several related evals - e.g. Safety, Groundedness, Agentic / Tool-use.",
  },
  {
    term: "Profile",
    def: "A named bundle of dimensions, weights, and pass thresholds tuned for a kind of agent (RAG, Tool-Orchestrator, Conversational, and more). Chosen automatically based on observed behavior.",
  },
  {
    term: "Agent Card",
    def: "An automatically generated summary of what an agent does - its purpose, behavior patterns, tools used, success criteria, and common failure modes.",
  },
  {
    term: "Composite score",
    def: "The single 0-100 number produced by combining every weighted dimension in an agent's profile.",
  },
  {
    term: "Verdict",
    def: "The plain-language recommendation the composite score maps to: Ship, Ship with note, Needs work, Don't ship (recommended), or Block.",
  },
  {
    term: "Threshold",
    def: "The configurable pass/fail line for an eval, dimension, or the composite score. Drives the verdict and any CI/CD gate.",
  },
  {
    term: "Scorecard",
    def: "The full report for a scoring run: composite score, grade, verdict, and the dimension-by-dimension breakdown behind it.",
  },
];

export default function Glossary() {
  return (
    <>
      <Eyebrow>Reference</Eyebrow>
      <h1>Glossary</h1>
      <Dek>Every term used across these docs, defined in one place.</Dek>

      <dl>
        {terms.map((t) => (
          <div className="glossary-term" key={t.term}>
            <dt>{t.term}</dt>
            <dd>{t.def}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}
