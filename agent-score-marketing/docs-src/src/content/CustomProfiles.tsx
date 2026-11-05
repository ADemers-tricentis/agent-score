import { Callout, Dek, Eyebrow, Screenshot, Step, StepList } from "../components/PageChrome";
import newProfileForm from "../assets/new-profile-form.png";

export default function CustomProfiles() {
  return (
    <>
      <Eyebrow>Evaluations</Eyebrow>
      <h1>Building your own profiles</h1>
      <Dek>
        A <a href="#/dimensions-and-profiles">profile</a> is the recipe an agent is scored
        against: which evals run, how much each one counts, and where the line between Ship and
        Block sits. When none of the built-in profiles fits your agent, you can build your own.
      </Dek>

      <h2>Where to start</h2>
      <p>
        Open <strong>Evals</strong> in the left nav and choose <strong>Create</strong> →{" "}
        <strong>Profile</strong>, or open an agent's <strong>Profile</strong> tab and click{" "}
        <strong>Create a profile for this agent</strong>. Either way you land on{" "}
        <strong>New profile</strong>. Like evals, a new profile is a draft that only you can see
        until you publish it.
      </p>

      <h2>The New profile form, section by section</h2>
      <p>
        The form opens with two sections, <strong>General</strong> and <strong>Checks</strong>.
        The tuning lives under <strong>Advanced settings</strong>, which stays closed until you
        open it. Fields marked with an asterisk are required.
      </p>
      <StepList>
        <Step title="General - what the profile is and who it's for">
          <strong>Start from</strong> copies an existing profile into the form so you aren't
          starting blank. Pick <strong>Empty</strong>, one of your organization's profiles, or a
          built-in one such as Task Agent. <strong>Name</strong> is what you'll see on the agent's Profile
          tab. <strong>Slug</strong> is its short ID: lowercase letters, digits, hyphens or
          underscores, up to 37 characters. Your organization's prefix is added for you, and the
          slug can't change later. <strong>Description</strong> is optional.{" "}
          <strong>Intent</strong> is the kind of agent the profile is for:{" "}
          <strong>conversational</strong>, <strong>rag</strong> (answers from retrieved context),{" "}
          <strong>tool</strong>, or <strong>general</strong>. It's filled in from the profile you
          started from. Leave it at <strong>None</strong> and Agent Score will never choose this
          profile for an agent on its own; you'll have to pin it yourself.
        </Step>
        <Step title="Checks - which evals run">
          <strong>Add a check</strong> lists every published eval: your organization's (marked
          "yours") and the built-in ones. Each check you add shows the exact version it uses, a
          switch to turn it on or off, and a bin to remove it. A turned-off check stays in the
          profile but doesn't score. The counter shows how many checks are on (up to 20) and how
          much of your own rubric text the profile carries (up to 24,000 characters).
        </Step>
        <Step title="Advanced settings - how much each check counts">
          Open <strong>Advanced settings</strong> to tune the profile. It has three parts:
          <ul>
            <li>
              <strong>Check settings</strong> - one row per check, with its{" "}
              <strong>Dimension</strong> (the category it counts toward),{" "}
              <strong>Threshold</strong> (its pass line, from 0 to 1, overriding the eval's
              default), and <strong>Weight</strong> (how much it counts inside its dimension).
              Each check stays on the exact version shown.
            </li>
            <li>
              <strong>Dimension weights</strong> - how much each dimension counts in the final
              score. Only the dimensions your checks use are listed.
            </li>
            <li>
              <strong>Verdict bands</strong> - the composite score, from 0 to 100, a run needs for
              each verdict: <strong>Ship</strong>, <strong>Ship with note</strong>,{" "}
              <strong>Review required</strong>, and <strong>Block recommended</strong>, highest
              first. Anything below the last band is Block. Built-in profiles start at 85, 70, 55
              and 40.
            </li>
          </ul>
        </Step>
        <Step title="Save it">
          <strong>Create draft</strong> saves it privately. <strong>Create and publish</strong>{" "}
          makes it available to your organization, so it can be pinned to an agent or chosen
          automatically. <strong>Cancel</strong> leaves without saving. If you have unsaved
          changes, Agent Score asks <strong>Leave this profile?</strong> first, and{" "}
          <strong>Stay</strong> takes you back to the form.
        </Step>
      </StepList>
      <Screenshot
        src={newProfileForm}
        alt="The New profile form started from the built-in Task Agent profile, with General (Start from, Name, Slug, Description, Intent), Checks (seven checks, each with an on switch and a remove button, and a counter of 7 of 20 enabled checks), and Advanced settings open to show Check settings (dimension, threshold, and weight per check), Dimension weights, and Verdict bands of 85, 70, 55, and 40"
        caption="The New profile form started from Task Agent, with Advanced settings open."
      />

      <h2>Changing a published profile</h2>
      <p>
        Open a profile from <strong>Evals</strong> → <strong>Profiles</strong>, or click{" "}
        <strong>Open profile</strong> on an agent's Profile tab. The profile's page has these
        sections:
      </p>
      <ul>
        <li>
          <strong>General</strong> - you can change the name and description here.{" "}
          <strong>Save changes</strong> keeps them. The slug stays as it was set.
        </li>
        <li>
          <strong>Checks in</strong> the current version - read-only. You see each check, the
          version it uses, its dimension, threshold, weight, and whether it's on. To change any of
          that, click <strong>New version</strong>. It opens the same Checks and Advanced settings
          as the New profile form. When you <strong>Save version</strong>, every agent on the
          previous version moves to the new one, and nothing is re-scored.
        </li>
        <li>
          <strong>Versions</strong> - every saved version, in order. Versions are never edited or
          deleted.
        </li>
        <li>
          <strong>Agents on this profile</strong> - which agents use it, on which version, and
          whether they're pinned to it. Agents pick up the latest version on their next scheduled
          run. <strong>Apply and re-score…</strong> queues a re-score, which happens with the
          agent's next scoring run.
        </li>
        <li>
          <strong>Danger zone</strong> - <strong>Archive profile</strong> takes it out of the
          choices for new agents. Past versions still work. You can't archive a profile while an
          agent is still using it.
        </li>
      </ul>

      <Callout kind="tip" title="Or ask the Assistant">
        <p>
          The <a href="#/workspace-assistant">Assistant</a> can draft and publish profiles for you
          in conversation - each step waits for your approval before it happens.
        </p>
      </Callout>
    </>
  );
}
