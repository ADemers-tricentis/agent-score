# AgentScore Frequently Asked Questions

_Compiled from stakeholder Q&A sessions (2026-07-22 and 2026-07-23). Answers reflect current thinking and are subject to change as the beta progresses._

## Product & Positioning

### What is AgentScore?
It answers a question that existing testing doesn't: you may know your tests are good or your code coverage is high, but how do you know the *agent* doing the work is actually good and doing its job well? AgentScore ingests an agent's traces and generates a scoring profile - a collection of evals across six dimensions - to tell you whether the agent is ready to ship, and to flag drift or regressions when you change it. It positions Tricentis as not just testing your code, but also testing the agents that create the code.

### How did this start?
As an "innovation at speed" side project with a single engineer, which is why it hasn't been widely visible until recently. Resourcing is now ramping up as it moves toward a beta program.

### Is this a standalone product or a feature of AI Workspace? How does it fit the platform/portfolio story?
The current plan is to build it as its own thing, then use AI Workspace as the initial surface to "Trojan horse" it into users' hands (faster adoption than onboarding to a brand-new product). Longer term it can graduate into its own product/dashboard, live alongside AI Workspace, or both. The first rollout is not a fully separate standalone product - it lives alongside AI Workspace.

### How does it fit into the Tricentis One story?
There's no confirmed Tricentis One readiness date yet. The approach is to build AgentScore independently for now and, in the spirit of Tricentis One, ensure its results (e.g. a score/grade, possibly actions like triggering a scoring run) can be surfaced there when it's ready. Lior has built a solid API that would support that mapping.

### Is this worth a big announcement?
Not yet - there isn't enough data. Early internal results are promising but progress hit some technical roadblocks. Once we can definitively confirm the insights and quantify agent improvements across dimensions, the plan is an announcement plus demo/webinar sessions (there's a growing interest list) with companion materials.

## Users & Use Cases

### Who is the target user?
Short term: the engineering lead / team lead responsible for the agents being created, so they can see whether a code or parameter change kept the agent the same or better. Longer term the ideal persona is the **domain expert** - someone technical enough to create an agent (or have Claude walk them through it) and excellent in their field (e.g. a tester writing test cases, or a legal expert with a contract-markup agent), but not an AI engineer who could already write their own evals.

### Would a QA person test third-party agents with this, and how?
Because it doesn't require an SDK - just an extra OpenTelemetry exporter - agents can be scored automatically. The vision is that anyone with an agent in AI Workspace gets it scored, then sees proactive suggestions ("your prompt could use tweaking," "this tool call fails a lot, here's why"). It's model- and platform-agnostic, so eventually any agent, anywhere, could plug in.

### Do I have to use AI Workspace to use this?
For the first rollout, yes - that's the imagined starting point. The phases are: (1) anyone creating an agent in AI Workspace, then (2) anyone creating an agent anywhere. If it supports OpenTelemetry (which nearly every agent does), AgentScore can support it.

### Who would be interested initially?
Initially internal customers - anyone responsible for a Tricentis-internal agent. Then external users, following the AI Workspace-first phasing above. Testers, team leads, and anyone managing a set of agents who wants to see how their AI is performing.

### What are people doing today instead of this?
Two categories. AI engineers/experts write their own evals and glue frameworks together. Everyone else does very little - maybe some hardcoded tests, an LLM-as-a-judge watching outputs, or ground-truth comparisons (which are very hard to get for a realistic production agent). Asked how internal teams test agents today, the honest answer is mostly "we're not" - or they're "going on vibes."

## How It Works

### What's the difference between a trace and a scoring run?
A **trace** is a single end-to-end interaction with your agent, capturing the full tool calls and metadata; it's made up of multiple **spans** (e.g. a back-and-forth, or a single tool call). Traces are ingested constantly. A **scoring run** is an occasional analysis over the traces you've collected, producing a composite score. Runs are throttled (vs. scoring every trace) to control cost.

### When does a scoring run happen?
It's configurable and still being calibrated with data - likely options include on version/model change, on a daily/weekly schedule, or on session completion. Constant trace ingestion continues regardless; the run is the periodic evaluation step.

### What does a scoring run actually do?
It analyzes performance across the collected traces. Based on your agent's inputs, outputs, metadata, and tools called, AgentScore automatically selects which evals are applicable to each of the six dimensions and runs them on the relevant traces, then returns a composite score (e.g. 83/100) plus a letter grade and a plain "ready to ship / needs attention" verdict, with a breakdown of why.

### What are the six dimensions?
Correctness, efficiency, relevance, safety, consistency, and tool use - each described in plain English (e.g. correctness = did the agent complete the task correctly; efficiency = did it stay within cost budget). Each dimension has multiple underlying evals.

### What's novel here if the evals already exist?
The individual evals are largely a solved problem and mostly open source. The novel part ("secret sauce") is automatically determining *which* evals apply to a given agent based on its traces and dimensions, then running the right ones and rolling them into a single ready-to-ship score.

### If an agent isn't ready to ship, does it help me find out why?
Yes. Normally two or three evals run; on failure an additional **attribution** pass runs to determine why it failed. It pinpoints the exact trace (e.g. a credential exposure or error), attributes the failure to a cause, and tells you what to fix. You fix it, rerun a scoring run, and confirm it passes.

## Pricing

### How will it be priced?
The hypothesis: seats are free (per-seat pricing discourages adoption) and traces are free (per-trace pricing discourages proper instrumentation). Customers are charged **per scoring run** - i.e. only when they actually get a completed, usable result back.

## Relationship to Other Tools

### Does it replace or interfere with NeoLoad, Datadog, etc.?
No - it's complementary. If a customer is already doing AI monitoring/trace ingestion (e.g. via Datadog), they can take advantage of AgentScore alongside it rather than replacing anything.

## Roadmap & Open Questions

### Is there an AI/agentic component, or is it just dashboards?
Today the prototype and back office have no chat/AI surface. The intended evolution is to run scoring in the background while a user works (e.g. generating test cases via the ATC agent) and proactively surface improvements before the user asks - treating chat as an outdated interaction model. This is seen as further out: keep it in mind, but don't design toward it yet.

### Where do we start building?
Rethink the experience from the beginning rather than productionizing the concept-explainer prototype as-is. The priority is making it accessible to someone who doesn't know what a trace or span is - plain-English explanations of dimensions and evals, and a copy-paste install flow (modeled on Langfuse's GitHub onboarding: paste one command into your LLM and it instruments everything for you). The current back office is engineer- and config-focused and not yet user-friendly.
