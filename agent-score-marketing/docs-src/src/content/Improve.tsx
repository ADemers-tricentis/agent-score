import { Callout, Dek, Eyebrow, Screenshot } from "../components/PageChrome";
import improveAdvice from "../assets/improve-advice.png";

export default function Improve() {
  return (
    <>
      <Eyebrow>The Scoring Journey</Eyebrow>
      <h1>Improve this agent</h1>
      <Dek>
        A score tells you how your agent is doing. The <strong>Improve</strong> tab tells you what
        to do about it - prioritized, evidence-backed recommendations generated from the same
        traces that produced the score.
      </Dek>

      <h2>Generating advice</h2>
      <p>
        Once an agent has a completed or partial scoring run, <strong>Generate advice</strong> on
        its <strong>Improve</strong> tab analyzes the latest scored evidence and writes up
        recommendations - each one ranked <strong>high</strong>, <strong>medium</strong>, or{" "}
        <strong>low</strong>, with the reasoning behind it and the specific trace and span IDs
        that back it up. Generation runs in the background; existing advice stays visible while a
        new analysis is in progress, and the page updates on its own when it finishes.
      </p>
      <Screenshot
        src={improveAdvice}
        alt="The Improve tab, showing a generated advice card with a timestamp, a succeeded status badge, a high-severity recommendation title, and a detailed explanation citing specific trace and span IDs as evidence"
        caption="Generated advice - a prioritized recommendation with the trace evidence it's grounded in, not just an opinion."
      />

      <h2>Advice can point at more than the agent</h2>
      <p>
        Because recommendations are generated straight from trace evidence, they surface problems
        anywhere in the pipeline - not just prompting or tool-use issues. A recommendation might
        just as easily flag a logging gap that's starving evals of evidence, a missing
        precondition on a tool call, or a recurring failure pattern that matches something already
        named in the agent's own <a href="#/agent-card">Agent Card</a>.
      </p>

      <Callout kind="note" title="Advice reflects the run it was generated from">
        <p>
          Recommendations are tied to the scored evidence available at generation time. If you fix
          something and re-score, generate advice again to see whether the same issues still show
          up - and whether new ones do.
        </p>
      </Callout>

      <p>
        Automated evals and generated advice cover most of what you need - but some judgments
        still need a person. See <a href="#/labeling">labeling</a> for how human review fits in.
      </p>
    </>
  );
}
