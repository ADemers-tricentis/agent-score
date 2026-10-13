# AgentScore competitive docs: review for product

13 October 2026 · Lior Nabat

## Bottom line

The strategy in the three documents is sound. The product facts underneath it are not: about one in three checkable statements about AgentScore is wrong or out of date, and almost every error makes AgentScore look stronger than it is. The documents should not leave the team until those are fixed.

What holds up:

- Arato and AgentScore sit at different points of the lifecycle. Arato creates test traffic; AgentScore grades what an agent actually did. A customer could use both.
- AgentScore's real edge is low-effort onboarding inside the Tricentis ecosystem (AI Workspace agents get graded with no setup) and the automatic choice of what to measure for a given agent.
- Building a small, production-grounded testing capability makes sense. Buying Arato or copying it does not.

What does not hold up:

- Several AgentScore capability counts and features are overstated or no longer true (see next section).
- Three claimed gaps in the market are already filled: regulation-mapped test probes, turning production traces into test scenarios, and suggesting fixes after a failure. Competitors do all three today.
- The simulation proposal underestimates the work and skips two blockers: customer consent for reusing their traces, and keeping test traffic out of real production scores.

This review checked each statement against the current AgentScore code (13 October 2026) and against vendor pages, press releases, and marketplace listings. A second, independent review reached the same conclusions and added the market corrections; its findings are folded in here.

## Claims about AgentScore that need correcting

Every row was checked against the product as it exists today. Use the "What is true" column in any external copy.

| What the documents say | What is true today |
| --- | --- |
| More than 60 built-in evaluations | 39 |
| Four kinds of evaluation, including a decision-tree kind | Three kinds. No decision-tree kind exists |
| Nine ready-made agent profiles | Seven |
| Scores carry pass@k and paired statistical significance | Neither exists. Confidence intervals and comparison to a baseline do exist |
| Agents get an A to F letter grade | No letter grade. The verdict has five bands (ship, ship with a note, review, lean block, block) plus "not enough data" |
| Seven judge models offered via Amazon Bedrock | One default judge model. Inside Tricentis AI Services, judging runs through the shared AI Hub, not Bedrock |
| The scoring engine is the DeepEval library | DeepEval was removed on 2 September 2026. AgentScore uses its own judge |
| Chat assistant and improvement recommendations are built but switched off | Both are live for customers |
| The new judge rollout is incomplete | Completed between 2 and 6 September 2026 |
| Single sign-on is not built | Microsoft Entra sign-in shipped 11 September 2026; customer sign-in via Okta exists. SAML is still missing |
| Ingest is reachable only over VPN | On Tricentis AI Services, customers send traces through the public API gateway with a key. No VPN needed |
| Native Tosca and qTest integration exists | Aspirational only. Nothing is built |
| Pricing charges per completed scoring run | Billing is per AI model call, drawn from the tenant's AI credits |
| Large traces of 30 to 50 MB are graded by reading 0.2% of the data | The paging capability exists, but no benchmark backs those numbers. Do not quote them |

Two statements the documents got right that the first draft of this review wrongly challenged: automatic first scoring does wait for 20 traces, and role-based access control really is thin (staff, customer, superadmin, tenant membership). Keep both.

One caution on the confidence intervals the teardown treats as a rigor advantage. They are a simple statistical approximation. They say how much a score might move with more data. They say nothing about whether the judge is right. Do not sell them as proof that AgentScore grades better than anyone else.

## Claims about competitors that need correcting

Most company facts in the report are right: funding rounds, acquisitions, and list prices for Langfuse, Braintrust, Arize, LangChain, Patronus, Comet, Confident AI, and Weights & Biases all check out. The problems are concentrated in the Arato teardown and in three "nobody else does this" claims.

| What the documents say | What is true today |
| --- | --- |
| Arato's pricing is undisclosed | Public on [AWS Marketplace](https://aws.amazon.com/marketplace/pp/prodview-kf3gh4uwn5npu): Advanced $19,200 and Enterprise $28,800 per 12-month contract. Both include 500 simulated sessions a month plus usage credits for monitoring and the prompt studio |
| Arato does not publish single sign-on | The Enterprise package lists SSO |
| Arato claims 10x coverage, 60% faster delivery, 35% better accuracy | Not found on Arato's site or in press. The only published result is one anonymous industrial customer. Remove |
| Arato integrates with LangGraph, Pydantic AI, Bedrock and OpenTelemetry | Not stated anywhere public. Arato sells "no code access, connect through the UI". Remove |
| Arato is text-only | Arato advertises voice agents too |
| Arato only does pre-production simulation | Arato also sells production monitoring and an evaluation studio. The overlap with AgentScore is wider than "opposite ends of the lifecycle" |
| Arato cannot test agent-to-agent flows | One sales rep said so in one demo. Treat as likely, not proven, and re-confirm before it goes into customer-facing copy |
| No mature tool maps test probes to regulations | [Promptfoo](https://www.promptfoo.dev/docs/red-team/plugins/) ships probes keyed to GDPR articles, the EU AI Act, COPPA and teen safety. The open gap is reviewed scenarios for a customer's own workflow, not generic regulation probes |
| Competitors cannot build test scenarios from production traces | [LangWatch](https://langwatch.ai/) markets exactly that, with a hosted product from 29 euros a seat. Our trace access is a head start, not a moat |
| No competitor goes from "why it failed" to "how to fix it" | [LangSmith Engine](https://www.langchain.com/blog/introducing-langsmith-engine) (May 2026) drafts code or prompt fixes from production failures. Patronus Percival suggests prompt fixes. Arize Alyx tests prompt variants. Braintrust Loop builds regression sets. Drop the claim |
| Galileo was acquired by Cisco in May 2026 | Announced April, completed 22 May 2026. Product is now Splunk Agent Observability. Fine as "closed May" |
| Patronus launched "digital worlds" in late 2025 | Announced June 2026 with its Series B |
| Braintrust customers include Stripe, Instacart, Zapier, Ramp, KeyBank | None appear on Braintrust's current customer page |
| LangChain has raised about $260M | Figures range from $160M to $260M depending on the tracker. Say "over $160M" |
| int4 has about 41 staff and $4.5M revenue | Unverifiable. Keep the product description, drop the numbers |

Events since the documents were written that they should mention: Raindrop raised $50M and launched production-replay simulations (September 2026); Coval raised $28M for voice-agent testing (June 2026); OpenAI is shutting down its Evals product on 30 November 2026, which frees up customers.

One editorial note: the remark that a competitor's website is "vibe-coded" should come out before anyone outside the team sees the report.

## What the analysis leaves out

- **Tricentis's own products.** AI Workspace, the Quality Intelligence Agent and SeaLights release-readiness overlap with AgentScore's mandate. The team's own market research from May 2026 ranked this the number one risk. None of the three documents mention it. Leadership will ask.
- **Cloud platforms bundling evaluation for free.** Microsoft Foundry already ships synthetic-scenario agent testing and release gates. Amazon Bedrock and Google Vertex have native evaluation. If any of them adds an "agent quality score", every customer on that cloud gets it at no cost. The May research called this existential; the September report does not list them.
- **"Zero setup" is narrower than it sounds.** It is true for agents already running inside AI Workspace. An outside agent still needs telemetry wired up, a key, a reachable endpoint and enough recorded evidence to grade. Say "no proprietary SDK and no test authoring", not "no setup".
- **The two September documents contradict each other** on the number of evaluations, the verdict scale and which judge models exist. Anyone reading both will notice.
- **Evidence quality is mixed without being labelled.** Vendor marketing, one sales demo, press reports, and internal hypotheses carry the same weight on the page. Mark each claim with where it came from and when.

## The simulation proposal: keep, change, add

The proposal is to build a small capability that drives a customer's agent with realistic and adversarial conversations, then lets AgentScore grade the result. The direction is right. The plan needs tightening before anyone commits an engineer.

**Keep**

- The split between routine quality checks ("grades") and must-never-happen policy checks ("gates").
- Starting with agents that expose a text or API interface, not a browser.
- A small, reviewed set of scenarios rather than thousands of generated ones.
- Reusing open-source parts for the generic pieces.
- Not buying Arato. The cited $10M figure is a guess, and Arato would not cover agent-to-agent testing anyway.

**Change**

- **The estimate.** "One engineer, a few weeks" covers a simulated-user engine, two connectors, traffic tagging, a gating layer, an API, a command-line tool and MCP tools. That is a quarter of work, not weeks.
- **The first slice.** Instead of shipping three interfaces, run one measured experiment: one customer workflow, one place the tests run, one type of agent connection. Include cases where the agent should say yes, so blanket refusals cannot look like success. Measure confirmed defects found, false alarms, effort and cost. Decide on productization from that.
- **"Zero tolerance" wording.** A clean run proves nothing about zero risk. Thirty clean trials still leave the true failure rate anywhere up to about 10%. Report "no violation seen in N trials", never "certified safe".
- **The 12-year-old example.** A child asking for an insurance quote is a request, not a violation. The test must judge what the agent did next against a written policy. Same for health data: HIPAA applies to specific organisations, not to every health conversation.
- **"The loop closes with no new scoring work."** Not quite. Today nothing tags test traffic, so test conversations would pollute real production scores, baselines and automatic profile fitting. Keeping them separate is real work.
- **The regulatory gap claim.** Generic regulation-mapped probes exist (see previous section). The gap is reviewed scenarios for a specific customer's obligations and workflow.
- **Buy versus build.** The document compares building against acquiring a company. It should compare against subscribing to or licensing a component (LangWatch, Promptfoo).

**Add**

- **Customer consent.** Today's consent model is a yes/no acceptance of terms. It does not cover reusing a customer's production traces to generate test scenarios. This is a blocker for the "scenario bank from production traces" idea, not an open question.
- **A cost and time budget per run**: maximum turns, wall-clock, spend, and a clear "incomplete" outcome when evidence or scoring never arrives.
- **An honest label for transcript-only tests.** If the agent has no telemetry and we only have the conversation text, we cannot see which tools ran or what data was written. Those scores must look different from fully instrumented ones.
- **Safety for a hosted runner.** If the service calls customer-supplied URLs, it needs target authorisation and protection against being pointed at internal systems from day one.
- **Reuse of what exists.** AgentScore already has a replay module that sends canned traces through the real ingest path. It is the natural starting point and the proposal does not mention it.
- **Four referenced internal documents** (the 12 October meeting notes, the two research write-ups, the Labs graduation plan) are not in the repository. Say where they live.
- **AIDA.** Nothing in the repository describes it. The open question about whether it can be driven programmatically is the right one; get the answer before designing the browser connector.

## A command-line tool for AgentScore

A command-line tool is worth building, provided it is the one that serves coding agents and CI pipelines, not the one that drives a customer's agent.

There are two different ideas under the name "CLI":

| Idea | What it does | Verdict |
| --- | --- | --- |
| Tool for coding agents and CI | Lets Claude Code, Cursor, or a build pipeline ask AgentScore for the score, verdict and evidence of an agent they just changed, and trigger a new scoring run | Build it. Cheapest integration surface we can offer; coding agents already live in the terminal; MCP tools become a thin wrapper over it; most evaluation vendors ship this first |
| Local runner for simulation | Runs the simulated-user engine on the customer's machine so it can reach agents our cloud cannot | Defer. Only needed when a customer's agent is unreachable from our cloud; pick one execution location for the first customer, not both |

What the first idea needs:

- A public, key-authenticated read API. Today that surface is a placeholder, so the tool forces real work on authorisation, paging and a stable contract. That is a feature, not a cost: it is the same work the "SDK and read API" gap in the competitive report calls for.
- A small command set to start: fetch score and verdict, list evidence for a failing check, trigger a scoring run, wait for it to finish. Read-only first, run-trigger second.
- Output that a coding agent can parse (structured, not prose), with a plain-text mode for humans.
- The same key the customer already uses for ingest, so onboarding adds no new credential.

What it does not need yet: a local simulation runner, a browser driver, or a UI. Those belong to the simulation experiment above and should wait for its result.

## Can AgentScore replace Arato?

Yes for API and conversational agents within two to three quarters, if a Tricentis browser driver (AIDA or Tosca) covers the UI part. Arato has three parts; AgentScore already covers one, can build one, and should borrow the third.

| Arato part | AgentScore today | What it takes to replace |
| --- | --- | --- |
| Evaluation and findings report | Already stronger: more dimensions, evidence per finding, verdict with confidence | Nothing new. Add screenshot or video evidence and a one-click Jira ticket to match Arato's presentation |
| Simulated-user conversations against API or chat agents | Not built | The simulation experiment above. Simulated-user engine plus reviewed scenario packs, reusing open-source parts. Roughly one quarter for one engineer to reach "good enough" |
| Browser-driven personas at thousands of sessions, with screenshots and video | Not built | Do not clone. Use a driver Tricentis already owns: AIDA, or Tosca with Vision AI. The work becomes integration, not a new product |

AgentScore also covers what Arato does not: agent-to-agent and MCP topologies, and grading real production behaviour. So for most Tricentis customers the replacement is complete; for browser-only chatbots it depends on the driver.

Conditions before counting on a Tricentis driver:

- AIDA must be drivable headless, by API or command line, against a third-party application. Nothing in the AgentScore repository says it can. Get a written answer from the AIDA team.
- The 12 October meeting said not to attach this work to ATA, ADA, or Exploratory. Confirm AIDA sits outside that family.
- Depending on AIDA couples our roadmap to another Labs project's release and access model. Tosca is more mature and may be the safer driver.
- A driver gives us clicks, not evidence. Screenshots, video capture, and the finding-to-ticket flow still need building on our side.

Recommendation: keep the driver interface small so AIDA, Tosca, or Playwright can all plug in. Decide which after the AIDA answer arrives.

## Recommended next steps

1. Correct the AgentScore facts in both September documents using the tables above before any further circulation.
2. Remove the three "nobody else does this" claims (regulation probes, trace-to-scenario, fix suggestions) and the unsourced Arato metrics.
3. Add a short section on Tricentis-internal overlap and cloud-platform bundling, or link to the May market research.
4. Reframe the differentiator as: no proprietary SDK, no test authoring, automatic choice of what to measure, and zero-effort grading for AI Workspace agents. Drop "deeper scoring than competitors" until there is comparative evidence.
5. Resolve customer consent for trace reuse before designing the scenario bank.
6. Replace the simulation first slice with a one-customer, one-interface experiment and a success measure, then decide.
7. Get a written answer from the AIDA team on whether it can be driven programmatically.
8. Scope the command-line tool for coding agents and CI: read-only commands first, backed by the public read API.

Suggested positioning sentence for external use: "AgentScore grades what your agents actually do, with trace-linked evidence, and no SDK or test authoring. A focused testing workflow can turn selected interactions and your own policies into repeatable checks before release."
