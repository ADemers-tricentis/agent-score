Subject: Following up on AgentScore

Hi {{First Name}},

I reached out recently about getting {{Company}} into AgentScore. Getting started is much simpler now. Signing in creates your workspace, so no one on our team has to set it up, and a coding agent can wire the traces for you.

Open AgentScore here: https://agent-score.ai.tricentis.com/

1. **Sign in to Tosca Cloud.** Agent Score needs a Tosca Cloud login. If you do not have one yet, [sign up for a Tosca Cloud trial](https://www.tricentis.com/software-testing-tool-trial-demo) first, then sign in with that account.
2. **Your workspace is ready when you sign in.** Signing in with your Tosca Cloud account creates your workspace (a tenant). Everyone signing in from that Tosca Cloud tenant shares it. If your agent runs in AI Workspace, its traces arrive when it runs, with no ingest key, so you can skip the rest of these steps.
3. **Connect your coding agent, then start traces.** In the sidebar, open **Integrations**. Copy the server URL from **Connect a coding agent (MCP)** and paste it whole. The part after the `?` names your tenant. Add it in Claude Code, Cursor, Codex, or the Claude apps, and sign in through the browser with your Tosca Cloud account. There is no API key to paste. Then open the project for the agent you want scored and ask:

   ```
   Set this agent up to send its traces to Agent Score. Name it checkout-agent.
   ```

   `checkout-agent` is an example. Use the name you want that agent to keep. Your coding agent creates an ingest key, writes it to an environment file that version control ignores, and sets `OTEL_SERVICE_NAME` to that name. Restart the agent and run it once. Then ask:

   ```
   Use agent-score to check my agent connection.
   ```

   The answer says whether traces for that name arrived in the last hour.
4. **Read your scorecard.** After about 20 traces, scoring starts on its own. Open the agent for a 0-100 score and a ship / review / don't-ship recommendation, with the evidence behind each number.

**Send real traffic.** Send real or realistic traffic, including the ordinary failures. A hand-picked set of best outputs makes a weaker score.

**Wiring the exporter yourself.** If you would rather not use a coding agent, **+ Connect Agent** on the Agents page gives you the exporter config with your real key filled in. Use the `_TRACES_` variables, not the generic `OTEL_EXPORTER_OTLP_ENDPOINT`. The endpoint already ends in `/v1/traces`, and the generic form appends that path a second time.

If you want a walkthrough, pick a time here and we'll go through it together: https://scheduler.zoom.us/andrew-demers/agentscore-overview

Questions at any point, reply to this email.

Andrew Demers
AgentScore Lead PM | Tricentis
