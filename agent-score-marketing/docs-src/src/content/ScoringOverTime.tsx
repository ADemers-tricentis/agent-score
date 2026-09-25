import { Callout, Dek, Eyebrow, Screenshot, Step, StepList } from "../components/PageChrome";
import { ScoringOverTimeChart } from "../components/diagrams/ScoringOverTimeChart";
import scoringOverTimeSection from "../assets/score-over-time-section.png";

export default function ScoringOverTime() {
  return (
    <>
      <Eyebrow>The Scoring Journey</Eyebrow>
      <h1>Scoring over time</h1>
      <Dek>
        A scorecard isn't a one-time verdict. Agent Score keeps scoring your agent as more traces
        arrive, and the picture gets sharper every time.
      </Dek>

      <h2>Why the score moves</h2>
      <p>
        The first scoring run only has as much evidence as the traces collected so far - by
        design, that's the minimum, 20 traces. As real usage continues and more traces come in,
        later runs see a fuller, more representative picture of how your agent actually behaves,
        including edge cases the first run never saw.
      </p>

      <ScoringOverTimeChart />

      <p>
        In this example, an agent scored 54 on its first run against 20 traces. After more traffic
        arrived, a second run against the full 50 traces jumped to 87 - not because the agent
        changed, but because Agent Score's understanding of it did.
      </p>

      <h2>Scheduling runs</h2>
      <p>
        Beyond running scores manually, each agent has an <strong>Autonomous scoring</strong> toggle
        on its Profile tab. Leave its schedule blank and it inherits the tenant's default cadence;
        override either setting per agent when you need to:
      </p>
      <StepList>
        <Step title="Set a cadence">
          How often a new scoring run should fire, in minutes - 60 minutes minimum.
        </Step>
        <Step title="Set a lookback window">
          How far back to pull traces from for each scheduled run, from 1 to 90 days.
        </Step>
      </StepList>
      <p>
        From there, Agent Score keeps your scorecard current without anyone needing to remember to
        click "run." Turning the toggle off stops scheduled runs for that agent - "Score now" stays
        available regardless.
      </p>

      <Callout kind="warn" title="Scoring runs on AI credits">
        <p>
          Every scoring run - scheduled or manual - draws on your tenant's <strong>AI
          credits</strong> balance, shown in the header on every page. If that balance runs out,
          billable actions like "Score now" and autonomous scoring pause until it refreshes or
          more are added - you won't find out from a failed run partway through.
        </p>
      </Callout>

      <h3>What it looks like in the product</h3>
      <p>
        The trend lives right on the agent's <strong>Score</strong> tab, in its own{" "}
        <strong>Score over time</strong> section - it fills in once an agent has at least two
        scored runs to compare.
      </p>
      <Screenshot
        src={scoringOverTimeSection}
        alt="The Score over time section of an agent's Score tab, reading 'Not enough history yet - a trend needs at least two scored runs'"
        caption="The Score over time section on the Score tab, before a second run gives it something to compare."
      />

      <Callout kind="note" title="More data, not different data">
        <p>
          Later runs aren't reinterpreting your agent differently - they're seeing more of it. The
          same evaluation dimensions and profile apply throughout; the confidence behind the number
          just keeps improving.
        </p>
      </Callout>
    </>
  );
}
