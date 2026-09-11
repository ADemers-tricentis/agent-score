# AgentScore Demo Debrief - Tritusa Feedback Session

**Date of session:** 2026-09-11
**Source:** `2026_09_11_08_02_03_en_annotated.txt` (recorded call transcript)
**Format:** Slides + live overview of AgentScore, followed by the partner screen-sharing two of their own agents live
**Analyst:** Lead PM review

## Room composition

This was not an end-buyer call. Tritusa is a **Tricentis partner / SI / reseller** - trusted partner, gold-sponsor at events, runs booths, and does advisory work for their own clients. That changes the lens entirely: they evaluate AgentScore both as a tool they would *use* on the agents they build for clients, and as something they can *demo and sell* to those clients.

- **Tricentis side:** Andrew Demers (presenter/PM).
- **Tritusa side (partner):**
  - Practice lead driving the AAA (AI agent) evals-and-assurance practice - carried most of the conversation, asked nearly every question, ran the live demo. (SPEAKER_02)
  - Pankaj - Tosca lead at Tritusa, ~8 years Tosca, worked across London and Australia. (SPEAKER_01)
  - Vedanth - principal architect, ~a decade in the Tosca space. (SPEAKER_04)
  - Deepan and one or two others joined/observed. An account/relationship contact opened the call (referenced a prior "risk intelligence" call and that Tritusa has "enrolled in all four areas").

*(Names and spellings are approximate - taken from a messy auto-diarized transcript.)*

The whole call was framed by one hard deadline: **next week (week of 2026-09-15) the practice lead is presenting an autonomous QA agent demo at the Tricentis Transatlantic 26 event in Singapore**, and expects customers there to hammer him on trust, model choice, benchmarks, safety, and compliance. He wants AgentScore as the answer to "how do you know your agent is any good?"

---

## What Tritusa actually builds (important context)

They demoed two live agent stacks, both aimed at turning a requirements document into executed Tosca tests:

1. **Microsoft Copilot Studio agent** - upload a functional spec, it generates requirements and test cases, human-in-the-loop review, downloads as CSV, then pushes into qTest via API. Demoed live generating 60+ test cases and uploading 155 into qTest.
2. **AI Workspace agent (MCP + A2A)** - the end-to-end autonomous QA agent: upload a requirement doc -> create requirements in qTest -> create test cases in qTest -> generate test scripts/cases in Tosca -> execute the playlist -> analyze the report. Demoed live creating 11 requirements and 7 test cases in qTest.

On top of that they run an **evals-and-assurance advisory practice**: recommending which LLM a client should use (Gemini, Anthropic, others), including locally hosted Llama/Mistral for data-privacy-sensitive clients, and advising on risk/regulatory/compliance/safety. This is where AgentScore fits their business.

---

## What landed

**1. Auto-derived agent card from traces.**
The inferred purpose, tool-call monitoring, typical behavior, success criteria, and potential failure modes - all derived from traces with no config - read well against a Tosca agent they recognized. This is the piece that maps onto their "how do we prove this agent does what it claims" need.

**2. Two-line OTel integration + "any model, anywhere."**
The low-friction integration story landed cleanly, and directly answered their locally-hosted-model concern (Llama/Mistral for data privacy). Andrew's "I haven't found a model yet we can't integrate with" resonated with a shop that mixes Copilot, RAG, connectors, Power Automate, voice flows, and local programs in a single bot.

**3. Root-cause attribution was the hero moment again.**
The "task completion needs attention" walkthrough - agent reported a task done but no tool call fired, so it is effectively lying to the user, here is the exact trace, and you can wire Claude in to fix it - drew an explicit "brilliant." Same pattern as Workday and Meta: this is the capability that consistently converts.

**4. Auto-scoring at 20 traces, profile with reasoning + weights, composite score + ship/don't-ship.**
The full flow (wait for 20 traces -> infer profile with confidence and per-dimension weights -> composite /100 -> ship / don't ship / ship-but-investigate) was understood and welcomed. Baseline approval + version comparison (swap Claude for OpenAI or Llama and compare) fit their advisory model of "which LLM should the client pick."

**5. Free during beta.**
Removed the pricing objection for now and fit their "just let me get hands-on before the event" urgency.

---

## What could have gone better / gaps surfaced

**1. Compliance validation is the biggest unmet ask, and it is a regulated-client blocker.**
Raised early (banks, a global pharma client asking about a GxP/SOX-style compliance regime) and it is core to their advisory business. Answer today is "not currently, but not hard to add" - flag PII, flag compliance violations. It is on the roadmap but not shipped. For a partner whose clients are banks and pharma, this is the gap most likely to stall a real engagement.

**2. Alerting does not exist yet.**
They asked directly for alerting to managers/admins (Slack/email). Answer: not built, but top of the list. A named gap for an assurance practice that needs to notify humans when an agent degrades.

**3. Bulk / programmatic export is not out.**
They want to export traces/scores to their own DB and generate their own reports. Answer: an API is in progress, possibly alpha, not shipped. Echoes Wolters Kluwer's fleet/bulk theme - partners and large shops keep asking to get data *out*, not just view it in the UI.

**4. Synthetic dataset generation missing.**
Golden datasets are curated from real interactions only; no synthetic data generation yet. For targeted or edge-case coverage they would have to wait for real traces. Flagged as roadmap.

**5. Benchmark question got a good answer that needs to be rehearsed for the event.**
They asked which benchmark (MMLU, HumanEval, TruthfulQA, GLUE). Andrew's reframe - "we do not benchmark the model, the LLM providers already did that; we apply targeted evals to the agent's real behavior" - is the right answer, but the practice lead will get this exact question in Singapore. It should be a clean, pre-written line, not improvised.

**6. No partnership / co-selling motion to offer.**
They asked twice about a co-working / partnership opportunity (they are the ones in front of customers implementing and evaluating). Answer was "not at the moment, would love to soon." For a gold-sponsor partner presenting our story at our own event next week, having nothing to offer here is a missed motion.

---

## Follow-ups Andrew committed to

1. **Send getting-started documentation with sample use cases** (from scratch).
2. **Build an "answer guide"** predicting the common trust/model/benchmark/safety/compliance questions the practice lead will face at Transatlantic 26 Singapore, with rehearsed answers.
3. **Get Tritusa access to AgentScore** - targeted for roughly a week out, so they can build small use cases before the event.
4. **Follow up on training material / user guide / official videos** (still in progress; written docs exist).

Andrew confirmed he is **not** attending Transatlantic 26 Singapore, so the answer guide is the main way he can support them at the event.

---

## Recommended next steps

1. **Treat this as a partner-enablement case, not just a demo.** The deadline (Singapore, week of 2026-09-15) is real and near. Prioritize the access grant and the answer guide over anything else.
2. **Write the answer guide around the questions they actually asked:** benchmarks (reframe to "we grade the agent, not benchmark the model"), which LLM to recommend (baseline + version comparison), safety/PII, compliance (be honest: roadmap), local models (yes, two lines of OTel), auditability (yes, span-level traces).
3. **Get a compliance-flagging position on paper.** Their pipeline is banks and pharma; "not currently but easy to add" will not survive a real regulated engagement. Decide what beta can honestly promise.
4. **Escalate the partner co-sell question internally.** A gold-sponsor SI presenting our category at our event is exactly the partner motion we should have an answer for.
5. **Log the recurring pattern:** bulk export + alerting + "get the data out" are now asked across Wolters Kluwer and Tritusa - larger/partner accounts need programmatic access, not a UI-only product.
