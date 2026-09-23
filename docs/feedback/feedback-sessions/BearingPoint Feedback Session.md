# AgentScore Demo Debrief - BearingPoint Feedback Session

**Date of session:** 2026-09-23
**Source:** `Rohan Patil - 30 minutes meeting.vtt` (recorded call transcript)
**Format:** Live intro, screen-share overview/demo of AgentScore, open Q&A
**Analyst:** Lead PM review

## Room composition

- **Tricentis side:** Andrew Demers (presenter/PM).
- **BearingPoint side:** Rohan Patil - Senior Technology Consultant, testing/QA architecture lead with 10+ years supporting BearingPoint's customers. Runs BearingPoint's internal testing factory, focused mainly on SAP. Works with customers who are moving into AI and agents, and uses Tosca / the Tosca AI Workspace internally.

*(The transcript auto-diarizes his employer as "Burn Point" throughout - this is BearingPoint GmbH (DE), confirmed against the Labs signup record: Rohan Patil, rohan.patil@bearingpoint.com, submitted 2026-09-14, demo scheduled for this call.)*

Rohan signed up through the Tricentis Labs program specifically wanting a hands-on look at AgentScore, not a cold intro - this was a **Labs beta-onboarding call**, the first real conversation, not a deep technical evaluation yet.

---

## Why BearingPoint is here (important context)

BearingPoint's testing factory is picking up more and more agents and tools internally, and Rohan's team had already been asking themselves the question this product answers: "we are having so many agents... how are we going to actually evaluate whether the agents are working fine?" He came across AgentScore through Labs, found it "really interesting," and wants hands-on time before deciding how to use it.

Today, BearingPoint has **no evaluation tooling for agents at all** - "We don't have anything of that sort. We just use the agents and then we get the results."

Two use cases surfaced, and both matter for how BearingPoint would use the product:

1. **Internal, own-agent testing** - his concrete first example is BearingPoint's QTest ATC agent (generates test cases from requirements); he wants to run AgentScore against it to see how well the generated test cases hold up.
2. **Client-facing proof** - BearingPoint is a consultancy that builds/recommends agent tooling (they also just launched their own agentic-AI platform, GenAIQ) for its own clients. Rohan expects the question "how do you know the agent works?" to come from a client "in a couple of months," and wants AgentScore evaluation criteria as the answer he can show them. This puts BearingPoint in the same partner/SI lens as Tritusa and Wolters Kluwer - evaluating AgentScore both as something they'd *use* and something they'd *point at* in front of their own customers.

---

## What landed

**1. Auto-derived agent purpose, behavior, and failure modes from traces.**
The walkthrough of profile assignment - infer purpose, tool calls, typical behavior, success criteria, failure modes, then apply a matching evaluation profile - was followed closely and drew detailed follow-up questions rather than confusion, a good sign for a technical QA-architecture audience.

**2. Two-line OTel setup, broad compatibility.**
"Anything that supports OpenTelemetry trace data... should be the most agents out there" answered his very first question (what agents can be evaluated, are there restrictions) cleanly. He confirmed his own read-back: this covers everything Tricentis offers, plus anything external he instruments, side-by-side with internal Tricentis-based agents.

**3. Root-cause attribution and improvement recommendations.**
Same pattern as Workday, Meta, and Tritusa - the failure-to-actionable-fix flow (root cause pinpointed to a trace, plus a specific recommendation to improve the agent) was the one feature Rohan volunteered enthusiasm for unprompted, and he floated turning it into an internal best-practices reference.

**4. Configurable weighting and verdict bands, versioned baselines.**
He asked pointed questions on whether evals/weights are fixed (they're not - user-configurable), and confirmed the mechanism: selecting a profile locks an immutable version so re-scoring the same agent after a change gives a clean before/after comparison; a new profile creates a new version to re-baseline against. Verdict bands (ship / needs work / don't ship) are also user-editable, not fixed categories.

**5. Region-based data residency.**
Direct GDPR question ("is it hosted inside the EU?") got a direct, unhedged answer - hosting follows the account's signup region (US account -> US, EU account -> EU environment).

---

## What could have gone better / gaps surfaced

**1. Non-deterministic run count (trace threshold / repetitions) isn't user-configurable yet.**
Rohan asked directly whether the "20 traces" / repeated-run behavior for handling non-deterministic outputs is fixed or adjustable. Answer: configurable on the backend today, not yet exposed to users - Andrew called it "not a lot of work to implement" but it isn't shipped. New ask, not raised by a prior session.

**2. Tricentis's own agents (e.g. QTest ATC) are deliberately not exposed inside AgentScore.**
This is the one place the conversation hit a wall. Rohan's most concrete use case - point AgentScore at BearingPoint's QTest ATC test-case-generation agent to show a client "your ATC agent works" - runs into the fact that Tricentis doesn't expose QTest/quality-agent internals inside AgentScore due to proprietary/IP concerns; those are measured internally but not surfaced to customers. AgentScore is standalone today: any externally-connected agent (BearingPoint's own or third-party) gets scored like any other OTel source, but there's no built-in workspace bridge into QTest ATC specifically.

**3. No slide/collateral in hand yet for the internal pitch.**
Rohan explicitly wants two things to bring to his manager and, eventually, to BearingPoint's own clients: (a) how to set up/evaluate an agent, and (b) the evaluation criteria itself (the eval/dimension breakdown shown live on the call). Nothing existed to hand over on the call itself.

---

## Follow-ups Andrew committed to

1. **Send slides covering setup and evaluation criteria** - the two things Rohan asked for by name, so he can loop in his manager.
2. **Check internally what can be shown from Tricentis's own internal agents** (results/examples), to see whether anything can be shared as a reference given the QTest/quality-agent proprietary boundary. Andrew was clear this "might take a little bit longer" than the slides.
3. Rohan will talk to his manager and come back on whether BearingPoint wants to bring internal or other agents (starting with QTest ATC) into the beta.

---

## Recommended next steps

1. **Get the setup + evaluation-criteria slides out quickly.** This is the single unlock for the internal manager conversation and any beta activation - Rohan asked for it explicitly and it's low-lift.
2. **Decide on exposing the run-count/repetition setting.** Rohan is the first prospect to ask for this directly, and it was already flagged internally as low effort - worth a quick roadmap look rather than letting it sit.
3. **Clarify internally what, if anything, can be shown about Tricentis's own agents as a reference example** - this is the concrete blocker on Rohan's most specific use case (proving BearingPoint's own QTest ATC agent works to a client), and the answer needs to come from beyond product/PM given the IP sensitivity.
4. **Track BearingPoint as another partner/SI prospect (alongside Tritusa, Wolters Kluwer)** evaluating AgentScore on two tracks at once - internal use on their own agents, and as a credibility tool in front of their own clients. Worth keeping in view if a partner-enablement motion (answer guides, co-sell) ever gets formalized, since three separate partner accounts have now asked for some version of it.
