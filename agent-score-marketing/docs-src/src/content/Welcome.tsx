import { Callout, Card, CardGrid, Dek, Eyebrow, Screenshot, Step, StepList } from "../components/PageChrome";
import homeDashboard from "../assets/home-dashboard.png";

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
        hands back a single, defensible answer: a 0-100 score and a
        ship / review / don't-ship recommendation - with the evidence to back it up.
      </p>

      <p>No labeled data. No manual test-writing. No AI expertise required to get started.</p>

      <p>
        From your first sign-in, you'll also see an <strong>AI credits</strong> balance in the
        header - that's what pays for scoring and evaluation. See{" "}
        <a href="#/scoring-over-time">scoring over time</a> for what happens if it runs out.
      </p>

      <Screenshot
        src={homeDashboard}
        alt="The Home page, showing real-agent and interaction totals, scoring runs in the last 24 hours, agents needing attention, and a verdict trend table of Ship / Review / Block counts over the last seven days"
        caption="Home - your fleet's health, scoring activity, and next steps, the moment you sign in."
      />

      <Callout kind="tip" title="New here? Take the tour">
        <p>
          Home offers a short guided tour the first time you sign in, and a handful of
          removable <strong>example agents</strong> you can poke at immediately - safe,
          self-service, and excluded from your real fleet's counts and scoring, so trying
          things out never contaminates your own numbers.
        </p>
      </Callout>

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
          You get a scorecard: a composite score and a ship / review / don't-ship
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
