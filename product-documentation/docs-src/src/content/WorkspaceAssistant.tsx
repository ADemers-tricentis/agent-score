import { Callout, Dek, Eyebrow, Screenshot } from "../components/PageChrome";
import assistantIntro from "../assets/assistant-intro.png";
import assistantInput from "../assets/assistant-input.png";

export default function WorkspaceAssistant() {
  return (
    <>
      <Eyebrow>Get Started</Eyebrow>
      <h1>Ask the Assistant</h1>
      <Dek>
        Some questions are faster to ask than to click your way to. The Assistant is a chat,
        scoped to one organization at a time, that already knows your agents, traces, and scores.
      </Dek>

      <p>
        Open it from the <strong>Assistant</strong> icon in the left nav, or from{" "}
        <strong>Ask the assistant</strong> on any agent's page - that opens a session already
        anchored to that agent. Pick the organization, then ask in plain language: which agents need
        attention, why a score moved, what a given trace actually did.
      </p>

      <Screenshot
        src={assistantIntro}
        alt="A new Assistant session, reading 'Ask about your organization's agents, traces and scores. It reads freely, and changes something only after you approve it: starting a scoring run, drafting, versioning, publishing and previewing evals and profiles, or queuing a profile's agents for re-scoring.'"
        caption="A new session - the Assistant reads freely across the organization you pick."
      />

      <Screenshot
        src={assistantInput}
        alt="The Assistant's organization picker, a Recent shortcut, and a text input reading 'Ask about your organization's agents, traces and scores...'"
        caption="Every session is scoped to one organization - switch the picker to ask about a different one."
      />

      <Callout kind="note" title="It reads freely; it only writes with your OK">
        <p>
          The Assistant can look at anything in the organization you've picked. It can also take a
          short list of actions - starting a scoring run; drafting, versioning, publishing, or
          previewing <a href="#/custom-evals">your own evals and profiles</a>; or queuing a
          profile's agents for re-scoring - but every one of them stops at an approval card first,
          and nothing happens until you approve it. It won't change an agent's settings or touch a
          threshold on its own.
        </p>
      </Callout>
    </>
  );
}
