## August 26, 2026 Update

### More of your traces make it to a score
We closed two gaps between "you sent a trace" and "you got a score for it."
- Fixed an ingestion gap that was silently dropping roughly a third of routed runs before they ever reached the trace store - missing traces should now show up
- If our scoring provider has a brief outage, we no longer record a wrong guess as your permanent score - affected runs are retried instead of silently written wrong

### Faster access to your traces, and answers built into the app
- You can now download an agent's raw traces directly from the Traces tab
- Product docs are no longer a separate site - there's now a Docs tab built into the app, so you don't have to leave the product to find an answer
- Fixed a bug that could block a brand-new account from connecting its very first agent

### Coming next: scoring by session, and profiles built for your agent
- Session-based scoring - so a score reflects a whole interaction, not a fragment of one
- Dynamic scoring profiles - a profile built for what your specific agent needs to get right, instead of the closest fit among nine fixed ones

## August 24, 2026 Update

### Faster, cheaper scoring on a new foundation
We've moved off Langfuse and onto our own trace storage (Postgres + S3), purpose-built for how AgentScore actually uses trace data. The switch is complete and running in production.
- Scoring runs faster and uses meaningfully fewer tokens per run
- One less third-party system in the path between your traces and your score
- Historical traces and scores from before the cutover didn't carry over - we're rebuilding history from here forward on the new foundation. If there's a specific past run you need, reach out and we'll see what's recoverable.

## August 18, 2026 Update

### Ingest keys are now self-serve
Create, rotate, or revoke an ingest key yourself from the Integrations page - no more filing a ticket and waiting on the team to rotate one for you.

### Customer-facing docs are live
The first version of the [AgentScore docs site](https://demers-demos.product.tricentis.com/docs/) has shipped - a self-serve reference covering ingestion, dimensions and profiles, the eval catalog, agent cards, and scoring, so prospects and customers can find answers without waiting on us.
- Every core concept has its own page, illustrated with real product screenshots and purpose-built diagrams
- The eval catalog page shows the deterministic-to-LLM-judged spectrum so users can reason about tradeoffs themselves
- Each page ships as a single self-contained build, so it's easy to host, share, or embed anywhere

### A skill that keeps the docs honest, because we're moving too fast for them to keep up by hand
We're shipping fast enough that something drifts between the docs and the real product almost every week. Rather than wait to find out from a customer, we built a skill that walks the live product against the docs site on demand and fixes what's stale in the same pass. It ran end-to-end for the first time today:
- Caught the self-serve ingest-key change above before it could sit undocumented behind stale instructions
- Corrected the agent status states, the OpenTelemetry setup snippet, and the scheduled-scoring constraints so they match exactly what's live today
- Caught a stray screenshot that had quietly been sourced from an internal design prototype instead of the real product, and swapped it for the real thing
- Every finding - including the handful we chose to leave for later - is now tracked in a standing drift log instead of living in someone's head

## August 14, 2026 Update

### Faster path from connect to first score
Alpha (v0.31.2) is live - the full journey from onboarding to a scored run now works end-to-end.
- New users can simulate traces and see a preview score before they have real production data to connect
- Onboarding is simpler and now open to externally-built agents, not just internal Tricentis ones
- Internal Tricentis agents are picked up and scored automatically based on tenant, with zero setup required

### Widening the door for prospects and testers
- The new Shift Sync page gives prospects a self-serve way to engage before a sales conversation
- Beta click-through flow is underway, turning "request access" into a self-service signup
- Demo videos are in production so prospects, including at Transform, can see the value without a live walkthrough

### Coming next: removing the remaining friction
- AIW integration will surface scores automatically for user-created agents, one less setup step for users
- Onboarding is getting easier to start:
    - Plain-language evaluations (e.g., Tool Use: does the agent choose the right tools, use them efficiently, and recover cleanly from a failed call?), so users don't need AI expertise to understand their score
    - Conversational eval building: describe what you're trying to evaluate, and the scoring agent builds the profile for you
    - Skill-based setup: paste instructions into your AI agent and traces start flowing automatically
- Internal teams get their own onboarding materials, so ramping up doesn't require a 1:1 walkthrough
- More demo agents and synthetic traces, so prospects see a demo that matches their own use case

