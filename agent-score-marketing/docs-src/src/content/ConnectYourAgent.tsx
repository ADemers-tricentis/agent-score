import { Callout, Dek, Eyebrow, Screenshot } from "../components/PageChrome";
import { IngestionFlowDiagram } from "../components/diagrams/IngestionFlow";
import integrationsTab from "../assets/integrations-tab.png";

export default function ConnectYourAgent() {
  return (
    <>
      <Eyebrow>Get Started</Eyebrow>
      <h1>Connect your agent</h1>
      <Dek>
        Setup happens once per workspace, not once per agent. After that, every agent you ever run -
        today's and next year's - is measured automatically the moment it starts sending activity.
      </Dek>

      <h2>Your workspace comes first</h2>
      <p>
        Before any traces can flow in, your workspace - what Agent Score calls a <strong>tenant</strong> -
        has to exist. Today that's set up by the Agent Score team on your behalf, not a self-serve
        signup form: someone on our side provisions your workspace. Once it exists, everything from
        here on is yours to drive.
      </p>

      <h2>Ingest keys are yours to manage</h2>
      <p>
        Traces authenticate with an <strong>ingest key</strong> (shown as <code>tk_...</code>), not
        a generic API key. Each key belongs to exactly one tenant. From{" "}
        <strong>Integrations</strong> in the sidebar, you can create a new key, rotate one, or
        revoke it, independently of any other key on the tenant - no ticket to the Agent Score team
        required.
      </p>
      <Screenshot
        src={integrationsTab}
        alt="The Integrations page, showing a tenant selector and a table of API keys with status, created date, last used, and Rotate / Revoke actions, plus a New key button"
        caption="Manage ingest keys yourself - create, rotate, or revoke, per tenant."
      />
      <Callout kind="warn" title="Reachable over the Tricentis VPN only">
        <p>
          The ingest endpoint is only reachable from the Tricentis VPN. Make sure whatever sends
          traces - your agent, its exporter, or the host it runs on - can reach it from there.
        </p>
      </Callout>

      <h2>Two ways in</h2>
      <p>
        <strong>Internal Tricentis agents</strong> are ingested automatically - there is nothing to
        configure. They are named and categorized the moment their first traces arrive.
      </p>
      <p>
        <strong>External agents</strong> connect through an OpenTelemetry export - the same
        telemetry standard almost every modern agent framework already speaks. There's no new SDK
        to install and no per-agent library to learn. In most cases it's two additional lines
        added to an exporter you already have:
      </p>
      <pre>
        <code>
          {"OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=<your ingest endpoint>/external/otel/v1/traces\n"}
          {"OTEL_EXPORTER_OTLP_TRACES_HEADERS=Authorization=Bearer <your tk_... ingest key>"}
        </code>
      </pre>
      <p>
        Use the <code>_TRACES_</code>-suffixed variables specifically, not the generic{" "}
        <code>OTEL_EXPORTER_OTLP_ENDPOINT</code> - that's what keeps trace export separate from any
        logs or metrics your exporter also happens to send.
      </p>

      <IngestionFlowDiagram />

      <h2>You don't have to tell us what the agent is</h2>
      <p>
        Most tools make this the customer's problem: pick the right SDK, map your fields, describe
        the agent, configure each one by hand. Agent Score does the opposite. It reads the
        activity your agent produces and works out, from its behavior, which agent it belongs to -
        a new one it's never seen, or one it already knows.
      </p>
      <p>
        It looks at things like the agent's toolset, its model, its naming patterns, and the shape
        and timing of its calls. A returning agent keeps one continuous identity even if its
        activity shows up in a different shape next time. A genuinely new agent - say, a different
        toolset - is created on the spot.
      </p>

      <Callout kind="note" title="Why this matters">
        <p>
          The first agent and the hundredth agent cost you the same amount of setup: none. As your
          fleet of agents grows, onboarding stays a non-event.
        </p>
      </Callout>

      <h2>What happens after you connect</h2>
      <p>
        Traces arrive, get recognized, and are filed under the right agent - automatically and
        continuously, with no human in the loop. You'll see the agent appear in your dashboard
        right away in a <strong>Setting up</strong> state, then <strong>Learning your agent</strong>{" "}
        with a live count ("n of 20 traces") once its first trace lands.
      </p>
      <p>
        It takes <strong>20 traces</strong> for scoring to begin. This is deliberate: asking you to
        configure evaluation criteria before Agent Score has seen how your agent actually behaves
        would mean guessing. Once enough real traces have arrived, a scoring run kicks off
        automatically and the agent moves to <strong>Scored</strong> (or{" "}
        <strong>Needs attention</strong> if that first run couldn't find anything to score) - see
        {" "}
        <a href="#/agent-card">how Agent Score reads your agent</a> next.
      </p>

      <Callout kind="warn" title="Send real traffic, not your best examples">
        <p>
          Scoring is only as honest as the traces behind it. Point Agent Score at real or
          realistic traffic - including the ordinary failures and edge cases - rather than a
          hand-picked set of your agent's best outputs.
        </p>
      </Callout>
    </>
  );
}
