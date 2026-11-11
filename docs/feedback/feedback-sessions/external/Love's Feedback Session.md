# AgentScore Demo Debrief - Love's Feedback Session

**Date of session:** 2026-10-02 (assumed from when the transcript was shared; the transcript carries no date)
**Source:** WebVTT call transcript (speaker-labeled)
**Format:** Short intro, high-level slide and product overview (explicitly not a detailed demo), open Q&A (~15 minutes)
**Analyst:** Lead PM review

## Room composition

- **Tricentis side:** Andrew Demers (presenter/PM, lead PM for Agentic evaluations).
- **Love's side:**
  - **Thomas Cody** - ~5 years at Love's, brought in to implement Tosca (used it at a prior company, so ~7+ years with the tool). Runs Love's Tosca footprint. Both Labs form submitters are on this call.
  - **Jag Mallampati** - senior automation engineer, ~4 years at Love's, worked with Thomas before. Hands-on tester of the Tosca on-prem MCP with Claude on a test box; earlier joined the Tosca Copilot beta.

*(The transcript mis-hears "Love's" as "Lowe's", "Tricentis" as "Tritusa", "AgentScore" as "Agent Square", and Jag as "Jack". This debrief corrects them.)*

---

## Why Love's is here (important context)

Love's is a Tosca shop (on-prem), not an AI-agent shop yet. They evaluated Tosca Cloud earlier this year, and the team did not like it as much as on-prem (missing features, unfamiliar). Their current AI work is the Tosca MCP with Claude on a test machine and the Tosca AI chat they expect to arrive in an on-prem update. When Andrew asked whether they evaluate any AI agents today, Thomas's answer was that it is only the Tosca MCP piece, as part of an upgrade evaluation.

So this is a Tosca-customer curiosity call, not a pull from a live agent-evaluation problem. The Labs form hinted at agentic automation, but nothing on this call showed an agent in production that needs scoring.

---

## What landed

**1. General interest.** Thomas: "it is interesting, though." Jag echoed it: "it's a good, good thing."

**2. Agent-agnostic ingestion.** Thomas asked whether this is only for test agents or any agent on any LLM. Andrew: any agent that can add a trace exporter. Accepted without follow-up.

**3. Container-based deployment as a path.** When on-prem came up, Andrew floated shipping a container the customer runs in their own environment, as long as they configure the LLM used for scoring and judging. Thomas: "that might be an option."

---

## What could have gone better / gaps surfaced

**1. On-prem is the blocker, stated plainly.**
Thomas: "if we don't have an on-prem solution for it, we probably can't do much with it currently," and they would try it if on-prem arrives or if the cloud product improves. Jag: it is useful "when we have it on-prem." Andrew's answers on the call were that AgentScore is cloud only, that on-prem is being explored for another customer, that a beta would be possible, and that he does not know whether GA will include an on-prem option.

**2. Our on-prem answer has now differed across three calls.** Meta was confirmed with engineering (2026-09-23) as a go for self-hosting in the customer's AWS. On the Eaton call: "Tricentis Cloud, on-prem being explored, not fleshed out." Here: "cloud only, exploring for another customer, beta only, unsure about GA." One agreed answer is needed before the next call.

**3. No concrete next step beyond "I'll send info."**
The call had no demo of the product, no trial offer, and no open-beta mention. Andrew offered to follow up with what an on-prem deployment might look like and said waiting for a more robust strategy is fine. That leaves the account parked on our timeline, not theirs.

**4. Unrelated question we could not answer.**
Jag asked when the Tosca AI chat reaches on-prem. Andrew did not know. Not an AgentScore item, but it shows the Tosca on-prem AI roadmap is what this team cares about most; worth passing to the Tosca team.

**5. No current agent to score.**
Without a live agent emitting traces, there is nothing for a trial to measure. The Tosca MCP with Claude is the closest candidate, and nobody checked whether it emits OTel traces.

---

## Follow-ups Andrew committed to

1. **Send a follow-up with more information, including what an on-prem deployment might look like.** Love's will then decide whether to proceed or wait for a more robust on-prem strategy.

---

## Recommended next steps

1. **Send the follow-up with the on-prem/container path written out,** using the single agreed answer from item 2 above, and ask what Love's would need to try a self-hosted beta (infrastructure, LLM for judging, who owns it).
2. **Find out what agent they would score.** Ask Jag whether his Tosca MCP plus Claude setup emits traces; if it does, that is a concrete, low-risk first target for a self-hosted trial.
3. **Treat Love's as a deferred lead tied to on-prem,** not an active trial. Revisit when a self-hosted beta exists.
4. **Pass the Tosca AI chat on-prem timing question to the Tosca team** so Jag gets an answer.
