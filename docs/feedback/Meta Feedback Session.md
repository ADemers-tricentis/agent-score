# AgentScore Demo Debrief - Meta Feedback Session

**Date of session:** 2026-08-11
**Source:** Pasted call transcript (diarized, speaker labels SPEAKER_00-06; several turns mis-attributed across SPEAKER_03/04, likely a diarization artifact rather than distinct people)
**Format:** Problem-framing discussion followed by live product demo (AgentScore back office); call was scoped to two topics, this transcript covers only the first (AI/agent-testing) - the second half on the existing HCL/TTC/Tricentis program was scheduled to continue after David and Andrew dropped off.
**Analyst:** Lead PM review

## Room composition

- **Tricentis side:** Greg (account/relationship owner, SPEAKER_00 - opens and frames the call), David (AI/agent-testing lead, SPEAKER_01 - drives the problem-discovery Q&A and positioning), Andrew (product, SPEAKER_06 - runs the live demo), SPEAKER_02 (joins later, presses on competitive landscape and production timeline).
- **Meta side (the buyer):** Sri - owns Meta's autonomous supply chain program (30-40 engineers, in-house built agents spanning functional -> value stream -> enterprise-agent hierarchy). No dedicated QA/testing function for agents exists yet; Sri is actively removing engineer self-testing and has nothing to replace it with. Reports to a VP pushing for a fully autonomous supply chain.

Sri's mental model going in was already sharp - deterministic vs. non-deterministic testing, agent-level vs. orchestration-level validation, and a target metric (95% correct agent behavior) - which shaped a fast, technical Q&A rather than a discovery-from-scratch conversation.

---

## What landed

**1. Individual + collective evaluation mapped directly onto Sri's own architecture.**
Sri asked, unprompted, how to test a *group* of agents against a defined scenario/context, not just one agent in isolation - a direct hit on his functional -> value-stream -> enterprise hierarchy. David's answer (measure the collective for business-level trajectory, measure each agent individually to pinpoint which one caused the failure) drew an explicit "that makes sense, okay, cool" - the clearest unprompted buy-signal in the call.

**2. Zero-friction OTel ingestion, demoed live.**
"Two lines and an API key" was shown, not just claimed, and traces started flowing into a fresh tenant on screen. Consistent with the broader AgentScore pitch of low integration cost regardless of stack.

**3. Broad definition of "agent" answered a question Sri didn't expect to get answered.**
Sri asked specifically whether AgentScore could also evaluate Metamate (Meta's internal chatbot with analytics "skills") - not just his supply-chain agents. Andrew's "we use the term agent very broadly - any interaction with an LLM" landed well, reinforced by a concrete, on-topic eval ("user distress") that maps directly onto chatbot QA, plus an unplanned but effective internal dogfooding anecdote (Tricentis engineers using AgentScore to score their own Claude Code environments).

**4. Custom eval builder pre-empted the "what about my one weird metric" objection.**
Sri never had to ask for it - the LLM-generated / hybrid / GEval build-your-own-eval flow was shown proactively, using a relevant example (100% test coverage) rather than a generic one.

**5. Live score improving in real time (48 -> 68) as trace volume grew (20 -> 50).**
A tangible, on-screen demonstration of the "gets more accurate with more data" claim, rather than an assertion the audience had to take on faith.

---

## What looked promising (features worth leaning into)

- **Auto-generated agent card** (plain-English purpose, behavioral patterns, success criteria, failure modes inferred from traces) - directly useful to Sri's situation, since these are engineer-built agents with no formal spec to test against in the first place. Shown but not called out as solving that specific gap.
- **Verdict bands** (ship / ship-with-note / review / block, customizable thresholds) - clean, enterprise-legible governance layer; mentioned in passing.
- **Scheduled scoring with a lookback window** - answers Sri's explicit fear (context/process drift over time as the supply chain program matures) with "catch the dip before it hits production," but this connection was never stated out loud.
- **Internal dogfooding story** - unplanned, but the single most credibility-building moment in the demo because it wasn't part of the pitch script.

---

## What could have gone better

**1. On-prem is a stated dealbreaker, and it surfaced ten minutes into a cloud-only demo.**
Sri: "having this on -prem is the number one requirement" - Meta's DMZ policy means nothing outside it can reach internal systems, cloud included. This should have been qualified before the walkthrough started, not discovered mid-demo. As it stands, roughly a third of the call was spent on a UI that, by Meta's own compliance model, cannot be used against real internal agents today.
- **Fix:** ask the deployment-model question in the first five minutes of any enterprise agent-testing call, before committing to a live cloud demo.

**2. The timeline conversation drifted and never resolved into one clear answer.**
Sri's need is immediate - self-testing is being switched off and "testing is going to start next week" with nothing to replace it. AgentScore's own dates moved live on the call: "early Q4" -> "not written in stone" -> "first week of November" (general beta) -> "end of September" (POC) -> pulled forward again to "early September" under pressure, with David and SPEAKER_02 each adding slightly different framing. That leaves a multi-week gap where Sri has zero testing coverage and no committed bridge plan.
- **Fix:** one rehearsed timeline slide (POC date, beta date, what's usable at each stage) that every Tricentis speaker repeats verbatim, plus a concrete answer for what Sri does in the interim.

**3. Live-demo mechanics were rough for a credibility-sensitive audience.**
Garbled audio, repeated "one second," and over a minute of dead air waiting on trace ingestion. Sri has already watched HCL and Accenture take runs at this problem and come up empty - technical friction during the one live demo undercuts the "this is further along than a home-grown attempt" narrative Tricentis needs here.

**4. The "AI safety" / exploratory red-teaming gap was mentioned in the same breath as the pitch, not resolved.**
David's own framing split the problem into deterministic and non-deterministic testing - matching Sri's mental model exactly - then admitted the deterministic/exploratory side ("try to make the agent fail") isn't built yet. Given how precisely this matches Sri's stated need, a vague "we don't have that latter one" is a bigger miss here than it would be elsewhere.

**5. Coopetition risk was named but not addressed.**
Sri is concurrently tasking HCL and Accenture - both Tricentis partners - to build a competing framework from scratch, and said so plainly. SPEAKER_02 acknowledged it's a "funky situation" but didn't offer a path to defuse it (e.g., partner-channel positioning, or moving fast enough that the in-house build becomes moot).

**6. Access commitment stayed conditional through the whole call.**
Sri asked David three separate times to confirm early/POC access is actually possible; David circled the question back to "is on-prem or cloud a dealbreaker for Meta" each time rather than closing it. This is reasonable caution, but the repetition read as stalling rather than diligence.

---

## Recommended next steps

1. **Get a concrete on-prem feasibility read before the next touchpoint.** Sri called it the number one requirement and an explicit dealbreaker - this needs an architecture/timeline answer, not a "we'll look into it."
2. **Publish one internal timeline slide** (POC, beta, capability at each stage) and have every Tricentis speaker use it verbatim on calls like this.
3. **Propose a concrete bridge for the now-to-POC gap.** Sri is removing self-testing immediately; even a lightweight interim offer (manual review support, priority POC slotting) closes a real risk window.
4. **Fast-track the email follow-up David proposed** - confirm Sri's actual agent stack and telemetry protocol (custom in-house, not LangChain/LangGraph or SAP first-party) before POC scoping, so integration assumptions don't surprise anyone later.
5. **Put a date on the deterministic/exploratory "AI safety" capability.** It maps exactly onto Sri's own framing of the problem; closing that gap turns a hedge into the differentiator it should be.
6. **Turn the individual + collective evaluation answer into a named slide/feature.** It was the one moment Sri said "that makes sense" unprompted - the equivalent of the root-cause moment from the Workday call.
7. **Address the HCL/Accenture coopetition dynamic directly** rather than just naming it - a clear partner-channel story protects this deal from being quietly replaced by an internal build.
