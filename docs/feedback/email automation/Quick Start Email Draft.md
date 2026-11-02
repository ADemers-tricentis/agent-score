Subject: Getting started with AgentScore

Hi {{First Name}},

You can get a first score from an agent you already run. Open AgentScore here: https://agent-score.ai.tricentis.com/

1. **Sign in to Tosca Cloud.** Agent Score needs a Tosca Cloud login. If you do not have one yet, [sign up for a Tosca Cloud trial](https://www.tricentis.com/software-testing-tool-trial-demo) first, then sign in with that account. Agent Score is currently unavailable for SAP tenants and for organizations that have selected the "Block AI" flag.
2. **Your workspace is ready when you sign in.** Signing in with your Tosca Cloud account creates your workspace (a tenant). Everyone signing in from that Tosca Cloud tenant shares it. If your agent runs in AI Workspace, skip the ingest key and the exporter settings and go to step 5.
3. **Create an ingest key.** Open **Integrations** in the sidebar and create a new key. It looks like `tk_...` and belongs to one tenant.
4. **Point your agent's OpenTelemetry export at Agent Score.** Add these two variables to the exporter your agent already uses. **+ Connect Agent** on the Agents page gives you this config with your real key filled in.

   ```
   OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=<your ingest endpoint>/external/otel/v1/traces
   OTEL_EXPORTER_OTLP_TRACES_HEADERS=Authorization=Bearer <your tk_... ingest key>
   ```

5. **Run your agent.** Use it the way you normally do. It shows up on the Agents page on its own, first as **Setting up**, then **Learning your agent**, with a live count of traces received.
6. **Read your scorecard.** After **20 traces**, scoring starts on its own. Open the agent for a 0-100 score and a ship / review / don't-ship recommendation, with the evidence behind each number.

**Use the `_TRACES_` variables.** Use `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` and `OTEL_EXPORTER_OTLP_TRACES_HEADERS`, not the generic `OTEL_EXPORTER_OTLP_ENDPOINT`. The endpoint above already ends in `/v1/traces`, and the generic form appends that path a second time.

**Send real traffic.** Scoring is only as honest as the traces behind it. Send real or realistic traffic, including the ordinary failures, not a hand-picked set of best outputs.

If you want a walkthrough, pick a time here and we'll go through it together: https://scheduler.zoom.us/andrew-demers/agentscore-overview

Questions at any point, reply to this email.

Andrew Demers
AgentScore Lead PM | Tricentis
