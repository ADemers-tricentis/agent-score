# AgentScore Demo Debrief - LGT Financial Feedback Session

**Date of session:** 2026-11-19
**Source:** WebVTT call transcript (speaker-labeled, ~23.5 min)
**Format:** Live intro, short product demo, open Q&A
**Analyst:** Lead PM review

## Room composition

- **Tricentis side:** Andrew Demers (presenter/PM, lead PM for Agentic evaluations).
- **LGT side:**
  - **David Klien** - works at a bank in Europe (LGT Financial). Builds agents on his company's internal LLM platform, where an "agent" is a collection of skills plus extra instructions. Found AgentScore through Tricentis Labs.

*(The transcript labels the company "IGT"; corrected to LGT Financial against the interest funnel entry from 2026-11-16. Other mis-hears: "Doc hair match" is Docker/Helm chart, "Trust Centers Labs" is Tricentis Labs, "Hang your own mother" is "Bring your own model". David's opening remark about where he heard of AgentScore ("transformed London") is garbled and unclear.)*

---

## Why LGT is here (important context)

David's team does no agent testing or evaluation today ("we are at 0"), but he expects it to matter as LLMs move into everyday work. He built one agent for his team to improve their Jira Xray workflow (including creating stories) and uses AI-generated skills in his dev projects (update docs, check features, linting). This is an early, individual-driven look, not a mandated evaluation. He wants to show the wider team what AgentScore offers one day.

His real filter is the bank environment: where the service runs, whether he can bring his own model, and whether it can test agents that rely on MCPs available only inside the bank.

---

## What landed

**1. The governance and "is it ready to ship" framing.**
Andrew's pitch (agents are easy to build, hard to govern; bad behavior costs money and time) matched David's situation of having agents but no way to judge them.

**2. Score, root cause, and fix-then-rescore loop.**
David's reaction to the demo: "pretty cool". He specifically liked agents talking to each other to improve and retest: the coding agent reads scores and advice through the MCP, applies the fix, then rescores.

**3. Agent card and profiles.**
The auto-generated agent card (purpose, typical behavior, success criteria, failure modes) and profiles as collections of evals, with pre-made and custom evals, were shown without objection.

**4. Drill-down on a failed trace.**
A failed task-completion trace (assistant returned blank tool calls) showed the rating, reason, and improvement advice.

**5. How scoring works.**
Deterministic evals (for example a PII term search), LLM-judge evals against a rubric (tool use, answer relevancy, argument correctness), and custom rubrics. Non-applicable traces are excluded instead of scored 0 (the tool-use eval skips traces with no tool calls).

---

## What could have gone better / gaps surfaced

**1. Deployment in a bank environment is not settled.**
AgentScore is cloud-based today. Self-hosted/local options are in development, "not 100% ready" but exist; David inferred a Docker/Helm style deploy and Andrew confirmed. This is a third wording of the on-prem answer alongside the Meta confirmation and the Eaton and Love's answers.

**2. Customer data in traces.**
Bank constraint: agents should not contain customer data. David explicitly deferred it ("let's come back to this"). We still owe a clear answer on PII masking and on sending only sampled or representative traces.

**3. Bring your own model is not exposed.**
Any model with an API key can act as the judge, configured behind the scenes, but there is no front-end setting. David also has an on-prem AI hub and was unsure a cloud service could reach it.

**4. CI/CD integration is a goal, not a feature.**
David wants push, run in GitHub, AgentScore scores, and the pipeline continues on pass. Not available yet.

**5. Testing locally available MCPs.**
Andrew's path: run the agent in their own environment, export only chosen or representative traces to AgentScore, get scores and advice back through the MCP, and apply them locally. Works, but is a manual workflow.

---

## Pricing

Open beta, no charge. Future model: Tricentis AI credits, with unlimited seats and trace ingest, billed on scoring runs (number of evals, frequency, complexity).

---

## Decisions

- David will get access to the cloud version to try it, with an API key and external agents.
- David will check internally (on-prem, AI hub, data rules) before deciding on a deeper evaluation.

## Follow-ups Andrew committed to

1. Send the call recording once it finishes generating.
2. Send the quick start link, setup instructions, and login info.
3. If David returns requirements (Docker image for on-prem, own LLM), do our best to accommodate.
4. Confirm what the self-hosted (Docker) option can do today and its readiness.
5. Confirm whether a cloud AgentScore can reach an on-prem AI hub, or the BYO-model path for it.
6. Prepare an answer on data handling: customer data in traces, PII masking, sending only sampled traces.

## Follow-ups David committed to

1. Talk to the relevant people internally about on-prem needs, AI hub access, and testing the plugin project.
2. Try the cloud version, create an API key, and connect an agent.
3. Come back with a list of requirements if he wants to proceed.

## Next steps and parking lot

- Andrew sends recording, quick start, and login. David trials the cloud version and checks internal requirements.
- Possible later: present AgentScore to David's team, and a pilot on an internal plugin/agent project with many plugins in git (he needs to talk to the responsible people first).
- Parked: customer data in agents and traces, on-prem AI hub connectivity, exposing BYO model in the UI, CI/CD integration.
