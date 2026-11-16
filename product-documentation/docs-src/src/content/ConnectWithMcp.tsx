import { Callout, CodeBlock, Dek, Eyebrow, Screenshot, Step, StepList } from "../components/PageChrome";
import integrationsCodingAssistants from "../assets/integrations-coding-assistants.png";
import codingAgentPermissions from "../assets/coding-agent-permissions.png";

export default function ConnectWithMcp() {
  return (
    <>
      <Eyebrow>Get Started</Eyebrow>
      <h1>Connect with MCP</h1>
      <Dek>
        Set Agent Score up from the coding agent you already use. It signs in as you. In the
        project you have open, you name the agent you want scored, and it writes the ingest key
        and starts the traces. After that, you ask it for the same jobs the rest of this guide
        describes.
      </Dek>
      <p>
        The short path is the <a href="#/quick-start">Quick start</a>: add the server, name the
        agent, and check that traces arrived. This page is the setup for each client.
      </p>

      <h2>Open Integrations</h2>
      <p>
        In the sidebar, open <strong>Integrations</strong>. It has two tabs.{" "}
        <strong>Coding assistants</strong> opens on the <strong>Connect a coding agent</strong>{" "}
        card, with a setup for <strong>Claude Code</strong>, <strong>Cursor</strong>,{" "}
        <strong>Codex</strong>, the <strong>Claude apps</strong>, and{" "}
        <strong>Another client</strong> that can sign in through the browser. The card names the
        tenant and region you are signed in to. <strong>Trace ingestion</strong> is where your
        ingest keys live.
      </p>
      <Screenshot
        src={integrationsCodingAssistants}
        alt="The Integrations page on the Coding assistants tab, with a Trace ingestion tab beside it, a Manage permissions button, and the Connect a coding agent card showing the signed-in tenant and region, tabs for Claude Code, Cursor, Codex, Claude apps and Another client, and step 1 with the claude mcp add command and the server URL filled in"
        caption="Integrations, Coding assistants. Each client tab has the setup with your server URL already filled in."
      />
      <p>
        Each client's tab already has your server URL in it. To see the URL on its own, open{" "}
        <strong>Connection details</strong> at the bottom of the card. Paste the URL whole. The
        part after the <code>?</code> names your tenant and product. A client that drops it cannot
        sign in. There is no API key, token, header, or client ID to add. The client registers
        itself, and you sign in with your Tosca Cloud account in the browser.
      </p>
      <p>
        Each tenant has its own URL. The client acts as you, in that tenant only. To connect
        another tenant, sign in to it on Integrations and copy that tenant's URL.
      </p>

      <h2>Add it, sign in, then send traces</h2>
      <p>
        Pick your client on the card. The tab has the exact command or file, with your URL already
        filled in. Every client follows the same three steps.
      </p>
      <StepList>
        <Step title="Add the server">
          <ul>
            <li>
              <strong>Claude Code.</strong> Run the command from the tab in your project folder.
              By default it adds Agent Score for you, in this project only. To change who gets
              it, open <strong>Other setup options</strong> and pick under <strong>Who should get
              it?</strong>: only you in this project, everyone working in this project, or only
              you in every project. For everyone in the project, the tab writes a{" "}
              <code>.mcp.json</code> you commit. Each teammate approves the server once and signs
              in as themselves.
            </li>
            <li>
              <strong>Cursor.</strong> Use Add to Cursor, or write the <code>.cursor/mcp.json</code>{" "}
              entry the tab shows, for this project or for every project.
            </li>
            <li>
              <strong>Codex.</strong> One configuration covers the ChatGPT desktop app, the IDE
              extension, and the CLI.
            </li>
            <li>
              <strong>Claude apps.</strong> Add a custom connector named Agent Score and leave the
              OAuth client ID and secret empty. On Team and Enterprise plans, an owner adds it
              once in Organization settings, and members click Connect.
            </li>
            <li>
              <strong>Another client.</strong> Use Streamable HTTP, which some clients call HTTP
              or remote, and a localhost callback. A client that insists on its own client ID
              cannot connect.
            </li>
          </ul>
        </Step>
        <Step title="Sign in">
          <p>
            Your browser opens Agent Score. Sign in to Tosca Cloud if asked, check the request,
            and click Allow. Then finish in the client you added.
          </p>
          <ul>
            <li>
              <strong>Claude Code.</strong> Run <code>/mcp</code>, choose <strong>agent-score</strong>,
              then <strong>Authenticate</strong>. Or run <code>claude mcp login agent-score</code> in
              a terminal.
            </li>
            <li>
              <strong>Cursor.</strong> Open <strong>Customize</strong>, go to <strong>MCP</strong>,
              and sign in on agent-score.
            </li>
            <li>
              <strong>Codex.</strong> Click <strong>Authenticate</strong> beside agent-score, then
              start a new session.
            </li>
            <li>
              <strong>Claude apps.</strong> Click <strong>Connect</strong> on the connector. In a
              chat, turn Agent Score on under <strong>Connectors</strong>.
            </li>
          </ul>
        </Step>
        <Step title="Send this agent's traces">
          <p>Open the project for the agent you want scored, and ask:</p>
          <CodeBlock>Set this agent up to send its traces to Agent Score. Name it checkout-agent.</CodeBlock>
          <p>
            Use a name you want that agent to keep. <code>checkout-agent</code> above is an
            example. The coding agent creates an ingest key, writes the exporter settings into an
            environment file that version control ignores, and sets <code>OTEL_SERVICE_NAME</code>{" "}
            to that name. Agent Score files the traces under it. Restart the agent and run it
            once.
          </p>
          <p>Then ask:</p>
          <CodeBlock>Use agent-score to check my agent connection.</CodeBlock>
          <p>
            The answer lists your ingest keys and whether traces for that name arrived in the
            last hour. Scoring starts on its own after about 20 traces. An agent that already
            runs in AI Workspace sends traces when it runs, with no ingest key.
          </p>
        </Step>
      </StepList>
      <Callout kind="tip" title="The ingest key is shown once">
        <p>
          Have the agent write the key to an environment file that version control ignores. Keep
          it out of source, chat, and logs. If that reply is lost, rotate the key on{" "}
          <strong>Integrations</strong> → <strong>Trace ingestion</strong>. The old secret cannot
          be shown again.
        </p>
      </Callout>

      <h2>What you can ask for</h2>
      <p>
        The same connection covers the rest of Agent Score. Ask in a sentence.
      </p>
      <ul>
        <li>Has this agent connected, and are traces arriving?</li>
        <li>How is this agent scoring, and what is the weakest part?</li>
        <li>Score this agent now.</li>
        <li>Why did this trace fail?</li>
        <li>What should I change, based on the latest scores?</li>
        <li>I changed the agent. Score the traces from the change onward and compare.</li>
        <li>Write an eval for this failure, try it on a few traces, and keep it as a draft.</li>
      </ul>
      <p>
        Those jobs are the same ones in <a href="#/connect-your-agent">Connect Your Agent</a>,{" "}
        <a href="#/scorecard">Reading Your Scorecard</a>,{" "}
        <a href="#/improve">Improve This Agent</a>, and{" "}
        <a href="#/custom-evals">Building Your Own Evals</a>. The coding agent does them in the
        project, instead of you clicking through the app.{" "}
        <a href="#/improve">Improve This Agent</a> walks through the loop from your coding agent,
        from the weakest eval to comparing a change. Every prompt, guide and tool, with the switch
        each one needs, is on <a href="#/mcp-tools">MCP Tools Reference</a>.
      </p>
      <Callout kind="warn" title="A change takes effect when you ask">
        <p>
          Your coding agent acts as you. Starting a scoring run, publishing an eval or a profile,
          revoking an ingest key, or deleting an agent happens immediately. Ask only for a change
          you want made.
        </p>
      </Callout>

      <h2>Choose what your coding agent can do</h2>
      <p>
        On <strong>Integrations</strong>, click <strong>Manage permissions</strong>. The
        switches under <strong>What your coding agents can do</strong> apply to every coding
        agent you connect in that tenant. Each switch covers one group of jobs:
      </p>
      <ul>
        <li>
          <strong>Read</strong> - scores, runs, traces, agents, the overview, and the catalog.
        </li>
        <li>
          <strong>Change</strong> - labels, revisions, and catalog drafts.
        </li>
        <li>
          <strong>Spend credits</strong> - scoring, re-fitting a profile, previews, advice, and
          settings or profile changes that start scoring.
        </li>
        <li>
          <strong>Delete &amp; credentials</strong> - deleting or deactivating agents, creating
          or revoking ingest keys, and publishing catalog items.
        </li>
        <li>
          <strong>Prompts &amp; guides</strong> - the prompts and guides your coding agent can
          read.
        </li>
      </ul>
      <p>
        <strong>Turn off write actions</strong> turns off Change, Spend credits, and Delete &amp;
        credentials in one click. A switch saves when you flip it. Turning something off applies
        at once. Turning something on shows up after you reconnect your coding agent.{" "}
        <a href="#/mcp-tools">MCP Tools Reference</a> lists which switch each tool needs.
      </p>
      <Screenshot
        src={codingAgentPermissions}
        alt="The Coding assistant permissions page, with the management tenant, a Turn off write actions button, switches for Read, Change, Spend credits, Delete & credentials, and Prompts & guides, all on, and a Stop all my coding agents switch at the bottom"
        caption="Manage permissions. Each switch turns one group of jobs on or off for every coding agent you connect."
      />
      <Callout kind="warn" title="If a sign-in may have leaked">
        <p>
          Turn on <strong>Stop all my coding agents</strong>. Every client you connected is
          refused at once, and new sign-ins are refused, until you turn it off again.
        </p>
      </Callout>

      <h2>If sign-in fails</h2>
      <p>
        Start it again from the client. A sign-in has to finish in the browser tab that opened
        it, within ten minutes, and it works once. A failed attempt cannot be resumed.
      </p>
      <ul>
        <li>
          The client asks you to authenticate, or shows 401. You have not signed in yet, or the
          session expired. Repeat the sign-in step for that client.
        </li>
        <li>
          The client says to start the sign-in again, or that this sign-in can't be finished.
          Start over from the client and leave the browser tab open until you are back in the
          client.
        </li>
        <li>
          The client reports an invalid redirect, or cannot register. Use one of the clients on
          the card. Another client has to sign in through a localhost callback.
        </li>
        <li>
          Claude says it could not reach the MCP server. The Claude apps connect from Anthropic's
          network, not from your computer. Check that the URL was pasted whole. If it was, contact
          your Tricentis contact. The connection from Anthropic's network may be blocked.
        </li>
        <li>
          Your coding agent can't see a tool. The group that holds it may be off, for you or for
          your organization. Check <strong>Manage permissions</strong>. A group you turn on shows
          up only after you reconnect your coding agent.
        </li>
        <li>
          Signing out of Agent Score does not disconnect a client. Each client keeps its own
          sign-in. Disconnect it there: <code>claude mcp logout agent-score</code> or{" "}
          <code>/mcp</code> in Claude Code, Customize then MCP in Cursor (Cursor's cloud agents
          sign in separately, so sign out on the server's Cloud row too), the connector settings
          in the Claude apps, or <code>codex mcp logout agent-score</code> for Codex. To end the
          sign-in everywhere at once, ask your Tosca Cloud administrator to end your sessions.
        </li>
      </ul>

      <p>
        Once traces are flowing,{" "}
        <a href="#/connect-your-agent">Connect Your Agent</a> covers how Agent Score recognizes
        the agent and when the first score runs.
      </p>
    </>
  );
}
