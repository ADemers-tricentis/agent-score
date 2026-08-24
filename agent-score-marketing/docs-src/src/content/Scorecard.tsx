import { Badge, Callout, Dek, Eyebrow, Screenshot } from "../components/PageChrome";
import { ScorecardMock } from "../components/diagrams/ScorecardMock";
import scorecardTab from "../assets/scorecard-tab.png";

export default function Scorecard() {
  return (
    <>
      <Eyebrow>The Scoring Journey</Eyebrow>
      <h1>Reading your scorecard</h1>
      <Dek>
        This is the answer to "is my agent working?" - a single composite score, a verdict you can
        act on, and a full breakdown of exactly how the number was reached.
      </Dek>

      <ScorecardMock />

      <h2>The verdict zones</h2>
      <p>
        The composite score maps to a clear recommendation. Nothing is hidden behind the number -
        every zone has a defined meaning:
      </p>
      <table className="doc-table">
        <thead>
          <tr>
            <th>Score</th>
            <th>Verdict</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>85-100</td>
            <td><Badge kind="ship">Ship</Badge></td>
          </tr>
          <tr>
            <td>70-84</td>
            <td><Badge kind="ship">Ship (with note)</Badge></td>
          </tr>
          <tr>
            <td>55-69</td>
            <td><Badge kind="review">Review required</Badge></td>
          </tr>
          <tr>
            <td>40-54</td>
            <td><Badge kind="block">Block recommended</Badge></td>
          </tr>
          <tr>
            <td>0-39</td>
            <td><Badge kind="block">Block</Badge></td>
          </tr>
        </tbody>
      </table>

      <h2>Every number is evidence-backed</h2>
      <p>
        The dimension breakdown isn't a black box - each bar traces back to the evals that fed it,
        and each eval result carries its own plain-language reason and the trace span it came
        from. If a dimension scored low, you can see exactly which interactions dragged it down
        and why.
      </p>
      <Screenshot
        src={scorecardTab}
        alt="A real Score tab showing a composite score of 100 out of 100 with a Ship verdict, how many points above the Ship threshold, scored/skipped/failed/retired counts, and a dimension breakdown listing each dimension's weight and score with a link to the evaluations behind it"
        caption='A real Score tab - the composite score, how far above or below the Ship threshold it is, and the dimension breakdown behind the number.'
      />

      <Callout kind="tip" title="This is preliminary, and that's fine">
        <p>
          A scorecard produced from your first 20 traces is a real, usable signal - but it's a
          starting point, not a final word. See{" "}
          <a href="#/scoring-over-time">scoring over time</a> for how the score sharpens as more
          traces arrive.
        </p>
      </Callout>
    </>
  );
}
