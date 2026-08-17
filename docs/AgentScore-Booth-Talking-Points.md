# AgentScore — Booth Talking Points
**Tricentis Transform 2026 | For booth staff use**

## What is AgentScore?
- An evaluation layer that grades whether an AI agent is actually doing its job well - correctness, safety, tool use, and more - instead of just whether it's up and responding
- Reads the OpenTelemetry traces an agent is probably already emitting. No proprietary SDK, nothing new to install on the agent itself
- No evals to write up front. Point it at an agent's traces and it figures out which checks apply to that specific agent
- Positions Tricentis as testing not just the code, but the agents doing the work
- Currently in **alpha** (v0.31.2), moving toward a self-service beta

## The One-Sentence Pitch
"Give AgentScore your agent's traces and it tells you if it's actually working - a score, a ship or block verdict, and the exact reason when something breaks - without you writing a single eval first."

## How It Works (Keep It Simple)
- Add a standard OpenTelemetry exporter to your agent - works with LangChain, LangGraph, OpenAI Agents SDK, AutoGen, CrewAI, or a custom loop
- AgentScore reads the traces that flow through and automatically figures out which evals matter for that agent - nothing to configure up front
- After enough traces (roughly 20, fewer for high-traffic agents), it runs a scoring pass: a composite score, an A-through-F grade, and a plain verdict - Ship, Review, or Block
- When something fails, it doesn't stop at a red X - a root-cause pass points to the failing step, attaches a confidence level, and shows the evidence chain
- Meant to surface inside Tosca, qTest, and AI Workspace over time - not a brand-new tool practitioners have to learn (early rollout, not everywhere yet)
- Nothing about the agent's underlying data leaves the customer's control beyond the trace itself - AgentScore reads the same OTel stream a tool like Datadog would, it doesn't reach into the agent's data sources directly

## What Makes It Different
- **Statistical rigor most competitors skip** - confidence intervals and a minimum-sample gate before it issues a confident "ship" verdict, not just a bare score
- **Vendor-neutral via OpenTelemetry** - no proprietary SDK, bolts onto any agent framework already emitting traces
- **Safety override** - one unsafe signal can hard-fail a run regardless of composite score; a strong average can't hide a dangerous failure
- **Six scoring dimensions** - Correctness, Efficiency, Relevance, Safety, Consistency, Tool Use - not one opaque number
- **Root-cause attribution, not just pass/fail** - pinpoints the failing step and what to fix, not just that something broke
- **Meant to meet practitioners where they work** - surfacing inside Tosca/qTest/AI Workspace, not another dashboard to check

## Who It's For
- Engineering or team leads responsible for an agent who need to know if a change made it better or worse (today's primary user)
- Longer term: domain experts who can build an agent but aren't AI engineers and can't write their own evals (e.g. a tester, a subject-matter expert)
- Anyone currently "going on vibes" - hardcoded spot-checks, a homemade LLM-as-judge script, or nothing at all

## Common Questions to Be Ready For
- **"Does it replace Datadog, NeoLoad, or other observability tools?"** No. Those track system telemetry and uptime. AgentScore grades whether the AI itself is doing its job well, reading the same trace stream. Complementary, not a rip-and-replace
- **"Does it generate or run tests?"** No. It grades what already happened. Your test driver (Tosca, scripts, or real traffic) produces the interactions; AgentScore scores them from the traces
- **"Isn't this just an LLM judging another LLM?"** Not purely. It uses deterministic or hybrid checks wherever ground truth exists, reserves LLM-as-judge for the rest, and always attaches a confidence interval plus the safety override - not a bare opinion
- **"Do I need to install an SDK?"** No - just an OpenTelemetry exporter, which most agent frameworks already support
- **"Is it GA?"** Not yet. Currently in active alpha, moving toward a self-service beta signup
- **"Is it on-prem or cloud only?"** Cloud is the initial target and works today. On-prem is in development; self-hosting is under evaluation based on demand
- **"How is it priced?"** Directionally: free seats, free trace ingestion, billed only for a completed scoring run - not finalized, don't quote numbers

## Booth Call to Action
- Direct them to the AgentScore site's **Request access** form - short form, no download today
- Demo videos are in production for Transform so prospects can see the value without a live walkthrough - use one if you have it queued, otherwise walk through the score/verdict/root-cause screenshots
- If they want into the beta or want a technical walkthrough, collect their email and pass it to **Andrew Demers**
- If they're an existing Tricentis customer, flag their interest for AI Workspace - that's the first place scores are expected to surface

**Questions?** Contact Andrew Demers, Lead PM, AgentScore - a.demers@tricentis.com
