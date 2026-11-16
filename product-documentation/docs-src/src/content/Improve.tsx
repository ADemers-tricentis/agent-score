import { Callout, CodeBlock, Dek, Eyebrow, Screenshot, Step, StepList } from "../components/PageChrome";
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

      <h2>Improve from your coding agent</h2>
      <p>
        Once your coding agent is connected (see <a href="#/connect-with-mcp">Connect with MCP</a>),
        it can run the whole loop from the project you have open: find what scores low, read why,
        get advice, change the code, and score the change. Ask in a sentence at each step. The
        tool names are there so you can match them to <a href="#/mcp-tools">MCP Tools Reference</a>.
      </p>
      <StepList>
        <Step title="Find the weakest eval">
          <CodeBlock>How is checkout-agent scoring, and what is the weakest part?</CodeBlock>
          <p>
            <code>get_scorecard</code> reads the latest scored run: the composite, the verdict, the
            breakdown by dimension and by eval, and the profile it was scored under.
          </p>
        </Step>
        <Step title="See the interactions it scored low">
          <CodeBlock>Show me the two interactions that scored lowest on that eval.</CodeBlock>
          <p>
            <code>get_eval_interactions</code> lists what that eval scored on the latest run, lowest
            first, with the judge's reason for each. <code>get_interaction</code> opens one in full:
            its input and output, and every eval's score and reason.
          </p>
        </Step>
        <Step title="Open the failing traces">
          <CodeBlock>Why did trace 4f2a… fail?</CodeBlock>
          <p>
            <code>search_traces</code> finds traces by time window, or by an exact trace id. It is
            not a text search. <code>trace_outline</code> lists a trace's spans, or only the ones
            that failed. <code>grep_trace</code> finds exact text in the trace, and{" "}
            <code>read_span</code> reads a span's input and output.
          </p>
        </Step>
        <Step title="Ask for advice and wait for it">
          <CodeBlock>What should I change in checkout-agent, based on the latest scores?</CodeBlock>
          <p>
            <code>get_improvement_advice</code> reads the advice already given.{" "}
            <code>request_improvement_advice</code> asks for new advice on the latest scored run.
            It runs in the background, and your coding agent follows it with <code>get_job</code>{" "}
            until it finishes, then reads it. The agent needs a scored run first. Long text is cut
            in the reply. The Agent Score app has it in full.
          </p>
        </Step>
        <Step title="Change the code">
          <p>
            Your coding agent can find the code each recommendation points to, such as the prompt,
            the tool definitions or the handling of the failing case, and propose a change for each.
            Decide which changes to make before it edits anything.
          </p>
        </Step>
        <Step title="Mark the change as a revision">
          <CodeBlock>I changed checkout-agent. Start a revision called retry-refund-tool.</CodeBlock>
          <p>
            A revision marks the moment a change to your agent begins. Traces from then on belong
            to the new revision, and earlier ones stay with the previous one. After{" "}
            <code>start_agent_revision</code>, scoring covers only traces from the revision onward,
            so the next score reflects the change. Each run carries its revision's label.
          </p>
          <p>
            The reply says how many traces the revision has. At zero, there is nothing to score
            yet: run the agent first, with the project's own run or test script if it has one.
          </p>
        </Step>
        <Step title="Score again">
          <CodeBlock>Score checkout-agent now.</CodeBlock>
          <p>
            <code>score_agent</code> starts a run, and your coding agent follows it with{" "}
            <code>get_job</code>. An agent can be scored by hand once every five minutes. If the run
            failed or stopped partway, <code>continue_run</code> can resume it. To make a complete
            run the baseline later runs are compared against, ask your coding agent to approve it.
          </p>
        </Step>
        <Step title="Compare before and after">
          <CodeBlock>Compare the new score with the last run before the change.</CodeBlock>
          <p>
            <code>list_runs</code> finds the last run of the previous revision, and{" "}
            <code>get_scorecard</code> reads both. Compare the composite, the ship decision, the
            verdict and which evals moved. If the two runs used different profiles, the change
            alone does not explain the difference.
          </p>
        </Step>
      </StepList>
      <p>
        The server's prompts run parts of this loop for you: <code>review-my-score</code> covers
        the first two steps, <code>debug-a-trace</code> the third, <code>improve-my-agent</code>{" "}
        steps four and five, and <code>verify-my-change</code> the last three.
      </p>
      <p>
        Where the judge got an interaction wrong, label it. <code>get_labeling_queue</code> lists
        traces with no label yet, and <code>submit_label</code> saves whether the response was
        correct and, if not, what it should have been. See <a href="#/labeling">Labeling</a>.
      </p>
      <Callout kind="note" title="Credits and permissions">
        <p>
          Asking for advice, scoring, resuming a run, and previewing an eval need the{" "}
          <strong>Spend credits</strong> switch, and use your organization's AI credits for agents
          you connected yourself. Revisions and labels need <strong>Change</strong>. Everything
          else in this loop needs only <strong>Read</strong>. Set the switches on Integrations,
          under Manage permissions (see{" "}
          <a href="#/connect-with-mcp">Choose what your coding agent can do</a>).
        </p>
      </Callout>

      <p>
        Automated evals and generated advice cover most of what you need - but some judgments
        still need a person. See <a href="#/labeling">labeling</a> for how human review fits in.
      </p>
    </>
  );
}
