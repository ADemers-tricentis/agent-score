import { Callout, Dek, Eyebrow, Screenshot } from "../components/PageChrome";
import { EvalBuilderFlowDiagram } from "../components/diagrams/EvalBuilderFlow";
import entryDoors from "../assets/entry-doors.png";
import guidedAuthor from "../assets/guided-author.png";
import studioTracepicker from "../assets/studio-tracepicker.png";
import studioDiff from "../assets/studio-diff-transparency.png";

export default function CustomEvals() {
  return (
    <>
      <Eyebrow>Evaluations</Eyebrow>
      <h1>Building a custom eval</h1>
      <Dek>
        The catalog covers most measurement needs out of the box. When it doesn't, the eval
        builder lets you describe what you want to measure in plain language - no eval-engineering
        project required.
      </Dek>

      <h2>Two ways to start</h2>
      <p>
        Not sure what to measure? Describe it in plain language and let Agent Score recommend an
        approach. Already know what you want? Browse the catalog and start from a template
        instead. Both land in the same editor, and you can switch between them at any time.
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
        for this kind of agent. You type that request into the eval builder.
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
        Every new eval can be tested live against a real trace from your own agent - no pasting
        IDs by hand, just pick one from what's already been captured.
      </p>
      <Screenshot
        src={studioTracepicker}
        alt="A picker showing five real captured interactions with scores and pass/fail outcomes, filterable by outcome, for testing an eval against"
        caption="Picking a real interaction to test an eval against - no trace IDs to paste."
      />

      <h2>Nothing changes silently</h2>
      <p>
        Publishing a new or edited eval creates a new immutable version, with a diff against the
        last one and a side-by-side score comparison across the same sampled interactions - so you
        can see exactly what a wording change actually moved before you publish it. A transparency
        panel also shows exactly what the judge received and what it replied, so a score is never
        just a number you have to take on faith.
      </p>
      <Screenshot
        src={studioDiff}
        alt="A version comparison showing exactly what changed in the criteria and evaluation steps between v2 and v3 of an eval, plus a score-impact table across four sampled interactions"
        caption="Comparing two versions of an eval - what changed in the rubric, and how scores moved on the same interactions."
      />

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
