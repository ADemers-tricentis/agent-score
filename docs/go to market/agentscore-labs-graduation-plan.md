# AgentScore Labs Graduation Plan

> *Working plan for clearing Tricentis Labs' "Ignite → Activate" bar. Source: 2026-09-18 call with a colleague who ran AIDA through this same review. Speaker names in that call were auto-transcribed and may be misspelled - confirm before quoting anyone externally.*

---

## Document Summary

| Field | Details |
| --- | --- |
| **Title** | AgentScore Labs Graduation Plan |
| **Author** | Andrew Demers |
| **Status** | Draft |
| **Last Updated** | 2026-09-18 |
| **Purpose** | Internal - prep for Labs steering committee review (Ignite → Activate) |

---

## The Bar We Have to Clear

Tricentis Labs formalized graduation criteria after leadership challenged why a sibling lab project ("AIDA") wasn't being sold yet, exposing that Labs had no process to judge when a project is ready to leave the lab. A steering/advisory group set four requirements to move from **Ignite** to **Activate** (next stop after that: **Beta**):

1. **Active users** - a real usage signal, not just signups.
2. **A commercial model** - started and validated (packaging/pricing direction, not final).
3. **Steering committee approval.**
4. **ROI materials** - added explicitly because a prior project never clearly stated the problem it solved, only that it existed.

AIDA cleared this bar and was approved to move to Beta. The playbook below is how - translated to AgentScore. This plan works alongside [`one-pager-agentscore-business-case.md`](one-pager-agentscore-business-case.md) - the ICP and use-case-cluster sections there are exactly the artifacts item 2 below produces; this plan is the "how to get there," the business case is the "what we found."

---

## 1. Tier the Pipeline by Real Engagement

Foundation for everything else - raw pipeline count isn't the signal, real usage is.

- [ ] Go through the ~50-company External Interest pipeline and tag each as:
  - **Red** - outreached 2x, no response
  - **Yellow/Purple** - engaged, unclear how real
  - **Green** - actually using it
- [ ] Identify who's actually green today - likely a short list, and that's fine to say plainly rather than round up.

---

## 2. Build the ICP From the Green Accounts' Own Words

Called out on the AIDA call as the single highest-impact material - more than any dashboard or ROI number.

- [ ] Email every green account directly and ask what they're doing with AgentScore.
- [ ] Synthesize their answers (role + use case) into the ICP narrative - feed straight into the [Ideal Customer Profile](one-pager-agentscore-business-case.md#ideal-customer-profile-icp) section of the business case, replacing the current 2-account hypothesis (Wolters Kluwer, Tritusa) with real customer language as it comes in.
- [ ] Make an explicit call on ICP breadth: AgentScore requires an already-instrumented OTel agent, which cuts the addressable Tricentis base hard. Decide and state that narrowing on purpose rather than defaulting to it by accident.

---

## 3. Run a Timed Study for a Defensible Efficiency Claim

- [ ] Design a study (have AI draft the protocol) and give AgentScore to a test group - internal AI engineers, not testers (the AIDA study used testers; AI engineers are the right substitution for AgentScore's audience).
- [ ] Log time-to-complete and findings per person.
- [ ] Feed session logs/transcripts back into AI to compute averages (time per run, steps eliminated) instead of hand-tallying.

---

## 4. Turn the Study Into ROI/Sizing Materials

- [ ] Quantify average run time and the number of manual/human actions AgentScore removes.
- [ ] Convert eliminated actions into an FTE-cost equivalent - this is the ROI number the committee will actually want, not just "it's cheaper." Ties into the [ROI We Can Measure](one-pager-agentscore-business-case.md#the-roi-we-can-measure-and-what-were-still-hypothesizing) hypotheses already drafted in the business case - this study is how we move those from hypothesis to measured.
- [ ] Draft 2-3 concrete credit/pricing packages now, even knowing the committee will argue and revise them - a wrong draft to react to beats no draft, and this doubles as the "commercial model started" deliverable (criterion #2 above).

---

## 5. Package It as an Honest Ask, Not a Pitch

- [ ] Lead with the real number ("zero confirmed active users today") rather than softening it - per the AIDA call, blunt bad news got the committee offering to help; spin got skepticism.
- [ ] Frame the delivery as "here's my draft answer to your four questions, it's probably wrong, tell me how to fix it," not as a finished recommendation.

---

## 6. Follow Up With the Colleague Who Ran AIDA Through This

- [ ] Ask for the specific AIDA artifacts as we hit each step above (the usage dashboard, the study design, the ROI/sizing calc, the red/yellow/green pipeline view) rather than requesting everything at once - they offered to share this way on request.
- [ ] Take them up on the 15-minute demo-script pressure-test before presenting to the committee.

---

## Open Questions

1. Speaker/name attributions from the source call are auto-transcribed and inconsistent (e.g. "Tebow"/"Tibo," "Colwell"/"Cantrell") - confirm real names before any of this is shared outside this doc.
2. We don't yet know what the steering committee's counterpart process owner (Kim, on the Labs side) wants in list form for AgentScore specifically - the AIDA precedent is a strong guess, not a confirmed checklist.
3. This plan depends on criterion #1 (active users) more than any other - most items above can't produce real numbers until at least a handful of pipeline accounts move from yellow to green.

---

## References

* [`one-pager-agentscore-business-case.md`](one-pager-agentscore-business-case.md) - ICP, use-case clusters, and ROI hypotheses this plan is meant to firm up
* `docs/feedback/External Interest.md` - pipeline to tier by engagement (step 1)
* `docs/feedback/Customer Feedback Log.md` - existing session-by-session evidence to cross-check against green-account outreach
