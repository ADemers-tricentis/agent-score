Subject: You're in - the AgentScore beta is open

Hi {{First Name}},

The wait is over. You've seen AgentScore in a demo, and it's finally ready for you to test on your own agents. Welcome to the beta - {{Company}} is one of the first teams getting hands-on access, and we're excited to see what you do with it.

Point AgentScore at an agent running on real traffic and you get a 0-100 score, a ship / review / don't-ship recommendation, and the evidence behind every number. Your feedback during the beta directly shapes what we build next, so tell us what works, what doesn't, and what's missing.

You can access AgentScore here: https://agent-score.ai.tricentis.com/

Here's how to get up and running:

1. **Sign in to Tosca Cloud.** Agent Score requires a Tosca Cloud login. If you do not have one yet, [sign up for a Tosca Cloud trial](https://www.tricentis.com/software-testing-tool-trial-demo) first, then sign in with that account.
2. **Sign in, and your workspace is ready.** Signing in with your Tosca Cloud account creates your workspace (a tenant). No one on the Agent Score team has to set it up. Everyone signing in from that Tosca Cloud tenant shares it. If your agent runs in AI Workspace, no ingest key is needed, so skip to step 4.
3. **Connect your coding agent, then start traces.** In the sidebar, open **Integrations**. Copy the server URL from **Connect a coding agent (MCP)** and paste it whole. The part after the `?` names your tenant. Add it in Claude Code, Cursor, Codex, or the Claude apps, and sign in through the browser with your Tosca Cloud account. There is no API key to paste. Then open the project for the agent you want scored and ask:

   ```
   Set this agent up to send its traces to Agent Score. Name it checkout-agent.
   ```

   `checkout-agent` is an example. Use the name you want that agent to keep. Your coding agent creates an ingest key, writes it to an environment file that version control ignores, and sets `OTEL_SERVICE_NAME` to that name. Restart the agent and run it once. Then ask:

   ```
   Use agent-score to check my agent connection.
   ```

   The answer says whether traces for that name arrived in the last hour.
4. **Run your agent.** Interact with your agent as you normally would. It appears on the Agents page on its own, first as **Setting up**, then **Learning your agent** with a live count of traces received. No per-agent form to fill out.
5. **Read your scorecard.** After **20 traces**, scoring starts automatically. Open the agent to see a 0-100 score and a ship / review / don't-ship recommendation, with the evidence behind every number.

**Wiring the exporter yourself.** If you would rather not use a coding agent, **+ Connect Agent** on the Agents page gives you the exporter config with your real key filled in. Use the `_TRACES_` variables, not the generic `OTEL_EXPORTER_OTLP_ENDPOINT`. The endpoint already ends in `/v1/traces`, and the generic form would append it a second time.

**Send real traffic.** Scoring is only as honest as the traces behind it. Send real or realistic traffic, including the ordinary failures, not a hand-picked set of best outputs.

AgentScore is fully cloud-hosted, so there's nothing to install. If you'd like help with setup, or just want a walkthrough, pick a time here and we'll go through it together: https://scheduler.zoom.us/andrew-demers/agentscore-overview

Any feedback is appreciated, big or small, whether it's a bug, a rough edge, or something you wish it did. Questions at any point, just reply to this email. Looking forward to seeing what you find.

Andrew Demers
AgentScore Lead PM | Tricentis
