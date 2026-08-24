import { Callout, Dek, Eyebrow, Screenshot } from "../components/PageChrome";
import { EvalBuilderFlowDiagram } from "../components/diagrams/EvalBuilderFlow";
import entryDoors from "../assets/entry-doors.png";
import guidedAuthor from "../assets/guided-author.png";
import evalRunner from "../assets/eval-runner.png";

export default function CustomEvals() {
  return (
    <>
      <Eyebrow>Evaluations</Eyebrow>
      <h1>Building a custom eval</h1>
      <Dek>
        The catalog covers most measurement needs out of the box. When it doesn't, the eval
        builder describes what to measure in plain language - no eval-engineering project
        required.
      </Dek>

      <Callout kind="note" title="Built by the Agent Score team, on your behalf">
        <p>
          The eval builder lives in Agent Score's Back Office, not in the customer app - it isn't
          a self-serve surface today. Tell the Agent Score team what you want measured and they'll
          build it using the flow below; this page shows you how it works, not a tool you'll click
          into yourself.
        </p>
      </Callout>

      <h2>Two ways to start</h2>
      <p>
        Not sure what to measure? Describe it in plain language and let Agent Score recommend an
        approach. Already know what's needed? Start from a catalog template instead. Both land in
        the same editor, and switching between them is possible at any time.
      </p>
      <Screenshot
        src={entryDoors}
        alt="The Create an eval screen, offering a choice between describing an eval in plain language with AI assistance, or browsing the catalog of templates and metrics"
        caption="The starting point for any new eval, from the Agent Score back office."
      />

      <h2>A worked example</h2>
      <p>
        Say you're scoring a qTest agent that turns requirements into test cases, and you want to
        make sure it always generates <strong>100% requirements coverage</strong> - a common ask
        for this kind of agent. That request gets typed into the eval builder.
      </p>

      <EvalBuilderFlowDiagram />

      <p>
        The builder recommends the best approach - in this case, likely a hybrid eval that counts
        requirement coverage deterministically and uses an LLM judge to confirm each requirement
        was addressed meaningfully, not just mentioned. You can push back, refine the wording, and
        tighten the criteria before it goes live.
      </p>
      <Screenshot
        src={guidedAuthor}
        alt="The Guided author flow: a plain-language description of what to measure, followed by Agent Score recommending a DAG safety gate approach with a Why this approach explanation"
        caption='A real recommendation from the Guided author flow, given the description "the agent should never give medical advice and must cite a source when it makes a claim."'
      />

      <h2>Test before you trust it</h2>
      <p>
        Before you lean on a new or edited eval, run it against real captured traces from a real
        tenant and agent with the <strong>Runner</strong> - no pasting trace IDs by hand, no
        hand-built test fixtures.
      </p>
      <Screenshot
        src={evalRunner}
        alt="The Runner tool with an eval pre-selected, and Tenant and Agent pickers to load that agent's captured traces before running"
        caption="The Runner - pick an eval, a tenant, and an agent, then run against whatever traces that agent has already captured."
      />

      <h2>Versions are immutable</h2>
      <p>
        Publishing a new or edited eval creates a new immutable version - the previous one, and
        every grade it ever produced, stays exactly as it was. Editing draft v2 of a published eval
        never rewrites what v1 already scored.
      </p>

      <Callout kind="note" title="Where a custom eval fits">
        <p>
          Once published, a custom eval behaves exactly like a catalog eval - it can be added to a{" "}
          <a href="#/dimensions-and-profiles">dimension</a> and weighted into a profile the same
          way.
        </p>
      </Callout>
    </>
  );
}
