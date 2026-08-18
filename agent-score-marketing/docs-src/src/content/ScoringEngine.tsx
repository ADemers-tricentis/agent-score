import { Callout, Dek, Eyebrow } from "../components/PageChrome";

export default function ScoringEngine() {
  return (
    <>
      <Eyebrow>Evaluations</Eyebrow>
      <h1>Scoring engine settings</h1>
      <Dek>
        Behind every eval is a scoring engine with its own dials - how strict it is, which LLM does
        the judging, and where the tokens it spends go. Here's what's yours to configure today, and
        what Agent Score still manages on your behalf.
      </Dek>

      <h2>Pass threshold</h2>
      <p>
        Each eval, dimension, and profile has a configurable pass threshold - the line between
        "good enough" and "needs attention." You set these on the <strong>Profile</strong> tab for
        each agent, right alongside its dimension weights - not a separate settings screen.
        Thresholds are what drive the ship / review / don't-ship recommendation on the scorecard,
        and what a CI/CD pipeline checks before it lets a merge through.
      </p>

      <h2>Choosing a judge model</h2>
      <p>
        G-Eval and Hybrid evals need an LLM to do the judging. Agent Score supports most common
        providers - Anthropic Claude, OpenAI, Azure OpenAI, and Amazon Bedrock - and picks one on
        your behalf today. Choosing a provider yourself isn't yet a self-serve setting in the app;
        ask the Agent Score team if you need a specific one.
      </p>
      <p>
        Every score is still stamped with which judge model produced it. That matters more than it
        sounds - LLM judges drift over time, and the same prompt on a newer model can score
        differently. Recording the judge model alongside the score is what makes a delta between
        two runs trustworthy rather than an artifact of a silent model upgrade.
      </p>

      <h2>Usage log</h2>
      <p>
        A running log of tokens, cost, and outcome per scoring call isn't in the app today. If
        judge spend needs a closer look in the meantime, the Agent Score team can pull it for you.
      </p>

      <Callout kind="tip" title="A judge model change never breaks history">
        <p>
          Whether it's Agent Score or a future self-serve setting that makes the switch, every past
          score carries its own judge-model record - so comparing an old run to a new one never
          confuses a genuine quality change with a change in who's doing the judging.
        </p>
      </Callout>
    </>
  );
}
