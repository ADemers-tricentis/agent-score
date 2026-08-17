import { Callout, Card, CardGrid, Dek, Eyebrow, Screenshot, Step, StepList } from "../components/PageChrome";
import agentsCards from "../assets/agents-cards.png";

export default function Welcome() {
  return (
    <>
      <Eyebrow>Get Started</Eyebrow>
      <h1>Know if your agent is actually working</h1>
      <Dek>
        Creating AI agents is easier than ever. Knowing whether one is any good has always been
        the hard part - unless you're an AI expert, it's not obvious what to even measure. Agent
        Score answers that question automatically, and gets more accurate the longer your agent
        runs.
      </Dek>

      <p>
        Agent Score watches the real activity your agent already produces, works out what kind of
        agent it is, evaluates it across the dimensions that matter for that kind of work, and
        hands back a single, defensible answer: a 0-100 score, a letter grade, and a
        ship / review / don't-ship recommendation - with the evidence to back it up.
      </p>

      <p>No labeled data. No manual test-writing. No AI expertise required to get started.</p>

      <Screenshot
        src={agentsCards}
        alt="The Agent Score dashboard showing a fleet of agents, each with a composite score, verdict, and a dimension breakdown with weights"
        caption="Your agents, at a glance - composite score, verdict, and the dimensions behind each one."
      />

      <h2>The three things this guide covers</h2>
      <CardGrid>
        <Card href="#/connect-your-agent" title="Getting Started">
          Point your agent at Agent Score and watch traces start flowing in - usually in under ten
          minutes.
        </Card>
        <Card href="#/eval-catalog" title="Evaluations">
          What an "eval" is, the 60+ that ship out of the box, and how to build your own in plain
          English.
        </Card>
        <Card href="#/agent-card" title="The Scoring Journey">
          How Agent Score learns what your agent is for, and how that becomes a score you can act
          on.
        </Card>
      </CardGrid>

      <h2>How it fits together</h2>
      <StepList>
        <Step title="Connect">
          Traces start arriving - automatically for Tricentis-built agents, or via a two-line
          OpenTelemetry export for everything else.
        </Step>
        <Step title="Recognize">
          Agent Score names and categorizes your agent from its behavior. No setup form to fill
          out per agent.
        </Step>
        <Step title="Evaluate">
          Once enough traces have arrived, a scoring agent picks the right profile - the bundle of
          evaluation dimensions suited to what your agent actually does - and runs it.
        </Step>
        <Step title="Decide">
          You get a scorecard: a composite score, a grade, and a ship / review / don't-ship
          recommendation, with every number traceable back to the evidence behind it.
        </Step>
      </StepList>

      <Callout kind="tip" title="Who this is for">
        <p>
          This guide assumes no evals background and no AI expertise. If you can describe what
          your agent is supposed to do in a sentence, you have everything you need to get a
          score.
        </p>
      </Callout>
    </>
  );
}
