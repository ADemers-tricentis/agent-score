## September 10, 2026 Update

### Talk to Agent Score directly
- The chat assistant is now full-featured - ask about your agents' scores and evidence, and act on what you find, all from one conversation instead of clicking through screens.

### Ask how to make your agent better
- Every scored agent can now generate improvement advice on demand - ask what's holding your score back and get recommendations that trace straight back to the evaluation that drove them.

### Freshly calibrated profiles
- All seven agent profiles got a calibration pass this week for more accurate pass thresholds - if a score moved slightly without your agent's behavior changing, this is likely why.

### More agents to try Agent Score against
- The simulated-agent library grew to 34 ready-to-run agents, so you can see Agent Score in action before connecting your own - and you can now send and score a whole batch of them at once instead of one at a time.

## September 9, 2026 Update

### More accurate run status when scoring can't complete
- If every judge call fails before producing a single verdict (for example, during a provider outage), the run now shows as failed instead of a misleading partial - so you know to retry instead of trusting a result that never actually scored anything.

### Cleaner run results and advice pages
- Scoring-run pages no longer repeat the same evaluation data across tabs - your run's overview and interaction results now show it once, in one place.
- Advice status is now accurate end to end - it no longer looks "ready" before it's actually finished, and it recovers cleanly if a request gets interrupted instead of losing track of what you asked for.

### Coming next
- A conversational assistant for asking questions about your agent's scores directly - built and through internal safety review, launch timing still to be decided
- Score-improvement recommendations that trace back to exactly which score drove them - in development

## September 8, 2026 Update

### More precise agent profiles
- Agent Score now matches your agent against seven specific profiles - Grounded Answerer, Summarizer, Tool Caller, Task Agent, Conversational Assistant, Policy Guardrail, and General Answerer - instead of a smaller, harder-to-fit set. A tighter match means the dimensions and evaluations scoring you are the ones that actually apply to what your agent does.

### Faster, more reliable scoring runs
- Scoring, advisor, and fit runs can now execute in parallel instead of queuing one at a time, so scores come back faster.
- A single trace that can't produce a verdict no longer holds up the rest of the batch - the other traces in the same run keep scoring instead of getting marked incomplete alongside it.
- Turning off automatic scoring for an agent now actually stops it - previously a scheduled re-score could still run (and get billed) even after you'd switched autonomous scoring off.

### Coming next
- A conversational assistant for asking questions about your agent's scores directly - built and through internal safety review, launch timing still to be decided
- Score-improvement recommendations that trace back to exactly which score drove them - in development

## September 4, 2026 Update

### Behind the scenes: scores now hold up no matter how big the trace gets
More progress on the new judge from last update - this closes the two biggest risks to trusting it on real-world traces.
- Scoring no longer has to read an entire trace end to end - it now pulls only the specific evidence it needs to judge each step, so trace size stops being a limiting factor. In one test, a 36 MB trace needed only about 0.2% of its data to reach the correct score.
- Scores are also more consistent run to run. Newer models reason better but can vary slightly between repeated evaluations, so we moved everything that doesn't require judgment out of the model and into dedicated, deterministic checks - leaving the model to focus only on the reasoning that actually needs it.
- Still nothing customer-facing changes yet - the new judge is running side by side with today's scoring engine until validation finishes.

### Faster scores when a trace's root step goes missing
- If a trace's root span never made it in (a truncated or split capture), it used to sit unscored for up to 24 hours before we gave up and forced a result. It now completes within minutes of us detecting the gap, so you see a score much sooner.

### Coming next
- A conversational assistant for asking questions about your agent's scores directly - built and through internal safety review, launch timing still to be decided
- Score-improvement recommendations that trace back to exactly which score drove them - in development

## September 2, 2026 Update

### Behind the scenes: a new judge is coming online
Nothing here changes what you see today - this is the engineering underneath the next wave of scoring improvements.
- Scoring is moving to a new judge that grades directly against the evidence it read, checking specific facts (like the arguments a tool call used, or what a step actually returned) with dedicated verification tools instead of relying on memory
- The new judge is running in parallel with today's scoring engine while we validate it side by side - nothing customer-facing changes until that validation finishes and the old engine is retired
- Fixed a scoring failure mode where certain models rejected a request outright instead of completing it

### Back office: faster manual scoring for our team
- Our team can now score a single trace on demand and see every eval's verdict on one page, instead of waiting on a batch pass - speeds up how quickly we can chase down a customer-reported scoring question

## August 27, 2026 Update

### Better visibility into what powers your scores
We built out an internal LLM catalog so we always know exactly which model handled which task, and what it costs - this keeps routing smart and pricing honest as new models come out.
- Every model we might call, current or retired, now carries real, effective-dated pricing on file, including cache read/write rates
- Fixed a bug that double-billed OpenAI cached tokens - they're already counted inside the total input tokens, but we were also charging them again as a separate cache cost, so the accounting behind our routing and pricing decisions is now accurate
- A new usage and spend report lets our team see what each tenant costs to run, so we can keep AgentScore priced fairly as usage grows

### Faster, sturdier trace pipeline
- Rebuilt how incoming traces get assembled, trimming the delay between when your agent runs and when its trace is ready to score
- Fixed a bug where a single unusual span type could throw out an entire trace instead of just that one piece - so more of what your agent actually did makes it into your score

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

