# Stimulation: What We Should Build, and the Market Behind It

_Draft, 2026-10-12. Requirements come from the 2026-10-12 meeting notes (`docs/updates/2026-10-12 Update.md`). Market facts come from web search and are marked where unverified. Builds on `arato-vs-agentscore-teardown.md` and `competitive-analysis-report.md`; those are not repeated here._

"Stimulation" means injecting inputs to drive an agent and generate load for evaluation. It does not mock the agent's results.

# Part 1: What we should build

## Recommendation

Do not buy, and do not try to match Arato. Build a thin, production-grounded slice that only AgentScore can build well, and borrow open-source parts for everything generic.

**First slice (one engineer, a few weeks):**

1. **Scenario bank seeded from production traces.** Mine AgentScore's existing trace data into scenario seeds (user goal, context, failure class), with sampling weighted toward routine flows and known failure categories. This covers the "grades" problem and is the part competitors cannot copy without our trace data.
2. **A small curated "gates" library.** About 20-30 negative scenarios with 0% tolerance, in the categories the team already knows (GDPR, EU AI Act, HIPAA, PII, minors). Each is tagged with the rule it tests. Start with the categories that can be defended, and add reviewers later.
3. **Text-first runner.** A service that plays the user against the agent under test (chat, HTTP API, MCP, agent-to-agent), tags the traffic, and lets the agent's traces flow back into AgentScore to be graded as usual. The loop closes with no new scoring work.
4. **Three front doors on one engine:** a REST API, a thin CLI, and MCP tools. See "How a test executes" below.

**Do not build yet:** a browser-driving persona farm at scale, voice, a prompt/model experiment studio, or a stimulation vendor purchase.

## What AgentScore needs (from the meeting)

1. **Grades:** benchmarks grounded in real production usage.
2. **Gates:** scenarios that should never appear in production (for example a 12-year-old asking for an insurance quote), with 0% tolerance and negative testing.
3. Works on agents **not built in Claude or Cursor**, including agent-to-agent and MCP topologies.
4. Any driver is acceptable (Playwright was named); the depth is in what the agent is told to do.
5. Fits a **one-to-two engineer** team with a contained domain.
6. Must not attach to ATA, ADA, or Exploratory.
7. Gap: domain knowledge for the long tail of risk and regulatory scenarios. A reviewer such as an AI safety officer is wanted, and a customer coalition is proposed.

## How a test executes

### The shape

One engine, three front doors:

```
                 REST API  <-- source of truth (create run, poll, fetch results)
                    ^
        +-----------+-----------+
        |           |           |
      CLI        MCP tools    UI (later)
   (CI, local)  (coding agents)
```

- **API first.** A run is a resource: `POST /stimulation/runs` with a target, a scenario set (a bank slice, a gates pack, or ad hoc), and limits (turns, budget). It returns a run id, and results are fetched by id. Everything else is a client of this.
- **CLI is a thin wrapper.** `agentscore stimulate --target <url> --pack gates-gdpr` for CI pipelines and local dev. It matters for targets on localhost or behind a firewall, where a hosted runner cannot reach the agent. The same engine runs locally in a container.
- **MCP tools are the coding-agent front door.** Something like `run_stimulation` and `get_stimulation_results`. The coding agent kicks off a run against the agent it just changed and gets back error classes, not answers, consistent with the MCP PRD's direction. These tools are proposed here and are not in `prd-agentscore-mcp.md` yet.

Recommendation: ship API and CLI first, MCP tools right after (they are a few lines over the API). Skip a UI until beta users ask.

### The execution loop

1. **Select.** Pick scenarios from the bank or a gates pack. A scenario is: persona, goal, opening input, success criteria, and for gates the rule it tests plus a 0% tolerance flag.
2. **Drive.** A "stimulator" LLM plays the user. It reads the scenario, sends the opening input through a target adapter, reads the reply, and continues for N turns or until the goal ends. Gates scenarios are deliberately adversarial; grades scenarios replay realistic flows.
3. **Tag.** Every request carries a run id and scenario id (HTTP header plus OTel baggage), so the agent's spans can be tied to the run and kept out of production dashboards.
4. **Collect.** The agent emits traces to AgentScore through the existing OTel ingest as it does today. Fallback for agents with no telemetry: the runner records the transcript and submits it as a trace itself, so the agent needs no changes to be tested.
5. **Grade.** Existing scoring runs on the traces. Gates add a deterministic layer on top (any violation of a 0% scenario fails the run regardless of the score).
6. **Report.** Run summary: pass/fail per scenario, gate violations first, error classes, and links to traces.

### Target adapters

The adapter is the only part that varies per agent. Build in this order:

| Order | Adapter | Covers | Notes |
| --- | --- | --- | --- |
| 1 | HTTP/chat API (including OpenAI-compatible and SSE streaming) | Most deployed chat agents | Cheapest and most reliable |
| 2 | MCP client | Agents exposed as MCP servers | Fits the agent-to-agent lane |
| 3 | Agent-to-agent protocol (A2A or similar) | Multi-agent topologies | Arato's stated blind spot; check protocol maturity first |
| 4 | Browser driver (Playwright, or Stagehand/Browser Use for model-driven) | UI-only agents | Slowest and most brittle, defer until a customer needs it |

Keep the adapter interface small (`send(input) -> reply`, plus optional `reset()`), so anything can plug in, including a third-party driver.

### Can we use AIDA?

Possibly, but I could not confirm what it can do. The only description in this repo is in `docs/go to market/agentscore-labs-graduation-plan.md`: a sibling Labs project that is "a tool a user operates to complete a task," which cleared the Ignite to Activate review. Nothing there says whether it can be driven programmatically or pointed at a third-party agent.

How it would fit, if it can take instructions and operate an app or agent UI:

- **Good fit:** as adapter 4, the browser/UI driver. That is where we would otherwise buy or wire up Playwright, and the meeting said any driver is acceptable.
- **Poor fit for the core:** the stimulator brain, scenario bank, tagging and grading are AgentScore-specific, and an API/MCP runner does not need a UI operator.
- **Risks to check:** the meeting said not to attach this to ATA, ADA, or Exploratory, and AIDA may sit too close to that family. It would also couple our roadmap to another Labs project's release and access model.

Suggested path: design the adapter interface so AIDA can be dropped in later, build adapters 1 and 2 ourselves, and ask the AIDA team whether it exposes an API or CLI and can run headless. That answer decides whether adapter 4 is "use AIDA" or "use Playwright."

## How it applies to AgentScore

- **Grades are our home turf.** Trace-to-test is a recognized pattern (Arthur: production failures make the strongest regression tests; Label Studio: start around 50 traces; Microsoft: trace-based and synthetic generation are complementary). We already hold the traces and the grading engine, so the scenario bank is mostly a selection and conversion layer on top.
- **Gates need synthetic generation plus expert review.** This is where the market is thinnest and where users' domain-knowledge gap bites. Keep the first library small and traceable to rules.
- **The loop closes inside AgentScore.** Stimulation generates traffic, the agent's traces come back, and AgentScore grades them. The existing teardown framed this as "Arato manufactures the test, AgentScore grades the exam." Owning both halves removes the integration seam competitors have.
- **Agent-to-agent is a differentiator.** Arato's stated blind spot is our core lane. A text and API runner (not a browser) fits MCP and agent-to-agent agents natively.
- **Risk to manage:** the existing competitive report flags that buyers may consolidate "test + grade." Raindrop and Maxim already combine them. Speed matters more than depth on the first slice.

## Buy vs clean-room

- **Buy (Arato-class):** David estimated roughly $10M for a company at about $1M ARR, and buying likely means moving onto their platform. Those figures are David's estimate and are unverified here. Arato also only fits conversational surfaces, so it would not cover agent-to-agent, which is a core need. Verdict: not justified now.
- **Clean-room the whole thing:** the persona-farm half (thousands of browser-driven personas, session replay, video evidence) is the expensive, generic part. David's bar was good enough in front of more people, not better than Arato. Verdict: not yet. Revisit once the first slice shows demand.
- **Recommended:** clean-room only the differentiated pieces (production-grounded bank, gates library, runner and MCP delivery) and reuse open-source parts (LangWatch Scenario for the user-simulator loop, Playwright for the browser adapter, garak or PyRIT attack sets for gates).

## Open questions

- **AIDA:** Can it be driven by API or CLI, and can it run headless against a third-party agent? Is it close enough to ATA/ADA/Exploratory to violate the "do not attach" rule? Would depending on it couple our roadmap to another Labs project? The answer decides whether the browser/UI adapter is "use AIDA" or "use Playwright." Ask the AIDA team.
- Where does the runner live for the first beta customers: hosted only, or do some need the local CLI because their agents are not reachable from our cloud?
- Is a text and API runner enough for the first beta customers, or do some require UI driving (Tosca-style)? Customer sessions (Merito, L'Oreal, Meta) may answer this.
- Who reviews gates scenarios before the customer coalition exists?
- Can production traces be used to seed scenarios under the AI Workspace consent and legal opt-in work in progress? Trace use for scenario generation may need its own consent language.
- Who owns the first slice if Tim's research (action item 6) points elsewhere? Sync with Tim before building.

# Part 2: Market research

## Where the market is

Four clusters, scored against the needs above.

| Cluster | Players (examples) | Strength | Fit to our needs |
| --- | --- | --- | --- |
| Synthetic-user simulation platforms | Arato, Maxim, Coval, Hamming, Cekura, Bluejay | Persona-driven multi-turn conversations at scale, mostly chat and voice. Several are voice-focused | Covers generation, but not production grounding as a core idea, and not agent-to-agent. Arato's rep said agent-to-agent flows are explicitly not a fit (demo, 2026-09-08) |
| Open-source scenario and red-team tools | LangWatch Scenario, Promptfoo, garak, PyRIT, DeepTeam, Inspect | Free, CI-friendly, attack libraries (multi-turn strategies, 40+ to 120+ probes depending on tool) | Good building blocks for gates. Generic attack coverage, not regulatory or business-context scenarios |
| Production-replay and trace-to-test | Raindrop Simulations, Snorkel, Arthur, Agenta, Databricks, Microsoft Foundry, Label Studio | Turn production traces and failures into regression sets and replayable environments | Closest to the "grades" half. Raindrop replays production traffic against a proposed change. Vendors agree human review is still needed |
| Environment and world-model simulation | Patronus ("digital world models" of websites and internal systems) | Replicas of sites and systems to stress-test agents, mainly for frontier labs, software engineering and finance | Different buyer (labs), so likely not our market. Useful as a signal of where money is going |

**Driver layer:** Playwright is the deterministic, low-cost baseline. Stagehand (open source, built on Playwright) and Browser Use let the model drive the browser. Expect reads a git diff and generates a Playwright plan ([comparison](https://bug0.com/blog/expect-vs-agent-browser-vs-stagehand-vs-passmark)). Benchmark claims in these sources come from vendors.

**Open-source specifics:** LangWatch Scenario is Apache-2.0, on PyPI and npm, and uses a user-simulator, agent-under-test and judge triangle that runs in pytest, vitest and jest ([LangWatch](https://langwatch.ai/blog/intro-to-scenario)). Cloud pricing is inconsistent across sources, so unverified. Reports say OpenAI acquired Promptfoo in March 2026, with the core still MIT-licensed. That needs a primary source.

**The regulatory gap is real.** Searches found no mature commercial tool that generates age-banded or rule-mapped compliance scenarios. A student project maps chatbot probes to EU AI Act articles ([example](https://showcase.itcarlow.ie/C00295958/index.html)). Minors-specific rules (the EU KIDS Act proposal, COM(2026) 681) are still a proposal, one analyst estimate puts application no earlier than 2028, and one vendor blog wrongly calls it adopted ([actuia](https://www.actuia.com/en/news/eu-kids-act-brussels-proposes-limiting-chatbot-memory-for-minors/)). A gates library is both unserved and a moving target, so it should be versioned and sourced to specific rules.

## Sources

Web: links inline above. Search-based comparison blogs were mostly vendor-written, so treat rankings as indicative.
Internal: `docs/updates/2026-10-12 Update.md`, `docs/research/arato-vs-agentscore-teardown.md`, `docs/research/competitive-analysis-report.md`, `docs/go to market/agentscore-labs-graduation-plan.md`.
