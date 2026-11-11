import { Callout, Dek, Eyebrow, Screenshot } from "../components/PageChrome";
import tracesList from "../assets/traces-list.png";
import traceDetail from "../assets/trace-detail.png";
import traceScoreDetails from "../assets/trace-score-details.png";

export default function Traces() {
  return (
    <>
      <Eyebrow>The Scoring Journey</Eyebrow>
      <h1>Traces</h1>
      <Dek>
        Every score traces back to something real. The <strong>Traces</strong> tab is where you
        see the actual captured interactions behind the number - and dig into any one of them,
        span by span.
      </Dek>

      <h2>Every captured interaction, and its coverage</h2>
      <p>
        An agent's <strong>Traces</strong> tab lists every interaction Agent Score has captured
        for it, newest first: when it was captured, whether it completed successfully, its score,
        and how much of the eval set actually ran against it (its <strong>coverage</strong> - for
        example, 5 of 7 evals). Search by trace ID or name when you're chasing a specific one.
      </p>
      <Screenshot
        src={tracesList}
        alt="The Traces tab, listing captured interactions with their capture time, success status, score percentage, and eval coverage (e.g. 5/7 evals), with a search box for trace ID or name"
        caption="The Traces tab - every captured interaction for this agent, with its score and how much of the eval set covered it."
      />

      <h2>Opening a trace</h2>
      <p>
        Click any trace and you get its full span waterfall - every model call and tool call that
        happened inside it, in order, with duration and token counts. Select any span to see its{" "}
        <strong>Span details</strong>: the input and output it actually carried, plus its raw
        metadata.
      </p>
      <Screenshot
        src={traceDetail}
        alt="A trace's span waterfall, showing the agent span and its child generation and tool spans (gen_ai.chat, look_up_order, check_refund_eligibility, issue_refund, send_confirmation_email) with durations and token counts, next to a Span details panel"
        caption="A trace opened to its span waterfall - every model and tool call inside it, selectable for input/output detail."
      />

      <h2>Score details, right next to the evidence</h2>
      <p>
        Switch to <strong>Score details</strong> on the same trace and you see exactly how it
        scored: the unweighted mean across its scored evals, how many evals actually ran versus
        came back <strong>insufficient evidence</strong>, and - per eval - the score, a
        plain-language reason, and the specific span IDs that reason is grounded in. A{" "}
        <strong>Score this trace</strong> button re-runs evaluation for this one interaction on
        demand.
      </p>
      <Screenshot
        src={traceScoreDetails}
        alt="The Score details panel for a trace, showing 0% as the unweighted mean of 5 scored evals, 2 evals marked insufficient evidence, and a per-eval breakdown (e.g. Mcp Task Completion: 0.00) with a plain-language reason and evidence span IDs"
        caption="Score details for a trace - the score, the reason behind it, and the exact spans that reason cites as evidence."
      />

      <Callout kind="tip" title="This is where 'insufficient evidence' gets explained">
        <p>
          If a dimension on the <a href="#/scorecard">scorecard</a> shows evaluations that
          couldn't be scored, a trace's Score details is where you find out why - often because a
          span's input or output wasn't captured the way an eval needed it, not because the agent
          did anything wrong.
        </p>
      </Callout>

      <p>
        Once you can see what's actually happening in a trace, the natural next question is what
        to do about it - see <a href="#/improve">improve this agent</a> for recommendations
        generated from this same evidence.
      </p>
    </>
  );
}
