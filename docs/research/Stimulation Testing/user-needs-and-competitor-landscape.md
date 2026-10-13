# Stimulation Testing: What Users Need and What Competitors Do

_Draft, 2026-10-13. Sources: `docs/feedback/Customer Feedback Log.md`, `docs/feedback/feedback-sessions/`, `docs/research/arato-vs-agentscore-teardown.md`, `docs/research/competitive-analysis-report.md`, `docs/research/competitive-teardown-decagon.md`, `docs/research/competitive-teardown-agentforce.md`, and `docs/research/competitive-intel/` digests (2026-09-23 to 2026-10-12). Competitor claims are vendor-reported unless noted. Companion to `stimulation-market-and-approach.md`._

# Part 1: What is useful to our users

Only asks that came up in calls are counted.

## Scenario capabilities users asked for

| Ask | Who | What they said or need |
| --- | --- | --- |
| Hand AgentScore a batch of test prompts and run them on demand | L'Oreal (asked twice), Meta (x2) | "10 to 15 prompts... will it run all of them?" Told no, since AgentScore only scores organic traces. |
| Red-team the agent: "define scenarios, run them, see how it responds" | Meta (Sri, and the partner repeatedly), Eaton | Eaton asked if adversarial testing is planned. Meta's partner called it "the pivotal gap" and the deciding capability in both calls. |
| Synthetic or edge-case test data without waiting for real traces | Tritusa | Golden sets come only from real interactions today, so targeted coverage has to wait for traffic. |
| Test the chatbot during implementation, not just in QA or prod | PG&E | Inbound question, and they didn't sign up. |
| Test a group of agents against one scenario | Meta (Sri) | Measure the collective for the business outcome, and each agent to find the cause. Got an explicit "that makes sense." |
| A clear answer to "is this a testing tool?" | Workday QA persona | Raised four times and never resolved. They want author cases, invoke the agent, then assert. |

## Scenario types implied by those asks

- **Compliance:** Tritusa called this the biggest unmet ask, with banks and a pharma client on GxP/SOX-style regimes. "Not currently, but not hard to add" will not survive a regulated engagement.
- **Safety and PII hard-fail:** Workday found a hard-fail on PII "clean and enterprise-legible." Eaton and Tritusa both asked about PII and data handling. Aptiv already runs Model Armor for misuse and toxicity.
- **Groundedness and hallucination:** L'Oreal's hallucination demo held his attention. Aptiv's real interest is groundedness and correctness.
- **Tool and retrieval failures:** Workday engaged most with wrong tool, bad data, bad answer, with a span and a fix.
- **Polite-decline and out-of-scope:** Workday raised these as scenarios.
- **Trust, benchmark, model choice:** Tritusa's practice lead expects customers to ask "how do you know your agent is any good?" and about model choice.
- **Multi-agent and MCP:** Meta runs a hierarchy of functional, value-stream and enterprise agents. Agent-to-agent is also our stated lane against Arato.

## Constraints that shape what we build

- **Deployment:** Meta's DMZ policy makes on-prem the number-one requirement, and their judge would need their internal LLM endpoints. Eaton wants data kept inside Azure. The runner must work behind a firewall, which supports the CLI in the stimulation doc.
- **Perception risk:** Meta's partner worries a raw product creates lasting bad impressions. Scope claims to what is built.
- **Time to first value:** Aptiv's Brennan wants to try his own ADK agents right away.
- **Reviewer gap:** Nobody on our side has the domain knowledge for long-tail regulatory scenarios.

# Part 2: What competitors are doing

## Simulation-first competitors

| Competitor | Scenario approach | What users say or use it for |
| --- | --- | --- |
| **Arato** ($10M seed) | Four steps: auto-brief from the site or PRDs in about 3 minutes, personas (naive, malicious, edge-case, good, varied by language, age, gender, tech skill), scenarios (persona + goal + business flow, risk-rated), then a report. Runs 100-200 scenarios, or thousands. Browser-driven. | A global industrial firm cut validation from 3 months to days, with about 80% less manual QA effort. Customers praise "real, actionable issues" on compliance, accuracy and feel. |
| **Arato report** | Critical, warning and good findings, each with screenshot and video evidence. Findings can be marked relevant, and Jira tickets open in one click. Re-run after fixes. | Positioned as a day-to-day tool. Free sample simulation of about 30 conversations. |
| **Arato gaps** | Conversational surfaces only, and agent-to-agent is explicitly not a fit. Token and efficiency tracking and PII handling in captures went unanswered in the demo. | |
| **Maxim** | Persona-driven multi-turn simulation through your agent's API. Adversarial conversations for customer-support escalation and fallback. Voice simulation shipped in October: connect a phone number, run thousands of call scenarios, score talk ratio and duration. | A reviewer switched from Braintrust specifically for simulation. Clinc reported a 72% hallucination reduction in banking agents. |
| **Decagon** | Auto-generated tests across conversation pathways. Checkpoints that the right action or tool fired. Judge rationale, stale-test retirement, scheduled recurring simulations, CI/CD gating, and PagerDuty-style drift alerts. | Support-only, with claimed 70-95% resolution rates. |
| **Agentforce Testing Center** | Simulates full conversations, not single exchanges. Voice playback, plus Runtime Guard that blocks risky tool calls before they run. | Bundled into the platform purchase, so customers get testing without buying it separately. |
| **Patronus** ($50M Series B) | "Digital World Models": replicas of sites and internal systems for stress-testing. Lynx for hallucination, Percival for 20+ failure modes. | Mainly frontier labs, so a different buyer. |
| **SAP-focused tool** | "Citizen testing": consultants run simulation agents against historical data for SAP Joule agents. | Narrow, new, no logos. |
| **LangSmith Engine v2** (private beta) | Proactive red-teaming before production, and validates its own fixes before showing them. | Shows incumbents moving into red-teaming. |

## Open-source and adjacent

- **LangWatch Scenario:** a user-simulator, agent and judge loop that runs in pytest, vitest and jest (Apache-2.0).
- **Promptfoo, garak, PyRIT, DeepTeam:** generic attack libraries, with 40 to 120+ probes depending on the tool.
- **DeepEval:** multi-turn and agentic evaluation, plus MCP server evaluation and voice metrics (v4.2).
- **Raindrop:** replays production traffic against a proposed change.

## Patterns across competitors

1. Persona times goal times risk is the standard scenario unit.
2. Findings come with evidence and a path to a ticket, not just a score.
3. Simulation is a recurring job in CI and on a schedule, not a one-shot.
4. Stale scenario retirement (Decagon) is a lifecycle feature we lack.
5. Voice is the next modality (Maxim, Agentforce, DeepEval).
6. Test and grade are consolidating, and the competitive report flags this as Gap 4. Infrastructure majors now own Langfuse, Arize, Galileo and W&B Weave.

# Part 3: Where AgentScore stands

| Need | Competitors | Us |
| --- | --- | --- |
| Generate traffic from nothing | Arato, Maxim, Decagon | Gap |
| Scenarios grounded in real production traces | Only Raindrop-style replay | Our home turf |
| Compliance and regulatory gates | Thin everywhere. Arato claims alignment but publishes no scenario library. | Open, and Tritusa wants it |
| Agent-to-agent and MCP | Arato says no | Our lane |
| Token and efficiency as a scored dimension | No Arato answer | We have it |
| PII hard-fail | No Arato answer | We have it |
| Statistical rigor (CIs, pass@k) | Absent in Decagon and Arato's public material | Our edge |
| Evidence and ticket handoff | Arato sets the bar | Attribution exists, with no Jira handoff |
| Stale test detection, scheduled runs | Decagon | Gap |
| Black-box connect with no instrumentation | Arato | OTel required, plus the VPN-only ingest |

# Part 4: Scenario categories (draft)

Gates have 0% tolerance and are tagged to a rule. Grades are weighted toward production flows.

| Category | Type | Example scenarios | Evidence |
| --- | --- | --- | --- |
| Compliance | Gate | Minor asks for an insurance quote; GDPR access or erasure request; AI not disclosed; PHI to an unverified caller; wrong jurisdiction rule | Tritusa, Meeting 2026-10-12 |
| Security and PII | Gate | PII echoed back; direct and indirect prompt injection; system prompt extraction; cross-user data access; tool misuse; spoofed upstream agent | Eaton, Tritusa, Workday |
| Safety and harm | Gate | Self-harm, medical emergency, abuse, with a correct handoff | Aptiv (Model Armor) |
| Functional | Grade | Happy-path tasks; wrong tool or arguments; hallucination; multi-turn state loss; ambiguous input; out-of-scope; missed escalation; tool failure recovery | L'Oreal, Workday, Aptiv |
| Usability | Grade | Tone mismatch; non-English and slang; verbosity; dead ends; mid-flow changes of mind; latency | Arato personas, Maxim |
| Bias and fairness | Grade | Same request varied by name, gender, age, origin | Arato persona variation |
| Robustness | Grade | Very long, empty, or odd-format inputs; retries | Open-source red-team tools |
| Multi-agent and MCP | Grade | Downstream failure; handoff loses context; contradictory agents | Meta, Arato gap |
| Cost and efficiency | Grade | Token blowup, looping tool calls | Arato unanswered |

Scenario schema: category, persona, goal, opening input, success criteria, gate flag, rule or source tag, and target types (chat, HTTP, MCP, A2A).

# Open items

- Confirm which categories the first beta cohorts need first (Meta and PG&E point to pre-release testing; Tritusa to compliance).
- Decide whether Decagon-style stale-scenario retirement and scheduled runs belong in the first slice.
- Decide whether the Jira handoff (Arato's one-click ticket) is worth copying early.
