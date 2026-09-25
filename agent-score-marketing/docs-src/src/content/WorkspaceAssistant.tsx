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
        scoped to one tenant at a time, that already knows your agents, traces, and scores.
      </Dek>

      <p>
        Open it from the <strong>Assistant</strong> icon in the left nav, or from{" "}
        <strong>Ask the assistant</strong> on any agent's page - that opens a session already
        anchored to that agent. Pick a tenant, then ask in plain language: which agents need
        attention, why a score moved, what a given trace actually did.
      </p>

      <Screenshot
        src={assistantIntro}
        alt="A new Assistant session, reading 'Ask about a tenant's agents, traces and scores. It can read freely; the one thing it can change is starting a scoring run, and it has to ask you first.'"
        caption="A new session - the Assistant reads freely across the tenant you pick."
      />

      <Screenshot
        src={assistantInput}
        alt="The Assistant's tenant picker set to a tenant, with a text input reading 'Ask about this tenant's agents, traces and scores...'"
        caption="Every session is scoped to one tenant - switch tenants to ask about a different one."
      />

      <Callout kind="note" title="It reads freely; it only writes with your OK">
        <p>
          The Assistant can look at anything in the tenant you've picked, but the only action it
          can take is starting a scoring run - and it asks you before it does. It won't change a
          setting, edit a profile, or touch a threshold on its own.
        </p>
      </Callout>
    </>
  );
}
