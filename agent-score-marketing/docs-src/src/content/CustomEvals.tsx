import { Callout, Dek, Eyebrow, Screenshot, Step, StepList } from "../components/PageChrome";
import threeAnswers from "../assets/custom-eval-three-answers.png";

export default function CustomEvals() {
  return (
    <>
      <Eyebrow>Evaluations</Eyebrow>
      <h1>Building your own evals</h1>
      <Dek>
        The built-in catalog covers most needs. When your agent has a rule of its own - "never
        promise a refund", "always name the test case it created" - you can write that check
        yourself, in plain language, and score your agent against it.
      </Dek>

      <h2>Where your evals live</h2>
      <p>
        Open <strong>Evals</strong> in the left nav. The header names the organization you're
        working in, with a picker beside it if you belong to more than one - everything you create
        is saved there. The tabs split your organization's work from what ships with Agent Score:
      </p>
      <ul>
        <li><strong>My drafts</strong> - evals and profiles you've started but not published yet</li>
        <li><strong>Our evals</strong> - your organization's published evals</li>
        <li><strong>Built-in evals</strong>, <strong>Dimensions</strong>, <strong>Profiles</strong> - the <a href="#/eval-catalog">catalog</a> that ships with Agent Score</li>
      </ul>
      <p>
        <strong>Create</strong> starts a new <strong>Eval</strong>, <strong>Dimension</strong>, or{" "}
        <strong>Profile</strong>. You can also start from an agent: its{" "}
        <strong>Profile</strong> tab has <strong>Create an eval for this agent</strong> and{" "}
        <strong>Create a profile for this agent</strong>.
      </p>

      <h2>Writing an eval</h2>
      <StepList>
        <Step title="Name it and pick its dimensions">
          Give it a name and a slug (the slug can't change later), and choose which{" "}
          <a href="#/dimensions-and-profiles">dimensions</a> it counts toward.
        </Step>
        <Step title="Set the pass line and what it needs">
          A default threshold between 0 and 1 - a profile can override it - plus any input the
          check depends on: retrieval context, tools, a conversation, or an expected output from a
          labeled example. Leave the inputs empty and the check applies to every agent.
        </Step>
        <Step title="Answer three questions">
          What is being checked, what earns a full score, and what earns zero. Agent Score wraps
          your answers in its own house rules and shows you the compiled rubric the judge will
          actually read.
        </Step>
      </StepList>
      <Screenshot
        src={threeAnswers}
        alt="The What this check measures section of the New eval form, with three fields - What is being checked, What earns a full score, and What earns zero - and a read-only compiled rubric that frames those answers inside the platform's house rules"
        caption="Three plain-language answers become the rubric the judge grades against - shown to you before anything runs."
      />

      <h2>Preview it before you publish</h2>
      <p>
        <strong>Preview on an agent</strong> runs the new check on its own against up to five of
        that agent's traces - ones you've <a href="#/labeling">labeled</a> first, then the newest,
        unless you pick them yourself. Nothing is saved. The form tells you the most it can cost
        before you run it (up to $1.00 per trace), and it's billed to your organization's AI
        credits.
      </p>

      <h2>Drafts stay private until you publish</h2>
      <p>
        <strong>Save draft</strong> keeps the eval visible only to you. <strong>Save and
        publish</strong> makes it available to your whole organization, ready to add to a profile
        alongside built-in evals.
      </p>

      <Callout kind="tip" title="Or ask the Assistant">
        <p>
          The <a href="#/workspace-assistant">Assistant</a> can draft, preview, and publish evals
          and profiles for you in conversation - each step waits for your approval before it
          happens.
        </p>
      </Callout>
    </>
  );
}
