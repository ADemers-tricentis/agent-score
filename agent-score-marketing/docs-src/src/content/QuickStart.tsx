import { Callout, CodeBlock, Dek, Eyebrow, Step, StepList } from "../components/PageChrome";

export default function QuickStart() {
  return (
    <>
      <Eyebrow>Get Started</Eyebrow>
      <h1>Quick start</h1>
      <Dek>
        Score an agent from the project you already have open. You connect Agent Score to your
        coding agent, name the agent you want scored, and check that its traces arrived.
      </Dek>

      <p>
        Sign in with your Tosca Cloud account. That creates your workspace. No one on the Agent
        Score team has to set it up. If the agent already runs in AI Workspace, you can skip this
        page: its traces arrive when it runs, with no ingest key.
      </p>

      <StepList>
        <Step title="Add Agent Score and sign in">
          <p>
            In the sidebar, open <strong>Integrations</strong>. The card at the top is{" "}
            <strong>Connect a coding agent (MCP)</strong>. Copy the server URL whole. The part
            after the <code>?</code> names your tenant. A client that drops it cannot sign in.
          </p>
          <p>
            Add that URL in Claude Code, Cursor, Codex, or the Claude apps, then sign in through
            the browser with your Tosca Cloud account. There is no API key to paste.{" "}
            <a href="#/connect-with-mcp">Connect with MCP</a> has the command or file for each
            client, and what to do if sign-in fails.
          </p>
        </Step>
        <Step title="Name the agent and start its traces">
          <p>Open the project for the agent you want scored, and ask:</p>
          <CodeBlock>
            Set this agent up to send its traces to Agent Score. Name it checkout-agent.
          </CodeBlock>
          <p>
            <code>checkout-agent</code> is an example. Use the name you want that agent to keep.
            The coding agent creates an ingest key, writes the exporter settings into an
            environment file that version control ignores, and sets{" "}
            <code>OTEL_SERVICE_NAME</code> to that name. Agent Score files the traces under it.
            Restart the agent and run it once, on a real request.
          </p>
        </Step>
        <Step title="Check that the traces arrived">
          <p>Ask:</p>
          <CodeBlock>Use agent-score to check my agent connection.</CodeBlock>
          <p>
            The answer lists your ingest keys and whether traces for that name arrived in the
            last hour. Scoring starts on its own after about 20 traces. Send real traffic. A
            hand-picked set of best outputs makes a weaker score.
          </p>
        </Step>
      </StepList>

      <Callout kind="tip" title="The ingest key is shown once">
        <p>
          Have the agent write the key to an environment file that version control ignores. Keep
          it out of source, chat, and logs. If that reply is lost, rotate the key on Integrations.
          The old secret cannot be shown again.
        </p>
      </Callout>

      <h2>What to ask next</h2>
      <p>The same connection covers the rest of Agent Score. Ask in a sentence.</p>
      <ul>
        <li>How is this agent scoring, and what is the weakest part?</li>
        <li>Score this agent now.</li>
        <li>Why did this trace fail?</li>
        <li>What should I change, based on the latest scores?</li>
        <li>I changed the agent. Score the traces from the change onward and compare.</li>
      </ul>
      <p>
        <a href="#/connect-your-agent">Connect Your Agent</a> is what happens once traces arrive.{" "}
        <a href="#/scorecard">Reading Your Scorecard</a> is how to read the first score.
      </p>
      <Callout kind="warn" title="A change takes effect when you ask">
        <p>
          Your coding agent acts as you. Starting a scoring run, publishing an eval, or deleting
          an agent happens immediately. Ask only for a change you want made.
        </p>
      </Callout>
    </>
  );
}
