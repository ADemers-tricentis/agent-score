# Runbook: Adding an Internal Agent to Agent Score

**Audience:** Tricentis engineers/operators adding a Tricentis-internal agent/service to Agent Score for scoring.
**Status:** Reflects the *current* (manual, region-split) ingestion process as of 2026-08-20, per Lior. This is a stopgap — see [Known limitations](#known-limitations--upcoming-changes) before investing heavily in new setup.

## Background

Ingestion currently splits by region, because AWS can't peer more than one region to the Agent Score account:

- **US-East** — an SRE-built collector forwards traces to both BetterStack and Agent Score directly (live push).
- **Everywhere else** (EU, APAC, etc.) — no direct connection is possible. Agent Score instead **pulls from BetterStack's API** on a schedule and simulates ingestion. This is a batch/poll job, not a live stream.

Under either path, agents are resolved from trace content: a **service name** (the container/deployment name, e.g. `relic-service`, `ai-workspace`, `autonomous-service`) is the top-level grouping, and individual **agents** are derived underneath it from whatever agent-run signal appears in the traces. One service can contain multiple distinct agents (e.g. `relic-service` has several) or just one (`autonomous-service` has one).

## Steps

1. **Identify the service name.**
   Find the exact service/container name the target agent's deployment reports in its traces. This is usually the deployment/container name, not the agent's own name. The service name can be found in [Better Stack](https://telemetry.betterstack.com/team/t326687/services).
   - If you already know it (visible in BetterStack as a service), skip to step 2.
   - If you don't know it, ask the engineers who built that service what name it sends as `service.name` — don't guess. 
      - Alternatively, find the service name under Sources > Services > Env > Region > Service

2. **Register the service name on the streaming page in the Back Office App.**
   Add the service name in Agent Score's streaming/ingestion admin page so the pull job knows to look for it in BetterStack:
   Ingestion > Stream > Configuration > Services - OTel service.name.
   Once done, select Save configuration.

3. **Confirm it's being pulled.**
   Agent Score will search BetterStack for traces matching that service name and pull them in. Give it a pull cycle to run, then check that traces are arriving.

4. **Check the resolved agent(s).**
   Once traces are ingested, individual agents are derived from the agent-run signal nested inside that service's traces. Confirm the agent name(s) that show up match what you expect — if the service contains multiple distinct agent runs, each should resolve to its own agent.

5. **If nothing resolves / the wrong thing resolves.**
   This means the service isn't sending an identifiable agent-name signal in a way Agent Score recognizes. Go back to the service's engineers and confirm exactly what name/field they're emitting, then adjust.

## Known limitations / upcoming changes

- **Region duplication bug (fixed):** the same agent name across two regions previously collapsed into one agent. Fixed as of this week; will be structurally resolved when each region gets its own Agent Score system (no cross-region merging needed).
- **A full data reset is coming.** Lior is merging Sohil's Langfuse-replacement work and, once merged, plans to wipe and re-ingest all internal agent data from scratch — expected early-to-mid next week (targeting week of 2026-08-24). Anything set up now may need to be redone after that reset.
- **Internal user onboarding is paused** until after that reset, specifically to avoid doing setup twice.
- **Recommendation:** unless there's an urgent need, hold off adding new internal agents until the reset lands, then re-verify this runbook still matches the process (the pull-from-BetterStack approach is explicitly a stopgap until per-region deployments exist).
