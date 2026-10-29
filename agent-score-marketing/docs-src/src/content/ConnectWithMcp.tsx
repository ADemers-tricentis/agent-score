import { Callout, CodeBlock, Dek, Eyebrow, Screenshot, Step, StepList } from "../components/PageChrome";
import mcpConnectCard from "../assets/mcp-connect-card.png";

export default function ConnectWithMcp() {
  return (
    <>
      <Eyebrow>Get Started</Eyebrow>
      <h1>Connect with MCP</h1>
      <Dek>
        Set Agent Score up from the coding agent you already use. It signs in as you, creates the
        ingest key, and checks that traces arrived. After that, you ask it for the same jobs the
        rest of this guide describes.
      </Dek>

      <h2>Open Integrations</h2>
      <p>
        In the sidebar, open <strong>Integrations</strong>. The card at the top is{" "}
        <strong>Connect a coding agent (MCP)</strong>. It shows the server URL for the tenant you
        are signed in to, and a setup for <strong>Claude Code</strong>, <strong>Cursor</strong>,{" "}
        <strong>Codex</strong>, the <strong>Claude apps</strong>, and any other MCP client that
        can sign in through the browser.
      </p>
      <Screenshot
        src={mcpConnectCard}
        alt="The Connect a coding agent card on Integrations, with the MCP server URL, tenant, region, Streamable HTTP transport, browser sign-in, and tabs for Claude Code, Cursor, Codex, Claude apps, and Another client"
        caption="Integrations. Copy the server URL from here. Each tab fills in the setup for that client."
      />
      <p>
        Paste the URL whole. The part after the <code>?</code> names your tenant and product. A
        client that drops it cannot sign in. There is no API key, token, header, or client ID to
        add. The client registers itself, and you sign in with your Tosca Cloud account in the
        browser.
      </p>
      <p>
        Each tenant has its own URL. The client acts as you, in that tenant only. To connect
        another tenant, sign in to it on Integrations and copy that tenant's URL.
      </p>

      <h2>Add it, sign in, then check</h2>
      <p>
        Pick your client on the card. The tab has the exact command or file, with your URL already
        filled in. Every client follows the same three steps.
      </p>
      <StepList>
        <Step title="Add the server">
          Claude Code: run the command from the tab in your project folder. Cursor: use Add to
          Cursor, or write the <code>.cursor/mcp.json</code> entry the tab shows (this project, or
          every project). Codex: one configuration covers the ChatGPT desktop app, the IDE
          extension, and the CLI. The Claude apps: add a custom connector named Agent Score and
          leave the OAuth client ID and secret empty. Another client: Streamable HTTP, which some
          clients call HTTP or remote, and a localhost callback. A client that insists on its own
          client ID cannot connect.
        </Step>
        <Step title="Sign in">
          Your browser opens Agent Score. Sign in to Tosca Cloud if asked, check the request, and
          click Allow. Claude Code: run <code>/mcp</code>, choose <strong>agent-score</strong>,
          then <strong>Authenticate</strong>. Cursor: open <strong>Customize</strong>, go to{" "}
          <strong>MCP</strong>, and sign in on agent-score. Codex: click{" "}
          <strong>Authenticate</strong> beside agent-score, then start a new session. The Claude
          apps: click <strong>Connect</strong> on the connector, and in a chat turn Agent Score on
          under <strong>Connectors</strong>.
        </Step>
        <Step title="Check that it works">
          Ask your coding agent the question below. It answers with your ingest keys and whether
          traces arrived in the last hour. Then ask it to create an ingest key for this project
          and write the exporter settings to the project's env file.
        </Step>
      </StepList>
      <CodeBlock>Use agent-score to check my agent connection.</CodeBlock>
      <Callout kind="tip" title="The ingest key is shown once">
        <p>
          Have the agent write the key to an environment file that version control ignores. Keep
          it out of source, chat, and logs. If that reply is lost, rotate the key on Integrations.
          The old secret cannot be shown again.
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
        project, instead of you clicking through the app.
      </p>
      <Callout kind="warn" title="A change takes effect when you ask">
        <p>
          Your coding agent acts as you. Starting a scoring run, publishing an eval or a profile,
          revoking an ingest key, or deleting an agent happens immediately. Ask only for a change
          you want made.
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
          network, not from your computer. Check that the URL was pasted whole.
        </li>
        <li>
          Signing out of Agent Score does not disconnect a client. Each client keeps its own
          sign-in. Disconnect it there: <code>/mcp</code> in Claude Code, Customize then MCP in
          Cursor, the connector settings in the Claude apps, or{" "}
          <code>codex mcp logout agent-score</code> for Codex.
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
