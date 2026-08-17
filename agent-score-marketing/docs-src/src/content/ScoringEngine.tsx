import { Callout, Dek, Eyebrow } from "../components/PageChrome";

export default function ScoringEngine() {
  return (
    <>
      <Eyebrow>Evaluations</Eyebrow>
      <h1>Scoring engine settings</h1>
      <Dek>
        Behind every eval is a scoring engine you can configure - how strict it is, which LLM does
        the judging, and where the tokens it spends go.
      </Dek>

      <h2>Pass threshold</h2>
      <p>
        Each eval, dimension, and profile has a configurable pass threshold - the line between
        "good enough" and "needs attention." Thresholds you set here are what drive the
        ship / review / don't-ship recommendation on the scorecard, and what a CI/CD pipeline
        checks before it lets a merge through.
      </p>

      <h2>Choose your judge model</h2>
      <p>
        G-Eval and Hybrid evals need an LLM to do the judging. You choose which one. Agent Score
        supports most common providers:
      </p>
      <ul>
        <li>Anthropic Claude</li>
        <li>OpenAI</li>
        <li>Azure OpenAI</li>
        <li>Amazon Bedrock</li>
      </ul>
      <p>
        Every score is stamped with which judge model produced it. That matters more than it
        sounds - LLM judges drift over time, and the same prompt on a newer model can score
        differently. Recording the judge model alongside the score is what makes a delta between
        two runs trustworthy rather than an artifact of a silent model upgrade.
      </p>

      <h2>Usage log</h2>
      <p>
        A usage log shows tokens, cost, and outcome for every scoring call, so judge spend is never
        a mystery line item. Review it the same way you'd review any other metered service.
      </p>

      <Callout kind="tip" title="Changing the judge model later">
        <p>
          You can switch providers or models at any time. Because every past score carries its own
          judge-model record, comparing an old run to a new one never confuses a genuine quality
          change with a change in who's doing the judging.
        </p>
      </Callout>
    </>
  );
}
