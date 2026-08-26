# Runbook: Adding an Internal Agent to Agent Score

**Audience:** Tricentis engineers/operators adding a Tricentis-internal agent/service to Agent Score for scoring.
**Status:** Updated 2026-08-26, per a team sync with Lior. The manual, region-split (BetterStack-pull) process below is a stopgap for internal services **outside** AI Workspace — see [Known limitations](#known-limitations--upcoming-changes). **If your agent runs in AI Workspace, skip the manual steps below — ingestion is automatic; see [AI Workspace agents](#ai-workspace-agents-ingest-automatically).**

## AI Workspace agents ingest automatically

Anything built in AI Workspace runs under **Relic service**, and Relic service traces flow into Agent Score already — there is no manual registration step for AI Workspace agents.

- **Tenant matching is automatic.** Agent Score passes through the AI Workspace tenant name **as-is** as part of the trace. If you create a new tenant in AI Workspace and start sending traces from an agent under it, that tenant shows up in Agent Score on its own once traces arrive — nothing to configure or map by hand.
- **Where to find it:** resolved agents land under **Agents** in the Back Office App, grouped under the Relic service the same way any other multi-agent service is (see [Background](#background) below).
- **Session IDs are also automatic.** The OTel stack underlying AI Workspace agents auto-generates a session ID per trace, so session identity is already captured without extra instrumentation (see [session-scoring note](#session-ids--session-based-scoring-in-progress) below).

This is a distinct, simpler path from the manual per-service registration described next, which still applies to internal services that are **not** hosted in AI Workspace.

## Background

For internal services outside AI Workspace, ingestion currently splits by region, because AWS can't peer more than one region to the Agent Score account:

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

- **Region duplication bug (fixed):** the same agent name across two regions previously collapsed into one agent. Fixed; will be structurally resolved when each region gets its own Agent Score system (no cross-region merging needed).
- **The Langfuse → Postgres + S3 data reset has landed.** The migration referenced below as "coming" is done and has been running in production since 2026-08-24 (~250 issues found/fixed during hardening, plus some resolved BetterStack integration hiccups). Anything set up before that date may not have carried over — ping Lior if you need something specific recovered.
- **Internal user onboarding has resumed** (as of this week, 2026-08-26) now that the reset is behind us — no longer paused.
- **Ingest service is being refactored for scale.** The service currently receives millions of spans, ~99.9% of which are discarded as noise. A rogue trace with 5,000+ spans recently caused an out-of-memory crash (a "poison trace") — that specific case is fixed, and Lior is doing a broader refactor to detect poison traces earlier, cut the service's memory footprint, and rely directly on S3 + Postgres (dropping the blob-store hop) so the pipeline can handle ~10x current traffic. Expect ingestion to keep getting more reliable under load over the next few days, not less.
- **Session IDs & session-based scoring (in progress).** Session ID is now captured automatically off the OTel stack for most traces — but so far it looks like nearly every trace maps to exactly one session (no multi-trace sessions observed yet), which may mean bulk/multi-session scoring isn't the right model. This is still being validated over the next couple of days before any scoring-flow design decision is made — don't build session-aggregation logic against this yet.
- **Recommendation:** for non-AI-Workspace internal services, the pull-from-BetterStack approach is still a stopgap until per-region deployments exist — re-verify this runbook against reality if something looks off, since the underlying ingest service is actively changing.
