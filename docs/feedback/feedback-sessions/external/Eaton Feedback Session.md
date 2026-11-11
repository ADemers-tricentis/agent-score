# AgentScore Demo Debrief - Eaton Feedback Session

**Date of session:** 2026-10-01 (per the External Interest tracker; the transcript carries no date)
**Source:** WebVTT call transcript (auto-diarized)
**Format:** Customer problem statement, short slide intro, live screen-share demo of AgentScore, open Q&A
**Analyst:** Lead PM review

## Room composition

- **Tricentis side:**
  - **David Colwell** - VP of AI/ML, referred Eaton in. Restated Eaton's problem back to Amit, then dropped off the call early and handed over to Andrew.
  - **Andrew Demers** - presenter/PM, lead PM for Agentic evaluations. Ran the intro, demo, and Q&A.
- **Eaton side:**
  - **Amit Ghag** - owns the quality engineering practice for Eaton's custom AI development. Attended the Tricentis Transform event in Singapore a couple of weeks earlier, where he first heard of AgentScore; Eran (Tricentis) suggested this call. Driving the evaluation and plans to socialize AgentScore internally at Eaton.
  - **Prashant Saxena** - technical stakeholder on Amit's side (role not stated). His questions were about telemetry prerequisites, ground truth, and data leaving Azure.

*(The auto-diarized transcript mis-hears several terms: "Aitan" is Eaton, "bonds" is BOMs, and the platform/group names "A10" and "ETIP" are unclear. This debrief refers to them generically as Eaton's custom AI development team.)*

---

## Why Eaton is here (important context)

Eaton is a manufacturer running a growing portfolio of custom-built AI use cases, mostly on **Azure AI Foundry and Palantir Foundry**. Amit described testing in this space as "unstructured and inconsistent across the board," and his mandate is to establish quality engineering practices for it. The centerpiece is **automated testing embedded in the deployment pipeline as a quality gate: nothing goes to production unless it meets defined thresholds.**

David's summary of Eaton's agent portfolio, which Amit confirmed ("Absolutely"), sorts it into three classes that each need a different definition of "good":

- **RAG agents** - answer questions from document sources (e.g. engineers querying 50 years of engineering knowledge, executives querying customer profiles). What matters: truthfulness.
- **Workflow agents** - measure efficiencies and optimizations (e.g. the similarity engine comparing two BOMs, portfolio complexity reduction). What matters: quality of prioritized recommendations.
- **Research agents** - competitive benchmarking (700-800 new product initiatives at any time) and tariff monitoring with impact assessment. What matters: accuracy.

More agents are coming as more teams have ideas, so Eaton wants one consistent standard across all of them without slowing teams down. Andrew's reaction on the call: Eaton "might be the best use case that we've heard so far" for AgentScore.

This is a different shape from the other accounts. Eaton is not asking "can you evaluate my agent." They are asking "can you be the release gate for a whole portfolio of agents across two platforms," which makes the CI/CD gap below the deciding item.

---

## What landed

**1. The portfolio-level problem statement.**
David's three-class restatement and Amit's quality-gate framing matched AgentScore's opening problem (agents ship fast, evaluation doesn't scale, no shared definition of good) almost word for word. Amit had no objection to the problem framing and moved straight to capabilities.

**2. Editable success criteria and profiles.**
Amit asked early whether Eaton can override the success criteria AgentScore infers. Andrew: yes, edit, regenerate, or redirect it. Profiles are a collection of dimensions, and dimensions and evals are editable.

**3. Weighted dimensions.**
Amit asked whether the composite score is a plain average or can be weighted. Andrew explained weights at the dimension level, the eval level within a dimension, and the roll-up (e.g. Agentic tool use). Amit's reaction: "That is something that I was looking for."

**4. Tool-use accuracy, including MCP and agent-to-agent.**
Amit expects tool-use accuracy to matter more as Eaton's agent count grows. Andrew confirmed tool calls, MCP use, and agent-to-agent interactions (what a called agent's tool returned, and whether it was accurate) are all scored, and that tool success rates are surfaced.

**5. Scoring cadence, history windows, and score-now.**
Amit probed how scoring maps to testing phases and releases. Andrew's answer - scheduled scoring with a configurable history window, plus on-demand scoring that can be tagged as a version and paused between changes - gave Amit the baseline-versus-new-version comparison he was asking about.

**6. Root-cause attribution and improvement suggestions.**
Shown on the failing MCP example (a weather-forecast agent that invoked an unrelated MCP and scored 40). Amit asked what recommendations are based on, and the answer (traces, the inferred profile, and your edits) was accepted.

**7. Golden dataset created from real traces.**
Prashant's "you don't have the ground truth" challenge got a direct answer: AgentScore surfaces candidate traces, the user marks correct or supplies the expected answer, and the saved golden set is used for later runs. Prashant restated it correctly ("I cannot expect it to be 100% correct from the first run... gradually it will provide fair results").

**8. Three eval types.**
LLM-as-judge (GEval), deterministic library checks, and the hybrid map-reduce mode were explained when Amit asked who defines the evals and whether they are Tricentis's own.

---

## What could have gone better / gaps surfaced

**1. No CI/CD quality gate yet - the deciding gap for Eaton.**
Amit's stated goal is that nothing reaches production unless it clears a score threshold. He asked whether AgentScore sits outside the pipeline as an observer or can sit inside it as a gate. Andrew: a CI integration is being worked on that would let the pipeline act on a threshold or pass/fail result and trigger a deploy. Not shipped, no date given. Amit's earlier example (v1 shipped at 95, v2 must be at least 90) is exactly this feature plus version-aware comparison. This is the same "block the release on a score" ask as in the graduation criteria, now from an account for which it is the entire purpose.

**2. Hosting: Tricentis Cloud only today.**
Amit asked whether it can be hosted in Eaton's cloud. Andrew: hosted on Tricentis Cloud; on-prem or alternative hosting is being explored but is not fleshed out. This lands next to Prashant's data question below and is the same wall Meta hit (self-hosted in their own AWS).

**3. Data-boundary answer was not complete.**
Prashant's last question: Eaton's LLMs run in Azure, which guarantees data stays inside it, so what keeps Eaton's telemetry from leaving when AgentScore uses an LLM behind the scenes? Andrew described PII redaction and sending only the relevant span fields (not the whole trace) to the judge, but said he did not know the technical details and would check with his engineer. Amit: this is "a very important aspect," given sensitive information and IP. **Open follow-up, and likely a gate to any trial.**

**4. Palantir Foundry compatibility was never answered.**
Amit's opening ask included whether AgentScore is compatible with Azure AI Foundry and Palantir Foundry. Andrew's general answer was "anything that supports OpenTelemetry," and Prashant's Application Insights question got the same treatment. Nobody confirmed that Foundry-built agents, or Palantir's, emit OTel traces AgentScore can use. This was the first question Amit listed and it is still open.

**5. No Microsoft Foundry evaluation comparison.**
Amit asked for a side-by-side with Azure AI Foundry's built-in evals ("which one should we use where"), noting Eaton will have this exact internal debate and other Foundry customers likely will too. Andrew had no document; his verbal answer was that Microsoft is better on its own stack (it sees data beyond traces) but anything off-platform is out of reach. **Asset to build.** A named "Foundry vs AgentScore" comparison is needed anywhere Azure shops evaluate us.

**6. No upfront golden-dataset upload.**
Amit has expected responses from existing testing and asked to hand them to AgentScore on day one. Andrew: the backend supports it, the front end does not yet. Same gap raised before; here it determines how quickly Eaton can show value from agents already in testing.

**7. No project- or release-level grouping and reporting.**
Amit asked for metrics grouped by project (e.g. these five agents, this release) and tracked over time. Andrew: not shown directly today, only through the score; a report-level view is wanted. Same family as the Meta, Wolters Kluwer, and Aptiv "evaluate a group of agents" ask.

**8. Adversarial / security testing is roadmap, undecided.**
Amit asked whether adversarial testing is planned. Andrew: on the roadmap, with scenario or simulation generation as a strong interest, but no firm plan or timing and it will depend on beta feedback.

**9. Cost "expensive" has no threshold.**
Amit asked how AgentScore decides a task is expensive. Andrew: it is subjective today; efficiency evals flag wasteful steps, and alerting or a measurement is wanted. Minor, but it shows no budget or token-range comparison exists.

**10. Span-instrumentation expectations were glossed over.**
Prashant asked whether developers must create proper spans in code since that cannot be automated. Andrew's answer ("we capture all spans and decide what's relevant") did not say how much instrumentation depth is needed for good scoring. Worth a clearer, documented answer for teams relying on Application Insights.

---

## Follow-ups Andrew committed to

1. **Send AgentScore overview collateral** that Amit can use to socialize it inside Eaton - sending what exists if sufficient, building something if not.
2. **Get Prashant a real answer on data handling** - what is sent to the LLM judge, how PII redaction works, what stays inside the customer's boundary - after checking with engineering.
3. **Put together a comparison against Microsoft's Foundry evaluation capabilities** (offered as "I could definitely put something together").
4. **Send a follow-up email**, and invite Eaton to sign up for the open beta, which Andrew said is starting very soon.

---

## Recommended next steps

1. **Answer the data-boundary question in writing, fast.** It came from a technical stakeholder, was the last question, and is the most likely blocker to any trial. Same answer needed for the Meta, Aptiv, and Wolters Kluwer security reviews.
2. **Resolve Palantir Foundry and Azure AI Foundry compatibility explicitly** - confirm what trace data each emits and whether it reaches the OTel exporter. Test on a real Foundry-built agent before promising anything.
3. **Build the Foundry-vs-AgentScore comparison.** It is the collateral Amit needs to win the internal debate, and it generalizes to every Azure shop.
4. **Be straight with Amit about the CI gate timing.** It is his headline requirement and it is not shipped. If the beta arrives before the CI integration, say so up front so a trial is not judged against a feature that is not there.
5. **Treat Eaton as a design-partner candidate, not only a lead.** Andrew explicitly asked for a design partner to stress-test the product, Amit wants to "delve into it, try it out," and their three agent classes (RAG, workflow, research) are a ready-made test of whether auto-inferred profiles generalize.
6. **Track alongside the other enterprise accounts:** group/portfolio-level scoring (Meta, Wolters Kluwer, Aptiv), self-hosting (Meta), and upfront golden-dataset upload.
