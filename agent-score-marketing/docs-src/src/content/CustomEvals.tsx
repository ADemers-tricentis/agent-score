import { Callout, Dek, Eyebrow, Screenshot, Step, StepList } from "../components/PageChrome";
import threeAnswers from "../assets/custom-eval-three-answers.png";
import newEvalForm from "../assets/new-eval-form.png";

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
      <p>
        <strong>Create</strong> → <strong>Eval</strong> opens <strong>New eval</strong>. The form
        has four sections, top to bottom. Fields marked with an asterisk are required.
      </p>
      <StepList>
        <Step title="General - what the eval is called">
          <strong>Name</strong> is what you'll see on scorecards and in profiles, for example "No
          refund promises". <strong>Slug</strong> is its short ID: lowercase letters, digits,
          hyphens or underscores, up to 37 characters. Your organization's prefix is added for
          you, and the slug can't change once the eval exists. <strong>Description</strong> is
          optional - a sentence or two on what the check catches, up to 1,000 characters.{" "}
          <strong>Dimensions</strong> is the{" "}
          <a href="#/dimensions-and-profiles">category</a> (or categories) the eval counts toward,
          chosen from <strong>Add dimension…</strong>. You can pick the built-in dimensions and
          your organization's published ones; drafts aren't listed.
        </Step>
        <Step title="Scoring - the pass line and what the check needs">
          <strong>Default threshold</strong> is the pass line, between 0 and 1. It starts at 0.7,
          and a profile can override it for this check. <strong>Input needs</strong> are four
          boxes - <strong>Retrieval context</strong>, <strong>Tools</strong>,{" "}
          <strong>Conversation</strong>, and <strong>Expected output</strong> - for what the
          check has to find in a trace before it can run. Expected output only works on traces
          that have a <a href="#/labeling">labeled</a> example. Leave every box empty and the
          check applies to every agent.
        </Step>
        <Step title="What this check measures - three plain-language answers">
          <strong>What is being checked</strong>, <strong>What earns a full score</strong>, and{" "}
          <strong>What earns zero</strong>. Below them, the <strong>Compiled rubric
          (read-only)</strong> shows exactly what the judge will read: your answers, marked down
          the left edge, inside Agent Score's house rules in grey. The judge treats your words as
          your text only, not as instructions. The counter under it shows how close you are to
          the 2,000-character limit.
        </Step>
        <Step title="Preview on an agent - try it before you save">
          Choose an <strong>Agent</strong>, optionally pick up to five{" "}
          <strong>Traces</strong>, and click <strong>Run preview</strong>. See the next section.
        </Step>
      </StepList>
      <Screenshot
        src={newEvalForm}
        alt="The New eval form with its four sections: General (Name, Slug with the organization prefix, Description, Dimensions), Scoring (Default threshold set to 0.7 and four Input needs checkboxes), What this check measures (three answer fields and the read-only compiled rubric), and Preview on an agent (Agent, Traces, and the cost estimate), with Cancel, Save draft, and Save and publish at the bottom"
        caption="The New eval form, top to bottom: General, Scoring, What this check measures, and Preview on an agent."
      />
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
        publish</strong> makes it available to your whole organization, ready to add to a{" "}
        <a href="#/custom-profiles">profile</a> alongside built-in evals.{" "}
        <strong>Cancel</strong> leaves without saving.
      </p>

      <h2>Changing an eval after it's published</h2>
      <p>
        On <strong>Our evals</strong>, click an eval's card to see its check, its scoring rules,
        and its dimensions, then <strong>Open</strong> it. The eval's page has these sections:
      </p>
      <ul>
        <li>
          <strong>General</strong> - you can change the name and description here.{" "}
          <strong>Save changes</strong> keeps them. The slug stays as it was set.{" "}
          <strong>Clone</strong> starts a new eval from this one.
        </li>
        <li>
          <strong>Latest version</strong> - read-only. To change how the eval scores (its check,
          threshold, input needs, or dimensions), click <strong>New version</strong>.
        </li>
        <li>
          <strong>Versions</strong> - every saved version, in order. Versions are never edited or
          deleted.
        </li>
        <li>
          <strong>Profiles using this eval</strong> - which profiles include it, and which version
          each one uses. When you save a new version of your own eval, your profiles move to it
          for you.
        </li>
        <li>
          <strong>Danger zone</strong> - <strong>Archive eval</strong> stops it being added to
          profiles. Past runs can still show it. You can't archive an eval while a profile still
          uses it.
        </li>
      </ul>

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
