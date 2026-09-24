# AgentScore POC Scoping Debrief - Meta (via delivery partner)

**Date of session:** 2026-09-11
**Source:** `2026_09_11_11_32_15_en.txt` (recorded call transcript)
**Format:** Requirements/architecture Q&A + live overview of AgentScore
**Analyst:** Lead PM review

> Non-diarized transcript (speaker labels unavailable), so all attributions below are inferred from context and are approximate.

## What this call was

A follow-on to the [2026-08-11 Meta session](Meta%20Feedback%20Session.md) with Sri, but a different room and a different purpose. This one was a **POC-scoping call run with a delivery/SI partner** who wants to build the POC for Sri's team at Meta - "your tool, our people." The partner owns the business relationship and the delivery muscle (supply chain domain, QE, a client team); Tricentis supplies AgentScore. Meta/Sri is still the end client.

The partner came in with three explicit questions:
1. What is required to run a POC?
2. What team/support does Tricentis provide, and how fast can it stand up?
3. Architecture - how is AgentScore set up and how would it fit? (They had only a high-level slide to go on.)

They also named a concrete date pressure up front: the partner wants to **start the POC a week from this call** and asked directly how long setup takes - a specific number, not just general urgency.

## Room composition

- **Tricentis side:** Andrew Demers (presenter/PM). Greg (account) referenced, not clearly present.
- **Delivery partner:** a business/account lead (drove the call), Satish (supply chain domain expert, probed the BOM/master-data example), Alex (technical, asked about integration on Meta's stack), Ranjit (their liaison talking directly to Sri), Jagesh (shared the earlier architecture slide). They already carry a Tosca footprint at Meta that is "being underutilized."
- **End client:** Sri (owns Meta's autonomous supply chain program) - not on the call.

---

## What landed

**1. Two-line OTel integration held up under scoping pressure.**
"If you already have a telemetry exporter, it is two lines - where to send it and an API key." The partner accepted this as genuinely low-friction. Estimated setup: repoint the agent's trace endpoint, plus configure the agent-score-side evaluator. Andrew was careful to say he would confirm exact effort with his engineer before committing.

**2. A concrete self-hosting path finally exists for the on-prem blocker.**
On-prem was Meta's #1 dealbreaker in the prior call with no answer. This time Andrew floated a real path: AgentScore already runs on AWS, and the likely route is instructions to stand it up in the customer's own private EC2 instance and hand it over. Meta is a big AWS shop, so this landed well. Still uncommitted pending engineer confirmation, but it moved from "no answer" to "plausible path."

**3. The evaluator model was understood and accepted.**
Three check types - library (deterministic/code), gEval (LLM-as-judge), hybrid (map-reduce: deterministic block, then LLM judges the output) - plus 40+ evals, auto-assigned profiles (agent archetypes) with reasoning and confidence, editable dimensions with adjustable weights, and a composite score with needs-attention + why. The technical members tracked it and signaled understanding repeatedly.

**4. Golden dataset / back-testing across model versions landed as an unprompted want.**
"Create a golden dataset, back-test every time, and compare when you swap in a new LLM" drew an explicit "that was another question I had." Fits Meta's intent to run their own/internal models.

**5. Root-cause + trace-level evidence, again the hero.**
The "agent reported the task done but fired no tool calls, so it lied to the user" example, plus per-span evidence and confidence on each grade, carried the credibility of the demo - same as every prior session.

---

## The two gaps that will decide this deal

**1. No scenario bank / simulation / adversarial testing - the pivotal gap.**
The partner asked repeatedly whether AgentScore plugs into a "scenario bank" - define scenarios or adversarial inputs, run them, see how the agent responds. Answer: no. Everything today is passive evaluation of real observed behavior; scenario/adversarial simulation is on the roadmap, not imminent. This is the same "make the agent fail / red-team" capability Sri asked for directly last time. It is the single feature that separates "evaluate production agents" (shippable now) from "test from development through to prod" (not yet).

**2. Point the evaluator at Meta's internal/custom LLMs.**
Meta runs their own models (internal "meta intern"-style models, "Spark 1.3" mentioned) and is strongly biased to use them internally rather than a cloud judge. Andrew flagged this as the key thing to confirm: can the scoring/judge run against their internal LLM endpoints in a self-hosted deployment. This is the technical precondition for on-prem to actually work for Meta.

---

## The real subtext: exposure / perception risk

The most important moment was the partner asking point-blank whether it is even a good idea to put AgentScore in front of Meta yet given its maturity. Andrew's honest answer was the right one: for **pure agentic evaluation of production agents, functionally yes** (UI needs polish); for **full pre-prod simulation, not yet**. Concrete context for how early-stage that maturity question actually is: Andrew said AgentScore had at that point been out of internal-only use for roughly a week and a half - zero external reference clients yet - which is the real substance behind the partner's exposure worry, not just a general "is it new" concern.

The partner's worry was reputational, not technical: expose something too raw to a savvy client and "perception gets created... surround sound... much harder to walk back once it's out there... more harm than good." Their proposed framing - and it is a good one - is to scope the POC explicitly to what AgentScore does **today** (production-agent evaluation on the existing Tosca footprint) while being transparent about the roadmap (scenario bank) so nobody feels oversold.

Working in AgentScore's favor: Sri has an **urgent** need (more agents going to prod, testing is a gap), his stated direction is "if AgentScore is the way, proceed; if not, proceed with something else - just move fast," and the partner's own bias is to run with AgentScore rather than open source or Meta's internal tooling (IQB mentioned) because of the underused Tosca footprint. There is also another partner circling the account.

---

## Follow-ups / commitments

1. **Andrew to confirm with engineering:** can AgentScore run self-hosted in Meta's own AWS/EC2, and what it takes to point the evaluator at Meta's internal LLMs (Spark 1.3 / internal models). This is the gating technical answer.
2. **Andrew to check with the product team** on positioning and whether now is the right time to expose to Meta.
3. **Both sides to be transparent with Meta** about exactly what is and is not built (scope to production-agent evaluation, name the scenario-bank gap as roadmap).
4. **Consider a direct check-in with Sri** given the urgency, to confirm scope before committing POC dates.
5. Partner to sync internally, then decide: proceed now (scoped) or wait for more maturity.

Tricentis will provide dedicated engineer time (split between dev and POC support) plus product walkthroughs; team availability is a non-issue barring vacation.

---

## Recommended next steps (PM view)

1. **Close the two technical answers fast** - self-host on customer AWS + internal-LLM judge. They gate everything, and Sri's urgency means a slow answer loses the "insider lane" the partner says we currently have.
2. **Write the POC scope statement for them.** Explicitly: "AgentScore evaluates your production agents today; scenario/adversarial simulation is roadmap." Handing the partner this framing protects against the perception risk they are (rightly) worried about.
3. **Decide the scenario-bank roadmap commitment.** It has now come up as the deciding capability in both Meta calls. The POC can proceed without it only if we are honest that it is coming.
4. **Cross-reference the coopetition note** from the prior Meta debrief - there is still another partner circling; the underused Tosca footprint is our wedge.
