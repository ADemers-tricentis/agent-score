Subject: You're in - the AgentScore beta is open

Hi {{First Name}},

The wait is over. You've seen AgentScore in a demo, and it's finally ready for you to test on your own agents. Welcome to the beta - {{Company}} is one of the first teams getting hands-on access, and we're excited to see what you do with it.

Point AgentScore at an agent running on real traffic and you get a 0-100 score, a ship / review / don't-ship recommendation, and the evidence behind every number. Your feedback during the beta directly shapes what we build next, so tell us what works, what doesn't, and what's missing.

You can access AgentScore here: https://agent-score.ai.tricentis.com/

Here's how to get up and running:

1. **Sign in to Tosca Cloud.** Agent Score requires a Tosca Cloud login. If you do not have one yet, [sign up for a Tosca Cloud trial](https://www.tricentis.com/software-testing-tool-trial-demo) first, then sign in with that account.
2. **Get your workspace.** Your workspace (a tenant) is set up by the Agent Score team on your behalf, and cannot be created from the app. Send us your Tosca Cloud tenant name and we will set up your workspace. Everyone signing in from that Tosca Cloud tenant will then have access. If your agent runs in AI Workspace, its tenant is created automatically when the agent's traces are first ingested and no ingest key is needed, so skip to step 5 (you still need us to give you access).
3. **Create an ingest key.** Open **Integrations** in the sidebar and create a new key. It looks like `tk_...` and belongs to exactly one tenant.
4. **Point your agent's OpenTelemetry export at Agent Score.** Add these two variables to the exporter your agent already uses. No new SDK required. **+ Connect Agent** on the Agents page gives you this exact config with your real key filled in.

   ```
   OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=<your ingest endpoint>/external/otel/v1/traces
   OTEL_EXPORTER_OTLP_TRACES_HEADERS=Authorization=Bearer <your tk_... ingest key>
   ```
5. **Run your agent.** Interact with your agent as you normally would. It appears on the Agents page on its own, first as **Setting up**, then **Learning your agent** with a live count of traces received. No per-agent form to fill out.
6. **Read your scorecard.** After **20 traces**, scoring starts automatically. Open the agent to see a 0-100 score and a ship / review / don't-ship recommendation, with the evidence behind every number.

**Use the _TRACES_ variables.** Use the `_TRACES_`-suffixed variables, not the generic `OTEL_EXPORTER_OTLP_ENDPOINT`. The endpoint above already ends in `/v1/traces`, and the generic form would append it a second time.

**Send real traffic.** Scoring is only as honest as the traces behind it. Send real or realistic traffic, including the ordinary failures, not a hand-picked set of best outputs.

AgentScore is fully cloud-hosted, so there's nothing to install. If you'd like help with setup, or just want a walkthrough, pick a time here and we'll go through it together: https://outlook.office.com/bookwithme/user/1886f4bba1704d4e8eb8ea165a20e7ce@tricentis.com/meetingtype/8weBliFkdkau1K4MhueOyQ2?anonymous&ismsaljsauthenabled&ep=mlink

Any feedback is appreciated, big or small, whether it's a bug, a rough edge, or something you wish it did. Questions at any point, just reply to this email. Looking forward to seeing what you find.

Andrew Demers
AgentScore Lead PM | Tricentis
